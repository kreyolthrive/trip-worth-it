"use client";

import { FormEvent, useState } from "react";
import { updateBetaSignupFrustration } from "@/lib/betaSignupClient";
import { CheckIcon, MailIcon } from "@/components/ui/Icons";

export default function BetaThankYouFeedback() {
  const [frustration, setFrustration] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const cleanFrustration = frustration.trim();
    if (!cleanFrustration) {
      setStatus("error");
      setMessage("Add a short note before saving feedback.");
      return;
    }

    const raw = window.sessionStorage.getItem("trip-worth-it:last-beta-signup");
    let email = "";
    try {
      email = raw ? (JSON.parse(raw) as { email?: string }).email || "" : "";
    } catch {
      window.sessionStorage.removeItem("trip-worth-it:last-beta-signup");
    }

    if (!email) {
      setStatus("error");
      setMessage("We could not match this feedback to your signup. Your beta spot is still saved.");
      return;
    }

    try {
      setStatus("saving");
      await updateBetaSignupFrustration(email, cleanFrustration);
      window.sessionStorage.setItem(
        "trip-worth-it:last-beta-signup",
        JSON.stringify({ email, frustration: cleanFrustration })
      );
      setStatus("saved");
      setMessage("Thanks. Your feedback was saved with your beta signup.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not save your feedback.");
    }
  };

  return (
    <section className="card-enter rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_55px_-26px_rgba(15,23,42,0.4)] sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        <CheckIcon className="h-6 w-6" />
      </div>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600">
        Beta access
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
        You&apos;re on the beta list.
      </h1>
      <p className="mt-4 max-w-2xl text-[16px] leading-7 text-slate-600">
        Thanks for your interest in Trip Worth-It. We&apos;re testing the product with
        early users and gathering feedback to improve the experience for gig drivers.
      </p>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-500">
        We&apos;ll use your interest and feedback to shape the next version of the
        product.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <label className="block">
          <span className="text-[13px] font-bold text-slate-800">
            What is your biggest frustration as a driver right now?
          </span>
          <textarea
            value={frustration}
            onChange={(event) => {
              setFrustration(event.target.value);
              if (status !== "saving") {
                setStatus("idle");
                setMessage(null);
              }
            }}
            rows={4}
            className="mt-3 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-slate-900 outline-none transition focus:border-cyan-500 focus:shadow-[0_0_0_4px_rgba(6,182,212,0.14)]"
            placeholder="Optional, but helpful for shaping the beta"
          />
        </label>

        {message ? (
          <div
            className={[
              "mt-4 rounded-2xl border px-4 py-3 text-[13px] font-medium",
              status === "saved"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700",
            ].join(" ")}
          >
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={status === "saving"}
          className="btn-press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-[15px] font-bold text-white shadow-[0_16px_40px_-20px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <MailIcon className="h-4 w-4" />
          {status === "saving" ? "Saving..." : "Save Feedback"}
        </button>
      </form>
    </section>
  );
}
