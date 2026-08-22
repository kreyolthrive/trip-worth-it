export const runtime = "nodejs";

type RequestBody = {
  submission_token?: string;
  attribution_token?: string;

  business_slug?: string;
  business_name?: string;
  category?: string;

  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  message?: string;

  driver_slug?: string;
  visitor_session_id?: string;
  city?: string;

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

type QualifiedLeadResult = {
  lead_id: string;
  referral_id: string | null;
  attribution_token: string | null;
  referral_status: string | null;
  attributed: boolean;
  replayed: boolean;
};

type MonetizationCaptureResult = {
  event_id: string | null;
  event_status: string;
  decision_code: string;
  replayed: boolean;
};

function jsonError(message: string, status = 400) {
  return Response.json(
    {
      ok: false,
      error: message,
    },
    { status }
  );
}

function cleanText(
  value: unknown,
  maxLength: number
) {
  if (typeof value !== "string") return null;

  const cleaned = value.trim();

  if (!cleaned) return null;

  return cleaned.slice(0, maxLength);
}

function cleanEmail(value: unknown) {
  const email = cleanText(value, 254);

  if (!email) return null;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email.toLowerCase()
    : null;
}

function cleanMetadata(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as Record<string, unknown>;
}

function cleanUuid(value: unknown) {
  const text = cleanText(value, 80);

  if (!text) return null;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    text
  )
    ? text
    : null;
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function getHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

async function fetchBusiness(
  supabaseUrl: string,
  serviceRoleKey: string,
  slug: string
) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rlg_businesses` +
      `?select=id,slug,business_name,category` +
      `&slug=eq.${encodeURIComponent(slug)}` +
      `&is_active=eq.true` +
      `&limit=1`,
    {
      headers: getHeaders(serviceRoleKey),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const details = await response
      .text()
      .catch(() => "");

    console.error(
      "[qualified-lead:business-lookup]",
      response.status,
      details
    );

    throw new Error(
      "RLG business lookup failed"
    );
  }

  const rows = (await response.json()) as BusinessRow[];

  return rows[0] ?? null;
}

async function fetchDriver(
  supabaseUrl: string,
  serviceRoleKey: string,
  slug: string | null
) {
  if (!slug) return null;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/drivers` +
      `?select=id,driver_slug` +
      `&driver_slug=eq.${encodeURIComponent(slug)}` +
      `&status=eq.active` +
      `&limit=1`,
    {
      headers: getHeaders(serviceRoleKey),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const details = await response
      .text()
      .catch(() => "");

    console.error(
      "[qualified-lead:driver-lookup]",
      response.status,
      details
    );

    throw new Error(
      "RLG driver lookup failed"
    );
  }

  const rows = (await response.json()) as DriverRow[];

  return rows[0] ?? null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const submissionToken = cleanUuid(
      body.submission_token
    );

    const attributionToken = cleanUuid(
      body.attribution_token
    );

    const businessSlug = cleanText(
      body.business_slug,
      160
    );

    const businessName = cleanText(
      body.business_name,
      160
    );

    const category = cleanText(body.category, 120);

    const customerName = cleanText(
      body.customer_name,
      120
    );

    const customerPhone = cleanText(
      body.customer_phone,
      40
    );

    const customerEmail = cleanEmail(
      body.customer_email
    );

    const message = cleanText(body.message, 800);

    const requestedDriverSlug = cleanText(
      body.driver_slug,
      80
    );

    const visitorSessionId = cleanText(
      body.visitor_session_id,
      120
    );

    const metadata = cleanMetadata(body.metadata);

    if (!submissionToken) {
      return jsonError(
        "A valid submission token is required."
      );
    }

    if (
      !businessSlug ||
      !businessName ||
      !category ||
      !customerName ||
      !customerPhone ||
      customerPhone.length < 7
    ) {
      return jsonError(
        "Enter your name, phone number, and the business you want help with."
      );
    }

    const { supabaseUrl, serviceRoleKey } =
      getSupabaseConfig();

    const [business, driver] = await Promise.all([
      fetchBusiness(
        supabaseUrl,
        serviceRoleKey,
        businessSlug
      ),
      fetchDriver(
        supabaseUrl,
        serviceRoleKey,
        requestedDriverSlug
      ),
    ]);

    /*
     * Never trust browser-supplied financial identity.
     *
     * If the business resolves, canonical database fields win.
     * If it does not resolve, the rider lead is still stored but
     * receives no financial attribution.
     */
    const canonicalBusinessSlug =
      business?.slug ?? businessSlug;

    const canonicalBusinessName =
      business?.business_name ?? businessName;

    const canonicalCategory =
      business?.category ?? category;

    const rpcPayload = {
      p_submission_token: submissionToken,
      p_attribution_token: attributionToken,

      p_business_id: business?.id ?? null,
      p_driver_id: driver?.id ?? null,

      p_business_slug: canonicalBusinessSlug,
      p_business_name: canonicalBusinessName,
      p_category: canonicalCategory,

      p_driver_slug:
        driver?.driver_slug ?? null,

      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_customer_email: customerEmail,
      p_message: message,

      p_visitor_session_id: visitorSessionId,
      p_city: "miami",

      p_metadata: {
        ...metadata,

        requested_driver_slug:
          requestedDriverSlug,

        business_resolution:
          business ? "resolved" : "unresolved",

        driver_resolution:
          driver ? "resolved" : "unresolved",
      },
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/rlg_submit_qualified_lead`,
      {
        method: "POST",
        headers: getHeaders(serviceRoleKey),
        body: JSON.stringify(rpcPayload),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const details = await response
        .text()
        .catch(() => "");

      console.error(
        "[qualified-lead:rpc]",
        response.status,
        details
      );

      return jsonError(
        "We could not save your request. Please try again.",
        500
      );
    }

    const rows =
      (await response.json()) as QualifiedLeadResult[];

    const result = rows[0];

    if (!result?.lead_id) {
      console.error(
        "[qualified-lead:rpc] missing lead ID"
      );

      return jsonError(
        "Your request could not be confirmed.",
        500
      );
    }

    /*
     * Lead persistence is the customer-facing transaction boundary.
     *
     * Monetization capture happens only AFTER the durable lead RPC
     * succeeds. Accounting failure must never roll back or disguise
     * a legitimate rider request.
     *
     * The capture RPC is idempotent, so failed/missing events can
     * also be reconciled safely later.
     */
    try {
      const captureResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/rlg_capture_qualified_lead_monetization_event`,
        {
          method: "POST",
          headers: getHeaders(serviceRoleKey),
          body: JSON.stringify({
            p_lead_id: result.lead_id,
          }),
          cache: "no-store",
        }
      );

      if (!captureResponse.ok) {
        const details = await captureResponse
          .text()
          .catch(() => "");

        console.error(
          "[qualified-lead:monetization-capture]",
          captureResponse.status,
          details
        );
      } else {
        const captureRows =
          (await captureResponse.json()) as
            MonetizationCaptureResult[];

        const captureResult = captureRows[0];

        /*
         * Only a pending billable event needs processing.
         *
         * - skipped: no accounting should be created
         * - processed: replay; accounting already exists
         * - pending: create transaction + ledger entries
         *
         * Processing remains best-effort. Any failure here occurs
         * after the durable rider lead was successfully stored.
         */
        if (
          captureResult?.event_id &&
          captureResult.event_status === "pending"
        ) {
          const processResponse = await fetch(
            `${supabaseUrl}/rest/v1/rpc/rlg_process_monetization_event`,
            {
              method: "POST",
              headers: getHeaders(serviceRoleKey),
              body: JSON.stringify({
                p_event_id: captureResult.event_id,
              }),
              cache: "no-store",
            }
          );

          if (!processResponse.ok) {
            const details = await processResponse
              .text()
              .catch(() => "");

            console.error(
              "[qualified-lead:monetization-process]",
              processResponse.status,
              details
            );
          }
        }
      }
    } catch (captureError) {
      console.error(
        "[qualified-lead:monetization]",
        captureError
      );
    }

    return Response.json({
      ok: true,
      mode: "supabase",

      leadId: result.lead_id,
      attributed: result.attributed,
      replayed: result.replayed,
    });
  } catch (error) {
    console.error(
      "[local-discovery:lead]",
      error
    );

    return jsonError(
      "We could not save your request. Please try again.",
      500
    );
  }
}
