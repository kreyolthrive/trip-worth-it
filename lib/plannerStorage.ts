import { GoalPlannerInput, IncomeTargetInput, ReservePlannerInput } from "@/types/planner";

const KEYS = {
  reserve: "trip-worth-it-reserve-planner",
  incomeTarget: "trip-worth-it-income-target-planner",
  goalPlanner: "trip-worth-it-goal-planner",
} as const;

export const DEFAULT_RESERVE_INPUT: ReservePlannerInput = {
  weeklyMilesDriven: 0,
  weeklyNetIncome: 0,
  repairReservePct: 10,
  taxReservePct: 15,
  emergencyReservePct: 5,
};

export const DEFAULT_INCOME_TARGET_INPUT: IncomeTargetInput = {
  rent: 0,
  groceries: 0,
  gas: 0,
  insurance: 0,
  carPayment: 0,
  phone: 0,
  debt: 0,
  other: 0,
  targetMonthlySavings: 0,
  weeklyUsableIncome: 0,
  workDaysPerWeek: 5,
};

export const DEFAULT_GOAL_INPUT: GoalPlannerInput = {
  goalName: "",
  goalAmount: 0,
  targetWeeks: 12,
  weeklyUsableIncome: 0,
  weeklySavingsAmount: 0,
};

function safeLoad<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function safeSave(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — silently skip
  }
}

export function loadReservePlannerInput(): ReservePlannerInput {
  return safeLoad(KEYS.reserve, DEFAULT_RESERVE_INPUT);
}
export function saveReservePlannerInput(value: ReservePlannerInput): void {
  safeSave(KEYS.reserve, value);
}

export function loadIncomeTargetInput(): IncomeTargetInput {
  return safeLoad(KEYS.incomeTarget, DEFAULT_INCOME_TARGET_INPUT);
}
export function saveIncomeTargetInput(value: IncomeTargetInput): void {
  safeSave(KEYS.incomeTarget, value);
}

export function loadGoalPlannerInput(): GoalPlannerInput {
  return safeLoad(KEYS.goalPlanner, DEFAULT_GOAL_INPUT);
}
export function saveGoalPlannerInput(value: GoalPlannerInput): void {
  safeSave(KEYS.goalPlanner, value);
}
