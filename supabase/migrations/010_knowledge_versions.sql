-- درع Phase 1: Knowledge Base versioning
-- Tracks snapshots of regulatory content (PDPL, NCA-ECC, verticals, etc.)
-- Enables change detection and knowledge refresh workflows.

create table if not exists public.knowledge_versions (
  id              uuid primary key default gen_random_uuid(),
  namespace       text not null,
  version         integer not null,
  payload         jsonb not null,
  content_hash    text,
  created_at      timestamptz not null default now(),
  unique(namespace, version)
);

create index if not exists knowledge_versions_namespace_version_idx on public.knowledge_versions(namespace, version desc);

comment on table public.knowledge_versions is 'Immutable snapshots of regulatory content. Examples: namespace=''pdpl'', namespace=''verticals'', namespace=''nca-ecc''. Phase 1 loads verticals via seed; later phases expand PDPL and add NCA-ECC.';
