import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import BetaSignupForm from "@/components/BetaSignupForm";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  DollarIcon,
  GaugeIcon,
  RouteIcon,
  SparkIcon,
  TargetIcon,
} from "@/components/ui/Icons";

const problemPoints = [
  "accept weak rides or deliveries",
  "waste time on low-value trips",
  "see gross payout instead of real usable income",
  "under-save for taxes, repairs, and emergencies",
  "work hard without a clear financial system",
];

const solutionPoints = [
  "decide which trips are worth taking",
  "understand what they are really keeping",
  "reserve money for taxes, repairs, and emergencies",
  "plan toward weekly targets and savings goals",
];

const decisionChain = [
  "trip decision",
  "usable income",
  "reserve planning",
  "goal progress",
];

const aiSignals = [
  { label: "Payout", Icon: DollarIcon },
  { label: "Pickup distance", Icon: RouteIcon },
  { label: "Trip distance", Icon: GaugeIcon },
  { label: "Estimated time", Icon: ClockIcon },
  { label: "Financial impact", Icon: TargetIcon },
];

export const metadata: Metadata = {
  title: "Trip Worth-It Beta",
  description:
    "Join the Trip Worth-It beta and help shape a mobile-first decision tool for gig drivers.",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-700">
      {children}
    </p>
  );
}

