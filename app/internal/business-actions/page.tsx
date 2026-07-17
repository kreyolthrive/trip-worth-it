import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business Actions | Rider Local Guide",
  description: "Internal business action attribution report.",
};

type BusinessActionRow = {
  id: string;
  business_id: string | null;
  driver_id: string | null;
  driver_slug: string | null;
  business_slug: string | null;
  business_name: string | null;
  category: string | null;
  action_type: string;
  page_path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type CountItem = {
  label: string;
  count: number;
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
      supabaseUrl: null,
      serviceRoleKey: null,
    };
  }

  return {
    error: null,
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey,
  };
}

async function fetchBusinessActions() {
  const { supabaseUrl, serviceRoleKey, error } = getSupabaseConfig();

  if (error || !supabaseUrl || !serviceRoleKey) {
    return {
      actions: [] as BusinessActionRow[],
      error,
    };
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/business_actions?select=*&order=created_at.desc&limit=300`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    return {
      actions: [] as BusinessActionRow[],
      error: `Failed to load business actions: ${response.status} ${message}`,
    };
  }

  const actions = (await response.json()) as BusinessActionRow[];

  return {
    actions,
    error: null,
  };
}

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
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getMetadataValue(
  metadata: Record<string, unknown> | null,
  key: string
) {
  const value = metadata?.[key];

  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);

  return null;
}

function isTestAction(action: BusinessActionRow) {
  const href = getMetadataValue(action.metadata, "href") ?? "";
  const source = getMetadataValue(action.metadata, "source") ?? "";
  const test = action.metadata?.test;

  return (
    href.includes("localhost") ||
    source === "curl" ||
    source === "test" ||
    test === true
  );
}

function countBy(
  actions: BusinessActionRow[],
  getKey: (action: BusinessActionRow) => string | null | undefined
): CountItem[] {
  const counts = new Map<string, number>();

  for (const action of actions) {
    const key = getKey(action) || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function getActionCount(actions: BusinessActionRow[], actionType: string) {
  return actions.filter((action) => action.action_type === actionType).length;
}

function KpiCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.72)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function CountList({
  title,
  eyebrow,
  items,
}: {
  title: string;
  eyebrow: string;
  items: CountItem[];
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.72)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
        {title}
      </h2>

      <div className="mt-5 space-y-3">
        {items.length > 0 ? (
          items.slice(0, 8).map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <span className="text-sm font-bold text-slate-700">
                {formatLabel(item.label)}
              </span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                {item.count}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm font-semibold text-slate-500">
            No activity yet.
          </p>
        )}
      </div>
    </section>
  );
}

export default async function BusinessActionsPage() {
  const { actions, error } = await fetchBusinessActions();

  const productionActions = actions.filter((action) => !isTestAction(action));
  const testActions = actions.filter(isTestAction);

  const topBusinesses = countBy(
    productionActions,
    (action) => action.business_name ?? action.business_slug
  );

  const topDrivers = countBy(
    productionActions,
    (action) => action.driver_slug
  );

  const topActionTypes = countBy(
    productionActions,
    (action) => action.action_type
  );

  const topCategories = countBy(
    productionActions,
    (action) => action.category
  );

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
              Internal report
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Business Action Attribution
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Tracks which driver QR source generated business clicks, calls,
              request-info actions, website visits, offers, and directions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/internal/pilot-metrics"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-cyan-300 hover:text-slate-950"
            >
              Pilot Metrics
            </a>
            <a
              href="/miami"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800"
            >
              Miami Guide
            </a>
          </div>
        </header>

        {error ? (
          <section className="mt-6 rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm font-bold leading-6 text-red-800">
            {error}
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Production actions"
            value={productionActions.length}
            detail="Excludes curl and localhost test activity."
          />
          <KpiCard
            label="Total actions"
            value={actions.length}
            detail="All recent business action rows loaded."
          />
          <KpiCard
            label="Call clicks"
            value={getActionCount(productionActions, "call_click")}
            detail="Direct phone-tap actions from business listings."
          />
          <KpiCard
            label="Request info"
            value={getActionCount(productionActions, "request_info_click")}
            detail="Riders showing interest through guide CTAs."
          />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Business clicks"
            value={getActionCount(productionActions, "business_click")}
            detail="Listing or internal business detail clicks."
          />
          <KpiCard
            label="Website clicks"
            value={getActionCount(productionActions, "website_click")}
            detail="External website visits from listings."
          />
          <KpiCard
            label="Directions"
            value={getActionCount(productionActions, "directions_click")}
            detail="Map or direction-intent actions."
          />
          <KpiCard
            label="Test/local"
            value={testActions.length}
            detail="Useful for QA, excluded from business proof."
          />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-4">
          <CountList
            eyebrow="Businesses"
            title="Top Businesses"
            items={topBusinesses}
          />
          <CountList eyebrow="Drivers" title="Top Drivers" items={topDrivers} />
          <CountList
            eyebrow="Actions"
            title="Action Types"
            items={topActionTypes}
          />
          <CountList
            eyebrow="Categories"
            title="Top Categories"
            items={topCategories}
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_-42px_rgba(15,23,42,0.72)]">
          <div className="border-b border-slate-200 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
              Recent attribution events
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Recent Business Actions
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              This table is the proof layer for business owners: driver source,
              business, action type, page path, and timestamp.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Business</th>
                  <th className="px-5 py-4">Driver</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Button / Link</th>
                  <th className="px-5 py-4">Source</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {actions.length > 0 ? (
                  actions.slice(0, 60).map((action) => {
                    const href = getMetadataValue(action.metadata, "href");
                    const label = getMetadataValue(action.metadata, "label");
                    const source = getMetadataValue(action.metadata, "source");
                    const isTest = isTestAction(action);

                    return (
                      <tr key={action.id} className="align-top">
                        <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-slate-500">
                          {formatDate(action.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                            {formatLabel(action.action_type)}
                          </span>
                          {isTest ? (
                            <span className="ml-2 rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
                              Test
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-950">
                            {action.business_name ??
                              formatLabel(action.business_slug)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {action.business_slug ?? "No slug"}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-700">
                          {action.driver_slug ?? "Unknown"}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-700">
                          {action.category ?? "Unknown"}
                        </td>
                        <td className="max-w-sm px-5 py-4">
                          <p className="font-bold text-slate-700">
                            {label ?? "No label"}
                          </p>
                          <p className="mt-1 break-all text-xs font-semibold text-slate-400">
                            {href ?? "No href"}
                          </p>
                        </td>
                        <td className="max-w-xs px-5 py-4">
                          <p className="font-bold text-slate-700">
                            {source ?? "Unknown"}
                          </p>
                          <p className="mt-1 break-all text-xs font-semibold text-slate-400">
                            {action.page_path ?? "No page path"}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-8 text-center text-sm font-bold text-slate-500"
                    >
                      No business action rows found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-cyan-200 bg-cyan-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            Business-owner proof statement
          </p>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Each tracked action can be tied to a driver QR source, business
            listing, action type, timestamp, page path, and button metadata. This
            gives businesses proof of calls, request-info clicks, business
            clicks, website visits, directions, and offer actions generated by
            Rider Local Guide.
          </p>
        </section>
      </div>
    </main>
  );
}