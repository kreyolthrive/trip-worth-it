begin;

-- ============================================================
-- RIDER LOCAL GUIDE
-- Patch 3: Durable lead submission + referral qualification
-- ============================================================


-- ------------------------------------------------------------
-- Attribution window
-- ------------------------------------------------------------

alter table public.rlg_referrals
  alter column attribution_expires_at
  set default (now() + interval '30 days');


-- ------------------------------------------------------------
-- Durable rider lead records
--
-- This table preserves the existing LocalDiscoveryLead contract
-- while attaching real business / driver / referral identities.
--
-- Financial payouts MUST use the RLG financial ledgers, not the
-- legacy conversion_value / estimated_payout fields below.
-- ------------------------------------------------------------

create table public.local_discovery_leads (
  id uuid primary key default gen_random_uuid(),

  submission_token uuid not null unique,

  referral_id uuid unique
    references public.rlg_referrals(id)
    on update cascade
    on delete restrict,

  business_id uuid
    references public.rlg_businesses(id)
    on update cascade
    on delete restrict,

  driver_id uuid
    references public.drivers(id)
    on update cascade
    on delete set null,

  driver_slug text,
  business_slug text not null,

  city text not null default 'miami',

  business_name text not null,
  category text not null,

  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  message text,

  visitor_session_id text,

  lead_status text not null default 'new'
    check (
      lead_status in (
        'new',
        'contacted',
        'closed'
      )
    ),

  conversion_status text not null default 'pending'
    check (
      conversion_status in (
        'pending',
        'approved',
        'rejected'
      )
    ),

  -- Legacy/admin compatibility only.
  -- These fields are NOT financial source of truth.
  conversion_value numeric,
  estimated_payout numeric,
  approved_payout numeric,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create index
  local_discovery_leads_business_idx
on public.local_discovery_leads (business_id);


create index
  local_discovery_leads_driver_idx
on public.local_discovery_leads (driver_id);


create index
  local_discovery_leads_business_slug_idx
on public.local_discovery_leads (business_slug);


create index
  local_discovery_leads_session_idx
on public.local_discovery_leads (visitor_session_id);


create index
  local_discovery_leads_status_idx
on public.local_discovery_leads (
  lead_status,
  conversion_status
);


create index
  local_discovery_leads_created_at_idx
on public.local_discovery_leads (created_at desc);


drop trigger if exists
  local_discovery_leads_set_updated_at
on public.local_discovery_leads;

create trigger local_discovery_leads_set_updated_at
before update on public.local_discovery_leads
for each row
execute function public.rlg_set_updated_at();


alter table public.local_discovery_leads
  enable row level security;


-- Rider PII is server-only.
revoke all
on table public.local_discovery_leads
from public;

revoke all
on table public.local_discovery_leads
from anon;

revoke all
on table public.local_discovery_leads
from authenticated;

grant all
on table public.local_discovery_leads
to service_role;


-- ------------------------------------------------------------
-- Atomic qualified-lead submission
--
-- 1. Idempotency check
-- 2. Match exact attribution token if available
-- 3. Otherwise match recent engaged referral
-- 4. Otherwise create direct qualified referral
-- 5. Persist durable lead
--
-- If business_id is NULL, the lead is still preserved but is
-- intentionally NOT financially attributed.
-- ------------------------------------------------------------

create or replace function public.rlg_submit_qualified_lead(
  p_submission_token uuid,
  p_attribution_token uuid,
  p_business_id uuid,
  p_driver_id uuid,
  p_business_slug text,
  p_business_name text,
  p_category text,
  p_driver_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_message text,
  p_visitor_session_id text,
  p_city text,
  p_metadata jsonb
)
returns table (
  lead_id uuid,
  referral_id uuid,
  attribution_token uuid,
  referral_status text,
  attributed boolean,
  replayed boolean
)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_lead_id uuid;
  v_referral_id uuid;
  v_attribution_token uuid;
  v_referral_status text;
begin
  if p_submission_token is null then
    raise exception 'submission token is required'
      using errcode = '22023';
  end if;

  if nullif(trim(p_business_slug), '') is null
     or nullif(trim(p_business_name), '') is null
     or nullif(trim(p_category), '') is null
     or nullif(trim(p_customer_name), '') is null
     or nullif(trim(p_customer_phone), '') is null
  then
    raise exception 'required lead fields are missing'
      using errcode = '22023';
  end if;


  -- ----------------------------------------------------------
  -- Idempotent replay
  -- ----------------------------------------------------------

  select
    l.id,
    l.referral_id
  into
    v_lead_id,
    v_referral_id
  from public.local_discovery_leads l
  where l.submission_token = p_submission_token
  limit 1;

  if v_lead_id is not null then
    if v_referral_id is not null then
      select
        r.attribution_token,
        r.status
      into
        v_attribution_token,
        v_referral_status
      from public.rlg_referrals r
      where r.id = v_referral_id;
    end if;

    return query
    select
      v_lead_id,
      v_referral_id,
      v_attribution_token,
      v_referral_status,
      (v_referral_id is not null),
      true;

    return;
  end if;


  -- ----------------------------------------------------------
  -- Financial attribution is possible only for a resolved
  -- RLG business.
  -- ----------------------------------------------------------

  if p_business_id is not null then

    -- Prefer the exact browser attribution token.
    if p_attribution_token is not null then
      select r.id
      into v_referral_id
      from public.rlg_referrals r
      where r.attribution_token = p_attribution_token
        and r.business_id = p_business_id

        -- The exact attribution token is authoritative for the
        -- immutable driver attribution already stored on the referral.
        -- Do not discard that attribution merely because the driver
        -- cannot be resolved as active at lead-submission time.
        and r.visitor_session_id
              is not distinct from p_visitor_session_id
        and r.status = 'engaged'
        and coalesce(
              r.attribution_expires_at,
              r.created_at + interval '30 days'
            ) > now()
      order by r.created_at desc
      limit 1
      for update;
    end if;


    -- Token may not have reached localStorage before navigation.
    -- Fall back to the same visitor + business + driver.
    if v_referral_id is null
       and p_visitor_session_id is not null
    then
      select r.id
      into v_referral_id
      from public.rlg_referrals r
      where r.business_id = p_business_id
        and r.driver_id is not distinct from p_driver_id
        and r.visitor_session_id = p_visitor_session_id
        and r.status = 'engaged'
        and coalesce(
              r.attribution_expires_at,
              r.created_at + interval '30 days'
            ) > now()
      order by r.created_at desc
      limit 1
      for update;
    end if;


    -- --------------------------------------------------------
    -- Promote engaged referral.
    -- --------------------------------------------------------

    if v_referral_id is not null then
      update public.rlg_referrals
      set
        status = 'qualified',
        conversion_type = 'qualified_lead',
        qualified_at = coalesce(qualified_at, now()),
        metadata =
          metadata ||
          jsonb_strip_nulls(
            jsonb_build_object(
              'qualified_by',
              'lead_submission',
              'submission_token',
              p_submission_token::text
            )
          )
      where id = v_referral_id
      returning
        rlg_referrals.attribution_token,
        rlg_referrals.status
      into
        v_attribution_token,
        v_referral_status;


    -- --------------------------------------------------------
    -- No click is required for a legitimate lead.
    -- Create a direct qualified referral.
    -- --------------------------------------------------------

    else
      insert into public.rlg_referrals (
        business_action_id,
        business_id,
        driver_id,
        driver_slug_snapshot,
        business_slug_snapshot,
        visitor_session_id,
        source,
        medium,
        campaign,
        conversion_type,
        status,
        qualified_at,
        metadata
      )
      values (
        null,
        p_business_id,
        p_driver_id,

        case
          when p_driver_id is not null
            then p_driver_slug
          else null
        end,

        p_business_slug,
        p_visitor_session_id,
        'rider_local_guide',

        case
          when p_driver_id is not null
            then 'driver_qr'
          else 'direct'
        end,

        null,
        'qualified_lead',
        'qualified',
        now(),

        jsonb_strip_nulls(
          jsonb_build_object(
            'qualified_by',
            'direct_lead_submission',
            'submission_token',
            p_submission_token::text
          )
        )
      )
      returning
        id,
        rlg_referrals.attribution_token,
        rlg_referrals.status
      into
        v_referral_id,
        v_attribution_token,
        v_referral_status;
    end if;
  end if;


  -- ----------------------------------------------------------
  -- Persist the durable PII/business lead.
  -- ----------------------------------------------------------

  insert into public.local_discovery_leads (
    submission_token,
    referral_id,

    business_id,
    driver_id,

    driver_slug,
    business_slug,

    city,

    business_name,
    category,

    customer_name,
    customer_phone,
    customer_email,
    message,

    visitor_session_id,

    lead_status,
    conversion_status,

    metadata
  )
  values (
    p_submission_token,
    v_referral_id,

    p_business_id,
    p_driver_id,

    p_driver_slug,
    p_business_slug,

    coalesce(
      nullif(trim(p_city), ''),
      'miami'
    ),

    p_business_name,
    p_category,

    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_message,

    p_visitor_session_id,

    'new',
    'pending',

    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id
  into v_lead_id;


  return query
  select
    v_lead_id,
    v_referral_id,
    v_attribution_token,
    v_referral_status,
    (v_referral_id is not null),
    false;
end;
$function$;


-- RPC is server-only.

revoke all on function public.rlg_submit_qualified_lead(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) from public;

revoke all on function public.rlg_submit_qualified_lead(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) from anon;

revoke all on function public.rlg_submit_qualified_lead(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) from authenticated;

grant execute on function public.rlg_submit_qualified_lead(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) to service_role;


comment on table public.local_discovery_leads is
  'Durable Rider Local Guide rider lead records. PII is server-only. Financial payouts use the RLG ledger tables.';

comment on function public.rlg_submit_qualified_lead(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) is
  'Atomically persists a rider lead and qualifies or creates its RLG referral attribution.';

commit;
