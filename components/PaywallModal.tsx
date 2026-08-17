'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { useCredits } from '@/hooks/use-credits';
import { creditsApi } from '@/services/credits';
import { supabase } from '@/lib/supabase/client';
import { getAccessToken, authStore } from '@/lib/auth-store';
import { withTimeout } from '@/lib/with-timeout';
import {
  MIN_TOPUP_INR,
  GST_CHARGED_ON_TOP,
  CREDITS_PER_RUPEE,
  breakdown,
  STATE_OPTIONS,
  EMPTY_BILLING,
  validateBilling,
  stateCodeFromGSTIN,
  type BillingDetails,
} from '@/lib/billing-config';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

// Quick-select shortcuts. All at or above MIN_TOPUP_INR — offering a pack the
// user cannot actually buy is worse than offering fewer.
const QUICK_PACKS = [
  { amount_inr: 500,  label: '₹500',   badge: 'Popular' },
  { amount_inr: 1000, label: '₹1,000', badge: null },
  { amount_inr: 2500, label: '₹2,500', badge: 'Best value' },
] as const;

function calcCredits(amount: number): number {
  return Math.floor(amount * CREDITS_PER_RUPEE);
}

function fmtINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function PaywallModal({ open, onClose }: PaywallModalProps) {
  const { refresh } = useCredits();

  const [rawAmount, setRawAmount] = useState('');
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [confirmedAmount, setConfirmedAmount] = useState(0);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingDetails>(EMPTY_BILLING);

  // Billing details are captured once, at the first payment, and reused after.
  // Stored on user_metadata rather than a new table — the same place
  // ProfileCompletionModal already writes, so no migration is needed.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase().auth.getUser();
        if (cancelled) return;
        const m = (data.user?.user_metadata ?? {}) as Record<string, string>;
        setBilling({
          address:   m.billing_address ?? '',
          city:      m.billing_city ?? '',
          stateCode: m.billing_state_code ?? '',
          pincode:   m.billing_pincode ?? '',
          gstin:     m.billing_gstin ?? '',
        });
        if (m.phone) setPhone(String(m.phone).replace(/\D/g, '').slice(-10));
      } catch { /* prefill is best-effort — the user can still type it */ }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const numericAmount = useMemo(() => {
    const n = parseInt(rawAmount, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [rawAmount]);

  const bd = useMemo(() => breakdown(numericAmount), [numericAmount]);
  const confirmedBd = useMemo(() => breakdown(confirmedAmount), [confirmedAmount]);
  const credits = bd.credits;
  const isValidAmount = numericAmount >= MIN_TOPUP_INR;
  const amountTooLow = numericAmount > 0 && numericAmount < MIN_TOPUP_INR;

  const billingError = useMemo(() => validateBilling(billing), [billing]);
  const canPay = phone.length === 10 && !billingError && !loading;

  const handleClose = useCallback(() => {
    setRawAmount('');
    setStep('pick');
    setConfirmedAmount(0);
    setPhone('');
    setError(null);
    onClose();
  }, [onClose]);

  const handleContinue = () => {
    if (!isValidAmount) return;
    setConfirmedAmount(numericAmount);
    setStep('confirm');
    setError(null);
  };

  /** Selecting a GSTIN's state automatically keeps the two consistent. */
  const handleGstinChange = (raw: string) => {
    const gstin = raw.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setBilling(prev => {
      const derived = stateCodeFromGSTIN(gstin);
      return { ...prev, gstin, stateCode: derived ?? prev.stateCode };
    });
  };

  const handlePay = useCallback(async () => {
    if (!confirmedAmount || phone.length < 10) return;
    const invalid = validateBilling(billing);
    if (invalid) { setError(invalid); return; }

    setLoading(true);
    setError(null);

    try {
      // Persist billing details before charging so the invoice can be issued
      // even if the user never returns to this modal. Best-effort: a metadata
      // write failing must not block a payment the user has already committed
      // to — the details are also sent with the order below.
      supabase().auth.updateUser({
        data: {
          billing_address:    billing.address.trim(),
          billing_city:       billing.city.trim(),
          billing_state_code: billing.stateCode,
          billing_pincode:    billing.pincode.trim(),
          billing_gstin:      billing.gstin.trim().toUpperCase(),
        },
      }).catch(() => {});

      // Via getAccessToken(), not a raw getSession().
      //
      // getSession() serialises behind Supabase's cross-tab Web Lock and can
      // stall rather than reject. The previous code raced it against 10s and
      // then THREW, so a stalled lock produced "Session expired or timed out"
      // and the payment was abandoned before any request was made — the user
      // saw a session error while their session was perfectly valid.
      //
      // getAccessToken() races a short timeout and falls back to the last good
      // cached token, so a slow lock costs a moment rather than the payment.
      const token = await getAccessToken();
      const user = authStore.getSnapshot().user;
      if (!token || !user) {
        throw new Error('Your session has expired. Please sign in again and retry.');
      }

      const order = await withTimeout(
        creditsApi.createOrder(
          confirmedAmount,
          user.email ?? '',
          phone,
          // Sent with the order, not just saved to the profile. The backend
          // needs customer_state_code at order-creation time to pick CGST+SGST
          // vs IGST and to write the tax snapshot — it cannot recover either
          // from the webhook afterwards.
          {
            customer_name: [
              user.user_metadata?.first_name,
              user.user_metadata?.last_name,
            ].filter(Boolean).join(' ').trim() || undefined,
            customer_address:    billing.address.trim(),
            customer_city:       billing.city.trim(),
            customer_state_code: billing.stateCode,
            customer_pincode:    billing.pincode.trim(),
            customer_gstin:      billing.gstin.trim().toUpperCase() || undefined,
          },
        ),
        20_000,
        'Request timed out. Please check your connection and try again.',
      );

      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await withTimeout(
        load({ mode: 'production' }),
        20_000,
        'Could not load the payment gateway. Please disable any ad blocker and try again.',
      );

      const result = await withTimeout<{ paymentDetails?: unknown; error?: { message?: string } }>(
        (cashfree as any).checkout({
          paymentSessionId: order.payment_session_id,
          redirectTarget: '_modal',
        }),
        120_000,
        'Payment is taking too long. Please try again.',
      );

      if (result?.error) {
        throw new Error(result.error.message ?? 'Payment cancelled.');
      }
      if (!result?.paymentDetails) {
        throw new Error('Payment was not completed. Please try again.');
      }

      refresh();

      // Best-effort admin notification — must never block the user from
      // reaching the success page over a mail hiccup.
      fetch('/api/payments/notify-recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.order_id, amount_inr: order.amount, credits: order.credits }),
      }).catch(() => {});

      // Redirect to success page — shows invoice automatically
      window.location.href = `/payment/success?order_id=${encodeURIComponent(order.order_id)}&credits=${order.credits}&amount=${order.amount}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [confirmedAmount, phone, billing, refresh, handleClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              /* Explicitly light, not bg-[var(--bg-sidebar)].
               *
               * --bg-sidebar is #1A0E10 (near-black) at :root and #fdf8f8
               * (near-white) under [data-theme="futuristic"]. research-2 wraps
               * itself in that theme locally, so the modal rendered light when
               * opened from a research page and near-black everywhere else —
               * on the billing page its text, all hardcoded neutral-900,
               * disappeared into the background.
               *
               * Every colour inside this modal is a fixed neutral, so it is a
               * light surface by design; it should not inherit a token whose
               * value flips per theme. */
              className="relative w-full max-w-md rounded-3xl bg-[#fdf8f8] shadow-2xl pointer-events-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Accent top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-[var(--brand-cta)]/40 via-[var(--brand-cta)] to-[var(--brand-cta)]/40" />

              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/8 hover:bg-black/15 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-neutral-600" />
              </button>

              <AnimatePresence mode="wait">
                {step === 'pick' ? (
                  <motion.div
                    key="pick"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                    className="px-7 pt-7 pb-8"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-7">
                      <div className="shrink-0 w-10 h-10 rounded-2xl bg-[var(--brand-cta)]/12 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-[var(--brand-cta)]" />
                      </div>
                      <div>
                        <h2 className="font-serif text-xl font-light tracking-tight text-neutral-900 leading-tight">
                          Top up your credits
                        </h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          ₹2 = 1 credit · Credits never expire
                        </p>
                      </div>
                    </div>

                    {/* ── Amount input ── */}
                    <div className="mb-2">
                      <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-2">
                        Enter amount
                      </p>

                      <div
                        className={`flex items-center rounded-2xl border-2 bg-white overflow-hidden transition-all duration-200 ${
                          isValidAmount
                            ? 'border-[var(--brand-cta)]/60 shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-cta)_10%,transparent)]'
                            : 'border-black/10 focus-within:border-[var(--brand-cta)]/40'
                        }`}
                      >
                        <span className="pl-4 pr-1 text-2xl font-light text-neutral-400 select-none">₹</span>

                        <input
                          type="number"
                          inputMode="numeric"
                          min={MIN_TOPUP_INR}
                          value={rawAmount}
                          onChange={e => setRawAmount(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="0"
                          autoFocus
                          className="flex-1 py-4 text-2xl font-light text-neutral-900 placeholder:text-neutral-300 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        {/* Live credits badge */}
                        <AnimatePresence>
                          {isValidAmount && (
                            <motion.div
                              key={credits}
                              initial={{ opacity: 0, scale: 0.75, x: 8 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.75, x: 8 }}
                              transition={{ type: 'spring', damping: 18, stiffness: 300 }}
                              className="shrink-0 mr-3 flex items-center gap-1 bg-[var(--brand-cta)]/12 text-[var(--brand-cta)] rounded-xl px-2.5 py-1.5"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span className="text-xs font-semibold tabular-nums">{credits.toLocaleString()} cr</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Live breakdown / minimum-amount hint */}
                    <AnimatePresence mode="wait">
                      {amountTooLow ? (
                        <motion.div
                          key="too-low"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mb-5 px-1"
                        >
                          <span className="text-xs text-red-500">
                            Minimum top-up is {fmtINR(MIN_TOPUP_INR)}
                            {GST_CHARGED_ON_TOP ? ' (excluding GST)' : ''}
                          </span>
                        </motion.div>
                      ) : isValidAmount ? (
                        <motion.div
                          key="breakdown"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mb-5 px-1 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">
                              {fmtINR(numericAmount)} at ₹2 / credit
                            </span>
                            <span className="text-xs font-medium text-[var(--brand-cta)]">
                              = {credits.toLocaleString()} credits
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-neutral-400">
                              {GST_CHARGED_ON_TOP
                                ? `+ GST @18% ${fmtINR(bd.gst)}`
                                : 'Inclusive of GST @18%'}
                            </span>
                            <span className="text-[11px] font-semibold text-neutral-600">
                              Total {fmtINR(bd.total)}
                            </span>
                          </div>
                        </motion.div>
                      ) : (
                        <div key="spacer" className="mb-5" />
                      )}
                    </AnimatePresence>

                    {/* ── Quick-select shortcuts ── */}
                    <div className="mb-6">
                      <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-2.5">
                        Quick select
                      </p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {QUICK_PACKS.map(pack => {
                          const isActive = numericAmount === pack.amount_inr;
                          const packCredits = calcCredits(pack.amount_inr);
                          return (
                            <motion.button
                              key={pack.amount_inr}
                              onClick={() => setRawAmount(String(pack.amount_inr))}
                              whileTap={{ scale: 0.96 }}
                              className={`relative rounded-2xl py-3 px-3 flex flex-col items-start text-left transition-all duration-150 border-2 ${
                                isActive
                                  ? 'border-[var(--brand-cta)] bg-[var(--brand-cta)]/6'
                                  : 'border-black/8 bg-black/[0.03] hover:bg-black/[0.06] hover:border-black/15'
                              }`}
                            >
                              {pack.badge && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[var(--brand-cta)] text-neutral-900 text-[9px] font-bold uppercase tracking-widest py-0.5 px-2 rounded-full whitespace-nowrap">
                                  {pack.badge}
                                </div>
                              )}
                              <span className={`font-serif text-base font-light transition-colors ${isActive ? 'text-[var(--brand-cta)]' : 'text-neutral-800'}`}>
                                {pack.label}
                              </span>
                              <span className="text-[11px] text-neutral-400 mt-0.5">
                                {packCredits} credits
                              </span>
                              <AnimatePresence>
                                {isActive && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--brand-cta)] flex items-center justify-center"
                                  >
                                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Continue */}
                    <motion.button
                      onClick={handleContinue}
                      disabled={!isValidAmount}
                      whileTap={isValidAmount ? { scale: 0.98 } : {}}
                      className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-neutral-900 text-white hover:bg-neutral-800 disabled:hover:bg-neutral-900"
                    >
                      {isValidAmount ? (
                        <>Continue with {fmtINR(bd.total)} <ChevronRight className="w-4 h-4" /></>
                      ) : (
                        <>Enter at least {fmtINR(MIN_TOPUP_INR)} to continue</>
                      )}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.18 }}
                    className="px-7 pt-7 pb-8"
                  >
                    {/* Order summary */}
                    <div className="rounded-2xl bg-black/[0.03] border border-black/8 p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-neutral-400 mb-0.5">You&apos;re paying</p>
                          <p className="font-serif text-3xl font-light text-neutral-900">{fmtINR(confirmedBd.total)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-400 mb-0.5">You receive</p>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Sparkles className="w-4 h-4 text-[var(--brand-cta)]" />
                            <span className="font-serif text-2xl font-light text-[var(--brand-cta)]">
                              {calcCredits(confirmedAmount).toLocaleString()}
                            </span>
                            <span className="text-sm text-neutral-500">credits</span>
                          </div>
                        </div>
                      </div>

                      {/* Tax breakdown — the user sees exactly what the gateway will charge */}
                      <div className="mt-3 pt-3 border-t border-black/6 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-neutral-400">
                            {GST_CHARGED_ON_TOP ? 'Taxable value' : 'Taxable value (incl.)'}
                          </span>
                          <span className="text-[11px] text-neutral-500">{fmtINR(confirmedBd.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-neutral-400">GST @18%</span>
                          <span className="text-[11px] text-neutral-500">{fmtINR(confirmedBd.gst)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-black/6">
                          <span className="text-[11px] font-semibold text-neutral-600">Total payable</span>
                          <span className="text-[11px] font-semibold text-neutral-900">{fmtINR(confirmedBd.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Phone input */}
                    <div className="mb-5">
                      <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-2">
                        Mobile number
                      </label>
                      <div
                        className={`flex items-center rounded-2xl border-2 bg-white overflow-hidden transition-all duration-200 ${
                          phone.length === 10
                            ? 'border-[var(--brand-cta)]/60'
                            : 'border-black/10 focus-within:border-[var(--brand-cta)]/40'
                        }`}
                      >
                        <span className="pl-4 pr-2 text-sm text-neutral-400 select-none">+91</span>
                        <div className="w-px h-5 bg-black/10 shrink-0" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit mobile number"
                          autoFocus
                          className="flex-1 px-3 py-3.5 text-sm text-neutral-900 placeholder:text-neutral-300 bg-transparent focus:outline-none"
                        />
                        <AnimatePresence>
                          {phone.length === 10 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6 }}
                              className="mr-3 w-5 h-5 rounded-full bg-[var(--brand-cta)] flex items-center justify-center shrink-0"
                            >
                              <svg className="w-3 h-3 text-white" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="mt-1.5 text-[11px] text-neutral-400">Required by Cashfree payment gateway</p>
                    </div>

                    {/* ── Billing details ── captured once, reused for every later invoice */}
                    <div className="mb-5">
                      <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-2">
                        Billing address
                      </label>

                      <input
                        type="text"
                        value={billing.address}
                        onChange={e => setBilling(p => ({ ...p, address: e.target.value }))}
                        placeholder="Flat / building, street, area"
                        className="w-full mb-2 px-4 py-3 rounded-2xl border-2 border-black/10 focus:border-[var(--brand-cta)]/40 bg-white text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none transition-colors"
                      />

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          value={billing.city}
                          onChange={e => setBilling(p => ({ ...p, city: e.target.value }))}
                          placeholder="City"
                          className="px-4 py-3 rounded-2xl border-2 border-black/10 focus:border-[var(--brand-cta)]/40 bg-white text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none transition-colors"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={billing.pincode}
                          onChange={e => setBilling(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                          placeholder="PIN code"
                          className="px-4 py-3 rounded-2xl border-2 border-black/10 focus:border-[var(--brand-cta)]/40 bg-white text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none transition-colors"
                        />
                      </div>

                      <select
                        value={billing.stateCode}
                        onChange={e => setBilling(p => ({ ...p, stateCode: e.target.value }))}
                        className={`w-full mb-2 px-4 py-3 rounded-2xl border-2 border-black/10 focus:border-[var(--brand-cta)]/40 bg-white text-sm focus:outline-none transition-colors ${
                          billing.stateCode ? 'text-neutral-900' : 'text-neutral-400'
                        }`}
                      >
                        <option value="">Select state…</option>
                        {STATE_OPTIONS.map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                      <p className="mb-3 text-[11px] text-neutral-400">
                        Determines whether CGST + SGST or IGST applies on your invoice.
                      </p>

                      <input
                        type="text"
                        value={billing.gstin}
                        onChange={e => handleGstinChange(e.target.value)}
                        placeholder="GSTIN (optional)"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-black/10 focus:border-[var(--brand-cta)]/40 bg-white text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none font-mono tracking-wide transition-colors"
                      />
                      <p className="mt-1.5 text-[11px] text-neutral-400">
                        Add your GSTIN to claim input tax credit. Leave blank if you don&apos;t have one.
                      </p>

                      {billingError && billing.address.trim() !== '' && (
                        <p className="mt-2 text-[11px] text-red-500">{billingError}</p>
                      )}
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 mb-4 text-center"
                      >
                        {error}
                      </motion.p>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => { setStep('pick'); setError(null); }}
                        className="flex-[0.4] py-3.5 rounded-2xl text-sm border border-black/15 text-neutral-600 hover:bg-black/5 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePay}
                        disabled={!canPay}
                        className="flex-[0.6] py-3.5 rounded-2xl text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                          : <>Pay {fmtINR(confirmedBd.total)}</>
                        }
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
