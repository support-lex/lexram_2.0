// POST /api/tsr/payments
//
// Starts a TSR report payment. Creates a Cashfree order via the credits
// backend (CREDITS_API_URL) and records a 'pending' row in tsr_payments
// tagged to a specific case. Client opens Cashfree checkout with the
// returned payment_session_id, then calls POST /api/tsr/payments/[id]/confirm
// when the gateway reports success.
//
// Body: { case_id: uuid }
// Resp: {
//   payment_id: uuid,           // row in tsr_payments
//   order_id: string,           // Cashfree order id
//   payment_session_id: string, // pass to cashfree.checkout()
//   amount_inr: number,
//   currency: 'INR',
// }

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

  // Verify the case belongs to the requesting user.
  const { data: caseRow, error: caseErr } = await sb
    .from("tsr_clients")
    .select("id, user_id, case_name")
    .eq("id", caseId)
    .maybeSingle();
  if (caseErr || !caseRow) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (caseRow.user_id !== ctx.user_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Find the user's org to determine pricing (individual vs organization).
  const { data: membership } = await sb
    .from("organization_members")
    .select("org_id, organizations:org_id ( id, account_type )")
    .eq("user_id", ctx.user_id)
    .maybeSingle();
  type OrgLite = { id: string; account_type: "individual" | "organization" };
  const orgRaw = (membership as { organizations: OrgLite | OrgLite[] | null } | null)?.organizations ?? null;
  const org = Array.isArray(orgRaw) ? orgRaw[0] ?? null : orgRaw;
  if (!org) return NextResponse.json({ error: "No organisation membership" }, { status: 403 });

  const amount_inr = org.account_type === "individual" ? PRICE_INDIVIDUAL : PRICE_ENTERPRISE;

  // ── Sandbox short-circuit ────────────────────────────────────────────────
  // NEXT_PUBLIC_CASHFREE_MODE=sandbox is set on the lexram-2-0-ui testing
  // project so we can exercise the post-payment flow without burning real
  // money or coordinating with the credits backend. We skip Cashfree entirely
  // and insert a row already marked 'success'. The modal also skips the
  // checkout step in this mode. Production lexram.ai leaves the env var
  // unset, so the real Cashfree path below runs as normal.
  if (process.env.NEXT_PUBLIC_CASHFREE_MODE === "sandbox") {
    const stamp = Date.now().toString(36);
    const rand  = Math.random().toString(36).slice(2, 8);
    const sandboxOrderId = `test_${stamp}_${rand}`;
    const { data: pay, error: payErr } = await sb
      .from("tsr_payments")
      .insert({
        user_id: ctx.user_id,
        org_id: org.id,
        case_id: caseId,
        amount_inr,
        currency: "INR",
        order_id: sandboxOrderId,
        payment_session_id: "SANDBOX_NO_SESSION",
        status: "success",
        paid_at: new Date().toISOString(),
        cashfree_payment_id: `test_cf_${rand}`,
        user_email: ctx.email ?? null,
        user_phone: null,
      })
      .select("id, order_id, payment_session_id, amount_inr, currency")
      .single();
    if (payErr || !pay) {
      return NextResponse.json({ error: payErr?.message ?? "Sandbox row insert failed" }, { status: 500 });
    }
    return NextResponse.json({
      payment_id: pay.id,
      order_id: pay.order_id,
      payment_session_id: pay.payment_session_id,
      amount_inr: pay.amount_inr,
      currency: pay.currency,
      sandbox: true,
    });
  }

  // Get a user-side access token to forward to the credits backend.
  const auth = req.headers.get("Authorization") ?? "";

  // Look up the user's phone for Cashfree (required field).
  const { data: { user } } = await sb.auth.admin.getUserById(ctx.user_id);
  const phone = (user?.phone ?? user?.user_metadata?.phone ?? "").toString();
  if (!phone) return NextResponse.json({ error: "Phone number missing on profile" }, { status: 400 });

  // Ask the credits backend to mint a Cashfree session.
  let order: { order_id: string; payment_session_id: string; amount: number; currency: string };
  try {
    const res = await fetch(`${CREDITS_API}/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
      body: JSON.stringify({ amount_inr, user_email: ctx.email ?? "", user_phone: phone }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => `HTTP ${res.status}`);
      return NextResponse.json({ error: `Gateway error: ${detail.slice(0, 240)}` }, { status: 502 });
    }
    order = await res.json();
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      { error: timedOut ? "Payment gateway timed out. Please try again." : err instanceof Error ? err.message : "Gateway unreachable" },
      { status: 502 }
    );
  }

  // Persist a pending tsr_payments row tied to this case.
  const { data: pay, error: payErr } = await sb
    .from("tsr_payments")
    .insert({
      user_id: ctx.user_id,
      org_id: org.id,
      case_id: caseId,
      amount_inr,
      currency: order.currency || "INR",
      order_id: order.order_id,
      payment_session_id: order.payment_session_id,
      status: "pending",
      user_email: ctx.email ?? null,
      user_phone: phone,
    })
    .select("id, order_id, payment_session_id, amount_inr, currency")
    .single();
  if (payErr || !pay) {
    return NextResponse.json({ error: payErr?.message ?? "Could not record payment" }, { status: 500 });
  }

  return NextResponse.json({
    payment_id: pay.id,
    order_id: pay.order_id,
    payment_session_id: pay.payment_session_id,
    amount_inr: pay.amount_inr,
    currency: pay.currency,
  });
}
