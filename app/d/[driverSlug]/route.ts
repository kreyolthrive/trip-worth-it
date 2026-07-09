import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    driverSlug: string;
  }>;
};

async function trackQrScan(driverSlug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    await fetch(`${baseUrl}/api/pilot-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType: "qr_scan",
        driverSlug,
        pagePath: `/d/${driverSlug}`,
        metadata: {
          source: "driver_redirect_route",
        },
      }),
    });
  } catch {
    // Do not block redirect if tracking fails.
  }
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { driverSlug } = await context.params;

  await trackQrScan(driverSlug);

  const url = new URL(request.url);
  url.pathname = "/miami";
  url.searchParams.set("driver", driverSlug);
  url.searchParams.set("utm_source", "driver_qr");
  url.searchParams.set("utm_medium", "vehicle_qr");
  url.searchParams.set("utm_campaign", "miami_pilot");

  return NextResponse.redirect(url);
}