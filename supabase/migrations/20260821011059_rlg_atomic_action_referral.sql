begin;

-- ============================================================
-- RIDER LOCAL GUIDE
-- Patch 2: Atomic business action -> referral attribution
--
-- Qualifying actions:
--   request_info_click
--   offer_click
--
-- Other interactions remain analytics-only.
-- ============================================================

create or replace function public.rlg_record_business_action_with_referral(
  p_business_id uuid,
  p_driver_id uuid,
  p_driver_slug text,
  p_business_slug text,
  p_business_name text,
  p_category text,
  p_action_type text,
  p_page_path text,
  p_visitor_session_id text,
  p_metadata jsonb
)
returns table (
  action_id uuid,
  referral_id uuid,
  attribution_token uuid
)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_action_id uuid;
  v_referral_id uuid;
  v_attribution_token uuid;
begin
  -- Defense in depth: the API validates this too.
  if p_action_type is null
     or p_action_type not in (
       'business_click',
       'business_view',
       'call_click',
       'directions_click',
       'website_click',
       'request_info_click',
       'offer_click',
       'save_click'
     )
  then
    raise exception 'Invalid business action type: %', p_action_type
      using errcode = '22023';
  end if;

  insert into public.business_actions (
    business_id,
    driver_id,
    driver_slug,
    business_slug,
    business_name,
    category,
    action_type,
    page_path,
    metadata
  )
  values (
    p_business_id,
    p_driver_id,
    p_driver_slug,
    p_business_slug,
    p_business_name,
    p_category,
    p_action_type,
    p_page_path,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_action_id;

  -- High-intent actions create ENGAGED attribution records.
  --
  -- They are not qualified conversions yet. Qualification occurs only
  -- after a real lead, booking, reservation, or transaction is confirmed.
  --
  -- A valid RLG business is required. Driver attribution is optional:
  -- direct/non-driver traffic can still create a business referral.
  if p_business_id is not null
     and p_action_type in (
       'request_info_click',
       'offer_click'
     )
  then
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
      metadata
    )
    values (
      v_action_id,
      p_business_id,
      p_driver_id,

      case
        when p_driver_id is not null then p_driver_slug
        else null
      end,

      p_business_slug,
      p_visitor_session_id,

      'rider_local_guide',

      case
        when p_driver_id is not null then 'driver_qr'
        else 'direct'
      end,

      null,
      null,
      'engaged',

      jsonb_strip_nulls(
        jsonb_build_object(
          'trigger_action_type', p_action_type,
          'page_path', p_page_path,
          'category', p_category
        )
      )
    )
    returning
      id,
      rlg_referrals.attribution_token
    into
      v_referral_id,
      v_attribution_token;
  end if;

  return query
  select
    v_action_id,
    v_referral_id,
    v_attribution_token;
end;
$function$;


-- The RPC is server-only.
revoke all on function public.rlg_record_business_action_with_referral(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) from public;

revoke all on function public.rlg_record_business_action_with_referral(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) from anon;

revoke all on function public.rlg_record_business_action_with_referral(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) from authenticated;

grant execute on function public.rlg_record_business_action_with_referral(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) to service_role;

comment on function public.rlg_record_business_action_with_referral(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) is
  'Atomically records an RLG business action and creates a referral for qualifying high-intent actions.';

commit;
