'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Receipt, CheckCircle2, Clock, XCircle,
  Sparkles, RefreshCw, FileText, ChevronRight, Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import InvoiceView, { type Payment } from '@/components/InvoiceView';
import PaywallModal from '@/components/PaywallModal';
import { isPaywallEnabled } from '@/lib/billing';

function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function StatusPill({ status }: { status?: string }) {
  const s = (status ?? '').toUpperCase();
  if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Paid
      </span>
    );
  if (s === 'PENDING')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200">
      <XCircle className="w-3 h-3" /> {status ?? 'Failed'}
    </span>
  );
}

function invoiceLabel(payment: Payment) {
  if (payment.order_id) {
    const parts = payment.order_id.split('_');
    return `INV-${parts[parts.length - 1]?.toUpperCase().slice(0, 8) ?? payment.id.slice(0, 8).toUpperCase()}`;
  }
  return `INV-${payment.id.slice(0, 8).toUpperCase()}`;
}

export default function BillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  useEffect(() => { setPaywallEnabled(isPaywallEnabled()); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase().auth.getUser();
      setUserEmail(user?.email ?? '');
      const meta = user?.user_metadata ?? {};
      const first = meta.first_name ?? '';
      const last = meta.last_name ?? '';
      setUserName(`${first} ${last}`.trim() || (user?.email ?? ''));

      const res = await fetch('/api/payments');
      if (!res.ok) throw new Error('Failed to load payments');
      const json = await res.json();
      setPayments(json.payments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalSpent = payments
    .filter(p => ['PAID', 'SUCCESS', 'COMPLETED'].includes((p.status ?? '').toUpperCase()))
    .reduce((sum, p) => sum + (p.amount_inr ?? p.amount ?? 0), 0);

  const totalCredits = payments
    .filter(p => ['PAID', 'SUCCESS', 'COMPLETED'].includes((p.status ?? '').toUpperCase()))
    .reduce((sum, p) => sum + (p.credits ?? 0), 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Billing & Invoices</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Your full payment history and downloadable invoices
              </p>
            </div>
            {paywallEnabled && (
              <button
                onClick={() => setShowTopUp(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Zap className="w-4 h-4" /> Top Up Credits
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        {!loading && payments.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Spent', value: fmtINR(totalSpent), icon: Receipt },
              { label: 'Credits Purchased', value: totalCredits.toLocaleString('en-IN'), icon: Sparkles },
              { label: 'Transactions', value: String(payments.length), icon: FileText },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
                </div>
                <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Payment list */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-12 px-5 py-3 bg-[var(--bg-sidebar)]/40 border-b border-[var(--border-default)]">
            {['Invoice', 'Date', 'Amount', 'Credits', 'Status', ''].map((h, i) => (
              <div
                key={h}
                className={`text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ${
                  i === 0 ? 'col-span-3' :
                  i === 1 ? 'col-span-2' :
                  i === 2 ? 'col-span-2' :
                  i === 3 ? 'col-span-2' :
                  i === 4 ? 'col-span-2' : 'col-span-1'
                }`}
              >
                {h}
              </div>
            ))}
          </div>

          {/* States */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={load} className="text-xs text-[var(--accent)] underline">Retry</button>
            </div>
          )}

          {!loading && !error && payments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-hover)] flex items-center justify-center">
                <Receipt className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">No payments yet</p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                Your purchase history will appear here once you top up credits.
              </p>
              {paywallEnabled && (
                <button
                  onClick={() => setShowTopUp(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold"
                >
                  Buy Credits
                </button>
              )}
            </div>
          )}

          {/* Rows */}
          <AnimatePresence>
            {!loading && !error && payments.map((p, i) => {
              const amount = p.amount_inr ?? p.amount ?? 0;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-12 px-5 py-4 border-b border-[var(--border-default)] last:border-0 items-center hover:bg-[var(--surface-hover)]/40 transition-colors group"
                >
                  <div className="col-span-3">
                    <p className="text-xs font-mono font-medium text-[var(--text-primary)]">
                      {invoiceLabel(p)}
                    </p>
                    {p.order_id && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate max-w-[140px]">
                        {p.order_id}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-[var(--text-secondary)]">
                    {fmtDate(p.paid_at ?? p.created_at)}
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                    {fmtINR(amount)}
                  </div>
                  <div className="col-span-2 text-xs text-[var(--text-secondary)] tabular-nums flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                    {(p.credits ?? 0).toLocaleString('en-IN')}
                  </div>
                  <div className="col-span-2">
                    <StatusPill status={p.status} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => setSelectedPayment(p)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:underline"
                    >
                      Invoice <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
          Need help with a payment? Email{' '}
          <a href="mailto:hello@lexram.ai" className="text-[var(--accent)] hover:underline">
            hello@lexram.ai
          </a>
        </p>
      </div>

      {/* Invoice modal */}
      <InvoiceView
        payment={selectedPayment}
        userEmail={userEmail}
        userName={userName}
        onClose={() => setSelectedPayment(null)}
      />

      {/* Top-up modal */}
      {paywallEnabled && (
        <PaywallModal open={showTopUp} onClose={() => setShowTopUp(false)} />
      )}
    </div>
  );
}
