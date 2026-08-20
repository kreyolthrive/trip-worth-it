-- Rider Local Guide
-- Monetization + Driver Rewards Foundation
-- Version: 2026-08-19.1
--
-- PURPOSE
--   Establish the financial system of record for:
--   - merchant pricing / Stripe Connect readiness
--   - driver attribution
--   - transactions
--   - RLG commissions
--   - driver rewards
--   - weekly payout batching
--
-- IMPORTANT
--   business_actions remains behavioral analytics.
--   These new tables become the financial / settlement system of record.

begin;

create extension if not exists pgcrypto;


-- ============================================================
-- COMMON UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.rlg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 1. MERCHANT ACCOUNTS
-- ============================================================

create table if not exists public.rlg_merchant_accounts (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null unique
    references public.rlg_businesses(id)
    on update cascade
    on delete restrict,

  stripe_account_id text unique,

  onboarding_status text not null default 'not_started'
    check (
      onboarding_status in (
        'not_started',
        'pending',
        'requirements_due',
        'restricted',
        'complete',
        'disabled'
      )
    ),

  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,

  pricing_model text not null default 'transaction_percentage'
    check (
      pricing_model in (
        'transaction_percentage',
        'qualified_lead_fee',
        'booking_fee',
        'subscription',
        'free'
      )
    ),

  commission_bps integer not null default 500
    check (commission_bps between 0 and 10000),

  lead_fee_cents bigint not null default 0
    check (lead_fee_cents >= 0),

  booking_fee_cents bigint not null default 0
    check (booking_fee_cents >= 0),

  currency text not null default 'usd'
    check (currency ~ '^[a-z]{3}$'),

  agreement_version text,
  agreement_accepted_at timestamptz,

  is_active boolean not null default false,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================
-- 2. DRIVER PAYOUT ACCOUNTS
-- ============================================================

create table if not exists public.rlg_driver_accounts (
  id uuid primary key default gen_random_uuid(),

  driver_id uuid not null unique
    references public.drivers(id)
    on update cascade
    on delete restrict,

  stripe_account_id text unique,

  onboarding_status text not null default 'not_started'
    check (
      onboarding_status in (
        'not_started',
        'pending',
        'requirements_due',
        'restricted',
        'complete',
        'disabled'
      )
    ),

  payouts_enabled boolean not null default false,

  reward_model text not null default 'rlg_commission_share'
    check (
      reward_model in (
        'rlg_commission_share',
        'fixed_per_conversion',
        'none'
      )
    ),

  -- 2000 bps = 20% of RLG's commission.
  reward_rate_bps integer not null default 2000
    check (reward_rate_bps between 0 and 10000),

  fixed_reward_cents bigint not null default 0
    check (fixed_reward_cents >= 0),

  -- Default weekly minimum payout = $10.
  minimum_payout_cents bigint not null default 1000
    check (minimum_payout_cents >= 0),

  payout_cadence text not null default 'weekly'
    check (
      payout_cadence in (
        'weekly',
        'biweekly',
        'manual'
      )
    ),

  -- Reward hold can later vary by category/business.
  reward_hold_days integer not null default 7
    check (reward_hold_days between 0 and 90),

  is_active boolean not null default false,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================
-- 3. REFERRALS
-- ============================================================

create table if not exists public.rlg_referrals (
  id uuid primary key default gen_random_uuid(),

  attribution_token uuid not null unique default gen_random_uuid(),

  business_action_id uuid
    references public.business_actions(id)
    on update cascade
    on delete set null,

  business_id uuid not null
    references public.rlg_businesses(id)
    on update cascade
    on delete restrict,

  driver_id uuid
    references public.drivers(id)
    on update cascade
    on delete restrict,

  -- Historical attribution snapshots.
  driver_slug_snapshot text,
  business_slug_snapshot text,

  visitor_session_id text,

  source text not null default 'rider_local_guide',
  medium text,
  campaign text,

  conversion_type text
    check (
      conversion_type is null
      or conversion_type in (
        'transaction',
        'booking',
        'qualified_lead',
        'reservation',
        'other'
      )
    ),

  status text not null default 'engaged'
    check (
      status in (
        'engaged',
        'qualified',
        'booking_started',
        'checkout_started',
        'converted',
        'cancelled',
        'refunded',
        'expired'
      )
    ),

  attribution_expires_at timestamptz,

  qualified_at timestamptz,
  converted_at timestamptz,
  cancelled_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- One business action should not accidentally create duplicate referrals.
create unique index if not exists
  rlg_referrals_business_action_unique_idx
on public.rlg_referrals (business_action_id)
where business_action_id is not null;


-- ============================================================
-- 4. TRANSACTIONS
-- ============================================================

create table if not exists public.rlg_transactions (
  id uuid primary key default gen_random_uuid(),

  referral_id uuid not null
    references public.rlg_referrals(id)
    on update cascade
    on delete restrict,

  business_id uuid not null
    references public.rlg_businesses(id)
    on update cascade
    on delete restrict,

  driver_id uuid
    references public.drivers(id)
    on update cascade
    on delete restrict,

  -- Application-generated request key.
  idempotency_key text not null unique,

  provider text not null default 'stripe'
    check (
      provider in (
        'stripe',
        'manual',
        'test'
      )
    ),

  pricing_model_snapshot text not null
    check (
      pricing_model_snapshot in (
        'transaction_percentage',
        'qualified_lead_fee',
        'booking_fee',
        'subscription',
        'free'
      )
    ),

  currency text not null default 'usd'
    check (currency ~ '^[a-z]{3}$'),

  -- Customer-facing transaction amount.
  gross_amount_cents bigint not null default 0
    check (gross_amount_cents >= 0),

  -- NULL is allowed for fixed-fee pricing models.
  commission_bps_snapshot integer
    check (
      commission_bps_snapshot is null
      or commission_bps_snapshot between 0 and 10000
    ),

  -- Original RLG commission before refunds/adjustments.
  rlg_commission_cents bigint not null
    check (rlg_commission_cents >= 0),

  -- Driver share of RLG commission, not share of GMV.
  driver_reward_bps_snapshot integer
    check (
      driver_reward_bps_snapshot is null
      or driver_reward_bps_snapshot between 0 and 10000
    ),

  driver_reward_cents bigint not null default 0
    check (driver_reward_cents >= 0),

  -- What RLG keeps before its own operating costs.
  rlg_retained_cents bigint
    generated always as (
      rlg_commission_cents - driver_reward_cents
    ) stored,

  -- Merchant share before payment-processing fees/other adjustments.
  merchant_pre_processing_cents bigint
    generated always as (
      case
        when pricing_model_snapshot = 'transaction_percentage'
          then gross_amount_cents - rlg_commission_cents
        else null
      end
    ) stored,

  refunded_amount_cents bigint not null default 0
    check (
      refunded_amount_cents >= 0
      and refunded_amount_cents <= gross_amount_cents
    ),

  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_charge_id text unique,
  stripe_connected_account_id text,

  status text not null default 'initiated'
    check (
      status in (
        'initiated',
        'pending',
        'paid',
        'partially_refunded',
        'refunded',
        'failed',
        'cancelled',
        'disputed'
      )
    ),

  paid_at timestamptz,
  refunded_at timestamptz,
  failed_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (driver_reward_cents <= rlg_commission_cents),

  check (
    driver_id is not null
    or driver_reward_cents = 0
  ),

  check (
    pricing_model_snapshot <> 'transaction_percentage'
    or gross_amount_cents > 0
  ),

  check (
    pricing_model_snapshot <> 'transaction_percentage'
    or rlg_commission_cents <= gross_amount_cents
  ),

  check (
    pricing_model_snapshot <> 'transaction_percentage'
    or commission_bps_snapshot is not null
  )
);


-- ============================================================
-- 5. WEEKLY PAYOUT BATCHES
-- ============================================================

create table if not exists public.rlg_payout_batches (
  id uuid primary key default gen_random_uuid(),

  -- Example: 2026-W35
  batch_key text not null unique,

  period_start date not null,
  period_end date not null,

  scheduled_for timestamptz,

  currency text not null default 'usd'
    check (currency ~ '^[a-z]{3}$'),

  gross_rewards_cents bigint not null default 0
    check (gross_rewards_cents >= 0),

  -- Can be positive or negative.
  adjustments_cents bigint not null default 0,

  payout_total_cents bigint
    generated always as (
      gross_rewards_cents + adjustments_cents
    ) stored,

  driver_count integer not null default 0
    check (driver_count >= 0),

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'ready',
        'processing',
        'completed',
        'partial_failed',
        'failed',
        'cancelled'
      )
    ),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (period_end >= period_start),

  check (payout_total_cents >= 0)
);


-- ============================================================
-- 6. WEEKLY PAYOUT ITEMS
-- ============================================================

create table if not exists public.rlg_payout_items (
  id uuid primary key default gen_random_uuid(),

  payout_batch_id uuid not null
    references public.rlg_payout_batches(id)
    on update cascade
    on delete restrict,

  driver_id uuid not null
    references public.drivers(id)
    on update cascade
    on delete restrict,

  currency text not null default 'usd'
    check (currency ~ '^[a-z]{3}$'),

  gross_rewards_cents bigint not null default 0
    check (gross_rewards_cents >= 0),

  -- Prior refunds, corrections, bonuses, etc.
  adjustments_cents bigint not null default 0,

  net_payout_cents bigint
    generated always as (
      gross_rewards_cents + adjustments_cents
    ) stored,

  stripe_transfer_id text unique,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'scheduled',
        'processing',
        'paid',
        'failed',
        'cancelled',
        'carried_forward'
      )
    ),

  failure_reason text,

  attempted_at timestamptz,
  paid_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (payout_batch_id, driver_id),

  check (net_payout_cents >= 0)
);


