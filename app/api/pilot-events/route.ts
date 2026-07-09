import { NextResponse } from "next/server";

type PilotEventPayload = {
  eventType?: string;
  driverSlug?: string;
  businessSlug?: string;
  category?: string;
  neighborhood?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
};

const allowedEventTypes = new Set([
  "qr_scan",
  "miami_page_view",
  "category_click",
  "business_click",
  "cta_click",
  "lead_started",
  "lead_submitted",
  "driver_feedback",
  "complaint_reported",
]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: PilotEventPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const eventType = clean(body.eventType);

  if (!eventType || !allowedEventTypes.has(eventType)) {
    return NextResponse.json(
      {
        error:
          "Invalid event type. Use qr_scan, miami_page_view, category_click, business_click, cta_click, lead_started, lead_submitted, driver_feedback, or complaint_reported.",
      },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Pilot event storage is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 }
    );
  }

  const record = {
    event_type: eventType,
    driver_slug: clean(body.driverSlug),
    business_slug: clean(body.businessSlug),
    category: clean(body.category),
    neighborhood: clean(body.neighborhood),
    page_path: clean(body.pagePath),
    referrer: clean(request.headers.get("referer")),
    user_agent: clean(request.headers.get("user-agent")),
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/pilot_events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const errorText = await response.text();

    return NextResponse.json(
      {
        error:
          "Pilot event could not be saved. Confirm the Supabase table exists and environment variables are correct.",
        details: errorText,
      },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json({
    ok: true,
    event: Array.isArray(data) ? data[0] : data,
  });
}