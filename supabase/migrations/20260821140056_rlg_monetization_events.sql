begin;

-- ============================================================
-- RIDER LOCAL GUIDE
-- Patch 4: Monetization Event Capture + Accounting Generation
--
-- NO STRIPE PAYMENT MOVEMENT OCCURS IN THIS PATCH.
-- ============================================================


-- ============================================================
-- 1. DURABLE MONETIZATION EVENT / OUTBOX
-- ============================================================

create table public.rlg_monetization_events (
  id uuid primary key default gen_random_uuid(),

  source_type text not null
    check (
      source_type in (
        'qualified_lead'
      )
    ),

  source_id uuid not null,

  lead_id uuid
    references public.local_discovery_leads(id)
    on update cascade
    on delete restrict,

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

  occurred_at timestamptz not null,

  merchant_account_id uuid
    references public.rlg_merchant_accounts(id)
    on update cascade
    on delete restrict,

  provider_snapshot text not null default 'stripe'
    check (
      provider_snapshot in (
        'stripe',
        'manual',
        'test'
      )
    ),

  pricing_model_snapshot text
    check (
      pricing_model_snapshot is null
      or pricing_model_snapshot in (
        'transaction_percentage',
        'qualified_lead_fee',
        'booking_fee',
        'subscription',
        'free'
      )
    ),

  currency_snapshot text not null default 'usd'
    check (currency_snapshot ~ '^[a-z]{3}$'),

  gross_amount_cents_snapshot bigint not null default 0
    check (gross_amount_cents_snapshot >= 0),

  commission_bps_snapshot integer
    check (
      commission_bps_snapshot is null
      or commission_bps_snapshot between 0 and 10000
    ),

  rlg_commission_cents_snapshot bigint not null default 0
    check (rlg_commission_cents_snapshot >= 0),

  merchant_charges_enabled_snapshot boolean,

  agreement_version_snapshot text,
  agreement_accepted_at_snapshot timestamptz,

  driver_account_id uuid
    references public.rlg_driver_accounts(id)
    on update cascade
    on delete restrict,

  driver_reward_model_snapshot text
    check (
      driver_reward_model_snapshot is null
      or driver_reward_model_snapshot in (
        'rlg_commission_share',
        'fixed_per_conversion',
        'none'
      )
    ),

  driver_reward_bps_snapshot integer
    check (
      driver_reward_bps_snapshot is null
      or driver_reward_bps_snapshot between 0 and 10000
    ),

  driver_reward_cents_snapshot bigint not null default 0
    check (driver_reward_cents_snapshot >= 0),

  reward_hold_days_snapshot integer
    check (
      reward_hold_days_snapshot is null
      or reward_hold_days_snapshot between 0 and 90
    ),

  driver_payouts_enabled_snapshot boolean,

  eligible_at_snapshot timestamptz,

  status text not null
    check (
      status in (
        'pending',
        'processed',
        'skipped'
      )
    ),

  decision_code text not null,

  transaction_id uuid unique
    references public.rlg_transactions(id)
    on update cascade
    on delete restrict,

  processed_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (source_type, source_id),

  check (
    driver_reward_cents_snapshot
      <= rlg_commission_cents_snapshot
  ),

  check (
    driver_id is not null
    or driver_reward_cents_snapshot = 0
  ),

  check (
    status <> 'processed'
    or transaction_id is not null
  ),

  check (
    status <> 'processed'
    or processed_at is not null
  )
);


create index rlg_monetization_events_status_idx
on public.rlg_monetization_events (
  status,
  occurred_at
);

create index rlg_monetization_events_business_idx
on public.rlg_monetization_events (business_id);

create index rlg_monetization_events_driver_idx
on public.rlg_monetization_events (driver_id);

create index rlg_monetization_events_referral_idx
on public.rlg_monetization_events (referral_id);


alter table public.rlg_monetization_events
  enable row level security;

revoke all
on table public.rlg_monetization_events
from public;

revoke all
on table public.rlg_monetization_events
from anon;

revoke all
on table public.rlg_monetization_events
from authenticated;

