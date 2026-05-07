-- درع Phase 1: Generated Documents with full versioning
-- Stores auto-generated compliance documents (privacy policy, DPO letter, etc.)
-- and their full version history.

create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  kind            text not null,
  title           text not null,
  title_en        text,
  doc             jsonb not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists documents_company_idx on public.documents(company_id);

create trigger documents_updated_at
before update on public.documents
for each row
execute function public.trigger_update_timestamp();

create table if not exists public.document_versions (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references public.documents(id) on delete cascade,
  version         integer not null,
  doc             jsonb not null,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique(document_id, version)
);

create index if not exists document_versions_document_version_idx on public.document_versions(document_id, version desc);
