import {
  GoalPlannerInput,
  GoalPlannerResult,
  IncomeTargetInput,
  IncomeTargetResult,
  ReservePlannerInput,
  ReservePlannerResult,
} from "@/types/planner";

export const WEEKS_PER_MONTH = 4.33;

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateReserves(input: ReservePlannerInput): ReservePlannerResult {
  const { weeklyNetIncome, repairReservePct, taxReservePct, emergencyReservePct } = input;

  const repairReserve = r2(weeklyNetIncome * (repairReservePct / 100));
  const taxReserve = r2(weeklyNetIncome * (taxReservePct / 100));
  const emergencyReserve = r2(weeklyNetIncome * (emergencyReservePct / 100));
  const totalWeeklyReserve = r2(repairReserve + taxReserve + emergencyReserve);
  const usableWeeklyIncome = r2(weeklyNetIncome - totalWeeklyReserve);

  return {
    repairReserve,
    taxReserve,
    emergencyReserve,
    totalWeeklyReserve,
    usableWeeklyIncome,
    monthlyRepairReserve: r2(repairReserve * WEEKS_PER_MONTH),
    monthlyTaxReserve: r2(taxReserve * WEEKS_PER_MONTH),
    monthlyEmergencyReserve: r2(emergencyReserve * WEEKS_PER_MONTH),
    totalMonthlyReserve: r2(totalWeeklyReserve * WEEKS_PER_MONTH),
    usableMonthlyIncome: r2(usableWeeklyIncome * WEEKS_PER_MONTH),
  };
}

export function calculateIncomeTarget(input: IncomeTargetInput): IncomeTargetResult {
  const {
    rent,
    groceries,
    gas,
    insurance,
    carPayment,
    phone,
    debt,
    other,
    targetMonthlySavings,
    weeklyUsableIncome,
    workDaysPerWeek,
  } = input;

  const totalMonthlyNeed = r2(
    rent + groceries + gas + insurance + carPayment + phone + debt + other + targetMonthlySavings
  );
  const weeklyTarget = r2(totalMonthlyNeed / WEEKS_PER_MONTH);
  const safeDays = workDaysPerWeek > 0 ? workDaysPerWeek : 5;
  const dailyTarget = r2(weeklyTarget / safeDays);
  const weeklyGap = r2(weeklyUsableIncome - weeklyTarget);
  const monthlyGap = r2(weeklyUsableIncome * WEEKS_PER_MONTH - totalMonthlyNeed);

  return {
    totalMonthlyNeed,
    weeklyTarget,
    dailyTarget,
    onTrack: weeklyUsableIncome >= weeklyTarget,
    weeklyGap,
    monthlyGap,
  };
}

export function calculateGoal(input: GoalPlannerInput): GoalPlannerResult {
  const { goalAmount, targetWeeks, weeklySavingsAmount } = input;

  const safeTargetWeeks = targetWeeks > 0 ? targetWeeks : 1;
  const weeklyGoalTarget = r2(goalAmount / safeTargetWeeks);
  const monthlyGoalTarget = r2(weeklyGoalTarget * WEEKS_PER_MONTH);
  const goalGap = r2(weeklySavingsAmount - weeklyGoalTarget);
  const projectedWeeks =
    weeklySavingsAmount > 0 ? Math.ceil(goalAmount / weeklySavingsAmount) : null;

  return { weeklyGoalTarget, monthlyGoalTarget, goalGap, projectedWeeks };
}