grant all
on table public.rlg_monetization_events
to service_role;


-- ============================================================
-- 2. IMMUTABLE MONETIZATION SNAPSHOT
-- ============================================================

create or replace function public.rlg_guard_monetization_event_update()
returns trigger
language plpgsql
as $function$
begin

  if
    new.id is distinct from old.id
    or new.source_type is distinct from old.source_type
    or new.source_id is distinct from old.source_id
    or new.lead_id is distinct from old.lead_id
    or new.referral_id is distinct from old.referral_id
    or new.business_id is distinct from old.business_id
    or new.driver_id is distinct from old.driver_id
    or new.occurred_at is distinct from old.occurred_at

    or new.merchant_account_id
         is distinct from old.merchant_account_id
    or new.provider_snapshot
         is distinct from old.provider_snapshot
    or new.pricing_model_snapshot
         is distinct from old.pricing_model_snapshot
    or new.currency_snapshot
         is distinct from old.currency_snapshot
    or new.gross_amount_cents_snapshot
         is distinct from old.gross_amount_cents_snapshot
    or new.commission_bps_snapshot
         is distinct from old.commission_bps_snapshot
    or new.rlg_commission_cents_snapshot
         is distinct from old.rlg_commission_cents_snapshot
    or new.merchant_charges_enabled_snapshot
         is distinct from old.merchant_charges_enabled_snapshot
    or new.agreement_version_snapshot
         is distinct from old.agreement_version_snapshot
    or new.agreement_accepted_at_snapshot
         is distinct from old.agreement_accepted_at_snapshot

    or new.driver_account_id
         is distinct from old.driver_account_id
    or new.driver_reward_model_snapshot
         is distinct from old.driver_reward_model_snapshot
    or new.driver_reward_bps_snapshot
         is distinct from old.driver_reward_bps_snapshot
    or new.driver_reward_cents_snapshot
         is distinct from old.driver_reward_cents_snapshot
    or new.reward_hold_days_snapshot
         is distinct from old.reward_hold_days_snapshot
    or new.driver_payouts_enabled_snapshot
         is distinct from old.driver_payouts_enabled_snapshot
    or new.eligible_at_snapshot
         is distinct from old.eligible_at_snapshot

    or new.decision_code
         is distinct from old.decision_code
    or new.metadata
         is distinct from old.metadata
    or new.created_at
         is distinct from old.created_at
  then
    raise exception
      'RLG monetization event identity/economics are immutable';
  end if;


  if new.status is distinct from old.status then
    if not (
      old.status = 'pending'
      and new.status = 'processed'
    ) then
      raise exception
        'Invalid RLG monetization event transition: % -> %',
        old.status,
        new.status;
    end if;
  end if;


  if
    old.transaction_id is not null
    and new.transaction_id
          is distinct from old.transaction_id
  then
    raise exception
      'RLG monetization transaction linkage is write-once';
  end if;


  if
    old.processed_at is not null
    and new.processed_at
          is distinct from old.processed_at
  then
    raise exception
      'RLG monetization processed_at is write-once';
  end if;


  new.updated_at = now();

  return new;
end;
$function$;


create trigger rlg_monetization_events_guard_update
before update on public.rlg_monetization_events
for each row
execute function public.rlg_guard_monetization_event_update();


create trigger rlg_monetization_events_prevent_delete
before delete on public.rlg_monetization_events
for each row
execute function public.rlg_prevent_ledger_mutation();


-- ============================================================
-- 3. CAPTURE QUALIFIED LEAD ECONOMICS
-- ============================================================

create or replace function public.rlg_capture_qualified_lead_monetization_event(
  p_lead_id uuid
)
returns table (
  event_id uuid,
  event_status text,
  decision_code text,
  replayed boolean
)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_lead public.local_discovery_leads%rowtype;
  v_referral public.rlg_referrals%rowtype;
  v_merchant public.rlg_merchant_accounts%rowtype;
  v_driver_account public.rlg_driver_accounts%rowtype;

  v_existing public.rlg_monetization_events%rowtype;

  v_event_id uuid;

  v_status text := 'skipped';
  v_decision_code text := 'unknown';

  v_currency text := 'usd';

  v_commission_cents bigint := 0;
  v_driver_reward_cents bigint := 0;

  v_driver_reward_bps integer;
  v_reward_hold_days integer;
  v_eligible_at timestamptz;

  v_driver_reward_reason text := 'no_driver';
