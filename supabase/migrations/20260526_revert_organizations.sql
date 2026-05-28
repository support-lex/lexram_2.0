-- Rollback for:
--   • 20260526_organizations.sql      (added org tables + RLS + org_id column)
--   • 20260526_fix_rls_recursion.sql  (replaced recursive policies)
--
-- After running this, the supabase project is back to the pre-org state:
--   • organizations / organization_members tables gone
--   • tsr_clients.org_id column gone
--   • tsr_clients RLS restored to the original "auth.uid() = user_id" rules
--   • Helper functions (is_super_admin, is_org_admin_of, is_org_member_of) dropped
--
-- Safe to re-run (everything uses IF EXISTS).

-- ─── 1. Drop new tsr_clients policies (they call the helpers we're about to
--        drop) and restore the original user-owned policies. ───────────────
drop policy if exists tsr_clients_select_org   on public.tsr_clients;
drop policy if exists tsr_clients_select_own   on public.tsr_clients;
drop policy if exists tsr_clients_insert_own   on public.tsr_clients;
drop policy if exists tsr_clients_update_own   on public.tsr_clients;
drop policy if exists tsr_clients_delete_own   on public.tsr_clients;

create policy tsr_clients_select_own on public.tsr_clients
  for select to authenticated using (user_id = auth.uid());
create policy tsr_clients_insert_own on public.tsr_clients
  for insert to authenticated with check (user_id = auth.uid());
create policy tsr_clients_update_own on public.tsr_clients
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tsr_clients_delete_own on public.tsr_clients
  for delete to authenticated using (user_id = auth.uid());

-- ─── 2. Drop the org_id column added to tsr_clients ────────────────────────
drop index if exists public.tsr_clients_org_id_idx;
alter table if exists public.tsr_clients drop column if exists org_id;

-- ─── 3. Drop policies on organization_members + the table ──────────────────
drop policy if exists members_select_visible  on public.organization_members;
drop policy if exists members_insert_by_admin on public.organization_members;
drop policy if exists members_update_by_admin on public.organization_members;
drop policy if exists members_delete_by_admin on public.organization_members;

drop index if exists public.organization_members_user_uq;
drop index if exists public.organization_members_org_idx;
drop table if exists public.organization_members cascade;

-- ─── 4. Drop policies on organizations + the table ─────────────────────────
drop policy if exists organizations_select_member_or_admin on public.organizations;
drop policy if exists organizations_admin_insert           on public.organizations;
drop policy if exists organizations_admin_update           on public.organizations;
drop policy if exists organizations_admin_delete           on public.organizations;

drop trigger if exists organizations_set_updated_at on public.organizations;
drop index   if exists public.organizations_slug_uq;
drop table   if exists public.organizations cascade;

-- ─── 5. Drop helper functions ──────────────────────────────────────────────
drop function if exists public.is_super_admin();
drop function if exists public.is_org_admin_of(uuid);
drop function if exists public.is_org_member_of(uuid);
drop function if exists public.set_organizations_updated_at();
