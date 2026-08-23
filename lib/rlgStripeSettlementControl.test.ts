import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260823153000_rlg_stripe_settlement_control.sql"
);

const migration = readFileSync(migrationPath, "utf8");

describe("RLG Patch 6 Stripe settlement control contract", () => {
  it("separates merchant billing identity from Stripe Connect payout identity", () => {
    expect(migration).toContain("add column stripe_customer_id text");
    expect(migration).toContain(
      "add column stripe_default_payment_method_id text"
    );
    expect(migration).toContain("add column billing_status text");
    expect(migration).toContain("add column billing_mode text");
    expect(migration).toContain("add column billing_consent_at timestamptz");
    expect(migration).toContain("billing_mode = 'off_session'");
  });

  it("creates exactly one stable Stripe settlement path per RLG transaction", () => {
    expect(migration).toContain("create table public.rlg_stripe_settlements");
    expect(migration).toContain("transaction_id uuid not null unique");
    expect(migration).toContain("idempotency_key text not null unique");
    expect(migration).toContain(
      "'rlg:settlement:' || v_transaction.id::text"
    );
    expect(migration).toContain(
      "RLG Stripe settlement PaymentIntent is write-once"
    );
  });

  it("limits automatic merchant charging to consented qualified-lead fees", () => {
    expect(migration).toContain(
      "create or replace function public.rlg_prepare_qualified_lead_settlement"
    );
    expect(migration).toContain(
      "v_transaction.pricing_model_snapshot <> 'qualified_lead_fee'"
    );
    expect(migration).toContain("v_merchant.billing_status <> 'ready'");
    expect(migration).toContain("v_merchant.billing_mode <> 'off_session'");
    expect(migration).toContain("v_merchant.billing_consent_at is null");
    expect(migration).toContain(
      "v_merchant.billing_consent_at > v_transaction.created_at"
    );
    expect(migration).toContain(
      "Never retroactively auto-charge an obligation"
    );
  });

  it("keeps Stripe webhook processing idempotent and protects paid state from stale failures", () => {
    expect(migration).toContain(
      "create table public.rlg_stripe_webhook_events"
    );
    expect(migration).toContain("stripe_event_id text primary key");
    expect(migration).toContain("on conflict (stripe_event_id)");
    expect(migration).toContain("payment_intent.succeeded");
    expect(migration).toContain("payment_intent.payment_failed");
    expect(migration).toContain("stale_failure_after_success");
    expect(migration).toContain("livemode_mismatch");
    expect(migration).toContain("payment_intent_mismatch");
  });

  it("fails closed on malformed or identity-drifted Stripe webhook events", () => {
    expect(migration).toContain(
      "v_settlement_found boolean := false"
    );
    expect(migration).toContain(
      "v_settlement_found := found"
    );
    expect(migration).toContain(
      "if not v_settlement_found then"
    );
    expect(migration).toContain(
      "PaymentIntent id is required for payment_intent webhook events"
    );
    expect(migration).toContain(
      "Stripe event id was replayed with different immutable event identity"
    );
  });

  it("does not treat synchronous Stripe submission as final payment authority", () => {
    expect(migration).toContain(
      "payment_intent.succeeded webhook remains the settlement authority"
    );
    expect(migration).toContain(
      "create or replace function public.rlg_record_stripe_settlement_submission"
    );
    expect(migration).toContain("else 'submitted'");
    expect(migration).not.toMatch(
      /create\s+or\s+replace\s+function\s+public\.rlg_process_monetization_event/i
    );
  });

  it("gates driver reward payability on collected revenue and payout readiness", () => {
    expect(migration).toContain(
      "create or replace function public.rlg_mark_payable_driver_rewards"
    );
    expect(migration).toContain("and t.status = 'paid'");
    expect(migration).toContain("and a.payouts_enabled = true");
    expect(migration).toContain("and a.onboarding_status = 'complete'");
    expect(migration).toContain("and a.stripe_account_id is not null");
    expect(migration).toContain("set status = 'payable'");
  });

  it("keeps all settlement tables and RPCs server-only", () => {
    expect(migration).toContain(
      "alter table public.rlg_stripe_settlements\n  enable row level security"
    );
    expect(migration).toContain(
      "alter table public.rlg_stripe_webhook_events\n  enable row level security"
    );
    expect(migration).toContain("from public, anon, authenticated;");
    expect(migration).toContain("to service_role;");
  });

  it("contains no Stripe network call, API key, or live-money enablement", () => {
    expect(migration).not.toMatch(/api\.stripe\.com/i);
    expect(migration).not.toMatch(/sk_live_/i);
    expect(migration).not.toMatch(/sk_test_/i);
    expect(migration).not.toMatch(/stripe_secret_key/i);
    expect(migration).toContain("This patch does NOT call Stripe and moves no money");
  });
});
