// Super-admin approves a pending org request:
//   1. invites the contact_email via supabase auth admin
//   2. creates the organisation row (account_type=organization)
//   3. inserts the admin membership (status='invited' if new user, 'active' if existing)
//   4. marks the request as approved + links approved_org_id
import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

function slugify(name: string): string {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base || `org-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest, ctxParams: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionCtx();
  if (!ctx?.is_super) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctxParams.params;

  let body: { plan?: string; seat_limit?: number } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const plan       = (body.plan ?? "standard") as "trial" | "standard" | "enterprise";
  const seat_limit = Math.max(1, Math.min(500, body.seat_limit ?? 10));

  const sb = supabaseAdmin();

  /* Load the request */
  const { data: reqRow, error: reqErr } = await sb
    .from("tsr_org_requests").select("*").eq("id", id).maybeSingle();
  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });
  if (!reqRow) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (reqRow.status !== "pending") return NextResponse.json({ error: `Request is already ${reqRow.status}` }, { status: 409 });

  /* Resolve / invite admin auth.user */
  const { data: { users } } = await sb.auth.admin.listUsers();
  let admin_user_id = users.find((u) => u.email?.toLowerCase() === reqRow.contact_email.toLowerCase())?.id ?? null;
  let invite_sent = false;
  if (!admin_user_id) {
    const { data: invited, error: invErr } = await sb.auth.admin.inviteUserByEmail(reqRow.contact_email, {
      data: { name: reqRow.contact_name, role_hint: "org_admin" },
    });
    if (invErr) {
      return NextResponse.json({ error: `Invite email failed: ${invErr.message}` }, { status: 502 });
    }
    admin_user_id = invited.user?.id ?? null;
    invite_sent = true;
  }
  if (!admin_user_id) return NextResponse.json({ error: "Could not resolve admin user" }, { status: 500 });

  /* Suspend any prior membership (single-org constraint) */
  await sb.from("organization_members")
    .update({ status: "suspended" })
    .eq("user_id", admin_user_id)
    .neq("status", "suspended");

  /* Create the org */
  const slug = `${slugify(reqRow.organization_name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: org, error: orgErr } = await sb
    .from("organizations")
    .insert({
      name:         reqRow.organization_name,
      slug,
      plan,
      status:       "active",
      seat_limit,
      account_type: "organization",
      admin_email:  reqRow.contact_email,
      admin_name:   reqRow.contact_name,
      created_by:   ctx.user_id,
    })
    .select("*").single();
  if (orgErr || !org) {
    return NextResponse.json({ error: orgErr?.message ?? "Could not create organisation" }, { status: 500 });
  }

  const { error: memberErr } = await sb
    .from("organization_members")
    .insert({
      org_id:        org.id,
      user_id:       admin_user_id,
      role:          "admin",
      status:        invite_sent ? "invited" : "active",
      invited_by:    ctx.user_id,
      invited_email: reqRow.contact_email,
      invited_name:  reqRow.contact_name,
    });
  if (memberErr) {
    await sb.from("organizations").delete().eq("id", org.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  /* Mark request approved */
  const { data: updated, error: upErr } = await sb
    .from("tsr_org_requests")
    .update({
      status:          "approved",
      reviewed_by:     ctx.user_id,
      reviewed_at:     new Date().toISOString(),
      approved_org_id: org.id,
    })
    .eq("id", id)
    .select("*").single();
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ org, request: updated, invite_sent });
}
