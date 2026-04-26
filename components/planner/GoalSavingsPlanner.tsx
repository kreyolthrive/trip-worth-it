"use client";

import { ChangeEvent, useMemo } from "react";
import { calculateGoal } from "@/lib/planner";
import { GoalPlannerInput } from "@/types/planner";

interface Props {
  value: GoalPlannerInput;
  onChange: (next: GoalPlannerInput) => void;
  onReset: () => void;
  suggestedUsableIncome: number | null;
}

function fmt(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

function projectionMessage(
  projectedWeeks: number | null,
  goalName: string,
  onPace: boolean
): string {
  const name = goalName.trim() || "your goal";
  if (projectedWeeks === null) {
    return "Set a weekly savings amount to see your projected completion date.";
  }
  if (projectedWeeks <= 0) {
    return `You've already reached ${name}!`;
  }
  const months = (projectedWeeks / 4.33).toFixed(1);
  const pace = onPace ? "on pace" : "behind pace";
  return `At your current savings, you can reach ${name} in ${projectedWeeks} weeks (~${months} months) — ${pace}.`;
}

export default function GoalSavingsPlanner({
  value,
  onChange,
  onReset,
  suggestedUsableIncome,
}: Props) {
  const result = useMemo(() => calculateGoal(value), [value]);

  const hasGoal = value.goalAmount > 0;
  const hasSavings = value.weeklySavingsAmount > 0;
  const onPace = result.goalGap >= 0;

  const showSuggestion =
    suggestedUsableIncome !== null &&
    suggestedUsableIncome > 0 &&
    suggestedUsableIncome !== value.weeklyUsableIncome;

  const setNum =
    (field: keyof GoalPlannerInput) => (e: ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [field]: num(e) });

  const progressPct =
    result.projectedWeeks !== null && value.targetWeeks > 0
      ? Math.min(100, Math.round((value.targetWeeks / result.projectedWeeks) * 100))
      : null;

  const statusColor =
    !hasSavings || !hasGoal
      ? { hero: "bg-slate-800", chip: "border-slate-400/40 bg-slate-500/20 text-slate-300" }
      : onPace
        ? { hero: "bg-emerald-600", chip: "border-emerald-400/40 bg-emerald-500/20 text-emerald-100" }
        : { hero: "bg-amber-500", chip: "border-amber-300/40 bg-amber-400/20 text-amber-100" };

  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white">
              03
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Goal Savings Planner
              </h2>
              <p className="text-[13px] text-slate-500">
                Turn your weekly savings into a countdown — car repair, emergency fund, or anything that matters
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
          {/* Goal name */}
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Goal Name
            </span>
            <input
              type="text"
              placeholder='e.g., "Emergency fund" or "New tires"'
              value={value.goalName}
              onChange={(e) => onChange({ ...value, goalName: e.target.value })}
              className={plainInputCls()}
            />
          </label>

          {/* Goal amount */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Goal Amount
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                $
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={value.goalAmount || ""}
                placeholder="0"
                onChange={setNum("goalAmount")}
                className={dollarInputCls()}
              />
            </div>
          </label>

          {/* Target weeks */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Target Timeline
            </span>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                value={value.targetWeeks}
                onChange={setNum("targetWeeks")}
                className={[
                  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-14 text-[14px] font-medium text-slate-900",
                  "outline-none transition-all duration-150",
                  "shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]",
                  "focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)]",
                ].join(" ")}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                weeks
              </span>
            </div>
          </label>

          {/* Weekly usable income */}
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
                onChange={setNum("weeklyUsableIncome")}
                className={dollarInputCls()}
              />
            </div>
          </label>

          {/* Weekly savings amount */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Your Weekly Savings
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                $
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={value.weeklySavingsAmount || ""}
                placeholder="0"
                onChange={setNum("weeklySavingsAmount")}
                className={dollarInputCls()}
              />
            </div>
          </label>
        </div>

        {/* Results */}
        {!hasGoal ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
            <p className="text-[14px] font-semibold text-slate-600">
              Enter a goal amount to see your savings plan
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {/* Projection hero */}
            <div className={`overflow-hidden rounded-xl ${statusColor.hero}`}>
              <div className="px-5 py-5">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest ${statusColor.chip}`}
                  >
                    {!hasSavings ? "Set a savings amount" : onPace ? "On Pace" : "Behind Pace"}
                  </span>
                </div>

                {value.goalName.trim() ? (
                  <p className="text-[13px] font-semibold text-white/60">
                    {value.goalName.trim()}
                  </p>
                ) : null}
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/50">
                  Projected Completion
                </p>
                <p className="mt-1 text-[2.4rem] font-black leading-none tracking-tight text-white">
                  {result.projectedWeeks !== null ? `${result.projectedWeeks} weeks` : "—"}
                </p>
                <p className="mt-2 max-w-md text-[13px] leading-5 text-white/70">
                  {projectionMessage(result.projectedWeeks, value.goalName, onPace)}
                </p>
              </div>

              {/* Progress bar */}
              {progressPct !== null && (
                <div className="border-t border-white/10 px-5 py-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-white/50">
                    <span>Pace vs. target timeline</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/50 transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Weekly Needed", value: fmt(result.weeklyGoalTarget) },
                { label: "Monthly Needed", value: fmt(result.monthlyGoalTarget) },
                {
                  label: "Your Weekly",
                  value: hasSavings ? fmt(value.weeklySavingsAmount) : "—",
                },
                {
                  label: "Weekly Gap",
                  value: hasSavings
                    ? `${result.goalGap >= 0 ? "+" : "-"}${fmt(result.goalGap)}`
                    : "—",
                  highlight: hasSavings
                    ? result.goalGap >= 0
                      ? "text-emerald-600"
                      : "text-amber-600"
                    : undefined,
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
