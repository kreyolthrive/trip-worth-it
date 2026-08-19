import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { BetaSignup } from "@/types/trip";

const PLATFORM_OPTIONS = ["Uber", "Lyft", "Uber Eats", "DoorDash", "Multi-app"] as const;
const COMMITMENT_OPTIONS = [
  "Full-time",
  "Part-time",
  "Side income / occasional",
] as const;

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BETA_SIGNUPS_DIR = path.join(PROJECT_ROOT, "data");
const BETA_SIGNUPS_PATH = path.join(BETA_SIGNUPS_DIR, "beta-signups.json");

type PlatformOption = (typeof PLATFORM_OPTIONS)[number];
type CommitmentOption = (typeof COMMITMENT_OPTIONS)[number];

function isPlatformOption(value: unknown): value is PlatformOption {
  return typeof value === "string" && PLATFORM_OPTIONS.includes(value as PlatformOption);
}

function isCommitmentOption(value: unknown): value is CommitmentOption {
  return typeof value === "string" && COMMITMENT_OPTIONS.includes(value as CommitmentOption);
}

function optionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean ? clean.slice(0, maxLength) : undefined;
}

function normalizeTimestamp(value: unknown) {
  const raw = typeof value === "string" && value.trim() ? value : undefined;
  if (!raw || Number.isNaN(Date.parse(raw))) return new Date().toISOString();
  return new Date(raw).toISOString();
}

export function normalizeBetaSignup(value: unknown): BetaSignup | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const name = optionalString(raw.name, 120) || "";
  const email = optionalString(raw.email, 254)?.toLowerCase() || "";

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!isPlatformOption(raw.primaryPlatform) || !isCommitmentOption(raw.drivingCommitment)) {
    return null;
  }

  return {
    name,
    email,
    primaryPlatform: raw.primaryPlatform,
    drivingCommitment: raw.drivingCommitment,
    frustration: optionalString(raw.frustration, 1200),
    createdAt: normalizeTimestamp(raw.createdAt ?? raw.submittedAt),
    source: optionalString(raw.source, 80) || "beta_landing_page",
    landingPath: optionalString(raw.landingPath, 240),
    referrer: optionalString(raw.referrer, 500),
    utmSource: optionalString(raw.utmSource, 120),
    utmMedium: optionalString(raw.utmMedium, 120),
    utmCampaign: optionalString(raw.utmCampaign, 120),
    utmContent: optionalString(raw.utmContent, 120),
    utmTerm: optionalString(raw.utmTerm, 120),
  };
}

export async function readBetaSignupsFile(): Promise<BetaSignup[]> {
  try {
    const raw = await fs.readFile(BETA_SIGNUPS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => normalizeBetaSignup(entry))
      .filter((entry): entry is BetaSignup => entry !== null)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function upsertBetaSignup(signup: BetaSignup) {
  const existing = await readBetaSignupsFile();
  const duplicateIndex = existing.findIndex(
    (entry) => entry.email.toLowerCase() === signup.email.toLowerCase()
  );
  const next =
    duplicateIndex >= 0
      ? existing.map((entry, index) =>
          index === duplicateIndex
            ? {
                ...entry,
                ...signup,
                createdAt: entry.createdAt,
                frustration: signup.frustration ?? entry.frustration,
              }
            : entry
        )
      : [signup, ...existing];

  await fs.mkdir(BETA_SIGNUPS_DIR, { recursive: true });
  await fs.writeFile(BETA_SIGNUPS_PATH, JSON.stringify(next, null, 2));

  return next;
}

export async function updateBetaSignupFeedback(email: string, frustration: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanFrustration = frustration.trim().slice(0, 1200);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !cleanFrustration) {
    return null;
  }

  const existing = await readBetaSignupsFile();
  const matchIndex = existing.findIndex((entry) => entry.email.toLowerCase() === cleanEmail);

  if (matchIndex < 0) return null;

  const next = existing.map((entry, index) =>
    index === matchIndex ? { ...entry, frustration: cleanFrustration } : entry
  );

  await fs.mkdir(BETA_SIGNUPS_DIR, { recursive: true });
  await fs.writeFile(BETA_SIGNUPS_PATH, JSON.stringify(next, null, 2));

  return next[matchIndex];
}

function csvCell(value: string | undefined) {
  const clean = value || "";
  return `"${clean.replaceAll('"', '""')}"`;
}

export function betaSignupsToCsv(signups: BetaSignup[]) {
  const headers = [
    "created_at",
    "name",
    "email",
    "primary_platform",
    "work_type",
    "biggest_frustration",
    "source",
    "landing_path",
    "referrer",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];

  const rows = signups.map((signup) =>
    [
      signup.createdAt,
      signup.name,
      signup.email,
      signup.primaryPlatform,
      signup.drivingCommitment,
      signup.frustration,
      signup.source,
      signup.landingPath,
      signup.referrer,
      signup.utmSource,
      signup.utmMedium,
      signup.utmCampaign,
      signup.utmContent,
      signup.utmTerm,
    ].map(csvCell)
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
