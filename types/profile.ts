import { VehicleType } from "@/types/trip";

export type MaintenanceLevel = "low" | "standard" | "high";
export type WorkStyle = "full-time" | "part-time" | "extra-income" | "goal-based";
export type MainPlatform = "uber" | "lyft" | "uber-eats" | "doordash" | "multi-app";
export type PrimaryFocus =
  | "maximize-profit"
  | "cover-bills"
  | "save-for-goal"
  | "reduce-wasted-time";

export interface DriverProfile {
  vehicleType: VehicleType;
  costPerMile: number;
  maintenanceLevel: MaintenanceLevel;
  workStyle: WorkStyle;
  mainPlatform: MainPlatform;
  workDaysPerWeek: number;
  hoursPerWeek: number;
  minNetPerMile: number;
  minNetPerHour: number;
  weeklyIncomeTarget: number;
  primaryFocus: PrimaryFocus;
  repairReservePct: number;
  taxReservePct: number;
  emergencyReservePct: number;
  goalSavingsPct: number;
  primaryGoalName: string;
  goalAmount: number;
  targetWeeks: number;
}

export type DriverProfileErrors = Partial<Record<keyof DriverProfile, string>>;

export type ProfileSetupCheckId =
  | "vehicleCost"
  | "workStyle"
  | "financialTargets"
  | "reservePreferences"
  | "primaryGoal";

export interface ProfileSetupCheck {
  id: ProfileSetupCheckId;
  label: string;
  complete: boolean;
  guidance: string;
}

export interface ProfileSetupStatus {
  percent: number;
  completeCount: number;
  totalCount: number;
  checks: ProfileSetupCheck[];
  summary: string;
  nextAction: string;
}
