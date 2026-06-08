// Org-admin list-members endpoint (per org id). Service-role reads email/name
// from auth.users. Ported from lexram.
import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function assertCanRead(orgId: string, ctxUserId: string, isSuper: boolean) {
  if (isSuper) return true;
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("organization_members").select("role, status")
    .eq("org_id", orgId).eq("user_id", ctxUserId).maybeSingle();
  return !!(data && data.role === "admin" && data.status === "active");
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ orgId: string }> }) {
  const s = await getSessionCtx();
  if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { orgId } = await ctx.params;
  if (!(await assertCanRead(orgId, s.user_id, s.is_super))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sb = supabaseAdmin();
  const { data: rows, error } = await sb
    .from("organization_members")
    .select("id, org_id, user_id, role, status, invited_email, invited_name, joined_at, last_active_at")
    .eq("org_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = (rows ?? []).map((m) => m.user_id);
  const userById: Record<string, { email: string | null; name: string | null }> = {};
  if (userIds.length > 0) {
    const { data: { users } } = await sb.auth.admin.listUsers();
    for (const u of users) {
      if (userIds.includes(u.id)) {
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        userById[u.id] = { email: u.email ?? null, name: (meta.name as string) ?? (meta.full_name as string) ?? null };
      }
    }
  }
  let counts: Record<string, number> = {};
  if (userIds.length > 0) {
    const { data: caseRows } = await sb.from("tsr_clients").select("user_id").in("user_id", userIds);
    counts = (caseRows ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.user_id] = (acc[r.user_id] ?? 0) + 1; return acc;
    }, {});
  }

  return NextResponse.json((rows ?? []).map((m) => ({
    id: m.id, org_id: m.org_id, user_id: m.user_id,
    email: userById[m.user_id]?.email ?? m.invited_email ?? "",
    name: userById[m.user_id]?.name ?? m.invited_name ?? (m.invited_email ?? "").split("@")[0] ?? "",
    role: m.role, status: m.status,
    joined_at: m.joined_at, last_active_at: m.last_active_at, case_count: counts[m.user_id] ?? 0,
  })));
}