-- ============================================================
-- 7. RLG COMMISSION LEDGER
--
-- Append-only.
-- Refunds and corrections are NEW negative/adjustment rows.
-- Existing accounting entries are never rewritten.
-- ============================================================

create table if not exists public.rlg_commission_ledger (
  id uuid primary key default gen_random_uuid(),

  transaction_id uuid not null
    references public.rlg_transactions(id)
    on update cascade
    on delete restrict,

  business_id uuid not null
    references public.rlg_businesses(id)
    on update cascade
    on delete restrict,

  driver_id uuid
    references public.drivers(id)
    on update cascade
    on delete restrict,

  idempotency_key text not null unique,

  source_event_id text,

  entry_type text not null
    check (
      entry_type in (
        'commission_earned',
        'commission_reversal',
        'commission_adjustment'
      )
    ),

  -- Signed accounting amount:
  -- earned = positive
  -- reversal = negative
  amount_cents bigint not null
    check (amount_cents <> 0),

  currency text not null default 'usd'
    check (currency ~ '^[a-z]{3}$'),

  occurred_at timestamptz not null default now(),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  check (
    (entry_type = 'commission_earned' and amount_cents > 0)
    or
    (entry_type = 'commission_reversal' and amount_cents < 0)
    or
    (entry_type = 'commission_adjustment')
  )
);


