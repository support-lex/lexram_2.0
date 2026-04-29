'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { useCredits } from '@/hooks/use-credits';
import { creditsApi } from '@/services/credits';
import { supabase } from '@/lib/supabase/client';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

// Quick-select shortcuts (still useful for fast checkout)
const QUICK_PACKS = [
  { amount_inr: 200,  label: '₹200',   badge: null },
  { amount_inr: 500,  label: '₹500',   badge: 'Popular' },
  { amount_inr: 1000, label: '₹1,000', badge: null },
] as const;

const MIN_AMOUNT = 1;
const CREDITS_PER_RUPEE = 0.5; // ₹2 = 1 credit

function calcCredits(amount: number): number {
  return Math.floor(amount * CREDITS_PER_RUPEE);
}

function fmtINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function PaywallModal({ open, onClose }: PaywallModalProps) {
  const { refresh } = useCredits();

  const [rawAmount, setRawAmount] = useState('');
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [confirmedAmount, setConfirmedAmount] = useState(0);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = useMemo(() => {
    const n = parseInt(rawAmount, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [rawAmount]);

  const credits = useMemo(() => calcCredits(numericAmount), [numericAmount]);
  const isValidAmount = numericAmount >= MIN_AMOUNT;

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

  const handlePay = useCallback(async () => {
    if (!confirmedAmount || phone.length < 10) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase().auth.getUser();
      const order = await creditsApi.createOrder(
        confirmedAmount,
        user?.email ?? '',
        phone,
      );

      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({ mode: 'sandbox' });

      const result = await (cashfree as any).checkout({
        paymentSessionId: order.payment_session_id,
        redirectTarget: '_modal',
      });

      if (result?.paymentDetails) {
        setTimeout(() => { refresh(); }, 3000);
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [confirmedAmount, phone, refresh, handleClose]);

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
              className="relative w-full max-w-md rounded-3xl bg-[var(--bg-sidebar)] shadow-2xl pointer-events-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Accent top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-[var(--accent)]/40 via-[var(--accent)] to-[var(--accent)]/40" />

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
                      <div className="shrink-0 w-10 h-10 rounded-2xl bg-[var(--accent)]/12 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-[var(--accent)]" />
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
                            ? 'border-[var(--accent)]/60 shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_10%,transparent)]'
                            : 'border-black/10 focus-within:border-[var(--accent)]/40'
                        }`}
                      >
                        <span className="pl-4 pr-1 text-2xl font-light text-neutral-400 select-none">₹</span>

                        <input
                          type="number"
                          inputMode="numeric"
                          min={MIN_AMOUNT}
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
                              className="shrink-0 mr-3 flex items-center gap-1 bg-[var(--accent)]/12 text-[var(--accent)] rounded-xl px-2.5 py-1.5"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span className="text-xs font-semibold tabular-nums">{credits.toLocaleString()} cr</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Live breakdown line */}
                    <AnimatePresence>
                      {isValidAmount && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="flex items-center justify-between mb-5 px-1"
                        >
                          <span className="text-xs text-neutral-400">
                            {fmtINR(numericAmount)} at ₹2 / credit
                          </span>
                          <span className="text-xs font-medium text-[var(--accent)]">
                            = {credits.toLocaleString()} credits
                          </span>
                        </motion.div>
                      )}
                      {!isValidAmount && <div key="spacer" className="mb-5" />}
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
                                  ? 'border-[var(--accent)] bg-[var(--accent)]/6'
                                  : 'border-black/8 bg-black/[0.03] hover:bg-black/[0.06] hover:border-black/15'
                              }`}
                            >
                              {pack.badge && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-neutral-900 text-[9px] font-bold uppercase tracking-widest py-0.5 px-2 rounded-full whitespace-nowrap">
                                  {pack.badge}
                                </div>
                              )}
                              <span className={`font-serif text-base font-light transition-colors ${isActive ? 'text-[var(--accent)]' : 'text-neutral-800'}`}>
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
                                    className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center"
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
                        <>Continue with {fmtINR(numericAmount)} <ChevronRight className="w-4 h-4" /></>
                      ) : (
                        <>Enter an amount to continue</>
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
                          <p className="font-serif text-3xl font-light text-neutral-900">{fmtINR(confirmedAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-400 mb-0.5">You receive</p>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                            <span className="font-serif text-2xl font-light text-[var(--accent)]">
                              {calcCredits(confirmedAmount).toLocaleString()}
                            </span>
                            <span className="text-sm text-neutral-500">credits</span>
                          </div>
                        </div>
                      </div>

                      {/* Rate line */}
                      <div className="mt-3 pt-3 border-t border-black/6 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400">Rate</span>
                        <span className="text-[11px] text-neutral-500">₹2 per credit</span>
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
                            ? 'border-[var(--accent)]/60'
                            : 'border-black/10 focus-within:border-[var(--accent)]/40'
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
                              className="mr-3 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0"
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
                        disabled={loading || phone.length < 10}
                        className="flex-[0.6] py-3.5 rounded-2xl text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                          : <>Pay {fmtINR(confirmedAmount)}</>
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
