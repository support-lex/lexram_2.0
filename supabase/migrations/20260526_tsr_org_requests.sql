-- TSR onboarding: organisation join-requests + account_type discriminator.
--
-- Adds:
--   • organizations.account_type — 'individual' (1-seat personal) vs 'organization' (real tenant)
--   • tsr_org_requests — pending requests submitted by a client who wants to join as an org
--                        super_admin reviews + approves (→ creates real org + invites admin)
--                        or rejects (→ user can retry or switch to Individual)
--
-- Apply on project pwzarravsoahyihrdbit. Idempotent. Safe to re-run.
-- Requires 20260526_tsr_org_admin.sql (organizations + helpers) to be applied first.

-- ─── 1. account_type column on organizations ────────────────────────────────
alter table public.organizations
  add column if not exists account_type text not null default 'organization'
    check (account_type in ('individual', 'organization'));

-- Backfill: every Personal org from the earlier backfill is an individual.
update public.organizations
   set account_type = 'individual'
 where slug like 'personal-%' and account_type <> 'individual';

create index if not exists organizations_account_type_idx on public.organizations (account_type);

-- ─── 2. tsr_org_requests ────────────────────────────────────────────────────
create table if not exists public.tsr_org_requests (
  id                  uuid primary key default gen_random_uuid(),
  requested_by        uuid not null references auth.users(id) on delete cascade,

  -- Organisation details (captured from the form)
  organization_name   text not null,
  organization_type   text,                                  -- e.g. "Law firm", "Bank verifier", "Other"
  contact_name        text not null,
  contact_email       text not null,
  contact_phone       text,
  address             text,
  gstin               text,
  team_size           int  not null default 1,
  team_details        jsonb not null default '[]'::jsonb,    -- [{name, email, role}]
  notes               text,                                  -- free-text from requester

  -- Review state
  status              text not null default 'pending'
                            check (status in ('pending', 'approved', 'rejected')),
  reviewed_by         uuid references auth.users(id) on delete set null,
  reviewed_at         timestamptz,
  decision_reason     text,
  approved_org_id     uuid references public.organizations(id) on delete set null,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists tsr_org_requests_status_idx       on public.tsr_org_requests (status);
create index if not exists tsr_org_requests_requested_by_idx on public.tsr_org_requests (requested_by);
create index if not exists tsr_org_requests_created_at_idx   on public.tsr_org_requests (created_at desc);

create or replace function public.set_tsr_org_requests_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists tsr_org_requests_set_updated_at on public.tsr_org_requests;
create trigger tsr_org_requests_set_updated_at
  before update on public.tsr_org_requests
  for each row execute function public.set_tsr_org_requests_updated_at();

-- ─── 3. RLS — requesters see their own, super admins see everything ─────────
alter table public.tsr_org_requests enable row level security;

drop policy if exists org_requests_select_own_or_super on public.tsr_org_requests;
create policy org_requests_select_own_or_super on public.tsr_org_requests
  for select to authenticated using (
    public.is_super_admin() or requested_by = auth.uid()
  );

drop policy if exists org_requests_insert_self on public.tsr_org_requests;
create policy org_requests_insert_self on public.tsr_org_requests
  for insert to authenticated with check (requested_by = auth.uid());

-- Only super admins can update / decide on requests
drop policy if exists org_requests_update_super on public.tsr_org_requests;
create policy org_requests_update_super on public.tsr_org_requests
  for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists org_requests_delete_super on public.tsr_org_requests;
create policy org_requests_delete_super on public.tsr_org_requests
  for delete to authenticated using (public.is_super_admin());
