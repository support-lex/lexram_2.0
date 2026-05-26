// User-facing: submit a new org-join request.
import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const ctx = await getSessionCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const organization_name = String(body.organization_name ?? "").trim();
  const contact_name      = String(body.contact_name ?? "").trim();
  const contact_email     = String(body.contact_email ?? "").trim().toLowerCase();
  if (!organization_name || !contact_name || !contact_email) {
    return NextResponse.json({ error: "organization_name, contact_name and contact_email are required" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  /* Don't allow two pending requests at once — keep the queue tidy. */
  const { count: pendingCount } = await sb
    .from("tsr_org_requests")
    .select("*", { count: "exact", head: true })
    .eq("requested_by", ctx.user_id)
    .eq("status", "pending");
  if ((pendingCount ?? 0) > 0) {
    return NextResponse.json({ error: "You already have a pending request. Wait for Lexram to review it." }, { status: 409 });
  }

  const { data, error } = await sb
    .from("tsr_org_requests")
    .insert({
      requested_by:      ctx.user_id,
      organization_name,
      organization_type: typeof body.organization_type === "string" ? body.organization_type.trim() || null : null,
      contact_name,
      contact_email,
      contact_phone:     typeof body.contact_phone === "string" ? body.contact_phone.trim() || null : null,
      address:           typeof body.address === "string" ? body.address.trim() || null : null,
      gstin:             typeof body.gstin === "string" ? body.gstin.trim() || null : null,
      team_size:         Math.max(1, Math.min(500, Number(body.team_size ?? 1))),
      team_details:      Array.isArray(body.team_details) ? body.team_details : [],
      notes:             typeof body.notes === "string" ? body.notes.trim() || null : null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
