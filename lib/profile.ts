import { DEFAULT_BUCKETS_INPUT } from "@/lib/buckets";
import {
  DriverProfile,
  DriverProfileErrors,
  ProfileSetupCheck,
  ProfileSetupStatus,
} from "@/types/profile";
import { DriverDefaults } from "@/types/trip";

export const DRIVER_PROFILE_KEY = "trip-worth-it-driver-profile";

export const DEFAULT_DRIVER_PROFILE: DriverProfile = {
  vehicleType: "gas",
  costPerMile: 0.35,
  maintenanceLevel: "standard",
  workStyle: "part-time",
  mainPlatform: "multi-app",
  workDaysPerWeek: 5,
  hoursPerWeek: 25,
  minNetPerMile: 1.25,
  minNetPerHour: 22,
  weeklyIncomeTarget: 600,
  primaryFocus: "maximize-profit",
  repairReservePct: 10,
  taxReservePct: 15,
  emergencyReservePct: 5,
  goalSavingsPct: 10,
  primaryGoalName: "",
  goalAmount: 0,
  targetWeeks: 12,
};

function safeProfile(value: unknown): DriverProfile {
  return { ...DEFAULT_DRIVER_PROFILE, ...(value && typeof value === "object" ? value : {}) };
}

export function loadDriverProfile(): DriverProfile {
  if (typeof window === "undefined") return DEFAULT_DRIVER_PROFILE;

  try {
    const raw = window.localStorage.getItem(DRIVER_PROFILE_KEY);
    if (!raw) return DEFAULT_DRIVER_PROFILE;
    return safeProfile(JSON.parse(raw));
  } catch {
    return DEFAULT_DRIVER_PROFILE;
  }
}

export function hasSavedDriverProfile(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DRIVER_PROFILE_KEY) !== null;
}

export function saveDriverProfile(profile: DriverProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRIVER_PROFILE_KEY, JSON.stringify(profile));
}

export function resetDriverProfile(): DriverProfile {
  saveDriverProfile(DEFAULT_DRIVER_PROFILE);
  return DEFAULT_DRIVER_PROFILE;
}

export function profileToDriverDefaults(profile: DriverProfile): DriverDefaults {
  return {
    vehicleType: profile.vehicleType,
    costPerMile: profile.costPerMile,
    minNetPerMile: profile.minNetPerMile,
    minNetPerHour: profile.minNetPerHour,
  };
}

export function profileToReserveInput(profile: DriverProfile) {
  return {
    weeklyMilesDriven: 0,
    weeklyNetIncome: profile.weeklyIncomeTarget,
    repairReservePct: profile.repairReservePct,
    taxReservePct: profile.taxReservePct,
    emergencyReservePct: profile.emergencyReservePct,
  };
}

export function profileToIncomeTargetInput(profile: DriverProfile) {
  return {
    rent: 0,
    groceries: 0,
    gas: 0,
    insurance: 0,
    carPayment: 0,
    phone: 0,
    debt: 0,
    other: 0,
    targetMonthlySavings: 0,
    weeklyUsableIncome: profile.weeklyIncomeTarget,
    workDaysPerWeek: profile.workDaysPerWeek,
  };
}

export function profileToGoalInput(profile: DriverProfile) {
  return {
    goalName: profile.primaryGoalName,
    goalAmount: profile.goalAmount,
    targetWeeks: profile.targetWeeks,
    weeklyUsableIncome: profile.weeklyIncomeTarget,
    weeklySavingsAmount:
      profile.weeklyIncomeTarget * (Math.max(0, profile.goalSavingsPct) / 100),
  };
}

export function profileToBucketsInput(profile: DriverProfile) {
  return {
    ...DEFAULT_BUCKETS_INPUT,
    weeklyNetIncome: profile.weeklyIncomeTarget,
    repairPct: profile.repairReservePct,
    taxPct: profile.taxReservePct,
    emergencyPct: profile.emergencyReservePct,
    goalPct: profile.goalSavingsPct,
  };
}

