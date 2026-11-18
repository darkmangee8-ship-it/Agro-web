-- AgroVision AI normalized production schema.
-- The Make Edge Function currently uses the managed KV table for immediate runtime
-- compatibility. Apply this migration before moving service repositories to tables.
create extension if not exists pgcrypto;

create type public.app_role as enum ('farmer', 'adviser', 'admin');
create type public.evidence_status as enum ('farmer_reported', 'document_supported', 'externally_verified', 'unverified');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'farmer',
  state text,
  lga text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  state text not null,
  lga text not null,
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  size_hectares numeric(12,3) check (size_hectares >= 0),
  crops text[] not null default '{}',
  soil_type text,
  irrigation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index farms_owner_idx on public.farms(owner_id);

create table public.farm_activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete cascade,
  activity_type text not null,
  activity_date date not null,
  crop text,
  quantity numeric(14,3),
  unit text,
  notes text,
  created_at timestamptz not null default now()
);
create index activities_owner_date_idx on public.farm_activities(owner_id, activity_date desc);

create table public.financial_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete set null,
  record_type text not null check (record_type in ('sale', 'expense', 'repayment', 'obligation')),
  amount numeric(16,2) not null check (amount >= 0),
  currency char(3) not null default 'NGN',
  record_date date not null,
  category text,
  evidence_status public.evidence_status not null default 'farmer_reported',
  created_at timestamptz not null default now()
);
create index financial_owner_date_idx on public.financial_records(owner_id, record_date desc);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  purpose text not null,
  granted boolean not null,
  policy_version text not null,
  recorded_at timestamptz not null default now()
);

create table public.credit_assessments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  assessment_kind text not null default 'financial_readiness',
  completeness numeric(5,2) check (completeness between 0 and 100),
  indicators jsonb not null default '{}',
  factors jsonb not null default '[]',
  model_version text,
  model_validated boolean not null default false,
  limitations text not null,
  created_at timestamptz not null default now()
);

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  geography text,
  license text,
  verified_at timestamptz,
  active boolean not null default true
);

create table public.market_prices (
  id uuid primary key default gen_random_uuid(),
  commodity text not null,
  variety text,
  market_name text not null,
  state text,
  price numeric(16,2) not null check (price > 0),
  currency char(3) not null default 'NGN',
  normalized_unit text not null,
  original_unit text not null,
  price_class text,
  observed_on date not null,
  source_id uuid not null references public.data_sources(id),
  evidence_status public.evidence_status not null default 'unverified',
  imported_at timestamptz not null default now(),
  unique (commodity, market_name, price, original_unit, observed_on, source_id)
);
create index market_search_idx on public.market_prices(commodity, state, observed_on desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  stable_key text not null,
  title text not null,
  message text not null,
  severity text not null default 'info',
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(owner_id, stable_key)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farm_activities enable row level security;
alter table public.financial_records enable row level security;
alter table public.consent_records enable row level security;
alter table public.credit_assessments enable row level security;
alter table public.market_prices enable row level security;
alter table public.data_sources enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_events enable row level security;

create policy "profile owner read" on public.profiles for select using (auth.uid() = id);
create policy "profile owner update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from public.profiles p where p.id = auth.uid()));
create policy "owner farms" on public.farms for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner activities" on public.farm_activities for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner financial" on public.financial_records for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner consents" on public.consent_records for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner assessments read" on public.credit_assessments for select using (auth.uid() = owner_id);
create policy "authenticated market read" on public.market_prices for select to authenticated using (true);
create policy "authenticated source read" on public.data_sources for select to authenticated using (true);
create policy "owner notifications" on public.notifications for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
