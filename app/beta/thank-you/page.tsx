import type { Metadata } from "next";
import Link from "next/link";
import BetaThankYouFeedback from "@/components/BetaThankYouFeedback";
import { GaugeIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "You're on the beta list | Trip Worth-It",
  description: "Thanks for joining the Trip Worth-It beta list.",
};

export default function BetaThankYouPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#eef1f7] text-slate-900">
      <div className="pointer-events-none absolute inset-0 panel-grid opacity-35" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-cyan-300/25 blur-[110px]" />

      <div className="relative mx-auto flex w-full max-w-[860px] flex-col gap-8 px-4 pb-18 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-24">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-cyan-400 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.8)]">
              <GaugeIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Trip Worth-It
              </p>
              <p className="text-sm font-semibold text-slate-900">
                The AI Financial Co-Pilot for Gig Drivers
              </p>
            </div>
          </div>
          <Link
            href="/beta"
            className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[13px] font-semibold text-slate-700 backdrop-blur transition hover:border-slate-200 hover:text-slate-900"
          >
            Back to beta
          </Link>
        </header>

        <BetaThankYouFeedback />
      </div>
    </main>
  );
}
