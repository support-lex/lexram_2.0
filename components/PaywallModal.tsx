'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, CreditCard, Loader2 } from 'lucide-react';
import { useCredits } from '@/hooks/use-credits';
import { creditsApi } from '@/services/credits';
import { supabase } from '@/lib/supabase/client';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

const PACKS = [
  { amount_inr: 200,  credits: 100, label: '₹200',  sub: '100 Credits' },
  { amount_inr: 500,  credits: 250, label: '₹500',  sub: '250 Credits', badge: 'Popular' },
  { amount_inr: 1000, credits: 500, label: '₹1,000', sub: '500 Credits' },
] as const;

type Pack = (typeof PACKS)[number];

export default function PaywallModal({ open, onClose }: PaywallModalProps) {
  const { refresh } = useCredits();
  const [step, setStep] = useState<'packs' | 'confirm'>('packs');
  const [selected, setSelected] = useState<Pack | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setStep('packs');
    setSelected(null);
    setPhone('');
    setError(null);
    onClose();
  }, [onClose]);

  const handlePackSelect = (pack: Pack) => {
    setSelected(pack);
    setStep('confirm');
    setError(null);
  };

  const handlePay = useCallback(async () => {
    if (!selected || phone.length < 10) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase().auth.getUser();
      const order = await creditsApi.createOrder(
        selected.amount_inr,
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
        // Webhook may take 2-3 s to credit the balance
        setTimeout(() => { refresh(); }, 3000);
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selected, phone, refresh, handleClose]);

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-sidebar)] shadow-2xl pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-neutral-900" />
              </button>

              <div className="px-8 py-8">
                {step === 'packs' ? (
                  <>
                    {/* Header */}
                    <div className="text-center mb-7">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--accent)]/15 mb-3">
                        <Zap className="w-6 h-6 text-[var(--accent)]" />
                      </div>
                      <h2 className="font-serif text-2xl font-light tracking-tight text-neutral-900 mb-1">
                        You&apos;ve used your <span className="text-[var(--accent)] italic">free queries</span>
                      </h2>
                      <p className="text-xs text-neutral-500">
                        Credits never expire. No subscription required.
                      </p>
                    </div>

                    {/* Pack grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {PACKS.map((pack) => (
                        <button
                          key={pack.amount_inr}
                          onClick={() => handlePackSelect(pack)}
                          className={`relative rounded-2xl p-4 flex flex-col text-left transition-all border-2 ${
                            'badge' in pack
                              ? 'border-[var(--accent)] bg-white'
                              : 'border-black/10 bg-black/5 hover:bg-black/[0.08]'
                          }`}
                        >
                          {'badge' in pack && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-neutral-900 text-[9px] font-bold uppercase tracking-widest py-0.5 px-2.5 rounded-full whitespace-nowrap">
                              {pack.badge}
                            </div>
                          )}
                          <div className="font-serif text-xl font-light text-neutral-900 mb-0.5">{pack.label}</div>
                          <div className="text-xs text-neutral-500">{pack.sub}</div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Confirm step */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--accent)]/15 mb-3">
                        <CreditCard className="w-6 h-6 text-[var(--accent)]" />
                      </div>
                      <h2 className="font-serif text-2xl font-light text-neutral-900 mb-1">
                        Confirm purchase
                      </h2>
                      <p className="text-sm text-neutral-500">
                        {selected?.label} → {selected?.credits} credits
                      </p>
                    </div>

                    <div className="mb-5">
                      <label className="block text-xs text-neutral-500 mb-1.5">
                        Mobile number (required by payment gateway)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        className="w-full px-4 py-3 rounded-xl border border-black/15 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                      />
                    </div>

                    {error && (
                      <p className="text-xs text-red-500 mb-4 text-center">{error}</p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setStep('packs'); setError(null); }}
                        className="flex-1 py-3 rounded-full text-sm border border-black/20 text-neutral-700 hover:bg-black/5 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePay}
                        disabled={loading || phone.length < 10}
                        className="flex-1 py-3 rounded-full text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                        ) : (
                          <>Pay {selected?.label}</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
