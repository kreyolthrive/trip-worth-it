import { BucketsInput, BucketsResult, PresetKey } from "@/types/buckets";

export const WEEKS_PER_MONTH = 4.33;

export const DEFAULT_BUCKETS_INPUT: BucketsInput = {
  weeklyNetIncome: 0,
  repairPct: 10,
  taxPct: 15,
  emergencyPct: 5,
  goalPct: 10,
  customPct: 0,
};

export const PRESETS: Record<PresetKey, Omit<BucketsInput, "weeklyNetIncome" | "customPct">> = {
  conservative: { repairPct: 12, taxPct: 18, emergencyPct: 8, goalPct: 5 },
  balanced: { repairPct: 10, taxPct: 15, emergencyPct: 5, goalPct: 10 },
  growth: { repairPct: 8, taxPct: 15, emergencyPct: 5, goalPct: 15 },
};

export function calculateBuckets(input: BucketsInput): BucketsResult {
  const { weeklyNetIncome, repairPct, taxPct, emergencyPct, goalPct, customPct } = input;
  const inc = Math.max(0, weeklyNetIncome);

  const totalAllocPct = repairPct + taxPct + emergencyPct + goalPct + customPct;

  const repairAmount = inc * (repairPct / 100);
  const taxAmount = inc * (taxPct / 100);
  const emergencyAmount = inc * (emergencyPct / 100);
  const goalAmount = inc * (goalPct / 100);
  const customAmount = inc * (customPct / 100);

  const totalReserved = repairAmount + taxAmount + emergencyAmount + goalAmount + customAmount;
  const usableIncome = inc - totalReserved;
  const unallocatedPct = Math.max(0, 100 - totalAllocPct);
  const unallocatedAmount = inc * (unallocatedPct / 100);

  const monthlyTotalReserved = totalReserved * WEEKS_PER_MONTH;
  const monthlyUsableIncome = usableIncome * WEEKS_PER_MONTH;

  const bucketMap: [string, number][] = [
    ["Repair Reserve", repairPct],
    ["Tax Reserve", taxPct],
    ["Emergency Reserve", emergencyPct],
    ["Goal Savings", goalPct],
  ];
  if (customPct > 0) bucketMap.push(["Custom", customPct]);
  const largest = bucketMap.reduce((a, b) => (b[1] > a[1] ? b : a), bucketMap[0]);

  return {
    totalAllocPct,
    totalReserved,
    usableIncome,
    unallocatedPct,
    unallocatedAmount,
    monthlyTotalReserved,
    monthlyUsableIncome,
    repairAmount,
    taxAmount,
    emergencyAmount,
    goalAmount,
    customAmount,
    monthlyRepair: repairAmount * WEEKS_PER_MONTH,
    monthlyTax: taxAmount * WEEKS_PER_MONTH,
    monthlyEmergency: emergencyAmount * WEEKS_PER_MONTH,
    monthlyGoal: goalAmount * WEEKS_PER_MONTH,
    monthlyCustom: customAmount * WEEKS_PER_MONTH,
    largestBucketLabel: largest[0],
    isOverAllocated: totalAllocPct > 100,
  };
}
