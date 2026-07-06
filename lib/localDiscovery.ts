import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  insertSupabaseRows,
  isSupabaseConfigured,
  selectSupabaseRows,
} from "@/lib/supabaseServer";
import {
  DriverPerformanceSummary,
  LocalDiscoveryEvent,
  LocalDiscoveryEventType,
  LocalDiscoveryLead,
} from "@/types/localDiscovery";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL_DISCOVERY_DIR = path.join(PROJECT_ROOT, "data");
const EVENTS_PATH = path.join(LOCAL_DISCOVERY_DIR, "local-discovery-events.json");
const LEADS_PATH = path.join(LOCAL_DISCOVERY_DIR, "local-discovery-leads.json");

const EVENT_TYPES = ["scan", "business_click", "category_tap"] as const;
const LEAD_STATUSES = ["new", "contacted", "closed"] as const;
const CONVERSION_STATUSES = ["pending", "approved", "rejected"] as const;

export type LocalDiscoveryStorageMode = "supabase" | "json_file" | "demo";

export interface LocalDiscoverySnapshot {
  events: LocalDiscoveryEvent[];
  leads: LocalDiscoveryLead[];
  storageMode: LocalDiscoveryStorageMode;
  storageMessage: string;
}

function optionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean ? clean.slice(0, maxLength) : undefined;
}

function requiredString(value: unknown, maxLength: number) {
  return optionalString(value, maxLength) || "";
}

function normalizeTimestamp(value: unknown) {
  const raw = typeof value === "string" && value.trim() ? value : undefined;
  if (!raw || Number.isNaN(Date.parse(raw))) return new Date().toISOString();
  return new Date(raw).toISOString();
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeDriverSlug(value: unknown) {
  const clean = optionalString(value, 80)?.toLowerCase();
  if (!clean) return undefined;
  return clean.replace(/[^a-z0-9-]/g, "").slice(0, 80) || undefined;
}

function isEventType(value: unknown): value is LocalDiscoveryEventType {
  return typeof value === "string" && EVENT_TYPES.includes(value as LocalDiscoveryEventType);
}

function normalizeLeadStatus(value: unknown): LocalDiscoveryLead["lead_status"] {
  return typeof value === "string" &&
    LEAD_STATUSES.includes(value as LocalDiscoveryLead["lead_status"])
    ? (value as LocalDiscoveryLead["lead_status"])
    : "new";
}

function normalizeConversionStatus(value: unknown): LocalDiscoveryLead["conversion_status"] {
  return typeof value === "string" &&
    CONVERSION_STATUSES.includes(value as LocalDiscoveryLead["conversion_status"])
    ? (value as LocalDiscoveryLead["conversion_status"])
    : "pending";
}

function normalizePhone(value: unknown) {
  const phone = requiredString(value, 40);
  return phone.replace(/[^\d+().\-\s]/g, "").slice(0, 40);
}

function normalizeEmail(value: unknown) {
  const email = optionalString(value, 254)?.toLowerCase();
  if (!email) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}

export function normalizeLocalDiscoveryEvent(
  value: unknown,
  fallback?: { userAgent?: string; referrer?: string }
): LocalDiscoveryEvent | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const eventType = raw.event_type;
  if (!isEventType(eventType)) return null;

  const visitorSessionId = requiredString(raw.visitor_session_id, 120);
  const pagePath = requiredString(raw.page_path, 240) || "/miami";
  if (!visitorSessionId) return null;

  return {
    id: optionalString(raw.id, 80),
    event_type: eventType,
    driver_slug: normalizeDriverSlug(raw.driver_slug),
    city: "miami",
    page_path: pagePath,
    visitor_session_id: visitorSessionId,
    user_agent: optionalString(raw.user_agent, 500) || fallback?.userAgent,
    referrer: optionalString(raw.referrer, 500) || fallback?.referrer,
    utm_source: optionalString(raw.utm_source, 120),
    utm_medium: optionalString(raw.utm_medium, 120),
    utm_campaign: optionalString(raw.utm_campaign, 120),
    category: optionalString(raw.category, 120),
    business_name: optionalString(raw.business_name, 160),
    click_target_href: optionalString(raw.click_target_href, 500),
    metadata: normalizeMetadata(raw.metadata),
    created_at: normalizeTimestamp(raw.created_at),
  };
}

