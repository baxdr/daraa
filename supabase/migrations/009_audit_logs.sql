-- درع Phase 1: Immutable audit log
-- All writes, no deletes. Tracks who did what when for compliance audits.
-- RLS enforces INSERT-only (no UPDATE/DELETE for regular users).

create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id   uuid references auth.users(id) on delete set null,
  action          text not null,
  target_type     text,
  target_id       uuid,
  payload         jsonb,
  ip              text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

create index if not exists audit_logs_workspace_created_idx on public.audit_logs(workspace_id, created_at desc);

-- Immutability enforcement: no modifications except INSERT and SELECT.
-- Service role bypasses RLS by design; policy forbids all mutations for app users.
alter table public.audit_logs enable row level security;

create policy "audit_logs: append only for authenticated" on public.audit_logs
  for insert
  with check (auth.role() = 'authenticated')
  to authenticated;

create policy "audit_logs: select for workspace members" on public.audit_logs
  for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = audit_logs.workspace_id
      and wm.user_id = auth.uid()
    )
  )
  to authenticated;

comment on table public.audit_logs is 'Immutable audit trail. No UPDATE/DELETE for security. Service role can write; app users can only INSERT via middleware.';
