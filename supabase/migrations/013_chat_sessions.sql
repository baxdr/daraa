-- درع Phase 3: Chat sessions table
-- Tracks conversation state as users progress through interview questions.
-- TTL can be managed via Supabase edge functions or cron jobs (not enforced here).

create table if not exists public.chat_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,
  session_data      jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists chat_sessions_user_idx on public.chat_sessions(user_id);
create index if not exists chat_sessions_created_desc_idx on public.chat_sessions(created_at desc);

-- Auto-update updated_at on change
create trigger chat_sessions_updated_at
before update on public.chat_sessions
for each row
execute function public.trigger_update_timestamp();

-- RLS: authenticated users can only access their own sessions
alter table public.chat_sessions enable row level security;

create policy "chat_sessions: select own session" on public.chat_sessions
  for select
  using (auth.uid() = user_id or user_id is null)
  to authenticated;

create policy "chat_sessions: insert own session" on public.chat_sessions
  for insert
  with check (auth.uid() = user_id or user_id is null)
  to authenticated;

create policy "chat_sessions: update own session" on public.chat_sessions
  for update
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null)
  to authenticated;

create policy "chat_sessions: delete own session" on public.chat_sessions
  for delete
  using (auth.uid() = user_id or user_id is null)
  to authenticated;
