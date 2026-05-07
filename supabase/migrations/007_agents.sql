-- درع Phase 1: Agent runtime tables
-- Tracks agent runs, activities (timeline events), inter-agent messages, and telemetry.

create table if not exists public.agent_runs (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  agent           text not null,
  status          text not null,
  wave            integer,
  started_at      timestamptz,
  completed_at    timestamptz,
  duration_ms     integer,
  cost_usd        numeric(8, 6),
  model           text,
  error_message   text,
  created_at      timestamptz not null default now(),

  constraint status_check check (status in ('pending', 'running', 'complete', 'blocked', 'error'))
);

create index if not exists agent_runs_company_idx on public.agent_runs(company_id);
create index if not exists agent_runs_status_idx on public.agent_runs(status);

create table if not exists public.agent_activities (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  agent           text not null,
  agent_ar        text not null,
  status          text not null,
  message_ar      text,
  seq             integer not null,
  created_at      timestamptz not null default now()
);

create index if not exists agent_activities_company_seq_idx on public.agent_activities(company_id, seq);

create table if not exists public.agent_messages (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  from_agent      text not null,
  to_agent        text not null,
  type            text not null,
  message_ar      text,
  payload         jsonb,
  seq             integer not null,
  created_at      timestamptz not null default now()
);

create index if not exists agent_messages_company_seq_idx on public.agent_messages(company_id, seq);

create table if not exists public.agent_telemetry (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid references public.agent_runs(id) on delete cascade,
  tokens_in       integer,
  tokens_out      integer,
  cost_usd        numeric(8, 6),
  duration_ms     integer,
  model           text,
  message_count   integer,
  created_at      timestamptz not null default now()
);

create index if not exists agent_telemetry_run_idx on public.agent_telemetry(run_id);
