-- Super-Admin Org Provisioning Console — schema-per-tenant provisioning.
--
-- Adds the machinery the new standalone admin-console app uses to create a
-- dedicated Postgres schema per organisation (client "AVR" → schema "avr" with
-- avr.cases / avr.documents), plus the registry/config columns the A–Z creation
-- form writes onto public.organizations.
--
-- Apply on project pwzarravsoahyihrdbit (the main lexram supabase).
-- Idempotent. Safe to re-run.
--
-- Requires 20260526_tsr_org_admin.sql (organizations + helpers) applied first.

-- ─── 1. organizations gains the full A–Z config + provisioning state ─────────
alter table public.organizations add column if not exists schema_name              text;
alter table public.organizations add column if not exists logo_url                 text;
alter table public.organizations add column if not exists entity_type              text;
alter table public.organizations add column if not exists organization_pan         text;
alter table public.organizations add column if not exists gstin                    text;
alter table public.organizations add column if not exists address                  text;
alter table public.organizations add column if not exists billing_email            text;
alter table public.organizations add column if not exists office_website           text;
alter table public.organizations add column if not exists primary_banks_served     jsonb not null default '[]'::jsonb;
alter table public.organizations add column if not exists default_language         text not null default 'English';
alter table public.organizations add column if not exists estimated_monthly_volume text;
alter table public.organizations add column if not exists provision_status         text not null default 'pending'
  check (provision_status in ('pending', 'provisioned', 'failed'));
alter table public.organizations add column if not exists provision_error          text;
alter table public.organizations add column if not exists provisioned_at           timestamptz;

-- schema_name is the tenant's namespace; one schema per org.
create unique index if not exists organizations_schema_name_uq
  on public.organizations (schema_name) where schema_name is not null;

-- ─── 2. sanitize helper — org name/slug → safe lowercase pg identifier ───────
create or replace function public.sanitize_schema_name(p_raw text)
returns text language plpgsql immutable as $$
declare
  s text;
begin
  -- lowercase, collapse any run of non-alphanumerics to a single underscore
  s := lower(coalesce(p_raw, ''));
  s := regexp_replace(s, '[^a-z0-9]+', '_', 'g');
  s := regexp_replace(s, '^_+|_+$', '', 'g');        -- trim leading/trailing _
  -- identifiers must start with a letter; prefix if it doesn't
  if s = '' then
    raise exception 'schema name resolves to empty';
  end if;
  if s ~ '^[0-9]' then
    s := 'o_' || s;
  end if;
  return left(s, 48);                                -- keep well under 63-char cap
end $$;

-- ─── 3. provision_org_schema(p_schema) — the core per-tenant builder ─────────
-- SECURITY DEFINER + owned by postgres so it can CREATE SCHEMA / CREATE TABLE.
-- Mirrors public.tsr_clients (→ <schema>.cases) and public.tsr_documents
-- (→ <schema>.documents), with the same per-user RLS shape. Idempotent.
create or replace function public.provision_org_schema(p_schema text)
returns text language plpgsql security definer set search_path = public as $$
declare
  s text := public.sanitize_schema_name(p_schema);
