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
  visitorSessionId?: string;
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

type ActionRpcRow = {
  action_id: string;
  referral_id: string | null;
  attribution_token: string | null;
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
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
    `${supabaseUrl}/rest/v1/rlg_businesses` +
      `?select=id,slug,business_name,category` +
      `&slug=eq.${encodeURIComponent(businessSlug)}` +
      `&is_active=eq.true` +
      `&limit=1`,
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
    `${supabaseUrl}/rest/v1/drivers` +
      `?select=id,driver_slug` +
      `&driver_slug=eq.${encodeURIComponent(driverSlug)}` +
      `&status=eq.active` +
      `&limit=1`,
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
        {
          ok: false,
          error: "Invalid action type",
        },
        { status: 400 }
      );
    }

    const businessSlug = cleanText(body.businessSlug, 160);
    const businessName = cleanText(body.businessName, 250);
    const driverSlug = cleanText(body.driverSlug, 160);
    const category = cleanText(body.category, 160);
    const pagePath = cleanText(body.pagePath, 500);
    const visitorSessionId = cleanText(
      body.visitorSessionId,
      160
    );
    const metadata = cleanMetadata(body.metadata);

    const { supabaseUrl, serviceRoleKey } =
      getSupabaseConfig();

    const [business, driver] = await Promise.all([
      fetchBusinessBySlug(
        supabaseUrl,
        serviceRoleKey,
        businessSlug
      ),
      fetchDriverBySlug(
        supabaseUrl,
        serviceRoleKey,
        driverSlug
      ),
    ]);

    /*
     * Server-resolved database identities are authoritative.
     *
     * Client slugs/names remain useful as analytics snapshots when an
     * entity is not found, but they never become trusted financial IDs.
     */
    const rpcPayload = {
      p_business_id: business?.id ?? null,
      p_driver_id: driver?.id ?? null,

      p_driver_slug:
        driver?.driver_slug ?? driverSlug ?? null,

      p_business_slug:
        business?.slug ?? businessSlug ?? null,

      p_business_name:
        business?.business_name ?? businessName ?? null,

      p_category:
        business?.category ?? category ?? null,

      p_action_type: actionType,
      p_page_path: pagePath,
      p_visitor_session_id: visitorSessionId,
      p_metadata: metadata,
    };

    const rpcResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/rlg_record_business_action_with_referral`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rpcPayload),
        cache: "no-store",
      }
    );

    if (!rpcResponse.ok) {
      const message = await rpcResponse
        .text()
        .catch(() => "");

      console.error(
        "[business-actions:rpc]",
        rpcResponse.status,
        message
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Failed to record business action",
        },
        { status: 500 }
      );
    }

    const rows = (await rpcResponse.json()) as ActionRpcRow[];
    const result = rows[0];

    if (!result?.action_id) {
      console.error(
        "[business-actions:rpc] RPC returned no action ID"
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Business action was not confirmed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      actionId: result.action_id,
      referralId: result.referral_id,
      attributionToken: result.attribution_token,
    });
  } catch (error) {
    console.error("[business-actions:post]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected business action error",
      },
      { status: 500 }
    );
  }
}
