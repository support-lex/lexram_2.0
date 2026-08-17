// User-facing: submit a new org-join request (4-section onboarding form).
import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

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

  /* One pending request at a time per user. */
  const { count: pendingCount } = await sb
    .from("tsr_org_requests")
    .select("*", { count: "exact", head: true })
    .eq("requested_by", ctx.user_id)
    .eq("status", "pending");
  if ((pendingCount ?? 0) > 0) {
    return NextResponse.json({ error: "You already have a pending request. Wait for LexRam to review it." }, { status: 409 });
  }

  /* Normalise + clamp the AI / operational fields. Anything we don't
     recognise is silently dropped. */
  const primaryBanks = Array.isArray(body.primary_banks_served)
    ? (body.primary_banks_served as unknown[]).filter((x) => typeof x === "string").slice(0, 30) as string[]
    : [];

  const allowedVolumes = new Set(["0-50", "50-200", "200-500", "500+"]);
  const rawVolume = typeof body.estimated_monthly_volume === "string" ? body.estimated_monthly_volume : "";
  const estimated_monthly_volume = allowedVolumes.has(rawVolume) ? rawVolume : null;

  const allowedLanguages = new Set(["English", "Bilingual (English + Tamil)", "Bilingual (English + Hindi)", "Other"]);
  const rawLang = typeof body.default_language === "string" ? body.default_language : "";
  const default_language = allowedLanguages.has(rawLang) ? rawLang : "English";

  const insertPayload = {
    requested_by: ctx.user_id,
    organization_name,
    organization_type: trimOrNull(body.organization_type),
    entity_type:       trimOrNull(body.entity_type),
    office_website:    trimOrNull(body.office_website),
    contact_name,
    contact_email,
    contact_phone:     trimOrNull(body.contact_phone),
    address:           trimOrNull(body.address),
    gstin:             trimOrNull(body.gstin),
    organization_pan:  trimOrNull(body.organization_pan),
    billing_email:     trimOrNull(body.billing_email)?.toLowerCase() ?? null,
    primary_banks_served: primaryBanks,
    default_language,
    estimated_monthly_volume,
    team_size:    Math.max(1, Math.min(500, Number(body.team_size ?? 1))),
    team_details: Array.isArray(body.team_details) ? body.team_details : [],
    notes:        trimOrNull(body.notes),
  };

  const { data, error } = await sb
    .from("tsr_org_requests")
    .insert(insertPayload)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
