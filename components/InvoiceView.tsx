'use client';

import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Scale, CheckCircle2, Clock, XCircle, Printer } from 'lucide-react';

export interface Payment {
  id: string;
  order_id?: string;
  user_id?: string;
  amount_inr?: number;
  amount?: number;
  credits?: number;
  status?: string;
  currency?: string;
  user_email?: string;
  user_phone?: string;
  cashfree_payment_id?: string;
  cashfree_order_id?: string;
  created_at?: string;
  paid_at?: string;
}

interface InvoiceViewProps {
  payment: Payment | null;
  userEmail: string;
  userName?: string;
  onClose: () => void;
}

const COMPANY = {
  name: 'Ramasubramanian AI Software Pvt. Ltd.',
  brand: 'LexRam',
  email: 'hello@lexram.ai',
  phone: '+91 87544 46066',
  address: 'B 225, 12th Avenue, Ashok Nagar',
  city: 'Chennai, Tamil Nadu — 600083',
  website: 'lexram.ai',
};

function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
}

function fmtDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function invoiceNumber(payment: Payment) {
  if (payment.order_id) {
    const parts = payment.order_id.split('_');
    return `INV-${parts[parts.length - 1]?.toUpperCase().slice(0, 8) ?? payment.id.slice(0, 8).toUpperCase()}`;
  }
  return `INV-${payment.id.slice(0, 8).toUpperCase()}`;
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? '').toUpperCase();
  if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED')
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
      </span>
    );
  if (s === 'PENDING')
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
        <Clock className="w-3.5 h-3.5" /> Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold border border-red-200">
      <XCircle className="w-3.5 h-3.5" /> {status ?? 'Unknown'}
    </span>
  );
}

export default function InvoiceView({ payment, userEmail, userName, onClose }: InvoiceViewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const amountINR = payment?.amount_inr ?? payment?.amount ?? 0;
  const credits = payment?.credits ?? 0;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <>
      {/* Print-only global styles injected via a style tag */}
      <style>{`
        @media print {
          body > *:not(#invoice-print-root) { display: none !important; }
          #invoice-print-root {
            position: fixed !important;
            inset: 0 !important;
            z-index: 9999 !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .invoice-no-print { display: none !important; }
          .invoice-paper {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 2.5rem !important;
          }
        }
      `}</style>

      <AnimatePresence>
        {payment && (
          <div id="invoice-print-root">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="invoice-no-print fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="invoice-no-print fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8 pointer-events-none"
            >
              <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl bg-white pointer-events-auto">

                {/* Toolbar */}
                <div className="invoice-no-print sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 bg-white/95 backdrop-blur border-b border-neutral-100">
                  <p className="text-sm font-medium text-neutral-700">{invoiceNumber(payment)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors ml-1"
                    >
                      <X className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                </div>

                {/* ── Invoice paper ── */}
                <div ref={invoiceRef} className="invoice-paper px-10 py-10 bg-white">

                  {/* Header row */}
                  <div className="flex items-start justify-between mb-10">
                    {/* Logo + company */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                          <Scale className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="font-serif text-2xl font-bold tracking-tight text-neutral-900">LexRam</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        {COMPANY.name}<br />
                        {COMPANY.address}<br />
                        {COMPANY.city}<br />
                        {COMPANY.email} · {COMPANY.phone}
                      </p>
                    </div>

                    {/* Invoice meta */}
                    <div className="text-right">
                      <p className="text-3xl font-serif font-light text-neutral-900 tracking-tight mb-1">Invoice</p>
                      <p className="text-sm font-mono font-medium text-neutral-700">{invoiceNumber(payment)}</p>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-end gap-2 text-xs text-neutral-500">
                          <span>Date</span>
                          <span className="text-neutral-800 font-medium">{fmtDate(payment.paid_at ?? payment.created_at)}</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-xs text-neutral-500">
                          <span>Status</span>
                          <StatusBadge status={payment.status} />
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
                    <p className="text-sm text-neutral-600">{userEmail}</p>
                    {payment.user_phone && (
                      <p className="text-sm text-neutral-500">+91 {payment.user_phone}</p>
                    )}
                  </div>

                  {/* Line items table */}
                  <div className="rounded-2xl border border-neutral-100 overflow-hidden mb-6">
                    {/* Table header */}
                    <div className="grid grid-cols-12 bg-neutral-50 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      <div className="col-span-6">Description</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-center">Rate</div>
                      <div className="col-span-2 text-right">Amount</div>
                    </div>

                    {/* Line item */}
                    <div className="grid grid-cols-12 px-5 py-4 border-t border-neutral-100 items-center">
                      <div className="col-span-6">
                        <p className="text-sm font-medium text-neutral-900">LexRam AI Credits</p>
                        <p className="text-xs text-neutral-400 mt-0.5">Valid for all research & drafting queries</p>
                      </div>
                      <div className="col-span-2 text-center text-sm text-neutral-700 tabular-nums">
                        {credits.toLocaleString('en-IN')}
                      </div>
                      <div className="col-span-2 text-center text-sm text-neutral-500">
                        ₹2 / cr
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold text-neutral-900 tabular-nums">
                        {fmtINR(amountINR)}
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end mb-8">
                    <div className="w-56 space-y-2">
                      <div className="flex justify-between text-xs text-neutral-500">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{fmtINR(amountINR)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-neutral-500">
                        <span>GST (0%)</span>
                        <span>₹0</span>
                      </div>
                      <div className="h-px bg-neutral-200 my-1" />
                      <div className="flex justify-between text-sm font-bold text-neutral-900">
                        <span>Total</span>
                        <span className="tabular-nums">{fmtINR(amountINR)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment reference */}
                  {(payment.order_id || payment.cashfree_payment_id || payment.cashfree_order_id) && (
                    <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-5 py-4 mb-8 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Payment Reference</p>
                      {payment.order_id && (
                        <div className="flex gap-3 text-xs">
                          <span className="text-neutral-400 w-28 shrink-0">Order ID</span>
                          <span className="font-mono text-neutral-700 break-all">{payment.order_id}</span>
                        </div>
                      )}
                      {(payment.cashfree_payment_id || payment.cashfree_order_id) && (
                        <div className="flex gap-3 text-xs">
                          <span className="text-neutral-400 w-28 shrink-0">Payment ID</span>
                          <span className="font-mono text-neutral-700 break-all">{payment.cashfree_payment_id ?? payment.cashfree_order_id}</span>
                        </div>
                      )}
                      <div className="flex gap-3 text-xs">
                        <span className="text-neutral-400 w-28 shrink-0">Method</span>
                        <span className="text-neutral-700">Cashfree · UPI / Card / Net Banking</span>
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
                    <p className="text-xs text-neutral-400">Thank you for your purchase!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
