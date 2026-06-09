// Org-admin invite endpoint.
import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function canManage(orgId: string, userId: string, isSuper: boolean) {
  if (isSuper) return true;
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("organization_members")
    .select("role, status")
    .eq("org_id", orgId).eq("user_id", userId).maybeSingle();
  return !!(data && data.role === "admin" && data.status === "active");
}

export async function POST(req: NextRequest) {
  const ctx = await getSessionCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let body: { org_id?: string; email?: string; name?: string; role?: "admin" | "member" } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const org_id = (body.org_id ?? "").trim();
  const email  = (body.email ?? "").trim().toLowerCase();
  const name   = (body.name ?? "").trim();
  const role   = body.role === "admin" ? "admin" : "member";
  if (!org_id || !email) return NextResponse.json({ error: "org_id and email are required" }, { status: 400 });

  if (!(await canManage(org_id, ctx.user_id, ctx.is_super))) {
    return NextResponse.json({ error: "Only the organisation admin can invite members." }, { status: 403 });
  }

  const sb = supabaseAdmin();

  const [{ data: org }, { count: seatsUsed }] = await Promise.all([
    sb.from("organizations").select("id, seat_limit, status").eq("id", org_id).maybeSingle(),
    sb.from("organization_members").select("*", { count: "exact", head: true }).eq("org_id", org_id).neq("status", "suspended"),
  ]);
  if (!org) return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  if (org.status === "suspended") return NextResponse.json({ error: "Organisation is suspended" }, { status: 403 });
  if ((seatsUsed ?? 0) >= org.seat_limit) {
    return NextResponse.json({ error: "Seat limit reached. Contact LexRam to add more seats." }, { status: 409 });
  }

  const { data: { users } } = await sb.auth.admin.listUsers();
  let user_id = users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
  let invite_sent = false;
  if (!user_id) {
    const { data: invited, error: invErr } = await sb.auth.admin.inviteUserByEmail(email, { data: { name, role_hint: role } });
    if (invErr) return NextResponse.json({ error: `Invite email failed: ${invErr.message}` }, { status: 502 });
    user_id = invited.user?.id ?? null;
    invite_sent = true;
  }
  if (!user_id) return NextResponse.json({ error: "Could not resolve user" }, { status: 500 });

  /* Single-org constraint — suspend prior memberships in OTHER orgs */
  await sb.from("organization_members")
    .update({ status: "suspended" })
    .eq("user_id", user_id).neq("status", "suspended").neq("org_id", org_id);

  const { data: member, error } = await sb
    .from("organization_members")
    .upsert({
      org_id, user_id, role,
      status: invite_sent ? "invited" : "active",
      invited_by: ctx.user_id, invited_email: email, invited_name: name || email.split("@")[0],
    }, { onConflict: "user_id" })
    .select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: member.id, org_id: member.org_id, user_id: member.user_id,
    email: member.invited_email, name: member.invited_name,
    role: member.role, status: member.status,
    joined_at: member.joined_at, last_active_at: member.last_active_at,
    case_count: 0,
  });
}