export default function BetaPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#eef1f7] text-slate-900">
      <div className="pointer-events-none absolute inset-0 panel-grid opacity-35" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-300/25 blur-[110px]" />
      <div className="pointer-events-none absolute right-[-8rem] top-[20rem] h-[24rem] w-[24rem] rounded-full bg-emerald-200/30 blur-[120px]" />

      <div className="relative mx-auto flex w-full max-w-[1160px] flex-col gap-10 px-4 pb-18 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-24">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-cyan-400 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.8)]">
              <GaugeIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Trip Worth-It
              </p>
              <p className="text-sm font-semibold text-slate-900">Beta access</p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[13px] font-semibold text-slate-700 backdrop-blur transition hover:border-slate-200 hover:text-slate-900"
          >
            View product demo
          </Link>
        </header>

        <section className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,420px)] lg:gap-10">
          <div className="rounded-[2.5rem] border border-white/75 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.95))] px-6 py-8 text-white shadow-[0_28px_70px_-28px_rgba(15,23,42,0.7)] sm:px-8 sm:py-10">
            <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-cyan-300">
              Trip Worth-It
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              The AI Financial Co-Pilot for Gig Drivers
            </p>
            <h1 className="mt-4 max-w-3xl text-[2.6rem] font-black leading-[0.98] tracking-tight sm:text-[3.5rem]">
              Know if a trip is worth it before it wastes your time.
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-slate-300 sm:text-[17px]">
              Trip Worth-It helps gig drivers see real trip value, understand what
              income is really usable, and plan toward taxes, repairs, and goals.
            </p>
            <p className="mt-3 text-[14px] font-bold text-cyan-300">
              Know what to take. Know what to keep. Know what to save.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#join-beta"
                className="btn-press inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3.5 text-[15px] font-bold text-slate-950 shadow-[0_18px_40px_-24px_rgba(34,211,238,0.9)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
              >
                Join the Beta
              </a>
              <p className="text-[13px] font-semibold text-slate-300">
                Built for Uber, Lyft, Uber Eats, DoorDash, and multi-app drivers.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  Verdict
                </p>
                <p className="mt-2 text-xl font-bold text-white">Take it or skip it</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  Net summary
                </p>
                <p className="mt-2 text-xl font-bold text-white">What you really keep</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  Planning
                </p>
                <p className="mt-2 text-xl font-bold text-white">Weekly targets and reserves</p>
              </div>
            </div>
          </div>

          <div className="card-enter rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-[0_22px_60px_-30px_rgba(15,23,42,0.45)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700">
                  Working beta preview
                </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                  Real trip value, before you accept
                </h2>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                Beta
              </div>
            </div>

            <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-inner">
              <div className="flex items-center justify-between text-[12px] text-slate-400">
                <span>Trip Verdict</span>
                <span>Offer: $11.25</span>
              </div>
              <div className="mt-4 rounded-[1.4rem] border border-emerald-400/30 bg-emerald-400/10 px-4 py-4">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-[13px] font-bold uppercase tracking-[0.16em]">
                    Worth taking
                  </span>
                </div>
                <p className="mt-3 text-3xl font-black text-white">$18.90/hr net</p>
                <p className="mt-1 text-[13px] text-slate-300">
                  Solid return after mileage cost and reserve planning.
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Pickup
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">2.1 miles</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Savings buckets
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">$2.36 reserved</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Beta value promise
              </p>
              <p className="mt-2 text-[14px] leading-6 text-slate-700">
                Early drivers can test a focused flow for trip verdicts, screenshot-based
                offer review, savings reserves, and weekly planning in one place.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_16px_45px_-28px_rgba(15,23,42,0.35)] sm:p-8">
            <SectionLabel>Problem</SectionLabel>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Gig work moves fast. Financial clarity usually doesn&apos;t.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600">
              Drivers often have to make quick decisions with incomplete financial
              context.
            </p>
            <div className="mt-6 space-y-3">
              {problemPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-[1.4rem] border border-slate-100 bg-slate-50 px-4 py-3.5"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
                  <p className="text-[14px] leading-6 text-slate-700">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_16px_45px_-28px_rgba(15,23,42,0.35)] sm:p-8">
            <SectionLabel>Solution</SectionLabel>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Trip Worth-It helps drivers make better money decisions.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600">
              The app connects each trip choice to what drivers actually keep and what
              they need to reserve.
            </p>
            <div className="mt-6 space-y-3">
              {solutionPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-[1.4rem] border border-cyan-100 bg-cyan-50/65 px-4 py-3.5"
                >
                  <CheckIcon className="mt-0.5 h-4 w-4 flex-none text-cyan-700" />
                  <p className="text-[14px] leading-6 text-slate-700">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-[2.25rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]">
          <div>
            <SectionLabel>AI Hook</SectionLabel>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              AI that sees what the driver sees.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
              Drivers can use a screenshot of a trip offer to get a smarter verdict instead
              of relying only on guesswork.
            </p>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
              The app helps interpret payout, pickup distance, trip distance, estimated
              time, and financial impact in one step.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {["Screenshot", "Smart Verdict", "Weekly Meaning"].map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] font-bold text-slate-800">
                    {step}
                  </span>
                  {index < 2 ? (
                    <span className="text-[18px] font-black text-cyan-700" aria-hidden="true">
                      &rarr;
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-900">
              <SparkIcon className="h-5 w-5 text-cyan-700" />
              <p className="text-[13px] font-bold uppercase tracking-[0.16em]">
                Screenshot analysis
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {aiSignals.map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-[1.2rem] border border-white bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-[14px] font-semibold text-slate-700">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-[2.25rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_22px_60px_-32px_rgba(15,23,42,0.55)] sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300">
              Difference
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              More than a tracker. More than a calculator.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-300">
              Most tools help with mileage, taxes, or tracking after the work is done.
            </p>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-300">
              Trip Worth-It connects the decision before the work to the money plan after
              the work.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {decisionChain.map((step, index) => (
              <div
                key={step}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4"
              >
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-xl font-black capitalize text-white">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <Suspense
          fallback={
            <div
              id="join-beta"
              className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_55px_-26px_rgba(15,23,42,0.4)] sm:p-8"
            >
              <p className="text-[13px] font-semibold text-slate-600">
                Loading beta signup...
              </p>
            </div>
          }
        >
          <BetaSignupForm />
        </Suspense>
      </div>
    </main>
  );
}
