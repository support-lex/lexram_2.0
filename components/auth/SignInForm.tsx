'use client';

import { motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotTooltip, setShowForgotTooltip] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign in failed. Please try again.');
        setLoading(false);
        return;
      }

      // Persist email so the app can derive user initials/profile
      if (data.user?.email) {
        localStorage.setItem('lexram_user_email', data.user.email);
      }

      // Sign in successful - redirect to dashboard or original path
      router.push(redirectPath);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Sign in error:', err);
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setEmail('demo@lexram.ai');
    setPassword('demo123');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'demo@lexram.ai', password: 'demo123' }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign in failed. Please try again.');
        setLoading(false);
        return;
      }

      if (data.user?.email) {
        localStorage.setItem('lexram_user_email', data.user.email);
      }

      router.push(redirectPath);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Sign in error:', err);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto space-y-8"
    >
      <div className="space-y-2 text-center lg:text-left mt-12 lg:mt-0">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Welcome back
        </h1>
        <p className="text-[var(--text-secondary)]">
          Enter your credentials to access your workspace.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSignIn}>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--text-secondary)]"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="advocate@chambers.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:border-[var(--accent)] transition-all"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--text-secondary)]"
            >
              Password
            </label>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowForgotTooltip(true);
                setTimeout(() => setShowForgotTooltip(false), 2000);
              }}
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors relative"
              title="Coming soon"
            >
              Forgot password?
              {showForgotTooltip && (
                <span className="absolute bottom-full right-0 bg-[var(--bg-sidebar)] text-white text-xs py-1 px-2 rounded whitespace-nowrap mb-1">
                  Coming soon
                </span>
              )}
            </button>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:border-[var(--accent)] transition-all"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--bg-sidebar)] text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-[var(--bg-sidebar-hover)] disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <button
          type="button"
          onClick={handleDemoSignIn}
          disabled={loading}
          className="w-full bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Loading...' : 'Try Demo Account'}
        </button>
      </form>

      {/* TODO: remove for production */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium">Demo credentials:</p>
          <p className="text-xs text-blue-600 mt-1">
            Email: any valid email<br/>
            Password: demo123
          </p>
        </div>
      )}


      <p className="text-center text-sm text-[var(--text-secondary)]">
        Don&apos;t have an account?{" "}
        <Link
          href="#"
          className="font-medium text-[var(--text-primary)] hover:underline"
        >
          Start your free trial
        </Link>
      </p>
    </motion.div>
  );
}
