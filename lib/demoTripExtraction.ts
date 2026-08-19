import {
  DemoTripScenario,
  TripScreenshotExtraction,
  TripScreenshotExtractionResponse,
} from "@/types/trip";

export interface DemoTripExtractionScenario {
  id: DemoTripScenario;
  label: string;
  expectation: string;
  extraction: TripScreenshotExtraction;
}

export const DEMO_TRIP_EXTRACTIONS: Record<DemoTripScenario, DemoTripExtractionScenario> = {
  "weak-short-delivery": {
    id: "weak-short-delivery",
    label: "Weak short delivery",
    expectation: "Likely weak after time and distance.",
    extraction: {
      payout: 4.5,
      pickupDistanceMiles: 2,
      tripDistanceMiles: 2,
      estimatedTimeMinutes: 18,
      destinationCue: "Local short delivery",
      confidence: "medium",
      missingFields: [],
      warnings: [
        "Demo extraction: short offers like this can look acceptable before vehicle costs are included.",
      ],
      rawSummary:
        "Demo mode read a short local delivery offer with low payout, modest pickup distance, and 18 minutes of total time.",
    },
  },
  "steady-mid-distance": {
    id: "steady-mid-distance",
    label: "Steady mid-distance ride",
    expectation: "Often worth taking or close to target.",
    extraction: {
      payout: 16,
      pickupDistanceMiles: 1,
      tripDistanceMiles: 6,
      estimatedTimeMinutes: 21,
      destinationCue: "Steady mid-distance ride",
      confidence: "high",
      missingFields: [],
      warnings: [
        "Demo extraction: confirm traffic and drop-off direction before accepting in real life.",
      ],
      rawSummary:
        "Demo mode read a steady mid-distance ride with a strong payout, short pickup, and 21 minutes of total time.",
    },
  },
};

export function getDemoTripExtraction(
  scenario: DemoTripScenario = "steady-mid-distance",
  warning?: string
): TripScreenshotExtractionResponse {
  const selected = DEMO_TRIP_EXTRACTIONS[scenario] ?? DEMO_TRIP_EXTRACTIONS["steady-mid-distance"];

  return {
    extraction: {
      ...selected.extraction,
      warnings: warning
        ? [warning, ...selected.extraction.warnings]
        : [...selected.extraction.warnings],
      missingFields: [...selected.extraction.missingFields],
    },
    mode: "demo",
    demoScenario: selected.id,
  };
}

export function isDemoTripScenario(value: unknown): value is DemoTripScenario {
  return value === "weak-short-delivery" || value === "steady-mid-distance";
}
