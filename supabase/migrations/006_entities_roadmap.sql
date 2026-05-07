-- درع Phase 1: Entities, Roadmap, Gaps, and Analysis
-- Detailed project outputs split into focused tables for maintainability.

create table if not exists public.company_entities (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  ord         integer not null,
  entity      jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists company_entities_company_idx on public.company_entities(company_id);

create table if not exists public.company_roadmap_weeks (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  ord         integer not null,
  week        jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists company_roadmap_weeks_company_idx on public.company_roadmap_weeks(company_id);

create table if not exists public.company_regulatory_updates (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  agent       text not null,
  summary_ar  text not null,
  source      text,
  found_at    timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists company_regulatory_updates_company_idx on public.company_regulatory_updates(company_id);

create table if not exists public.company_gaps (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  ord         integer not null,
  gap         jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists company_gaps_company_idx on public.company_gaps(company_id);

create table if not exists public.company_analysis (
  company_id  uuid primary key references public.companies(id) on delete cascade,
  analysis    jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.company_operational_report (
  company_id  uuid primary key references public.companies(id) on delete cascade,
  report      jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.company_scan_result (
  company_id  uuid primary key references public.companies(id) on delete cascade,
  scan        jsonb not null,
  created_at  timestamptz not null default now()
);
