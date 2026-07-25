'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Scale, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  readResetTicket,
  resetPasswordWithTicketUsecase,
  updatePasswordUsecase,
} from '@/modules/auth/usecase/auth.usecase';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Two ways to land here:
    //   • SMS OTP   → no session, but a single-use ticket in sessionStorage
    //   • email OTP → signed in already, Supabase does the update
    const result = readResetTicket()
      ? await resetPasswordWithTicketUsecase(newPassword, confirmPassword)
      : await updatePasswordUsecase(newPassword, confirmPassword);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Could not update password.');
      return;
    }

    toast.success('Password updated successfully', {
      description: 'You can now use your new password to sign in.',
    });
    router.push('/dashboard');
    router.refresh();
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:border-[var(--accent)] transition-all disabled:opacity-50';

  return (
    <div className="min-h-screen bg-[#fff0df] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_10px_30px_-10px_rgba(104,3,24,0.18)] p-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#680318] flex items-center justify-center">
            <Scale className="w-4 h-4 text-[#fff0df]" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#680318]">Set new password</h1>
        </div>
        <p className="text-sm text-[#680318]/60 mb-6">
          Choose a strong password for your account.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#680318]/70">New password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#680318]/70">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#680318] text-[#fff0df] px-4 py-3 rounded-xl text-sm font-medium hover:bg-[#b94826] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <Link
          href="/sign-in"
          className="block text-center text-sm text-[#b94826] hover:text-[#680318] mt-6 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
