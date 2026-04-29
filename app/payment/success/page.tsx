'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, Scale, ArrowRight, Download, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Payment } from '@/components/InvoiceView';

/* ── Company constants ────────────────────────────────────────── */
const COMPANY = {
  name: 'Ramasubramanian AI Software Pvt. Ltd.',
  email: 'hello@lexram.ai',
  phone: '+91 87544 46066',
  address: 'B 225, 12th Avenue, Ashok Nagar',
  city: 'Chennai, Tamil Nadu — 600083',
  website: 'lexram.ai',
};

/* ── Helpers ─────────────────────────────────────────────────── */
function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0,
  }).format(n);
}
function fmtDate(d?: string) {
  if (!d) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}
function invoiceNumber(p: Payment) {
  if (p.order_id) {
    const parts = p.order_id.split('_');
    return `INV-${(parts[parts.length - 1] ?? p.id.slice(0, 8)).toUpperCase().slice(0, 8)}`;
  }
  return `INV-${p.id.slice(0, 8).toUpperCase()}`;
}

/* ── Poll for payment in Supabase ────────────────────────────── */
async function fetchPaymentByOrderId(orderId: string): Promise<Payment | null> {
  const res = await fetch(`/api/payments?order_id=${encodeURIComponent(orderId)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.payment ?? null;
}

/* ── Print styles ────────────────────────────────────────────── */
const PRINT_STYLE = `
@media print {
  body > *:not(#invoice-print-root) { display: none !important; }
  #invoice-print-root { position: static !important; }
  .no-print { display: none !important; }
  .invoice-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
}
`;

/* ─────────────────────────────────────────────────────────────── */

function SuccessPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  // Cashfree query params (sent on redirect)
  const orderId   = params.get('order_id') ?? params.get('orderId') ?? '';
  const fallbackCredits = Number(params.get('credits') ?? 0);
  const fallbackAmount  = Number(params.get('amount') ?? 0);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName]   = useState('');
  const [phase, setPhase]         = useState<'loading' | 'found' | 'timeout'>('loading');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    // Get signed-in user info
    supabase().auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '');
      const m = data.user?.user_metadata ?? {};
      setUserName(`${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || (data.user?.email ?? ''));
    });

    if (!orderId) { setPhase('timeout'); return; }

    // Poll every 2 s up to 30 s for webhook to write the payment row
    const poll = async () => {
      attempts.current += 1;
      const p = await fetchPaymentByOrderId(orderId);
      if (p) {
        setPayment(p);
        setPhase('found');
        clearInterval(pollRef.current!);
        return;
      }
      if (attempts.current >= 15) {
        // 15 × 2s = 30s timeout — show fallback invoice from URL params
        const fallback: Payment = {
          id: orderId,
          order_id: orderId,
          amount_inr: fallbackAmount,
          credits: fallbackCredits,
          status: 'PAID',
          created_at: new Date().toISOString(),
        };
        setPayment(fallback);
        setPhase('found');
        clearInterval(pollRef.current!);
      }
    };

    poll(); // first attempt immediately
    pollRef.current = setInterval(poll, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <>
      <style>{PRINT_STYLE}</style>

      <div id="invoice-print-root" className="min-h-screen bg-neutral-50 flex flex-col items-center justify-start py-10 px-4">

        {/* Loading state */}
        <AnimatePresence mode="wait">
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="no-print flex flex-col items-center gap-4 mt-24 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
              </div>
              <p className="text-base font-medium text-neutral-700">Confirming your payment…</p>
              <p className="text-sm text-neutral-400">This takes just a moment</p>
            </motion.div>
          )}

          {phase === 'found' && payment && (
            <motion.div
              key="invoice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="w-full max-w-2xl"
            >
              {/* Success banner */}
              <div className="no-print flex items-center justify-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700">Payment successful</span>
              </div>

              {/* Action bar */}
              <div className="no-print flex items-center justify-between mb-4">
                <p className="text-xs text-neutral-400 font-mono">{invoiceNumber(payment)}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              </div>

              {/* ── Invoice card ── */}
              <div className="invoice-card bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-100">

                {/* Accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-amber-400/50 via-amber-400 to-amber-400/50" />

                <div className="px-10 py-10">

                  {/* Header */}
                  <div className="flex items-start justify-between mb-10">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                          <Scale className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="font-serif text-2xl font-bold tracking-tight text-neutral-900">LexRam</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        {COMPANY.name}<br />
                        {COMPANY.address}<br />
                        {COMPANY.city}<br />
                        {COMPANY.email} · {COMPANY.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-serif font-light text-neutral-900 tracking-tight mb-1">Invoice</p>
                      <p className="text-sm font-mono font-semibold text-neutral-700">{invoiceNumber(payment)}</p>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-end gap-3 text-xs text-neutral-400">
                          <span>Date</span>
                          <span className="text-neutral-700 font-medium">{fmtDate(payment.paid_at ?? payment.created_at)}</span>
                        </div>
                        <div className="flex items-center justify-end gap-3 text-xs text-neutral-400">
                          <span>Status</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-neutral-100 mb-8" />

                  {/* Billed To */}
                  <div className="mb-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Billed To</p>
                    {userName && <p className="text-sm font-semibold text-neutral-900">{userName}</p>}
                    <p className="text-sm text-neutral-500">{userEmail}</p>
                    {payment.user_phone && (
                      <p className="text-sm text-neutral-400">+91 {payment.user_phone}</p>
                    )}
                  </div>

                  {/* Line items */}
                  <div className="rounded-2xl border border-neutral-100 overflow-hidden mb-6">
                    <div className="grid grid-cols-12 bg-neutral-50 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      <div className="col-span-6">Description</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-center">Rate</div>
                      <div className="col-span-2 text-right">Amount</div>
                    </div>
                    <div className="grid grid-cols-12 px-5 py-5 border-t border-neutral-100 items-center">
                      <div className="col-span-6">
                        <p className="text-sm font-semibold text-neutral-900">LexRam AI Credits</p>
                        <p className="text-xs text-neutral-400 mt-0.5">Valid for all research &amp; drafting queries · Never expire</p>
                      </div>
                      <div className="col-span-2 text-center text-sm text-neutral-700 tabular-nums font-medium">
                        {(payment.credits ?? fallbackCredits).toLocaleString('en-IN')}
                      </div>
                      <div className="col-span-2 text-center text-sm text-neutral-400">₹2 / cr</div>
                      <div className="col-span-2 text-right text-sm font-bold text-neutral-900 tabular-nums">
                        {fmtINR(payment.amount_inr ?? payment.amount ?? fallbackAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end mb-8">
                    <div className="w-60 space-y-2">
                      <div className="flex justify-between text-xs text-neutral-400">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{fmtINR(payment.amount_inr ?? payment.amount ?? fallbackAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-neutral-400">
                        <span>GST (0%)</span>
                        <span>₹0</span>
                      </div>
                      <div className="h-px bg-neutral-200" />
                      <div className="flex justify-between text-sm font-bold text-neutral-900">
                        <span>Total Paid</span>
                        <span className="tabular-nums">{fmtINR(payment.amount_inr ?? payment.amount ?? fallbackAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment reference */}
                  {(payment.order_id || payment.cashfree_payment_id) && (
                    <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-5 py-4 mb-8 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Payment Reference</p>
                      {payment.order_id && (
                        <div className="flex gap-3 text-xs">
                          <span className="text-neutral-400 w-28 shrink-0">Order ID</span>
                          <span className="font-mono text-neutral-600 break-all">{payment.order_id}</span>
                        </div>
                      )}
                      {payment.cashfree_payment_id && (
                        <div className="flex gap-3 text-xs">
                          <span className="text-neutral-400 w-28 shrink-0">Payment ID</span>
                          <span className="font-mono text-neutral-600 break-all">{payment.cashfree_payment_id}</span>
                        </div>
                      )}
                      <div className="flex gap-3 text-xs">
                        <span className="text-neutral-400 w-28 shrink-0">Gateway</span>
                        <span className="text-neutral-600">Cashfree Payments</span>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="h-px bg-neutral-100 mb-6" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <Scale className="w-3.5 h-3.5" />
                      <span className="text-xs font-serif">LexRam · {COMPANY.website}</span>
                    </div>
                    <p className="text-xs text-neutral-400">Thank you for choosing LexRam!</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="no-print flex justify-center mt-6">
                <button
                  onClick={() => router.push('/dashboard/research-2')}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-md"
                >
                  Start researching <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'timeout' && !payment && (
            <motion.div
              key="timeout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="no-print flex flex-col items-center gap-4 mt-24 text-center"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <p className="text-base font-semibold text-neutral-800">Payment received!</p>
              <p className="text-sm text-neutral-500 max-w-xs">
                Your credits will appear shortly. Check your billing page for the invoice.
              </p>
              <button
                onClick={() => router.push('/dashboard/billing')}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold"
              >
                View billing <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
