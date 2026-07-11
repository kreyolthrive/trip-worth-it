import { NextResponse } from "next/server";
import {
  BusinessRecommendationInput,
  rankBusinessRecommendations,
} from "@/lib/recommendations";

type RequestBody = {
  latitude?: number;
  longitude?: number;
  categories?: string[];
  timeIso?: string;
  limit?: number;
  driverSlug?: string;
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

function mapBusiness(row: SupabaseBusinessRow): BusinessRecommendationInput {
  return {
    id: row.slug,
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
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rlg_businesses?select=id,slug,business_name,category,description,address,phone,website,latitude,longitude,rating,localness_score,quality_score,participation_tier,is_verified,is_active&is_active=eq.true`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase businesses fetch failed: ${errorText}`);
  }

  return (await response.json()) as SupabaseBusinessRow[];
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

    return NextResponse.json({
      recommendations,
      meta: {
        algorithmVersion: "rider-local-guide-v1",
        dataSource: "supabase",
        totalCandidates: rows.length,
        returned: recommendations.length,
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