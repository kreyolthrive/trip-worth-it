export type VehicleType = "gas" | "hybrid" | "ev" | "custom";
export type TripType = "ride" | "delivery";

export type Verdict = "WORTH_TAKING" | "BORDERLINE" | "NOT_WORTH_IT";

export type ReasonCode =
  | "LOW_PAYOUT"
  | "PICKUP_TOO_LONG"
  | "WEAK_TIME_RETURN"
  | "LOW_NET_AFTER_COSTS"
  | "MIXED_BORDERLINE"
  | "STRONG_VALUE";

export interface DriverDefaults {
  vehicleType: VehicleType;
  costPerMile: number;
  minNetPerMile: number;
  minNetPerHour: number;
}

export interface TripInput {
  offerAmount: number;
  pickupMiles: number;
  tripMiles: number;
  totalMinutes: number;
  extraCosts: number;
  tripType: TripType;
}

export interface TripMetrics {
  totalMiles: number;
  operatingCost: number;
  totalCost: number;
  netEarnings: number;
  netPerMile: number;
  netPerHour: number;
  pickupRatio: number;
}

export interface TripResult {
  verdict: Verdict;
  primaryReason: ReasonCode;
  secondaryReasons: ReasonCode[];
  explanationLines: string[];
  metrics: TripMetrics;
}

export interface RecentTripCheck {
  id: string;
  createdAt: string;
  verdict: Verdict;
  estimatedNet: number;
  tripType: TripType;
  trip: TripInput;
}

export interface BetaSignup {
  email: string;
  submittedAt: string;
}
