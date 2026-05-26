// Super-admin orgs endpoint. Auth: app_metadata.role === 'super_admin'.

import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

function slugify(name: string): string {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base || `org-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  const ctx = await getSessionCtx();
  if (!ctx?.is_super) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = supabaseAdmin();
  const { data: orgs, error } = await sb
    .from("organizations")
    .select("id, name, slug, plan, status, seat_limit, admin_email, admin_name, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const [{ data: caseAgg }, { data: memberAgg }] = await Promise.all([
    sb.from("tsr_clients").select("org_id, token_usage"),
    sb.from("organization_members").select("org_id, status"),
  ]);

  const casesByOrg: Record<string, { count: number; tokens: number }> = {};
  for (const row of caseAgg ?? []) {
    if (!row.org_id) continue;
    const u = (row.token_usage ?? null) as { total_tokens?: number } | null;
    const t = casesByOrg[row.org_id] ?? { count: 0, tokens: 0 };
    t.count += 1; t.tokens += u?.total_tokens ?? 0;
    casesByOrg[row.org_id] = t;
  }
  const seatsByOrg: Record<string, number> = {};
  for (const row of memberAgg ?? []) {
    if (row.status === "suspended") continue;
    seatsByOrg[row.org_id] = (seatsByOrg[row.org_id] ?? 0) + 1;
  }

  const enriched = (orgs ?? []).map((o) => ({
    ...o,
    seats_used:   seatsByOrg[o.id] ?? 0,
    total_cases:  casesByOrg[o.id]?.count ?? 0,
    total_tokens: casesByOrg[o.id]?.tokens ?? 0,
  }));
  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const ctx = await getSessionCtx();
  if (!ctx?.is_super) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { name?: string; admin_email?: string; admin_name?: string; plan?: string; seat_limit?: number } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name        = (body.name ?? "").trim();
  const admin_email = (body.admin_email ?? "").trim().toLowerCase();
  const admin_name  = (body.admin_name ?? "").trim();
  const plan        = (body.plan ?? "trial") as "trial" | "standard" | "enterprise";
  const seat_limit  = Math.max(1, Math.min(500, body.seat_limit ?? 5));

  if (!name || !admin_email || !admin_name) {
    return NextResponse.json({ error: "name, admin_email and admin_name are required" }, { status: 400 });
  }
  if (!["trial", "standard", "enterprise"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  /* 1. Resolve admin auth.user (invite if new) */
  const { data: existingByEmail } = await sb.auth.admin.listUsers();
  let admin_user_id = existingByEmail.users.find((u) => u.email?.toLowerCase() === admin_email)?.id ?? null;
  let invite_sent = false;

  if (!admin_user_id) {
    const { data: invited, error: invErr } = await sb.auth.admin.inviteUserByEmail(admin_email, {
      data: { name: admin_name, role_hint: "org_admin" },
    });
    if (invErr) {
      return NextResponse.json(
        { error: `Invite email failed: ${invErr.message}. Check supabase SMTP config.` },
        { status: 502 },
      );
    }
    admin_user_id = invited.user?.id ?? null;
    invite_sent = true;
  }
  if (!admin_user_id) return NextResponse.json({ error: "Could not resolve admin user" }, { status: 500 });

  /* 2. Single-org constraint — suspend prior membership if any */
  await sb.from("organization_members")
    .update({ status: "suspended" })
    .eq("user_id", admin_user_id)
    .neq("status", "suspended");

  /* 3. Insert org */
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: org, error: orgErr } = await sb
    .from("organizations")
    .insert({ name, slug, plan, status: "active", seat_limit, admin_email, admin_name, created_by: ctx.user_id })
    .select("*").single();
  if (orgErr || !org) {
    return NextResponse.json({ error: orgErr?.message ?? "Could not create organisation" }, { status: 500 });
  }

  /* 4. Insert admin membership */
  const { error: memberErr } = await sb
    .from("organization_members")
    .insert({
      org_id:        org.id,
      user_id:       admin_user_id,
      role:          "admin",
      status:        invite_sent ? "invited" : "active",
      invited_by:    ctx.user_id,
      invited_email: admin_email,
      invited_name:  admin_name,
    });
  if (memberErr) {
    await sb.from("organizations").delete().eq("id", org.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  return NextResponse.json({ org, invite_sent });
}
