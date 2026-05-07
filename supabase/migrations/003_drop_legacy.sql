-- درع Phase 1: Drop legacy MVP schema
-- These tables (from 001_initial.sql + 002_rls.sql) will be replaced by the new
-- comprehensive schema. Preserving 001/002 for historical record.

-- Disable publication before dropping to avoid replica issues.
alter publication supabase_realtime drop table if exists public.agent_activity;

drop table if exists public.agent_activity cascade;
drop table if exists public.documents cascade;
drop table if exists public.scans cascade;
drop table if exists public.companies cascade;
