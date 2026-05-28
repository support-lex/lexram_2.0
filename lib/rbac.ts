// RBAC data layer for the TSR module.
//
// • Role comes from the supabase session:
//     - app_metadata.role === 'super_admin' → super_admin
//     - organization_members row, role='admin'  → admin (org admin)
//     - organization_members row, role='member' → member
//     - no membership                           → no_role
//
// • Reads of organisations + members go through Next.js API routes so they
//   can use the service-role key (no client-side service-role exposure).

"use client";

import { useEffect, useRef, useState } from "react";
import { supabase as lexramSupabase } from "@/lib/supabase/client";

export type Role = "super_admin" | "admin" | "member" | "no_role";
export type OrgPlan        = "trial" | "standard" | "enterprise";
export type OrgStatus      = "active" | "suspended";
export type OrgAccountType = "individual" | "organization";

export interface Organization {
  id:           string;
  name:         string;
  slug:         string;
  plan:         OrgPlan;
  status:       OrgStatus;
  seat_limit:   number;
  admin_email:  string | null;
  admin_name:   string | null;
  account_type: OrgAccountType;
  created_at:   string;
}

export interface OrganizationWithStats extends Organization {
  seats_used:   number;
  total_cases:  number;
  total_tokens: number;
}

export type MemberRole   = "admin" | "member";
export type MemberStatus = "active" | "invited" | "suspended";

export interface OrganizationMember {
  id:             string;
  org_id:         string;
  user_id:        string;
  email:          string;
  name:           string;
  role:           MemberRole;
  status:         MemberStatus;
  joined_at:      string;
  last_active_at: string | null;
  case_count:     number;
}

export interface RoleContext {
  role:       Role;
  loading:    boolean;
  user_id:    string | null;
  email:      string | null;
  org:        Organization | null;
  membership: { role: MemberRole; status: MemberStatus } | null;
  refresh:    () => Promise<void>;
}

// ── Role hook ───────────────────────────────────────────────────────────────

export function useRoleContext(): RoleContext {
  const sb = lexramSupabase();
  const [state, setState] = useState<Omit<RoleContext, "refresh">>({
    role: "no_role", loading: true, user_id: null, email: null, org: null, membership: null,
  });
  // `inflight` — guards against concurrent load() calls. Without it,
  // onAuthStateChange (which fires multiple times during normal session
  // refresh: INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, ...)
  // re-triggered load() while a previous load() was still mid-flight,
  // flipping loading=true via the spread setState and never resetting it.
  // Result: a permanently-stuck spinner with stale role/org populated —
  // exactly what we saw on the case page after a tab switch.
  const inflight = useRef(false);
  // `mounted` — every setState in the async path is gated on this. Prevents
  // "setState on unmounted component" warnings and stale writes when the
  // user navigates away mid-load.
  const mounted = useRef(true);

  const load = async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      if (!mounted.current) return;
      setState((s) => ({ ...s, loading: true }));

      const { data: { session } } = await sb.auth.getSession();
      if (!mounted.current) return;
      if (!session?.user) {
        setState({ role: "no_role", loading: false, user_id: null, email: null, org: null, membership: null });
        return;
      }
      const user = session.user;
      const isSuper = (user.app_metadata as Record<string, unknown>)?.role === "super_admin";

      const { data: m } = await sb
        .from("organization_members")
        .select("role, status, org_id, organizations:org_id ( id, name, slug, plan, status, seat_limit, admin_email, admin_name, account_type, created_at )")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!mounted.current) return;

      type Row = {
        role: MemberRole; status: MemberStatus; org_id: string;
        organizations: Organization | Organization[] | null;
      };
      const row = m as Row | null;
      const orgRaw = row?.organizations ?? null;
      const org: Organization | null = Array.isArray(orgRaw) ? (orgRaw[0] ?? null) : orgRaw;

      const role: Role = isSuper
        ? "super_admin"
        : row ? (row.role === "admin" ? "admin" : "member") : "no_role";

      setState({
        role, loading: false,
        user_id: user.id, email: user.email ?? null,
        org, membership: row ? { role: row.role, status: row.status } : null,
      });
    } catch (err) {
      console.warn("[useRoleContext] load failed:", err);
      if (mounted.current) setState((s) => ({ ...s, loading: false }));
    } finally {
      inflight.current = false;
    }
  };

  useEffect(() => {
    mounted.current = true;
    load();
    // Only re-load on SIGNED_OUT and USER_UPDATED. We deliberately skip
    // SIGNED_IN — Supabase emits it on every page mount when a cached
    // session exists, not only on a real sign-in. Re-loading on it caused a
    // second concurrent load() that hung waiting on Supabase's auth-token
    // Web Lock (held by other supabase.auth.getUser() callers elsewhere in
    // the app), which left ctx.loading=true forever with stale role/org
    // populated — that's the "Stuck loading your workspace" diagnostic.
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (!mounted.current) return;
      if (event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load();
      }
    });
    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, refresh: load };
}

// ── API helpers ─────────────────────────────────────────────────────────────

async function ok<T>(resPromise: Promise<Response>): Promise<T> {
  const res = await resPromise;
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(msg.slice(0, 240));
  }
  return res.json() as Promise<T>;
}

export const listAllOrganizations = () =>
  ok<OrganizationWithStats[]>(fetch("/api/admin/orgs", { credentials: "include" }));