begin

  if p_lead_id is null then
    raise exception
      'lead id is required'
      using errcode = '22023';
  end if;


  -- ----------------------------------------------------------
  -- Idempotent replay.
  -- ----------------------------------------------------------

  select *
  into v_existing
  from public.rlg_monetization_events
  where source_type = 'qualified_lead'
    and source_id = p_lead_id
  limit 1;

  if found then
    return query
    select
      v_existing.id,
      v_existing.status,
      v_existing.decision_code,
      true;

    return;
  end if;


  -- ----------------------------------------------------------
  -- Durable lead must already exist.
  --
  -- This function is intentionally called AFTER the lead RPC
  -- commits. Accounting failure therefore cannot roll back the
  -- rider's legitimate lead submission.
  -- ----------------------------------------------------------

  select *
  into v_lead
  from public.local_discovery_leads
  where id = p_lead_id;

  if not found then
    raise exception
      'RLG lead not found'
      using errcode = 'P0002';
  end if;


  -- An unattributed lead remains safely stored but is outside
  -- the RLG monetization system.
  if v_lead.referral_id is null
     or v_lead.business_id is null
  then
    return query
    select
      null::uuid,
      'skipped'::text,
      'unattributed_lead'::text,
      false;

    return;
  end if;


  select *
  into v_referral
  from public.rlg_referrals
  where id = v_lead.referral_id;

  if not found then
    raise exception
      'RLG referral for lead not found';
  end if;


  -- Capture only a real qualified-lead conversion.
  --
  -- No event is created if qualification is incomplete. A
  -- reconciliation job can retry later after state correction.
  if v_referral.status <> 'qualified'
     or v_referral.conversion_type <> 'qualified_lead'
  then
    return query
    select
      null::uuid,
      'skipped'::text,
      'referral_not_qualified'::text,
      false;

    return;
  end if;


  -- ----------------------------------------------------------
  -- Merchant economics at conversion time.
  -- ----------------------------------------------------------

  select *
  into v_merchant
  from public.rlg_merchant_accounts
  where business_id = v_referral.business_id;


  if not found then
    v_status := 'skipped';
    v_decision_code :=
      'merchant_account_missing';

  else
    v_currency := v_merchant.currency;

    if not v_merchant.is_active then
      v_status := 'skipped';
      v_decision_code :=
        'merchant_inactive';

    elsif
      v_merchant.pricing_model <>
        'qualified_lead_fee'
    then
      v_status := 'skipped';
      v_decision_code :=
        'pricing_model_not_qualified_lead_fee';

    elsif v_merchant.lead_fee_cents <= 0 then
      v_status := 'skipped';
      v_decision_code :=
        'lead_fee_zero';

    elsif v_merchant.agreement_accepted_at is null then
      v_status := 'skipped';
      v_decision_code :=
        'merchant_agreement_missing';

    elsif
      v_merchant.agreement_accepted_at
        > coalesce(
            v_referral.qualified_at,
            v_lead.created_at
          )
    then
      v_status := 'skipped';
      v_decision_code :=
        'merchant_agreement_after_conversion';

    elsif not v_merchant.charges_enabled then
      v_status := 'skipped';
      v_decision_code :=
        'merchant_charges_disabled';

    else
      v_status := 'pending';
      v_decision_code :=
        'billable_qualified_lead';

      v_commission_cents :=
        v_merchant.lead_fee_cents;
    end if;
  end if;


  -- ----------------------------------------------------------
  -- Driver reward economics.
  --
  -- payouts_enabled controls settlement readiness, NOT whether
  -- an already-configured active reward was economically earned.
  -- ----------------------------------------------------------

  if v_status = 'pending'
     and v_referral.driver_id is not null
  then

    select *
    into v_driver_account
    from public.rlg_driver_accounts
    where driver_id = v_referral.driver_id;


    if not found then
      v_driver_reward_reason :=
        'driver_account_missing';

    elsif not v_driver_account.is_active then
      v_driver_reward_reason :=
        'driver_account_inactive';

    elsif v_driver_account.reward_model = 'none' then
      v_driver_reward_reason :=
        'reward_model_none';

    elsif
      v_driver_account.reward_model =
        'rlg_commission_share'
    then

      v_driver_reward_bps :=
        v_driver_account.reward_rate_bps;

      v_reward_hold_days :=
        v_driver_account.reward_hold_days;

      v_driver_reward_cents :=
        round(
          (
            v_commission_cents::numeric
            *
            v_driver_account.reward_rate_bps::numeric
          )
          / 10000
        )::bigint;

      v_driver_reward_reason :=
        'commission_share';

    elsif
      v_driver_account.reward_model =
        'fixed_per_conversion'
    then

      v_reward_hold_days :=
        v_driver_account.reward_hold_days;

      v_driver_reward_cents :=
        v_driver_account.fixed_reward_cents;

      v_driver_reward_reason :=
        'fixed_per_conversion';
    end if;


    if
      v_driver_reward_cents >
      v_commission_cents
    then

      -- Invalid economics are never converted into accounting
      -- entries.
      v_status := 'skipped';
      v_decision_code :=
        'driver_reward_exceeds_commission';

      v_driver_reward_cents := 0;
      v_driver_reward_bps := null;
      v_eligible_at := null;

    elsif v_driver_reward_cents > 0 then

      v_eligible_at :=
        coalesce(
          v_referral.qualified_at,
          v_lead.created_at
        )
        +
        make_interval(
          days => coalesce(
            v_reward_hold_days,
            0
          )
        );
    end if;
  end if;


  -- ----------------------------------------------------------
  -- Durable immutable event-time economics snapshot.
  -- ----------------------------------------------------------

  insert into public.rlg_monetization_events (
    source_type,
    source_id,

    lead_id,
    referral_id,
    business_id,
    driver_id,

    occurred_at,

    merchant_account_id,
    provider_snapshot,
    pricing_model_snapshot,
    currency_snapshot,

    gross_amount_cents_snapshot,
    commission_bps_snapshot,
    rlg_commission_cents_snapshot,

    merchant_charges_enabled_snapshot,
    agreement_version_snapshot,
    agreement_accepted_at_snapshot,

    driver_account_id,
    driver_reward_model_snapshot,
    driver_reward_bps_snapshot,
    driver_reward_cents_snapshot,

    reward_hold_days_snapshot,
    driver_payouts_enabled_snapshot,
    eligible_at_snapshot,

    status,
    decision_code,

    metadata
  )
  values (
    'qualified_lead',
    v_lead.id,

    v_lead.id,
    v_referral.id,
    v_referral.business_id,
    v_referral.driver_id,

    coalesce(
      v_referral.qualified_at,
      v_lead.created_at
    ),

    v_merchant.id,
    'stripe',
    v_merchant.pricing_model,
    v_currency,

    0,

    case
      when v_merchant.pricing_model =
        'transaction_percentage'
      then v_merchant.commission_bps
      else null
    end,

    v_commission_cents,

    v_merchant.charges_enabled,
    v_merchant.agreement_version,
    v_merchant.agreement_accepted_at,

    v_driver_account.id,
    v_driver_account.reward_model,
    v_driver_reward_bps,
    v_driver_reward_cents,

    v_reward_hold_days,
    v_driver_account.payouts_enabled,
    v_eligible_at,

    v_status,
    v_decision_code,

    jsonb_strip_nulls(
      jsonb_build_object(
        'source',
        'qualified_lead_capture',

        'business_slug',
        v_referral.business_slug_snapshot,

        'driver_slug',
        v_referral.driver_slug_snapshot,

        'driver_reward_reason',
        v_driver_reward_reason,

        'merchant_is_active',
        v_merchant.is_active,

        'driver_is_active',
        v_driver_account.is_active
      )
    )
  )
  on conflict (
    source_type,
    source_id
  )
  do nothing
  returning id
  into v_event_id;


  -- Another concurrent capture may have won the unique-key race.
  if v_event_id is null then

    select *
    into v_existing
    from public.rlg_monetization_events
    where source_type = 'qualified_lead'
      and source_id = v_lead.id;

    if not found then
      raise exception
        'RLG monetization event could not be captured';
    end if;


    return query
    select
      v_existing.id,
      v_existing.status,
      v_existing.decision_code,
      true;

    return;
  end if;


  return query
  select
    v_event_id,
    v_status,
    v_decision_code,
    false;
