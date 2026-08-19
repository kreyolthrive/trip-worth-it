"use client";

import { ChangeEvent, FormEvent, ReactNode, useMemo, useRef, useState } from "react";
import { AlertIcon, CheckIcon, ClockIcon, DollarIcon, RouteIcon, SparkIcon } from "@/components/ui/Icons";
import { DEMO_TRIP_EXTRACTIONS } from "@/lib/demoTripExtraction";
import { DemoTripScenario, TripScreenshotExtraction, TripInput } from "@/types/trip";
import { validateTripInput } from "@/lib/validation";

interface ScreenshotTripAssistantProps {
  onConfirm: (trip: TripInput) => void;
  onApplyToForm: (trip: TripInput) => void;
  disabled: boolean;
}

type ReviewField = "offerAmount" | "pickupMiles" | "tripMiles" | "totalMinutes";

const REVIEW_FIELDS: Array<{
  field: ReviewField;
  label: string;
  icon: ReactNode;
  unit: string;
  step: string;
}> = [
  { field: "offerAmount", label: "Payout", icon: <DollarIcon className="h-3.5 w-3.5" />, unit: "$", step: "0.01" },
  { field: "pickupMiles", label: "Pickup Miles", icon: <RouteIcon className="h-3.5 w-3.5" />, unit: "mi", step: "0.1" },
  { field: "tripMiles", label: "Trip Miles", icon: <RouteIcon className="h-3.5 w-3.5" />, unit: "mi", step: "0.1" },
  { field: "totalMinutes", label: "Total Time", icon: <ClockIcon className="h-3.5 w-3.5" />, unit: "min", step: "1" },
];

function buildTrip(extraction: TripScreenshotExtraction): TripInput {
  return {
    offerAmount: extraction.payout ?? 0,
    pickupMiles: extraction.pickupDistanceMiles ?? 0,
    tripMiles: extraction.tripDistanceMiles ?? 0,
    totalMinutes: extraction.estimatedTimeMinutes ?? 0,
    extraCosts: 0,
    tripType: "ride",
  };
}

function DemoOfferPreview({ scenario }: { scenario: DemoTripScenario }) {
  const demo = DEMO_TRIP_EXTRACTIONS[scenario];
  const extraction = demo.extraction;
  const isWeak = scenario === "weak-short-delivery";

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm">
      <div className="border-b border-white/10 bg-white/5 px-4 py-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-200">
          Demo trip offer screenshot
        </p>
      </div>
      <div className="px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-slate-400">
              {isWeak ? "Delivery offer" : "Ride offer"}
            </p>
            <p className="mt-1 text-[2.1rem] font-black leading-none">
              ${extraction.payout?.toFixed(2)}
            </p>
          </div>
          <span
            className={[
              "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest",
              isWeak
                ? "border-amber-300/30 bg-amber-400/10 text-amber-200"
                : "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
            ].join(" ")}
          >
            Sample
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/8 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Pickup
            </p>
            <p className="mt-1 text-[15px] font-black">{extraction.pickupDistanceMiles} mi</p>
          </div>
          <div className="rounded-xl bg-white/8 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Trip
            </p>
            <p className="mt-1 text-[15px] font-black">{extraction.tripDistanceMiles} mi</p>
          </div>
          <div className="rounded-xl bg-white/8 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Time
            </p>
            <p className="mt-1 text-[15px] font-black">{extraction.estimatedTimeMinutes} min</p>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-white/8 px-3 py-2 text-[12px] font-medium text-slate-300">
          {extraction.destinationCue}
        </p>
      </div>
    </div>
  );
}

function numberInputClass(hasError: boolean) {
  return [
    "h-12 w-full rounded-xl border bg-white px-4 text-[15px] font-semibold text-slate-900",
    "shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] outline-none transition-all duration-150",
    "focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]",
    hasError ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-cyan-500",
  ].join(" ");
}

async function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

