"use client";

import { FormEvent, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

const categories = [
  "Food & Restaurants",
  "Beauty / Barber",
  "Auto / Mechanic",
  "Tax / Legal",
  "Care & Recovery",
  "Events / Attractions",
  "Phone Repair",
  "Home Services",
  "Other",
];

const preferredCtas = [
  "Call",
  "Visit Website",
  "Book Appointment",
  "WhatsApp",
  "Request Info",
  "Get Offer",
];

export default function BusinessPilotForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      businessName: String(formData.get("businessName") || "").trim(),
      ownerName: String(formData.get("ownerName") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      website: String(formData.get("website") || "").trim(),
      addressOrServiceArea: String(formData.get("addressOrServiceArea") || "").trim(),
      offer: String(formData.get("offer") || "").trim(),
      preferredCta: String(formData.get("preferredCta") || "").trim(),
      logoOrImageUrl: String(formData.get("logoOrImageUrl") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      consent: formData.get("consent") === "on",
    };

    try {
      const response = await fetch("/api/business-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong.");
      }

      setState("success");
      setMessage("Your business was submitted for the free pilot. We will review it soon.");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.75)] sm:p-7"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-black text-slate-900">Business Name *</span>
          <input
            name="businessName"
            required
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="Island Bites Restaurant"
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-900">Owner / Manager Name *</span>
          <input
            name="ownerName"
            required
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="Owner name"
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-900">Phone</span>
          <input
            name="phone"
            type="tel"
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="(305) 555-0142"
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-900">Email</span>
          <input
            name="email"
            type="email"
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="owner@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-900">Category *</span>
          <select
            name="category"
            required
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-900">Preferred CTA *</span>
          <select
            name="preferredCta"
            required
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">Select CTA</option>
            {preferredCtas.map((cta) => (
              <option key={cta} value={cta}>
                {cta}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-black text-slate-900">Short Business Description *</span>
          <textarea
            name="description"
            required
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="Tell riders what your business offers in 1–3 sentences."
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-900">Website / Booking / Social Link</span>
          <input
            name="website"
            type="url"
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="https://yourbusiness.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-900">Address or Service Area</span>
          <input
            name="addressOrServiceArea"
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="Miami, Brickell, Little Haiti, Broward, etc."
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-900">Pilot Offer</span>
          <input
            name="offer"
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="10% off, free estimate, free consultation..."
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-900">Logo / Image Link</span>
          <input
            name="logoOrImageUrl"
            type="url"
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="Link to logo, Instagram, website image..."
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-black text-slate-900">Notes</span>
          <textarea
            name="notes"
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="Anything else we should know?"
          />
        </label>
      </div>

      <label className="mt-5 flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-400"
        />
        <span>
          I agree to let Rider Local Guide feature this business during the free pilot,
          including business name, category, description, offer, image/logo, and contact link.
        </span>
      </label>

      <button
        type="submit"
        disabled={state === "submitting"}
        className="btn-press mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting" ? "Submitting..." : "Submit Business for Free Pilot"}
      </button>

      {message ? (
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm font-black ${
            state === "success"
              ? "bg-emerald-50 text-emerald-900"
              : "bg-rose-50 text-rose-900"
          }`}
        >
          {message}
        </p>
      ) : null}

      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
        This is a pilot test. We cannot guarantee customers yet. We are testing scans,
        clicks, and requests to see whether the model creates value for businesses,
        riders, and drivers.
      </p>
    </form>
  );
}