end;
$function$;


-- Monetization capture is intentionally NOT attached as a
-- PostgreSQL trigger.
--
-- PostgreSQL triggers execute within the same transaction as the
-- lead INSERT. Accounting failure must never roll back a legitimate
-- rider lead.
--
-- The application invokes capture after the durable lead transaction
-- succeeds. Missing events can later be reconciled safely.


-- ============================================================
-- 4. ONE QUALIFIED-LEAD TRANSACTION PER REFERRAL
-- ============================================================

create unique index
  rlg_transactions_qualified_lead_referral_unique_idx
on public.rlg_transactions (referral_id)
where pricing_model_snapshot = 'qualified_lead_fee';


-- ============================================================
-- 5. PROCESS PENDING MONETIZATION EVENT
--
-- ACCOUNTING ONLY. NO STRIPE CHARGE OR TRANSFER.
-- ============================================================

create or replace function public.rlg_process_monetization_event(
  p_event_id uuid
)
returns table (
  event_id uuid,
  transaction_id uuid,
  commission_ledger_id uuid,
  driver_reward_ledger_id uuid,
  event_status text,
  replayed boolean
)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_event public.rlg_monetization_events%rowtype;

  v_transaction_id uuid;
  v_commission_ledger_id uuid;
  v_driver_reward_ledger_id uuid;

  v_transaction_key text;
  v_commission_key text;
  v_reward_key text;
