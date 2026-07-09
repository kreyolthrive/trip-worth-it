"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const eventMap: Record<string, string> = {
  category_tap: "category_click",
  featured_business_cta: "cta_click",
  listing_business_cta: "cta_click",
  lead_intent: "lead_started",
  hero_primary_cta: "category_click",
  hero_featured_cta: "category_click",
  hero_category_cta: "category_click",
  back_to_categories: "category_click",
  visitor_block_cta: "category_click",
};

export default function PilotClickTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const trackedElement = target.closest<HTMLElement>("[data-track-event]");

      if (!trackedElement) return;

      const rawEvent = trackedElement.dataset.trackEvent || "";
      const eventType = eventMap[rawEvent];

      if (!eventType) return;

      const driverSlug = searchParams.get("driver") || "";
      const category = trackedElement.dataset.trackCategory || "";
      const businessName = trackedElement.dataset.trackBusiness || "";
      const href =
        trackedElement instanceof HTMLAnchorElement
          ? trackedElement.href
          : trackedElement.getAttribute("href") || "";

      fetch("/api/pilot-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType,
          driverSlug,
          businessSlug: businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
          category,
          neighborhood: "Miami",
          pagePath: pathname,
          metadata: {
            raw_event: rawEvent,
            business_name: businessName,
            href,
            utm_source: searchParams.get("utm_source") || "",
            utm_medium: searchParams.get("utm_medium") || "",
            utm_campaign: searchParams.get("utm_campaign") || "",
          },
        }),
      }).catch(() => {
        // Tracking should never break the page.
      });
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [pathname, searchParams]);

  return null;
}