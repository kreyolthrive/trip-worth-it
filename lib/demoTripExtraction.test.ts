import { describe, expect, it } from "vitest";
import {
  DEMO_TRIP_EXTRACTIONS,
  getDemoTripExtraction,
  isDemoTripScenario,
} from "./demoTripExtraction";
import { calculateTripMetrics } from "./calculator";
import { DEFAULT_DRIVER_DEFAULTS } from "./defaults";
import { evaluateTrip } from "./verdict";
import { TripInput, TripScreenshotExtraction } from "@/types/trip";

function extractionToTrip(extraction: TripScreenshotExtraction): TripInput {
  return {
    offerAmount: extraction.payout ?? 0,
    pickupMiles: extraction.pickupDistanceMiles ?? 0,
    tripMiles: extraction.tripDistanceMiles ?? 0,
    totalMinutes: extraction.estimatedTimeMinutes ?? 0,
    extraCosts: 0,
    tripType: "ride",
  };
}

describe("demo trip extraction", () => {
  it("provides deterministic weak and decent demo scenarios", () => {
    expect(DEMO_TRIP_EXTRACTIONS["weak-short-delivery"].extraction.payout).toBe(4.5);
    expect(DEMO_TRIP_EXTRACTIONS["steady-mid-distance"].extraction.payout).toBe(16);
  });

  it("wraps selected demo extraction with mode metadata", () => {
    expect(getDemoTripExtraction("weak-short-delivery")).toMatchObject({
      mode: "demo",
      demoScenario: "weak-short-delivery",
      extraction: {
        pickupDistanceMiles: 2,
        tripDistanceMiles: 2,
        estimatedTimeMinutes: 18,
      },
    });
  });

  it("guards demo scenario ids", () => {
    expect(isDemoTripScenario("steady-mid-distance")).toBe(true);
    expect(isDemoTripScenario("unknown")).toBe(false);
  });

  it("drives predictable verdicts through the existing trip engine", () => {
    const weakTrip = extractionToTrip(
      DEMO_TRIP_EXTRACTIONS["weak-short-delivery"].extraction
    );
    const decentTrip = extractionToTrip(
      DEMO_TRIP_EXTRACTIONS["steady-mid-distance"].extraction
    );

    const weakMetrics = calculateTripMetrics(weakTrip, DEFAULT_DRIVER_DEFAULTS);
    const decentMetrics = calculateTripMetrics(decentTrip, DEFAULT_DRIVER_DEFAULTS);

    expect(evaluateTrip(weakTrip, DEFAULT_DRIVER_DEFAULTS, weakMetrics).verdict).toBe(
      "NOT_WORTH_IT"
    );
    expect(evaluateTrip(decentTrip, DEFAULT_DRIVER_DEFAULTS, decentMetrics).verdict).toBe(
      "WORTH_TAKING"
    );
  });
});
