import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260822165000_rlg_monetization_reconciliation.sql"
);

const migration = readFileSync(migrationPath, "utf8");

describe("RLG Patch 5 monetization reconciliation contract", () => {
  it("keeps Patch 4 accounting functions as dependencies instead of replacing them", () => {
    expect(migration).toContain(
      "from public.rlg_capture_qualified_lead_monetization_event("
    );
    expect(migration).toContain(
      "from public.rlg_process_monetization_event("
    );

    expect(migration).not.toMatch(
      /create\s+or\s+replace\s+function\s+public\.rlg_capture_qualified_lead_monetization_event/i
    );
    expect(migration).not.toMatch(
      /create\s+or\s+replace\s+function\s+public\.rlg_process_monetization_event/i
    );
  });

  it("persists run history, retry state, last errors, and operator attention", () => {
    expect(migration).toContain(
      "create table public.rlg_monetization_reconciliation_runs"
    );
    expect(migration).toContain(
      "create table public.rlg_monetization_reconciliation_state"
    );
    expect(migration).toContain("attempt_count integer not null default 0");
    expect(migration).toContain(
      "consecutive_failures integer not null default 0"
    );
    expect(migration).toContain("last_error text");
    expect(migration).toContain("requires_attention boolean not null default false");
    expect(migration).toContain(
      "create view public.rlg_monetization_reconciliation_attention"
    );
  });

  it("selects both missing capture work and pending accounting work", () => {
    expect(migration).toContain("and e.id is null");
    expect(migration).toContain("where e.status = 'pending'");
    expect(migration).toContain("r.status = 'qualified'");
    expect(migration).toContain("r.conversion_type = 'qualified_lead'");
  });

  it("prevents overlapping workers and stops automatic retries at the attention threshold", () => {
    expect(migration).toContain("pg_try_advisory_xact_lock");
    expect(migration).toContain(
      "(target.consecutive_failures + 1) >= p_attention_after"
    );
    expect(migration).toContain("raise warning");
    expect(migration).toContain("p_retry_attention boolean default false");
  });

  it("keeps reconciliation server-only", () => {
    expect(migration).toContain(
      "on function public.rlg_reconcile_monetization(integer, integer, boolean)"
    );
    expect(migration).toContain("from anon;");
    expect(migration).toContain("from authenticated;");
    expect(migration).toContain("to service_role;");
  });

  it("schedules the database worker every five minutes", () => {
    expect(migration).toContain("create extension if not exists pg_cron;");
    expect(migration).toContain("'rlg-monetization-reconciliation-v1'");
    expect(migration).toContain("'*/5 * * * *'");
    expect(migration).toContain(
      "select public.rlg_reconcile_monetization("
    );
  });
});
