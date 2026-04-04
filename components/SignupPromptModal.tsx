'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Loader2, Eye, EyeOff, Mail, UserPlus } from 'lucide-react';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

interface SignupPromptModalProps {
  open: boolean;
  onAuthenticated: () => void;
}

export default function SignupPromptModal({ open, onAuthenticated }: SignupPromptModalProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const doAuth = async (authEmail: string, authPassword: string) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Authentication failed. Please try again.');
        setLoading(false);
        return;
      }
      if (data.user?.email) {
        localStorage.setItem('lexram_user_email', data.user.email);
      }
      onAuthenticated();
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doAuth(email, password);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — NOT closable */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl pointer-events-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Top accent bar */}
              <div className="h-1 bg-gradient-to-r from-[var(--accent)] via-amber-400 to-[var(--accent)]" />

              <div className="px-7 py-8">
                {/* Header */}
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
                    Create a free account to get <span className="font-semibold text-gray-700">3 research queries</span> and continue your conversation
                  </p>
                </div>

                {!showEmailForm ? (
                  <div className="space-y-2.5">
                    {/* Google */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => doAuth('demo@lexram.ai', 'demo123')}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                    >
                      <GoogleIcon className="w-5 h-5" />
                      Continue with Google
                    </motion.button>

                    {/* Email */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowEmailForm(true)}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                      <Mail className="w-4 h-4 text-gray-600" />
                      Continue with Email
                    </motion.button>

                    {/* Demo */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => doAuth('demo@lexram.ai', 'demo123')}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Signing in...' : 'Try Demo Account'}
                    </motion.button>

                    <p className="text-center text-xs text-gray-400 pt-1">
                      {mode === 'signup' ? (
                        <>Already have an account?{' '}<button onClick={() => setMode('signin')} className="font-semibold text-gray-700 hover:underline">Sign in</button></>
                      ) : (
                        <>New here?{' '}<button onClick={() => setMode('signup')} className="font-semibold text-gray-700 hover:underline">Create account</button></>
                      )}
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <form onSubmit={handleSubmit} className="space-y-3">
                      {error && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                          {error}
                        </div>
                      )}

                      {mode === 'signup' && (
                        <input
                          type="text"
                          placeholder="Full name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all text-sm"
                          disabled={loading}
                        />
                      )}

                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all text-sm"
                        required
                        disabled={loading}
                      />

                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all text-sm"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--bg-sidebar)] text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                      </button>
                    </form>

                    <button
                      onClick={() => { setShowEmailForm(false); setError(''); }}
                      className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition-colors"
                    >
                      Back to all options
                    </button>
                  </motion.div>
                )}

                {/* Legal + benefit */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Scale className="w-3 h-3 text-[var(--accent)]" />
                    <span className="text-[11px] font-medium text-gray-600">Free account includes 3 AI research queries</span>
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