begin
  if s in ('public', 'auth', 'storage', 'graphql', 'graphql_public',
           'realtime', 'vault', 'extensions', 'pgsodium', 'information_schema')
     or s like 'pg_%' then
    raise exception 'schema name "%" is reserved', s;
  end if;

  execute format('create schema if not exists %I', s);

  -- ── <schema>.cases ─────────────────────────────────────────────────────────
  execute format($f$
    create table if not exists %I.cases (
      id                uuid primary key default gen_random_uuid(),
      user_id           uuid not null references auth.users(id) on delete cascade,
      org_id            uuid references public.organizations(id) on delete set null,
      case_name         text not null,
      case_no           text not null,
      bank_name         text not null,
      title             text,
      status            text not null default 'new',
      scrutiny_report   jsonb,
      final_report      jsonb,
      master_case_json  jsonb not null default '{}'::jsonb,
      active_queries    jsonb not null default '[]'::jsonb,
      report_file_url   text,
      progress          int  not null default 0,
      status_message    text,
      token_usage       jsonb,
      created_at        timestamptz not null default now(),
      updated_at        timestamptz not null default now()
    )$f$, s);
  execute format('create index if not exists cases_user_id_idx    on %I.cases (user_id)', s);
  execute format('create index if not exists cases_created_at_idx on %I.cases (created_at desc)', s);

  -- ── <schema>.documents ─────────────────────────────────────────────────────
  execute format($f$
    create table if not exists %I.documents (
      id            uuid primary key default gen_random_uuid(),
      case_id       uuid not null references %I.cases(id) on delete cascade,
      filename      text not null,
      storage_path  text not null,
      status        text not null default 'uploaded',
      ocr_text      text,
      created_at    timestamptz not null default now()
    )$f$, s, s);
  execute format('create index if not exists documents_case_id_idx on %I.documents (case_id)', s);

  -- ── updated_at trigger on cases (idempotent) ───────────────────────────────
  execute format('drop trigger if exists cases_set_updated_at on %I.cases', s);
  execute format($f$
    create trigger cases_set_updated_at before update on %I.cases
    for each row execute function public.set_tsr_clients_updated_at()$f$, s);

  -- ── RLS — users see only their own rows ────────────────────────────────────
  execute format('alter table %I.cases     enable row level security', s);
  execute format('alter table %I.documents enable row level security', s);

  execute format('drop policy if exists cases_select_own on %I.cases', s);
  execute format('create policy cases_select_own on %I.cases for select using (auth.uid() = user_id)', s);
  execute format('drop policy if exists cases_insert_own on %I.cases', s);
  execute format('create policy cases_insert_own on %I.cases for insert with check (auth.uid() = user_id)', s);
  execute format('drop policy if exists cases_update_own on %I.cases', s);
  execute format('create policy cases_update_own on %I.cases for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', s);
  execute format('drop policy if exists cases_delete_own on %I.cases', s);
  execute format('create policy cases_delete_own on %I.cases for delete using (auth.uid() = user_id)', s);

  execute format($f$drop policy if exists documents_select_own on %I.documents$f$, s);
  execute format($f$create policy documents_select_own on %I.documents for select using (
    exists (select 1 from %I.cases c where c.id = documents.case_id and c.user_id = auth.uid()))$f$, s, s);
  execute format($f$drop policy if exists documents_insert_own on %I.documents$f$, s);
  execute format($f$create policy documents_insert_own on %I.documents for insert with check (
    exists (select 1 from %I.cases c where c.id = documents.case_id and c.user_id = auth.uid()))$f$, s, s);
  execute format($f$drop policy if exists documents_update_own on %I.documents$f$, s);
  execute format($f$create policy documents_update_own on %I.documents for update using (
    exists (select 1 from %I.cases c where c.id = documents.case_id and c.user_id = auth.uid()))$f$, s, s);
  execute format($f$drop policy if exists documents_delete_own on %I.documents$f$, s);
  execute format($f$create policy documents_delete_own on %I.documents for delete using (
    exists (select 1 from %I.cases c where c.id = documents.case_id and c.user_id = auth.uid()))$f$, s, s);

  -- ── Grants — PostgREST roles need usage on the schema + table privileges ───
  execute format('grant usage on schema %I to anon, authenticated, service_role', s);
  execute format('grant all on all tables    in schema %I to anon, authenticated, service_role', s);
  execute format('grant all on all sequences in schema %I to anon, authenticated, service_role', s);
  execute format('alter default privileges in schema %I grant all on tables    to anon, authenticated, service_role', s);
  execute format('alter default privileges in schema %I grant all on sequences to anon, authenticated, service_role', s);

  -- ── Realtime — sidebar/live views subscribe to these ───────────────────────
  begin
    execute format('alter publication supabase_realtime add table %I.cases', s);
  exception when duplicate_object then null; end;
  begin
    execute format('alter publication supabase_realtime add table %I.documents', s);
  exception when duplicate_object then null; end;

  return s;
end $$;

grant execute on function public.provision_org_schema(text) to service_role;
grant execute on function public.sanitize_schema_name(text)  to service_role, authenticated;

-- ─── 4. expose_org_schema(p_schema) — best-effort PostgREST exposure ─────────
-- Appends the new schema to the authenticator role's pgrst.db_schemas GUC and
-- asks PostgREST to reload. Returns true on success; false (caught) means the
-- operator must add the schema under Supabase → Settings → API → Exposed
-- schemas manually. Owned by postgres (SECURITY DEFINER) — altering the
-- authenticator role needs the elevated owner.
create or replace function public.expose_org_schema(p_schema text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  s        text := public.sanitize_schema_name(p_schema);
  current  text;
  newlist  text;
begin
  -- Read the role-level GUC currently configured for `authenticator`.
  select split_part(cfg, '=', 2)
    into current
  from pg_roles r
  join pg_db_role_setting d on d.setrole = r.oid
  cross join lateral unnest(d.setconfig) as cfg
  where r.rolname = 'authenticator' and cfg like 'pgrst.db_schemas=%'
  limit 1;

  current := coalesce(nullif(trim(current), ''), 'public, graphql_public');

  -- Already exposed? nothing to do.
  if (', ' || replace(current, ' ', '') || ',') like ('%,' || s || ',%') then
    return true;
  end if;

  newlist := current || ', ' || s;
  execute format('alter role authenticator set pgrst.db_schemas = %L', newlist);
  -- Reload both config (db_schemas) and the schema cache.
  notify pgrst, 'reload config';
  notify pgrst, 'reload schema';
  return true;
exception when others then
  return false;  -- privilege denied etc. → caller surfaces the manual step
end $$;

grant execute on function public.expose_org_schema(text) to service_role;

-- ─── 5. Storage bucket for org logos (public read) ──────────────────────────
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do update set public = true;
