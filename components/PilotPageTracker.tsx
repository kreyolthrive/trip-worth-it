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
    const driverSlug = searchParams.get("driver") || "";

    fetch("/api/pilot-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType,
        driverSlug,
        neighborhood,
        pagePath: pathname,
        metadata: {
          utm_source: searchParams.get("utm_source") || "",
          utm_medium: searchParams.get("utm_medium") || "",
          utm_campaign: searchParams.get("utm_campaign") || "",
        },
      }),
    }).catch(() => {
      // Tracking should never break the page.
    });
  }, [eventType, neighborhood, pathname, searchParams]);

  return null;
}