create unique index if not exists
  rlg_commission_ledger_source_event_unique_idx
on public.rlg_commission_ledger (source_event_id)
where source_event_id is not null;


-- ============================================================
-- 8. DRIVER REWARD LEDGER
--
-- Financial identity/amount fields are protected.
-- Lifecycle fields may move:
-- pending -> payable -> scheduled -> paid
--
-- Refund after payout:
-- create a NEW negative adjustment/reversal entry.
-- ============================================================

create table if not exists public.rlg_driver_reward_ledger (
  id uuid primary key default gen_random_uuid(),

  transaction_id uuid not null
    references public.rlg_transactions(id)
    on update cascade
    on delete restrict,

  referral_id uuid not null
    references public.rlg_referrals(id)
    on update cascade
    on delete restrict,

  driver_id uuid not null
    references public.drivers(id)
    on update cascade
    on delete restrict,

  business_id uuid not null
    references public.rlg_businesses(id)
    on update cascade
    on delete restrict,

  payout_item_id uuid
    references public.rlg_payout_items(id)
    on update cascade
    on delete set null,

  idempotency_key text not null unique,

  source_event_id text,

  entry_type text not null
    check (
      entry_type in (
        'reward_earned',
        'reward_reversal',
        'reward_adjustment'
      )
    ),

  -- Signed accounting amount.
  amount_cents bigint not null
    check (amount_cents <> 0),

  currency text not null default 'usd'
    check (currency ~ '^[a-z]{3}$'),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'payable',
        'scheduled',
        'paid',
        'cancelled'
      )
    ),

  eligible_at timestamptz,
  scheduled_at timestamptz,
  paid_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    (entry_type = 'reward_earned' and amount_cents > 0)
    or
    (entry_type = 'reward_reversal' and amount_cents < 0)
    or
    (entry_type = 'reward_adjustment')
  )
);


