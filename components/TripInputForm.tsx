"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ClockIcon, DollarIcon, RouteIcon, SparkIcon } from "@/components/ui/Icons";
import { validateTripInput } from "@/lib/validation";
import { TripInput } from "@/types/trip";

interface TripInputFormProps {
  value: TripInput;
  onChange: (next: TripInput) => void;
  onSubmit: () => void;
  onTrySample: () => void;
  onReset: () => void;
  onRecalculateLoaded: () => void;
  showRecalculateLoaded: boolean;
  canSubmit: boolean;
}

type TripNumberField =
  | "offerAmount"
  | "pickupMiles"
  | "tripMiles"
  | "totalMinutes"
  | "extraCosts";

function fieldInputClass(hasError: boolean) {
  return [
    "h-12 w-full rounded-xl border bg-white px-4 text-[15px] font-medium text-slate-900",
    "shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] outline-none transition-all duration-150",
    "placeholder:text-slate-400",
    "focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]",
    hasError
      ? "border-rose-400 focus:border-rose-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]"
      : "border-slate-200 focus:border-cyan-500",
  ].join(" ");
}

function prefixInputClass(hasError: boolean) {
  return [
    "h-12 w-full rounded-xl border bg-white pl-8 pr-4 text-[15px] font-medium text-slate-900",
    "shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] outline-none transition-all duration-150",
    "placeholder:text-slate-400",
    "focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]",
    hasError
      ? "border-rose-400 focus:border-rose-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]"
      : "border-slate-200 focus:border-cyan-500",
  ].join(" ");
}

export default function TripInputForm({
  value,
  onChange,
  onSubmit,
  onTrySample,
  onReset,
  onRecalculateLoaded,
  showRecalculateLoaded,
  canSubmit,
}: TripInputFormProps) {
  const [touched, setTouched] = useState<Partial<Record<TripNumberField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(() => validateTripInput(value), [value]);
  const hasTripErrors = Object.keys(errors).length > 0;

  const handleNumberChange =
    (field: TripNumberField) => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const parsed = raw === "" ? 0 : Number(raw);
      onChange({
        ...value,
        [field]: Number.isNaN(parsed) ? 0 : parsed,
      });
    };

  const handleBlur = (field: TripNumberField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleTripTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, tripType: e.target.value as TripInput["tripType"] });
  };

  const shouldShowError = (field: TripNumberField) =>
    Boolean(errors[field]) && Boolean(submitAttempted || touched[field]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (hasTripErrors || !canSubmit) return;
    onSubmit();
  };

  const handleTrySampleAndClear = () => {
    setSubmitAttempted(false);
    setTouched({});
    onTrySample();
  };

  const handleResetAndClear = () => {
    setSubmitAttempted(false);
    setTouched({});
    onReset();
  };

  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_20px_50px_-8px_rgba(15,23,42,0.14)]">
      {/* Card header */}
      <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black tracking-tight text-white">
              01
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Trip Check</h2>
              <p className="text-[13px] text-slate-500">Enter the offer details below</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showRecalculateLoaded ? (
              <button
                type="button"
                onClick={onRecalculateLoaded}
                disabled={!canSubmit || hasTripErrors}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Recheck
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleTrySampleAndClear}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white"
            >
              <SparkIcon className="h-3 w-3" />
              Sample
            </button>
            <button
              type="button"
              onClick={handleResetAndClear}
              className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-7">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          {/* Offer Amount */}
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <DollarIcon className="h-3.5 w-3.5" />
              Offer Amount
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={value.offerAmount || ""}
                placeholder="0.00"
                onChange={handleNumberChange("offerAmount")}
                onBlur={() => handleBlur("offerAmount")}
                className={prefixInputClass(shouldShowError("offerAmount"))}
              />
            </div>
            {shouldShowError("offerAmount") ? (
              <span className="text-[12px] font-medium text-rose-600">{errors.offerAmount}</span>
            ) : null}
          </label>

          {/* Miles to Pickup */}
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <RouteIcon className="h-3.5 w-3.5" />
              Miles to Pickup
            </span>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={value.pickupMiles === 0 ? "" : value.pickupMiles}
                placeholder="0"
                onChange={handleNumberChange("pickupMiles")}
                onBlur={() => handleBlur("pickupMiles")}
                className={fieldInputClass(shouldShowError("pickupMiles"))}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                mi
              </span>
            </div>
            {shouldShowError("pickupMiles") ? (
              <span className="text-[12px] font-medium text-rose-600">{errors.pickupMiles}</span>
            ) : null}
          </label>

          {/* Trip Miles */}
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <RouteIcon className="h-3.5 w-3.5" />
              Trip Miles
            </span>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={value.tripMiles || ""}
                placeholder="0"
                onChange={handleNumberChange("tripMiles")}
                onBlur={() => handleBlur("tripMiles")}
                className={fieldInputClass(shouldShowError("tripMiles"))}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                mi
              </span>
            </div>
            {shouldShowError("tripMiles") ? (
              <span className="text-[12px] font-medium text-rose-600">{errors.tripMiles}</span>
            ) : null}
          </label>

          {/* Total Minutes */}
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <ClockIcon className="h-3.5 w-3.5" />
              Total Time
            </span>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                value={value.totalMinutes || ""}
                placeholder="0"
                onChange={handleNumberChange("totalMinutes")}
                onBlur={() => handleBlur("totalMinutes")}
                className={fieldInputClass(shouldShowError("totalMinutes"))}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                min
              </span>
            </div>
            {shouldShowError("totalMinutes") ? (
              <span className="text-[12px] font-medium text-rose-600">{errors.totalMinutes}</span>
            ) : null}
          </label>

          {/* Extra Costs */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Extra Costs
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={value.extraCosts === 0 ? "" : value.extraCosts}
                placeholder="0.00"
                onChange={handleNumberChange("extraCosts")}
                onBlur={() => handleBlur("extraCosts")}
                className={prefixInputClass(shouldShowError("extraCosts"))}
              />
            </div>
            {shouldShowError("extraCosts") ? (
              <span className="text-[12px] font-medium text-rose-600">{errors.extraCosts}</span>
            ) : null}
          </label>

          {/* Trip Type */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Trip Type
            </span>
            <select
              value={value.tripType}
              onChange={handleTripTypeChange}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-900 outline-none transition-all duration-150 focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]"
            >
              <option value="ride">Ride</option>
              <option value="delivery">Delivery</option>
            </select>
          </label>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-press w-full rounded-xl bg-slate-900 px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(15,23,42,0.35)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_8px_20px_rgba(15,23,42,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          >
            Get Trip Verdict →
          </button>

          {submitAttempted && hasTripErrors ? (
            <p className="mt-3 text-center text-[13px] font-medium text-rose-600">
              Fix the highlighted fields above to continue.
            </p>
          ) : null}

          {!canSubmit ? (
            <p className="mt-3 text-center text-[13px] font-medium text-amber-600">
              Check your driver settings — one or more values are invalid.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
