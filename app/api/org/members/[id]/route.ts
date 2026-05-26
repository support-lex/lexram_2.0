// Mutate / remove a member. Auth: admin of the row's org OR super_admin.
import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function loadAndAuth(memberId: string, ctxUserId: string, isSuper: boolean) {
  const sb = supabaseAdmin();
  const { data: row } = await sb
    .from("organization_members")
    .select("id, org_id, user_id, role").eq("id", memberId).maybeSingle();
  if (!row) return { error: NextResponse.json({ error: "Member not found" }, { status: 404 }) };

  if (!isSuper) {
    const { data: me } = await sb
      .from("organization_members")
      .select("role, status")
      .eq("org_id", row.org_id).eq("user_id", ctxUserId).maybeSingle();
    if (!me || me.role !== "admin" || me.status !== "active") {
      return { error: NextResponse.json({ error: "Only the organisation admin can manage members." }, { status: 403 }) };
    }
    if (row.user_id === ctxUserId) {
      return { error: NextResponse.json({ error: "You can't modify your own admin record." }, { status: 400 }) };
    }
  }
  return { row };
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSessionCtx();
  if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await ctx.params;
  const a = await loadAndAuth(id, s.user_id, s.is_super);
  if ("error" in a) return a.error;

  let body: Partial<{ role: "admin" | "member"; status: "active" | "invited" | "suspended" }> = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const patch: Record<string, unknown> = {};
  if (body.role === "admin" || body.role === "member") patch.role = body.role;
  if (body.status === "active" || body.status === "invited" || body.status === "suspended") patch.status = body.status;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data, error } = await sb.from("organization_members").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSessionCtx();
  if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await ctx.params;
  const a = await loadAndAuth(id, s.user_id, s.is_super);
  if ("error" in a) return a.error;

  const sb = supabaseAdmin();
  const { error } = await sb.from("organization_members").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