export default function ScreenshotTripAssistant({
  onConfirm,
  onApplyToForm,
  disabled,
}: ScreenshotTripAssistantProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reviewTrip, setReviewTrip] = useState<TripInput | null>(null);
  const [extraction, setExtraction] = useState<TripScreenshotExtraction | null>(null);
  const [extractionMode, setExtractionMode] = useState<"openai" | "demo" | null>(null);
  const [demoScenario, setDemoScenario] = useState<DemoTripScenario | null>(null);
  const [status, setStatus] = useState<"idle" | "extracting" | "review" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(
    () => (reviewTrip ? validateTripInput(reviewTrip) : {}),
    [reviewTrip]
  );
  const hasErrors = Object.keys(errors).length > 0;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Upload a screenshot image to use AI extraction.");
      setStatus("error");
      return;
    }

    setStatus("extracting");
    setError(null);
    setSubmitAttempted(false);
    setExtraction(null);
    setExtractionMode(null);
    setDemoScenario(null);
    setReviewTrip(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const imageDataUrl = await readAsDataUrl(file);
      const response = await fetch("/api/extract-trip-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });
      const payload = (await response.json()) as {
        extraction?: TripScreenshotExtraction;
        mode?: "openai" | "demo";
        demoScenario?: DemoTripScenario;
        error?: string;
      };

      if (!response.ok || !payload.extraction) {
        throw new Error(payload.error || "Vision extraction failed.");
      }

      const nextTrip = buildTrip(payload.extraction);
      setExtraction(payload.extraction);
      setExtractionMode(payload.mode ?? "openai");
      setDemoScenario(payload.demoScenario ?? null);
      setReviewTrip(nextTrip);
      onApplyToForm(nextTrip);
      setStatus("review");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The screenshot could not be read. You can still enter the trip manually."
      );
      setStatus("error");
    }
  };

  const handleDemoScenario = async (scenario: DemoTripScenario) => {
    setStatus("extracting");
    setError(null);
    setSubmitAttempted(false);
    setExtraction(null);
    setExtractionMode("demo");
    setDemoScenario(scenario);
    setReviewTrip(null);
    setPreviewUrl(null);

    try {
      const response = await fetch("/api/extract-trip-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoMode: true, demoScenario: scenario }),
      });
      const payload = (await response.json()) as {
        extraction?: TripScreenshotExtraction;
        mode?: "openai" | "demo";
        demoScenario?: DemoTripScenario;
        error?: string;
      };

      if (!response.ok || !payload.extraction) {
        throw new Error(payload.error || "Demo extraction failed.");
      }

      const nextTrip = buildTrip(payload.extraction);
      setExtraction(payload.extraction);
      setExtractionMode(payload.mode ?? "demo");
      setDemoScenario(payload.demoScenario ?? scenario);
      setReviewTrip(nextTrip);
      onApplyToForm(nextTrip);
      setStatus("review");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The demo extraction could not run. Manual entry is still available."
      );
      setStatus("error");
    }
  };

  const handleInputChange = (field: ReviewField) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!reviewTrip) return;
    const raw = e.target.value;
    const parsed = raw === "" ? 0 : Number(raw);
    setReviewTrip({
      ...reviewTrip,
      [field]: Number.isNaN(parsed) ? 0 : parsed,
    });
  };

  const handleConfirm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!reviewTrip || hasErrors || disabled) return;
    onConfirm(reviewTrip);
  };

  const confidenceStyle =
    extraction?.confidence === "high"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : extraction?.confidence === "medium"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_20px_50px_-8px_rgba(15,23,42,0.14)]">
      <div className="border-b border-cyan-100 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-5 text-white sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.45)]">
              <SparkIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">AI Screenshot Check</h2>
              <p className="text-[13px] text-cyan-100/80">Upload, review, then run the same Trip Check math</p>
            </div>
          </div>
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-100">
            Co-pilot
          </span>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-7">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "extracting"}
          className="btn-press flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/70 px-5 py-7 text-center transition hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <SparkIcon className="h-5 w-5" />
          </span>
          <span className="mt-3 text-[15px] font-black text-slate-900">
            {status === "extracting" ? "Reading screenshot..." : "Upload trip offer screenshot"}
          </span>
          <span className="mt-1 max-w-sm text-[13px] leading-5 text-slate-500">
            Use a phone screenshot or desktop image. You will confirm every value before calculation.
          </span>
        </button>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            Object.entries(DEMO_TRIP_EXTRACTIONS) as [
              DemoTripScenario,
              (typeof DEMO_TRIP_EXTRACTIONS)[DemoTripScenario],
            ][]
          ).map(([scenario, demo]) => (
            <button
              key={scenario}
              type="button"
              onClick={() => void handleDemoScenario(scenario)}
              disabled={status === "extracting"}
              className="btn-press rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-black text-slate-900">{demo.label}</span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-700">
                  Demo
                </span>
              </span>
              <span className="mt-1 block text-[12px] leading-5 text-slate-500">
                {demo.expectation}
              </span>
            </button>
          ))}
        </div>

        {status === "extracting" ? (
          <div className="mt-4 rounded-xl border border-cyan-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-500" />
              <div>
                <p className="text-[13px] font-bold text-slate-800">Extracting payout, miles, and time</p>
                <p className="text-[12px] text-slate-500">This usually takes a few seconds. Manual entry stays available.</p>
              </div>
            </div>
          </div>
        ) : null}

        {previewUrl ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Uploaded trip offer screenshot preview" className="max-h-72 w-full object-contain" />
          </div>
        ) : null}

        {demoScenario && !previewUrl ? <DemoOfferPreview scenario={demoScenario} /> : null}

        {status === "error" && error ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-start gap-2 text-[13px] font-semibold leading-5 text-amber-800">
              <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </p>
            <p className="mt-2 text-[12px] leading-5 text-amber-700">
              Switch to the manual fields below, or try a clearer screenshot with the payout, mileage, and time visible.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleDemoScenario("weak-short-delivery")}
                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-[12px] font-bold text-amber-800 transition hover:bg-amber-100"
              >
                Run weak demo
              </button>
              <button
                type="button"
                onClick={() => void handleDemoScenario("steady-mid-distance")}
                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-[12px] font-bold text-amber-800 transition hover:bg-amber-100"
              >
                Run decent demo
              </button>
            </div>
          </div>
        ) : null}

        {status === "review" && reviewTrip && extraction ? (
          <form onSubmit={handleConfirm} className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-black uppercase tracking-widest text-slate-500">Confirm extraction</p>
                <p className="mt-1 text-[13px] leading-5 text-slate-600">{extraction.rawSummary}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${confidenceStyle}`}>
                {extractionMode === "demo" ? "Demo mode" : `${extraction.confidence} confidence`}
              </span>
            </div>

            {extractionMode === "demo" ? (
              <p className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-[12px] font-semibold text-cyan-800">
                Using sample extraction for preview. You can still edit every value before the
                Smart Verdict.
              </p>
            ) : null}

            {extraction.destinationCue ? (
              <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600">
                Destination cue: <span className="font-bold text-slate-900">{extraction.destinationCue}</span>
              </p>
            ) : null}

            {extraction.missingFields.length || extraction.warnings.length ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-amber-800">
                  <AlertIcon className="h-3.5 w-3.5" />
                  Check before calculating
                </p>
                <ul className="mt-2 space-y-1 text-[12px] leading-5 text-amber-700">
                  {[...extraction.missingFields, ...extraction.warnings].map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {REVIEW_FIELDS.map((item) => {
                const hasError = submitAttempted && Boolean(errors[item.field]);
                return (
                  <label key={item.field} className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      {item.icon}
                      {item.label}
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step={item.step}
                        value={reviewTrip[item.field] || ""}
                        onChange={handleInputChange(item.field)}
                        className={numberInputClass(hasError)}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                        {item.unit}
                      </span>
                    </div>
                    {hasError ? (
                      <span className="text-[12px] font-medium text-rose-600">
                        {errors[item.field]}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={disabled}
              className="btn-press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 text-[15px] font-black text-slate-950 shadow-[0_8px_20px_rgba(6,182,212,0.24)] transition hover:-translate-y-0.5 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
            >
              <CheckIcon className="h-4 w-4" />
              Confirm and Get Smart Verdict
            </button>

            {submitAttempted && hasErrors ? (
              <p className="mt-3 text-center text-[13px] font-medium text-rose-600">
                Confirm or fill the highlighted fields before calculating.
              </p>
            ) : null}
          </form>
        ) : null}
      </div>
    </section>
  );
}
