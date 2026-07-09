type PilotEvent = {
  id: string;
  event_type: string;
  driver_slug: string | null;
  business_slug: string | null;
  category: string | null;
  neighborhood: string | null;
  page_path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\bqr\b/gi, "QR")
    .replace(/\bcta\b/gi, "CTA")
    .replace(/\butm\b/gi, "UTM")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function countBy(events: PilotEvent[], key: keyof PilotEvent) {
  const counts = new Map<string, number>();

  for (const event of events) {
    const rawValue = event[key];
    const value = typeof rawValue === "string" && rawValue ? rawValue : "Unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function metricCount(events: PilotEvent[], eventType: string) {
  return events.filter((event) => event.event_type === eventType).length;
}

async function getPilotEvents() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      events: [] as PilotEvent[],
      error:
        "Pilot metrics are not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/pilot_events?select=*&order=created_at.desc&limit=200`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const details = await response.text();

    return {
      events: [] as PilotEvent[],
      error: `Could not load pilot events. ${details}`,
    };
  }

  const events = (await response.json()) as PilotEvent[];

  return {
    events,
    error: "",
  };
}

export default async function PilotMetricsPage() {
  const { events, error } = await getPilotEvents();

  const qrScans = metricCount(events, "qr_scan");
  const miamiPageViews = metricCount(events, "miami_page_view");
  const categoryClicks = metricCount(events, "category_click");
  const ctaClicks = metricCount(events, "cta_click");
  const leadStarted = metricCount(events, "lead_started");
  const leadSubmitted = metricCount(events, "lead_submitted");

  const topDrivers = countBy(events, "driver_slug").slice(0, 5);
  const topBusinesses = countBy(
    events.filter((event) => event.business_slug),
    "business_slug"
  ).slice(0, 5);
  const topCategories = countBy(
    events.filter((event) => event.category),
    "category"
  ).slice(0, 5);

  const conversionRate =
    qrScans > 0 ? Math.round((ctaClicks / qrScans) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
              Internal Dashboard
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Miami Pilot Metrics
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Track QR scans, guide views, category clicks, business actions,
              and early proof of rider engagement.
            </p>
          </div>

          <a
            href="/business-pilot"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-800 shadow-sm hover:border-cyan-300"
          >
            Business Pilot Page
          </a>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-950">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <MetricCard label="QR Scans" value={qrScans} />
          <MetricCard label="Page Views" value={miamiPageViews} />
          <MetricCard label="Category Clicks" value={categoryClicks} />
          <MetricCard label="CTA Clicks" value={ctaClicks} />
          <MetricCard label="Lead Started" value={leadStarted} />
          <MetricCard label="Lead Submitted" value={leadSubmitted} />
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.75)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Funnel Snapshot
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight">
            QR scan → guide view → click → action
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <FunnelStep label="QR Scans" value={qrScans} />
            <FunnelStep label="Guide Views" value={miamiPageViews} />
            <FunnelStep label="Category Clicks" value={categoryClicks} />
            <FunnelStep label="Business Actions" value={ctaClicks} />
          </div>

          <p className="mt-5 rounded-2xl bg-white/[0.08] p-4 text-sm font-semibold leading-6 text-slate-300">
            Current QR-to-CTA action rate:{" "}
            <span className="font-black text-white">{conversionRate}%</span>.
            This is early pilot data, not final performance.
          </p>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <RankingCard title="Top Drivers" items={topDrivers} />
          <RankingCard title="Top Businesses" items={topBusinesses} format />
          <RankingCard title="Top Categories" items={topCategories} />
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
              Recent Events
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Latest pilot activity
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4">Event</th>
                  <th className="px-5 py-4">Driver</th>
                  <th className="px-5 py-4">Business</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Page</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {events.slice(0, 50).map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {formatDate(event.created_at)}
                    </td>
                    <td className="px-5 py-4 font-black text-slate-950">
                      {formatLabel(event.event_type)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {formatLabel(event.driver_slug)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {formatLabel(event.business_slug)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {event.category || "Unknown"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {event.page_path || "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/[0.08] p-4">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function RankingCard({
  title,
  items,
  format = false,
}: {
  title: string;
  items: { label: string; count: number }[];
  format?: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
        {title}
      </p>

      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <p className="text-sm font-black text-slate-950">
                {format ? formatLabel(item.label) : item.label}
              </p>
              <p className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                {item.count}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            No data yet.
          </p>
        )}
      </div>
    </div>
  );
}