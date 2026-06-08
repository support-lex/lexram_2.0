// Per-tenant org configuration. The deploy is pinned to ONE org via
// NEXT_PUBLIC_ORG_SLUG (= the org's schema_name). Branding is fetched at runtime
// from the anon-safe get_org_public_branding() RPC so the login page can brand
// itself before sign-in.

import { supabase } from "@/lib/supabase/client";

/** The org's schema_name — also the Postgres schema holding its cases/documents. */
export const ORG_SLUG = (process.env.NEXT_PUBLIC_ORG_SLUG ?? "").trim();

export interface OrgBranding {
  id: string;
  name: string;
  schema_name: string;
  logo_url: string | null;
  plan: "trial" | "standard" | "enterprise";
  status: "active" | "suspended";
  default_language: string;
  primary_banks_served: string[];
  provision_status: "pending" | "provisioned" | "failed";
}

/** Fetch the org's public branding by slug. Returns null if not found. */
export async function fetchOrgBranding(slug: string = ORG_SLUG): Promise<OrgBranding | null> {
  if (!slug) return null;
  const { data, error } = await supabase().rpc("get_org_public_branding", { p_slug: slug });
  if (error || !data) return null;
  const b = data as Partial<OrgBranding>;
  if (!b.id || !b.schema_name) return null;
  return {
    id: b.id,
    name: b.name ?? slug,
    schema_name: b.schema_name,
    logo_url: b.logo_url ?? null,
    plan: (b.plan as OrgBranding["plan"]) ?? "standard",
    status: (b.status as OrgBranding["status"]) ?? "active",
    default_language: b.default_language ?? "English",
    primary_banks_served: Array.isArray(b.primary_banks_served) ? b.primary_banks_served : [],
    provision_status: (b.provision_status as OrgBranding["provision_status"]) ?? "provisioned",
  };
}

/** A supabase query builder scoped to this org's schema. */
export function orgSchema() {
  return supabase().schema(ORG_SLUG);
}