export const getOrganizationDetail = (id: string) =>
  ok<{ org: OrganizationWithStats; members: OrganizationMember[] }>(
    fetch(`/api/admin/orgs/${id}`, { credentials: "include" }),
  );

export const createOrganization = (payload: {
  name: string; admin_email: string; admin_name: string; plan: OrgPlan; seat_limit: number;
}) => ok<{ org: Organization; invite_sent: boolean }>(
  fetch("/api/admin/orgs", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }),
);

export const updateOrganization = (id: string, payload: Partial<Pick<Organization, "status" | "plan" | "seat_limit" | "name">>) =>
  ok<Organization>(fetch(`/api/admin/orgs/${id}`, {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));

export const inviteMember = (payload: { org_id: string; email: string; name: string; role: MemberRole }) =>
  ok<OrganizationMember>(fetch("/api/org/members", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));

export const updateMember = (memberId: string, payload: Partial<Pick<OrganizationMember, "role" | "status">>) =>
  ok<OrganizationMember>(fetch(`/api/org/members/${memberId}`, {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));

export const removeMember = async (memberId: string) => {
  const res = await fetch(`/api/org/members/${memberId}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
};

export const listMyOrgMembers = (orgId: string) =>
  ok<OrganizationMember[]>(fetch(`/api/org/${orgId}/members`, { credentials: "include" }));

// ── Org join-requests (onboarding) ──────────────────────────────────────────

export type OrgRequestStatus = "pending" | "approved" | "rejected";

export interface OrgRequestTeamMember {
  name?:  string;
  email?: string;
  role?:  string;
}

export type EntityType =
  | "Sole Proprietorship"
  | "Partnership"
  | "LLP"
  | "Private Limited"
  | "Public Limited"
  | "Other";

export type MonthlyVolumeRange = "0-50" | "50-200" | "200-500" | "500+";

export interface OrgRequest {
  id:                string;
  requested_by:      string;
  organization_name:        string;
  organization_type:        string | null;
  entity_type:              EntityType | string | null;
  office_website:           string | null;
  contact_name:             string;
  contact_email:            string;
  contact_phone:            string | null;
  address:                  string | null;
  gstin:                    string | null;
  organization_pan:         string | null;
  billing_email:            string | null;
  primary_banks_served:     string[];
  bank_template_url:        string | null;
  default_language:         string;
  estimated_monthly_volume: string | null;
  team_size:                number;
  team_details:             OrgRequestTeamMember[];
  notes:                    string | null;
  status:                   OrgRequestStatus;
  reviewed_by:              string | null;
  reviewed_at:              string | null;
  decision_reason:          string | null;
  approved_org_id:          string | null;
  created_at:               string;
}

export interface CreateOrgRequestPayload {
  organization_name:         string;
  organization_type?:        string;
  entity_type?:              EntityType | string;
  office_website?:           string;
  contact_name:              string;
  contact_email:             string;
  contact_phone?:            string;
  address?:                  string;
  gstin?:                    string;
  organization_pan?:         string;
  billing_email?:            string;
  primary_banks_served?:     string[];
  default_language?:         string;
  estimated_monthly_volume?: MonthlyVolumeRange | string;
  team_size:                 number;
  team_details:              OrgRequestTeamMember[];
  notes?:                    string;
}

/** Hook for a user to read THEIR own request (most recent). */
export function useMyOrgRequest(enabled: boolean) {
  const sb = lexramSupabase();
  const [state, setState] = useState<{ request: OrgRequest | null; loading: boolean }>({ request: null, loading: enabled });

  useEffect(() => {
    if (!enabled) { setState({ request: null, loading: false }); return; }
    let cancelled = false;
    // Flip loading=true before the fetch so callers can render a spinner
    // when `enabled` flips false → true (e.g. once useRoleContext settles).
    setState((s) => ({ ...s, loading: true }));
    (async () => {
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (cancelled) return;
        if (!session?.user) { setState({ request: null, loading: false }); return; }
        const { data } = await sb
          .from("tsr_org_requests")
          .select("*")
          .eq("requested_by", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (cancelled) return;
        setState({ request: (data?.[0] as OrgRequest | undefined) ?? null, loading: false });
      } catch (err) {
        console.warn("[useMyOrgRequest] load failed:", err);
        if (!cancelled) setState({ request: null, loading: false });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return state;
}

export const submitOrgRequest = (payload: CreateOrgRequestPayload) =>
  ok<OrgRequest>(fetch("/api/org-requests", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));

export const listOrgRequests = (status?: OrgRequestStatus) =>
  ok<OrgRequest[]>(fetch(`/api/admin/org-requests${status ? `?status=${status}` : ""}`, { credentials: "include" }));

export const approveOrgRequest = (id: string, payload: { plan: OrgPlan; seat_limit: number }) =>
  ok<{ org: Organization; request: OrgRequest; invite_sent: boolean }>(fetch(`/api/admin/org-requests/${id}/approve`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));

export const rejectOrgRequest = (id: string, reason: string) =>
  ok<OrgRequest>(fetch(`/api/admin/org-requests/${id}/reject`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }),
  }));

// ── Self-serve "use as Individual" ─────────────────────────────────────────

export const startAsIndividual = () =>
  ok<{ org: Organization }>(fetch("/api/onboarding/individual", {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
  }));

// ── Display helpers ─────────────────────────────────────────────────────────

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("en-IN");
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const DAY = 24 * 60 * 60 * 1000;
  const days = Math.floor(diff / DAY);
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
