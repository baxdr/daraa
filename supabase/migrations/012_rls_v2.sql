-- درع Phase 1: Row-Level Security (comprehensive)
-- Enforces multi-tenant isolation and role-based access at the database layer.

-- Helper function: check workspace membership with optional role filter.
create or replace function public.is_workspace_member(
  ws_id uuid,
  role_filter text[] default array['owner', 'admin', 'editor', 'viewer']
)
returns boolean as $$
begin
  return exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
    and user_id = auth.uid()
    and role = any(role_filter)
  );
end;
$$ language plpgsql security definer;

-- ============================================================================
-- WORKSPACES
-- ============================================================================

alter table public.workspaces enable row level security;

create policy "workspaces: select for members" on public.workspaces
  for select
  using (public.is_workspace_member(id))
  to authenticated;

create policy "workspaces: insert for any authenticated user (creates own)" on public.workspaces
  for insert
  with check (auth.uid() = owner_user_id)
  to authenticated;

create policy "workspaces: update/delete for owner" on public.workspaces
  for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id)
  to authenticated;

-- ============================================================================
-- WORKSPACE MEMBERS
-- ============================================================================

alter table public.workspace_members enable row level security;

create policy "workspace_members: select for members of same workspace" on public.workspace_members
  for select
  using (public.is_workspace_member(workspace_id))
  to authenticated;

create policy "workspace_members: insert for admin/owner" on public.workspace_members
  for insert
  with check (public.is_workspace_member(workspace_id, array['owner', 'admin']))
  to authenticated;

create policy "workspace_members: delete for owner" on public.workspace_members
  for delete
  using (public.is_workspace_member(workspace_id, array['owner']))
  to authenticated;

-- ============================================================================
-- COMPANIES
-- ============================================================================

alter table public.companies enable row level security;

create policy "companies: select/insert/update for workspace members (editor+)" on public.companies
  for select
  using (public.is_workspace_member(workspace_id, array['owner', 'admin', 'editor']))
  to authenticated;

create policy "companies: insert for workspace members (editor+)" on public.companies
  for insert
  with check (public.is_workspace_member(workspace_id, array['owner', 'admin', 'editor']))
  to authenticated;

create policy "companies: update for workspace members (editor+)" on public.companies
  for update
  using (public.is_workspace_member(workspace_id, array['owner', 'admin', 'editor']))
  with check (public.is_workspace_member(workspace_id, array['owner', 'admin', 'editor']))
  to authenticated;

create policy "companies: delete for owner/admin only" on public.companies
  for delete
  using (public.is_workspace_member(workspace_id, array['owner', 'admin']))
  to authenticated;

-- ============================================================================
-- COMPANY DETAIL TABLES (gated through company membership)
-- ============================================================================

alter table public.company_entities enable row level security;
alter table public.company_roadmap_weeks enable row level security;
alter table public.company_regulatory_updates enable row level security;
alter table public.company_gaps enable row level security;
alter table public.company_analysis enable row level security;
alter table public.company_operational_report enable row level security;
alter table public.company_scan_result enable row level security;
alter table public.renewals enable row level security;

-- All company detail tables use the same pattern: accessible if user is workspace member
-- via the parent company.
create policy "company_entities: select for workspace members" on public.company_entities
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_entities.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "company_entities: write for workspace members (editor+)" on public.company_entities
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_entities.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

-- Apply the same policy pattern to all detail tables (DRY via shared subquery).
create policy "company_roadmap_weeks: select for workspace members" on public.company_roadmap_weeks
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_roadmap_weeks.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "company_roadmap_weeks: write for workspace members (editor+)" on public.company_roadmap_weeks
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_roadmap_weeks.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

create policy "company_regulatory_updates: select for workspace members" on public.company_regulatory_updates
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_regulatory_updates.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "company_regulatory_updates: write for workspace members (editor+)" on public.company_regulatory_updates
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_regulatory_updates.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

create policy "company_gaps: select for workspace members" on public.company_gaps
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_gaps.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "company_gaps: write for workspace members (editor+)" on public.company_gaps
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_gaps.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

create policy "company_analysis: select for workspace members" on public.company_analysis
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_analysis.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "company_analysis: write for workspace members (editor+)" on public.company_analysis
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_analysis.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

create policy "company_operational_report: select for workspace members" on public.company_operational_report
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_operational_report.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "company_operational_report: write for workspace members (editor+)" on public.company_operational_report
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_operational_report.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

create policy "company_scan_result: select for workspace members" on public.company_scan_result
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_scan_result.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "company_scan_result: write for workspace members (editor+)" on public.company_scan_result
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = company_scan_result.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

create policy "renewals: select for workspace members" on public.renewals
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = renewals.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "renewals: write for workspace members (editor+)" on public.renewals
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = renewals.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

-- ============================================================================
-- AGENT TABLES (gated through company)
-- ============================================================================

alter table public.agent_runs enable row level security;
alter table public.agent_activities enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_telemetry enable row level security;

create policy "agent_runs: select for workspace members" on public.agent_runs
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = agent_runs.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "agent_runs: write for workspace members (editor+)" on public.agent_runs
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = agent_runs.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

create policy "agent_activities: select for workspace members" on public.agent_activities
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = agent_activities.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "agent_activities: write for workspace members (editor+)" on public.agent_activities
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = agent_activities.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

create policy "agent_messages: select for workspace members" on public.agent_messages
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = agent_messages.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "agent_messages: write for workspace members (editor+)" on public.agent_messages
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = agent_messages.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

create policy "agent_telemetry: select for workspace members" on public.agent_telemetry
  for select
  using (
    exists (
      select 1 from public.agent_runs ar
      join public.companies c on ar.company_id = c.id
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where ar.id = agent_telemetry.run_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "agent_telemetry: write for workspace members (editor+)" on public.agent_telemetry
  for insert
  with check (
    exists (
      select 1 from public.agent_runs ar
      join public.companies c on ar.company_id = c.id
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where ar.id = agent_telemetry.run_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

-- ============================================================================
-- DOCUMENTS (gated through company)
-- ============================================================================

alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

create policy "documents: select for workspace members" on public.documents
  for select
  using (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = documents.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "documents: write for workspace members (editor+)" on public.documents
  for insert
  with check (
    exists (
      select 1 from public.companies c
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where c.id = documents.company_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

create policy "document_versions: select for workspace members" on public.document_versions
  for select
  using (
    exists (
      select 1 from public.documents d
      join public.companies c on d.company_id = c.id
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where d.id = document_versions.document_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor', 'viewer'])
    )
  )
  to authenticated;

create policy "document_versions: write for workspace members (editor+)" on public.document_versions
  for insert
  with check (
    exists (
      select 1 from public.documents d
      join public.companies c on d.company_id = c.id
      join public.workspace_members wm on c.workspace_id = wm.workspace_id
      where d.id = document_versions.document_id
      and wm.user_id = auth.uid()
      and wm.role = any(array['owner', 'admin', 'editor'])
    )
  )
  to authenticated;

-- ============================================================================
-- KNOWLEDGE_VERSIONS
-- ============================================================================

alter table public.knowledge_versions enable row level security;

create policy "knowledge_versions: select for authenticated users" on public.knowledge_versions
  for select
  using (auth.role() = 'authenticated')
  to authenticated;

-- No insert/update policies; writes via service role only.
