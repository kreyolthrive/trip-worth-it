"use client";

import { useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import GoalSavingsPlanner from "@/components/planner/GoalSavingsPlanner";
import IncomeTargetPlanner from "@/components/planner/IncomeTargetPlanner";
import ReservePlanner from "@/components/planner/ReservePlanner";
import { calculateReserves } from "@/lib/planner";
import { computeRecentCheckStats } from "@/lib/storage";
import {
  DEFAULT_GOAL_INPUT,
  DEFAULT_INCOME_TARGET_INPUT,
  DEFAULT_RESERVE_INPUT,
  loadGoalPlannerInput,
  loadIncomeTargetInput,
  loadReservePlannerInput,
  saveGoalPlannerInput,
  saveIncomeTargetInput,
  saveReservePlannerInput,
} from "@/lib/plannerStorage";
import { GoalPlannerInput, IncomeTargetInput, ReservePlannerInput } from "@/types/planner";

export default function PlannerPage() {
  const tripStats = useMemo(() => computeRecentCheckStats(), []);

  const [reserveInput, setReserveInput] = useState<ReservePlannerInput>(
    () => loadReservePlannerInput()
  );
  const [incomeTargetInput, setIncomeTargetInput] = useState<IncomeTargetInput>(
    () => loadIncomeTargetInput()
  );
  const [goalInput, setGoalInput] = useState<GoalPlannerInput>(
    () => loadGoalPlannerInput()
  );

  const reserveResult = useMemo(() => calculateReserves(reserveInput), [reserveInput]);

  const suggestedUsableIncome =
    reserveInput.weeklyNetIncome > 0 ? reserveResult.usableWeeklyIncome : null;

  const handleReserveChange = (next: ReservePlannerInput) => {
    setReserveInput(next);
    saveReservePlannerInput(next);
  };

  const handleIncomeTargetChange = (next: IncomeTargetInput) => {
    setIncomeTargetInput(next);
    saveIncomeTargetInput(next);
  };

  const handleGoalChange = (next: GoalPlannerInput) => {
    setGoalInput(next);
    saveGoalPlannerInput(next);
  };

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#eef1f7] text-slate-900">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 panel-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-indigo-400/15 blur-[100px]" />

      <div className="relative mx-auto w-full max-w-[860px] px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
        <AppNav />

        {/* Trip stats context banner */}
        {tripStats ? (
          <div className="card-enter mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">
              From your trip checks
            </span>
            <div className="flex flex-wrap gap-4 text-[13px] font-semibold text-slate-700">
              <span>
                <span className="text-indigo-600">{tripStats.count}</span> trips checked
              </span>
              <span>
                Avg net{" "}
                <span className="text-indigo-600">
                  ${tripStats.avgNetPerTrip.toFixed(2)}
                </span>
              </span>
              <span>
                <span className="text-indigo-600">{tripStats.worthTakingPct}%</span>{" "}
                worth taking
              </span>
            </div>
          </div>
        ) : null}

        {/* Header */}
        <header className="card-enter mb-8 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-[0_8px_16px_-4px_rgba(15,23,42,0.3),0_40px_80px_-12px_rgba(15,23,42,0.4)]">
          <div className="px-7 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-400">
                  Trip Worth-It
                </p>
                <p className="text-[12px] text-slate-400">Reserve &amp; Goal Planner</p>
              </div>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-slate-300 sm:inline-flex">
                Beta · Local-only data
              </span>
            </div>

            <h1 className="mt-5 text-[2.2rem] font-black leading-[1.1] tracking-tight text-white sm:text-4xl">
              Know what to keep.
              <br />
              <span className="text-indigo-400">Know what to save.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-300">
              Set a reserve buffer so slow weeks don&apos;t break you. Compare your real income against
              monthly costs. Track progress toward a specific goal — no spreadsheet required.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Build a safety reserve",
                "Hit your monthly income target",
                "Save toward a specific goal",
              ].map((chip) => (
                <span
                  key={chip}
                  className="fade-enter inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-slate-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Planner sections */}
        <div className="space-y-5">
          <ReservePlanner
            value={reserveInput}
            onChange={handleReserveChange}
            onReset={() => handleReserveChange(DEFAULT_RESERVE_INPUT)}
          />

          <IncomeTargetPlanner
            value={incomeTargetInput}
            onChange={handleIncomeTargetChange}
            onReset={() => handleIncomeTargetChange(DEFAULT_INCOME_TARGET_INPUT)}
            suggestedUsableIncome={suggestedUsableIncome}
          />

          <GoalSavingsPlanner
            value={goalInput}
            onChange={handleGoalChange}
            onReset={() => handleGoalChange(DEFAULT_GOAL_INPUT)}
            suggestedUsableIncome={suggestedUsableIncome}
          />
        </div>
      </div>
    </main>
  );
}
