-- Extend tsr_org_requests with the four-section onboarding form.
--
-- Mapping (form section → column):
--   1. Organisation Identity
--      Legal Firm Name           → organization_name  (existing)
--      Entity Type               → entity_type        (new)
--      Firm Size / Team Count    → team_size          (existing — re-used)
--      Office Website            → office_website     (new, optional)
--
--   2. Compliance & Invoicing
--      Organization PAN          → organization_pan   (new)
--      GSTIN                     → gstin              (existing)
--      Registered Business Addr  → address            (existing)
--      Billing/Accounts Email    → billing_email      (new, optional)
--
--   3. AI & Operational Configuration
--      Primary Banks Served      → primary_banks_served (new jsonb array of strings)
--      Custom Bank Template      → bank_template_url    (new — set later via storage)
--      Default Language          → default_language     (new, default 'English')
--      Estimated Monthly Volume  → estimated_monthly_volume (new, e.g. '50-200')
--
--   4. Admin Point of Contact
--      Authorised Signatory      → contact_name       (existing — re-used)
--      Official Contact Number   → contact_phone      (existing — re-used)
--      (email)                   → contact_email      (existing)
--
-- Idempotent. Safe to re-run.

alter table public.tsr_org_requests add column if not exists entity_type              text;
alter table public.tsr_org_requests add column if not exists office_website           text;
alter table public.tsr_org_requests add column if not exists organization_pan         text;
alter table public.tsr_org_requests add column if not exists billing_email            text;
alter table public.tsr_org_requests add column if not exists primary_banks_served     jsonb not null default '[]'::jsonb;
alter table public.tsr_org_requests add column if not exists bank_template_url        text;
alter table public.tsr_org_requests add column if not exists default_language         text not null default 'English';
alter table public.tsr_org_requests add column if not exists estimated_monthly_volume text;
