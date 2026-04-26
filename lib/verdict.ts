import {
  DriverDefaults,
  ReasonCode,
  TripInput,
  TripMetrics,
  TripResult,
  Verdict,
} from "@/types/trip";

function isNearThreshold(value: number, threshold: number, tolerance = 0.1) {
  return value >= threshold * (1 - tolerance);
}

export function evaluateTrip(
  trip: TripInput,
  driver: DriverDefaults,
  metrics: TripMetrics
): TripResult {
  const belowPerMile = metrics.netPerMile < driver.minNetPerMile;
  const belowPerHour = metrics.netPerHour < driver.minNetPerHour;
  const severePickup = metrics.pickupRatio > 0.4;
  const weakNet =
    metrics.netEarnings <= 0 || metrics.netEarnings < trip.offerAmount * 0.35;

  let verdict: Verdict = "BORDERLINE";
  let primaryReason: ReasonCode = "MIXED_BORDERLINE";
  const secondaryReasons: ReasonCode[] = [];
  const explanationLines: string[] = [];

  if (
    metrics.netEarnings > 0 &&
    !belowPerMile &&
    !belowPerHour &&
    !severePickup
  ) {
    verdict = "WORTH_TAKING";
    primaryReason = "STRONG_VALUE";
    explanationLines.push("Payout clears your hourly and per-mile targets.");
    explanationLines.push("Pickup distance is reasonable.");
    explanationLines.push("Estimated net return looks strong.");
  } else if (
    metrics.netEarnings <= 0 ||
    (belowPerMile && belowPerHour) ||
    (severePickup && belowPerMile)
  ) {
    verdict = "NOT_WORTH_IT";

    if (severePickup && trip.pickupMiles >= trip.tripMiles) {
      primaryReason = "PICKUP_TOO_LONG";
      explanationLines.push(
        "Pickup distance is taking too much value out of this trip."
      );
      explanationLines.push(
        "Too many unpaid miles happen before the trip starts."
      );
      if (belowPerMile) secondaryReasons.push("LOW_PAYOUT");
    } else if (belowPerHour && !severePickup && !belowPerMile) {
      primaryReason = "WEAK_TIME_RETURN";
      explanationLines.push("This trip pays too little for the time involved.");
      explanationLines.push("Estimated hourly return falls below your target.");
    } else if (weakNet && trip.offerAmount > 0) {
      primaryReason = "LOW_NET_AFTER_COSTS";
      explanationLines.push("Costs take too much out of this payout.");
      explanationLines.push("This trip looks better gross than it does net.");
      if (belowPerMile) secondaryReasons.push("LOW_PAYOUT");
    } else {
      primaryReason = "LOW_PAYOUT";
      explanationLines.push("Payout is too low for the effort involved.");
      explanationLines.push("Estimated trip value falls below your targets.");
      if (belowPerHour) secondaryReasons.push("WEAK_TIME_RETURN");
    }
  } else {
    verdict = "BORDERLINE";

    if (severePickup) {
      primaryReason = "PICKUP_TOO_LONG";
      explanationLines.push("Pickup distance weakens an otherwise decent offer.");
      explanationLines.push("This may only make sense during a slow period.");
    } else if (belowPerHour && !belowPerMile) {
      primaryReason = "WEAK_TIME_RETURN";
      explanationLines.push(
        "The trip may be acceptable, but the hourly return is weak."
      );
      explanationLines.push("It is close to your threshold, but not clearly strong.");
    } else if (belowPerMile && !belowPerHour) {
      primaryReason = "LOW_PAYOUT";
      explanationLines.push(
        "The offer is close, but the payout is not especially efficient."
      );
      explanationLines.push("This trip may work, but it does not stand out.");
    } else {
      primaryReason = "MIXED_BORDERLINE";
      explanationLines.push(
        "This trip is close to your targets, but not clearly strong."
      );
      explanationLines.push(
        "It may work depending on traffic and current demand."
      );
    }
  }

  if (
    verdict === "BORDERLINE" &&
    isNearThreshold(metrics.netPerMile, driver.minNetPerMile) &&
    isNearThreshold(metrics.netPerHour, driver.minNetPerHour)
  ) {
    explanationLines.push(
      "It is near your thresholds, but not comfortably above them."
    );
  }

  return {
    verdict,
    primaryReason,
    secondaryReasons,
    explanationLines,
    metrics,
  };
}