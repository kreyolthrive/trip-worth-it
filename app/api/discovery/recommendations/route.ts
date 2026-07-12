import { NextResponse } from "next/server";
import {
  BusinessRecommendationInput,
  ScoredBusinessRecommendation,
  rankBusinessRecommendations,
} from "@/lib/recommendations";

const ALGORITHM_VERSION = "rider-local-guide-v1";

type RequestBody = {
  latitude?: number;
  longitude?: number;
  categories?: string[];
  timeIso?: string;
  limit?: number;
  driverSlug?: string;
  pagePath?: string;
};

type SupabaseBusinessRow = {
  id: string;
  slug: string;
  business_name: string;
  category: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  localness_score: number | null;
  quality_score: number | null;
  participation_tier: "free" | "affordable" | "boosted" | "premium" | null;
  is_verified: boolean | null;
  is_active: boolean | null;
};

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseHeaders() {
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

function assertSupabaseConfig() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }
}

function mapBusiness(row: SupabaseBusinessRow): BusinessRecommendationInput {
  return {
    id: row.slug,
    databaseId: row.id,
    name: row.business_name,
    category: row.category,
    description: row.description,
    address: row.address,
    phone: row.phone,
    website: row.website,
    latitude: row.latitude,
    longitude: row.longitude,
    rating: row.rating,
    localnessScore: row.localness_score,
    qualityScore: row.quality_score,
    participationTier: row.participation_tier,
    isVerified: row.is_verified,
    isActive: row.is_active,
  };
}

async function fetchBusinessesFromSupabase() {
  assertSupabaseConfig();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rlg_businesses?select=id,slug,business_name,category,description,address,phone,website,latitude,longitude,rating,localness_score,quality_score,participation_tier,is_verified,is_active&is_active=eq.true`,
    {
      headers: getSupabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase businesses fetch failed: ${errorText}`);
  }

  return (await response.json()) as SupabaseBusinessRow[];
}

async function fetchDriverId(driverSlug?: string) {
  if (!driverSlug) return null;

  assertSupabaseConfig();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/drivers?select=id&driver_slug=eq.${encodeURIComponent(
      driverSlug
    )}&limit=1`,
    {
      headers: getSupabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error("Driver lookup failed:", await response.text());
    return null;
  }

  const rows = (await response.json()) as { id: string }[];

  return rows[0]?.id ?? null;
}

async function logBusinessImpressions({
  recommendations,
  driverSlug,
  pagePath,
}: {
  recommendations: ScoredBusinessRecommendation[];
  driverSlug?: string;
  pagePath?: string;
}) {
  if (!recommendations.length) return;

  assertSupabaseConfig();

  const driverId = await fetchDriverId(driverSlug);

  const rows = recommendations.map((business) => ({
    business_id: business.databaseId ?? null,
    driver_id: driverId,
    driver_slug: driverSlug ?? null,
    business_slug: business.id,
    category: business.category,
    page_path: pagePath ?? "/api/discovery/recommendations",
    recommendation_score: business.score,
    algorithm_version: ALGORITHM_VERSION,
    metadata: {
      distanceMeters: business.distanceMeters,
      distanceScore: business.distanceScore,
      ratingScore: business.ratingScore,
      localnessScore: business.localnessScoreFinal,
      qualityScore: business.qualityScoreFinal,
      timeRelevanceScore: business.timeRelevanceScore,
      paidBoostScore: business.paidBoostScore,
      participationTier: business.participationTier ?? "free",
    },
  }));

  const response = await fetch(`${supabaseUrl}/rest/v1/business_impressions`, {
    method: "POST",
    headers: {
      ...getSupabaseHeaders(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    console.error("Business impression logging failed:", await response.text());
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (
      typeof body.latitude !== "number" ||
      typeof body.longitude !== "number"
    ) {
      return NextResponse.json(
        { error: "latitude and longitude are required." },
        { status: 400 }
      );
    }

    const rows = await fetchBusinessesFromSupabase();
    const businesses = rows.map(mapBusiness);

    const recommendations = rankBusinessRecommendations(businesses, {
      latitude: body.latitude,
      longitude: body.longitude,
      categories: body.categories,
      timeIso: body.timeIso ?? new Date().toISOString(),
      limit: body.limit ?? 10,
      maxDistanceMeters: 8000,
    });

    await logBusinessImpressions({
      recommendations,
      driverSlug: body.driverSlug,
      pagePath: body.pagePath,
    });

    return NextResponse.json({
      recommendations,
      meta: {
        algorithmVersion: ALGORITHM_VERSION,
        dataSource: "supabase",
        totalCandidates: rows.length,
        returned: recommendations.length,
        impressionsLogged: recommendations.length,
        driverSlug: body.driverSlug ?? null,
        fairnessRule:
          "When enough qualified businesses are available, at least 60% of recommendations should come from free or affordable tiers.",
      },
    });
  } catch (error) {
    console.error("Recommendation API error:", error);

    return NextResponse.json(
      { error: "Unable to generate recommendations." },
      { status: 500 }
    );
  }
}