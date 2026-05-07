-- درع Phase 1: Companies table
-- Central persistence for ProjectRecord. Mirrors all runtime fields as closely as SQL allows.
-- Each company belongs to a workspace and has an optional owner (for email-claim workflow).

create table if not exists public.companies (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid not null references public.workspaces(id) on delete cascade,
  owner_user_id           uuid references auth.users(id) on delete set null,
  email                   text,

  -- Mode and lifecycle
  mode                    text not null,
  status                  text not null,
  phase                   text not null,

  constraint mode_check     check (mode in ('establishment', 'compliance', 'operational_compliance')),
  constraint status_check   check (status in ('pending', 'running', 'complete', 'error')),
  constraint phase_check    check (phase in ('roadmap', 'active_monitoring')),

  -- Company profile
  company_name            text not null,
  vertical                text not null,
  city_id                 text,
  url                     text,

  -- Chat answers blob (Answers type from chat-flow.ts)
  answers                 jsonb not null default '{}',

  -- Cost summary (CostSummary: minSar, maxSar, itemCount)
  cost_min_sar            integer default 0,
  cost_max_sar            integer default 0,
  cost_item_count         integer default 0,

  -- Compliance outputs (nullable, set during analysis)
  top_warnings            jsonb,
  compliance_score        integer,
  total_fine_ceiling_sar  bigint,
  error_message           text,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists companies_workspace_idx on public.companies(workspace_id);
create index if not exists companies_owner_idx on public.companies(owner_user_id);
create index if not exists companies_email_idx on public.companies(email);
create index if not exists companies_created_desc_idx on public.companies(created_at desc);

-- Auto-bump updated_at on every change.
create or replace function public.trigger_update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at
before update on public.companies
for each row
execute function public.trigger_update_timestamp();
