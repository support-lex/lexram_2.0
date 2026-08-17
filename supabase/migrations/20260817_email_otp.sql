-- Extend the self-hosted OTP store to email contacts.
--
-- Password reset by email used to ride Supabase's magic-link mailer, which
-- fails with "Error sending magic link email" whenever GoTrue's SMTP send does
-- (the built-in sender only delivers to project team members). Email OTPs now
-- follow the same path the SMS ones already do: we mint the code, store its
-- hash here, and deliver it over our own SMTP from lib/mail.ts.
--
-- Apply on project pwzarravsoahyihrdbit. Idempotent. Safe to re-run.

-- A row is now keyed by EITHER phone or email, never both and never neither.
alter table public.phone_otp_codes alter column phone drop not null;
alter table public.phone_otp_codes add column if not exists email text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'phone_otp_codes_one_contact'
  ) then
    alter table public.phone_otp_codes
      add constraint phone_otp_codes_one_contact
      check (num_nonnulls(phone, email) = 1);
  end if;
end $$;

create index if not exists phone_otp_codes_email_lookup_idx
  on public.phone_otp_codes (email, purpose, created_at desc);
