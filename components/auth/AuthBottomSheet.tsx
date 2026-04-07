'use client';

import { motion } from 'motion/react';
import { Scale } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthBottomSheetProps {
  // Kept for backwards compat — auth state now flips via Supabase
  // onAuthStateChange in the dashboard layout, so this prop is unused.
  onAuthenticated?: () => void;
}

export default function AuthBottomSheet(_props: AuthBottomSheetProps) {
  const router = useRouter();
  const pathname = usePathname();

  const goToSignIn = (mode: 'signin' | 'signup') => {
    const params = new URLSearchParams();
    if (pathname) params.set('redirect', pathname);
    if (mode === 'signup') params.set('intent', 'signup');
    router.push(`/sign-in?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 32, stiffness: 280, delay: 0.6 }}
      className="fixed inset-x-0 bottom-0 z-50"
    >
      <div className="h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      <div className="bg-white border-t border-gray-200 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-sidebar)] flex items-center justify-center flex-shrink-0">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-gray-900 leading-tight">
                Sign in to continue
              </h2>
              <p className="text-xs text-gray-500">
                Free access to AI-powered legal research
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => goToSignIn('signin')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-sidebar)] text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              Sign in with phone
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => goToSignIn('signup')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 transition-all"
            >
              Create new account
            </motion.button>
          </div>

          <p className="text-center text-[10px] text-gray-400 mt-3 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-gray-600">Terms</a>{' & '}
            <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
