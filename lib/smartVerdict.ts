import { BucketsInput } from "@/types/buckets";
import { IncomeTargetInput, ReservePlannerInput } from "@/types/planner";
import { DriverDefaults, TripResult } from "@/types/trip";

function fmt(value: number) {
  return `$${value.toFixed(2)}`;
}

export interface WeeklyMeaningContext {
  reserve: ReservePlannerInput;
  incomeTarget: IncomeTargetInput;
  buckets: BucketsInput;
}

export function smartVerdictCopy(result: TripResult, driver: DriverDefaults) {
  const netHr = fmt(result.metrics.netPerHour);
  const tgtHr = fmt(driver.minNetPerHour);
  const netMi = fmt(result.metrics.netPerMile);
  const tgtMi = fmt(driver.minNetPerMile);

  switch (result.verdict) {
    case "WORTH_TAKING":
      return `This offer clears your targets and looks worth taking. It lands at ${netHr}/hr and ${netMi}/mi after estimated costs.`;
    case "BORDERLINE":
      return `This trip may only make sense if it helps your direction or weekly target. It is close to your floor of ${tgtHr}/hr and ${tgtMi}/mi.`;
    case "NOT_WORTH_IT":
      return `This offer is likely too weak for the time and distance involved. It comes in at ${netHr}/hr and ${netMi}/mi after estimated costs.`;
    default:
      return "Review the details before deciding.";
  }
}

export function weeklyMeaningCopy(
  result: TripResult,
  context: WeeklyMeaningContext
): string[] {
  const lines: string[] = [];
  const weeklyUsableTarget = context.incomeTarget.weeklyUsableIncome;
  const weeklyReserveBase =
    context.reserve.weeklyNetIncome || context.buckets.weeklyNetIncome || 0;
  const totalReservePct =
    context.buckets.repairPct +
    context.buckets.taxPct +
    context.buckets.emergencyPct +
    context.buckets.goalPct +
    context.buckets.customPct;

  if (result.verdict === "WORTH_TAKING") {
    lines.push("This kind of trip supports your usable income target.");
  } else if (result.verdict === "BORDERLINE") {
    lines.push("Trips like this may slow down your weekly target pace.");
  } else {
    lines.push("Weak offers like this can reduce what you actually keep after costs.");
  }

  if (weeklyUsableTarget > 0) {
    const pct = Math.max(0, Math.round((result.metrics.netEarnings / weeklyUsableTarget) * 100));
    lines.push(`One trip like this covers about ${pct}% of the weekly usable income target you saved in Planner.`);
  } else {
    lines.push("Set a weekly usable income target in Planner to see how each accepted offer affects your pace.");
  }

  if (weeklyReserveBase > 0 && totalReservePct > 0) {
    const reserveDollars = result.metrics.netEarnings * (Math.min(totalReservePct, 100) / 100);
    lines.push(
      `${fmt(Math.max(0, reserveDollars))} of this trip would be reserved if you follow your current bucket percentages.`
    );
  } else if (result.verdict === "NOT_WORTH_IT") {
    lines.push("If you rely on trips like this too often, your reserve progress may stay weak.");
  } else {
    lines.push("Add reserve or bucket settings to translate verdicts into weekly savings impact.");
  }

  return lines;
}
