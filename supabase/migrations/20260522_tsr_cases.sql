-- LEXRAM TSR (Title Scrutiny Report) tables.
-- Schema unifies columns used by the merged frontend (case_name, case_no,
-- bank_name, scrutiny_report, final_report) AND the Lex-Doc-Analyzer backend
-- (title, master_case_json, active_queries, progress, status_message,
-- report_file_url).
--
-- Apply via Supabase SQL Editor or `supabase db push`.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CASES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.cases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,

  -- Frontend-facing fields
  case_name         text not null,
  case_no           text not null,
  bank_name         text not null,

  -- Backend-facing field (Lex-Doc-Analyzer create_case uses `title`)
  title             text,

  status            text not null default 'new',

  -- Pipeline outputs (the frontend reads these directly)
  scrutiny_report   jsonb,
  final_report      jsonb,

  -- Backend pipeline state
  master_case_json  jsonb not null default '{}'::jsonb,
  active_queries    jsonb not null default '[]'::jsonb,
  report_file_url   text,
  progress          int  not null default 0,
  status_message    text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists cases_user_id_idx on public.cases (user_id);
create index if not exists cases_created_at_idx on public.cases (created_at desc);

-- Auto-update updated_at on row updates
create or replace function public.set_cases_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at
  before update on public.cases
  for each row execute function public.set_cases_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DOCUMENTS (per-case upload metadata)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases(id) on delete cascade,
  filename      text not null,
  storage_path  text not null,
  status        text not null default 'uploaded',
  ocr_text      text,
  created_at    timestamptz not null default now()
);

create index if not exists documents_case_id_idx on public.documents (case_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS — users only see their own cases and the documents under them
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.cases     enable row level security;
alter table public.documents enable row level security;

drop policy if exists cases_select_own on public.cases;
create policy cases_select_own on public.cases
  for select using (auth.uid() = user_id);

drop policy if exists cases_insert_own on public.cases;
create policy cases_insert_own on public.cases
  for insert with check (auth.uid() = user_id);

drop policy if exists cases_update_own on public.cases;
create policy cases_update_own on public.cases
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists cases_delete_own on public.cases;
create policy cases_delete_own on public.cases
  for delete using (auth.uid() = user_id);

drop policy if exists documents_select_own on public.documents;
create policy documents_select_own on public.documents
  for select using (
    exists (select 1 from public.cases c where c.id = documents.case_id and c.user_id = auth.uid())
  );

drop policy if exists documents_insert_own on public.documents;
create policy documents_insert_own on public.documents
  for insert with check (
    exists (select 1 from public.cases c where c.id = documents.case_id and c.user_id = auth.uid())
  );

drop policy if exists documents_update_own on public.documents;
create policy documents_update_own on public.documents
  for update using (
    exists (select 1 from public.cases c where c.id = documents.case_id and c.user_id = auth.uid())
  );

drop policy if exists documents_delete_own on public.documents;
create policy documents_delete_own on public.documents
  for delete using (
    exists (select 1 from public.cases c where c.id = documents.case_id and c.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. REALTIME — sidebar subscribes to INSERT/UPDATE/DELETE on cases.
-- Wrapped in DO blocks so the migration is safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cases'
  ) then
    execute 'alter publication supabase_realtime add table public.cases';
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'documents'
  ) then
    execute 'alter publication supabase_realtime add table public.documents';
  end if;
end$$;