export function normalizeLocalDiscoveryLead(value: unknown): LocalDiscoveryLead | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const businessName = requiredString(raw.business_name, 160);
  const category = requiredString(raw.category, 120);
  const customerName = requiredString(raw.customer_name, 120);
  const customerPhone = normalizePhone(raw.customer_phone);

  if (!businessName || !category || !customerName || customerPhone.length < 7) {
    return null;
  }

  return {
    id: optionalString(raw.id, 80),
    lead_status: normalizeLeadStatus(raw.lead_status),
    conversion_status: normalizeConversionStatus(raw.conversion_status),
    driver_slug: normalizeDriverSlug(raw.driver_slug),
    business_name: businessName,
    category,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: normalizeEmail(raw.customer_email),
    message: optionalString(raw.message, 800),
    city: "miami",
    visitor_session_id: optionalString(raw.visitor_session_id, 120),
    conversion_value: normalizeNumber(raw.conversion_value),
    estimated_payout: normalizeNumber(raw.estimated_payout),
    approved_payout: normalizeNumber(raw.approved_payout),
    metadata: normalizeMetadata(raw.metadata),
    created_at: normalizeTimestamp(raw.created_at),
    updated_at: optionalString(raw.updated_at, 80)
      ? normalizeTimestamp(raw.updated_at)
      : undefined,
  };
}

async function readJsonArray<T>(
  filePath: string,
  normalize: (entry: unknown) => T | null
): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => normalize(entry))
      .filter((entry): entry is T => entry !== null);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function appendJsonEntry<T>(filePath: string, entry: T, existing: T[]) {
  const next = [entry, ...existing].slice(0, 5000);
  await fs.mkdir(LOCAL_DISCOVERY_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(next, null, 2));
  return entry;
}

