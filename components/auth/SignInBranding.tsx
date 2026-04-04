'use client';

import { Scale } from 'lucide-react';
import Link from 'next/link';

export default function SignInBranding() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-[var(--bg-sidebar)] text-[var(--text-on-sidebar)] p-12 relative overflow-hidden">
      {/* Background pattern/gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-[var(--surface-hover)]/50 via-[var(--bg-sidebar)] to-[var(--bg-sidebar)]"></div>

      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--text-on-sidebar)] hover:opacity-80 transition-opacity"
        >
          <Scale className="w-6 h-6" />
          <span className="font-serif font-bold text-xl tracking-tight">
            LexRam
          </span>
        </Link>
      </div>

      <div className="relative z-10 max-w-md">
        <blockquote className="space-y-6">
          <p className="font-serif text-3xl leading-tight text-[var(--text-on-sidebar)]">
            &quot;LexRam has completely transformed how our chamber approaches
            legal research and drafting. It&apos;s like having a senior
            advocate available 24/7.&quot;
          </p>
          <footer className="text-sm text-[var(--text-muted)]">
            <p className="font-bold text-[var(--text-on-sidebar)] uppercase tracking-wider mb-1">
              Senior Advocate
            </p>
            <p>Supreme Court of India</p>
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
