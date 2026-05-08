-- درع — minimal serverless-friendly persistence (single migration to apply).
--
-- The earlier 14 migrations model a full multi-tenant workspace schema that
-- is unsuitable for the anonymous /chat flow this MVP ships. This migration
-- adds two thin "blob" tables that store ChatSession / ProjectRecord as
-- jsonb. All access goes through the Next.js service-role client; RLS is
-- disabled because the API server is the only writer/reader.
--
-- Safe to run repeatedly: every statement is `if not exists`.

create table if not exists public.daraa_chat_sessions (
  id          text primary key,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists daraa_chat_sessions_created_idx
  on public.daraa_chat_sessions (created_at desc);

create table if not exists public.daraa_projects (
  id              text primary key,
  data            jsonb not null,
  email           text,
  owner_user_id   uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists daraa_projects_email_idx
  on public.daraa_projects (lower(email)) where email is not null;
create index if not exists daraa_projects_owner_idx
  on public.daraa_projects (owner_user_id) where owner_user_id is not null;
create index if not exists daraa_projects_created_idx
  on public.daraa_projects (created_at desc);

-- RLS off: server-side service-role client is the only caller.
alter table public.daraa_chat_sessions disable row level security;
alter table public.daraa_projects disable row level security;
