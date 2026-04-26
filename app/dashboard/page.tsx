"use client";

import { useMemo } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { loadDashboardSnapshot } from "@/lib/dashboardData";
import type { Verdict } from "@/types/trip";

function fmt(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShort(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  WORTH_TAKING: "Worth Taking",
  BORDERLINE: "Borderline",
  NOT_WORTH_IT: "Not Worth It",
};

const VERDICT_COLORS: Record<Verdict, { badge: string; dot: string; text: string }> = {
  WORTH_TAKING: {
    badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  BORDERLINE: {
    badge: "bg-amber-50 border-amber-200 text-amber-700",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  NOT_WORTH_IT: {
    badge: "bg-rose-50 border-rose-200 text-rose-700",
    dot: "bg-rose-500",
    text: "text-rose-700",
  },
};

function CtaLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="btn-press mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-white hover:border-slate-300"
    >
      {label}
    </Link>
  );
}

function EmptyCard({ message, cta, ctaHref }: { message: string; cta: string; ctaHref: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <p className="text-[14px] font-medium text-slate-500">{message}</p>
      <CtaLink href={ctaHref} label={cta} />
    </div>
  );
}

export default function DashboardPage() {
  const data = useMemo(() => loadDashboardSnapshot(), []);

  // Derived last-trip metrics
  const lastTripMetrics = useMemo(() => {
    if (!data.lastTrip) return null;
    const { trip, estimatedNet } = data.lastTrip;
    const totalMiles = trip.pickupMiles + trip.tripMiles;
    const netPerMile = totalMiles > 0 ? estimatedNet / totalMiles : 0;
    const netPerHour =
      trip.totalMinutes > 0 ? estimatedNet / (trip.totalMinutes / 60) : 0;
    return { totalMiles, netPerMile, netPerHour };
  }, [data.lastTrip]);

  // Summary card values
  const summaryUsableIncome =
    data.hasBuckets
      ? data.bucketsResult.usableIncome
      : data.hasReservePlanner
      ? data.reserveResult.usableWeeklyIncome
      : null;

  const summaryReserved =
    data.hasBuckets
      ? data.bucketsResult.totalReserved
      : data.hasReservePlanner
      ? data.reserveResult.totalWeeklyReserve
      : null;

  const summaryTarget =
    data.hasIncomeTarget && data.incomeTargetResult.weeklyTarget > 0
      ? data.incomeTargetResult.weeklyTarget
      : null;

  const goalProjected = data.hasGoal && data.goalResult.projectedWeeks;

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#eef1f7] text-slate-900">
      <div className="pointer-events-none absolute inset-0 panel-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[100px]" />

      <div className="relative mx-auto w-full max-w-[860px] px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
        <AppNav />

        {/* Header */}
        <header className="card-enter mb-5 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-[0_8px_16px_-4px_rgba(15,23,42,0.3),0_40px_80px_-12px_rgba(15,23,42,0.4)]">
          <div className="px-6 py-6 sm:px-7 sm:py-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                Dashboard
              </p>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-slate-400">
                Beta · Local-only
              </span>
            </div>
            <h1 className="mt-4 text-[1.85rem] font-black leading-[1.1] tracking-tight text-white sm:text-[2.2rem]">
              Your week
              <br />
              <span className="text-cyan-400">at a glance.</span>
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
              Know what to take. Know what to keep. Know what to save.
            </p>
          </div>
        </header>

        {/* Summary Grid */}
        <div className="card-enter mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Last Verdict */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Last Trip
            </p>
            {data.lastTrip ? (
              <>
                <div className="mt-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${
                        VERDICT_COLORS[data.lastTrip.verdict].dot
                      }`}
                    />
                    <span
                      className={`text-[13px] font-bold ${
                        VERDICT_COLORS[data.lastTrip.verdict].text
                      }`}
                    >
                      {VERDICT_LABEL[data.lastTrip.verdict]}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {fmt(data.lastTrip.estimatedNet)} net
                  </p>
                </div>
              </>
            ) : (
              <p className="mt-3 text-[13px] font-semibold text-slate-400">No trips yet</p>
            )}
          </div>

          {/* Usable Income */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Usable / wk
            </p>
            <div className="mt-3">
              <p className="text-[1.4rem] font-black leading-none text-slate-900">
                {summaryUsableIncome !== null ? fmtShort(summaryUsableIncome) : "—"}
              </p>
              <p className="mt-1 text-[12px] text-slate-400">
                {summaryUsableIncome !== null ? "after reserves" : "not set up"}
              </p>
            </div>
          </div>

          {/* Weekly Target */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Wkly Target
            </p>
            <div className="mt-3">
              <p className="text-[1.4rem] font-black leading-none text-slate-900">
                {summaryTarget !== null ? fmtShort(summaryTarget) : "—"}
              </p>
              {summaryTarget !== null && data.effectiveWeeklyIncome > 0 ? (
                <p
                  className={`mt-1 text-[12px] font-semibold ${
                    data.dashboardOnTrack ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {data.dashboardOnTrack
                    ? "on track"
                    : `$${Math.abs(data.dashboardWeeklyGap).toFixed(0)} short`}
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-slate-400">
                  {summaryTarget !== null ? "set income in planner" : "not set up"}
                </p>
              )}
            </div>
          </div>

          {/* Total Reserved */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Reserved / wk
            </p>
            <div className="mt-3">
              <p className="text-[1.4rem] font-black leading-none text-slate-900">
                {summaryReserved !== null ? fmtShort(summaryReserved) : "—"}
              </p>
              <p className="mt-1 text-[12px] text-slate-400">
                {summaryReserved !== null ? "set aside" : "not set up"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Last Trip Snapshot */}
          <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">
                  01
                </div>
                <div>
                  <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
                    Last Trip Snapshot
                  </h2>
                  <p className="text-[12px] text-slate-500">Most recent trip check result</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-5">
              {!data.lastTrip ? (
                <EmptyCard
                  message="No trip checks recorded yet."
                  cta="Check a trip"
                  ctaHref="/"
                />
              ) : (
                <>
                  {/* Verdict badge */}
                  <div
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 ${
                      VERDICT_COLORS[data.lastTrip.verdict].badge
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        VERDICT_COLORS[data.lastTrip.verdict].dot
                      }`}
                    />
                    <span className="text-[13px] font-bold">
                      {VERDICT_LABEL[data.lastTrip.verdict]}
                    </span>
                    <span className="text-[12px] opacity-70">
                      · {data.lastTrip.tripType === "ride" ? "Ride" : "Delivery"}
                    </span>
                  </div>

                  {/* Key metrics */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Net Earned
                      </p>
                      <p className="mt-1 text-[1.1rem] font-black text-slate-900">
                        {fmt(data.lastTrip.estimatedNet)}
                      </p>
                    </div>
                    {lastTripMetrics && (
                      <>
                        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Net / Mile
                          </p>
                          <p className="mt-1 text-[1.1rem] font-black text-slate-900">
                            {fmt(lastTripMetrics.netPerMile)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Net / Hour
                          </p>
                          <p className="mt-1 text-[1.1rem] font-black text-slate-900">
                            {fmt(lastTripMetrics.netPerHour)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Trip stats banner */}
                  {data.tripStats && data.tripStats.count > 1 && (
                    <div className="mt-3 flex flex-wrap gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                      <span>
                        <span className="font-bold text-slate-900">{data.tripStats.count}</span>{" "}
                        trips checked
                      </span>
                      <span>
                        <span className="font-bold text-slate-900">
                          {data.tripStats.worthTakingPct}%
                        </span>{" "}
                        worth taking
                      </span>
                      <span>
                        Avg net{" "}
                        <span className="font-bold text-slate-900">
                          {fmt(data.tripStats.avgNetPerTrip)}
                        </span>
                      </span>
                    </div>
                  )}

                  <CtaLink href="/" label="Check another trip" />
                </>
              )}
            </div>
          </section>

          {/* Planner Snapshot */}
          <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">
                  02
                </div>
                <div>
                  <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
                    Planner Snapshot
                  </h2>
                  <p className="text-[12px] text-slate-500">Reserve, income target & gap</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-5">
              {!data.hasReservePlanner && !data.hasIncomeTarget ? (
                <EmptyCard
                  message="Planner not set up yet."
                  cta="Set up Planner"
                  ctaHref="/planner"
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {data.hasReservePlanner && (
                      <>
                        <div className="rounded-xl bg-slate-50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Usable / Week
                          </p>
                          <p className="mt-1 text-[1.3rem] font-black text-slate-900">
                            {fmt(data.reserveResult.usableWeeklyIncome)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {data.reserveInput.repairReservePct +
                              data.reserveInput.taxReservePct +
                              data.reserveInput.emergencyReservePct}
                            % reserved
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Total Reserved
                          </p>
                          <p className="mt-1 text-[1.3rem] font-black text-slate-900">
                            {fmt(data.reserveResult.totalWeeklyReserve)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">per week</p>
                        </div>
                      </>
                    )}

                    {data.hasIncomeTarget && data.incomeTargetResult.weeklyTarget > 0 && (
                      <>
                        <div className="rounded-xl bg-slate-50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Weekly Target
                          </p>
                          <p className="mt-1 text-[1.3rem] font-black text-slate-900">
                            {fmt(data.incomeTargetResult.weeklyTarget)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">to cover monthly costs</p>
                        </div>

                        <div
                          className={`rounded-xl px-4 py-3 ${
                            data.effectiveWeeklyIncome > 0
                              ? data.dashboardOnTrack
                                ? "bg-emerald-50 border border-emerald-100"
                                : "bg-rose-50 border border-rose-100"
                              : "bg-slate-50"
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Gap / Week
                          </p>
                          {data.effectiveWeeklyIncome > 0 ? (
                            <>
                              <p
                                className={`mt-1 text-[1.3rem] font-black ${
                                  data.dashboardOnTrack ? "text-emerald-700" : "text-rose-600"
                                }`}
                              >
                                {data.dashboardOnTrack ? "+" : ""}
                                {fmtShort(data.dashboardWeeklyGap)}
                              </p>
                              <p
                                className={`mt-0.5 text-[11px] font-semibold ${
                                  data.dashboardOnTrack ? "text-emerald-600" : "text-rose-500"
                                }`}
                              >
                                {data.dashboardOnTrack ? "on track" : "below target"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="mt-1 text-[1.3rem] font-black text-slate-400">—</p>
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                set usable income in planner
                              </p>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Interpretation */}
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[13px] leading-relaxed text-slate-600">
                      {data.effectiveWeeklyIncome > 0 &&
                      data.hasIncomeTarget &&
                      data.incomeTargetResult.weeklyTarget > 0 ? (
                        data.dashboardOnTrack ? (
                          <>
                            Your current usable income appears to be{" "}
                            <span className="font-semibold text-emerald-700">on track</span> with
                            your weekly target. Keep going.
                          </>
                        ) : (
                          <>
                            You&apos;re about{" "}
                            <span className="font-semibold text-rose-600">
                              {fmtShort(Math.abs(data.dashboardWeeklyGap))}/week
                            </span>{" "}
                            below your current target. Your usable income is your clearest number to
                            watch.
                          </>
                        )
                      ) : (
                        <>
                          Your current usable weekly income is your clearest number to watch. Set
                          your monthly costs in the Planner to see whether you&apos;re on track.
                        </>
                      )}
                    </p>
                  </div>

                  <CtaLink href="/planner" label="Go to Planner" />
                </>
              )}
            </div>
          </section>

          {/* Savings Buckets Snapshot */}
          <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">
                  03
                </div>
                <div>
                  <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
                    Savings Buckets Snapshot
                  </h2>
                  <p className="text-[12px] text-slate-500">Where your income is allocated</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-5">
              {!data.hasBuckets ? (
                <EmptyCard
                  message="Savings Buckets not configured yet."
                  cta="Set up Savings Buckets"
                  ctaHref="/buckets"
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                        Usable / Week
                      </p>
                      <p className="mt-1 text-[1.3rem] font-black text-emerald-700">
                        {fmt(data.bucketsResult.usableIncome)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-emerald-600/70">after all buckets</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Total Reserved
                      </p>
                      <p className="mt-1 text-[1.3rem] font-black text-slate-900">
                        {fmt(data.bucketsResult.totalReserved)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {data.bucketsResult.totalAllocPct}% of income
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Largest Bucket
                      </p>
                      <p className="mt-1 text-[13px] font-black leading-tight text-slate-900">
                        {data.bucketsResult.largestBucketLabel}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">biggest slice</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Monthly Reserve
                      </p>
                      <p className="mt-1 text-[1.3rem] font-black text-slate-900">
                        {fmt(data.bucketsResult.monthlyTotalReserved)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">projected</p>
                    </div>
                  </div>

                  {/* Interpretation */}
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[13px] leading-relaxed text-slate-600">
                      {data.bucketsResult.isOverAllocated ? (
                        <>
                          Your allocations currently exceed 100%. Reduce one or more bucket
                          percentages in Savings Buckets.
                        </>
                      ) : (
                        <>
                          Most of your reserved income is going toward{" "}
                          <span className="font-semibold text-slate-800">
                            {data.bucketsResult.largestBucketLabel}
                          </span>
                          . Your current setup leaves{" "}
                          <span className="font-semibold text-emerald-700">
                            {fmt(data.bucketsResult.usableIncome)}/week
                          </span>{" "}
                          available after allocations.
                        </>
                      )}
                    </p>
                  </div>

                  <CtaLink href="/buckets" label="Go to Savings Buckets" />
                </>
              )}
            </div>
          </section>

          {/* Goal Snapshot — only if goal data exists */}
          {data.hasGoal && (
            <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">
                    04
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
                      Goal Snapshot
                    </h2>
                    <p className="text-[12px] text-slate-500">Your savings goal progress</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <p className="text-[15px] font-bold text-slate-900">
                    {data.goalInput.goalName || "Savings Goal"}
                  </p>
                  <span className="ml-auto text-[15px] font-black text-slate-900">
                    {fmt(data.goalInput.goalAmount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Weekly Target
                    </p>
                    <p className="mt-1 text-[1.3rem] font-black text-slate-900">
                      {fmt(data.goalResult.weeklyGoalTarget)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      to reach in {data.goalInput.targetWeeks}w
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Saving Now
                    </p>
                    <p className="mt-1 text-[1.3rem] font-black text-slate-900">
                      {data.goalInput.weeklySavingsAmount > 0
                        ? fmt(data.goalInput.weeklySavingsAmount)
                        : "—"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">per week</p>
                  </div>

                  {goalProjected && (
                    <div
                      className={`col-span-2 rounded-xl border px-4 py-3 ${
                        goalProjected <= data.goalInput.targetWeeks
                          ? "border-emerald-100 bg-emerald-50"
                          : "border-amber-100 bg-amber-50"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Projected Time to Goal
                      </p>
                      <p
                        className={`mt-1 text-[1.3rem] font-black ${
                          goalProjected <= data.goalInput.targetWeeks
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {goalProjected} weeks
                      </p>
                      <p
                        className={`mt-0.5 text-[12px] font-medium ${
                          goalProjected <= data.goalInput.targetWeeks
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {goalProjected <= data.goalInput.targetWeeks
                          ? "At your current pace, you can reach this goal on time."
                          : `At this pace, you may miss your deadline. Consider saving $${Math.abs(data.goalResult.goalGap).toFixed(0)} more/week.`}
                      </p>
                    </div>
                  )}
                </div>

                <CtaLink href="/planner" label="Go to Goal Planner" />
              </div>
            </section>
          )}

          {/* Action Nudges */}
          {data.nudges.length > 0 && (
            <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">
                    {data.hasGoal ? "05" : "04"}
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
                      What to Watch This Week
                    </h2>
                    <p className="text-[12px] text-slate-500">Suggested focus based on your data</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 px-5 py-5">
                {data.nudges.map((nudge, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-black text-cyan-700">
                      {i + 1}
                    </span>
                    <p className="text-[14px] leading-relaxed text-slate-700">{nudge}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Module Links (mobile-friendly quick access) */}
          <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Quick Access
              </p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                {
                  href: "/",
                  label: "Trip Check",
                  desc: "Evaluate your next trip",
                  dot: "bg-cyan-400",
                },
                {
                  href: "/planner",
                  label: "Reserve & Goal Planner",
                  desc: "Set your income targets",
                  dot: "bg-indigo-400",
                },
                {
                  href: "/buckets",
                  label: "Savings Buckets",
                  desc: "Allocate every dollar",
                  dot: "bg-emerald-400",
                },
              ].map(({ href, label, desc, dot }) => (
                <Link
                  key={href}
                  href={href}
                  className="btn-press flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
                >
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dot}`} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-slate-800">{label}</p>
                    <p className="text-[12px] text-slate-400">{desc}</p>
                  </div>
                  <span className="ml-auto text-slate-300">›</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
