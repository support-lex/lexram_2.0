// Super-admin orgs endpoint. Auth: app_metadata.role === 'super_admin'.
//   GET  — list orgs + seat/case/token stats
//   POST — one-click create: per-org schema (avr.cases/documents) + logo upload
//          + full config + admin invite. Posts multipart/form-data.

import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

function slugify(name: string): string {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base || `org-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeSchema(raw: string): string {
  let s = (raw ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (s && /^[0-9]/.test(s)) s = "o_" + s;
  return s.slice(0, 48);
}

const RESERVED = new Set([
  "public", "auth", "storage", "graphql", "graphql_public", "realtime",
  "vault", "extensions", "pgsodium", "information_schema",
]);
const PLANS = ["trial", "standard", "enterprise"] as const;

export async function GET() {
  const ctx = await getSessionCtx();
  if (!ctx?.is_super) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = supabaseAdmin();
  const { data: orgs, error } = await sb
    .from("organizations")
    .select("id, name, slug, plan, status, seat_limit, admin_email, admin_name, created_at, schema_name, logo_url, provision_status")
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

  let fd: FormData;
  try { fd = await req.formData(); } catch { return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 }); }
  const str = (k: string) => (fd.get(k) ?? "").toString().trim();

  const name        = str("name");
  const admin_email = str("admin_email").toLowerCase();
  const admin_name  = str("admin_name");
  const plan        = (str("plan") || "standard") as (typeof PLANS)[number];
  const seat_limit  = Math.max(1, Math.min(500, parseInt(str("seat_limit") || "10", 10)));
  const schema_name = sanitizeSchema(str("schema_name") || name);

  if (!name || !admin_email || !admin_name) {
    return NextResponse.json({ error: "name, admin_name and admin_email are required" }, { status: 400 });
  }
  if (!PLANS.includes(plan)) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  if (!schema_name || RESERVED.has(schema_name) || schema_name.startsWith("pg_") || !/^[a-z][a-z0-9_]*$/.test(schema_name)) {
    return NextResponse.json({ error: `Invalid schema name "${schema_name}"` }, { status: 400 });
  }

  let banks: string[] = [];
  try { banks = JSON.parse(str("primary_banks_served") || "[]"); } catch { banks = []; }

  const sb = supabaseAdmin();

  /* 1. schema_name unique */
  const { data: clash } = await sb.from("organizations").select("id").eq("schema_name", schema_name).maybeSingle();
  if (clash) return NextResponse.json({ error: `Schema "${schema_name}" is already taken` }, { status: 409 });

  /* 2. Logo upload (optional) */
  let logo_url: string | null = null;
  const logo = fd.get("logo");
  if (logo && logo instanceof File && logo.size > 0) {
    const ext = (logo.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const path = `${schema_name}/logo.${ext}`;
    const buf = Buffer.from(await logo.arrayBuffer());
    const { error: upErr } = await sb.storage.from("org-logos").upload(path, buf, { contentType: logo.type || "image/png", upsert: true });
    if (upErr) return NextResponse.json({ error: `Logo upload failed: ${upErr.message}` }, { status: 502 });
    logo_url = sb.storage.from("org-logos").getPublicUrl(path).data.publicUrl;
  }

  /* 3. Insert org row (provision_status='pending') */
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: org, error: orgErr } = await sb
    .from("organizations")
    .insert({
      name, slug, schema_name, logo_url, plan, status: "active", seat_limit,
      account_type: "organization", admin_email, admin_name,
      entity_type: str("entity_type") || null,
      organization_pan: str("organization_pan") || null,
      gstin: str("gstin") || null,
      address: str("address") || null,
      billing_email: str("billing_email") || null,
      office_website: str("office_website") || null,
      primary_banks_served: banks,
      default_language: str("default_language") || "English",
      estimated_monthly_volume: str("estimated_monthly_volume") || null,
      provision_status: "pending",
      created_by: ctx.user_id,
    })
    .select("*").single();
  if (orgErr || !org) {
    return NextResponse.json({ error: orgErr?.message ?? "Could not create organisation" }, { status: 500 });
  }

  /* 4. Provision the per-org schema + tables */
  const { error: provErr } = await sb.rpc("provision_org_schema", { p_schema: schema_name });
  if (provErr) {
    await sb.from("organizations").update({ provision_status: "failed", provision_error: provErr.message }).eq("id", org.id);
    return NextResponse.json({ error: `Schema provisioning failed: ${provErr.message}`, org_id: org.id }, { status: 500 });
  }

  /* 5. Best-effort PostgREST exposure */
  const manual_steps: string[] = [];
  const { data: exposed } = await sb.rpc("expose_org_schema", { p_schema: schema_name });
  const schema_exposed = exposed === true;
  if (!schema_exposed) {
    manual_steps.push(`Add "${schema_name}" under Supabase → Settings → API → Exposed schemas, then reload the schema cache.`);
  }

  /* 6. Resolve / invite admin */
  const { data: list } = await sb.auth.admin.listUsers();
  let admin_user_id = list.users.find((u) => u.email?.toLowerCase() === admin_email)?.id ?? null;
  let invite_sent = false;
  if (!admin_user_id) {
    const { data: invited, error: invErr } = await sb.auth.admin.inviteUserByEmail(admin_email, { data: { name: admin_name, role_hint: "org_admin" } });
    if (invErr) {
      manual_steps.push(`Admin invite email failed: ${invErr.message}. Re-invite from the org page.`);
    } else {
      admin_user_id = invited.user?.id ?? null;
      invite_sent = true;
    }
  }

  /* 7. Admin membership (single-org: suspend any prior) */
  if (admin_user_id) {
    await sb.from("organization_members").update({ status: "suspended" }).eq("user_id", admin_user_id).neq("status", "suspended");
    await sb.from("organization_members").insert({
      org_id: org.id, user_id: admin_user_id, role: "admin",
      status: invite_sent ? "invited" : "active",
      invited_by: ctx.user_id, invited_email: admin_email, invited_name: admin_name,
    });
  }

  /* 8. Mark provisioned */
  const { data: finalOrg } = await sb.from("organizations")
    .update({ provision_status: "provisioned", provision_error: null, provisioned_at: new Date().toISOString() })
    .eq("id", org.id).select("*").single();

  return NextResponse.json({ org: finalOrg ?? org, invite_sent, schema_exposed, manual_steps });
}
