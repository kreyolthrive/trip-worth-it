import "server-only";

type SupabaseTable = "local_discovery_events" | "local_discovery_leads";

type SupabaseRequestOptions = {
  method?: "GET" | "POST";
  query?: string;
  body?: unknown;
  prefer?: string;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) return null;

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey,
  };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}

async function supabaseRestRequest<T>(
  table: SupabaseTable,
  { method = "GET", query = "", body, prefer }: SupabaseRequestOptions = {}
): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(`${config.url}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Supabase ${table} request failed: ${response.status} ${message}`);
  }

  return response.json() as Promise<T>;
}

export async function insertSupabaseRows<T extends Record<string, unknown>>(
  table: SupabaseTable,
  rows: T[]
) {
  return supabaseRestRequest<T[]>(table, {
    method: "POST",
    body: rows,
    prefer: "return=representation",
  });
}

export async function selectSupabaseRows<T>(table: SupabaseTable, limit = 500) {
  return supabaseRestRequest<T[]>(
    table,
    { query: `?select=*&order=created_at.desc&limit=${limit}` }
  );
}
