-- The previous migration (20260522_tsr_cases.sql) used CREATE TABLE IF NOT
-- EXISTS and silently no-op'd because lexram supabase already had stub
-- versions of public.cases and public.documents from an earlier setup
-- (only id, user_id, title, created_at present on cases; id, case_id,
-- filename, storage_path, status, created_at on documents).
--
-- This migration adds the columns the TSR module needs, idempotently.
-- Safe to re-run.

-- ─── cases: add the missing columns ──────────────────────────────────────────
alter table public.cases add column if not exists case_name        text;
alter table public.cases add column if not exists case_no          text;
alter table public.cases add column if not exists bank_name        text;
alter table public.cases add column if not exists status           text;
alter table public.cases add column if not exists scrutiny_report  jsonb;
alter table public.cases add column if not exists final_report     jsonb;
alter table public.cases add column if not exists master_case_json jsonb;
alter table public.cases add column if not exists active_queries   jsonb;
alter table public.cases add column if not exists report_file_url  text;
alter table public.cases add column if not exists progress         int;
alter table public.cases add column if not exists status_message   text;
alter table public.cases add column if not exists updated_at       timestamptz;

-- Set defaults on the newly-added columns so future inserts work without
-- having to supply them. (`alter ... set default` is idempotent.)
alter table public.cases alter column status           set default 'new';
alter table public.cases alter column master_case_json set default '{}'::jsonb;
alter table public.cases alter column active_queries   set default '[]'::jsonb;
alter table public.cases alter column progress         set default 0;
alter table public.cases alter column updated_at       set default now();

-- Backfill existing rows so NOT NULL constraints (set below) can apply.
update public.cases set status           = coalesce(status,           'new')          where status           is null;
update public.cases set master_case_json = coalesce(master_case_json, '{}'::jsonb)    where master_case_json is null;
update public.cases set active_queries   = coalesce(active_queries,   '[]'::jsonb)    where active_queries   is null;
update public.cases set progress         = coalesce(progress,         0)              where progress         is null;
update public.cases set updated_at       = coalesce(updated_at,       now())          where updated_at       is null;

-- Now lock in NOT NULL on the columns the TSR code requires.
do $$ begin
  alter table public.cases alter column status           set not null;
  alter table public.cases alter column master_case_json set not null;
  alter table public.cases alter column active_queries   set not null;
  alter table public.cases alter column progress         set not null;
  alter table public.cases alter column updated_at       set not null;
exception when others then null;  -- swallow "already not null" + similar
end $$;

-- ─── documents: add the missing column ───────────────────────────────────────
alter table public.documents add column if not exists ocr_text text;

-- ─── updated_at auto-trigger (idempotent) ────────────────────────────────────
create or replace function public.set_cases_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at
  before update on public.cases
  for each row execute function public.set_cases_updated_at();