create unique index if not exists
  rlg_driver_reward_ledger_source_event_unique_idx
on public.rlg_driver_reward_ledger (source_event_id)
where source_event_id is not null;


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists
  rlg_merchant_accounts_set_updated_at
on public.rlg_merchant_accounts;

create trigger rlg_merchant_accounts_set_updated_at
before update on public.rlg_merchant_accounts
for each row
execute function public.rlg_set_updated_at();


drop trigger if exists
  rlg_driver_accounts_set_updated_at
on public.rlg_driver_accounts;

create trigger rlg_driver_accounts_set_updated_at
before update on public.rlg_driver_accounts
for each row
execute function public.rlg_set_updated_at();


drop trigger if exists
  rlg_referrals_set_updated_at
on public.rlg_referrals;

create trigger rlg_referrals_set_updated_at
before update on public.rlg_referrals
for each row
execute function public.rlg_set_updated_at();


drop trigger if exists
  rlg_payout_batches_set_updated_at
on public.rlg_payout_batches;

create trigger rlg_payout_batches_set_updated_at
before update on public.rlg_payout_batches
for each row
execute function public.rlg_set_updated_at();


drop trigger if exists
  rlg_payout_items_set_updated_at
on public.rlg_payout_items;

create trigger rlg_payout_items_set_updated_at
before update on public.rlg_payout_items
for each row
execute function public.rlg_set_updated_at();


-- ============================================================
-- REFERRAL ATTRIBUTION PROTECTION
--
-- Once attribution exists, the business and driver identity
-- cannot be reassigned. Lifecycle/status fields may still move.
-- ============================================================

create or replace function public.rlg_guard_referral_update()
returns trigger
language plpgsql
as $$
begin
  if
    new.id is distinct from old.id
    or new.attribution_token is distinct from old.attribution_token
    or new.business_action_id is distinct from old.business_action_id
    or new.business_id is distinct from old.business_id
    or new.driver_id is distinct from old.driver_id
    or new.driver_slug_snapshot is distinct from old.driver_slug_snapshot
    or new.business_slug_snapshot is distinct from old.business_slug_snapshot
    or new.visitor_session_id is distinct from old.visitor_session_id
    or new.source is distinct from old.source
    or new.medium is distinct from old.medium
    or new.campaign is distinct from old.campaign
    or new.created_at is distinct from old.created_at
  then
    raise exception
      'RLG referral attribution identity is immutable';
  end if;

  new.updated_at = now();

  return new;
end;
$$;


drop trigger if exists
  rlg_referrals_guard_update
on public.rlg_referrals;

create trigger rlg_referrals_guard_update
before update on public.rlg_referrals
for each row
execute function public.rlg_guard_referral_update();


-- ============================================================
-- TRANSACTION FINANCIAL FIELD PROTECTION
-- ============================================================

