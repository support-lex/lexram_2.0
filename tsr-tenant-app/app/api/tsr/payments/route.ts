// POST /api/tsr/payments — start a TSR report payment (ported from lexram).
// Verifies the case in public.tsr_clients (the per-org app dual-writes a shadow
// row there so this lookup + the AI backend both resolve the case). Records a
// row in public.tsr_payments (payments stay central).

import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CREDITS_API = process.env.CREDITS_API_URL || "http://157.245.106.223:8124";
const PRICE_INDIVIDUAL = 1000;
const PRICE_ENTERPRISE = 500;

export async function POST(req: NextRequest) {
  const ctx = await getSessionCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let body: { case_id?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const caseId = (body.case_id ?? "").trim();
  if (!caseId) return NextResponse.json({ error: "case_id is required" }, { status: 400 });

  const sb = supabaseAdmin();

  const { data: caseRow, error: caseErr } = await sb
    .from("tsr_clients").select("id, user_id, case_name").eq("id", caseId).maybeSingle();
  if (caseErr || !caseRow) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (caseRow.user_id !== ctx.user_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: membership } = await sb
    .from("organization_members")
    .select("org_id, organizations:org_id ( id, account_type )")
    .eq("user_id", ctx.user_id).maybeSingle();
  type OrgLite = { id: string; account_type: "individual" | "organization" };
  const orgRaw = (membership as { organizations: OrgLite | OrgLite[] | null } | null)?.organizations ?? null;
  const org = Array.isArray(orgRaw) ? orgRaw[0] ?? null : orgRaw;
  if (!org) return NextResponse.json({ error: "No organisation membership" }, { status: 403 });

  const amount_inr = org.account_type === "individual" ? PRICE_INDIVIDUAL : PRICE_ENTERPRISE;

  if (process.env.NEXT_PUBLIC_CASHFREE_MODE === "sandbox") {
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    const { data: pay, error: payErr } = await sb
      .from("tsr_payments")
      .insert({
        user_id: ctx.user_id, org_id: org.id, case_id: caseId, amount_inr, currency: "INR",
        order_id: `test_${stamp}_${rand}`, payment_session_id: "SANDBOX_NO_SESSION",
        status: "success", paid_at: new Date().toISOString(),
        cashfree_payment_id: `test_cf_${rand}`, user_email: ctx.email ?? null, user_phone: null,
      })
      .select("id, order_id, payment_session_id, amount_inr, currency").single();
    if (payErr || !pay) return NextResponse.json({ error: payErr?.message ?? "Sandbox row insert failed" }, { status: 500 });
    return NextResponse.json({ payment_id: pay.id, order_id: pay.order_id, payment_session_id: pay.payment_session_id, amount_inr: pay.amount_inr, currency: pay.currency, sandbox: true });
  }

  const auth = req.headers.get("Authorization") ?? "";
  const { data: { user } } = await sb.auth.admin.getUserById(ctx.user_id);
  const phone = (user?.phone ?? user?.user_metadata?.phone ?? "").toString();
  if (!phone) return NextResponse.json({ error: "Phone number missing on profile" }, { status: 400 });

  let order: { order_id: string; payment_session_id: string; amount: number; currency: string };
  try {
    const res = await fetch(`${CREDITS_API}/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
      body: JSON.stringify({ amount_inr, user_email: ctx.email ?? "", user_phone: phone }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => `HTTP ${res.status}`);
      return NextResponse.json({ error: `Gateway error: ${detail.slice(0, 240)}` }, { status: 502 });
    }
    order = await res.json();
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gateway unreachable" }, { status: 502 });
  }

  const { data: pay, error: payErr } = await sb
    .from("tsr_payments")
    .insert({
      user_id: ctx.user_id, org_id: org.id, case_id: caseId, amount_inr,
      currency: order.currency || "INR", order_id: order.order_id,
      payment_session_id: order.payment_session_id, status: "pending",
      user_email: ctx.email ?? null, user_phone: phone,
    })
    .select("id, order_id, payment_session_id, amount_inr, currency").single();
  if (payErr || !pay) return NextResponse.json({ error: payErr?.message ?? "Could not record payment" }, { status: 500 });

  return NextResponse.json({ payment_id: pay.id, order_id: pay.order_id, payment_session_id: pay.payment_session_id, amount_inr: pay.amount_inr, currency: pay.currency });
}
