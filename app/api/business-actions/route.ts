import { NextResponse } from "next/server";

export const runtime = "nodejs";

const allowedActionTypes = new Set([
  "business_click",
  "business_view",
  "call_click",
  "directions_click",
  "website_click",
  "request_info_click",
  "offer_click",
  "save_click",
]);

type RequestBody = {
  businessSlug?: string;
  businessName?: string;
  driverSlug?: string;
  category?: string;
  actionType?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
};

type BusinessRow = {
  id: string;
  slug: string;
  business_name: string;
  category: string | null;
};

type DriverRow = {
  id: string;
  driver_slug: string;
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey,
  };
}

function cleanText(value: unknown, maxLength = 250) {
  if (typeof value !== "string") return null;

  const cleaned = value.trim();

  if (!cleaned) return null;

  return cleaned.slice(0, maxLength);
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

async function fetchBusinessBySlug(
  supabaseUrl: string,
  serviceRoleKey: string,
  businessSlug: string | null
) {
  if (!businessSlug) return null;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rlg_businesses?select=id,slug,business_name,category&slug=eq.${encodeURIComponent(
      businessSlug
    )}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return null;

  const rows = (await response.json()) as BusinessRow[];

  return rows[0] ?? null;
}

async function fetchDriverBySlug(
  supabaseUrl: string,
  serviceRoleKey: string,
  driverSlug: string | null
) {
  if (!driverSlug) return null;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/drivers?select=id,driver_slug&driver_slug=eq.${encodeURIComponent(
      driverSlug
    )}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return null;

  const rows = (await response.json()) as DriverRow[];

  return rows[0] ?? null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const actionType = cleanText(body.actionType, 80);

    if (!actionType || !allowedActionTypes.has(actionType)) {
      return NextResponse.json(
        { ok: false, error: "Invalid action type" },
        { status: 400 }
      );
    }

    const businessSlug = cleanText(body.businessSlug, 160);
    const businessName = cleanText(body.businessName, 250);
    const driverSlug = cleanText(body.driverSlug, 160);
    const category = cleanText(body.category, 160);
    const pagePath = cleanText(body.pagePath, 500);
    const metadata = cleanMetadata(body.metadata);

    const { supabaseUrl, serviceRoleKey } = getSupabaseConfig();

    const [business, driver] = await Promise.all([
      fetchBusinessBySlug(supabaseUrl, serviceRoleKey, businessSlug),
      fetchDriverBySlug(supabaseUrl, serviceRoleKey, driverSlug),
    ]);

    const insertPayload = {
      business_id: business?.id ?? null,
      driver_id: driver?.id ?? null,

      driver_slug: driverSlug,
      business_slug: businessSlug ?? business?.slug ?? null,
      business_name: businessName ?? business?.business_name ?? null,
      category: category ?? business?.category ?? null,

      action_type: actionType,
      page_path: pagePath,
      metadata,
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/business_actions`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(insertPayload),
      cache: "no-store",
    });

    if (!insertResponse.ok) {
      const message = await insertResponse.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: "Failed to record business action", message },
        { status: 500 }
      );
    }

    const insertedRows = (await insertResponse.json()) as { id: string }[];

    return NextResponse.json({
      ok: true,
      actionId: insertedRows[0]?.id ?? null,
    });
  } catch (error) {
    console.error("[business-actions:post]", error);

    return NextResponse.json(
      { ok: false, error: "Unexpected business action error" },
      { status: 500 }
    );
  }
}