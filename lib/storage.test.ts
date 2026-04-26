import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_DRIVER_DEFAULTS } from "./defaults";
import {
  RECENT_TRIP_CHECKS_LIMIT,
  appendBetaSignup,
  loadDriverDefaults,
  loadRecentTripChecks,
  prependRecentTripCheck,
  saveDriverDefaults,
} from "./storage";
import { RecentTripCheck } from "../types/trip";

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

function mockWindow() {
  const localStorage = new LocalStorageMock();
  const globalWithWindow = globalThis as typeof globalThis & {
    window?: { localStorage: LocalStorageMock };
  };

  globalWithWindow.window = { localStorage };
  return localStorage;
}

function makeCheck(overrides?: Partial<RecentTripCheck>): RecentTripCheck {
  return {
    id: overrides?.id ?? `id-${Math.random()}`,
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    verdict: overrides?.verdict ?? "BORDERLINE",
    estimatedNet: overrides?.estimatedNet ?? 10,
    tripType: overrides?.tripType ?? "ride",
    trip: overrides?.trip ?? {
      offerAmount: 10,
      pickupMiles: 1,
      tripMiles: 5,
      totalMinutes: 20,
      extraCosts: 0,
      tripType: "ride",
    },
  };
}

describe("storage", () => {
  beforeEach(() => {
    mockWindow().clear();
  });

  it("loads default driver defaults when nothing is saved", () => {
    expect(loadDriverDefaults()).toEqual(DEFAULT_DRIVER_DEFAULTS);
  });

  it("saves and loads driver defaults", () => {
    const next = {
      ...DEFAULT_DRIVER_DEFAULTS,
      costPerMile: 0.45,
      minNetPerMile: 1.5,
      minNetPerHour: 27,
    };

    saveDriverDefaults(next);
    expect(loadDriverDefaults()).toEqual(next);
  });

  it("keeps only the most recent 5 checks", () => {
    for (let index = 0; index < RECENT_TRIP_CHECKS_LIMIT + 2; index += 1) {
      prependRecentTripCheck(
        makeCheck({
          id: `id-${index}`,
          createdAt: new Date(Date.now() + index * 1000).toISOString(),
          trip: {
            offerAmount: 10 + index,
            pickupMiles: 1,
            tripMiles: 5,
            totalMinutes: 20,
            extraCosts: 0,
            tripType: "ride",
          },
        })
      );
    }

    const checks = loadRecentTripChecks();
    expect(checks).toHaveLength(RECENT_TRIP_CHECKS_LIMIT);
    expect(checks[0].id).toBe(`id-${RECENT_TRIP_CHECKS_LIMIT + 1}`);
  });

  it("merges identical trip checks submitted within a short window", () => {
    const now = Date.now();

    const first = makeCheck({
      id: "first",
      createdAt: new Date(now).toISOString(),
      estimatedNet: 8,
    });

    const second = makeCheck({
      id: "second",
      createdAt: new Date(now + 60_000).toISOString(),
      estimatedNet: 12,
      verdict: "NOT_WORTH_IT",
      trip: first.trip,
    });

    prependRecentTripCheck(first);
    const merged = prependRecentTripCheck(second);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("first");
    expect(merged[0].estimatedNet).toBe(12);
    expect(merged[0].verdict).toBe("NOT_WORTH_IT");
  });

  it("dedupes beta signups by email case-insensitively", () => {
    appendBetaSignup({ email: "driver@example.com", submittedAt: new Date().toISOString() });
    const next = appendBetaSignup({
      email: "DRIVER@example.com",
      submittedAt: new Date().toISOString(),
    });

    expect(next).toHaveLength(1);
    expect(next[0].email).toBe("driver@example.com");
  });
});
