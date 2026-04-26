"use client";

import { FormEvent, useMemo, useState } from "react";
import { MailIcon } from "@/components/ui/Icons";

interface EmailCaptureProps {
  onSubmitEmail: (email: string) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailCapture({ onSubmitEmail }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const isValid = useMemo(() => EMAIL_REGEX.test(email.trim()), [email]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAttempted(true);
    if (!isValid) return;
    onSubmitEmail(email.trim());
    setSubmitted(true);
    setEmail("");
  };

  if (submitted) {
    return (
      <section className="card-enter overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 shadow-[0_2px_4px_rgba(15,23,42,0.06)] sm:px-6">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-emerald-700">
          <MailIcon className="h-4 w-4" />
          You&rsquo;re on the list — thanks for helping shape the beta.
        </p>
      </section>
    );
  }

  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_4px_rgba(15,23,42,0.06),0_8px_20px_-4px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-slate-800">
          <MailIcon className="h-4 w-4 text-slate-400" />
          Help Shape the Beta
        </h3>
        <p className="mt-0.5 text-[12px] text-slate-400">
          Get occasional updates as Trip Worth-It improves
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 sm:px-6">
        <div className="flex gap-2.5">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={[
              "h-11 flex-1 rounded-xl border bg-slate-50 px-3.5 text-[14px] font-medium text-slate-900",
              "outline-none transition-all duration-150 placeholder:text-slate-400",
              "focus:bg-white focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]",
              attempted && !isValid
                ? "border-rose-400 focus:border-rose-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]"
                : "border-slate-200 focus:border-cyan-500",
            ].join(" ")}
          />
          <button
            type="submit"
            className="btn-press h-11 rounded-xl bg-slate-900 px-4 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(15,23,42,0.3)] transition hover:bg-slate-800"
          >
            Join
          </button>
        </div>

        {attempted && !isValid ? (
          <p className="mt-2 text-[12px] font-medium text-rose-600">
            Enter a valid email address.
          </p>
        ) : null}
      </form>
    </section>
  );
}
