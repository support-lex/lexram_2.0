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

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { supabase as lexramSupabase } from "@/lib/supabase/client";

export type Role = "super_admin" | "admin" | "member" | "no_role";
export type OrgPlan        = "trial" | "standard" | "enterprise";
export type OrgStatus      = "active" | "suspended";
export type OrgAccountType = "individual" | "organization";

export type ProvisionStatus = "pending" | "provisioned" | "failed";

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

  // Schema-per-tenant provisioning + branding (see 20260601 migration).
  schema_name?:              string | null;
  logo_url?:                 string | null;
  entity_type?:              string | null;
  organization_pan?:         string | null;
  gstin?:                    string | null;
  address?:                  string | null;
  billing_email?:            string | null;
  office_website?:           string | null;
  primary_banks_served?:     string[];
  default_language?:         string;
  estimated_monthly_volume?: string | null;
  provision_status?:         ProvisionStatus;
  provision_error?:          string | null;
  provisioned_at?:           string | null;
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

// ── Role hook — MODULE-LEVEL shared store ──────────────────────────────────
//
// Why module-level?
//   useRoleContext is called by several components that mount together on a
//   single TSR page (the TSR layout, DashboardSidebar, plus admin/team pages
//   that compose with the layout). The previous implementation gave each
//   caller its OWN useState + its OWN supabase query, so the same
//   organization_members JOIN ran 2–3 times in parallel on every TSR navigation
//   — adding several seconds of redundant network latency and triggering
//   Supabase auth-lock contention.
//
//   The store below holds one shared snapshot. All useRoleContext callers
//   subscribe via useSyncExternalStore and re-render together; load() runs at
//   most ONCE in flight regardless of caller count.
//
//   localStorage stale-while-revalidate: the last successful snapshot is
//   persisted under ROLE_CACHE_KEY. On any subsequent visit we hydrate
//   instantly from cache (loading=false from the first paint) and revalidate
//   in the background. The cache is cleared on SIGNED_OUT so user A's data
//   never leaks to user B.

const ROLE_CACHE_KEY = "lexram:role-ctx:v1";

type RoleSnapshot = Omit<RoleContext, "refresh">;

const initialSnapshot: RoleSnapshot = {
  role: "no_role", loading: true, user_id: null, email: null, org: null, membership: null,
};

function readRoleCache(): RoleSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; snap: RoleSnapshot };
    // Discard cache older than 24h — guards against schema drift.
    if (!parsed.ts || Date.now() - parsed.ts > 24 * 60 * 60 * 1000) return null;
    return { ...parsed.snap, loading: false };
  } catch {
    return null;
  }
}

function writeRoleCache(snap: RoleSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ROLE_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), snap: { ...snap, loading: false } }),
    );
  } catch { /* quota / SSR — ignore */ }
}

function clearRoleCache() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(ROLE_CACHE_KEY); } catch { /* ignore */ }
}

const roleStore = {
  state: (typeof window === "undefined" ? null : readRoleCache()) ?? initialSnapshot,
  listeners: new Set<() => void>(),
  authSubscribed: false,
  inflight: null as Promise<void> | null,
  initialised: false,

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  },

  getSnapshot(): RoleSnapshot {
    return this.state;
  },

  setState(next: RoleSnapshot) {
    this.state = next;
    this.listeners.forEach((l) => l());
  },

  async load(): Promise<void> {
    if (this.inflight) return this.inflight;
    const sb = lexramSupabase();
    this.inflight = (async () => {
      try {
        // Keep showing the cached snapshot while we revalidate — only flip
        // loading=true when we have *nothing* to show.
        if (this.state === initialSnapshot) {
          this.setState({ ...this.state, loading: true });
        }
        const { data: { session } } = await sb.auth.getSession();
        if (!session?.user) {
          const empty: RoleSnapshot = {
            role: "no_role", loading: false, user_id: null, email: null, org: null, membership: null,
          };
          this.setState(empty);
          clearRoleCache();
          return;
        }
        const user = session.user;
        const isSuper = (user.app_metadata as Record<string, unknown>)?.role === "super_admin";

        const { data: m } = await sb
          .from("organization_members")
          .select("role, status, org_id, organizations:org_id ( id, name, slug, plan, status, seat_limit, admin_email, admin_name, account_type, created_at )")
          .eq("user_id", user.id)
          .maybeSingle();

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

        const next: RoleSnapshot = {
          role, loading: false,
          user_id: user.id, email: user.email ?? null,
          org, membership: row ? { role: row.role, status: row.status } : null,
        };
        this.setState(next);
        writeRoleCache(next);
      } catch (err) {
        console.warn("[roleStore] load failed:", err);
        // Don't strand the UI in loading state — show whatever cache we have.
        this.setState({ ...this.state, loading: false });
      } finally {
        this.inflight = null;
      }
    })();
    return this.inflight;
  },

  ensureAuthSubscription() {
    if (this.authSubscribed || typeof window === "undefined") return;
    this.authSubscribed = true;
    const sb = lexramSupabase();
    sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearRoleCache();
        this.setState({
          role: "no_role", loading: false, user_id: null, email: null, org: null, membership: null,
        });
        return;
      }
      if (event === "USER_UPDATED") {
        this.load();
      }
    });
  },
};

// SSR snapshot — useSyncExternalStore requires a stable reference per render.
function getServerSnapshot(): RoleSnapshot {
  return initialSnapshot;
}

export function useRoleContext(): RoleContext {
  const snap = useSyncExternalStore(
    (cb) => roleStore.subscribe(cb),
    () => roleStore.getSnapshot(),
    getServerSnapshot,
  );

  useEffect(() => {
    roleStore.ensureAuthSubscription();
    // Kick off a load if we've never run one. Cached-hydrated snapshots
    // still trigger a background revalidate so the data stays current.
    if (!roleStore.initialised) {
      roleStore.initialised = true;
      roleStore.load();
    } else if (snap === initialSnapshot) {
      roleStore.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...snap, refresh: () => roleStore.load() };
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

export interface CreateOrgResult {
  org: Organization;
  invite_sent: boolean;
  schema_exposed: boolean;
  manual_steps: string[];
}

/** One-click create: provisions the per-org schema, uploads the logo, invites
 *  the admin. Posts multipart/form-data so the logo file can ride along. */
export const createOrganization = (fd: FormData) =>
  ok<CreateOrgResult>(fetch("/api/admin/orgs", { method: "POST", credentials: "include", body: fd }));

/** Re-run provisioning (schema + exposure) for a failed/pending org. */
export const reprovisionOrganization = (id: string) =>
  ok<{ org: Organization; schema_exposed: boolean; manual_steps: string[] }>(
    fetch(`/api/admin/orgs/${id}`, { method: "POST", credentials: "include" }),
  );

// ── Schema-name sanitizer (mirrors public.sanitize_schema_name in SQL) ───────
export function sanitizeSchemaName(raw: string): string {
  let s = (raw ?? "").toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!s) return "";
  if (/^[0-9]/.test(s)) s = "o_" + s;
  return s.slice(0, 48);
}

const RESERVED_SCHEMAS = new Set([
  "public", "auth", "storage", "graphql", "graphql_public", "realtime",
  "vault", "extensions", "pgsodium", "information_schema",
]);

export function schemaNameError(s: string): string | null {
  if (!s) return "Enter a name to derive the schema.";
  if (RESERVED_SCHEMAS.has(s) || s.startsWith("pg_")) return `"${s}" is a reserved schema name.`;
  if (!/^[a-z][a-z0-9_]*$/.test(s)) return "Schema must be lowercase letters, digits, underscores.";
  return null;
}

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
