-- TSR per-report payment ledger.
--
-- One row per successful Cashfree charge for generating a scrutiny report.
-- Drives the post-payment invoice and provides an audit trail per user/case.
--
-- Pricing today (UI-driven, server validates a sensible band):
--   • Individual org → ₹1000 / report
--   • Enterprise org → ₹500 / report
--
-- Apply on project pwzarravsoahyihrdbit. Idempotent. Safe to re-run.

create table if not exists public.tsr_payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  org_id              uuid references public.organizations(id) on delete set null,
  case_id             uuid references public.tsr_clients(id)  on delete set null,

  -- Money (INR, no fractions for now)
  amount_inr          int  not null check (amount_inr > 0),
  currency            text not null default 'INR',

  -- Cashfree refs (the only payment gateway in use)
  order_id            text not null unique,
  payment_session_id  text,
  cashfree_payment_id text,

  -- Status: pending = order created, success = payment confirmed, failed = explicitly failed.
  status              text not null default 'pending'
                            check (status in ('pending', 'success', 'failed')),

  -- Invoice
  invoice_no          text generated always as ('INV-TSR-' || upper(substr(id::text, 1, 8))) stored,

  -- Snapshot of payer info captured at order time (so invoices survive profile changes)
  user_email          text,
  user_phone          text,

  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);

create index if not exists tsr_payments_user_idx   on public.tsr_payments (user_id, created_at desc);
create index if not exists tsr_payments_case_idx   on public.tsr_payments (case_id);
create index if not exists tsr_payments_status_idx on public.tsr_payments (status);

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.tsr_payments enable row level security;

drop policy if exists tsr_payments_select_own_or_super on public.tsr_payments;
create policy tsr_payments_select_own_or_super on public.tsr_payments
  for select to authenticated using (
    public.is_super_admin() or user_id = auth.uid()
  );

drop policy if exists tsr_payments_insert_self on public.tsr_payments;
create policy tsr_payments_insert_self on public.tsr_payments
  for insert to authenticated with check (user_id = auth.uid());

-- Status transitions happen server-side via the service-role admin client, so
-- no UPDATE policy is needed for end-users. Super admins can still update.
drop policy if exists tsr_payments_update_super on public.tsr_payments;
create policy tsr_payments_update_super on public.tsr_payments
  for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
