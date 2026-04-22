-- درع — Initial schema
-- See DESIGN.md §5 for the rationale. All tables include user_id for
-- multi-tenancy; RLS is enabled in 002_rls.sql.

create extension if not exists "uuid-ossp";

create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  session_id    text,
  name          text not null,
  name_ar       text,
  website_url   text not null,
  company_type  text not null check (company_type in ('saas','ecommerce','fintech','services','other')),
  employee_count integer,
  user_count    integer,
  has_government_clients boolean not null default false,
  storage_location text,
  created_at    timestamptz not null default now()
);
create index if not exists companies_user_idx    on public.companies(user_id);
create index if not exists companies_session_idx on public.companies(session_id);

create table if not exists public.scans (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references public.companies(id) on delete cascade,
  user_id             uuid references auth.users(id) on delete cascade,
  session_id          text,
  scan_type           text not null check (scan_type in ('external','full')),
  status              text not null check (status in ('pending','scanning','analyzing','generating_docs','complete','error')),
  scan_results        jsonb,
  compliance_score    integer check (compliance_score between 0 and 100),
  total_fine_risk_sar bigint,
  gaps                jsonb,
  compliant_items     jsonb,
  remediation_plan    jsonb,
  error_message       text,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);
create index if not exists scans_company_idx on public.scans(company_id);
create index if not exists scans_status_idx  on public.scans(status);

create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  scan_id      uuid references public.scans(id) on delete cascade,
  company_id   uuid references public.companies(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  doc_type     text not null check (doc_type in (
    'privacy_policy','dpo_appointment','processing_register','incident_response','consent_form'
  )),
  doc_name     text not null,
  doc_name_ar  text not null,
  storage_path text,
  content      text,
  created_at   timestamptz not null default now()
);
create index if not exists documents_scan_idx on public.documents(scan_id);

create table if not exists public.agent_activity (
  id            uuid primary key default gen_random_uuid(),
  scan_id       uuid references public.scans(id) on delete cascade,
  agent_name    text not null check (agent_name in ('scan','regulatory','analysis','document','orchestrator')),
  agent_name_ar text not null,
  status        text not null check (status in ('started','working','completed','error')),
  message       text,
  message_ar    text,
  details       jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists agent_activity_scan_idx on public.agent_activity(scan_id, created_at);

-- Enable realtime — the UI subscribes to this table per scan_id.
alter publication supabase_realtime add table public.agent_activity;
