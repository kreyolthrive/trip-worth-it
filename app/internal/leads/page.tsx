import type { Metadata } from "next";
import Link from "next/link";
import { readBetaSignupsFile } from "@/lib/betaSignups";
import { GaugeIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Internal Beta Leads | Trip Worth-It",
  description: "Internal lightweight beta lead review for Trip Worth-It.",
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function InternalLeadsPage() {
  const leads = await readBetaSignupsFile();

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
                Beta leads
              </h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-600">
                Lightweight internal review for Trip Worth-It beta signups. This page is
                intentionally simple and not a full CRM.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/beta"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              View beta page
            </Link>
            <a
              href="/internal/leads/export"
              className="btn-press inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-[14px] font-bold text-white shadow-[0_16px_40px_-24px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Export CSV
            </a>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.4)] sm:p-5">
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                Collected leads
              </h2>
              <p className="mt-1 text-[13px] text-slate-500">
                {leads.length === 1 ? "1 signup" : `${leads.length} signups`} saved in
                local JSON persistence.
              </p>
            </div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Newest first
            </p>
          </div>

          {leads.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-lg font-bold text-slate-900">No beta leads yet.</p>
              <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-slate-500">
                Once drivers submit the beta form, their details and UTM context will
                appear here.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[980px] w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-3">Created</th>
                    <th className="border-b border-slate-200 px-3 py-3">Lead</th>
                    <th className="border-b border-slate-200 px-3 py-3">Driver type</th>
                    <th className="border-b border-slate-200 px-3 py-3">Frustration</th>
                    <th className="border-b border-slate-200 px-3 py-3">Source</th>
                    <th className="border-b border-slate-200 px-3 py-3">UTM</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={`${lead.email}-${lead.createdAt}`} className="align-top">
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] font-medium text-slate-600">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4">
                        <p className="text-[14px] font-bold text-slate-900">{lead.name}</p>
                        <p className="mt-1 text-[13px] text-slate-500">{lead.email}</p>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4">
                        <p className="text-[14px] font-semibold text-slate-800">
                          {lead.primaryPlatform}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-500">
                          {lead.drivingCommitment}
                        </p>
                      </td>
                      <td className="max-w-[260px] border-b border-slate-100 px-3 py-4 text-[13px] leading-6 text-slate-600">
                        {lead.frustration || "Not provided"}
                      </td>
                      <td className="max-w-[260px] border-b border-slate-100 px-3 py-4 text-[13px] leading-6 text-slate-600">
                        <p className="font-semibold text-slate-800">
                          {lead.source || "Not captured"}
                        </p>
                        <p className="mt-1 break-all">{lead.landingPath || "No landing path"}</p>
                        {lead.referrer ? (
                          <p className="mt-1 break-all text-slate-500">Ref: {lead.referrer}</p>
                        ) : null}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-[13px] leading-6 text-slate-600">
                        <p>Source: {lead.utmSource || "-"}</p>
                        <p>Medium: {lead.utmMedium || "-"}</p>
                        <p>Campaign: {lead.utmCampaign || "-"}</p>
                        <p>Content: {lead.utmContent || "-"}</p>
                        <p>Term: {lead.utmTerm || "-"}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
