import { BucketsInput } from "@/types/buckets";
import { DEFAULT_BUCKETS_INPUT } from "@/lib/buckets";
import { hasSavedDriverProfile, loadDriverProfile, profileToBucketsInput } from "@/lib/profile";

const KEY = "trip-worth-it-savings-buckets";

export function loadBucketsInput(): BucketsInput {
  if (typeof window === "undefined") return DEFAULT_BUCKETS_INPUT;
  const fallback = hasSavedDriverProfile()
    ? profileToBucketsInput(loadDriverProfile())
    : DEFAULT_BUCKETS_INPUT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function saveBucketsInput(input: BucketsInput): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(input));
  } catch {
    // storage full or unavailable
  }
}
