'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import OtpInput from '@/components/auth/OtpInput';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { supabase } from '@/lib/supabase/client';
import {
  signupUsecase,
  loginUsecase,
  verifySignupOtpUsecase,
  sendResetOtpUsecase,
  verifyResetOtpUsecase,
  resendOtpUsecase,
  sendVerificationOtpUsecase,
  logoutUsecase,
  type OtpChannel,
} from '@/modules/auth/usecase/auth.usecase';

type Mode = 'signin' | 'signup' | 'otp' | 'forgot';
type OtpIntent = 'signup' | 'reset';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Singapore', 'UAE', 'Germany', 'France', 'Other',
];

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const initialMode: Mode = searchParams.get('intent') === 'signup' ? 'signup' : 'signin';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Skip the form entirely if there's already a verified session — the user
  // is just clicking "Sign in" out of habit. Bounce them straight to the
  // dashboard. Renders a small spinner while the check is in flight so we
  // don't flash the form.
  const [sessionChecked, setSessionChecked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    supabase().auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const u = data.user;
      if (u && u.phone_confirmed_at) {
        router.replace(redirectPath);
        return;
      }
      setSessionChecked(true);
    });
    return () => { cancelled = true; };
  }, [router, redirectPath]);

  // Sign-in
  const [signinMethod, setSigninMethod] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [signinPhone, setSigninPhone] = useState('');
  const [password, setPassword] = useState('');

  // Sign-up
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  // Forgot password
  const [forgotIdentifier, setForgotIdentifier] = useState('');

  // OTP screen state
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpContact, setOtpContact] = useState('');
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('email');
  const [otpIntent, setOtpIntent] = useState<OtpIntent>('signup');
  const [cooldown, setCooldown] = useState(0);

  // ── Cooldown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const switchMode = (next: Mode) => {
    setError('');
    setMode(next);
  };

  const goBackFromOtp = () => {
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    switchMode(otpIntent === 'signup' ? 'signup' : 'forgot');
  };

  // ── Sign in ─────────────────────────────────────────────────────────────────

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Build the identifier from whichever input the user filled in.
    const idForLogin =
      signinMethod === 'phone'
        ? (signinPhone.startsWith('+') ? signinPhone : `+${signinPhone}`)
        : identifier;
    const result = await loginUsecase(idForLogin, password);

    if (!result.success) {
      setLoading(false);
      setError(result.error ?? 'Sign in failed.');
      return;
    }

    // ── Verification gate ────────────────────────────────────────────────────
    // Phone OTP is the ONLY thing that counts as verified. If the user logged
    // in with valid credentials but never confirmed their phone, we must NOT
    // let them into the dashboard. Sign them out, fire a fresh OTP, and drop
    // them on the OTP screen with their phone prefilled.
    if (!result.phoneVerified) {
      const phoneToVerify = result.phone || result.user?.phone || '';
      if (!phoneToVerify) {
        setLoading(false);
        setError('Your account has no phone on file. Please contact support.');
        await logoutUsecase();
        return;
      }

      // End the unverified session before they can navigate anywhere.
      await logoutUsecase();

      // Trigger a fresh OTP so the user gets a new code.
      const otpResult = await sendVerificationOtpUsecase(phoneToVerify);
      setLoading(false);
      if (!otpResult.success) {
        setError(otpResult.error ?? 'Could not send verification code.');
        return;
      }

      setOtpContact(phoneToVerify);
      setOtpChannel('sms');
      setOtpIntent('signup'); // reuse signup OTP verification path
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setCooldown(RESEND_COOLDOWN);
      setMode('otp');
      toast.info('Verify your phone to continue', {
        description: `Code sent via SMS to ${phoneToVerify}`,
      });
      return;
    }

    setLoading(false);
    toast.success(`Welcome${result.user?.first_name ? `, ${result.user.first_name}` : ' back'}!`);
    router.push(redirectPath);
    router.refresh();
  };

  // ── Sign up → trigger OTP ──────────────────────────────────────────────────

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // PhoneInput stores the value without a leading "+" — prepend it before
    // handing to the usecase so the E.164 validator (and Supabase) accept it.
    const e164Phone = signupPhone.startsWith('+') ? signupPhone : `+${signupPhone}`;
    const result = await signupUsecase({
      first_name: firstName,
      last_name: lastName,
      country,
      email: signupEmail,
      phone: e164Phone,
      password: signupPassword,
      confirm_password: signupConfirm,
    });
    setLoading(false);
    if (!result.success) { setError(result.error ?? 'Signup failed.'); return; }

    // Move to OTP screen — code goes to the user's phone via SMS.
    setOtpContact(result.otpPhone ?? e164Phone);
    setOtpChannel('sms');
    setOtpIntent('signup');
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setCooldown(RESEND_COOLDOWN);
    setMode('otp');
    toast.success('OTP sent', { description: `Code sent via SMS to ${result.otpPhone ?? e164Phone}` });
  };

  // ── Forgot password → trigger OTP ──────────────────────────────────────────

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await sendResetOtpUsecase(forgotIdentifier);
    setLoading(false);
    if (!result.success) { setError(result.error ?? 'Could not send OTP.'); return; }

    setOtpContact(result.contact ?? forgotIdentifier);
    setOtpChannel(result.channel ?? 'email');
    setOtpIntent('reset');
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setCooldown(RESEND_COOLDOWN);
    setMode('otp');
    toast.success('OTP sent', {
      description: result.channel === 'sms'
        ? `Code sent via SMS to ${result.contact}`
        : `Check ${result.contact} for the 6-digit code.`,
    });
  };

  // ── Verify OTP (handles both signup and reset intents) ─────────────────────

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    const token = otpDigits.join('');
    const result =
      otpIntent === 'signup'
        ? await verifySignupOtpUsecase(otpContact, token)
        : await verifyResetOtpUsecase(otpContact, otpChannel, token);
    setLoading(false);

    if (!result.success) { setError(result.error ?? 'Verification failed.'); return; }

    if (otpIntent === 'signup') {
      toast.success(`Welcome${result.user?.first_name ? `, ${result.user.first_name}` : ''}!`);
      router.push(redirectPath);
      router.refresh();
    } else {
      // User is now signed in via OTP — let them set a new password.
      router.push('/reset-password');
      router.refresh();
    }
  };

  // ── Resend ──────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    const result = await resendOtpUsecase(otpContact, otpChannel);
    setLoading(false);
    if (!result.success) { setError(result.error ?? 'Could not resend OTP.'); return; }
    setCooldown(RESEND_COOLDOWN);
    toast.success('OTP resent');
  };

  const otpComplete = useMemo(() => otpDigits.every((d) => d), [otpDigits]);

  // ── Shared input class ──────────────────────────────────────────────────────
  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:border-[var(--accent)] transition-all disabled:opacity-50';

  const heading = {
    signin: { title: 'Welcome back', sub: 'Sign in with your email or phone number.' },
    signup: { title: 'Create account', sub: 'Join LexRam for AI-powered legal research.' },
    otp: {
      title: otpIntent === 'signup' ? 'Verify your email' : 'Verify your identity',
      sub: `Enter the ${OTP_LENGTH}-digit code sent to ${otpContact || (otpChannel === 'sms' ? 'your phone' : 'your email')}.`,
    },
    forgot: { title: 'Forgot password', sub: 'Enter your email or phone to receive a verification code.' },
  }[mode];

  // While the session probe is in flight, render a small spinner so we don't
  // flash the form for users who are already logged in.
  if (!sessionChecked) {
    return (
      <div className="w-full max-w-sm mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto space-y-6"
    >
      <div className="space-y-2 text-center lg:text-left mt-12 lg:mt-0">
        {(mode === 'otp' || mode === 'forgot') && (
          <button
            type="button"
            onClick={() => mode === 'otp' ? goBackFromOtp() : switchMode('signin')}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          {heading.title}
        </h1>
        <p className="text-[var(--text-secondary)]">{heading.sub}</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ─── SIGN IN ──────────────────────────────────────────────────────── */}
        {mode === 'signin' && (
          <motion.form
            key="signin"
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }} className="space-y-5" onSubmit={handleSignIn}
          >
            {/* Method toggle */}
            <div className="flex gap-2 p-1 rounded-xl bg-[var(--surface-hover,#f3f4f6)] border border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setSigninMethod('phone')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  signinMethod === 'phone'
                    ? 'bg-white text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Phone
              </button>
              <button
                type="button"
                onClick={() => setSigninMethod('email')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  signinMethod === 'email'
                    ? 'bg-white text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Email
              </button>
            </div>

            {signinMethod === 'phone' ? (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Phone number
                </label>
                <PhoneInput
                  country={'in'}
                  value={signinPhone}
                  onChange={(value) => setSigninPhone(value)}
                  disabled={loading}
                  enableSearch
                  inputClass="lexram-phone-input"
                  buttonClass="lexram-phone-button"
                  containerClass="lexram-phone-container"
                  dropdownClass="lexram-phone-dropdown"
                  searchClass="lexram-phone-search"
                  inputProps={{ name: 'phone', required: true, autoComplete: 'tel' }}
                  preferredCountries={['in', 'us', 'gb', 'ae', 'sg', 'ca', 'au']}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="block text-sm font-medium text-[var(--text-secondary)]">
                  Email address
                </label>
                <input
                  id="identifier" type="email" placeholder="advocate@chambers.com"
                  value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  className={inputCls} required disabled={loading} autoComplete="email"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(
                      signinMethod === 'phone'
                        ? (signinPhone ? (signinPhone.startsWith('+') ? signinPhone : `+${signinPhone}`) : '')
                        : identifier
                    );
                    switchMode('forgot');
                  }}
                  className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-10`} required disabled={loading} autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-[var(--bg-sidebar)] text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-[var(--bg-sidebar-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </motion.form>
        )}

        {/* ─── SIGN UP ──────────────────────────────────────────────────────── */}
        {mode === 'signup' && (
          <motion.form
            key="signup"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }} className="space-y-4" onSubmit={handleSignUp}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">First name</label>
                <input type="text" placeholder="Arjun" value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required disabled={loading} className={inputCls} autoComplete="given-name" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Last name</label>
                <input type="text" placeholder="Sharma" value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required disabled={loading} className={inputCls} autoComplete="family-name" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}
                required disabled={loading} className={`${inputCls} text-[var(--text-primary)]`}>
                <option value="" disabled>Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Email address</label>
              <input type="email" placeholder="advocate@chambers.com"
                value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                required disabled={loading} className={inputCls} autoComplete="email" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Phone number</label>
              <PhoneInput
                country={'in'}
                value={signupPhone}
                onChange={(value) => setSignupPhone(value)}
                disabled={loading}
                enableSearch
                inputClass="lexram-phone-input"
                buttonClass="lexram-phone-button"
                containerClass="lexram-phone-container"
                dropdownClass="lexram-phone-dropdown"
                searchClass="lexram-phone-search"
                inputProps={{ name: 'phone', required: true, autoComplete: 'tel' }}
                preferredCountries={['in', 'us', 'gb', 'ae', 'sg', 'ca', 'au']}
              />
              <p className="text-xs text-[var(--text-muted)]">
                Pick your country, then enter your number. We&apos;ll send a 6-digit code via SMS.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters"
                  value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                  required disabled={loading} className={`${inputCls} pr-10`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Confirm password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} placeholder="Repeat password"
                  value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)}
                  required disabled={loading} className={`${inputCls} pr-10`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[var(--bg-sidebar)] text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-[var(--bg-sidebar-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </motion.form>
        )}

        {/* ─── FORGOT PASSWORD ─────────────────────────────────────────────── */}
        {mode === 'forgot' && (
          <motion.form
            key="forgot"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }} className="space-y-5" onSubmit={handleSendResetOtp}
          >
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Email or phone</label>
              <input
                type="text" placeholder="advocate@chambers.com or +91…"
                value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)}
                className={inputCls} required disabled={loading} autoComplete="username"
              />
              <p className="text-xs text-[var(--text-muted)]">
                We&apos;ll send a 6-digit verification code to your email or phone.
              </p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[var(--bg-sidebar)] text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-[var(--bg-sidebar-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </motion.form>
        )}

        {/* ─── OTP ─────────────────────────────────────────────────────────── */}
        {mode === 'otp' && (
          <motion.form
            key="otp"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }} className="space-y-5" onSubmit={handleVerifyOtp}
          >
            <OtpInput
              value={otpDigits}
              onChange={setOtpDigits}
              disabled={loading}
              autoFocus
            />

            <button
              type="submit" disabled={loading || !otpComplete}
              className="w-full bg-[var(--bg-sidebar)] text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-[var(--bg-sidebar-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center text-sm">
              {cooldown > 0 ? (
                <span className="text-[var(--text-muted)]">Resend OTP in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="font-medium text-[var(--text-primary)] hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Mode toggle (signin/signup only) */}
      {(mode === 'signin' || mode === 'signup') && (
        <p className="text-center text-sm text-[var(--text-secondary)]">
          {mode === 'signin' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => switchMode('signup')}
                className="font-medium text-[var(--text-primary)] hover:underline">Create one</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => switchMode('signin')}
                className="font-medium text-[var(--text-primary)] hover:underline">Sign in</button>
            </>
          )}
        </p>
      )}

      {mode === 'signup' && (
        <p className="text-center text-xs text-[var(--text-muted)]">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="underline hover:text-[var(--text-primary)]">Terms</Link>
          {' & '}
          <Link href="/privacy" className="underline hover:text-[var(--text-primary)]">Privacy Policy</Link>
        </p>
      )}
    </motion.div>
  );
}
