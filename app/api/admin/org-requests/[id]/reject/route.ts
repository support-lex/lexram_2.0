// Super-admin rejects a pending org request with a reason.
import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, ctxParams: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionCtx();
  if (!ctx?.is_super) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctxParams.params;

  let body: { reason?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const reason = (body.reason ?? "").trim();

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("tsr_org_requests")
    .update({
      status:          "rejected",
      reviewed_by:     ctx.user_id,
      reviewed_at:     new Date().toISOString(),
      decision_reason: reason || null,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: "Request not pending" }, { status: 409 });
  return NextResponse.json(data);
}
