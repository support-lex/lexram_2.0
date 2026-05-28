"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, IndianRupee, ShieldCheck, FileText, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export interface TsrPaymentRecord {
  id: string;
  order_id: string;
  user_id: string;
  case_id: string | null;
  amount_inr: number;
  currency: string;
  status: "pending" | "success" | "failed";
  invoice_no: string;
  cashfree_payment_id: string | null;
  user_email: string | null;
  user_phone: string | null;
  created_at: string;
  paid_at: string | null;
}

interface TsrPaymentModalProps {
  open:    boolean;
  caseId:  string;
  caseName?: string;
  /** Called after Cashfree returns success and our server confirms the row. */
  onSuccess: (payment: TsrPaymentRecord) => void;
  onClose: () => void;
}

interface CreateOrderResponse {
  payment_id:         string;
  order_id:           string;
  payment_session_id: string;
  amount_inr:         number;
  currency:           string;
  /** Set true by /api/tsr/payments when NEXT_PUBLIC_CASHFREE_MODE=sandbox — the
   *  row is already marked 'success' server-side, so the client must skip the
   *  Cashfree checkout step and treat the order as immediately paid. */
  sandbox?:           boolean;
}

export default function TsrPaymentModal({ open, caseId, caseName, onSuccess, onClose }: TsrPaymentModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const isSandbox = process.env.NEXT_PUBLIC_CASHFREE_MODE === "sandbox";

  // Price is driven by the user's org account_type — individual ₹1,000, enterprise ₹500.
  // We resolve it as soon as the modal opens so the "Amount due" reads accurately
  // before the user clicks pay. The server re-validates the price at order time.
  const triggered = useRef(false);

  useEffect(() => {
    if (!open) {
      triggered.current = false;
      setError(null);
      setBusy(false);
      setAmount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const sb = supabase();
        // getSession() reads from localStorage cache — does NOT acquire the
        // auth-token Web Lock, so this won't race the dashboard layout's
        // getUser() and crash the case page with "Lock was stolen".
        const { data: { session } } = await sb.auth.getSession();
        const user = session?.user;
        if (!user) return;
        const { data: m } = await sb
          .from("organization_members")
          .select("organizations:org_id ( account_type )")
          .eq("user_id", user.id)
          .maybeSingle();
        type OrgLite = { account_type: "individual" | "organization" };
        const orgRaw = (m as { organizations: OrgLite | OrgLite[] | null } | null)?.organizations ?? null;
        const org = Array.isArray(orgRaw) ? orgRaw[0] ?? null : orgRaw;
        if (cancelled) return;
        // Default to the enterprise price for super_admins or any unexpected state
        // — keeps the UI honest until the server returns the authoritative figure.
        setAmount(org?.account_type === "individual" ? 1000 : 500);
      } catch (err) {
        // Modal price lookup must never crash the host page.
        console.warn("[TsrPaymentModal] price lookup failed:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const handlePay = useCallback(async () => {
    if (triggered.current) return;
    triggered.current = true;
    setBusy(true);
    setError(null);

    try {
      // Auth header for the credits backend proxy.
      const { data } = await supabase().auth.getSession();
      const token = data.session?.access_token;

      const orderRes = await fetch("/api/tsr/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ case_id: caseId }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({ error: `HTTP ${orderRes.status}` }));
        throw new Error(err.error ?? `HTTP ${orderRes.status}`);
      }
      const order = (await orderRes.json()) as CreateOrderResponse;
      setAmount(order.amount_inr);

      // Sandbox path: server already wrote a row with status='success'. Skip
      // Cashfree entirely and just fetch the final record so the parent can
      // render the invoice + start the pipeline.
      if (order.sandbox) {
        const confirmRes = await fetch(`/api/tsr/payments/${order.payment_id}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        });
        if (!confirmRes.ok) {
          const err = await confirmRes.json().catch(() => ({ error: `HTTP ${confirmRes.status}` }));
          throw new Error(err.error ?? `HTTP ${confirmRes.status}`);
        }
        const payment = (await confirmRes.json()) as TsrPaymentRecord;
        onSuccess(payment);
        return;
      }

      // Production path: open Cashfree checkout with the minted session.
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({ mode: "production" });
      const result = await (cashfree as unknown as {
        checkout: (opts: { paymentSessionId: string; redirectTarget: string }) => Promise<{
          paymentDetails?: { paymentMessage?: string; cf_payment_id?: string | number };
          error?: { message?: string };
        }>;
      }).checkout({
        paymentSessionId: order.payment_session_id,
        redirectTarget: "_modal",
      });

      if (result?.error) {
        throw new Error(result.error.message ?? "Payment cancelled.");
      }
      if (!result?.paymentDetails) {
        throw new Error("Payment was not completed.");
      }

      // Confirm server-side and pull the final payment row.
      const confirmRes = await fetch(`/api/tsr/payments/${order.payment_id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cashfree_payment_id: result.paymentDetails.cf_payment_id?.toString() ?? null,
        }),
      });
      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({ error: `HTTP ${confirmRes.status}` }));
        throw new Error(err.error ?? `HTTP ${confirmRes.status}`);
      }
      const payment = (await confirmRes.json()) as TsrPaymentRecord;
      onSuccess(payment);
    } catch (err) {
      triggered.current = false;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [caseId, onSuccess]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
            onClick={() => !busy && onClose()}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md rounded-3xl bg-cream shadow-2xl pointer-events-auto overflow-hidden border border-maroon/15"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-rust via-maroon to-rust" />

              <button
                onClick={() => !busy && onClose()}
                disabled={busy}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-maroon/8 hover:bg-maroon/15 disabled:opacity-40 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-maroon" />
              </button>

              <div className="px-7 pt-7 pb-7">
                <div className="flex items-start gap-3 mb-6">
                  <div className="shrink-0 w-11 h-11 rounded-2xl bg-maroon grid place-items-center shadow-md">
                    <FileText className="w-5 h-5 text-cream" />
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rust/12 text-rust text-[10px] font-bold tracking-[0.2em] uppercase">
                      <Sparkles className="w-2.5 h-2.5" /> Generate Report
                    </div>
                    <h2 className="font-display text-xl font-bold text-maroon mt-1 leading-tight truncate">
                      {isSandbox ? "Test payment to generate scrutiny report" : "Pay to generate scrutiny report"}
                    </h2>
                    {caseName && (
                      <p className="text-xs text-ink/60 mt-0.5 truncate">For case: <strong className="text-ink/85">{caseName}</strong></p>
                    )}
                  </div>
                </div>

                {isSandbox && (
                  <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Sandbox mode.</strong> No real money will be charged. Payment is simulated server-side and the row is recorded with a <code className="px-1 bg-amber-100 rounded">test_</code> order id.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-maroon/15 bg-cream-soft p-5">
                  <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-rust">Amount due</p>
                  <div className="mt-1.5 flex items-end gap-1">
                    <IndianRupee className="w-6 h-6 text-maroon mb-1" />
                    <span className="font-display text-4xl font-bold text-maroon leading-none">
                      {amount ?? "—"}
                    </span>
                    <span className="text-sm text-ink/55 mb-1.5 ml-1">/ Report</span>
                  </div>
                  <p className="text-[11px] text-ink/55 mt-2">
                    Charged to your registered phone &amp; email. Invoice issued instantly on success.
                  </p>
                </div>

                <ul className="mt-5 space-y-2 text-xs text-ink/75">
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-rust mt-0.5 shrink-0" />
                    <span>Cashfree-secured payment — UPI, cards, wallets, netbanking.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-rust mt-0.5 shrink-0" />
                    <span>Scrutiny report processing begins the moment payment clears.</span>
                  </li>
                </ul>

                {error && (
                  <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-800 break-words">{error}</p>
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={busy}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep disabled:opacity-70 text-cream px-5 py-3.5 rounded-2xl text-sm font-semibold transition shadow-[0_12px_28px_-14px_rgba(104,3,24,0.55)]"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isSandbox ? "Simulating payment…" : "Opening secure checkout…"}
                    </>
                  ) : (
                    <>{isSandbox ? "Simulate Payment & Generate Report" : "Pay & Generate Report"}</>
                  )}
                </button>

                <button
                  onClick={() => !busy && onClose()}
                  disabled={busy}
                  className="mt-2 w-full text-center text-xs text-ink/55 hover:text-ink/85 disabled:opacity-40 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
