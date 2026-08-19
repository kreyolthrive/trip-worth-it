"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { submitBetaSignup } from "@/lib/betaSignupClient";
import { BetaSignup } from "@/types/trip";
import { MailIcon } from "@/components/ui/Icons";

const PLATFORM_OPTIONS: BetaSignup["primaryPlatform"][] = [
  "Uber",
  "Lyft",
  "Uber Eats",
  "DoorDash",
  "Multi-app",
];

const COMMITMENT_OPTIONS: BetaSignup["drivingCommitment"][] = [
  "Full-time",
  "Part-time",
  "Side income / occasional",
];

interface FormValues {
  name: string;
  email: string;
  primaryPlatform: BetaSignup["primaryPlatform"];
  drivingCommitment: BetaSignup["drivingCommitment"];
  frustration: string;
}

const DEFAULT_VALUES: FormValues = {
  name: "",
  email: "",
  primaryPlatform: "Multi-app",
  drivingCommitment: "Part-time",
  frustration: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BetaSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES);
  const [attempted, setAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => {
    const next: Partial<Record<keyof FormValues, string>> = {};

    if (!values.name.trim()) {
      next.name = "Enter your name so we know who joined the beta.";
    }

    if (!EMAIL_REGEX.test(values.email.trim())) {
      next.email = "Enter a valid email so we can send beta updates.";
    }

    return next;
  }, [values.email, values.name]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
    setSubmitError(null);

    if (hasErrors) return;

    const payload: BetaSignup = {
      name: values.name.trim(),
      email: values.email.trim(),
      primaryPlatform: values.primaryPlatform,
      drivingCommitment: values.drivingCommitment,
      frustration: values.frustration.trim() || undefined,
      createdAt: new Date().toISOString(),
      source: "beta_landing_page",
      landingPath:
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/beta",
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      utmSource: searchParams.get("utm_source") || undefined,
      utmMedium: searchParams.get("utm_medium") || undefined,
      utmCampaign: searchParams.get("utm_campaign") || undefined,
      utmContent: searchParams.get("utm_content") || undefined,
      utmTerm: searchParams.get("utm_term") || undefined,
    };

    try {
      setIsSubmitting(true);
      await submitBetaSignup(payload);
      window.sessionStorage.setItem(
        "trip-worth-it:last-beta-signup",
        JSON.stringify({ email: payload.email, frustration: payload.frustration || "" })
      );
      router.push("/beta/thank-you");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not save your beta signup."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-[15px] text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(6,182,212,0.14)]";
  const labelClassName = "text-[13px] font-semibold text-slate-700";

  return (
    <section
      id="join-beta"
      className="card-enter rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_55px_-26px_rgba(15,23,42,0.4)] sm:p-8"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-cyan-400">
          <MailIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-600">
            Beta access
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Join the beta
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClassName}>Name</span>
            <input
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              className={[
                inputClassName,
                attempted && errors.name
                  ? "border-rose-400 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
                  : "",
              ].join(" ")}
              placeholder="Your name"
            />
            {attempted && errors.name ? (
              <p className="mt-2 text-[12px] font-medium text-rose-600">{errors.name}</p>
            ) : null}
          </label>

          <label className="block">
            <span className={labelClassName}>Email</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) =>
                setValues((current) => ({ ...current, email: event.target.value }))
              }
              className={[
                inputClassName,
                attempted && errors.email
                  ? "border-rose-400 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
                  : "",
              ].join(" ")}
              placeholder="you@example.com"
            />
            {attempted && errors.email ? (
              <p className="mt-2 text-[12px] font-medium text-rose-600">{errors.email}</p>
            ) : null}
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClassName}>What do you drive for most?</span>
            <select
              value={values.primaryPlatform}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  primaryPlatform: event.target.value as BetaSignup["primaryPlatform"],
                }))
              }
              className={inputClassName}
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClassName}>Full-time or part-time?</span>
            <select
              value={values.drivingCommitment}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  drivingCommitment: event.target.value as BetaSignup["drivingCommitment"],
                }))
              }
              className={inputClassName}
            >
              {COMMITMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className={labelClassName}>
            Optional: Biggest frustration as a driver right now
          </span>
          <textarea
            value={values.frustration}
            onChange={(event) =>
              setValues((current) => ({ ...current, frustration: event.target.value }))
            }
            rows={4}
            className={`${inputClassName} resize-y`}
            placeholder="Optional"
          />
        </label>

        {attempted && hasErrors ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
            Fix the highlighted fields to join the beta.
          </div>
        ) : submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
            {submitError}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[13px] text-slate-500">
              We&apos;ll only use this to contact early drivers and learn what problems
              matter most.
            </p>
            <p className="text-[12px] leading-6 text-slate-500">
              No spam. No resale of your info. Read the{" "}
              <Link
                href="/terms"
                className="font-semibold text-slate-700 underline underline-offset-2"
              >
                beta terms
              </Link>
              .
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-press inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-[15px] font-bold text-white shadow-[0_16px_40px_-20px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          {isSubmitting ? "Saving..." : "Get Early Access"}
        </button>
      </form>
    </section>
  );
}
