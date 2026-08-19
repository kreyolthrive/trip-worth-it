"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import {
  CheckIcon,
  DollarIcon,
  GaugeIcon,
  ProfileIcon,
  RouteIcon,
  SettingsIcon,
  TargetIcon,
} from "@/components/ui/Icons";
import {
  loadDriverProfile,
  profileToDriverDefaults,
  resetDriverProfile,
  saveDriverProfile,
  validateDriverProfile,
} from "@/lib/profile";
import { saveDriverDefaults } from "@/lib/storage";
import {
  DriverProfile,
  DriverProfileErrors,
  MainPlatform,
  MaintenanceLevel,
  PrimaryFocus,
  WorkStyle,
} from "@/types/profile";
import { VehicleType } from "@/types/trip";

type NumberField =
  | "costPerMile"
  | "workDaysPerWeek"
  | "hoursPerWeek"
  | "minNetPerMile"
  | "minNetPerHour"
  | "weeklyIncomeTarget"
  | "repairReservePct"
  | "taxReservePct"
  | "emergencyReservePct"
  | "goalSavingsPct"
  | "goalAmount"
  | "targetWeeks";

type SelectField =
  | "vehicleType"
  | "maintenanceLevel"
  | "workStyle"
  | "mainPlatform"
  | "primaryFocus";

const vehicleOptions: Array<{ value: VehicleType; label: string }> = [
  { value: "gas", label: "Gas" },
  { value: "hybrid", label: "Hybrid" },
  { value: "ev", label: "EV" },
  { value: "custom", label: "Custom" },
];

const maintenanceOptions: Array<{ value: MaintenanceLevel; label: string }> = [
  { value: "low", label: "Low" },
  { value: "standard", label: "Standard" },
  { value: "high", label: "High" },
];

const workStyleOptions: Array<{ value: WorkStyle; label: string }> = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "extra-income", label: "Extra income" },
  { value: "goal-based", label: "Goal-based" },
];

const platformOptions: Array<{ value: MainPlatform; label: string }> = [
  { value: "uber", label: "Uber" },
  { value: "lyft", label: "Lyft" },
  { value: "uber-eats", label: "Uber Eats" },
  { value: "doordash", label: "DoorDash" },
  { value: "multi-app", label: "Multi-app" },
];

const focusOptions: Array<{ value: PrimaryFocus; label: string }> = [
  { value: "maximize-profit", label: "Maximize profit" },
  { value: "cover-bills", label: "Cover bills" },
  { value: "save-for-goal", label: "Save for a goal" },
  { value: "reduce-wasted-time", label: "Reduce wasted time" },
];

function inputClass(hasError: boolean, prefix = false) {
  return [
    "h-11 w-full rounded-xl border bg-white text-[14px] font-semibold text-slate-900",
    "shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] outline-none transition-all duration-150",
    "placeholder:text-slate-400 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.14)]",
    prefix ? "pl-8 pr-3" : "px-3",
    hasError ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-cyan-500",
  ].join(" ");
}

function selectClass() {
  return [
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[14px] font-semibold text-slate-900",
    "outline-none transition-all duration-150 focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.14)]",
  ].join(" ");
}