export async function readLocalDiscoveryEvents() {
  if (isSupabaseConfigured()) {
    const rows = await selectSupabaseRows<Record<string, unknown>>("local_discovery_events");
    return rows
      .map((entry) => normalizeLocalDiscoveryEvent(entry))
      .filter((entry): entry is LocalDiscoveryEvent => entry !== null)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }

  const events = await readJsonArray(EVENTS_PATH, normalizeLocalDiscoveryEvent);
  return events.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function readLocalDiscoveryLeads() {
  if (isSupabaseConfigured()) {
    const rows = await selectSupabaseRows<Record<string, unknown>>("local_discovery_leads");
    return rows
      .map((entry) => normalizeLocalDiscoveryLead(entry))
      .filter((entry): entry is LocalDiscoveryLead => entry !== null)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }

  const leads = await readJsonArray(LEADS_PATH, normalizeLocalDiscoveryLead);
  return leads.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function appendLocalDiscoveryEvent(event: LocalDiscoveryEvent) {
  if (isSupabaseConfigured()) {
    try {
      const [inserted] = await insertSupabaseRows("local_discovery_events", [
        {
          event_type: event.event_type,
          driver_slug: event.driver_slug,
          city: event.city,
          page_path: event.page_path,
          visitor_session_id: event.visitor_session_id,
          user_agent: event.user_agent,
          referrer: event.referrer,
          utm_source: event.utm_source,
          utm_medium: event.utm_medium,
          utm_campaign: event.utm_campaign,
          category: event.category,
          business_name: event.business_name,
          click_target_href: event.click_target_href,
          metadata: event.metadata || {},
          created_at: event.created_at,
        },
      ]);

      return {
        entry: normalizeLocalDiscoveryEvent(inserted) || event,
        mode: "supabase" as const,
      };
    } catch (error) {
      console.info("[local-discovery:supabase-event-write-fallback]", error);
    }
  }

  const existing = await readJsonArray(EVENTS_PATH, normalizeLocalDiscoveryEvent);
  const entry = await appendJsonEntry(EVENTS_PATH, event, existing);
  return { entry, mode: "json_file" as const };
}

export async function appendLocalDiscoveryLead(lead: LocalDiscoveryLead) {
  if (isSupabaseConfigured()) {
    try {
      const [inserted] = await insertSupabaseRows("local_discovery_leads", [
        {
          lead_status: lead.lead_status,
          conversion_status: lead.conversion_status,
          driver_slug: lead.driver_slug,
          city: lead.city,
          business_name: lead.business_name,
          category: lead.category,
          customer_name: lead.customer_name,
          customer_phone: lead.customer_phone,
          customer_email: lead.customer_email,
          message: lead.message,
          visitor_session_id: lead.visitor_session_id,
          conversion_value: lead.conversion_value,
          estimated_payout: lead.estimated_payout,
          approved_payout: lead.approved_payout,
          metadata: lead.metadata || {},
          created_at: lead.created_at,
        },
      ]);

      return {
        entry: normalizeLocalDiscoveryLead(inserted) || lead,
        mode: "supabase" as const,
      };
    } catch (error) {
      console.info("[local-discovery:supabase-lead-write-fallback]", error);
    }
  }

  const existing = await readJsonArray(LEADS_PATH, normalizeLocalDiscoveryLead);
  const entry = await appendJsonEntry(LEADS_PATH, lead, existing);
  return { entry, mode: "json_file" as const };
}

export async function readLocalDiscoverySnapshot(): Promise<LocalDiscoverySnapshot> {
  if (isSupabaseConfigured()) {
    try {
      const [events, leads] = await Promise.all([
        readLocalDiscoveryEvents(),
        readLocalDiscoveryLeads(),
      ]);

      return {
        events,
        leads,
        storageMode: "supabase",
        storageMessage: "Supabase connected.",
      };
    } catch (error) {
      console.info("[local-discovery:supabase-read-fallback]", error);
    }
  }

  try {
    const [events, leads] = await Promise.all([
      readJsonArray(EVENTS_PATH, normalizeLocalDiscoveryEvent),
      readJsonArray(LEADS_PATH, normalizeLocalDiscoveryLead),
    ]);

    return {
      events: events.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
      leads: leads.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
      storageMode: "json_file",
      storageMessage: "JSON file fallback active.",
    };
  } catch (error) {
    console.info("[local-discovery:demo-read-mode]", error);
    return {
      events: [],
      leads: [],
      storageMode: "demo",
      storageMessage: "Demo mode active. Persistent storage needs to be connected.",
    };
  }
}

export function summarizeDriverPerformance(
  events: LocalDiscoveryEvent[],
  leads: LocalDiscoveryLead[]
): DriverPerformanceSummary[] {
  const byDriver = new Map<string, DriverPerformanceSummary>();

  const ensureDriver = (driverSlug?: string) => {
    const driver_slug = driverSlug || "unassigned";
    const existing = byDriver.get(driver_slug);
    if (existing) return existing;

    const next: DriverPerformanceSummary = {
      driver_slug,
      scans: 0,
      business_clicks: 0,
      category_taps: 0,
      leads: 0,
      pending_conversions: 0,
      approved_conversions: 0,
      conversion_value: 0,
      estimated_payout: 0,
      approved_payout: 0,
    };

    byDriver.set(driver_slug, next);
    return next;
  };

  events.forEach((event) => {
    const summary = ensureDriver(event.driver_slug);
    if (event.event_type === "scan") summary.scans += 1;
    if (event.event_type === "business_click") summary.business_clicks += 1;
    if (event.event_type === "category_tap") summary.category_taps += 1;
  });

  leads.forEach((lead) => {
    const summary = ensureDriver(lead.driver_slug);
    summary.leads += 1;
    if (lead.conversion_status === "pending") summary.pending_conversions += 1;
    if (lead.conversion_status === "approved") summary.approved_conversions += 1;
    summary.conversion_value += lead.conversion_value || 0;
    summary.estimated_payout += lead.estimated_payout || 0;
    summary.approved_payout += lead.approved_payout || 0;
  });

  return Array.from(byDriver.values()).sort(
    (a, b) =>
      b.scans + b.business_clicks + b.category_taps + b.leads -
      (a.scans + a.business_clicks + a.category_taps + a.leads)
  );
}
