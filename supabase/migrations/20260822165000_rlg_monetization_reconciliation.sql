begin;

-- ============================================================
-- RIDER LOCAL GUIDE
-- Patch 5: Monetization Reconciliation + Operational Safety
--
-- Purpose:
--   1. Recover qualified leads whose monetization capture failed.
--   2. Recover pending monetization events whose accounting failed.
--   3. Persist retry/attention state without mutating immutable
--      event-time economics from Patch 4.
--   4. Prevent overlapping reconciliation workers.
--   5. Schedule automatic database-native reconciliation.
--
-- NO STRIPE PAYMENT MOVEMENT OCCURS IN THIS PATCH.
-- PATCHES 1-4 ACCOUNTING / ATTRIBUTION FUNCTIONS ARE NOT REPLACED.
-- ============================================================


-- ============================================================
-- 1. DURABLE RECONCILIATION RUN HISTORY
-- ============================================================

create table public.rlg_monetization_reconciliation_runs (
  id uuid primary key default gen_random_uuid(),

  status text not null
    check (
      status in (
        'running',
        'completed',
        'completed_with_errors',
        'lock_busy'
      )
    ),

  capture_candidates integer not null default 0
    check (capture_candidates >= 0),

  capture_resolved integer not null default 0
    check (capture_resolved >= 0),

  process_candidates integer not null default 0
    check (process_candidates >= 0),

  process_resolved integer not null default 0
    check (process_resolved >= 0),

  failures integer not null default 0
    check (failures >= 0),

  attention_count integer not null default 0
    check (attention_count >= 0),

  started_at timestamptz not null default now(),
  finished_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  check (
    status = 'running'
    or finished_at is not null
  )
);

create index rlg_monetization_reconciliation_runs_started_idx
on public.rlg_monetization_reconciliation_runs (
  started_at desc
);

alter table public.rlg_monetization_reconciliation_runs
  enable row level security;

revoke all
on table public.rlg_monetization_reconciliation_runs
from public;

revoke all
on table public.rlg_monetization_reconciliation_runs
from anon;

revoke all
on table public.rlg_monetization_reconciliation_runs
from authenticated;

grant all
on table public.rlg_monetization_reconciliation_runs
to service_role;


-- ============================================================
-- 2. DURABLE SUBJECT RETRY / ATTENTION STATE
--
-- This table is intentionally separate from rlg_monetization_events.
-- Patch 4 event-time economics remain immutable.
-- ============================================================

create table public.rlg_monetization_reconciliation_state (
  subject_type text not null
    check (
      subject_type in (
        'qualified_lead_capture',
        'monetization_event_process'
      )
    ),

  subject_id uuid not null,

  lead_id uuid
    references public.local_discovery_leads(id)
    on update cascade
    on delete restrict,

  event_id uuid
    references public.rlg_monetization_events(id)
    on update cascade
    on delete restrict,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'resolved',
        'attention'
      )
    ),

  attempt_count integer not null default 0
    check (attempt_count >= 0),

  consecutive_failures integer not null default 0
    check (consecutive_failures >= 0),

  requires_attention boolean not null default false,

  first_seen_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  next_attempt_at timestamptz,

  last_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (
    subject_type,
    subject_id
  ),

  check (
    (
      subject_type = 'qualified_lead_capture'
      and lead_id = subject_id
      and event_id is null
    )
    or
    (
      subject_type = 'monetization_event_process'
      and event_id = subject_id
    )
  ),

  check (
    not requires_attention
    or status = 'attention'
  ),

  check (
    status <> 'resolved'
    or consecutive_failures = 0
  )
);

create index rlg_monetization_reconciliation_state_due_idx
on public.rlg_monetization_reconciliation_state (
  requires_attention,
  next_attempt_at,
  subject_type
)
where status <> 'resolved';

create index rlg_monetization_reconciliation_state_lead_idx
on public.rlg_monetization_reconciliation_state (lead_id)
where lead_id is not null;

create index rlg_monetization_reconciliation_state_event_idx
on public.rlg_monetization_reconciliation_state (event_id)
where event_id is not null;

alter table public.rlg_monetization_reconciliation_state
  enable row level security;

revoke all
on table public.rlg_monetization_reconciliation_state
from public;

revoke all
on table public.rlg_monetization_reconciliation_state
from anon;

revoke all
on table public.rlg_monetization_reconciliation_state
from authenticated;

grant all
on table public.rlg_monetization_reconciliation_state
to service_role;


-- ============================================================
-- 3. OPERATOR ATTENTION VIEW
--
-- Server-only visibility into subjects that exhausted automatic
-- retries and now require an operator decision / data correction.
-- ============================================================

