-- Self-hosted phone OTP (replaces Supabase/Twilio SMS OTP).
--
-- Codes are generated, stored (hashed) and verified by our own API routes in
-- app/api/auth/*, and delivered over the Arihant Global SMS gateway. Supabase
-- Auth is no longer asked to send any SMS — it only holds the user row and the
-- session. See lib/auth/phone-otp.ts and lib/sms/arihant.ts.
--
-- Apply on project pwzarravsoahyihrdbit. Idempotent. Safe to re-run.

-- ─── OTP + reset-ticket store ────────────────────────────────────────────────
-- One row per issued code. The raw code NEVER lands in the DB — only a
-- salted SHA-256 of (phone|purpose|code). Same for the reset ticket handed
-- out after a successful "forgot password" verification.

create table if not exists public.phone_otp_codes (
  id                 uuid primary key default gen_random_uuid(),

  -- E.164 digits WITHOUT the leading "+", matching auth.users.phone.
  phone              text not null,

  -- signup → confirms the phone on auth.users
  -- reset  → mints a short-lived ticket that authorises a password change
  purpose            text not null check (purpose in ('signup', 'reset')),

  code_hash          text not null,
  attempts           int  not null default 0,
  expires_at         timestamptz not null,
  consumed_at        timestamptz,

  -- Populated only when a 'reset' code is verified successfully.
  ticket_hash        text,
  ticket_expires_at  timestamptz,

  ip                 text,
  created_at         timestamptz not null default now()
);

create index if not exists phone_otp_codes_lookup_idx
  on public.phone_otp_codes (phone, purpose, created_at desc);
create index if not exists phone_otp_codes_expires_idx
  on public.phone_otp_codes (expires_at);
create index if not exists phone_otp_codes_ticket_idx
  on public.phone_otp_codes (ticket_hash)
  where ticket_hash is not null;

-- RLS on with NO policies: the service role bypasses RLS, everyone else is
-- denied. Browsers must never read or write this table directly.
alter table public.phone_otp_codes enable row level security;
revoke all on public.phone_otp_codes from anon, authenticated;

-- ─── Contact → auth.users lookup ─────────────────────────────────────────────
-- The auth schema isn't exposed through PostgREST, so the API routes resolve
-- "does this phone/email have an account?" through this security-definer RPC.
-- Executable by the service role only — it is never callable from a browser.

create or replace function public.auth_user_by_contact(
  p_phone text default null,
  p_email text default null
)
returns table (
  id                 uuid,
  phone              text,
  email              text,
  phone_confirmed_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select u.id, u.phone, u.email, u.phone_confirmed_at
  from auth.users u
  where u.deleted_at is null
    and (
         (p_phone is not null and p_phone <> ''
            and u.phone = regexp_replace(p_phone, '\D', '', 'g'))
      or (p_email is not null and p_email <> ''
            and lower(u.email) = lower(p_email))
    )
  order by u.created_at asc
  limit 1;
$$;

revoke all on function public.auth_user_by_contact(text, text) from public, anon, authenticated;
grant execute on function public.auth_user_by_contact(text, text) to service_role;