function parseNumber(e: ChangeEvent<HTMLInputElement>) {
  const raw = e.target.value;
  const parsed = raw === "" ? 0 : Number(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <span className="text-[12px] font-medium text-rose-600">{error}</span>;
}

function Section({
  number,
  title,
  purpose,
  icon,
  children,
}: {
  number: string;
  title: string;
  purpose: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_16px_40px_-8px_rgba(15,23,42,0.12)]">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white">
            {number}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-cyan-500">{icon}</span>
              <h2 className="text-[18px] font-black tracking-tight text-slate-900">{title}</h2>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">{purpose}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">{children}</div>
    </section>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<DriverProfile>(() => loadDriverProfile());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const errors = useMemo(() => validateDriverProfile(profile), [profile]);
  const hasErrors = Object.keys(errors).length > 0;

  const setNumber = (field: NumberField) => (e: ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [field]: parseNumber(e) }));
    setSaveState("idle");
  };

  const setText = (field: "primaryGoalName") => (e: ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
    setSaveState("idle");
  };

  const setSelect = (field: SelectField) => (e: ChangeEvent<HTMLSelectElement>) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
    setSaveState("idle");
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (hasErrors) return;
    saveDriverProfile(profile);
    saveDriverDefaults(profileToDriverDefaults(profile));
    setSaveState("saved");
  };

  const handleReset = () => {
    const next = resetDriverProfile();
    setProfile(next);
    saveDriverDefaults(profileToDriverDefaults(next));
    setSubmitAttempted(false);
    setSaveState("saved");
  };

  const showError = (field: keyof DriverProfileErrors) =>
    submitAttempted ? errors[field] : undefined;

  const reserveTotal =
    profile.repairReservePct +
    profile.taxReservePct +
    profile.emergencyReservePct +
    profile.goalSavingsPct;

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#eef1f7] text-slate-900">
      <div className="pointer-events-none absolute inset-0 panel-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[100px]" />

      <div className="relative mx-auto w-full max-w-[920px] px-4 pb-24 pt-8 sm:px-6 lg:pt-12">
        <AppNav />

        <header className="card-enter mb-6 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-[0_8px_16px_-4px_rgba(15,23,42,0.3),0_40px_80px_-12px_rgba(15,23,42,0.4)]">
          <div className="px-7 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                  Driver Profile
                </p>
                <p className="text-[12px] text-slate-400">Smarter app baseline</p>
              </div>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-slate-300 sm:inline-flex">
                Local-only data
              </span>
            </div>

            <h1 className="mt-5 max-w-2xl text-[2.15rem] font-black leading-[1.08] tracking-tight text-white sm:text-4xl">
              Set your baseline for
              <br />
              <span className="text-cyan-400">smarter guidance.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-slate-300">
              Tell Trip Worth-It a little about your driving setup so it can give you more useful
              trip checks, planning, and savings guidance.
            </p>
            <p className="mt-2 max-w-xl text-[13px] font-semibold leading-5 text-cyan-300/85">
              This only takes about a minute and helps the app tailor your results to your real
              situation.
            </p>
          </div>
        </header>

        <form onSubmit={handleSave} className="space-y-5">
          <Section
            number="01"
            title="Vehicle & Cost Profile"
            purpose="Gives Trip Check better assumptions for profitability and planning."
            icon={<RouteIcon className="h-4 w-4" />}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Vehicle Type
              </span>
              <select value={profile.vehicleType} onChange={setSelect("vehicleType")} className={selectClass()}>
                {vehicleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Cost Per Mile
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={profile.costPerMile || ""}
                  onChange={setNumber("costPerMile")}
                  className={inputClass(Boolean(showError("costPerMile")), true)}
                />
              </div>
              <FieldError error={showError("costPerMile")} />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Maintenance Level
              </span>
              <select
                value={profile.maintenanceLevel}
                onChange={setSelect("maintenanceLevel")}
                className={selectClass()}
              >
                {maintenanceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </Section>

          <Section
            number="02"
            title="Work Style"
            purpose="Helps the app interpret targets and weekly planning more intelligently."
            icon={<GaugeIcon className="h-4 w-4" />}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Work Style
              </span>
              <select value={profile.workStyle} onChange={setSelect("workStyle")} className={selectClass()}>
                {workStyleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Main Platform
              </span>
              <select value={profile.mainPlatform} onChange={setSelect("mainPlatform")} className={selectClass()}>
                {platformOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Work Days / Week
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={profile.workDaysPerWeek || ""}
                onChange={setNumber("workDaysPerWeek")}
                className={inputClass(Boolean(showError("workDaysPerWeek")))}
              />
              <FieldError error={showError("workDaysPerWeek")} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Hours / Week
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={profile.hoursPerWeek || ""}
                onChange={setNumber("hoursPerWeek")}
                className={inputClass(Boolean(showError("hoursPerWeek")))}
              />
              <FieldError error={showError("hoursPerWeek")} />
            </label>
          </Section>

          <Section
            number="03"
            title="Financial Targets"
            purpose="Personalizes trip verdicts and dashboard interpretation."
            icon={<DollarIcon className="h-4 w-4" />}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Min Net / Mile
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={profile.minNetPerMile || ""}
                  onChange={setNumber("minNetPerMile")}
                  className={inputClass(Boolean(showError("minNetPerMile")), true)}
                />
              </div>
              <FieldError error={showError("minNetPerMile")} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Min Net / Hour
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={profile.minNetPerHour || ""}
                  onChange={setNumber("minNetPerHour")}
                  className={inputClass(Boolean(showError("minNetPerHour")), true)}
                />
              </div>
              <FieldError error={showError("minNetPerHour")} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Weekly Income Target
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={profile.weeklyIncomeTarget || ""}
                  onChange={setNumber("weeklyIncomeTarget")}
                  className={inputClass(Boolean(showError("weeklyIncomeTarget")), true)}
                />
              </div>
              <FieldError error={showError("weeklyIncomeTarget")} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Primary Focus
              </span>
              <select value={profile.primaryFocus} onChange={setSelect("primaryFocus")} className={selectClass()}>
                {focusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </Section>

          <Section
            number="04"
            title="Reserve Preferences"
            purpose="Keeps planning and bucket logic aligned."
            icon={<SettingsIcon className="h-4 w-4" />}
          >
            {[
              ["repairReservePct", "Repair Reserve", "amber"],
              ["taxReservePct", "Tax Reserve", "rose"],
              ["emergencyReservePct", "Emergency Reserve", "cyan"],
              ["goalSavingsPct", "Goal Savings", "emerald"],
            ].map(([field, label, color]) => (
              <label key={field} className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      color === "amber"
                        ? "bg-amber-400"
                        : color === "rose"
                          ? "bg-rose-400"
                          : color === "emerald"
                            ? "bg-emerald-400"
                            : "bg-cyan-400"
                    }`}
                  />
                  {label}
                </span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={profile[field as NumberField] || ""}
                    onChange={setNumber(field as NumberField)}
                    className={inputClass(Boolean(showError(field as keyof DriverProfileErrors)))}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
                <FieldError error={showError(field as keyof DriverProfileErrors)} />
              </label>
            ))}

            <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 sm:col-span-2">
              <p className="text-[12px] font-bold uppercase tracking-widest text-cyan-700">
                {reserveTotal}% reserved
              </p>
              <p className="mt-1 text-[13px] leading-5 text-slate-600">
                These percentages seed Savings Buckets and weekly reserve guidance when those pages
                do not already have saved values.
              </p>
            </div>
          </Section>

          <Section
            number="05"
            title="Primary Goal"
            purpose="Gives the dashboard and planner stronger context."
            icon={<TargetIcon className="h-4 w-4" />}
          >
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Goal Name
              </span>
              <input
                type="text"
                value={profile.primaryGoalName}
                placeholder="Emergency fund, car repair fund, vacation..."
                onChange={setText("primaryGoalName")}
                className={inputClass(false)}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Goal Amount
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={profile.goalAmount || ""}
                  onChange={setNumber("goalAmount")}
                  className={inputClass(Boolean(showError("goalAmount")), true)}
                />
              </div>
              <FieldError error={showError("goalAmount")} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Target Weeks
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={profile.targetWeeks || ""}
                onChange={setNumber("targetWeeks")}
                className={inputClass(Boolean(showError("targetWeeks")))}
              />
              <FieldError error={showError("targetWeeks")} />
            </label>
          </Section>

          <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_10px_40px_rgba(15,23,42,0.18)] backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                {saveState === "saved" ? (
                  <>
                    <CheckIcon className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700">Profile saved locally</span>
                  </>
                ) : submitAttempted && hasErrors ? (
                  <span className="text-rose-600">Fix the highlighted fields to save.</span>
                ) : (
                  <span className="text-slate-500">Save to apply these assumptions across the app.</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-press h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[13px] font-bold text-slate-600 transition hover:bg-white sm:flex-none"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="btn-press h-11 flex-1 rounded-xl bg-slate-900 px-5 text-[14px] font-black text-white shadow-[0_4px_14px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 hover:bg-slate-800 sm:flex-none"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white/70 px-5 py-4">
          <p className="flex items-start gap-2 text-[13px] leading-5 text-slate-600">
            <ProfileIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-500" />
            Your profile stays in this browser. It does not add an account, backend, bank
            connection, or location tracking.
          </p>
        </div>
      </div>
    </main>
  );
}
