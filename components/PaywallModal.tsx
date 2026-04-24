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
    price: '\u20B9999',
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
    price: '\u20B94,499',
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
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
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
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-sidebar)] text-white shadow-2xl pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="px-6 sm:px-10 py-8 sm:py-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent)]/15 mb-4"
                  >
                    <Zap className="w-7 h-7 text-[var(--accent)]" />
                  </motion.div>

                  <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-tight mb-2">
                    You&apos;ve used your <span className="text-[var(--accent)] italic">free queries</span>
                  </h2>
                  <p className="text-sm text-white/50 max-w-md mx-auto">
                    Subscribe to continue your AI-powered legal research with unlimited access
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
                      className={`relative rounded-2xl p-5 flex flex-col ${
                        plan.highlight
                          ? 'bg-white text-black ring-2 ring-[var(--accent)]'
                          : 'bg-white/5 border border-white/10 hover:bg-white/[0.07]'
                      } transition-colors`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-black text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full whitespace-nowrap">
                          {plan.badge}
                        </div>
                      )}

                      <h3 className={`text-lg font-light mb-1 ${plan.highlight ? 'text-black' : 'text-white'}`}>
                        {plan.name}
                      </h3>
                      <div className="font-serif text-3xl font-light tracking-tight mb-0.5">
                        {plan.price}
                      </div>
                      <p className={`text-xs mb-4 ${plan.highlight ? 'text-gray-500' : 'text-white/40'}`}>
                        {plan.sub}
                      </p>

                      <ul className="space-y-2.5 mb-5 flex-grow">
                        {plan.features.map(f => (
                          <li key={f} className={`flex items-start gap-2 text-xs ${plan.highlight ? 'text-gray-600' : 'text-white/60'}`}>
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.highlight ? 'text-black' : 'text-[var(--accent)]'}`} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Link
                        href="/dashboard/subscription"
                        className={`w-full py-2.5 rounded-full text-xs font-semibold tracking-wide text-center block transition-colors ${
                          plan.highlight
                            ? 'bg-black text-white hover:bg-gray-800'
                            : 'border border-white/20 text-white hover:bg-white/10'
                        }`}
                      >
                        {plan.cta}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Scale className="w-3.5 h-3.5 text-white/30" />
                  <p className="text-[11px] text-white/30">
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
