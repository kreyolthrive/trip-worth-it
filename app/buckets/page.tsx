"use client";

import { ChangeEvent, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import { calculateBuckets, DEFAULT_BUCKETS_INPUT, PRESETS, WEEKS_PER_MONTH } from "@/lib/buckets";
import { loadBucketsInput, saveBucketsInput } from "@/lib/bucketsStorage";
import { BucketsInput, BucketsResult, PresetKey } from "@/types/buckets";

function fmt(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function inputCls(prefix = false): string {
  return [
    "h-10 w-full rounded-xl border border-slate-200 bg-white text-[14px] font-medium text-slate-900",
    "outline-none transition-all duration-150",
    "shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]",
    "focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)]",
    prefix ? "pl-7 pr-3" : "px-3",
  ].join(" ");
}

function pctInputCls(): string {
  return [
    "h-10 w-full rounded-xl border border-slate-200 bg-white pr-7 pl-3 text-[14px] font-medium text-slate-900",
    "outline-none transition-all duration-150",
    "shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]",
    "focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)]",
  ].join(" ");
}

function num(e: ChangeEvent<HTMLInputElement>): number {
  const v = Number(e.target.value);
  return Number.isNaN(v) ? 0 : v;
}

function getHealthMessages(input: BucketsInput, result: BucketsResult): string[] {
  const msgs: string[] = [];
  const { repairPct, taxPct, emergencyPct, goalPct } = input;

  if (repairPct >= 10) {
    msgs.push("You are setting aside a healthy amount for vehicle repairs.");
  } else if (repairPct > 0) {
    msgs.push("Your repair reserve is below the recommended 10% — unexpected repairs can be costly.");
  } else {
    msgs.push("Consider adding a repair reserve — vehicle wear is an ongoing cost for every driver.");
  }

  if (taxPct >= 15) {
    msgs.push("Your tax reserve looks solid — gig income is self-employment, and quarterly taxes can surprise you.");
  } else if (taxPct > 0) {
    msgs.push("Your tax reserve may be too low. Self-employment tax runs 15–20% of net income for most drivers.");
  } else {
    msgs.push("You have no tax reserve set. Self-employment taxes are due quarterly — set some aside now.");
  }

  if (emergencyPct >= 8) {
    msgs.push("Strong emergency reserve — you are building a real cushion for slow weeks.");
  } else if (emergencyPct >= 5) {
    msgs.push("Your emergency reserve is a good start. Aim to grow it toward 8–10% over time.");
  } else if (emergencyPct > 0) {
    msgs.push("Your emergency reserve may still be too low — even one slow week can feel painful without a buffer.");
  } else {
    msgs.push("No emergency reserve set. Without one, a slow week becomes a financial emergency.");
  }

  if (goalPct >= 10) {
    msgs.push("You are making real progress toward a goal. This is what intentional saving looks like.");
  } else if (goalPct > 0) {
    msgs.push("Your goal savings will add up — even small weekly amounts compound meaningfully over months.");
  }

  if (!result.isOverAllocated) {
    const usablePct = 100 - result.totalAllocPct;
    if (usablePct > 60) {
      msgs.push(`Most of your income (${Math.round(usablePct)}%) is still immediately spendable — you have room to reserve more.`);
    } else if (usablePct >= 40) {
      msgs.push(`Your allocations leave you with ${fmt(result.usableIncome)}/week of usable income — a healthy balance.`);
    } else {
      msgs.push(`You are reserving a large portion of income. Make sure your usable income (${fmt(result.usableIncome)}/week) covers your actual weekly needs.`);
    }
  }

  return msgs;
}

const PRESET_META: Record<PresetKey, { label: string; description: string; accentDark: string; accentLight: string }> = {
  conservative: {
    label: "Conservative",
    description: "High safety reserves",
    accentDark: "bg-amber-500",
    accentLight: "bg-amber-400",
  },
  balanced: {
    label: "Balanced",
    description: "Recommended starting point",
    accentDark: "bg-cyan-500",
    accentLight: "bg-cyan-400",
  },
  growth: {
    label: "Growth-Oriented",
    description: "Prioritize goal savings",
    accentDark: "bg-emerald-500",
    accentLight: "bg-emerald-400",
  },
};

export default function BucketsPage() {
  const [input, setInput] = useState<BucketsInput>(() => loadBucketsInput());
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);

  const result = useMemo(() => calculateBuckets(input), [input]);
  const hasIncome = input.weeklyNetIncome > 0;

  const set = (field: keyof BucketsInput) => (e: ChangeEvent<HTMLInputElement>) => {
    const next = { ...input, [field]: num(e) };
    setInput(next);
    saveBucketsInput(next);
    setActivePreset(null);
  };

  const applyPreset = (preset: PresetKey) => {
    const next = { ...input, ...PRESETS[preset] };
    setInput(next);
    saveBucketsInput(next);
    setActivePreset(preset);
  };

  const handleReset = () => {
    setInput(DEFAULT_BUCKETS_INPUT);
    saveBucketsInput(DEFAULT_BUCKETS_INPUT);
    setActivePreset(null);
  };

  const healthMessages = useMemo(
    () => (hasIncome ? getHealthMessages(input, result) : []),
    [input, result, hasIncome]
  );

  const bucketRows = [
    { label: "Repair Reserve", pct: input.repairPct, weekly: result.repairAmount, monthly: result.monthlyRepair, dot: "bg-amber-400" },
    { label: "Tax Reserve", pct: input.taxPct, weekly: result.taxAmount, monthly: result.monthlyTax, dot: "bg-rose-400" },
    { label: "Emergency Reserve", pct: input.emergencyPct, weekly: result.emergencyAmount, monthly: result.monthlyEmergency, dot: "bg-cyan-400" },
    { label: "Goal Savings", pct: input.goalPct, weekly: result.goalAmount, monthly: result.monthlyGoal, dot: "bg-emerald-400" },
    ...(input.customPct > 0
      ? [{ label: "Custom / Discretionary", pct: input.customPct, weekly: result.customAmount, monthly: result.monthlyCustom, dot: "bg-indigo-400" }]
      : []),
  ];

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#eef1f7] text-slate-900">
      <div className="pointer-events-none absolute inset-0 panel-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-[100px]" />

      <div className="relative mx-auto w-full max-w-[860px] px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
        <AppNav />

        {/* Header */}
        <header className="card-enter mb-8 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-[0_8px_16px_-4px_rgba(15,23,42,0.3),0_40px_80px_-12px_rgba(15,23,42,0.4)]">
          <div className="px-7 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                  Savings Buckets
                </p>
                <p className="text-[12px] text-slate-400">Income Allocation</p>
              </div>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-slate-300 sm:inline-flex">
                Beta · Local-only data
              </span>
            </div>

            <h1 className="mt-5 text-[2.2rem] font-black leading-[1.1] tracking-tight text-white sm:text-4xl">
              Give every dollar
              <br />
              <span className="text-emerald-400">a job.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-300">
              Split your driving income into purposeful buckets so you can reserve for what matters,
              protect what you need, and save toward something meaningful.
            </p>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500">
              Trip Check helps you decide what to take. Planner helps you decide what that income
              should do. Savings Buckets helps you decide where it should go.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Reserve for repairs & taxes", "Build an emergency cushion", "Save toward a goal"].map((chip) => (
                <span
                  key={chip}
                  className="fade-enter inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-slate-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="space-y-5">
          {/* Presets */}
          <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white">
                  01
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Quick Presets</h2>
                  <p className="text-[13px] text-slate-500">
                    Choose a starting point — you can adjust any percentage afterward
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.entries(PRESET_META) as [PresetKey, typeof PRESET_META[PresetKey]][]).map(
                  ([key, meta]) => {
                    const preset = PRESETS[key];
                    const isActive = activePreset === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyPreset(key)}
                        className={[
                          "btn-press flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all duration-150",
                          isActive
                            ? "border-slate-900 bg-slate-900 shadow-md"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-400" : meta.accentDark}`} />
                          <span className={`text-[13px] font-bold ${isActive ? "text-white" : "text-slate-800"}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className={`text-[12px] ${isActive ? "text-white/60" : "text-slate-400"}`}>
                          {meta.description}
                        </p>
                        <p className={`mt-1 text-[11px] font-medium ${isActive ? "text-white/70" : "text-slate-500"}`}>
                          {preset.repairPct}% repair · {preset.taxPct}% tax · {preset.emergencyPct}% emergency · {preset.goalPct}% goal
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          {/* Bucket Setup */}
          <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white">
                    02
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Bucket Setup</h2>
                    <p className="text-[13px] text-slate-500">
                      Enter your weekly net income and set your allocation percentages
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-shrink-0 inline-flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] font-semibold text-slate-600 transition hover:bg-white"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">
              {/* Income input */}
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Weekly Net Income
                </span>
                <div className="relative sm:max-w-[240px]">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={input.weeklyNetIncome || ""}
                    placeholder="0"
                    onChange={set("weeklyNetIncome")}
                    className={inputCls(true)}
                  />
                </div>
                {!hasIncome && (
                  <p className="text-[12px] text-slate-400">
                    Enter your typical weekly take-home after platform fees and expenses
                  </p>
                )}
              </label>

              {/* Percentages */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Bucket Allocations
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      result.isOverAllocated
                        ? "bg-rose-100 text-rose-600"
                        : result.totalAllocPct === 100
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {result.totalAllocPct}% allocated
                  </span>
                </div>

                {result.isOverAllocated && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <span className="mt-0.5 flex-shrink-0 text-[15px] text-rose-500">⚠</span>
                    <p className="text-[13px] font-medium text-rose-700">
                      Your allocations exceed 100%. Reduce one or more percentages — you can&apos;t
                      allocate more than you earn.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { field: "repairPct" as const, label: "Repair Reserve", dot: "bg-amber-400" },
                    { field: "taxPct" as const, label: "Tax Reserve", dot: "bg-rose-400" },
                    { field: "emergencyPct" as const, label: "Emergency Reserve", dot: "bg-cyan-400" },
                    { field: "goalPct" as const, label: "Goal Savings", dot: "bg-emerald-400" },
                    { field: "customPct" as const, label: "Custom / Discretionary", dot: "bg-indigo-400" },
                  ].map(({ field, label, dot }) => (
                    <label key={field} className="flex flex-col gap-1.5">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
                        {label}
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={input[field] || ""}
                          placeholder="0"
                          onChange={set(field)}
                          className={pctInputCls()}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          %
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                {!result.isOverAllocated && result.totalAllocPct < 100 && (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                    <p className="text-[13px] text-slate-500">
                      <span className="font-semibold text-slate-700">{100 - result.totalAllocPct}%</span>{" "}
                      unallocated
                      {hasIncome && (
                        <>
                          {" "}—{" "}
                          <span className="font-semibold text-slate-700">
                            {fmt(result.unallocatedAmount)}/week
                          </span>{" "}
                          flows to spendable income
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Empty state */}
          {!hasIncome ? (
            <section className="card-enter overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center shadow-sm">
              <p className="text-[15px] font-semibold text-slate-600">
                Enter your weekly net income above to see your bucket breakdown
              </p>
              <p className="mt-2 text-[13px] text-slate-400">
                You&apos;ll see how much flows into each bucket, your usable income, and monthly projections
              </p>
            </section>
          ) : (
            <>
              {/* Bucket Breakdown */}
              <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white">
                      03
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900">Bucket Breakdown</h2>
                      <p className="text-[13px] text-slate-500">Where your weekly income goes</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-6 py-6">
                  {/* Hero usable income */}
                  <div className="overflow-hidden rounded-xl bg-slate-900">
                    <div className="px-5 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                            Usable Income
                          </p>
                          <p className="mt-1 text-[2.6rem] font-black leading-none tracking-tight text-white">
                            {fmt(result.usableIncome)}
                            <span className="ml-1.5 text-[1.1rem] font-semibold text-slate-400">/wk</span>
                          </p>
                          <p className="mt-2 text-[13px] text-slate-400">
                            After reserving {fmt(result.totalReserved)}/week ({result.totalAllocPct}% allocated)
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                            Monthly
                          </p>
                          <p className="mt-1 text-2xl font-bold text-white">
                            {fmt(result.monthlyUsableIncome)}
                          </p>
                          <p className="mt-0.5 text-[12px] text-slate-500">× {WEEKS_PER_MONTH} weeks</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <div className="grid grid-cols-[1fr_auto_auto] bg-slate-50 px-4 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Bucket
                      </p>
                      <p className="w-24 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Weekly
                      </p>
                      <p className="w-24 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Monthly
                      </p>
                    </div>

                    {bucketRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[1fr_auto_auto] items-center border-t border-slate-100 px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${row.dot}`} />
                          <span className="text-[14px] font-medium text-slate-700">{row.label}</span>
                          <span className="text-[12px] text-slate-400">({row.pct}%)</span>
                        </div>
                        <span className="w-24 text-right text-[14px] font-semibold tabular-nums text-slate-900">
                          {fmt(row.weekly)}
                        </span>
                        <span className="w-24 text-right text-[14px] tabular-nums text-slate-500">
                          {fmt(row.monthly)}
                        </span>
                      </div>
                    ))}

                    <div className="grid grid-cols-[1fr_auto_auto] items-center border-t-2 border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-[13px] font-bold uppercase tracking-wide text-slate-600">
                        Total Reserved
                      </span>
                      <span className="w-24 text-right text-[14px] font-bold tabular-nums text-slate-900">
                        {fmt(result.totalReserved)}
                      </span>
                      <span className="w-24 text-right text-[14px] font-semibold tabular-nums text-slate-600">
                        {fmt(result.monthlyTotalReserved)}
                      </span>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_auto] items-center border-t border-emerald-100 bg-emerald-50/60 px-4 py-3">
                      <span className="text-[13px] font-bold text-emerald-700">Usable Income</span>
                      <span className="w-24 text-right text-[14px] font-bold tabular-nums text-emerald-700">
                        {fmt(result.usableIncome)}
                      </span>
                      <span className="w-24 text-right text-[14px] font-semibold tabular-nums text-emerald-600">
                        {fmt(result.monthlyUsableIncome)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bucket Health */}
              <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white">
                      04
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900">Bucket Health</h2>
                      <p className="text-[13px] text-slate-500">What your setup means in practice</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5 px-6 py-5">
                  {healthMessages.map((msg, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">
                        ✓
                      </span>
                      <p className="text-[14px] leading-relaxed text-slate-700">{msg}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Weekly Bucket Summary */}
              <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white">
                      05
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        Weekly Bucket Summary
                      </h2>
                      <p className="text-[13px] text-slate-500">
                        What this setup means for your week and month
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Reserved This Week
                      </p>
                      <p className="mt-1.5 text-2xl font-black text-slate-900">
                        {fmt(result.totalReserved)}
                      </p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        Across {bucketRows.length} bucket{bucketRows.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                        Usable This Week
                      </p>
                      <p className="mt-1.5 text-2xl font-black text-emerald-700">
                        {fmt(result.usableIncome)}
                      </p>
                      <p className="mt-1 text-[12px] text-emerald-600/70">Your spendable income</p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Monthly Reserve Total
                      </p>
                      <p className="mt-1.5 text-2xl font-black text-slate-900">
                        {fmt(result.monthlyTotalReserved)}
                      </p>
                      <p className="mt-1 text-[12px] text-slate-500">Projected (× {WEEKS_PER_MONTH} weeks)</p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Largest Bucket
                      </p>
                      <p className="mt-1.5 text-[17px] font-black leading-tight text-slate-900">
                        {result.largestBucketLabel}
                      </p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        Gets the biggest slice of your reserves
                      </p>
                    </div>
                  </div>

                  {/* Summary narrative */}
                  <div className="mt-4 overflow-hidden rounded-xl bg-slate-900 px-5 py-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Where Your Money Is Going
                    </p>
                    <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
                      Every week,{" "}
                      <span className="font-semibold text-white">{fmt(result.totalReserved)}</span> goes
                      into reserved buckets, leaving you{" "}
                      <span className="font-semibold text-emerald-400">{fmt(result.usableIncome)}</span>{" "}
                      of usable income. Over a full month, that&apos;s{" "}
                      <span className="font-semibold text-white">{fmt(result.monthlyTotalReserved)}</span>{" "}
                      reserved and{" "}
                      <span className="font-semibold text-emerald-400">
                        {fmt(result.monthlyUsableIncome)}
                      </span>{" "}
                      spendable. Your biggest reserve is{" "}
                      <span className="font-semibold text-white">{result.largestBucketLabel}</span>.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
