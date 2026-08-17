// Client-side helpers for the team page → tenant member API routes.

export type MemberRole = "admin" | "member";
export type MemberStatus = "active" | "invited" | "suspended";

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  email: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
  last_active_at: string | null;
  case_count: number;
}

async function ok<T>(p: Promise<Response>): Promise<T> {
  const res = await p;
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(msg.slice(0, 240));
  }
  return res.json() as Promise<T>;
}

export const listMyOrgMembers = (orgId: string) =>
  ok<OrganizationMember[]>(fetch(`/api/org/${orgId}/members`, { credentials: "include" }));

export const inviteMember = (payload: { org_id: string; email: string; name: string; role: MemberRole }) =>
  ok<OrganizationMember>(fetch("/api/org/members", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));

export const updateMember = (id: string, payload: Partial<Pick<OrganizationMember, "role" | "status">>) =>
  ok<OrganizationMember>(fetch(`/api/org/members/${id}`, {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }));

export const removeMember = async (id: string) => {
  const res = await fetch(`/api/org/members/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
};

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const DAY = 86_400_000;
  const days = Math.floor(diff / DAY);
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
