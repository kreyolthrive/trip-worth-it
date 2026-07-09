import BusinessPilotForm from "@/components/BusinessPilotForm";

export default function BusinessPilotPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <a
          href="/miami"
          className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"
        >
          Back to Miami Guide
        </a>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
            Free Miami Pilot
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Feature your business in front of local riders
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            We are testing a rider-friendly local discovery guide in Miami.
            Passengers scan a QR code inside participating vehicles and discover
            nearby restaurants, services, events, care support, beauty, auto help,
            and useful local businesses.
          </p>
        </section>

        <section className="mt-8">
          <BusinessPilotForm />
        </section>
      </div>
    </main>
  );
}