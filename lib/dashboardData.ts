import { loadRecentTripChecks, computeRecentCheckStats } from "./storage";
import type { RecentCheckStats } from "./storage";
import {
  loadReservePlannerInput,
  loadIncomeTargetInput,
  loadGoalPlannerInput,
} from "./plannerStorage";
import { loadBucketsInput } from "./bucketsStorage";
import { calculateReserves, calculateIncomeTarget, calculateGoal } from "./planner";
import { calculateBuckets } from "./buckets";
import type { RecentTripCheck } from "@/types/trip";
import type {
  ReservePlannerInput,
  ReservePlannerResult,
  IncomeTargetInput,
  IncomeTargetResult,
  GoalPlannerInput,
  GoalPlannerResult,
} from "@/types/planner";
import type { BucketsInput, BucketsResult } from "@/types/buckets";

export interface DashboardSnapshot {
  // Trips
  lastTrip: RecentTripCheck | null;
  tripStats: RecentCheckStats | null;
  hasTripData: boolean;

  // Reserve planner
  reserveInput: ReservePlannerInput;
  reserveResult: ReservePlannerResult;
  hasReservePlanner: boolean;

  // Income target
  incomeTargetInput: IncomeTargetInput;
  incomeTargetResult: IncomeTargetResult;
  hasIncomeTarget: boolean;

  // Goal
  goalInput: GoalPlannerInput;
  goalResult: GoalPlannerResult;
  hasGoal: boolean;

  // Buckets
  bucketsInput: BucketsInput;
  bucketsResult: BucketsResult;
  hasBuckets: boolean;

  // Derived
  effectiveWeeklyIncome: number;
  dashboardWeeklyGap: number;
  dashboardOnTrack: boolean;

  nudges: string[];
}

export function loadDashboardSnapshot(): DashboardSnapshot {
  const trips = loadRecentTripChecks();
  const lastTrip = trips[0] ?? null;
  const tripStats = computeRecentCheckStats();
  const hasTripData = trips.length > 0;

  const reserveInput = loadReservePlannerInput();
  const hasReservePlanner = reserveInput.weeklyNetIncome > 0;
  const reserveResult = calculateReserves(reserveInput);

  const incomeTargetInput = loadIncomeTargetInput();
  const hasIncomeTarget = [
    incomeTargetInput.rent,
    incomeTargetInput.groceries,
    incomeTargetInput.gas,
    incomeTargetInput.insurance,
    incomeTargetInput.carPayment,
    incomeTargetInput.phone,
    incomeTargetInput.debt,
    incomeTargetInput.other,
  ].some((v) => v > 0);
  const incomeTargetResult = calculateIncomeTarget(incomeTargetInput);

  const goalInput = loadGoalPlannerInput();
  const hasGoal = goalInput.goalAmount > 0;
  const goalResult = calculateGoal(goalInput);

  const bucketsInput = loadBucketsInput();
  const hasBuckets = bucketsInput.weeklyNetIncome > 0;
  const bucketsResult = calculateBuckets(bucketsInput);

  const effectiveWeeklyIncome =
    incomeTargetInput.weeklyUsableIncome > 0
      ? incomeTargetInput.weeklyUsableIncome
      : hasBuckets
      ? bucketsResult.usableIncome
      : hasReservePlanner
      ? reserveResult.usableWeeklyIncome
      : 0;

  const dashboardWeeklyGap =
    hasIncomeTarget && incomeTargetResult.weeklyTarget > 0
      ? effectiveWeeklyIncome - incomeTargetResult.weeklyTarget
      : 0;
  const dashboardOnTrack = dashboardWeeklyGap >= 0;

  const nudges: string[] = [];

  if (!hasTripData && !hasReservePlanner && !hasBuckets) {
    nudges.push(
      "Check a few trips and set up your planner to get personalized weekly guidance."
    );
  } else {
    if (tripStats && tripStats.worthTakingPct < 50 && trips.length >= 2) {
      nudges.push(
        `${100 - tripStats.worthTakingPct}% of your recent trip checks were borderline or not worth it. Consider reviewing your minimum targets.`
      );
    }

    if (hasReservePlanner && reserveInput.emergencyReservePct < 5) {
      nudges.push(
        "Your emergency reserve looks light. Even a small weekly buffer protects you from a slow week."
      );
    }

    if (
      hasIncomeTarget &&
      incomeTargetResult.weeklyTarget > 0 &&
      effectiveWeeklyIncome > 0 &&
      !dashboardOnTrack
    ) {
      nudges.push(
        `You're about $${Math.abs(dashboardWeeklyGap).toFixed(0)}/week below your income target. Try prioritizing higher-value trips.`
      );
    }

    if (
      hasGoal &&
      goalResult.projectedWeeks !== null &&
      goalInput.targetWeeks > 0 &&
      goalResult.projectedWeeks > goalInput.targetWeeks
    ) {
      nudges.push(
        `At your current savings pace, you may miss your goal deadline. Consider saving $${Math.abs(goalResult.goalGap).toFixed(0)} more per week.`
      );
    }

    if (hasBuckets && bucketsInput.taxPct < 10) {
      nudges.push(
        "Your tax reserve looks low. Most gig drivers owe 15–20% in self-employment taxes."
      );
    }

    if (!hasBuckets && (hasReservePlanner || hasTripData)) {
      nudges.push(
        "Set up Savings Buckets to see exactly where your weekly income should go."
      );
    }

    if (hasBuckets && bucketsResult.isOverAllocated) {
      nudges.push(
        "Your savings bucket allocations exceed 100%. Adjust your percentages in Savings Buckets."
      );
    }
  }

  return {
    lastTrip,
    tripStats,
    hasTripData,
    reserveInput,
    reserveResult,
    hasReservePlanner,
    incomeTargetInput,
    incomeTargetResult,
    hasIncomeTarget,
    goalInput,
    goalResult,
    hasGoal,
    bucketsInput,
    bucketsResult,
    hasBuckets,
    effectiveWeeklyIncome,
    dashboardWeeklyGap,
    dashboardOnTrack,
    nudges: nudges.slice(0, 4),
  };
}
