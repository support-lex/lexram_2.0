-- Run this on the TSR Supabase project (ovghtwibustzkjkacvqo) — NOT on the
-- main lexram project. Apply via the Supabase SQL editor:
--   https://app.supabase.com → project ovghtwibustzkjkacvqo → SQL Editor
--
-- WHY: The lexram-2-0-ui-v2 frontend signs users in against the main lexram
-- supabase (pwzarravsoahyihrdbit). The TSR module talks to a different
-- supabase project (this one) for data, using an anon key with no session.
-- The original RLS policies require auth.uid() = user_id, which always
-- fails when there's no TSR session. The Render backend uses the service-
-- role key and bypasses RLS regardless.
--
-- We replace the user-scoped policies with permissive anon-allowed policies.
-- Per-user filtering is enforced at the query level by passing user_id
-- (sourced from the lexram session) into every .eq('user_id', ...) call.

-- ─── cases ─────────────────────────────────────────────────────────────────
drop policy if exists cases_select_own on public.cases;
drop policy if exists cases_insert_own on public.cases;
drop policy if exists cases_update_own on public.cases;
drop policy if exists cases_delete_own on public.cases;

create policy cases_anon_select on public.cases for select to anon using (true);
create policy cases_anon_insert on public.cases for insert to anon with check (true);
create policy cases_anon_update on public.cases for update to anon using (true) with check (true);
create policy cases_anon_delete on public.cases for delete to anon using (true);

-- ─── documents ─────────────────────────────────────────────────────────────
drop policy if exists documents_select_own on public.documents;
drop policy if exists documents_insert_own on public.documents;
drop policy if exists documents_update_own on public.documents;
drop policy if exists documents_delete_own on public.documents;

create policy documents_anon_select on public.documents for select to anon using (true);
create policy documents_anon_insert on public.documents for insert to anon with check (true);
create policy documents_anon_update on public.documents for update to anon using (true) with check (true);
create policy documents_anon_delete on public.documents for delete to anon using (true);

-- Drop the user_id FK to auth.users — lexram user_ids may not exist in this
-- supabase project's auth.users table, and the FK would reject inserts.
do $$
declare
  fk_name text;
begin
  select conname into fk_name
  from pg_constraint
  where conrelid = 'public.cases'::regclass
    and contype = 'f'
    and pg_get_constraintdef(oid) like '%REFERENCES auth.users%';
  if fk_name is not null then
    execute format('alter table public.cases drop constraint %I', fk_name);
  end if;
end$$;

-- Make user_id nullable on cases so unauthenticated inserts can still pass.
alter table public.cases alter column user_id drop not null;