create view public.rlg_monetization_reconciliation_attention
with (security_invoker = true)
as
select
  s.subject_type,
  s.subject_id,
  s.lead_id,
  s.event_id,
  s.attempt_count,
  s.consecutive_failures,
  s.last_attempt_at,
  s.last_failure_at,
  s.last_error,
  s.first_seen_at,
  s.updated_at
from public.rlg_monetization_reconciliation_state s
where s.requires_attention = true;

revoke all
on table public.rlg_monetization_reconciliation_attention
from public;

revoke all
on table public.rlg_monetization_reconciliation_attention
from anon;

revoke all
on table public.rlg_monetization_reconciliation_attention
from authenticated;

grant select
on table public.rlg_monetization_reconciliation_attention
to service_role;


-- ============================================================
-- 4. RECONCILIATION WORKER
--
-- The worker intentionally reuses Patch 4's idempotent functions:
--   rlg_capture_qualified_lead_monetization_event(uuid)
--   rlg_process_monetization_event(uuid)
--
-- It does not recreate or change their accounting logic.
-- ============================================================

create or replace function public.rlg_reconcile_monetization(
  p_batch_size integer default 50,
  p_attention_after integer default 3,
  p_retry_attention boolean default false
)
returns table (
  run_id uuid,
  run_status text,
  capture_candidates integer,
  capture_resolved integer,
  process_candidates integer,
  process_resolved integer,
  failures integer,
  attention_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_run_id uuid;
  v_locked boolean;

  v_capture_candidates integer := 0;
  v_capture_resolved integer := 0;
  v_process_candidates integer := 0;
  v_process_resolved integer := 0;
  v_failures integer := 0;
  v_attention_count integer := 0;

  v_candidate record;

  v_event_id uuid;
  v_event_status text;
  v_decision_code text;

  v_processed_event_id uuid;
  v_processed_status text;

  v_error text;
  v_failure_count integer;
  v_requires_attention boolean;

  v_run_status text := 'running';
begin
  if p_batch_size is null
     or p_batch_size < 1
     or p_batch_size > 500
  then
    raise exception
      'p_batch_size must be between 1 and 500'
      using errcode = '22023';
  end if;

  if p_attention_after is null
     or p_attention_after < 1
     or p_attention_after > 20
  then
    raise exception
      'p_attention_after must be between 1 and 20'
      using errcode = '22023';
  end if;

  insert into public.rlg_monetization_reconciliation_runs (
    status,
    metadata
  )
  values (
    'running',
    jsonb_build_object(
      'batch_size', p_batch_size,
      'attention_after', p_attention_after,
      'retry_attention', p_retry_attention
    )
  )
  returning id
  into v_run_id;

  -- One reconciliation worker at a time. Patch 4 remains safe under
  -- replay as well, but the lock prevents duplicate operational work.
  v_locked := pg_try_advisory_xact_lock(
    hashtextextended(
      'rlg_monetization_reconciliation_v1',
      0
    )
  );

  if not v_locked then
    update public.rlg_monetization_reconciliation_runs
    set
      status = 'lock_busy',
      finished_at = now()
    where id = v_run_id;

    return query
    select
      v_run_id,
      'lock_busy'::text,
      0,
      0,
      0,
      0,
      0,
      (
        select count(*)::integer
        from public.rlg_monetization_reconciliation_state
        where requires_attention = true
      );

    return;
  end if;

  -- ----------------------------------------------------------
  -- A. CAPTURE QUALIFIED LEADS THAT HAVE NO MONETIZATION EVENT
  -- ----------------------------------------------------------

  for v_candidate in
    select
      l.id as lead_id
    from public.local_discovery_leads l
    join public.rlg_referrals r
      on r.id = l.referral_id
    left join public.rlg_monetization_events e
      on e.source_type = 'qualified_lead'
     and e.source_id = l.id
    left join public.rlg_monetization_reconciliation_state s
      on s.subject_type = 'qualified_lead_capture'
     and s.subject_id = l.id
    where l.business_id is not null
      and l.referral_id is not null
      and r.status = 'qualified'
      and r.conversion_type = 'qualified_lead'
      and e.id is null
      and (
        p_retry_attention
        or coalesce(s.requires_attention, false) = false
      )
      and (
        s.next_attempt_at is null
        or s.next_attempt_at <= now()
      )
    order by l.created_at asc, l.id asc
    limit p_batch_size
  loop
    v_capture_candidates := v_capture_candidates + 1;

    begin
      v_event_id := null;
      v_event_status := null;
      v_decision_code := null;

      select
        c.event_id,
        c.event_status,
        c.decision_code
      into
        v_event_id,
        v_event_status,
        v_decision_code
      from public.rlg_capture_qualified_lead_monetization_event(
        v_candidate.lead_id
      ) c
      limit 1;

      if v_event_id is null then
        raise exception
          'Qualified lead capture returned no durable event (decision=%)',
          coalesce(v_decision_code, 'unknown');
      end if;

      insert into public.rlg_monetization_reconciliation_state as target (
        subject_type,
        subject_id,
        lead_id,
        status,
        attempt_count,
        consecutive_failures,
        requires_attention,
        last_attempt_at,
        last_success_at,
        next_attempt_at,
        last_error,
        updated_at
      )
      values (
        'qualified_lead_capture',
        v_candidate.lead_id,
        v_candidate.lead_id,
        'resolved',
        1,
        0,
        false,
        now(),
        now(),
        null,
        null,
        now()
      )
      on conflict (
        subject_type,
        subject_id
      )
      do update
      set
        status = 'resolved',
        attempt_count = target.attempt_count + 1,
        consecutive_failures = 0,
        requires_attention = false,
        last_attempt_at = now(),
        last_success_at = now(),
        next_attempt_at = null,
        last_error = null,
        updated_at = now();

      v_capture_resolved := v_capture_resolved + 1;

    exception
      when others then
        get stacked diagnostics
          v_error = message_text;

        insert into public.rlg_monetization_reconciliation_state as target (
          subject_type,
          subject_id,
          lead_id,
          status,
          attempt_count,
          consecutive_failures,
          requires_attention,
          last_attempt_at,
          last_failure_at,
          next_attempt_at,
          last_error,
          updated_at
        )
        values (
          'qualified_lead_capture',
          v_candidate.lead_id,
          v_candidate.lead_id,
          case
            when p_attention_after <= 1
              then 'attention'
            else 'pending'
          end,
          1,
          1,
          p_attention_after <= 1,
          now(),
          now(),
          case
            when p_attention_after <= 1
              then null
            else now() + interval '5 minutes'
          end,
          left(v_error, 4000),
          now()
        )
        on conflict (
          subject_type,
          subject_id
        )
        do update
        set
          attempt_count = target.attempt_count + 1,
          consecutive_failures = target.consecutive_failures + 1,
          requires_attention =
            (target.consecutive_failures + 1) >= p_attention_after,
          status =
            case
              when (target.consecutive_failures + 1) >= p_attention_after
                then 'attention'
              else 'pending'
            end,
          last_attempt_at = now(),
          last_failure_at = now(),
          next_attempt_at =
            case
              when (target.consecutive_failures + 1) >= p_attention_after
                then null
              else now() + interval '5 minutes'
            end,
          last_error = left(v_error, 4000),
          updated_at = now()
        returning
          consecutive_failures,
          requires_attention
        into
          v_failure_count,
          v_requires_attention;

        v_failures := v_failures + 1;

        if v_requires_attention then
          raise warning
            'RLG reconciliation attention required: subject_type=qualified_lead_capture subject_id=% failures=% error=%',
            v_candidate.lead_id,
            v_failure_count,
            left(v_error, 500);
        end if;
    end;
  end loop;

  -- ----------------------------------------------------------
  -- B. PROCESS PENDING MONETIZATION EVENTS
  --
  -- This includes events captured by the request path and events
  -- recovered immediately above in the same reconciliation run.
  -- ----------------------------------------------------------

  for v_candidate in
    select
      e.id as event_id,
      e.lead_id
    from public.rlg_monetization_events e
    left join public.rlg_monetization_reconciliation_state s
      on s.subject_type = 'monetization_event_process'
     and s.subject_id = e.id
    where e.status = 'pending'
      and (
        p_retry_attention
        or coalesce(s.requires_attention, false) = false
      )
      and (
        s.next_attempt_at is null
        or s.next_attempt_at <= now()
      )
    order by e.occurred_at asc, e.id asc
    limit p_batch_size
  loop
    v_process_candidates := v_process_candidates + 1;

    begin
      v_processed_event_id := null;
      v_processed_status := null;

      select
        p.event_id,
        p.event_status
      into
        v_processed_event_id,
        v_processed_status
      from public.rlg_process_monetization_event(
        v_candidate.event_id
      ) p
      limit 1;

      if v_processed_event_id is null
         or v_processed_status <> 'processed'
      then
        raise exception
          'Pending monetization event did not reach processed status (status=%)',
          coalesce(v_processed_status, 'unknown');
      end if;

      insert into public.rlg_monetization_reconciliation_state as target (
        subject_type,
        subject_id,
        lead_id,
        event_id,
        status,
        attempt_count,
        consecutive_failures,
        requires_attention,
        last_attempt_at,
        last_success_at,
        next_attempt_at,
        last_error,
        updated_at
      )
      values (
        'monetization_event_process',
        v_candidate.event_id,
        v_candidate.lead_id,
        v_candidate.event_id,
        'resolved',
        1,
        0,
        false,
        now(),
        now(),
        null,
        null,
        now()
      )
      on conflict (
        subject_type,
        subject_id
      )
      do update
      set
        lead_id = excluded.lead_id,
        event_id = excluded.event_id,
        status = 'resolved',
        attempt_count = target.attempt_count + 1,
        consecutive_failures = 0,
        requires_attention = false,
        last_attempt_at = now(),
        last_success_at = now(),
        next_attempt_at = null,
        last_error = null,
        updated_at = now();

      v_process_resolved := v_process_resolved + 1;

    exception
      when others then
        get stacked diagnostics
          v_error = message_text;

        insert into public.rlg_monetization_reconciliation_state as target (
          subject_type,
          subject_id,
          lead_id,
          event_id,
          status,
          attempt_count,
          consecutive_failures,
          requires_attention,
          last_attempt_at,
          last_failure_at,
          next_attempt_at,
          last_error,
          updated_at
        )
        values (
          'monetization_event_process',
          v_candidate.event_id,
          v_candidate.lead_id,
          v_candidate.event_id,
          case
            when p_attention_after <= 1
              then 'attention'
            else 'pending'
          end,
          1,
          1,
          p_attention_after <= 1,
          now(),
          now(),
          case
            when p_attention_after <= 1
              then null
            else now() + interval '5 minutes'
          end,
          left(v_error, 4000),
          now()
        )
        on conflict (
          subject_type,
          subject_id
        )
        do update
        set
          lead_id = excluded.lead_id,
          event_id = excluded.event_id,
          attempt_count = target.attempt_count + 1,
          consecutive_failures = target.consecutive_failures + 1,
          requires_attention =
            (target.consecutive_failures + 1) >= p_attention_after,
          status =
            case
              when (target.consecutive_failures + 1) >= p_attention_after
                then 'attention'
              else 'pending'
            end,
          last_attempt_at = now(),
          last_failure_at = now(),
          next_attempt_at =
            case
              when (target.consecutive_failures + 1) >= p_attention_after
                then null
              else now() + interval '5 minutes'
            end,
          last_error = left(v_error, 4000),
          updated_at = now()
        returning
          consecutive_failures,
          requires_attention
        into
          v_failure_count,
          v_requires_attention;

        v_failures := v_failures + 1;

        if v_requires_attention then
          raise warning
            'RLG reconciliation attention required: subject_type=monetization_event_process subject_id=% failures=% error=%',
            v_candidate.event_id,
            v_failure_count,
            left(v_error, 500);
        end if;
    end;
  end loop;

  select count(*)::integer
  into v_attention_count
  from public.rlg_monetization_reconciliation_state
  where requires_attention = true;

  v_run_status :=
    case
      when v_failures > 0
        then 'completed_with_errors'
      else 'completed'
    end;

  update public.rlg_monetization_reconciliation_runs
  set
    status = v_run_status,
    capture_candidates = v_capture_candidates,
    capture_resolved = v_capture_resolved,
    process_candidates = v_process_candidates,
    process_resolved = v_process_resolved,
    failures = v_failures,
    attention_count = v_attention_count,
    finished_at = now()
  where id = v_run_id;

  return query
  select
    v_run_id,
    v_run_status,
    v_capture_candidates,
    v_capture_resolved,
    v_process_candidates,
    v_process_resolved,
    v_failures,
    v_attention_count;
end;
$function$;


-- ============================================================
-- 5. SERVER-ONLY EXECUTION
-- ============================================================

revoke all
on function public.rlg_reconcile_monetization(integer, integer, boolean)
from public;

revoke all
on function public.rlg_reconcile_monetization(integer, integer, boolean)
from anon;

revoke all
on function public.rlg_reconcile_monetization(integer, integer, boolean)
from authenticated;

grant execute
on function public.rlg_reconcile_monetization(integer, integer, boolean)
to service_role;

comment on table public.rlg_monetization_reconciliation_runs is
  'RLG monetization reconciliation worker run history and summary counters.';

comment on table public.rlg_monetization_reconciliation_state is
  'Durable retry and operator-attention state for missing monetization capture and pending accounting processing.';

comment on function public.rlg_reconcile_monetization(integer, integer, boolean) is
  'Idempotently recovers qualified leads without monetization events and pending monetization events without duplicating Patch 4 accounting.';


-- ============================================================
-- 6. AUTOMATIC DATABASE-NATIVE SCHEDULER
--
-- Supabase Cron / pg_cron executes the database worker directly.
-- No service-role key is stored in a cron payload and no HTTP call is
-- required. The same named job is updated if this migration is replayed.
-- ============================================================

create extension if not exists pg_cron;

select cron.schedule(
  'rlg-monetization-reconciliation-v1',
  '*/5 * * * *',
  $cron$
    select public.rlg_reconcile_monetization(
      50,
      3,
      false
    );
  $cron$
);

commit;
