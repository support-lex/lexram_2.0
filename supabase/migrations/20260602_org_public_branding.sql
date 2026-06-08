-- Per-org TSR tenant app — anon-safe branding lookup.
--
-- The standalone tsr-tenant-app boots from a single env var
-- (NEXT_PUBLIC_ORG_SLUG = the org's schema_name) and must brand its login page
-- BEFORE the user signs in. organizations RLS only lets members/super-admins
-- read a row, so we expose a narrow SECURITY DEFINER function that returns ONLY
-- safe, non-sensitive branding fields for one org by its schema_name.
--
-- Apply on project pwzarravsoahyihrdbit. Idempotent. Safe to re-run.
-- Requires 20260601_org_schema_provisioning.sql.

create or replace function public.get_org_public_branding(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',                   o.id,
    'name',                 o.name,
    'schema_name',          o.schema_name,
    'logo_url',             o.logo_url,
    'plan',                 o.plan,
    'status',               o.status,
    'default_language',     o.default_language,
    'primary_banks_served', o.primary_banks_served,
    'provision_status',     o.provision_status
  )
  from public.organizations o
  where o.schema_name = public.sanitize_schema_name(p_slug)
  limit 1;
$$;

-- Anyone (even unauthenticated) may read these safe branding fields.
grant execute on function public.get_org_public_branding(text) to anon, authenticated, service_role;
