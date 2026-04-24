'use client';

import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, X, Zap, Scale } from 'lucide-react';
import Link from 'next/link';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

const plans = [
  {
    name: 'Trial',
    price: 'Free',
    sub: 'To test the waters',
    highlight: false,
    features: [
      '500 Free Credits',
      '~5 Research Queries',
      '~2 AI-assisted drafts',
      'Access to all document types',
    ],
    cta: 'Claim Free Credits',
  },
  {
    name: 'Top-Up',
    price: '₹999',
    sub: 'For 10,000 Credits',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Credits never expire',
      '~100 Research Queries',
      '~40 AI-assisted drafts',
      'Download as Word / PDF',
      'Priority support',
    ],
    cta: 'Buy Credits',
  },
  {
    name: 'Chamber Bulk',
    price: '₹4,499',
    sub: 'For 50,000 Credits',
    highlight: false,
    features: [
      'Share credits with team',
      'Up to 5 users',
      'Shared matter workspaces',
      'Junior/clerk review workflow',
    ],
    cta: 'Buy Bulk Credits',
  },
];

export default function PaywallModal({ open, onClose }: PaywallModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-neutral-950 text-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10 pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Hairline gold accent at top */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

              {/* Close */}
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 ring-1 ring-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="px-6 sm:px-10 py-9 sm:py-11">
                {/* Header */}
                <div className="text-center mb-9">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400/15 ring-1 ring-amber-400/30 mb-5"
                  >
                    <Zap className="w-7 h-7 text-amber-400" />
                  </motion.div>

                  <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-white mb-3">
                    You&apos;ve used your{' '}
                    <span className="text-amber-400 italic">free queries</span>
                  </h2>
                  <p className="text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                    Top up to keep your research moving — credits never expire,
                    no recurring charges.
                  </p>
                </div>

                {/* Plans */}
                <div className="grid sm:grid-cols-3 gap-4">
                  {plans.map((plan, i) => (
                    <motion.div
                      key={plan.name}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className={`relative rounded-2xl p-5 flex flex-col transition-colors ${
                        plan.highlight
                          ? 'bg-white text-neutral-900 ring-2 ring-amber-400 shadow-[0_12px_40px_-12px_rgba(251,191,36,0.45)]'
                          : 'bg-neutral-900 text-white ring-1 ring-white/10 hover:ring-white/20'
                      }`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-neutral-950 text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full whitespace-nowrap shadow">
                          {plan.badge}
                        </div>
                      )}

                      <h3
                        className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                          plan.highlight ? 'text-neutral-500' : 'text-neutral-400'
                        }`}
                      >
                        {plan.name}
                      </h3>
                      <div
                        className={`font-serif text-3xl font-light tracking-tight mb-1 ${
                          plan.highlight ? 'text-neutral-900' : 'text-white'
                        }`}
                      >
                        {plan.price}
                      </div>
                      <p
                        className={`text-xs mb-5 ${
                          plan.highlight ? 'text-neutral-500' : 'text-neutral-400'
                        }`}
                      >
                        {plan.sub}
                      </p>

                      <ul className="space-y-2.5 mb-6 flex-grow">
                        {plan.features.map(f => (
                          <li
                            key={f}
                            className={`flex items-start gap-2 text-xs leading-relaxed ${
                              plan.highlight ? 'text-neutral-700' : 'text-neutral-300'
                            }`}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                plan.highlight ? 'text-amber-500' : 'text-amber-400'
                              }`}
                            />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Link
                        href="/dashboard/subscription"
                        className={`w-full py-2.5 rounded-full text-xs font-semibold tracking-wide text-center block transition-colors ${
                          plan.highlight
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                            : 'bg-white/5 text-white ring-1 ring-white/15 hover:bg-white/10 hover:ring-white/30'
                        }`}
                      >
                        {plan.cta}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 mt-7">
                  <Scale className="w-3.5 h-3.5 text-neutral-500" />
                  <p className="text-[11px] text-neutral-400">
                    Credits never expire. No recurring charges.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
