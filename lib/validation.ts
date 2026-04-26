import { DriverDefaults, TripInput } from "@/types/trip";

export type TripFieldErrors = Partial<
  Record<"offerAmount" | "tripMiles" | "totalMinutes" | "pickupMiles" | "extraCosts", string>
>;

export type DriverDefaultsErrors = Partial<
  Record<"costPerMile" | "minNetPerMile" | "minNetPerHour", string>
>;

export function validateTripInput(value: TripInput): TripFieldErrors {
  const errors: TripFieldErrors = {};

  if (!(value.offerAmount > 0)) {
    errors.offerAmount = "Enter an offer amount greater than $0.";
  }

  if (!(value.tripMiles > 0)) {
    errors.tripMiles = "Enter estimated trip miles greater than 0 to continue.";
  }

  if (!(value.totalMinutes > 0)) {
    errors.totalMinutes = "Enter the estimated trip time in minutes.";
  }

  if (value.pickupMiles < 0) {
    errors.pickupMiles = "Pickup miles cannot be below 0.";
  }

  if (value.extraCosts < 0) {
    errors.extraCosts = "Extra costs cannot be below $0.";
  }

  return errors;
}

export function validateDriverDefaults(
  value: DriverDefaults
): DriverDefaultsErrors {
  const errors: DriverDefaultsErrors = {};

  if (!(value.costPerMile > 0)) {
    errors.costPerMile = "Enter a cost per mile greater than $0.";
  }

  if (!(value.minNetPerMile > 0)) {
    errors.minNetPerMile = "Enter the minimum net per mile you want to earn.";
  }

  if (!(value.minNetPerHour > 0)) {
    errors.minNetPerHour = "Enter the minimum net per hour you want to earn.";
  }

  return errors;
}

export function isTripInputValid(value: TripInput) {
  return Object.keys(validateTripInput(value)).length === 0;
}

export function isDriverDefaultsValid(value: DriverDefaults) {
  return Object.keys(validateDriverDefaults(value)).length === 0;
}
