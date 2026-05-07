-- درع Phase 1: Workspaces and membership
-- Multi-tenant collaboration: each user owns workspaces; each workspace has members with roles.

create table if not exists public.workspaces (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  slug          text not null,
  name_ar       text not null,
  created_at    timestamptz not null default now(),
  unique(slug)
);

create index if not exists workspaces_owner_idx on public.workspaces(owner_user_id);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'editor',
  joined_at    timestamptz not null default now(),
  primary key (workspace_id, user_id),
  constraint role_check check (role in ('owner', 'admin', 'editor', 'viewer'))
);

create index if not exists workspace_members_user_idx on public.workspace_members(user_id);
