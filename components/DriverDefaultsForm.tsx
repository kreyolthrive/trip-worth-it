"use client";

import { ChangeEvent, useMemo } from "react";
import { SettingsIcon, TargetIcon } from "@/components/ui/Icons";
import { VEHICLE_COST_DEFAULTS } from "@/lib/defaults";
import { validateDriverDefaults } from "@/lib/validation";
import { DriverDefaults, VehicleType } from "@/types/trip";

interface DriverDefaultsFormProps {
  value: DriverDefaults;
  onChange: (next: DriverDefaults) => void;
  onReset: () => void;
}

function inputClass(hasError: boolean) {
  return [
    "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] font-medium text-slate-900",
    "shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] outline-none transition-all duration-150",
    "focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]",
    hasError
      ? "border-rose-400 focus:border-rose-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]"
      : "border-slate-200 focus:border-cyan-500",
  ].join(" ");
}

export default function DriverDefaultsForm({
  value,
  onChange,
  onReset,
}: DriverDefaultsFormProps) {
  const errors = useMemo(() => validateDriverDefaults(value), [value]);

  const handleVehicleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const vehicleType = e.target.value as VehicleType;
    const nextCost =
      vehicleType === "custom" ? value.costPerMile : VEHICLE_COST_DEFAULTS[vehicleType];
    onChange({ ...value, vehicleType, costPerMile: nextCost });
  };

  const handleNumberChange =
    (field: keyof DriverDefaults) => (e: ChangeEvent<HTMLInputElement>) => {
      const parsed = Number(e.target.value);
      onChange({ ...value, [field]: Number.isNaN(parsed) ? 0 : parsed });
    };

  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_4px_rgba(15,23,42,0.06),0_8px_20px_-4px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
              <SettingsIcon className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold tracking-tight text-slate-800">
                Driver Settings
              </h3>
              <p className="text-[12px] text-slate-400">Tune once, check every trip</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3.5 px-5 py-4 sm:grid-cols-2 sm:px-6">
        {/* Vehicle Type */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Vehicle Type
          </span>
          <select
            value={value.vehicleType}
            onChange={handleVehicleTypeChange}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] font-medium text-slate-900 outline-none transition-all duration-150 focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]"
          >
            <option value="gas">Gas</option>
            <option value="hybrid">Hybrid</option>
            <option value="ev">EV</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        {/* Cost per mile */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Cost / Mile ($)
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value.costPerMile}
            onChange={handleNumberChange("costPerMile")}
            className={inputClass(Boolean(errors.costPerMile))}
          />
          {errors.costPerMile ? (
            <span className="text-[12px] font-medium text-rose-600">{errors.costPerMile}</span>
          ) : null}
        </label>

        {/* Min net per mile */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <TargetIcon className="h-3 w-3" />
            Min Net / Mile ($)
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value.minNetPerMile}
            onChange={handleNumberChange("minNetPerMile")}
            className={inputClass(Boolean(errors.minNetPerMile))}
          />
          {errors.minNetPerMile ? (
            <span className="text-[12px] font-medium text-rose-600">{errors.minNetPerMile}</span>
          ) : null}
        </label>

        {/* Min net per hour */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <TargetIcon className="h-3 w-3" />
            Min Net / Hour ($)
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value.minNetPerHour}
            onChange={handleNumberChange("minNetPerHour")}
            className={inputClass(Boolean(errors.minNetPerHour))}
          />
          {errors.minNetPerHour ? (
            <span className="text-[12px] font-medium text-rose-600">{errors.minNetPerHour}</span>
          ) : null}
        </label>
      </div>
    </section>
  );
}
