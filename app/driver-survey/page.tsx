import PilotClickTracker from "@/components/PilotClickTracker";
import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";

const DRIVER_SURVEY_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc2Hqb3icAd4xShtsQw0jrJPjM_EEMPEP5FahCxhFkhcBsBcQ/viewform";

export const metadata: Metadata = {
  title: "Miami Driver Survey | Rider Local Guide",
  description:
    "A quick survey for Uber, Lyft, taxi, shuttle, and delivery drivers about riders asking for local recommendations in Miami.",
};

const proofPoints = [
  {
    value: "3 min",
    label: "Quick survey",
    detail: "Fast questions for active drivers.",
  },
  {
    value: "$5",
    label: "First 20 qualified",
    detail: "Coffee/gas e-gift card after review.",
  },
  {
    value: "$25",
    label: "Gas card drawing",
    detail: "Qualified responses enter the raffle.",
  },
];

const driverQuestions = [
  "How often riders ask for food, nightlife, attractions, or services.",
  "What kinds of passengers ask most: tourists, locals, airport riders, or nightlife riders.",
  "How drivers currently answer recommendation questions.",
  "Whether drivers would use a small removable QR guide card.",
  "What concerns drivers have about safety, platform rules, privacy, and compensation.",
];

const categories = [
  "Food",
  "Coffee",
  "Late-night spots",
  "Things to do",
  "Beauty / barber",
  "Phone repair",
  "Local services",
  "Care support",
];

function isSurveyReady() {
  return DRIVER_SURVEY_URL.startsWith("http");
}

export default function DriverSurveyPage() {
  const surveyReady = isSurveyReady();

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f4f7fb] text-slate-950">
      <Suspense fallback={null}>
        <PilotClickTracker />
      </Suspense>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/miami" className="flex items-center gap-3">
            <Image
              src="/Rider-Local-Guide-Logo.png"
              alt="Rider Local Guide"
              width={48}
              height={48}
              priority
              className="h-12 w-12 rounded-2xl object-contain shadow-sm"
            />

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-700">
                Rider Local Guide
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Miami driver survey
              </p>
            </div>
          </a>

          <a
            href="/miami"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:border-cyan-300 hover:text-slate-950"
          >
            Miami Guide
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(6,182,212,0.2),transparent_30%),radial-gradient(circle_at_84%_8%,rgba(249,115,22,0.14),transparent_26%),linear-gradient(180deg,#ffffff,#f4f7fb)]" />

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-18">
          <div>
            <div className="flex flex-wrap gap-2">
              {["Uber", "Lyft", "Delivery", "Taxi", "Shuttle"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-900"
                >
                  {item}
                </span>
              ))}
            </div>

            <h1 className="mt-5 text-[2.65rem] font-black leading-[0.96] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
              Do riders ask you where to eat, go, or what is open late?
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              We are collecting feedback from Miami-area drivers to understand how
              often passengers ask for local recommendations — and whether Rider
              Local Guide could help riders, drivers, and local businesses.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={surveyReady ? DRIVER_SURVEY_URL : "#survey-not-ready"}
                target={surveyReady ? "_blank" : undefined}
                rel={surveyReady ? "noopener noreferrer" : undefined}
                data-track-event="lead_intent"
                data-track-category="Driver Survey"
                data-track-business="Driver Survey"
                className="btn-press inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              >
                Take the Driver Survey
              </a>

              <a
                href="#why-this-matters"
                className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-950 shadow-sm hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              >
                Why This Matters
              </a>
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
              No Uber/Lyft account information, passenger information, or private
              platform data is requested.
            </p>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_30px_90px_-55px_rgba(15,23,42,0.9)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Survey incentive
            </p>

            <h2 className="mt-3 text-2xl font-black">
              First 20 qualified drivers can receive a $5 coffee/gas e-gift card.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              All qualified completed responses also enter a drawing for one $25
              gas card. Selected Miami drivers may be invited into the paid pilot.
            </p>

            <div className="mt-5 grid gap-3">
              {proofPoints.map((point) => (
                <div
                  key={point.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                >
                  <p className="text-3xl font-black text-white">{point.value}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                    {point.label}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-slate-300">
                    {point.detail}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section id="why-this-matters" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
              Why this matters
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Drivers already act like local guides.
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
              Riders often ask drivers where to eat, where to go, what is open
              late, or what local services they should use. This survey helps us
              measure that behavior before expanding the Miami pilot.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-200 bg-cyan-50 p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
              What we are trying to learn
            </p>

            <div className="mt-5 space-y-3">
              {driverQuestions.map((question) => (
                <div
                  key={question}
                  className="rounded-2xl border border-cyan-100 bg-white p-4 text-sm font-bold leading-6 text-slate-700"
                >
                  {question}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.7)]">
          <div className="grid lg:grid-cols-[1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
                Help shape the pilot
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Your feedback can help us build better data for drivers, partners,
                and local businesses.
              </h2>

              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
                We want to understand real rider behavior, not guess. Your answers
                can help us decide which categories matter most, which areas to
                test, and what drivers need before joining the program.
              </p>

              <div className="mt-6">
                <a
                  href={surveyReady ? DRIVER_SURVEY_URL : "#survey-not-ready"}
                  target={surveyReady ? "_blank" : undefined}
                  rel={surveyReady ? "noopener noreferrer" : undefined}
                  data-track-event="lead_intent"
                  data-track-category="Driver Survey"
                  data-track-business="Driver Survey"
                  className="btn-press inline-flex min-h-12 w-full items-center justify-center rounded-full bg-cyan-400 px-6 text-sm font-black text-slate-950 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 sm:w-auto"
                >
                  Start Survey
                </a>
              </div>

              {!surveyReady ? (
                <p id="survey-not-ready" className="mt-4 text-xs font-bold text-orange-700">
                  Survey link not connected yet. Replace DRIVER_SURVEY_URL with your Google Form link.
                </p>
              ) : null}
            </div>

            <div className="bg-slate-950 p-6 text-white sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                Qualification note
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Gift cards are available for qualified Uber, Lyft, taxi, shuttle,
                or delivery drivers in the Miami/South Florida area who complete
                the survey with valid contact information. Limited to the first
                20 qualified responses.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-bold leading-6 text-slate-200">
                Rider Local Guide is an independent local discovery pilot. It is
                not affiliated with Uber, Lyft, or any rideshare platform.
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="pb-10 text-center text-xs leading-5 text-slate-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p>
            Independent local discovery pilot. Not affiliated with Uber, Lyft, or any
            rideshare platform.
          </p>
          <p className="mt-2">
            We do not request passenger information, Uber/Lyft account information,
            or private platform data.
          </p>
        </div>
      </footer>
    </main>
  );
}