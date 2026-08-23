begin;

-- ============================================================
-- RIDER LOCAL GUIDE
-- Patch 6: Stripe Settlement Control
-- Version: 2026-08-23.1
--
-- PURPOSE
--   Add the settlement-control boundary between Patch 4/5
--   accounting and actual Stripe payment movement.
--
-- IMPORTANT
--   - Patch 4 remains the economic/accounting authority.
--   - This patch does NOT call Stripe and moves no money.
--   - Qualified-lead fees are collected from merchants as
--     off-session charges only after explicit billing consent.
--   - Transaction-percentage marketplace checkout remains a
--     separate future Stripe Connect destination-charge path.
--   - Driver rewards may become payable only after the related
--     RLG transaction is actually paid.
-- ============================================================


-- ============================================================
-- 1. MERCHANT BILLING READINESS
--
-- Connect payout identity (stripe_account_id) and merchant-as-
-- payer billing identity (stripe_customer_id) are intentionally
-- separate concepts.
-- ============================================================

alter table public.rlg_merchant_accounts
  add column stripe_customer_id text,
  add column stripe_default_payment_method_id text,
  add column billing_status text not null default 'not_configured',
  add column billing_mode text not null default 'manual',
  add column billing_livemode boolean not null default false,
  add column billing_consent_version text,
  add column billing_consent_at timestamptz,
  add column billing_last_error text;

alter table public.rlg_merchant_accounts
  add constraint rlg_merchant_accounts_billing_status_check
  check (
    billing_status in (
      'not_configured',
      'setup_pending',
      'ready',
      'requires_action',
      'past_due',
      'disabled'
    )
  );

alter table public.rlg_merchant_accounts
  add constraint rlg_merchant_accounts_billing_mode_check
  check (
    billing_mode in (
      'manual',
      'off_session'
    )
  );

alter table public.rlg_merchant_accounts
  add constraint rlg_merchant_accounts_ready_billing_check
  check (
    billing_status <> 'ready'
    or (
      billing_mode = 'off_session'
      and stripe_customer_id is not null
      and stripe_default_payment_method_id is not null
      and billing_consent_at is not null
    )
  );

create unique index rlg_merchant_accounts_stripe_customer_unique_idx
on public.rlg_merchant_accounts (stripe_customer_id)
where stripe_customer_id is not null;


-- ============================================================
-- 2. ONE STRIPE SETTLEMENT RECORD PER RLG TRANSACTION
--
-- A stable settlement row + stable Stripe idempotency key means
-- network retries cannot create a second merchant charge path.
-- The same PaymentIntent is the authority for one transaction.
-- ============================================================

create table public.rlg_stripe_settlements (
  id uuid primary key default gen_random_uuid(),

  transaction_id uuid not null unique
    references public.rlg_transactions(id)
    on update cascade
    on delete restrict,

  merchant_account_id uuid not null
    references public.rlg_merchant_accounts(id)
    on update cascade
    on delete restrict,

  settlement_type text not null
    check (
      settlement_type in (
        'qualified_lead_charge'
      )
    ),

  provider text not null default 'stripe'
    check (provider = 'stripe'),

  idempotency_key text not null unique,

  amount_cents bigint not null
    check (amount_cents > 0),

  currency text not null
    check (currency ~ '^[a-z]{3}$'),

  stripe_customer_id_snapshot text not null,
  stripe_payment_method_id_snapshot text not null,

  billing_consent_version_snapshot text,
  billing_consent_at_snapshot timestamptz not null,
  livemode_snapshot boolean not null default false,

  stripe_payment_intent_id text unique,
  stripe_charge_id text unique,

  provider_status text,

  status text not null default 'prepared'
    check (
      status in (
        'prepared',
        'submitted',
        'requires_action',
        'succeeded',
        'failed',
        'cancelled'
      )
    ),

  last_error_code text,
  last_error_message text,

  submitted_at timestamptz,
  succeeded_at timestamptz,
  cancelled_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    status <> 'succeeded'
    or succeeded_at is not null
  ),

  check (
    status <> 'cancelled'
    or cancelled_at is not null
  )
);

create index rlg_stripe_settlements_status_idx
on public.rlg_stripe_settlements (
  status,
  created_at
);

create index rlg_stripe_settlements_merchant_idx
on public.rlg_stripe_settlements (
  merchant_account_id,
  created_at desc
);


-- ============================================================
-- 3. STRIPE WEBHOOK EVENT IDEMPOTENCY / AUDIT
--
-- Stripe can retry and duplicate webhook delivery. The Stripe
-- event id is therefore the first idempotency boundary.
-- Full payloads are intentionally not persisted here; callers
-- can store only a SHA-256 hash for audit correlation.
-- ============================================================

