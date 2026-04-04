'use client';

import { Scale } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import SignInBranding from '@/components/auth/SignInBranding';
import SignInForm from '@/components/auth/SignInForm';

function SignInFormWithSuspense() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm mx-auto space-y-8 animate-pulse"><div className="h-8 bg-[var(--bg-surface)] rounded w-48 mx-auto"></div><div className="space-y-4"><div className="h-12 bg-[var(--bg-surface)] rounded"></div><div className="h-12 bg-[var(--bg-surface)] rounded"></div><div className="h-12 bg-[var(--bg-surface)] rounded"></div></div></div>}>
      <SignInForm />
    </Suspense>
  );
}

export default function SignIn() {
  return (
    <div className="min-h-screen grid md:grid-cols-2 font-sans">
      <SignInBranding />

      {/* Right Panel - Form */}
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-24 bg-[var(--bg-primary)] relative">
        <div className="lg:hidden absolute top-8 left-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--text-primary)]"
          >
            <Scale className="w-6 h-6" />
            <span className="font-serif font-bold text-xl tracking-tight">
              LexRam
            </span>
          </Link>
        </div>
        <SignInFormWithSuspense />
      </div>
    </div>
  );
}
