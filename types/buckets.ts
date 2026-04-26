export interface BucketsInput {
  weeklyNetIncome: number;
  repairPct: number;
  taxPct: number;
  emergencyPct: number;
  goalPct: number;
  customPct: number;
}

export interface BucketsResult {
  totalAllocPct: number;
  totalReserved: number;
  usableIncome: number;
  unallocatedPct: number;
  unallocatedAmount: number;
  monthlyTotalReserved: number;
  monthlyUsableIncome: number;
  repairAmount: number;
  taxAmount: number;
  emergencyAmount: number;
  goalAmount: number;
  customAmount: number;
  monthlyRepair: number;
  monthlyTax: number;
  monthlyEmergency: number;
  monthlyGoal: number;
  monthlyCustom: number;
  largestBucketLabel: string;
  isOverAllocated: boolean;
}

export type PresetKey = "conservative" | "balanced" | "growth";
