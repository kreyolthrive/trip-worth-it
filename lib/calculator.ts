import { DriverDefaults, TripInput, TripMetrics } from "@/types/trip";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateTripMetrics(
  trip: TripInput,
  driver: DriverDefaults
): TripMetrics {
  const totalMiles = trip.pickupMiles + trip.tripMiles;
  const operatingCost = totalMiles * driver.costPerMile;
  const totalCost = operatingCost + trip.extraCosts;
  const netEarnings = trip.offerAmount - totalCost;

  const netPerMile = totalMiles > 0 ? netEarnings / totalMiles : 0;
  const netPerHour =
    trip.totalMinutes > 0 ? netEarnings / (trip.totalMinutes / 60) : 0;
  const pickupRatio = totalMiles > 0 ? trip.pickupMiles / totalMiles : 0;

  return {
    totalMiles: round2(totalMiles),
    operatingCost: round2(operatingCost),
    totalCost: round2(totalCost),
    netEarnings: round2(netEarnings),
    netPerMile: round2(netPerMile),
    netPerHour: round2(netPerHour),
    pickupRatio: round2(pickupRatio),
  };
}