create or replace function public.rlg_guard_transaction_update()
returns trigger
language plpgsql
as $$
begin
  if
    new.id is distinct from old.id
    or new.referral_id is distinct from old.referral_id
    or new.business_id is distinct from old.business_id
    or new.driver_id is distinct from old.driver_id
    or new.idempotency_key is distinct from old.idempotency_key
    or new.provider is distinct from old.provider
    or new.pricing_model_snapshot is distinct from old.pricing_model_snapshot
    or new.currency is distinct from old.currency
    or new.gross_amount_cents is distinct from old.gross_amount_cents
    or new.commission_bps_snapshot is distinct from old.commission_bps_snapshot
    or new.rlg_commission_cents is distinct from old.rlg_commission_cents
    or new.driver_reward_bps_snapshot is distinct from old.driver_reward_bps_snapshot
    or new.driver_reward_cents is distinct from old.driver_reward_cents
    or new.created_at is distinct from old.created_at
  then
    raise exception
      'RLG transaction financial identity/economics are immutable';
  end if;

  -- Stripe/provider identifiers may be populated once, but not replaced.
  if
    (
      old.stripe_checkout_session_id is not null
      and new.stripe_checkout_session_id
        is distinct from old.stripe_checkout_session_id
    )
    or
    (
      old.stripe_payment_intent_id is not null
      and new.stripe_payment_intent_id
        is distinct from old.stripe_payment_intent_id
    )
    or
    (
      old.stripe_charge_id is not null
      and new.stripe_charge_id
        is distinct from old.stripe_charge_id
    )
    or
    (
      old.stripe_connected_account_id is not null
      and new.stripe_connected_account_id
        is distinct from old.stripe_connected_account_id
    )
  then
    raise exception
      'RLG transaction provider identifiers are write-once';
  end if;

  new.updated_at = now();

  return new;
end;
$$;


drop trigger if exists
  rlg_transactions_guard_update
on public.rlg_transactions;

create trigger rlg_transactions_guard_update
before update on public.rlg_transactions
for each row
execute function public.rlg_guard_transaction_update();


-- ============================================================
-- APPEND-ONLY COMMISSION LEDGER
-- ============================================================

create or replace function public.rlg_prevent_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'RLG accounting ledger rows are append-only; create a compensating entry instead';
end;
$$;


drop trigger if exists
  rlg_commission_ledger_prevent_update
on public.rlg_commission_ledger;

create trigger rlg_commission_ledger_prevent_update
before update on public.rlg_commission_ledger
for each row
execute function public.rlg_prevent_ledger_mutation();


drop trigger if exists
  rlg_commission_ledger_prevent_delete
on public.rlg_commission_ledger;

create trigger rlg_commission_ledger_prevent_delete
before delete on public.rlg_commission_ledger
for each row
execute function public.rlg_prevent_ledger_mutation();


-- ============================================================
-- DRIVER REWARD LEDGER PROTECTION
-- ============================================================

create or replace function public.rlg_guard_driver_reward_update()
returns trigger
language plpgsql
as $$
begin
  if
    new.id is distinct from old.id
    or new.transaction_id is distinct from old.transaction_id
    or new.referral_id is distinct from old.referral_id
    or new.driver_id is distinct from old.driver_id
    or new.business_id is distinct from old.business_id
    or new.idempotency_key is distinct from old.idempotency_key
    or new.source_event_id is distinct from old.source_event_id
    or new.entry_type is distinct from old.entry_type
    or new.amount_cents is distinct from old.amount_cents
    or new.currency is distinct from old.currency
    or new.metadata is distinct from old.metadata
    or new.created_at is distinct from old.created_at
  then
    raise exception
      'RLG driver reward financial fields are immutable';
  end if;

  -- Payout linkage and lifecycle timestamps are write-once.
  if
    (
      old.payout_item_id is not null
      and new.payout_item_id is distinct from old.payout_item_id
    )
    or
    (
      old.eligible_at is not null
      and new.eligible_at is distinct from old.eligible_at
    )
    or
    (
      old.scheduled_at is not null
      and new.scheduled_at is distinct from old.scheduled_at
    )
    or
    (
      old.paid_at is not null
      and new.paid_at is distinct from old.paid_at
    )
  then
    raise exception
      'RLG driver reward payout linkage/timestamps are write-once';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'pending'
        and new.status in ('payable', 'cancelled'))
      or
      (old.status = 'payable'
        and new.status in ('scheduled', 'cancelled'))
      or
      (old.status = 'scheduled'
        and new.status in ('paid', 'payable', 'cancelled'))
    ) then
      raise exception
        'Invalid RLG driver reward status transition: % -> %',
        old.status,
        new.status;
    end if;
  end if;

  new.updated_at = now();

  return new;
end;
$$;


drop trigger if exists
  rlg_driver_reward_ledger_guard_update
on public.rlg_driver_reward_ledger;

create trigger rlg_driver_reward_ledger_guard_update
before update on public.rlg_driver_reward_ledger
for each row
execute function public.rlg_guard_driver_reward_update();


