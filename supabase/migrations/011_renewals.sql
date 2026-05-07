-- درع Phase 1: Cached renewal tracker per company
-- Derived data: computed from entities and stored for fast queries.
-- The renewal dates are calculated from entity issue dates; this table
-- caches the "next due" state for the UI.

create table if not exists public.renewals (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  entity_id         text not null,
  name_simple_ar    text not null,
  period_ar         text,
  next_due_at       timestamptz,
  days_remaining    integer,
  urgency           text,
  official_url      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint urgency_check check (urgency in ('ok', 'notice', 'soon', 'urgent', 'overdue'))
);

create index if not exists renewals_company_next_due_idx on public.renewals(company_id, next_due_at);

create trigger renewals_updated_at
before update on public.renewals
for each row
execute function public.trigger_update_timestamp();

comment on table public.renewals is 'Cached renewal tracking for active_monitoring phase. Refreshed after entity changes or daily. Not canonical source of truth (entities are).';
