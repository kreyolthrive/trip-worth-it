"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type PilotPageTrackerProps = {
  eventType: "miami_page_view";
  neighborhood?: string;
};

export default function PilotPageTracker({
  eventType,
  neighborhood = "Miami",
}: PilotPageTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Read values from searchParams, not the object itself
    const driverSlug = searchParams?.get("driver") ?? "";
    const utmSource = searchParams?.get("utm_source") ?? "";
    const utmMedium = searchParams?.get("utm_medium") ?? "";
    const utmCampaign = searchParams?.get("utm_campaign") ?? "";

    // Only send tracking after router + params are available
    if (!pathname) return;

    const payload = {
      eventType,
      driverSlug,
      neighborhood,
      pagePath: pathname,
      metadata: {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      },
    };

    fetch("/api/pilot-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Tracking should never break the page.
    });
  }, [eventType, neighborhood, pathname, searchParams]);

  return null;
}