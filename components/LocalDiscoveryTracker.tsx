"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type LeadTarget = {
  businessName: string;
  category: string;
};

const SESSION_STORAGE_KEY = "trip_worth_it_local_discovery_session_id";

function createVisitorSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getVisitorSessionId() {
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const next = createVisitorSessionId();
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClickEventType(trackEvent: string | null) {
  if (trackEvent === "category_tap") return "category_tap";
  return "business_click";
}

async function postJson(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "Request failed.");
  }

  return response.json();
}

export default function LocalDiscoveryTracker({
  leadTargets,
}: {
  leadTargets: LeadTarget[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const visitorSessionIdRef = useRef("");
  const [selectedBusiness, setSelectedBusiness] = useState(leadTargets[0]?.businessName || "");
  const [selectedCategory, setSelectedCategory] = useState(leadTargets[0]?.category || "");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const driverSlug = searchParams.get("driver") || "";
  const utmSource = searchParams.get("utm_source") || "";
  const utmMedium = searchParams.get("utm_medium") || "";
  const utmCampaign = searchParams.get("utm_campaign") || "";

  const leadOptions = useMemo(
    () =>
      leadTargets.map((target) => ({
        value: `${target.businessName}|||${target.category}`,
        label: target.businessName,
        category: target.category,
      })),
    [leadTargets]
  );

  useEffect(() => {
    const sessionId = getVisitorSessionId();
    visitorSessionIdRef.current = sessionId;

    if (!driverSlug) return;

    const scanKey = `trip_worth_it_scan_${driverSlug}_${todayKey()}`;
    if (window.localStorage.getItem(scanKey) === sessionId) return;

    window.localStorage.setItem(scanKey, sessionId);

    postJson("/api/local-discovery/events", {
      event_type: "scan",
      driver_slug: driverSlug,
      city: "miami",
      page_path: `${pathname}?${searchParams.toString()}`,
      visitor_session_id: sessionId,
      user_agent: window.navigator.userAgent,
      referrer: document.referrer,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      created_at: new Date().toISOString(),
    }).catch(() => {
      window.localStorage.removeItem(scanKey);
    });
  }, [driverSlug, pathname, searchParams, utmCampaign, utmMedium, utmSource]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trackedElement = target.closest<HTMLElement>("[data-track-event]");
      if (!trackedElement) return;

      const sessionId = visitorSessionIdRef.current || getVisitorSessionId();
      visitorSessionIdRef.current = sessionId;
      const href =
        trackedElement instanceof HTMLAnchorElement
          ? trackedElement.href
          : trackedElement.getAttribute("href") || "";
      const trackEvent = trackedElement.dataset.trackEvent || "";
      const category = trackedElement.dataset.trackCategory || "";
      const businessName = trackedElement.dataset.trackBusiness || "";
      const eventType = getClickEventType(trackEvent);

      if (eventType === "business_click" && !businessName) return;

      postJson("/api/local-discovery/events", {
        event_type: eventType,
        driver_slug: driverSlug,
        category,
        business_name: businessName,
        click_target_href: href,
        city: "miami",
        page_path: `${pathname}?${searchParams.toString()}`,
        visitor_session_id: sessionId,
        created_at: new Date().toISOString(),
      }).catch(() => undefined);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [driverSlug, pathname, searchParams]);

  useEffect(() => {
    const handleLeadTrigger = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const leadElement = target.closest<HTMLElement>("[data-lead-business]");
      if (!leadElement) return;

      setSelectedBusiness(leadElement.dataset.leadBusiness || "");
      setSelectedCategory(leadElement.dataset.leadCategory || "");
    };

    document.addEventListener("click", handleLeadTrigger);
    return () => document.removeEventListener("click", handleLeadTrigger);
  }, []);

  const handleBusinessSelect = (value: string) => {
    const [businessName, category] = value.split("|||");
    setSelectedBusiness(businessName || "");
    setSelectedCategory(category || "");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitStatus("saving");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const sessionId = visitorSessionIdRef.current || getVisitorSessionId();
    visitorSessionIdRef.current = sessionId;

    try {
      await postJson("/api/local-discovery/leads", {
        business_name: selectedBusiness,
        category: selectedCategory,
        customer_name: formData.get("customer_name"),
        customer_phone: formData.get("customer_phone"),
        customer_email: formData.get("customer_email"),
        message: formData.get("message"),
        driver_slug: driverSlug,
        visitor_session_id: sessionId,
        city: "miami",
        created_at: new Date().toISOString(),
      });

      event.currentTarget.reset();
      setSubmitStatus("success");
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not submit your request.");
    }
  };

  return (
    <section
      id="request-info"
      className="mt-12 rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_55px_-34px_rgba(15,23,42,0.55)] sm:p-6"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,1fr)] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            Request info
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Want help with one of these offers?
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Send a quick request and we will route your interest to the right local business during the pilot.
          </p>
          {driverSlug ? (
            <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
              Driver source: {driverSlug}
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Business
            </span>
            <select
              value={`${selectedBusiness}|||${selectedCategory}`}
              onChange={(event) => handleBusinessSelect(event.target.value)}
              className="mt-1 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
            >
              {leadOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Name
              </span>
              <input
                name="customer_name"
                required
                className="mt-1 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Phone
              </span>
              <input
                name="customer_phone"
                required
                inputMode="tel"
                className="mt-1 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Email optional
            </span>
            <input
              name="customer_email"
              type="email"
              className="mt-1 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Message optional
            </span>
            <textarea
              name="message"
              rows={3}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <button
            type="submit"
            disabled={submitStatus === "saving"}
            className="btn-press inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitStatus === "saving" ? "Sending..." : "Request Info"}
          </button>

          {submitStatus === "success" ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              Request sent. We saved your interest for follow-up.
            </p>
          ) : null}
          {submitStatus === "error" ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
