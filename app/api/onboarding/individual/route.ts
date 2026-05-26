// Self-serve "Use as Individual" — creates a 1-seat personal org for the
// caller if they don't already belong to one, and sets them as admin.
// The actual ₹500-per-report payment gate lives at case-creation time (UI).
import { NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const ctx = await getSessionCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const sb = supabaseAdmin();

  /* Already in an org? Just return that — no-op idempotent. */
  const { data: existing } = await sb
    .from("organization_members")
    .select("org_id, organizations:org_id ( id, name, slug, plan, status, seat_limit, admin_email, admin_name, account_type, created_at )")
    .eq("user_id", ctx.user_id)
    .neq("status", "suspended")
    .maybeSingle();
  if (existing?.org_id) {
    const orgRaw = existing.organizations;
    const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
    return NextResponse.json({ org });
  }

  /* Create a personal org for them */
  const slug = `personal-${ctx.user_id.slice(0, 8)}-${Math.random().toString(36).slice(2, 5)}`;
  const name = `Personal — ${ctx.email ?? ctx.user_id}`;

  const { data: org, error: orgErr } = await sb
    .from("organizations")
    .insert({
      name, slug,
      plan:         "trial",
      status:       "active",
      seat_limit:   1,
      account_type: "individual",
      admin_email:  ctx.email,
      admin_name:   ctx.email?.split("@")[0] ?? null,
      created_by:   ctx.user_id,
    })
    .select("*").single();
  if (orgErr || !org) {
    return NextResponse.json({ error: orgErr?.message ?? "Could not create personal org" }, { status: 500 });
  }

  const { error: memberErr } = await sb
    .from("organization_members")
    .insert({
      org_id:        org.id,
      user_id:       ctx.user_id,
      role:          "admin",
      status:        "active",
      invited_email: ctx.email,
      invited_name:  ctx.email?.split("@")[0] ?? null,
    });
  if (memberErr) {
    await sb.from("organizations").delete().eq("id", org.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  return NextResponse.json({ org });
}