create table public.rlg_stripe_webhook_events (
  stripe_event_id text primary key,

  event_type text not null,
  stripe_object_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,

  livemode boolean not null,
  payload_sha256 text,

  settlement_id uuid
    references public.rlg_stripe_settlements(id)
    on update cascade
    on delete restrict,

  transaction_id uuid
    references public.rlg_transactions(id)
    on update cascade
    on delete restrict,

  processing_status text not null default 'received'
    check (
      processing_status in (
        'received',
        'processed',
        'ignored',
        'failed'
      )
    ),

  decision_code text,
  last_error text,

  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index rlg_stripe_webhook_events_processing_idx
on public.rlg_stripe_webhook_events (
  processing_status,
  received_at
);

create index rlg_stripe_webhook_events_payment_intent_idx
on public.rlg_stripe_webhook_events (
  stripe_payment_intent_id
);


-- ============================================================
-- 4. SETTLEMENT ROW IMMUTABILITY + STATE MACHINE
-- ============================================================

create or replace function public.rlg_guard_stripe_settlement_update()
returns trigger
language plpgsql
as $function$
begin
  if
    new.id is distinct from old.id
    or new.transaction_id is distinct from old.transaction_id
    or new.merchant_account_id is distinct from old.merchant_account_id
    or new.settlement_type is distinct from old.settlement_type
    or new.provider is distinct from old.provider
    or new.idempotency_key is distinct from old.idempotency_key
    or new.amount_cents is distinct from old.amount_cents
    or new.currency is distinct from old.currency
    or new.stripe_customer_id_snapshot
         is distinct from old.stripe_customer_id_snapshot
    or new.stripe_payment_method_id_snapshot
         is distinct from old.stripe_payment_method_id_snapshot
    or new.billing_consent_version_snapshot
         is distinct from old.billing_consent_version_snapshot
    or new.billing_consent_at_snapshot
         is distinct from old.billing_consent_at_snapshot
    or new.livemode_snapshot
         is distinct from old.livemode_snapshot
    or new.metadata is distinct from old.metadata
    or new.created_at is distinct from old.created_at
  then
    raise exception
      'RLG Stripe settlement financial identity is immutable';
  end if;

  if
    old.stripe_payment_intent_id is not null
    and new.stripe_payment_intent_id
          is distinct from old.stripe_payment_intent_id
  then
    raise exception
      'RLG Stripe settlement PaymentIntent is write-once';
  end if;

  if
    old.stripe_charge_id is not null
    and new.stripe_charge_id
          is distinct from old.stripe_charge_id
  then
    raise exception
      'RLG Stripe settlement charge id is write-once';
  end if;

  if
    old.submitted_at is not null
    and new.submitted_at
          is distinct from old.submitted_at
  then
    raise exception
      'RLG Stripe settlement submitted_at is write-once';
  end if;

  if
    old.succeeded_at is not null
    and new.succeeded_at
          is distinct from old.succeeded_at
  then
    raise exception
      'RLG Stripe settlement succeeded_at is write-once';
  end if;

  if
    old.cancelled_at is not null
    and new.cancelled_at
          is distinct from old.cancelled_at
  then
    raise exception
      'RLG Stripe settlement cancelled_at is write-once';
  end if;

  if new.status is distinct from old.status then
    if not (
      (
        old.status = 'prepared'
        and new.status in (
          'submitted',
          'requires_action',
          'succeeded',
          'failed',
          'cancelled'
        )
      )
      or
      (
        old.status = 'submitted'
        and new.status in (
          'requires_action',
          'succeeded',
          'failed',
          'cancelled'
        )
      )
      or
      (
        old.status = 'requires_action'
        and new.status in (
          'submitted',
          'succeeded',
          'failed',
          'cancelled'
        )
      )
      or
      (
        old.status = 'failed'
        and new.status in (
          'submitted',
          'requires_action',
          'succeeded',
          'cancelled'
        )
      )
    ) then
      raise exception
        'Invalid RLG Stripe settlement status transition: % -> %',
        old.status,
        new.status;
    end if;
  end if;

  new.updated_at = now();

  return new;
end;
$function$;

create trigger rlg_stripe_settlements_guard_update
before update on public.rlg_stripe_settlements
for each row
execute function public.rlg_guard_stripe_settlement_update();

create trigger rlg_stripe_settlements_prevent_delete
before delete on public.rlg_stripe_settlements
for each row
execute function public.rlg_prevent_ledger_mutation();


-- ============================================================
-- 5. WEBHOOK EVENT IMMUTABILITY
-- ============================================================

create or replace function public.rlg_guard_stripe_webhook_event_update()
returns trigger
language plpgsql
as $function$
begin
  if
    new.stripe_event_id is distinct from old.stripe_event_id
    or new.event_type is distinct from old.event_type
    or new.stripe_object_id is distinct from old.stripe_object_id
    or new.stripe_payment_intent_id
         is distinct from old.stripe_payment_intent_id
    or new.stripe_charge_id
         is distinct from old.stripe_charge_id
    or new.livemode is distinct from old.livemode
    or new.payload_sha256 is distinct from old.payload_sha256
    or new.received_at is distinct from old.received_at
  then
    raise exception
      'RLG Stripe webhook event identity is immutable';
  end if;

  if
    old.settlement_id is not null
    and new.settlement_id
          is distinct from old.settlement_id
  then
    raise exception
      'RLG Stripe webhook settlement linkage is write-once';
  end if;

  if
    old.transaction_id is not null
    and new.transaction_id
          is distinct from old.transaction_id
  then
    raise exception
      'RLG Stripe webhook transaction linkage is write-once';
  end if;

  if
    old.processed_at is not null
    and new.processed_at
          is distinct from old.processed_at
  then
    raise exception
      'RLG Stripe webhook processed_at is write-once';
  end if;

  if new.processing_status is distinct from old.processing_status then
    if not (
      (
        old.processing_status = 'received'
        and new.processing_status in (
          'processed',
          'ignored',
          'failed'
        )
      )
      or
      (
        old.processing_status = 'failed'
        and new.processing_status in (
          'processed',
          'ignored'
        )
      )
    ) then
      raise exception
        'Invalid RLG Stripe webhook status transition: % -> %',
        old.processing_status,
        new.processing_status;
    end if;
  end if;

  return new;
end;
$function$;

create trigger rlg_stripe_webhook_events_guard_update
before update on public.rlg_stripe_webhook_events
for each row
execute function public.rlg_guard_stripe_webhook_event_update();

create trigger rlg_stripe_webhook_events_prevent_delete
before delete on public.rlg_stripe_webhook_events
for each row
execute function public.rlg_prevent_ledger_mutation();


-- ============================================================
-- 6. STRENGTHEN TRANSACTION LIFECYCLE
--
-- Patch 1 already protects immutable economics/provider ids.
-- Patch 6 adds explicit payment-state transitions and write-once
-- lifecycle timestamps without changing Patch 4 accounting.
-- ============================================================

create or replace function public.rlg_guard_transaction_update()
returns trigger
language plpgsql
as $function$
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

  if new.refunded_amount_cents < old.refunded_amount_cents then
    raise exception
      'RLG transaction refunded amount cannot decrease';
  end if;

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

  if
    old.paid_at is not null
    and new.paid_at is distinct from old.paid_at
  then
    raise exception
      'RLG transaction paid_at is write-once';
  end if;

  if
    old.refunded_at is not null
    and new.refunded_at is distinct from old.refunded_at
  then
    raise exception
      'RLG transaction refunded_at is write-once';
  end if;

  if
    old.failed_at is not null
    and new.failed_at is distinct from old.failed_at
  then
    raise exception
      'RLG transaction failed_at is write-once';
  end if;

  if new.status is distinct from old.status then
    if not (
      (
        old.status = 'initiated'
        and new.status in (
          'pending',
          'paid',
          'failed',
          'cancelled'
        )
      )
      or
      (
        old.status = 'pending'
        and new.status in (
          'paid',
          'failed',
          'cancelled',
          'disputed'
        )
      )
      or
      (
        old.status = 'failed'
        and new.status in (
          'pending',
          'paid',
          'cancelled'
        )
      )
      or
      (
        old.status = 'paid'
        and new.status in (
          'partially_refunded',
          'refunded',
          'disputed'
        )
      )
      or
      (
        old.status = 'partially_refunded'
        and new.status in (
          'refunded',
          'disputed'
        )
      )
      or
      (
        old.status = 'disputed'
        and new.status in (
          'paid',
          'partially_refunded',
          'refunded'
        )
      )
    ) then
      raise exception
        'Invalid RLG transaction status transition: % -> %',
        old.status,
        new.status;
    end if;
  end if;

  new.updated_at = now();

  return new;
end;
$function$;


-- ============================================================
-- 7. PREPARE ONE QUALIFIED-LEAD SETTLEMENT
--
-- Returns the exact data a trusted server-side Stripe client may
-- use to create/confirm one PaymentIntent. No network call occurs.
-- ============================================================

create or replace function public.rlg_prepare_qualified_lead_settlement(
  p_transaction_id uuid
)
returns table (
  settlement_id uuid,
  transaction_id uuid,
  settlement_status text,
  amount_cents bigint,
  currency text,
  stripe_customer_id text,
  stripe_payment_method_id text,
  livemode boolean,
  idempotency_key text,
  replayed boolean
)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_transaction public.rlg_transactions%rowtype;
  v_merchant public.rlg_merchant_accounts%rowtype;
  v_settlement public.rlg_stripe_settlements%rowtype;
  v_idempotency_key text;
begin
  if p_transaction_id is null then
    raise exception
      'transaction id is required'
      using errcode = '22023';
  end if;

  select t.*
  into v_transaction
  from public.rlg_transactions t
  where t.id = p_transaction_id
  for update;

  if not found then
    raise exception
      'RLG transaction not found'
      using errcode = 'P0002';
  end if;

  select s.*
  into v_settlement
  from public.rlg_stripe_settlements s
  where s.transaction_id = v_transaction.id;

  if found then
    return query
    select
      v_settlement.id,
      v_settlement.transaction_id,
      v_settlement.status,
      v_settlement.amount_cents,
      v_settlement.currency,
      v_settlement.stripe_customer_id_snapshot,
      v_settlement.stripe_payment_method_id_snapshot,
      v_settlement.livemode_snapshot,
      v_settlement.idempotency_key,
      true;

    return;
  end if;

  if v_transaction.provider <> 'stripe' then
    raise exception
      'RLG transaction provider is not Stripe';
  end if;

  if v_transaction.pricing_model_snapshot <> 'qualified_lead_fee' then
    raise exception
      'Patch 6 merchant-charge settlement supports qualified_lead_fee only';
  end if;

  if v_transaction.rlg_commission_cents <= 0 then
    raise exception
      'RLG transaction has no collectible qualified-lead fee';
  end if;

  if v_transaction.status not in (
    'initiated',
    'pending',
    'failed'
  ) then
    raise exception
      'RLG transaction is not eligible for settlement preparation: %',
      v_transaction.status;
  end if;

  select m.*
  into v_merchant
  from public.rlg_merchant_accounts m
  where m.business_id = v_transaction.business_id;

  if not found then
    raise exception
      'RLG merchant account not found';
  end if;

  if not v_merchant.is_active then
    raise exception
      'RLG merchant account is inactive';
  end if;

  if not v_merchant.charges_enabled then
    raise exception
      'RLG merchant charges are disabled';
  end if;

  if v_merchant.billing_status <> 'ready' then
    raise exception
      'RLG merchant billing is not ready: %',
      v_merchant.billing_status;
  end if;

  if v_merchant.billing_mode <> 'off_session' then
    raise exception
      'RLG merchant billing mode is not off_session';
  end if;

  if v_merchant.stripe_customer_id is null
     or v_merchant.stripe_default_payment_method_id is null
  then
    raise exception
      'RLG merchant Stripe billing identity is incomplete';
  end if;

  if v_merchant.billing_consent_at is null then
    raise exception
      'RLG merchant off-session billing consent is missing';
  end if;

  -- Never retroactively auto-charge an obligation that predates
  -- the merchant's recorded off-session billing consent.
  if v_merchant.billing_consent_at > v_transaction.created_at then
    raise exception
      'RLG merchant billing consent post-dates this transaction';
  end if;

  v_idempotency_key :=
    'rlg:settlement:' || v_transaction.id::text;

  insert into public.rlg_stripe_settlements (
    transaction_id,
    merchant_account_id,
    settlement_type,
    provider,
    idempotency_key,
    amount_cents,
    currency,
    stripe_customer_id_snapshot,
    stripe_payment_method_id_snapshot,
    billing_consent_version_snapshot,
    billing_consent_at_snapshot,
    livemode_snapshot,
    status,
    metadata
  )
  values (
    v_transaction.id,
    v_merchant.id,
    'qualified_lead_charge',
    'stripe',
    v_idempotency_key,
    v_transaction.rlg_commission_cents,
    v_transaction.currency,
    v_merchant.stripe_customer_id,
    v_merchant.stripe_default_payment_method_id,
    v_merchant.billing_consent_version,
    v_merchant.billing_consent_at,
    v_merchant.billing_livemode,
    'prepared',
    jsonb_build_object(
      'pricing_model',
      v_transaction.pricing_model_snapshot,
      'business_id',
      v_transaction.business_id,
      'referral_id',
      v_transaction.referral_id
    )
  )
  returning *
  into v_settlement;

  return query
  select
    v_settlement.id,
    v_settlement.transaction_id,
    v_settlement.status,
    v_settlement.amount_cents,
    v_settlement.currency,
    v_settlement.stripe_customer_id_snapshot,
    v_settlement.stripe_payment_method_id_snapshot,
    v_settlement.livemode_snapshot,
    v_settlement.idempotency_key,
    false;
end;
$function$;


-- ============================================================
-- 8. RECORD STRIPE PAYMENTINTENT SUBMISSION
--
-- Synchronous Stripe API results are operational state only.
-- payment_intent.succeeded webhook remains the settlement authority.
-- ============================================================

create or replace function public.rlg_record_stripe_settlement_submission(
  p_settlement_id uuid,
  p_payment_intent_id text,
  p_provider_status text default null
)
returns table (
  settlement_id uuid,
  transaction_id uuid,
  settlement_status text,
  replayed boolean
)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_settlement public.rlg_stripe_settlements%rowtype;
  v_target_status text;
  v_transaction_status text;
begin
  if p_settlement_id is null
     or nullif(trim(p_payment_intent_id), '') is null
  then
    raise exception
      'settlement id and PaymentIntent id are required'
      using errcode = '22023';
  end if;

  select s.*
  into v_settlement
  from public.rlg_stripe_settlements s
  where s.id = p_settlement_id
  for update;

  if not found then
    raise exception
      'RLG Stripe settlement not found'
      using errcode = 'P0002';
  end if;

  if v_settlement.stripe_payment_intent_id is not null
     and v_settlement.stripe_payment_intent_id <> p_payment_intent_id
  then
    raise exception
      'RLG Stripe settlement already belongs to a different PaymentIntent';
  end if;

  if v_settlement.status = 'succeeded' then
    return query
    select
      v_settlement.id,
      v_settlement.transaction_id,
      v_settlement.status,
      true;

    return;
  end if;

  v_target_status :=
    case p_provider_status
      when 'requires_action' then 'requires_action'
      when 'requires_payment_method' then 'failed'
      when 'canceled' then 'cancelled'
      else 'submitted'
    end;

  update public.rlg_stripe_settlements s
  set
    stripe_payment_intent_id =
      coalesce(
        s.stripe_payment_intent_id,
        p_payment_intent_id
      ),
    provider_status = p_provider_status,
    status = v_target_status,
    submitted_at = coalesce(s.submitted_at, now()),
    cancelled_at =
      case
        when v_target_status = 'cancelled'
          then coalesce(s.cancelled_at, now())
        else s.cancelled_at
      end,
    last_error_code =
      case
        when v_target_status in ('submitted', 'requires_action')
          then null
        else s.last_error_code
      end,
    last_error_message =
      case
        when v_target_status in ('submitted', 'requires_action')
          then null
        else s.last_error_message
      end
  where s.id = v_settlement.id
  returning *
  into v_settlement;

  v_transaction_status :=
    case v_target_status
      when 'failed' then 'failed'
      when 'cancelled' then 'cancelled'
      else 'pending'
    end;

  update public.rlg_transactions t
  set
    stripe_payment_intent_id =
      coalesce(
        t.stripe_payment_intent_id,
        p_payment_intent_id
      ),
    status =
      case
        when t.status = 'paid' then t.status
        else v_transaction_status
      end,
    failed_at =
      case
        when v_transaction_status = 'failed'
          then coalesce(t.failed_at, now())
        else t.failed_at
      end
  where t.id = v_settlement.transaction_id;

  return query
  select
    v_settlement.id,
    v_settlement.transaction_id,
    v_settlement.status,
    false;
end;
$function$;


-- ============================================================
-- 9. RECORD A STRIPE REQUEST FAILURE
--
-- The stable settlement idempotency key allows a trusted worker
-- to retry without creating a second charge path.
-- ============================================================

create or replace function public.rlg_record_stripe_settlement_request_failure(
  p_settlement_id uuid,
  p_error_code text,
  p_error_message text
)
returns table (
  settlement_id uuid,
  transaction_id uuid,
  settlement_status text
)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_settlement public.rlg_stripe_settlements%rowtype;
begin
  select s.*
  into v_settlement
  from public.rlg_stripe_settlements s
  where s.id = p_settlement_id
  for update;

  if not found then
    raise exception
      'RLG Stripe settlement not found'
      using errcode = 'P0002';
  end if;

  if v_settlement.status in ('succeeded', 'cancelled') then
    raise exception
      'Terminal RLG Stripe settlement cannot be marked failed';
  end if;

  update public.rlg_stripe_settlements s
  set
    status = 'failed',
    last_error_code = left(nullif(trim(p_error_code), ''), 160),
    last_error_message = left(nullif(trim(p_error_message), ''), 800)
  where s.id = v_settlement.id
  returning *
  into v_settlement;

  update public.rlg_transactions t
  set
    status =
      case
        when t.status = 'paid' then t.status
        else 'failed'
      end,
    failed_at =
      case
        when t.status = 'paid' then t.failed_at
        else coalesce(t.failed_at, now())
      end
  where t.id = v_settlement.transaction_id;

  return query
  select
    v_settlement.id,
    v_settlement.transaction_id,
    v_settlement.status;
end;
$function$;


-- ============================================================
-- 10. APPLY A VERIFIED STRIPE WEBHOOK EVENT
--
-- The application must verify Stripe's signature BEFORE calling
-- this RPC. This function then provides database idempotency and
-- ordered-state protection. Stripe event delivery order is not
-- trusted.
-- ============================================================

create or replace function public.rlg_apply_stripe_settlement_webhook(
  p_stripe_event_id text,
  p_event_type text,
  p_stripe_object_id text,
  p_livemode boolean,
  p_payload_sha256 text default null,
  p_settlement_id uuid default null,
  p_transaction_id uuid default null,
  p_payment_intent_id text default null,
  p_charge_id text default null,
  p_provider_status text default null,
  p_failure_code text default null,
  p_failure_message text default null
)
returns table (
  webhook_event_id text,
  processing_status text,
  settlement_id uuid,
  transaction_id uuid,
  decision_code text,
  replayed boolean
)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_webhook public.rlg_stripe_webhook_events%rowtype;
  v_settlement public.rlg_stripe_settlements%rowtype;
  v_transaction public.rlg_transactions%rowtype;
  v_decision text;
  v_processing_status text;
begin
  if nullif(trim(p_stripe_event_id), '') is null
     or nullif(trim(p_event_type), '') is null
  then
    raise exception
      'Stripe event id and event type are required'
      using errcode = '22023';
  end if;

  insert into public.rlg_stripe_webhook_events (
    stripe_event_id,
    event_type,
    stripe_object_id,
    stripe_payment_intent_id,
    stripe_charge_id,
    livemode,
    payload_sha256,
    processing_status
  )
  values (
    p_stripe_event_id,
    p_event_type,
    p_stripe_object_id,
    p_payment_intent_id,
    p_charge_id,
    p_livemode,
    p_payload_sha256,
    'received'
  )
  on conflict (stripe_event_id)
  do nothing;

  select w.*
  into v_webhook
  from public.rlg_stripe_webhook_events w
  where w.stripe_event_id = p_stripe_event_id
  for update;

  if v_webhook.processing_status in ('processed', 'ignored') then
    return query
    select
      v_webhook.stripe_event_id,
      v_webhook.processing_status,
      v_webhook.settlement_id,
      v_webhook.transaction_id,
      v_webhook.decision_code,
      true;

    return;
  end if;

  if p_settlement_id is not null then
    select s.*
    into v_settlement
    from public.rlg_stripe_settlements s
    where s.id = p_settlement_id
    for update;

  elsif nullif(trim(p_payment_intent_id), '') is not null then
    select s.*
    into v_settlement
    from public.rlg_stripe_settlements s
    where s.stripe_payment_intent_id = p_payment_intent_id
    for update;
  end if;

  if not found then
    update public.rlg_stripe_webhook_events w
    set
      processing_status = 'ignored',
      decision_code = 'settlement_not_found',
      processed_at = now()
    where w.stripe_event_id = p_stripe_event_id
    returning *
    into v_webhook;

    return query
    select
      v_webhook.stripe_event_id,
      v_webhook.processing_status,
      v_webhook.settlement_id,
      v_webhook.transaction_id,
      v_webhook.decision_code,
      false;

    return;
  end if;

  if p_transaction_id is not null
     and p_transaction_id <> v_settlement.transaction_id
  then
    update public.rlg_stripe_webhook_events w
    set
      settlement_id = v_settlement.id,
      transaction_id = v_settlement.transaction_id,
      processing_status = 'failed',
      decision_code = 'transaction_metadata_mismatch',
      last_error = 'Webhook transaction metadata does not match settlement'
    where w.stripe_event_id = p_stripe_event_id
    returning *
    into v_webhook;

    return query
    select
      v_webhook.stripe_event_id,
      v_webhook.processing_status,
      v_webhook.settlement_id,
      v_webhook.transaction_id,
      v_webhook.decision_code,
      false;

    return;
  end if;

  if p_livemode is distinct from v_settlement.livemode_snapshot then
    update public.rlg_stripe_webhook_events w
    set
      settlement_id = v_settlement.id,
      transaction_id = v_settlement.transaction_id,
      processing_status = 'failed',
      decision_code = 'livemode_mismatch',
      last_error = 'Stripe event livemode does not match settlement snapshot'
    where w.stripe_event_id = p_stripe_event_id
    returning *
    into v_webhook;

    return query
    select
      v_webhook.stripe_event_id,
      v_webhook.processing_status,
      v_webhook.settlement_id,
      v_webhook.transaction_id,
      v_webhook.decision_code,
      false;

    return;
  end if;

  if nullif(trim(p_payment_intent_id), '') is not null then
    if v_settlement.stripe_payment_intent_id is null then
      update public.rlg_stripe_settlements s
      set stripe_payment_intent_id = p_payment_intent_id
      where s.id = v_settlement.id
      returning *
      into v_settlement;

    elsif v_settlement.stripe_payment_intent_id <> p_payment_intent_id then
      update public.rlg_stripe_webhook_events w
      set
        settlement_id = v_settlement.id,
        transaction_id = v_settlement.transaction_id,
        processing_status = 'failed',
        decision_code = 'payment_intent_mismatch',
        last_error = 'Stripe PaymentIntent does not match settlement'
      where w.stripe_event_id = p_stripe_event_id
      returning *
      into v_webhook;

      return query
      select
        v_webhook.stripe_event_id,
        v_webhook.processing_status,
        v_webhook.settlement_id,
        v_webhook.transaction_id,
        v_webhook.decision_code,
        false;

      return;
    end if;
  end if;

  select t.*
  into v_transaction
  from public.rlg_transactions t
  where t.id = v_settlement.transaction_id
  for update;

  if not found then
    raise exception
      'RLG transaction for Stripe settlement not found';
  end if;

  if v_transaction.stripe_payment_intent_id is not null
     and p_payment_intent_id is not null
     and v_transaction.stripe_payment_intent_id <> p_payment_intent_id
  then
    update public.rlg_stripe_webhook_events w
    set
      settlement_id = v_settlement.id,
      transaction_id = v_settlement.transaction_id,
      processing_status = 'failed',
      decision_code = 'transaction_payment_intent_mismatch',
      last_error = 'Transaction belongs to a different PaymentIntent'
    where w.stripe_event_id = p_stripe_event_id
    returning *
    into v_webhook;

    return query
    select
      v_webhook.stripe_event_id,
      v_webhook.processing_status,
      v_webhook.settlement_id,
      v_webhook.transaction_id,
      v_webhook.decision_code,
      false;

    return;
  end if;

  v_processing_status := 'processed';

  case p_event_type

    when 'payment_intent.succeeded' then
      update public.rlg_stripe_settlements s
      set
        stripe_payment_intent_id =
          coalesce(s.stripe_payment_intent_id, p_payment_intent_id),
        stripe_charge_id =
          coalesce(s.stripe_charge_id, p_charge_id),
        provider_status =
          coalesce(p_provider_status, 'succeeded'),
        status = 'succeeded',
        submitted_at = coalesce(s.submitted_at, now()),
        succeeded_at = coalesce(s.succeeded_at, now()),
        last_error_code = null,
        last_error_message = null
      where s.id = v_settlement.id
      returning *
      into v_settlement;

      update public.rlg_transactions t
      set
        stripe_payment_intent_id =
          coalesce(t.stripe_payment_intent_id, p_payment_intent_id),
        stripe_charge_id =
          coalesce(t.stripe_charge_id, p_charge_id),
        status =
          case
            when t.status in ('refunded', 'partially_refunded')
              then t.status
            else 'paid'
          end,
        paid_at = coalesce(t.paid_at, now())
      where t.id = v_settlement.transaction_id;

      v_decision := 'settlement_succeeded';

    when 'payment_intent.payment_failed' then
      if v_settlement.status = 'succeeded'
         or v_transaction.status = 'paid'
      then
        v_processing_status := 'ignored';
        v_decision := 'stale_failure_after_success';

      else
        update public.rlg_stripe_settlements s
        set
          provider_status =
            coalesce(p_provider_status, 'requires_payment_method'),
          status = 'failed',
          last_error_code =
            left(nullif(trim(p_failure_code), ''), 160),
          last_error_message =
            left(nullif(trim(p_failure_message), ''), 800)
        where s.id = v_settlement.id
        returning *
        into v_settlement;

        update public.rlg_transactions t
        set
          stripe_payment_intent_id =
            coalesce(t.stripe_payment_intent_id, p_payment_intent_id),
          status = 'failed',
          failed_at = coalesce(t.failed_at, now())
        where t.id = v_settlement.transaction_id
          and t.status <> 'paid';

        v_decision := 'settlement_payment_failed';
      end if;

    when 'payment_intent.requires_action' then
      if v_settlement.status = 'succeeded'
         or v_transaction.status = 'paid'
      then
        v_processing_status := 'ignored';
        v_decision := 'stale_requires_action_after_success';

      else
        update public.rlg_stripe_settlements s
        set
          provider_status =
            coalesce(p_provider_status, 'requires_action'),
          status = 'requires_action'
        where s.id = v_settlement.id
        returning *
        into v_settlement;

        update public.rlg_transactions t
        set
          stripe_payment_intent_id =
            coalesce(t.stripe_payment_intent_id, p_payment_intent_id),
          status = 'pending'
        where t.id = v_settlement.transaction_id
          and t.status <> 'paid';

        v_decision := 'settlement_requires_action';
      end if;

    when 'payment_intent.processing' then
      if v_settlement.status = 'succeeded'
         or v_transaction.status = 'paid'
      then
        v_processing_status := 'ignored';
        v_decision := 'stale_processing_after_success';

      else
        update public.rlg_stripe_settlements s
        set
          provider_status =
            coalesce(p_provider_status, 'processing'),
          status = 'submitted',
          submitted_at = coalesce(s.submitted_at, now())
        where s.id = v_settlement.id
        returning *
        into v_settlement;

        update public.rlg_transactions t
        set
          stripe_payment_intent_id =
            coalesce(t.stripe_payment_intent_id, p_payment_intent_id),
          status = 'pending'
        where t.id = v_settlement.transaction_id
          and t.status <> 'paid';

        v_decision := 'settlement_processing';
      end if;

    when 'payment_intent.canceled' then
      if v_settlement.status = 'succeeded'
         or v_transaction.status = 'paid'
      then
        v_processing_status := 'ignored';
        v_decision := 'stale_cancel_after_success';

      else
        update public.rlg_stripe_settlements s
        set
          provider_status =
            coalesce(p_provider_status, 'canceled'),
          status = 'cancelled',
          cancelled_at = coalesce(s.cancelled_at, now())
        where s.id = v_settlement.id
        returning *
        into v_settlement;

        update public.rlg_transactions t
        set
          stripe_payment_intent_id =
            coalesce(t.stripe_payment_intent_id, p_payment_intent_id),
          status = 'cancelled'
        where t.id = v_settlement.transaction_id
          and t.status <> 'paid';

        v_decision := 'settlement_cancelled';
      end if;

    else
      v_processing_status := 'ignored';
      v_decision := 'unsupported_event_type';
  end case;

  update public.rlg_stripe_webhook_events w
  set
    settlement_id = v_settlement.id,
    transaction_id = v_settlement.transaction_id,
    processing_status = v_processing_status,
    decision_code = v_decision,
    last_error = null,
    processed_at = now()
  where w.stripe_event_id = p_stripe_event_id
  returning *
  into v_webhook;

  return query
  select
    v_webhook.stripe_event_id,
    v_webhook.processing_status,
    v_webhook.settlement_id,
    v_webhook.transaction_id,
    v_webhook.decision_code,
    false;
end;
$function$;


-- ============================================================
-- 11. DRIVER REWARD PAYABLE GATE
--
-- Economic reward entry may exist from Patch 4, but payout
-- eligibility requires BOTH:
--   1. reward hold elapsed, and
--   2. merchant settlement actually paid.
-- ============================================================

create or replace function public.rlg_mark_payable_driver_rewards(
  p_batch_size integer default 100
)
returns table (
  reward_id uuid,
  driver_id uuid,
  amount_cents bigint,
  eligible_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $function$
begin
  if p_batch_size is null
     or p_batch_size < 1
     or p_batch_size > 1000
  then
    raise exception
      'batch size must be between 1 and 1000'
      using errcode = '22023';
  end if;

  return query
  with candidates as (
    select r.id
    from public.rlg_driver_reward_ledger r
    join public.rlg_transactions t
      on t.id = r.transaction_id
    join public.rlg_driver_accounts a
      on a.driver_id = r.driver_id
    where r.entry_type = 'reward_earned'
      and r.amount_cents > 0
      and r.status = 'pending'
      and r.eligible_at is not null
      and r.eligible_at <= now()
      and t.status = 'paid'
      and a.is_active = true
      and a.payouts_enabled = true
      and a.onboarding_status = 'complete'
      and a.stripe_account_id is not null
    order by r.eligible_at, r.created_at, r.id
    for update of r skip locked
    limit p_batch_size
  ),
  updated as (
    update public.rlg_driver_reward_ledger r
    set status = 'payable'
    from candidates c
    where r.id = c.id
    returning
      r.id,
      r.driver_id,
      r.amount_cents,
      r.eligible_at
  )
  select
    u.id,
    u.driver_id,
    u.amount_cents,
    u.eligible_at
  from updated u;
end;
$function$;


-- ============================================================
-- 12. OPERATIONS ATTENTION VIEW
-- ============================================================

create view public.rlg_stripe_settlement_attention as
select
  s.id as settlement_id,
  s.transaction_id,
  s.merchant_account_id,
  s.amount_cents,
  s.currency,
  s.status,
  s.provider_status,
  s.last_error_code,
  s.last_error_message,
  s.stripe_payment_intent_id,
  s.livemode_snapshot,
  s.created_at,
  s.updated_at
from public.rlg_stripe_settlements s
where s.status in (
  'requires_action',
  'failed'
);


-- ============================================================
-- 13. SERVER-ONLY SECURITY
-- ============================================================

alter table public.rlg_stripe_settlements
  enable row level security;

alter table public.rlg_stripe_webhook_events
  enable row level security;

revoke all
on table public.rlg_stripe_settlements
from public, anon, authenticated;

grant all
on table public.rlg_stripe_settlements
to service_role;

revoke all
on table public.rlg_stripe_webhook_events
from public, anon, authenticated;

grant all
on table public.rlg_stripe_webhook_events
to service_role;

revoke all
on table public.rlg_stripe_settlement_attention
from public, anon, authenticated;

grant select
on table public.rlg_stripe_settlement_attention
to service_role;

revoke all
on function public.rlg_prepare_qualified_lead_settlement(uuid)
from public, anon, authenticated;

grant execute
on function public.rlg_prepare_qualified_lead_settlement(uuid)
to service_role;

revoke all
on function public.rlg_record_stripe_settlement_submission(uuid, text, text)
from public, anon, authenticated;

grant execute
on function public.rlg_record_stripe_settlement_submission(uuid, text, text)
to service_role;

revoke all
on function public.rlg_record_stripe_settlement_request_failure(uuid, text, text)
from public, anon, authenticated;

grant execute
on function public.rlg_record_stripe_settlement_request_failure(uuid, text, text)
to service_role;

revoke all
on function public.rlg_apply_stripe_settlement_webhook(
  text,
  text,
  text,
  boolean,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text
)
from public, anon, authenticated;

grant execute
on function public.rlg_apply_stripe_settlement_webhook(
  text,
  text,
  text,
  boolean,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text
)
to service_role;

revoke all
on function public.rlg_mark_payable_driver_rewards(integer)
from public, anon, authenticated;

grant execute
on function public.rlg_mark_payable_driver_rewards(integer)
to service_role;


comment on table public.rlg_stripe_settlements is
  'One idempotent Stripe settlement authority per RLG transaction. Patch 6 creates no Stripe network calls.';

comment on table public.rlg_stripe_webhook_events is
  'Server-only Stripe webhook idempotency/audit log. Full webhook payloads are intentionally not persisted.';

comment on function public.rlg_prepare_qualified_lead_settlement(uuid) is
  'Idempotently prepares one off-session merchant charge for a qualified-lead-fee transaction after explicit billing readiness/consent checks. No payment movement occurs.';

comment on function public.rlg_apply_stripe_settlement_webhook(
  text,
  text,
  text,
  boolean,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text
) is
  'Applies a signature-verified Stripe PaymentIntent event idempotently and protects paid state from stale/out-of-order failure events.';

comment on function public.rlg_mark_payable_driver_rewards(integer) is
  'Moves earned driver rewards from pending to payable only after hold expiry, successful merchant settlement, and payout-account readiness.';

commit;
