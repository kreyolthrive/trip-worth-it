import { BucketsInput } from "@/types/buckets";
import { DEFAULT_BUCKETS_INPUT } from "@/lib/buckets";

const KEY = "trip-worth-it-savings-buckets";

export function loadBucketsInput(): BucketsInput {
  if (typeof window === "undefined") return DEFAULT_BUCKETS_INPUT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BUCKETS_INPUT;
    return { ...DEFAULT_BUCKETS_INPUT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BUCKETS_INPUT;
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
