import { describe, expect, it } from "vitest";
import {
  DEFAULT_DRIVER_PROFILE,
  getProfileSetupStatus,
  profileToBucketsInput,
  profileToDriverDefaults,
  profileToReserveInput,
  validateDriverProfile,
} from "./profile";

describe("driver profile", () => {
  it("validates the default profile", () => {
    expect(validateDriverProfile(DEFAULT_DRIVER_PROFILE)).toEqual({});
  });

  it("returns friendly errors for invalid profile numbers", () => {
    expect(
      validateDriverProfile({
        ...DEFAULT_DRIVER_PROFILE,
        costPerMile: 0,
        workDaysPerWeek: 0,
        hoursPerWeek: -1,
        minNetPerMile: 0,
        minNetPerHour: 0,
        weeklyIncomeTarget: -1,
        repairReservePct: -1,
        taxReservePct: -1,
        emergencyReservePct: -1,
        goalSavingsPct: -1,
        goalAmount: -1,
        targetWeeks: 0,
      })
    ).toMatchObject({
      costPerMile: "Enter your estimated vehicle cost per mile.",
      workDaysPerWeek: "Enter at least 1 work day per week.",
      hoursPerWeek: "Hours per week cannot be below 0.",
      minNetPerMile: "Enter the minimum net per mile you want.",
      minNetPerHour: "Enter the minimum net per hour you want.",
      weeklyIncomeTarget: "Weekly target cannot be below $0.",
      repairReservePct: "Repair reserve cannot be below 0%.",
      taxReservePct: "Tax reserve cannot be below 0%.",
      emergencyReservePct: "Emergency reserve cannot be below 0%.",
      goalSavingsPct: "Goal savings cannot be below 0%.",
      goalAmount: "Goal amount cannot be below $0.",
      targetWeeks: "Target weeks must be at least 1.",
    });
  });

  it("maps profile values into current app assumptions", () => {
    const profile = {
      ...DEFAULT_DRIVER_PROFILE,
      costPerMile: 0.42,
      minNetPerMile: 1.5,
      minNetPerHour: 25,
      weeklyIncomeTarget: 700,
      repairReservePct: 12,
      taxReservePct: 18,
    };

    expect(profileToDriverDefaults(profile)).toEqual({
      vehicleType: "gas",
      costPerMile: 0.42,
      minNetPerMile: 1.5,
      minNetPerHour: 25,
    });
    expect(profileToReserveInput(profile)).toMatchObject({
      weeklyNetIncome: 700,
      repairReservePct: 12,
      taxReservePct: 18,
    });
    expect(profileToBucketsInput(profile)).toMatchObject({
      weeklyNetIncome: 700,
      repairPct: 12,
      taxPct: 18,
    });
  });

  it("calculates profile setup completeness for dashboard status", () => {
    const unsaved = getProfileSetupStatus(DEFAULT_DRIVER_PROFILE, false);
    expect(unsaved.percent).toBe(0);
    expect(unsaved.nextAction).toBe(
      "Add your vehicle type and cost per mile for better trip profitability."
    );

    const savedWithoutGoal = getProfileSetupStatus(DEFAULT_DRIVER_PROFILE, true);
    expect(savedWithoutGoal.percent).toBe(80);
    expect(savedWithoutGoal.nextAction).toBe(
      "Add a primary goal to unlock better weekly progress signals."
    );

    const complete = getProfileSetupStatus(
      { ...DEFAULT_DRIVER_PROFILE, primaryGoalName: "Repair fund" },
      true
    );
    expect(complete.percent).toBe(100);
  });
});
