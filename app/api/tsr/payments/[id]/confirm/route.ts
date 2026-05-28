// POST /api/tsr/payments/[id]/confirm
//
// Called from the browser after Cashfree returns paymentDetails.
// Flips the row to status='success' and stamps paid_at + cashfree_payment_id.
// Returns the full payment record so the client can render the invoice.

import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  let body: { cashfree_payment_id?: string } = {};
  try { body = await req.json(); } catch { /* optional body */ }

  const sb = supabaseAdmin();

  const { data: payment, error: getErr } = await sb
    .from("tsr_payments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (getErr || !payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.user_id !== ctx.user_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (payment.status === "success") {
    return NextResponse.json(payment);
  }

  const { data: updated, error: updErr } = await sb
    .from("tsr_payments")
    .update({
      status: "success",
      paid_at: new Date().toISOString(),
      cashfree_payment_id: body.cashfree_payment_id ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (updErr || !updated) return NextResponse.json({ error: updErr?.message ?? "Update failed" }, { status: 500 });

  return NextResponse.json(updated);
}