drop trigger if exists
  rlg_driver_reward_ledger_prevent_delete
on public.rlg_driver_reward_ledger;

create trigger rlg_driver_reward_ledger_prevent_delete
before delete on public.rlg_driver_reward_ledger
for each row
execute function public.rlg_prevent_ledger_mutation();


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists
  rlg_merchant_accounts_business_idx
on public.rlg_merchant_accounts (business_id);


create index if not exists
  rlg_driver_accounts_driver_idx
on public.rlg_driver_accounts (driver_id);


create index if not exists
  rlg_referrals_business_idx
on public.rlg_referrals (business_id);


create index if not exists
  rlg_referrals_driver_idx
on public.rlg_referrals (driver_id);


create index if not exists
  rlg_referrals_status_idx
on public.rlg_referrals (status);


create index if not exists
  rlg_referrals_created_at_idx
on public.rlg_referrals (created_at desc);


create index if not exists
  rlg_transactions_business_idx
on public.rlg_transactions (business_id);


create index if not exists
  rlg_transactions_driver_idx
on public.rlg_transactions (driver_id);


create index if not exists
  rlg_transactions_referral_idx
on public.rlg_transactions (referral_id);


create index if not exists
  rlg_transactions_status_idx
on public.rlg_transactions (status);


create index if not exists
  rlg_transactions_created_at_idx
on public.rlg_transactions (created_at desc);


create index if not exists
  rlg_commission_ledger_transaction_idx
on public.rlg_commission_ledger (transaction_id);


create index if not exists
  rlg_commission_ledger_business_idx
on public.rlg_commission_ledger (business_id);


create index if not exists
  rlg_commission_ledger_occurred_at_idx
on public.rlg_commission_ledger (occurred_at desc);


create index if not exists
  rlg_driver_reward_ledger_driver_status_idx
on public.rlg_driver_reward_ledger (
  driver_id,
  status,
  eligible_at
);


create index if not exists
  rlg_driver_reward_ledger_transaction_idx
on public.rlg_driver_reward_ledger (transaction_id);


create index if not exists
  rlg_driver_reward_ledger_created_at_idx
on public.rlg_driver_reward_ledger (created_at desc);


create index if not exists
  rlg_payout_batches_period_idx
on public.rlg_payout_batches (
  period_start,
  period_end
);


create index if not exists
  rlg_payout_items_driver_idx
on public.rlg_payout_items (driver_id);


create index if not exists
  rlg_payout_items_status_idx
on public.rlg_payout_items (status);


-- ============================================================
-- RLS
--
-- No client-side policies are intentionally created here.
-- Initial financial access is server/service-role only.
-- ============================================================

alter table public.rlg_merchant_accounts
  enable row level security;

alter table public.rlg_driver_accounts
  enable row level security;

alter table public.rlg_referrals
  enable row level security;

alter table public.rlg_transactions
  enable row level security;

alter table public.rlg_commission_ledger
  enable row level security;

alter table public.rlg_driver_reward_ledger
  enable row level security;

alter table public.rlg_payout_batches
  enable row level security;

alter table public.rlg_payout_items
  enable row level security;


-- ============================================================
-- DOCUMENTATION COMMENTS
-- ============================================================

comment on table public.rlg_merchant_accounts is
  'Rider Local Guide merchant pricing and payment onboarding configuration.';

comment on table public.rlg_driver_accounts is
  'Rider Local Guide driver reward and payout configuration.';

comment on table public.rlg_referrals is
  'Closed-loop attribution from Rider Local Guide actions to conversions.';

comment on table public.rlg_transactions is
  'Customer transaction facts and original RLG/driver economics.';

comment on table public.rlg_commission_ledger is
  'Append-only Rider Local Guide commission accounting ledger.';

comment on table public.rlg_driver_reward_ledger is
  'Driver reward accounting and weekly payout lifecycle ledger.';

comment on table public.rlg_payout_batches is
  'Weekly Rider Local Guide driver payout reconciliation batches.';

comment on table public.rlg_payout_items is
  'Per-driver settlement item within a Rider Local Guide payout batch.';


commit;
