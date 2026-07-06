import type { Metadata } from "next";
import Link from "next/link";
import {
  readLocalDiscoverySnapshot,
  summarizeDriverPerformance,
} from "@/lib/localDiscovery";
import { GaugeIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Internal Local Discovery | Trip Worth-It",
  description: "Internal tracking activity view for the Miami local discovery pilot.",
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white/95 p-4 shadow-[0_14px_40px_-32px_rgba(15,23,42,0.45)]">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

export default async function InternalLocalDiscoveryPage() {
  const { events, leads, storageMode, storageMessage } = await readLocalDiscoverySnapshot();
  const summaries = summarizeDriverPerformance(events, leads);
  const totalScans = events.filter((event) => event.event_type === "scan").length;
  const totalBusinessClicks = events.filter(
    (event) => event.event_type === "business_click"
  ).length;
  const totalCategoryTaps = events.filter((event) => event.event_type === "category_tap").length;
  const storageLabel =
    storageMode === "supabase"
      ? "Supabase connected"
      : storageMode === "json_file"
        ? "JSON file fallback"
        : "Demo mode";

  return (
    <main className="min-h-screen bg-[#eef1f7] text-slate-900">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-white/75 bg-white/90 p-5 shadow-[0_18px_55px_-32px_rgba(15,23,42,0.45)] sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-slate-900 text-cyan-400">
              <GaugeIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700">
                Internal
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                Local discovery tracking
              </h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-600">
                Lightweight activity view for the Miami pilot. This is not a driver dashboard,
                payout system, or CRM.
              </p>
            </div>
          </div>

          <Link
            href="/miami?driver=florine&utm_source=driver_qr&utm_medium=vehicle_qr&utm_campaign=miami_pilot"
            className="btn-press inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-[14px] font-bold text-white shadow-[0_16px_40px_-24px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Test Miami QR flow
          </Link>
        </header>

        <section className="mt-6 rounded-[2rem] border border-cyan-200 bg-cyan-50 p-5 text-cyan-950">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black">{storageLabel}</p>
              <p className="mt-2 text-sm leading-6">{storageMessage}</p>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-800">
              {storageMode}
            </span>
          </div>
          {storageMode !== "supabase" ? (
            <p className="mt-3 text-sm leading-6">
              Tracking endpoints are active. Persistent production storage needs Supabase env vars and the SQL schema applied.
            </p>
          ) : null}
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total scans" value={totalScans} />
          <StatCard label="Business clicks" value={totalBusinessClicks} />
          <StatCard label="Category taps" value={totalCategoryTaps} />
          <StatCard label="Total leads" value={leads.length} />
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.4)] sm:p-5">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Driver performance summary
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Structured for future driver transparency and payout history.
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[920px] w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-3">Driver</th>
                  <th className="border-b border-slate-200 px-3 py-3">Scans</th>
                  <th className="border-b border-slate-200 px-3 py-3">Business clicks</th>
                  <th className="border-b border-slate-200 px-3 py-3">Category taps</th>
                  <th className="border-b border-slate-200 px-3 py-3">Leads</th>
                  <th className="border-b border-slate-200 px-3 py-3">Pending conversions</th>
                  <th className="border-b border-slate-200 px-3 py-3">Approved conversions</th>
                  <th className="border-b border-slate-200 px-3 py-3">Conversion value</th>
                  <th className="border-b border-slate-200 px-3 py-3">Estimated payout</th>
                  <th className="border-b border-slate-200 px-3 py-3">Approved payout</th>
                </tr>
              </thead>
              <tbody>
                {summaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-sm font-semibold text-slate-500">
                      No driver activity yet.
                    </td>
                  </tr>
                ) : (
                  summaries.map((summary) => (
                    <tr key={summary.driver_slug} className="align-top">
                      <td className="border-b border-slate-100 px-3 py-4 text-[14px] font-black text-slate-900">
                        {summary.driver_slug}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] font-semibold text-slate-700">
                        {summary.scans}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] font-semibold text-slate-700">
                        {summary.business_clicks}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] font-semibold text-slate-700">
                        {summary.category_taps}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] font-semibold text-slate-700">
                        {summary.leads}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] font-semibold text-slate-700">
                        {summary.pending_conversions}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] font-semibold text-slate-700">
                        {summary.approved_conversions}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] font-semibold text-slate-700">
                        ${summary.conversion_value.toFixed(2)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] font-semibold text-slate-700">
                        ${summary.estimated_payout.toFixed(2)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] font-semibold text-slate-700">
                        ${summary.approved_payout.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.4)] sm:p-5">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Activity by driver
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Separate event and lead counts grouped by driver_slug.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {summaries.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-slate-500 md:col-span-2 lg:col-span-3">
                No driver activity yet.
              </p>
            ) : (
              summaries.map((summary) => (
                <div key={summary.driver_slug} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-base font-black text-slate-900">{summary.driver_slug}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Events: {summary.scans + summary.business_clicks + summary.category_taps}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Leads: {summary.leads}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.4)] sm:p-5">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Recent events</h2>
            <div className="mt-4 space-y-3">
              {events.slice(0, 12).map((event) => (
                <div
                  key={`${event.event_type}-${event.created_at}-${event.visitor_session_id}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-900">{event.event_type}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatDate(event.created_at)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Driver: {event.driver_slug || "unassigned"} · Category: {event.category || "-"} · Business: {event.business_name || "-"}
                  </p>
                </div>
              ))}
              {events.length === 0 ? (
                <p className="py-8 text-center text-sm font-semibold text-slate-500">No events yet.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.4)] sm:p-5">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Recent leads</h2>
            <div className="mt-4 space-y-3">
              {leads.slice(0, 12).map((lead) => (
                <div
                  key={`${lead.business_name}-${lead.created_at}-${lead.customer_phone}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-900">{lead.business_name}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatDate(lead.created_at)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {lead.customer_name} · {lead.customer_phone} · Driver: {lead.driver_slug || "unassigned"}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
                    {lead.lead_status} · {lead.conversion_status}
                  </p>
                </div>
              ))}
              {leads.length === 0 ? (
                <p className="py-8 text-center text-sm font-semibold text-slate-500">No leads yet.</p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