export function validateDriverProfile(profile: DriverProfile): DriverProfileErrors {
  const errors: DriverProfileErrors = {};

  if (!(profile.costPerMile > 0)) {
    errors.costPerMile = "Enter your estimated vehicle cost per mile.";
  }

  if (!(profile.workDaysPerWeek > 0)) {
    errors.workDaysPerWeek = "Enter at least 1 work day per week.";
  }

  if (profile.hoursPerWeek < 0) {
    errors.hoursPerWeek = "Hours per week cannot be below 0.";
  }

  if (!(profile.minNetPerMile > 0)) {
    errors.minNetPerMile = "Enter the minimum net per mile you want.";
  }

  if (!(profile.minNetPerHour > 0)) {
    errors.minNetPerHour = "Enter the minimum net per hour you want.";
  }

  if (profile.weeklyIncomeTarget < 0) {
    errors.weeklyIncomeTarget = "Weekly target cannot be below $0.";
  }

  if (profile.repairReservePct < 0) {
    errors.repairReservePct = "Repair reserve cannot be below 0%.";
  }

  if (profile.taxReservePct < 0) {
    errors.taxReservePct = "Tax reserve cannot be below 0%.";
  }

  if (profile.emergencyReservePct < 0) {
    errors.emergencyReservePct = "Emergency reserve cannot be below 0%.";
  }

  if (profile.goalSavingsPct < 0) {
    errors.goalSavingsPct = "Goal savings cannot be below 0%.";
  }

  if (profile.goalAmount < 0) {
    errors.goalAmount = "Goal amount cannot be below $0.";
  }

  if (profile.targetWeeks <= 0) {
    errors.targetWeeks = "Target weeks must be at least 1.";
  }

  return errors;
}

export function isDriverProfileValid(profile: DriverProfile): boolean {
  return Object.keys(validateDriverProfile(profile)).length === 0;
}

export function getProfileSetupStatus(
  profile: DriverProfile,
  hasSavedProfile: boolean
): ProfileSetupStatus {
  const checks: ProfileSetupCheck[] = [
    {
      id: "vehicleCost",
      label: "Vehicle & cost profile",
      complete: hasSavedProfile && profile.costPerMile > 0 && Boolean(profile.vehicleType),
      guidance: "Add your vehicle type and cost per mile for better trip profitability.",
    },
    {
      id: "workStyle",
      label: "Work style",
      complete:
        hasSavedProfile &&
        Boolean(profile.workStyle) &&
        Boolean(profile.mainPlatform) &&
        profile.workDaysPerWeek > 0 &&
        profile.hoursPerWeek >= 0,
      guidance: "Add your work style, platform, days, and hours to improve weekly guidance.",
    },
    {
      id: "financialTargets",
      label: "Financial targets",
      complete:
        hasSavedProfile &&
        profile.minNetPerMile > 0 &&
        profile.minNetPerHour > 0 &&
        profile.weeklyIncomeTarget > 0,
      guidance: "Add a weekly target to improve your dashboard guidance.",
    },
    {
      id: "reservePreferences",
      label: "Reserve preferences",
      complete:
        hasSavedProfile &&
        profile.repairReservePct >= 0 &&
        profile.taxReservePct >= 0 &&
        profile.emergencyReservePct >= 0 &&
        profile.goalSavingsPct >= 0 &&
        profile.repairReservePct +
          profile.taxReservePct +
          profile.emergencyReservePct +
          profile.goalSavingsPct >
          0,
      guidance: "Add reserve percentages so planning and buckets stay aligned.",
    },
    {
      id: "primaryGoal",
      label: "Primary goal",
      complete:
        hasSavedProfile &&
        (profile.primaryGoalName.trim().length > 0 || profile.goalAmount > 0),
      guidance: "Add a primary goal to unlock better weekly progress signals.",
    },
  ];

  const completeCount = checks.filter((check) => check.complete).length;
  const totalCount = checks.length;
  const percent = Math.round((completeCount / totalCount) * 100);
  const firstMissing = checks.find((check) => !check.complete);

  let summary = "Complete your profile to personalize this dashboard.";
  if (percent === 100) {
    summary = "Your trip checks, planning, and savings guidance are fully personalized.";
  } else if (percent >= 80) {
    summary = "Your trip checks and planning are mostly personalized.";
  } else if (percent >= 40) {
    summary = "Your app guidance is partially personalized.";
  }

  return {
    percent,
    completeCount,
    totalCount,
    checks,
    summary,
    nextAction: firstMissing?.guidance ?? "Review your profile when your driving setup changes.",
  };
}
