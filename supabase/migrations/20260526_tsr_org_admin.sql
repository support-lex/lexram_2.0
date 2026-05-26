-- TSR organisation admin: super_admin + org_admin + member roles.
--
-- This rewrite of the earlier org migration:
--   • Uses SECURITY DEFINER helpers for every "am I admin of org X?" check,
--     so RLS policies never recurse (the previous attempt hit 42P17).
--   • Stamps balamuruganmbg6@gmail.com as super_admin.
--   • Backfills a "Personal" org for every existing tsr_clients user so no
--     data is orphaned and the new RLS keeps working on existing rows.
--
-- Idempotent. Safe to re-run.
-- Apply on project pwzarravsoahyihrdbit (the main lexram supabase).

-- ─── 1. organizations ────────────────────────────────────────────────────────
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null,
  plan          text not null default 'trial',
  status        text not null default 'active',
  seat_limit    int  not null default 5,
  admin_email   text,
  admin_name    text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists organizations_slug_uq on public.organizations (lower(slug));

create or replace function public.set_organizations_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_organizations_updated_at();

-- ─── 2. organization_members ────────────────────────────────────────────────
-- One row per user (UNIQUE on user_id) — single-org membership.
create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'member' check (role in ('admin', 'member')),
  status          text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  invited_by      uuid references auth.users(id) on delete set null,
  invited_email   text,
  invited_name    text,
  joined_at       timestamptz not null default now(),
  last_active_at  timestamptz
);
create unique index if not exists organization_members_user_uq on public.organization_members (user_id);
create index        if not exists organization_members_org_idx on public.organization_members (org_id);

-- ─── 3. tsr_clients gains org_id ────────────────────────────────────────────
alter table public.tsr_clients add column if not exists org_id uuid references public.organizations(id) on delete set null;
create index if not exists tsr_clients_org_id_idx on public.tsr_clients (org_id);

-- ─── 4. SECURITY DEFINER helpers (break RLS recursion) ──────────────────────

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin', false);
$$;

create or replace function public.is_org_admin_of(target_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
      and org_id  = target_org_id
      and role    = 'admin'
      and status  = 'active'
  );
$$;

create or replace function public.is_org_member_of(target_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
      and org_id  = target_org_id
      and status  = 'active'
  );
$$;

-- ─── 5. RLS — organizations ─────────────────────────────────────────────────
alter table public.organizations enable row level security;

drop policy if exists organizations_select_member_or_admin on public.organizations;
create policy organizations_select_member_or_admin on public.organizations
  for select to authenticated using (
    public.is_super_admin() or public.is_org_member_of(organizations.id)
  );

drop policy if exists organizations_admin_insert on public.organizations;
create policy organizations_admin_insert on public.organizations
  for insert to authenticated with check (public.is_super_admin());

drop policy if exists organizations_admin_update on public.organizations;
create policy organizations_admin_update on public.organizations
  for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists organizations_admin_delete on public.organizations;
create policy organizations_admin_delete on public.organizations
  for delete to authenticated using (public.is_super_admin());

-- ─── 6. RLS — organization_members ──────────────────────────────────────────
alter table public.organization_members enable row level security;

drop policy if exists members_select_visible  on public.organization_members;
drop policy if exists members_insert_by_admin on public.organization_members;
drop policy if exists members_update_by_admin on public.organization_members;
drop policy if exists members_delete_by_admin on public.organization_members;

create policy members_select_visible on public.organization_members
  for select to authenticated using (
    public.is_super_admin()
    or user_id = auth.uid()
    or public.is_org_admin_of(organization_members.org_id)
  );

create policy members_insert_by_admin on public.organization_members
  for insert to authenticated with check (
    public.is_super_admin() or public.is_org_admin_of(organization_members.org_id)
  );

create policy members_update_by_admin on public.organization_members
  for update to authenticated
  using       (public.is_super_admin() or public.is_org_admin_of(organization_members.org_id))
  with check  (public.is_super_admin() or public.is_org_admin_of(organization_members.org_id));

create policy members_delete_by_admin on public.organization_members
  for delete to authenticated using (
    public.is_super_admin() or public.is_org_admin_of(organization_members.org_id)
  );

-- ─── 7. RLS — tsr_clients respects org membership ────────────────────────────
-- Reads: owner, org-admin auditor, or super_admin.
-- Writes: only the owner (org admins audit via SELECT, they don't mutate
-- a member's case).
drop policy if exists tsr_clients_select_own on public.tsr_clients;
drop policy if exists tsr_clients_select_org on public.tsr_clients;
drop policy if exists tsr_clients_insert_own on public.tsr_clients;
drop policy if exists tsr_clients_update_own on public.tsr_clients;
drop policy if exists tsr_clients_delete_own on public.tsr_clients;

create policy tsr_clients_select_org on public.tsr_clients
  for select to authenticated using (
    public.is_super_admin()
    or user_id = auth.uid()
    or (org_id is not null and public.is_org_admin_of(tsr_clients.org_id))
  );

create policy tsr_clients_insert_own on public.tsr_clients
  for insert to authenticated with check (user_id = auth.uid());
create policy tsr_clients_update_own on public.tsr_clients
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tsr_clients_delete_own on public.tsr_clients
  for delete to authenticated using (user_id = auth.uid());

-- ─── 8. Promote balamuruganmbg6@gmail.com to super_admin ────────────────────
-- Idempotent: only updates if the user exists. Merges into existing
-- raw_app_meta_data so any other claims (provider, etc.) are preserved.
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'super_admin')
 where email = 'balamuruganmbg6@gmail.com';

-- ─── 9. Backfill — Personal org for every existing tsr_clients user ─────────
do $$
declare
  rec record;
  new_org_id uuid;
  user_email text;
begin
  for rec in
    select distinct t.user_id
    from public.tsr_clients t
    where not exists (
      select 1 from public.organization_members m where m.user_id = t.user_id
    )
  loop
    select email into user_email from auth.users where id = rec.user_id;
    insert into public.organizations (name, slug, plan, seat_limit, admin_email, created_by)
      values (
        'Personal — ' || coalesce(user_email, rec.user_id::text),
        'personal-' || substr(rec.user_id::text, 1, 8),
        'trial', 1,
        user_email,
        rec.user_id
      )
      returning id into new_org_id;

    insert into public.organization_members (org_id, user_id, role, status, invited_email, invited_name)
      values (new_org_id, rec.user_id, 'admin', 'active', user_email, split_part(coalesce(user_email, ''), '@', 1));

    update public.tsr_clients set org_id = new_org_id where user_id = rec.user_id and org_id is null;
  end loop;
end$$;
