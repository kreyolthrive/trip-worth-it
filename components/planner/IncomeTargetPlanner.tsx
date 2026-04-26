"use client";

import { ChangeEvent, useMemo } from "react";
import { calculateIncomeTarget } from "@/lib/planner";
import { IncomeTargetInput } from "@/types/planner";

interface Props {
  value: IncomeTargetInput;
  onChange: (next: IncomeTargetInput) => void;
  onReset: () => void;
  suggestedUsableIncome: number | null;
}

function fmt(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtSigned(n: number): string {
  return `${n >= 0 ? "+" : "-"}${fmt(n)}`;
}

function dollarInputCls(): string {
  return [
    "h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-[14px] font-medium text-slate-900",
    "outline-none transition-all duration-150",
    "shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]",
    "focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)]",
  ].join(" ");
}

function plainInputCls(): string {
  return [
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[14px] font-medium text-slate-900",
    "outline-none transition-all duration-150",
    "shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]",
    "focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)]",
  ].join(" ");
}

function num(e: ChangeEvent<HTMLInputElement>): number {
  const v = Number(e.target.value);
  return Number.isNaN(v) ? 0 : v;
}

const EXPENSE_FIELDS: { field: keyof IncomeTargetInput; label: string }[] = [
  { field: "rent", label: "Rent / Housing" },
  { field: "groceries", label: "Groceries" },
  { field: "gas", label: "Gas / Fuel" },
  { field: "insurance", label: "Insurance" },
  { field: "carPayment", label: "Car Payment" },
  { field: "phone", label: "Phone" },
  { field: "debt", label: "Debt Payments" },
  { field: "other", label: "Other Expenses" },
];

export default function IncomeTargetPlanner({
  value,
  onChange,
  onReset,
  suggestedUsableIncome,
}: Props) {
  const result = useMemo(() => calculateIncomeTarget(value), [value]);

  const hasExpenses = EXPENSE_FIELDS.some((f) => (value[f.field] as number) > 0);
  const hasIncome = value.weeklyUsableIncome > 0;
  const hasData = hasExpenses || hasIncome;

  const showSuggestion =
    suggestedUsableIncome !== null &&
    suggestedUsableIncome > 0 &&
    suggestedUsableIncome !== value.weeklyUsableIncome;

  const set =
    (field: keyof IncomeTargetInput) => (e: ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [field]: num(e) });

  const statusColor = result.onTrack
    ? { hero: "bg-emerald-600", chip: "border-emerald-400/40 bg-emerald-500/20 text-emerald-100" }
    : { hero: "bg-rose-600", chip: "border-rose-400/40 bg-rose-500/20 text-rose-100" };

  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white">
              02
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Monthly Income Target
              </h2>
              <p className="text-[13px] text-slate-500">
                See exactly how many trips you need — and whether your current pace covers the bills
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
        {/* Monthly expense grid */}
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Monthly Expenses
          </p>
          <div className="grid gap-x-5 gap-y-3.5 sm:grid-cols-2">
            {EXPENSE_FIELDS.map(({ field, label }) => (
              <label key={field} className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-slate-500">{label}</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={(value[field] as number) || ""}
                    placeholder="0"
                    onChange={set(field)}
                    className={dollarInputCls()}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Savings + income + work days */}
        <div className="mt-5 grid gap-x-5 gap-y-3.5 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Target Monthly Savings
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                $
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={value.targetMonthlySavings || ""}
                placeholder="0"
                onChange={set("targetMonthlySavings")}
                className={dollarInputCls()}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Weekly Usable Income
            </span>
            {showSuggestion ? (
              <button
                type="button"
                onClick={() =>
                  onChange({ ...value, weeklyUsableIncome: suggestedUsableIncome! })
                }
                className="mb-1 inline-flex items-center gap-1 text-[12px] font-semibold text-cyan-600 hover:text-cyan-700"
              >
                ↑ Use ${suggestedUsableIncome!.toFixed(2)} from Reserve Planner
              </button>
            ) : null}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                $
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={value.weeklyUsableIncome || ""}
                placeholder="0"
                onChange={set("weeklyUsableIncome")}
                className={dollarInputCls()}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Work Days / Week
            </span>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                max="7"
                value={value.workDaysPerWeek}
                onChange={set("workDaysPerWeek")}
                className={plainInputCls()}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                days
              </span>
            </div>
          </label>
        </div>

        {/* Results */}
        {!hasData ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
            <p className="text-[14px] font-semibold text-slate-600">
              Fill in your monthly expenses and weekly income to see your target
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {/* Status hero */}
            <div className={`overflow-hidden rounded-xl ${statusColor.hero}`}>
              <div className="px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest ${statusColor.chip}`}
                    >
                      {result.onTrack ? "On Track" : "Below Target"}
                    </span>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-white/60">
                      Weekly Gap
                    </p>
                    <p className="mt-1 text-[2.6rem] font-black leading-none tracking-tight text-white">
                      {fmt(result.weeklyGap)}
                    </p>
                    <p className="mt-2 text-[13px] text-white/70">
                      {result.onTrack
                        ? `You're ${fmt(result.weeklyGap)}/week above your target — keep it up.`
                        : `You're ${fmt(result.weeklyGap)}/week below your target right now.`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                      Monthly Gap
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">{fmt(result.monthlyGap)}</p>
                    <p className="mt-0.5 text-[12px] text-white/50">
                      {result.monthlyGap >= 0 ? "surplus" : "deficit"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Monthly Need", value: fmt(result.totalMonthlyNeed) },
                { label: "Weekly Target", value: fmt(result.weeklyTarget) },
                { label: "Daily Target", value: fmt(result.dailyTarget) },
                {
                  label: "Weekly Gap",
                  value: fmtSigned(result.weeklyGap),
                  highlight: result.onTrack ? "text-emerald-600" : "text-rose-600",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {m.label}
                  </p>
                  <p
                    className={`mt-1.5 text-[16px] font-bold tabular-nums ${m.highlight ?? "text-slate-900"}`}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
