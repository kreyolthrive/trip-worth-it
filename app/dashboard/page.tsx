"use client";

import { useMemo } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  BucketsIcon,
  DashboardIcon,
  ProfileIcon,
  SparkIcon,
  TargetIcon,
} from "@/components/ui/Icons";
import { loadDashboardSnapshot } from "@/lib/dashboardData";
import type { ProfileSetupCheck } from "@/types/profile";
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

function CtaLink({
  href,
  label,
  dark = false,
}: {
  href: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "btn-press inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-[13px] font-bold transition sm:w-auto",
        dark
          ? "bg-slate-900 text-white shadow-[0_4px_14px_rgba(15,23,42,0.25)] hover:bg-slate-800"
          : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">
          {number}
        </div>
        <div>
          <h2 className="text-[16px] font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="text-[12px] text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  message,
  detail,
  cta,
  href,
}: {
  message: string;
  detail: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
      <p className="text-[14px] font-bold text-slate-700">{message}</p>
      <p className="mx-auto mt-1 max-w-sm text-[12px] leading-5 text-slate-500">{detail}</p>
      <div className="mt-4">
        <CtaLink href={href} label={cta} />
      </div>
    </div>
  );
}

function SetupRow({ check }: { check: ProfileSetupCheck }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2">
      <span
        className={[
          "h-2.5 w-2.5 flex-shrink-0 rounded-full",
          check.complete ? "bg-emerald-500" : "bg-slate-300",
        ].join(" ")}
      />
      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-700">
        {check.label}
      </span>
      <span
        className={[
          "text-[10px] font-black uppercase tracking-widest",
          check.complete ? "text-emerald-600" : "text-slate-400",
        ].join(" ")}
      >
        {check.complete ? "Set" : "Open"}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const data = useMemo(() => loadDashboardSnapshot(), []);

  const lastTripMetrics = useMemo(() => {
    if (!data.lastTrip) return null;
    const { trip, estimatedNet } = data.lastTrip;
    const totalMiles = trip.pickupMiles + trip.tripMiles;
    const netPerMile = totalMiles > 0 ? estimatedNet / totalMiles : 0;
    const netPerHour =
      trip.totalMinutes > 0 ? estimatedNet / (trip.totalMinutes / 60) : 0;
    return { totalMiles, netPerMile, netPerHour };
  }, [data.lastTrip]);

  const weeklyTarget =
    data.hasProfile && data.profile.weeklyIncomeTarget > 0
      ? data.profile.weeklyIncomeTarget
      : data.hasIncomeTarget && data.incomeTargetResult.weeklyTarget > 0
        ? data.incomeTargetResult.weeklyTarget
        : null;

  const weeklyGap =
    weeklyTarget !== null && data.effectiveWeeklyIncome > 0
      ? data.effectiveWeeklyIncome - weeklyTarget
      : null;

  const weeklyOnTrack = weeklyGap !== null ? weeklyGap >= 0 : null;

  const usableIncome =
    data.hasBuckets
      ? data.bucketsResult.usableIncome
      : data.hasReservePlanner
        ? data.reserveResult.usableWeeklyIncome
        : data.effectiveWeeklyIncome > 0
          ? data.effectiveWeeklyIncome
          : null;

  const reservedIncome =
    data.hasBuckets
      ? data.bucketsResult.totalReserved
      : data.hasReservePlanner
        ? data.reserveResult.totalWeeklyReserve
        : null;

  const displayNudges =
    data.nudges.length > 0
      ? data.nudges
      : ["Your setup is strong. Keep checking trips against your targets and protect your reserve plan."];

  const goalPace =
    data.hasGoal && data.goalResult.projectedWeeks !== null
      ? {
          value: `${data.goalResult.projectedWeeks}w`,
          label:
            data.goalResult.projectedWeeks <= data.goalInput.targetWeeks
              ? "on pace"
              : "behind pace",
          strong: data.goalResult.projectedWeeks <= data.goalInput.targetWeeks,
        }
      : null;

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#eef1f7] text-slate-900">
      <div className="pointer-events-none absolute inset-0 panel-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[100px]" />

      <div className="relative mx-auto w-full max-w-[960px] px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
        <AppNav />

        <header className="card-enter mb-5 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-[0_8px_16px_-4px_rgba(15,23,42,0.3),0_40px_80px_-12px_rgba(15,23,42,0.4)]">
          <div className="px-6 py-6 sm:px-7 sm:py-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                Dashboard
              </p>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-slate-400">
                Local control center
              </span>
            </div>
            <h1 className="mt-4 text-[2rem] font-black leading-[1.08] tracking-tight text-white sm:text-[2.5rem]">
              Your driver week,
              <br />
              <span className="text-cyan-400">all in one place.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-slate-300">
              See your trip quality, weekly target pace, savings setup, and profile status before
              deciding what to do next.
            </p>
          </div>
        </header>

        <section className="card-enter mb-5 overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-600">
                    Profile setup
                  </p>
                  <h2 className="mt-1 text-[1.55rem] font-black tracking-tight text-slate-900">
                    {data.profileSetup.percent}% complete
                  </h2>
                  <p className="mt-1 max-w-lg text-[13px] leading-5 text-slate-600">
                    {data.profileSetup.summary}
                  </p>
                </div>
                <CtaLink
                  href="/profile"
                  label={data.profileSetup.percent === 100 ? "Update Profile" : "Complete Profile"}
                  dark
                />
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${data.profileSetup.percent}%` }}
                />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {data.profileSetup.checks.map((check) => (
                  <SetupRow key={check.id} check={check} />
                ))}
              </div>
            </div>

            <div className="border-t border-cyan-100 bg-cyan-50 px-5 py-5 lg:border-l lg:border-t-0">
              <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-cyan-700">
                <ProfileIcon className="h-4 w-4" />
                Personalization next
              </p>
              <p className="mt-2 text-[13px] leading-5 text-slate-700">
                {data.profileSetup.nextAction}
              </p>
              <p className="mt-3 text-[12px] leading-5 text-slate-500">
                Profile data gives Trip Check, Planner, Buckets, and Dashboard the same baseline.
              </p>
            </div>
          </div>
        </section>

        <section className="card-enter mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Last Trip
            </p>
            {data.lastTrip ? (
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
            ) : (
              <p className="mt-3 text-[13px] font-semibold text-slate-400">No trips yet</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Usable / wk
            </p>
            <p className="mt-3 text-[1.4rem] font-black leading-none text-slate-900">
              {usableIncome !== null ? fmtShort(usableIncome) : "-"}
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              {usableIncome !== null ? "after reserves" : "not set up"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Weekly Target
            </p>
            <p className="mt-3 text-[1.4rem] font-black leading-none text-slate-900">
              {weeklyTarget !== null ? fmtShort(weeklyTarget) : "-"}
            </p>
            <p
              className={[
                "mt-1 text-[12px] font-semibold",
                weeklyOnTrack === null
                  ? "text-slate-400"
                  : weeklyOnTrack
                    ? "text-emerald-600"
                    : "text-rose-500",
              ].join(" ")}
            >
              {weeklyGap === null
                ? "not set up"
                : weeklyOnTrack
                  ? "on track"
                  : `${fmtShort(Math.abs(weeklyGap))} short`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Reserved / wk
            </p>
            <p className="mt-3 text-[1.4rem] font-black leading-none text-slate-900">
              {reservedIncome !== null ? fmtShort(reservedIncome) : "-"}
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              {reservedIncome !== null ? "set aside" : "not configured"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Goal Pace
            </p>
            <p className="mt-3 text-[1.4rem] font-black leading-none text-slate-900">
              {goalPace ? goalPace.value : "-"}
            </p>
            <p
              className={[
                "mt-1 text-[12px] font-semibold",
                !goalPace
                  ? "text-slate-400"
                  : goalPace.strong
                    ? "text-emerald-600"
                    : "text-amber-600",
              ].join(" ")}
            >
              {goalPace ? goalPace.label : "no goal yet"}
            </p>
          </div>
        </section>

        <section className="card-enter mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
          <SectionHeader
            number="01"
            title="What to Watch This Week"
            subtitle="Suggested focus based on your setup and recent data"
          />
          <div className="space-y-2.5 px-5 py-5">
            {displayNudges.slice(0, 4).map((nudge, i) => (
              <div
                key={nudge}
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

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
            <SectionHeader
              number="02"
              title="Trip Check"
              subtitle="Most recent offer quality"
            />
            <div className="px-5 py-5">
              {!data.lastTrip ? (
                <EmptyState
                  message="No trip checks yet"
                  detail="Run a manual check or demo screenshot to start building offer history."
                  cta="Check a Trip"
                  href="/"
                />
              ) : (
                <>
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
                      {data.lastTrip.tripType === "ride" ? "Ride" : "Delivery"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Net
                      </p>
                      <p className="mt-1 text-[1rem] font-black text-slate-900">
                        {fmt(data.lastTrip.estimatedNet)}
                      </p>
                    </div>
                    {lastTripMetrics ? (
                      <>
                        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            / Mile
                          </p>
                          <p className="mt-1 text-[1rem] font-black text-slate-900">
                            {fmt(lastTripMetrics.netPerMile)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            / Hour
                          </p>
                          <p className="mt-1 text-[1rem] font-black text-slate-900">
                            {fmt(lastTripMetrics.netPerHour)}
                          </p>
                        </div>
                      </>
                    ) : null}
                  </div>

                  {data.tripStats && data.tripStats.count > 1 ? (
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-[13px] leading-5 text-slate-600">
                      <span className="font-bold text-slate-900">{data.tripStats.count}</span>{" "}
                      trips checked,{" "}
                      <span className="font-bold text-slate-900">
                        {data.tripStats.worthTakingPct}%
                      </span>{" "}
                      worth taking, average net{" "}
                      <span className="font-bold text-slate-900">
                        {fmt(data.tripStats.avgNetPerTrip)}
                      </span>
                      .
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <CtaLink href="/" label="Check Another Trip" />
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
            <SectionHeader
              number="03"
              title="Planner"
              subtitle="Weekly income and reserve pace"
            />
            <div className="px-5 py-5">
              {!data.hasReservePlanner && weeklyTarget === null ? (
                <EmptyState
                  message="Planner not set up yet"
                  detail="Add a weekly target and reserve plan to see whether your income is on pace."
                  cta="Set Up Planner"
                  href="/planner"
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Usable / Week
                      </p>
                      <p className="mt-1 text-[1.25rem] font-black text-slate-900">
                        {usableIncome !== null ? fmt(usableIncome) : "-"}
                      </p>
                    </div>
                    <div
                      className={[
                        "rounded-xl border px-4 py-3",
                        weeklyOnTrack === null
                          ? "border-slate-100 bg-slate-50"
                          : weeklyOnTrack
                            ? "border-emerald-100 bg-emerald-50"
                            : "border-rose-100 bg-rose-50",
                      ].join(" ")}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Gap / Week
                      </p>
                      <p
                        className={[
                          "mt-1 text-[1.25rem] font-black",
                          weeklyOnTrack === null
                            ? "text-slate-400"
                            : weeklyOnTrack
                              ? "text-emerald-700"
                              : "text-rose-600",
                        ].join(" ")}
                      >
                        {weeklyGap === null
                          ? "-"
                          : `${weeklyOnTrack ? "+" : ""}${fmtShort(weeklyGap)}`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-[13px] leading-5 text-slate-600">
                    {weeklyGap === null
                      ? "Add a weekly income target in Profile or Planner so the dashboard can show your pace."
                      : weeklyOnTrack
                        ? "Your current usable weekly income is on pace against your saved target."
                        : `You are about ${fmtShort(Math.abs(weeklyGap))}/week below your current target. Watch net/hour and avoid weak offers.`}
                  </p>
                  <div className="mt-4">
                    <CtaLink href="/planner" label="Open Planner" />
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
            <SectionHeader
              number="04"
              title="Savings Buckets"
              subtitle="Where driving income is allocated"
            />
            <div className="px-5 py-5">
              {!data.hasBuckets ? (
                <EmptyState
                  message="Savings buckets not configured yet"
                  detail="Set bucket percentages so the dashboard can show usable income and reserves."
                  cta="Set Up Buckets"
                  href="/buckets"
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                        Usable
                      </p>
                      <p className="mt-1 text-[1.25rem] font-black text-emerald-700">
                        {fmt(data.bucketsResult.usableIncome)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Reserved
                      </p>
                      <p className="mt-1 text-[1.25rem] font-black text-slate-900">
                        {fmt(data.bucketsResult.totalReserved)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-[13px] leading-5 text-slate-600">
                    {data.bucketsResult.isOverAllocated
                      ? "Your bucket allocations exceed 100%. Reduce one or more percentages."
                      : `Your biggest bucket is ${data.bucketsResult.largestBucketLabel}. You have ${data.bucketsResult.totalAllocPct}% allocated.`}
                  </p>
                  <div className="mt-4">
                    <CtaLink href="/buckets" label="Open Buckets" />
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
            <SectionHeader
              number="05"
              title="Primary Goal"
              subtitle="Progress context for your week"
            />
            <div className="px-5 py-5">
              {!data.hasGoal ? (
                <EmptyState
                  message="No primary goal set yet"
                  detail="Add a goal to unlock better weekly progress signals."
                  cta="Add Goal"
                  href="/profile"
                />
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-black text-slate-900">
                        {data.goalInput.goalName || data.profile.primaryGoalName || "Savings Goal"}
                      </p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        Target in {data.goalInput.targetWeeks} weeks
                      </p>
                    </div>
                    <p className="text-[1.35rem] font-black text-slate-900">
                      {fmtShort(data.goalInput.goalAmount)}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Need / Week
                      </p>
                      <p className="mt-1 text-[1.2rem] font-black text-slate-900">
                        {fmt(data.goalResult.weeklyGoalTarget)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Saving
                      </p>
                      <p className="mt-1 text-[1.2rem] font-black text-slate-900">
                        {data.goalInput.weeklySavingsAmount > 0
                          ? fmt(data.goalInput.weeklySavingsAmount)
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <CtaLink href="/planner" label="Open Goal Planner" />
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <section className="card-enter mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Quick Access
            </p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              {
                href: "/",
                label: "Trip Check",
                desc: "Evaluate an offer",
                Icon: SparkIcon,
              },
              {
                href: "/planner",
                label: "Planner",
                desc: "Targets and reserves",
                Icon: TargetIcon,
              },
              {
                href: "/buckets",
                label: "Buckets",
                desc: "Allocate income",
                Icon: BucketsIcon,
              },
              {
                href: "/profile",
                label: "Profile",
                desc: "Personalize guidance",
                Icon: DashboardIcon,
              },
            ].map(({ href, label, desc, Icon }) => (
              <Link
                key={href}
                href={href}
                className="btn-press flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-cyan-500" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-800">{label}</p>
                  <p className="text-[12px] text-slate-400">{desc}</p>
                </div>
                <span className="ml-auto text-slate-300">-&gt;</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
