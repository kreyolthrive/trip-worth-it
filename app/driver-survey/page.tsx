const surveyUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSc2Hqb3icAd4xShtsQw0jrJPjM_EEMPEP5FahCxhFkhcBsBcQ/viewform";

export default function DriverSurveyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
            Miami Driver Local Guide Survey
          </p>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Help shape Rider Local Guide for Miami riders and drivers.
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
            Riders often ask drivers where to eat, where to go, what is open
            late, or what local services they should use. We are testing Rider
            Local Guide, a Miami local discovery pilot that helps passengers
            find curated food, services, attractions, late-night spots, and
            useful local businesses while they ride.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-sm font-black">3 minutes</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Quick driver feedback form.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-sm font-black">$5 thank-you</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                First 20 qualified Miami-area drivers after review.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-sm font-black">$25 drawing</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Qualified completed responses enter the drawing.
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
            <p className="text-sm font-bold leading-6 text-cyan-100">
              We do not ask for Uber/Lyft account information, passenger
              information, or private platform data.
            </p>
          </div>

          <a
            href={surveyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-cyan-400 px-6 text-center text-sm font-black text-slate-950 hover:bg-cyan-300 sm:w-auto"
          >
            Take the Driver Survey
          </a>

          <p className="mt-5 text-xs leading-5 text-slate-500">
            Independent local discovery pilot. Not affiliated with Uber, Lyft,
            or Miami-Dade County.
          </p>
        </div>
      </section>
    </main>
  );
}