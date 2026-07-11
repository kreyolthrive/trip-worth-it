export type ParticipationTier = "free" | "affordable" | "boosted" | "premium";

export type BusinessRecommendationInput = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  latitude: number | null;
  longitude: number | null;
  rating?: number | null;
  localnessScore?: number | null;
  qualityScore?: number | null;
  participationTier?: ParticipationTier | null;
  isVerified?: boolean | null;
  isActive?: boolean | null;
};

export type RiderDiscoveryContext = {
  latitude: number;
  longitude: number;
  maxDistanceMeters?: number;
  categories?: string[];
  timeIso?: string;
  limit?: number;
};

export type ScoredBusinessRecommendation = BusinessRecommendationInput & {
  distanceMeters: number;
  distanceScore: number;
  ratingScore: number;
  localnessScoreFinal: number;
  qualityScoreFinal: number;
  timeRelevanceScore: number;
  paidBoostScore: number;
  score: number;
};

const DEFAULT_MAX_DISTANCE_METERS = 5000;
const DEFAULT_LIMIT = 10;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

export function getDistanceMeters(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
) {
  const earthRadiusMeters = 6371000;

  const dLat = degreesToRadians(toLat - fromLat);
  const dLng = degreesToRadians(toLng - fromLng);

  const lat1 = degreesToRadians(fromLat);
  const lat2 = degreesToRadians(toLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

function normalizeRating(rating?: number | null) {
  if (!rating) return 0.7;

  // Assumes normal rating range is 1–5.
  return clamp((rating - 1) / 4);
}

function normalizeBusinessScore(score?: number | null, fallback = 0.75) {
  if (score === null || score === undefined) return fallback;

  // Supports either 0–1 or 0–100 input.
  if (score > 1) return clamp(score / 100);

  return clamp(score);
}

function getPaidBoostScore(tier?: ParticipationTier | null) {
  switch (tier) {
    case "premium":
      return 0.25;
    case "boosted":
      return 0.18;
    case "affordable":
      return 0.08;
    case "free":
    default:
      return 0;
  }
}

function getTimeRelevanceScore(category: string, timeIso?: string) {
  if (!timeIso) return 0.75;

  const hour = new Date(timeIso).getHours();
  const normalizedCategory = category.toLowerCase();

  const isFood =
    normalizedCategory.includes("food") ||
    normalizedCategory.includes("restaurant") ||
    normalizedCategory.includes("cafe") ||
    normalizedCategory.includes("coffee");

  const isNightlife =
    normalizedCategory.includes("bar") ||
    normalizedCategory.includes("nightlife") ||
    normalizedCategory.includes("club");

  const isBeauty =
    normalizedCategory.includes("beauty") ||
    normalizedCategory.includes("salon") ||
    normalizedCategory.includes("barber");

  const isService =
    normalizedCategory.includes("auto") ||
    normalizedCategory.includes("notary") ||
    normalizedCategory.includes("tax") ||
    normalizedCategory.includes("repair");

  if (isFood && hour >= 7 && hour <= 21) return 1;
  if (isNightlife && (hour >= 18 || hour <= 2)) return 1;
  if (isBeauty && hour >= 9 && hour <= 19) return 0.95;
  if (isService && hour >= 8 && hour <= 18) return 0.95;

  return 0.65;
}

export function scoreBusinessRecommendation(
  business: BusinessRecommendationInput,
  context: RiderDiscoveryContext
): ScoredBusinessRecommendation | null {
  const maxDistanceMeters =
    context.maxDistanceMeters ?? DEFAULT_MAX_DISTANCE_METERS;

  if (!business.isActive) return null;
  if (!business.latitude || !business.longitude) return null;

  const distanceMeters = getDistanceMeters(
    context.latitude,
    context.longitude,
    business.latitude,
    business.longitude
  );

  if (distanceMeters > maxDistanceMeters) return null;

  const distanceScore = clamp(1 - distanceMeters / maxDistanceMeters);
  const ratingScore = normalizeRating(business.rating);
  const localnessScoreFinal = normalizeBusinessScore(
    business.localnessScore,
    0.85
  );
  const qualityScoreFinal = normalizeBusinessScore(business.qualityScore, 0.75);
  const timeRelevanceScore = getTimeRelevanceScore(
    business.category,
    context.timeIso
  );

  // Paid boost is intentionally capped so it cannot dominate relevance.
  const paidBoostScore = getPaidBoostScore(business.participationTier);

  const score =
    0.3 * distanceScore +
    0.2 * ratingScore +
    0.2 * localnessScoreFinal +
    0.15 * qualityScoreFinal +
    0.1 * timeRelevanceScore +
    0.05 * paidBoostScore;

  return {
    ...business,
    distanceMeters: Math.round(distanceMeters),
    distanceScore,
    ratingScore,
    localnessScoreFinal,
    qualityScoreFinal,
    timeRelevanceScore,
    paidBoostScore,
    score: Number(score.toFixed(4)),
  };
}

function isAffordableOrFree(business: ScoredBusinessRecommendation) {
  return (
    business.participationTier === "free" ||
    business.participationTier === "affordable" ||
    !business.participationTier
  );
}

export function rankBusinessRecommendations(
  businesses: BusinessRecommendationInput[],
  context: RiderDiscoveryContext
) {
  const limit = context.limit ?? DEFAULT_LIMIT;

  const selectedCategories = context.categories?.map((category) =>
    category.toLowerCase()
  );

  const scored = businesses
    .filter((business) => {
      if (!selectedCategories?.length) return true;

      return selectedCategories.includes(business.category.toLowerCase());
    })
    .map((business) => scoreBusinessRecommendation(business, context))
    .filter(
      (business): business is ScoredBusinessRecommendation =>
        business !== null
    )
    .sort((a, b) => b.score - a.score);

  const freeOrAffordable = scored.filter(isAffordableOrFree);
  const paid = scored.filter((business) => !isAffordableOrFree(business));

  // Mission rule: when enough qualified free/affordable businesses exist,
  // at least 60% of the top list should come from free/affordable tiers.
  const minimumAffordableCount = Math.ceil(limit * 0.6);

  const selected: ScoredBusinessRecommendation[] = [];

  selected.push(...freeOrAffordable.slice(0, minimumAffordableCount));

  const remainingSlots = limit - selected.length;
  selected.push(...paid.slice(0, remainingSlots));

  if (selected.length < limit) {
    const selectedIds = new Set(selected.map((business) => business.id));

    selected.push(
      ...scored
        .filter((business) => !selectedIds.has(business.id))
        .slice(0, limit - selected.length)
    );
  }

  return selected.sort((a, b) => b.score - a.score).slice(0, limit);
}