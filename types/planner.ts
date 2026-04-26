export interface ReservePlannerInput {
  weeklyMilesDriven: number;
  weeklyNetIncome: number;
  repairReservePct: number;
  taxReservePct: number;
  emergencyReservePct: number;
}

export interface ReservePlannerResult {
  repairReserve: number;
  taxReserve: number;
  emergencyReserve: number;
  totalWeeklyReserve: number;
  usableWeeklyIncome: number;
  monthlyRepairReserve: number;
  monthlyTaxReserve: number;
  monthlyEmergencyReserve: number;
  totalMonthlyReserve: number;
  usableMonthlyIncome: number;
}

export interface IncomeTargetInput {
  rent: number;
  groceries: number;
  gas: number;
  insurance: number;
  carPayment: number;
  phone: number;
  debt: number;
  other: number;
  targetMonthlySavings: number;
  weeklyUsableIncome: number;
  workDaysPerWeek: number;
}

export interface IncomeTargetResult {
  totalMonthlyNeed: number;
  weeklyTarget: number;
  dailyTarget: number;
  onTrack: boolean;
  weeklyGap: number;
  monthlyGap: number;
}

export interface GoalPlannerInput {
  goalName: string;
  goalAmount: number;
  targetWeeks: number;
  weeklyUsableIncome: number;
  weeklySavingsAmount: number;
}

export interface GoalPlannerResult {
  weeklyGoalTarget: number;
  monthlyGoalTarget: number;
  goalGap: number;
  projectedWeeks: number | null;
}
