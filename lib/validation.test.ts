import { describe, expect, it } from "vitest";
import { validateDriverDefaults, validateTripInput, isDriverDefaultsValid, isTripInputValid } from "./validation";
import { DriverDefaults, TripInput } from "../types/trip";

const validTrip: TripInput = {
  offerAmount: 12,
  pickupMiles: 1,
  tripMiles: 5,
  totalMinutes: 20,
  extraCosts: 0,
  tripType: "ride",
};

const validDefaults: DriverDefaults = {
  vehicleType: "gas",
  costPerMile: 0.3,
  minNetPerMile: 1,
  minNetPerHour: 20,
};

describe("validation", () => {
  it("accepts a fully valid trip input", () => {
    expect(validateTripInput(validTrip)).toEqual({});
    expect(isTripInputValid(validTrip)).toBe(true);
  });

  it("returns field errors for invalid trip values", () => {
    const invalid: TripInput = {
      ...validTrip,
      offerAmount: 0,
      tripMiles: 0,
      totalMinutes: 0,
      pickupMiles: -1,
      extraCosts: -0.5,
    };

    expect(validateTripInput(invalid)).toEqual({
      offerAmount: "Enter an offer amount greater than $0.",
      tripMiles: "Enter estimated trip miles greater than 0 to continue.",
      totalMinutes: "Enter the estimated trip time in minutes.",
      pickupMiles: "Pickup miles cannot be below 0.",
      extraCosts: "Extra costs cannot be below $0.",
    });
    expect(isTripInputValid(invalid)).toBe(false);
  });

  it("enforces positive driver default thresholds", () => {
    const invalid: DriverDefaults = {
      ...validDefaults,
      costPerMile: 0,
      minNetPerMile: 0,
      minNetPerHour: 0,
    };

    expect(validateDriverDefaults(invalid)).toEqual({
      costPerMile: "Enter a cost per mile greater than $0.",
      minNetPerMile: "Enter the minimum net per mile you want to earn.",
      minNetPerHour: "Enter the minimum net per hour you want to earn.",
    });
    expect(isDriverDefaultsValid(invalid)).toBe(false);
  });
});
