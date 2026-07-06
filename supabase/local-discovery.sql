create extension if not exists pgcrypto;

create table if not exists public.local_discovery_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  driver_slug text,
  city text default 'miami',
  page_path text,
  visitor_session_id text,
  user_agent text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  category text,
  business_name text,
  click_target_href text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.local_discovery_leads (
  id uuid primary key default gen_random_uuid(),
  lead_status text default 'new',
  conversion_status text default 'pending',
  driver_slug text,
  city text default 'miami',
  business_name text not null,
  category text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  message text,
  visitor_session_id text,
  conversion_value numeric,
  estimated_payout numeric,
  approved_payout numeric,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.local_discovery_events enable row level security;
alter table public.local_discovery_leads enable row level security;

create or replace function public.set_local_discovery_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_local_discovery_leads_updated_at on public.local_discovery_leads;
create trigger set_local_discovery_leads_updated_at
  before update on public.local_discovery_leads
  for each row
  execute function public.set_local_discovery_updated_at();

create index if not exists local_discovery_events_driver_slug_idx
  on public.local_discovery_events (driver_slug);

create index if not exists local_discovery_events_event_type_idx
  on public.local_discovery_events (event_type);

create index if not exists local_discovery_events_created_at_idx
  on public.local_discovery_events (created_at desc);

create index if not exists local_discovery_leads_driver_slug_idx
  on public.local_discovery_leads (driver_slug);

create index if not exists local_discovery_leads_business_name_idx
  on public.local_discovery_leads (business_name);

create index if not exists local_discovery_leads_conversion_status_idx
  on public.local_discovery_leads (conversion_status);

create index if not exists local_discovery_leads_created_at_idx
  on public.local_discovery_leads (created_at desc);
