"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

type BusinessActionPayload = {
  actionType: string;
  businessSlug?: string;
  businessName?: string;
  category?: string;
  driverSlug?: string;
  pagePath: string;
  metadata: {
    href?: string;
    label?: string;
    source: string;
  };
};

function getClickableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;

  return target.closest<HTMLElement>("[data-business-action]");
}

export default function BusinessActionTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = getClickableTarget(event.target);

      if (!target) return;

      const actionType = target.dataset.businessAction;

      if (!actionType) return;

      const driverSlug =
        searchParams.get("driver") ?? target.dataset.driverSlug ?? undefined;

      const payload: BusinessActionPayload = {
        actionType,
        businessSlug: target.dataset.businessSlug,
        businessName:
          target.dataset.businessName ?? target.dataset.trackBusiness ?? undefined,
        category:
          target.dataset.businessCategory ??
          target.dataset.trackCategory ??
          undefined,
        driverSlug,
        pagePath: `${window.location.pathname}${window.location.search}`,
        metadata: {
          href:
            target instanceof HTMLAnchorElement
              ? target.href
              : target.getAttribute("href") ?? undefined,
          label: target.textContent?.trim().slice(0, 120),
          source: "miami_page",
        },
      };

      void fetch("/api/business-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch((error) => {
        console.error("[business-action-tracker]", error);
      });
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [searchParams]);

  return null;
}