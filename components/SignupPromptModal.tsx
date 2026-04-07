'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Scale, UserPlus } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface SignupPromptModalProps {
  open: boolean;
  // Kept for backwards compat — auth flips via Supabase onAuthStateChange now.
  onAuthenticated?: () => void;
}

export default function SignupPromptModal({ open }: SignupPromptModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const goToSignIn = (intent: 'signin' | 'signup') => {
    const params = new URLSearchParams();
    if (pathname) params.set('redirect', pathname);
    if (intent === 'signup') params.set('intent', 'signup');
    router.push(`/sign-in?${params.toString()}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1 bg-gradient-to-r from-[var(--accent)] via-amber-400 to-[var(--accent)]" />

              <div className="px-7 py-8">
                <div className="flex flex-col items-center text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-[var(--bg-sidebar)] flex items-center justify-center mb-4"
                  >
                    <UserPlus className="w-6 h-6 text-[var(--accent)]" />
                  </motion.div>

                  <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1.5">
                    Sign up to keep going
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                    Create a free account to get{' '}
                    <span className="font-semibold text-gray-700">3 research queries</span> and continue your conversation
                  </p>
                </div>

                <div className="space-y-2.5">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToSignIn('signup')}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-sidebar)] text-white text-sm font-semibold hover:opacity-90 transition-all"
                  >
                    Create account with phone
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToSignIn('signin')}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 transition-all"
                  >
                    I already have an account
                  </motion.button>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Scale className="w-3 h-3 text-[var(--accent)]" />
                    <span className="text-[11px] font-medium text-gray-600">
                      Free account includes 3 AI research queries
                    </span>
                  </div>
                  <p className="text-center text-[10px] text-gray-400 leading-relaxed">
                    By continuing, you agree to our{' '}
                    <a href="/terms" className="underline hover:text-gray-600">Terms</a>{' & '}
                    <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>
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
