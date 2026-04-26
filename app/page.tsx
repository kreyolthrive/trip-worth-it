"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import DriverDefaultsForm from "@/components/DriverDefaultsForm";
import EmailCapture from "@/components/EmailCapture";
import RecentChecks from "@/components/RecentChecks";
import ResultsCard from "@/components/ResultsCard";
import TripInputForm from "@/components/TripInputForm";
import { calculateTripMetrics } from "@/lib/calculator";
import { DEFAULT_DRIVER_DEFAULTS } from "@/lib/defaults";
import {
  appendBetaSignup,
  loadDriverDefaults,
  loadRecentTripChecks,
  prependRecentTripCheck,
  saveDriverDefaults,
} from "@/lib/storage";
import { isDriverDefaultsValid, isTripInputValid } from "@/lib/validation";
import { evaluateTrip } from "@/lib/verdict";
import { DriverDefaults, RecentTripCheck, TripInput, TripResult } from "@/types/trip";

const DEFAULT_TRIP: TripInput = {
  offerAmount: 0,
  pickupMiles: 0,
  tripMiles: 0,
  totalMinutes: 0,
  extraCosts: 0,
  tripType: "ride",
};

const SAMPLE_TRIP: TripInput = {
  offerAmount: 8,
  pickupMiles: 7,
  tripMiles: 4,
  totalMinutes: 28,
  extraCosts: 1.5,
  tripType: "ride",
};

export default function HomePage() {
  const [driverDefaults, setDriverDefaults] = useState<DriverDefaults>(() =>
    loadDriverDefaults()
  );
  const [trip, setTrip] = useState<TripInput>(DEFAULT_TRIP);
  const [result, setResult] = useState<TripResult | null>(null);
  const [recentChecks, setRecentChecks] = useState<RecentTripCheck[]>(() =>
    loadRecentTripChecks()
  );
  const [loadedRecentCheck, setLoadedRecentCheck] = useState<RecentTripCheck | null>(null);

  const handleDefaultsChange = (next: DriverDefaults) => {
    setDriverDefaults(next);
    saveDriverDefaults(next);
  };

  const handleResetDefaults = () => {
    setDriverDefaults(DEFAULT_DRIVER_DEFAULTS);
    saveDriverDefaults(DEFAULT_DRIVER_DEFAULTS);
  };

  const handleResetTrip = () => {
    setTrip(DEFAULT_TRIP);
    setResult(null);
    setLoadedRecentCheck(null);
  };

  const handleTrySampleTrip = () => {
    setTrip(SAMPLE_TRIP);
    setLoadedRecentCheck(null);
  };

  const runCalculation = (tripInput: TripInput) => {
    if (!isTripInputValid(tripInput) || !isDriverDefaultsValid(driverDefaults)) return;

    const metrics = calculateTripMetrics(tripInput, driverDefaults);
    const evaluated = evaluateTrip(tripInput, driverDefaults, metrics);
    setResult(evaluated);

    const check: RecentTripCheck = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      verdict: evaluated.verdict,
      estimatedNet: evaluated.metrics.netEarnings,
      tripType: tripInput.tripType,
      trip: tripInput,
    };

    setRecentChecks(prependRecentTripCheck(check));
    setLoadedRecentCheck(null);
  };

  const handleTripChange = (next: TripInput) => {
    setTrip(next);
    setLoadedRecentCheck(null);
  };

  const handleCalculate = () => runCalculation(trip);

  const handleLoadRecent = (check: RecentTripCheck) => {
    setTrip(check.trip);
    setLoadedRecentCheck(check);
    setResult(null);
  };

  const handleRecalculateLoaded = () => {
    if (!loadedRecentCheck) return;
    runCalculation(loadedRecentCheck.trip);
  };

  const handleEmailSubmit = (email: string) => {
    appendBetaSignup({ email, submittedAt: new Date().toISOString() });
  };

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#eef1f7] text-slate-900">
      {/* Ambient background elements */}
      <div className="pointer-events-none absolute inset-0 panel-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 top-32 h-64 w-64 rounded-full bg-indigo-400/20 blur-[80px]" />

      <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <AppNav />
        {/* ── Header ────────────────────────────────────────────────── */}
        <header className="card-enter mb-8 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-[0_8px_16px_-4px_rgba(15,23,42,0.3),0_40px_80px_-12px_rgba(15,23,42,0.4)]">
          <div className="px-7 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  <svg className="h-4.5 w-4.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z" opacity=".3" />
                    <path d="M10 6a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                    Trip Worth-It
                  </p>
                  <p className="text-[12px] text-slate-400">Driver Decision Tool</p>
                </div>
              </div>

              <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-slate-300 sm:inline-flex">
                Beta · Local-only data
              </span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 max-w-3xl text-[2.4rem] font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.2rem]">
              Should you take
              <br className="hidden sm:block" />
              <span className="text-cyan-400"> this trip?</span>
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-300">
              Enter the offer, pickup, mileage, and time. Get a fast verdict against your
              own cost and earnings targets — before accepting.
            </p>
            <p className="mt-2 text-[13px] font-semibold tracking-wide text-cyan-400/80">
              Know what to take. Know what to keep. Know what to save.
            </p>

            {/* Feature chips */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "No account needed",
                "All data stays local",
                "Compares your real targets",
              ].map((chip) => (
                <span
                  key={chip}
                  className="fade-enter inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-slate-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* ── Main grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 items-start gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,420px)]">
          {/* Left column: inputs */}
          <div className="space-y-4">
            <TripInputForm
              value={trip}
              onChange={handleTripChange}
              onSubmit={handleCalculate}
              onTrySample={handleTrySampleTrip}
              onReset={handleResetTrip}
              onRecalculateLoaded={handleRecalculateLoaded}
              showRecalculateLoaded={Boolean(loadedRecentCheck)}
              canSubmit={isDriverDefaultsValid(driverDefaults)}
            />

            <DriverDefaultsForm
              value={driverDefaults}
              onChange={handleDefaultsChange}
              onReset={handleResetDefaults}
            />
          </div>

          {/* Right column: results (sticky on large screens) */}
          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <ResultsCard result={result} assumptions={driverDefaults} />
            <RecentChecks items={recentChecks} onLoad={handleLoadRecent} />
            {result ? <EmailCapture onSubmitEmail={handleEmailSubmit} /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
