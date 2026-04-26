"use client";

import { ChangeEvent, useMemo } from "react";
import { calculateReserves, WEEKS_PER_MONTH } from "@/lib/planner";
import { ReservePlannerInput } from "@/types/planner";

interface Props {
  value: ReservePlannerInput;
  onChange: (next: ReservePlannerInput) => void;
  onReset: () => void;
}

function fmt(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number): string {
  return `${n}%`;
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

export default function ReservePlanner({ value, onChange, onReset }: Props) {
  const result = useMemo(() => calculateReserves(value), [value]);
  const hasIncome = value.weeklyNetIncome > 0;

  const set = (field: keyof ReservePlannerInput) => (e: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: num(e) });

  const totalPct = value.repairReservePct + value.taxReservePct + value.emergencyReservePct;

  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white">
              01
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Reserve Planner</h2>
              <p className="text-[13px] text-slate-500">
                Protect your income before slow weeks, taxes, or an unexpected repair drains it
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="flex-shrink-0 inline-flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] font-semibold text-slate-600 transition hover:bg-white"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Inputs */}
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          {/* Weekly net income */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Weekly Net Income
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                $
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={value.weeklyNetIncome || ""}
                placeholder="0"
                onChange={set("weeklyNetIncome")}
                className={inputCls(true)}
              />
            </div>
          </label>

          {/* Weekly miles */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Weekly Miles Driven
            </span>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                value={value.weeklyMilesDriven || ""}
                placeholder="0"
                onChange={set("weeklyMilesDriven")}
                className={inputCls(false)}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                mi
              </span>
            </div>
          </label>

          {/* Reserve percentages - 3 col */}
          <div className="sm:col-span-2">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Reserve Percentages{" "}
              <span className={`font-semibold normal-case tracking-normal ${totalPct > 100 ? "text-rose-500" : "text-slate-400"}`}>
                ({pct(totalPct)} total)
              </span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { field: "repairReservePct", label: "Repairs" },
                  { field: "taxReservePct", label: "Taxes" },
                  { field: "emergencyReservePct", label: "Emergency" },
                ] as const
              ).map(({ field, label }) => (
                <label key={field} className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">{label}</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={value[field]}
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
          </div>
        </div>

        {/* Results */}
        {!hasIncome ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
            <p className="text-[14px] font-semibold text-slate-600">
              Enter your weekly net income to see your reserve breakdown
            </p>
            <p className="mt-1 text-[13px] text-slate-400">
              Default reserves: 10% repairs · 15% taxes · 5% emergency
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {/* Hero: usable income */}
            <div className="overflow-hidden rounded-xl bg-slate-900">
              <div className="px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Usable Weekly Income
                    </p>
                    <p className="mt-1 text-[2.6rem] font-black leading-none tracking-tight text-white">
                      {fmt(result.usableWeeklyIncome)}
                    </p>
                    <p className="mt-2 text-[13px] text-slate-400">
                      After reserving {fmt(result.totalWeeklyReserve)}/week ({pct(totalPct)} of
                      income)
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Usable / Month
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {fmt(result.usableMonthlyIncome)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-slate-500">× {WEEKS_PER_MONTH} weeks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reserve breakdown table */}
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <div className="grid grid-cols-[1fr_auto_auto] bg-slate-50 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Reserve
                </p>
                <p className="w-24 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Weekly
                </p>
                <p className="w-24 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Monthly
                </p>
              </div>

              {[
                {
                  label: "Repairs",
                  weekly: result.repairReserve,
                  monthly: result.monthlyRepairReserve,
                  dot: "bg-amber-400",
                },
                {
                  label: "Taxes",
                  weekly: result.taxReserve,
                  monthly: result.monthlyTaxReserve,
                  dot: "bg-rose-400",
                },
                {
                  label: "Emergency",
                  weekly: result.emergencyReserve,
                  monthly: result.monthlyEmergencyReserve,
                  dot: "bg-cyan-400",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1fr_auto_auto] items-center border-t border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                    <span className="text-[14px] font-medium text-slate-700">{row.label}</span>
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
                  {fmt(result.totalWeeklyReserve)}
                </span>
                <span className="w-24 text-right text-[14px] font-semibold tabular-nums text-slate-600">
                  {fmt(result.totalMonthlyReserve)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