begin

  select *
  into v_event
  from public.rlg_monetization_events
  where id = p_event_id
  for update;


  if not found then
    raise exception
      'RLG monetization event not found'
      using errcode = 'P0002';
  end if;


  if v_event.status = 'processed' then

    v_transaction_id :=
      v_event.transaction_id;

    select id
    into v_commission_ledger_id
    from public.rlg_commission_ledger
    where source_event_id =
      v_event.id::text
    limit 1;

    select id
    into v_driver_reward_ledger_id
    from public.rlg_driver_reward_ledger
    where source_event_id =
      v_event.id::text
    limit 1;


    return query
    select
      v_event.id,
      v_transaction_id,
      v_commission_ledger_id,
      v_driver_reward_ledger_id,
      v_event.status,
      true;

    return;
  end if;


  if v_event.status = 'skipped' then
    return query
    select
      v_event.id,
      null::uuid,
      null::uuid,
      null::uuid,
      v_event.status,
      false;

    return;
  end if;


  if v_event.status <> 'pending' then
    raise exception
      'Unsupported RLG monetization status: %',
      v_event.status;
  end if;


  if v_event.pricing_model_snapshot <>
       'qualified_lead_fee'
     or v_event.rlg_commission_cents_snapshot <= 0
  then
    raise exception
      'Pending monetization event has invalid billable economics';
  end if;


  v_transaction_key :=
    'monetization_event:'
    || v_event.id::text;

  v_commission_key :=
    'commission_earned:'
    || v_event.id::text;

  v_reward_key :=
    'reward_earned:'
    || v_event.id::text;


  insert into public.rlg_transactions (
    referral_id,
    business_id,
    driver_id,

    idempotency_key,

    provider,
    pricing_model_snapshot,
    currency,

    gross_amount_cents,
    commission_bps_snapshot,

    rlg_commission_cents,

    driver_reward_bps_snapshot,
    driver_reward_cents,

    status,

    metadata
  )
  values (
    v_event.referral_id,
    v_event.business_id,
    v_event.driver_id,

    v_transaction_key,

    v_event.provider_snapshot,
    v_event.pricing_model_snapshot,
    v_event.currency_snapshot,

    v_event.gross_amount_cents_snapshot,
    v_event.commission_bps_snapshot,

    v_event.rlg_commission_cents_snapshot,

    v_event.driver_reward_bps_snapshot,
    v_event.driver_reward_cents_snapshot,

    'initiated',

    jsonb_build_object(
      'monetization_event_id',
      v_event.id,

      'source_type',
      v_event.source_type,

      'source_id',
      v_event.source_id,

      'merchant_account_id',
      v_event.merchant_account_id,

      'driver_account_id',
      v_event.driver_account_id,

      'agreement_version',
      v_event.agreement_version_snapshot,

      'charges_enabled_at_conversion',
      v_event.merchant_charges_enabled_snapshot,

      'driver_payouts_enabled_at_conversion',
      v_event.driver_payouts_enabled_snapshot
    )
  )
  returning id
  into v_transaction_id;


  insert into public.rlg_commission_ledger (
    transaction_id,
    business_id,
    driver_id,

    idempotency_key,
    source_event_id,

    entry_type,
    amount_cents,
    currency,
    occurred_at,

    metadata
  )
  values (
    v_transaction_id,
    v_event.business_id,
    v_event.driver_id,

    v_commission_key,
    v_event.id::text,

    'commission_earned',
    v_event.rlg_commission_cents_snapshot,
    v_event.currency_snapshot,
    v_event.occurred_at,

    jsonb_build_object(
      'monetization_event_id',
      v_event.id,
      'source_type',
      v_event.source_type
    )
  )
  returning id
  into v_commission_ledger_id;


  if
    v_event.driver_id is not null
    and v_event.driver_reward_cents_snapshot > 0
  then

    insert into public.rlg_driver_reward_ledger (
      transaction_id,
      referral_id,
      driver_id,
      business_id,

      idempotency_key,
      source_event_id,

      entry_type,
      amount_cents,
      currency,

      status,
      eligible_at,

      metadata
    )
    values (
      v_transaction_id,
      v_event.referral_id,
      v_event.driver_id,
      v_event.business_id,

      v_reward_key,
      v_event.id::text,

      'reward_earned',
      v_event.driver_reward_cents_snapshot,
      v_event.currency_snapshot,

      'pending',
      v_event.eligible_at_snapshot,

      jsonb_build_object(
        'monetization_event_id',
        v_event.id,

        'reward_model',
        v_event.driver_reward_model_snapshot,

        'reward_hold_days',
        v_event.reward_hold_days_snapshot
      )
    )
    returning id
    into v_driver_reward_ledger_id;

  end if;


  update public.rlg_monetization_events
  set
    status = 'processed',
    transaction_id = v_transaction_id,
    processed_at = now()
  where id = v_event.id;


  return query
  select
    v_event.id,
    v_transaction_id,
    v_commission_ledger_id,
    v_driver_reward_ledger_id,
    'processed'::text,
    false;
end;
$function$;


-- ============================================================
-- 6. SERVER-ONLY EXECUTION
-- ============================================================

revoke all
on function public.rlg_capture_qualified_lead_monetization_event(uuid)
from public;

revoke all
on function public.rlg_capture_qualified_lead_monetization_event(uuid)
from anon;

revoke all
on function public.rlg_capture_qualified_lead_monetization_event(uuid)
from authenticated;

grant execute
on function public.rlg_capture_qualified_lead_monetization_event(uuid)
to service_role;


revoke all
on function public.rlg_process_monetization_event(uuid)
from public;

revoke all
on function public.rlg_process_monetization_event(uuid)
from anon;

revoke all
on function public.rlg_process_monetization_event(uuid)
from authenticated;

grant execute
on function public.rlg_process_monetization_event(uuid)
to service_role;


comment on table public.rlg_monetization_events is
  'Durable RLG monetization outbox containing event-time merchant and driver economics snapshots.';

comment on function public.rlg_process_monetization_event(uuid) is
  'Idempotently converts one pending RLG monetization event into transaction, commission, and driver reward accounting entries. No payment movement occurs.';


commit;
