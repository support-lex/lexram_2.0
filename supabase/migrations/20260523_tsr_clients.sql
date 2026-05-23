-- TSR (Title Scrutiny Report) — dedicated namespaced tables on the lexram
-- supabase project so they don't collide with the existing public.cases /
-- public.documents tables (which belong to a separate feature).
--
-- Frontend reads/writes here via the same auth session as the rest of lexram.
-- Backend (lex-doc-analyzer.onrender.com) writes scrutiny_report/final_report
-- payloads into these tables using the service-role key.
--
-- Safe to re-run.

-- ─── 0. Undo the abandoned ALTERs on public.cases from the 20260523 attempt ──
-- These columns were added by an earlier migration that mistakenly tried to
-- shoehorn TSR onto the shared public.cases table. Dropping them keeps the
-- pre-existing public.cases schema (id, user_id, title, created_at) intact.
alter table if exists public.cases drop column if exists case_name;
alter table if exists public.cases drop column if exists case_no;
alter table if exists public.cases drop column if exists bank_name;
alter table if exists public.cases drop column if exists status;
alter table if exists public.cases drop column if exists scrutiny_report;
alter table if exists public.cases drop column if exists final_report;
alter table if exists public.cases drop column if exists master_case_json;
alter table if exists public.cases drop column if exists active_queries;
alter table if exists public.cases drop column if exists report_file_url;
alter table if exists public.cases drop column if exists progress;
alter table if exists public.cases drop column if exists status_message;
alter table if exists public.cases drop column if exists updated_at;
drop trigger if exists cases_set_updated_at on public.cases;
-- (Leave public.cases.title, public.documents schema, etc. untouched.)

-- ─── 1. tsr_clients ──────────────────────────────────────────────────────────
create table if not exists public.tsr_clients (
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

create index if not exists tsr_clients_user_id_idx    on public.tsr_clients (user_id);
create index if not exists tsr_clients_created_at_idx on public.tsr_clients (created_at desc);

create or replace function public.set_tsr_clients_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists tsr_clients_set_updated_at on public.tsr_clients;
create trigger tsr_clients_set_updated_at
  before update on public.tsr_clients
  for each row execute function public.set_tsr_clients_updated_at();

-- ─── 2. tsr_documents ────────────────────────────────────────────────────────
create table if not exists public.tsr_documents (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.tsr_clients(id) on delete cascade,
  filename      text not null,
  storage_path  text not null,
  status        text not null default 'uploaded',
  ocr_text      text,
  created_at    timestamptz not null default now()
);

create index if not exists tsr_documents_case_id_idx on public.tsr_documents (case_id);

-- ─── 3. RLS — users only see their own rows ─────────────────────────────────
alter table public.tsr_clients   enable row level security;
alter table public.tsr_documents enable row level security;

drop policy if exists tsr_clients_select_own on public.tsr_clients;
create policy tsr_clients_select_own on public.tsr_clients
  for select using (auth.uid() = user_id);

drop policy if exists tsr_clients_insert_own on public.tsr_clients;
create policy tsr_clients_insert_own on public.tsr_clients
  for insert with check (auth.uid() = user_id);

drop policy if exists tsr_clients_update_own on public.tsr_clients;
create policy tsr_clients_update_own on public.tsr_clients
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists tsr_clients_delete_own on public.tsr_clients;
create policy tsr_clients_delete_own on public.tsr_clients
  for delete using (auth.uid() = user_id);

drop policy if exists tsr_documents_select_own on public.tsr_documents;
create policy tsr_documents_select_own on public.tsr_documents
  for select using (
    exists (select 1 from public.tsr_clients c
            where c.id = tsr_documents.case_id and c.user_id = auth.uid())
  );

drop policy if exists tsr_documents_insert_own on public.tsr_documents;
create policy tsr_documents_insert_own on public.tsr_documents
  for insert with check (
    exists (select 1 from public.tsr_clients c
            where c.id = tsr_documents.case_id and c.user_id = auth.uid())
  );

drop policy if exists tsr_documents_update_own on public.tsr_documents;
create policy tsr_documents_update_own on public.tsr_documents
  for update using (
    exists (select 1 from public.tsr_clients c
            where c.id = tsr_documents.case_id and c.user_id = auth.uid())
  );

drop policy if exists tsr_documents_delete_own on public.tsr_documents;
create policy tsr_documents_delete_own on public.tsr_documents
  for delete using (
    exists (select 1 from public.tsr_clients c
            where c.id = tsr_documents.case_id and c.user_id = auth.uid())
  );

-- ─── 4. Realtime — sidebar subscribes to INSERT/UPDATE/DELETE ────────────────
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tsr_clients'
  ) then
    execute 'alter publication supabase_realtime add table public.tsr_clients';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tsr_documents'
  ) then
    execute 'alter publication supabase_realtime add table public.tsr_documents';
  end if;
end $$;
