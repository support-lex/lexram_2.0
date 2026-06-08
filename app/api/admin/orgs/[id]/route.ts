// Super-admin per-org endpoint.
import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSessionCtx();
  if (!s?.is_super) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const sb = supabaseAdmin();
  const { data: org, error: orgErr } = await sb
    .from("organizations")
    .select("*")
    .eq("id", id).maybeSingle();
  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 });
  if (!org)   return NextResponse.json({ error: "Organisation not found" }, { status: 404 });

  const { data: memberRows, error: memErr } = await sb
    .from("organization_members")
    .select("id, org_id, user_id, role, status, invited_email, invited_name, joined_at, last_active_at")
    .eq("org_id", id);
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

  const userIds = (memberRows ?? []).map((m) => m.user_id);
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

  const { data: cases } = await sb.from("tsr_clients").select("user_id, token_usage").eq("org_id", id);
  const caseCountByUser: Record<string, number> = {};
  let total_cases = 0, total_tokens = 0;
  for (const c of cases ?? []) {
    caseCountByUser[c.user_id] = (caseCountByUser[c.user_id] ?? 0) + 1;
    total_cases += 1;
    total_tokens += (c.token_usage as { total_tokens?: number } | null)?.total_tokens ?? 0;
  }

  const members = (memberRows ?? []).map((m) => ({
    id: m.id, org_id: m.org_id, user_id: m.user_id,
    email: userById[m.user_id]?.email ?? m.invited_email ?? "",
    name:  userById[m.user_id]?.name  ?? m.invited_name  ?? (m.invited_email ?? "").split("@")[0] ?? "",
    role: m.role, status: m.status,
    joined_at: m.joined_at, last_active_at: m.last_active_at,
    case_count: caseCountByUser[m.user_id] ?? 0,
  }));

  const seats_used = members.filter((m) => m.status !== "suspended").length;
  return NextResponse.json({ org: { ...org, seats_used, total_cases, total_tokens }, members });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSessionCtx();
  if (!s?.is_super) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  let body: Partial<{ status: "active" | "suspended"; plan: string; seat_limit: number; name: string }> = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const patch: Record<string, unknown> = {};
  if (body.status === "active" || body.status === "suspended") patch.status = body.status;
  if (body.plan && ["trial", "standard", "enterprise"].includes(body.plan)) patch.plan = body.plan;
  if (typeof body.seat_limit === "number") patch.seat_limit = Math.max(1, Math.min(500, body.seat_limit));
  if (typeof body.name === "string" && body.name.trim().length > 0) patch.name = body.name.trim();
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data, error } = await sb.from("organizations").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Re-run provisioning (schema + exposure) for a failed/pending org.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSessionCtx();
  if (!s?.is_super) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const sb = supabaseAdmin();
  const { data: org } = await sb.from("organizations").select("id, schema_name").eq("id", id).maybeSingle();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!org.schema_name) return NextResponse.json({ error: "Org has no schema_name" }, { status: 400 });

  const { error: provErr } = await sb.rpc("provision_org_schema", { p_schema: org.schema_name });
  if (provErr) {
    await sb.from("organizations").update({ provision_status: "failed", provision_error: provErr.message }).eq("id", id);
    return NextResponse.json({ error: `Provisioning failed: ${provErr.message}` }, { status: 500 });
  }

  const manual_steps: string[] = [];
  const { data: exposed } = await sb.rpc("expose_org_schema", { p_schema: org.schema_name });
  const schema_exposed = exposed === true;
  if (!schema_exposed) {
    manual_steps.push(`Add "${org.schema_name}" under Supabase → Settings → API → Exposed schemas, then reload the schema cache.`);
  }

  const { data: finalOrg } = await sb.from("organizations")
    .update({ provision_status: "provisioned", provision_error: null, provisioned_at: new Date().toISOString() })
    .eq("id", id).select("*").single();

  return NextResponse.json({ org: finalOrg, schema_exposed, manual_steps });
}
