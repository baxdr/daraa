-- Row-Level Security policies.
-- Rule: signed-in users see rows they own (user_id = auth.uid()).
-- Anonymous "free scan" rows (session_id set, user_id null) are readable by
-- the anon role only when the matching session_id is presented as a PostgREST
-- filter AND written by the service role. This is enforced by the server code
-- treating the session_id as an opaque bearer token.

alter table public.companies      enable row level security;
alter table public.scans          enable row level security;
alter table public.documents      enable row level security;
alter table public.agent_activity enable row level security;

-- Authenticated users: full access to their own rows.
create policy "companies: own rows" on public.companies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "scans: own rows" on public.scans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "documents: own rows" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "agent_activity: via own scans" on public.agent_activity
  for select using (
    exists (select 1 from public.scans s where s.id = agent_activity.scan_id and s.user_id = auth.uid())
  );

-- All write paths go through the server using the service-role key, which
-- bypasses RLS by design. No public insert/update policies are granted.
