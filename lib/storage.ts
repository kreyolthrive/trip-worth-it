import { BetaSignup, DriverDefaults, RecentTripCheck, TripInput } from "@/types/trip";
import { DEFAULT_DRIVER_DEFAULTS } from "./defaults";

const DRIVER_DEFAULTS_KEY = "trip-worth-it-driver-defaults";
const RECENT_TRIP_CHECKS_KEY = "trip-worth-it-recent-trip-checks";
const BETA_SIGNUPS_KEY = "trip-worth-it-beta-signups";
export const RECENT_TRIP_CHECKS_LIMIT = 5;
export const RECENT_TRIP_MERGE_WINDOW_MS = 10 * 60 * 1000;

export function loadDriverDefaults(): DriverDefaults {
  if (typeof window === "undefined") return DEFAULT_DRIVER_DEFAULTS;

  try {
    const raw = window.localStorage.getItem(DRIVER_DEFAULTS_KEY);
    if (!raw) return DEFAULT_DRIVER_DEFAULTS;
    return { ...DEFAULT_DRIVER_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DRIVER_DEFAULTS;
  }
}

export function saveDriverDefaults(defaults: DriverDefaults) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRIVER_DEFAULTS_KEY, JSON.stringify(defaults));
}

export function loadRecentTripChecks(): RecentTripCheck[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_TRIP_CHECKS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentTripCheck[];
  } catch {
    return [];
  }
}

export function saveRecentTripChecks(checks: RecentTripCheck[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_TRIP_CHECKS_KEY, JSON.stringify(checks));
}

function isSameTrip(a: TripInput, b: TripInput) {
  return (
    a.offerAmount === b.offerAmount &&
    a.pickupMiles === b.pickupMiles &&
    a.tripMiles === b.tripMiles &&
    a.totalMinutes === b.totalMinutes &&
    a.extraCosts === b.extraCosts &&
    a.tripType === b.tripType
  );
}

function parseTimestamp(isoString: string) {
  const timestamp = new Date(isoString).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function prependRecentTripCheck(check: RecentTripCheck) {
  const existing = loadRecentTripChecks();
  const incomingTime = parseTimestamp(check.createdAt);

  const mergeIndex = existing.findIndex((item) => {
    if (!isSameTrip(item.trip, check.trip)) return false;

    const existingTime = parseTimestamp(item.createdAt);
    if (existingTime === null || incomingTime === null) return false;

    return Math.abs(incomingTime - existingTime) <= RECENT_TRIP_MERGE_WINDOW_MS;
  });

  const withoutMerged =
    mergeIndex >= 0
      ? existing.filter((_, index) => index !== mergeIndex)
      : existing;

  const mergedCheck =
    mergeIndex >= 0
      ? {
          ...existing[mergeIndex],
          ...check,
          id: existing[mergeIndex].id,
        }
      : check;

  const next = [mergedCheck, ...withoutMerged].slice(0, RECENT_TRIP_CHECKS_LIMIT);
  saveRecentTripChecks(next);
  return next;
}

export function loadBetaSignups(): BetaSignup[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BETA_SIGNUPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as BetaSignup[];
  } catch {
    return [];
  }
}

export function appendBetaSignup(signup: BetaSignup) {
  const existing = loadBetaSignups();
  const isDuplicate = existing.some(
    (entry) => entry.email.toLowerCase() === signup.email.toLowerCase()
  );

  const next = isDuplicate ? existing : [signup, ...existing];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(BETA_SIGNUPS_KEY, JSON.stringify(next));
  }

  return next;
}
