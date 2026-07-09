import { NextResponse } from "next/server";

type BusinessIntakePayload = {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  category?: string;
  description?: string;
  website?: string;
  addressOrServiceArea?: string;
  offer?: string;
  preferredCta?: string;
  logoOrImageUrl?: string;
  notes?: string;
  consent?: boolean;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: BusinessIntakePayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const businessName = clean(body.businessName);
  const ownerName = clean(body.ownerName);
  const phone = clean(body.phone);
  const email = clean(body.email);
  const category = clean(body.category);
  const description = clean(body.description);
  const website = clean(body.website);
  const addressOrServiceArea = clean(body.addressOrServiceArea);
  const offer = clean(body.offer);
  const preferredCta = clean(body.preferredCta);
  const logoOrImageUrl = clean(body.logoOrImageUrl);
  const notes = clean(body.notes);

  if (!businessName || !ownerName || !category || !description || !preferredCta) {
    return NextResponse.json(
      {
        error:
          "Business name, owner name, category, description, and CTA are required.",
      },
      { status: 400 }
    );
  }

  if (!phone && !email) {
    return NextResponse.json(
      { error: "Please provide at least a phone number or an email address." },
      { status: 400 }
    );
  }

  if (!body.consent) {
    return NextResponse.json(
      { error: "Consent is required to submit the business for the pilot." },
      { status: 400 }
    );
  }

  if (!isValidUrl(website)) {
    return NextResponse.json(
      { error: "Website must be a valid http or https URL." },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Business intake storage is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 }
    );
  }

  const record = {
    business_name: businessName,
    owner_name: ownerName,
    phone,
    email,
    category,
    business_description: description,
    website,
    address_or_service_area: addressOrServiceArea,
    offer,
    preferred_cta: preferredCta,
    logo_or_image_url: logoOrImageUrl,
    notes,
    consent_to_feature: true,
    source: "business_pilot_page",
    status: "new",
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/business_intake_leads`, {
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
          "Submission could not be saved. Confirm the Supabase table exists and environment variables are correct.",
        details: errorText,
      },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json({
    ok: true,
    intake: Array.isArray(data) ? data[0] : data,
  });
}