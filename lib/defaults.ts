import { DriverDefaults, VehicleType } from "@/types/trip";

export const VEHICLE_COST_DEFAULTS: Record<VehicleType, number> = {
  gas: 0.32,
  hybrid: 0.25,
  ev: 0.2,
  custom: 0.3,
};

export const DEFAULT_DRIVER_DEFAULTS: DriverDefaults = {
  vehicleType: "gas",
  costPerMile: 0.32,
  minNetPerMile: 1.0,
  minNetPerHour: 20.0,
};