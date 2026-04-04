'use client';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PricingSection() {
  return (
    <section id="pricing" className="py-32 bg-[var(--bg-sidebar)] text-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[var(--accent)] mb-6 uppercase tracking-widest">
            Industry First
          </div>
          <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tight mb-6">
            Pay only for <span className="italic text-[var(--accent)]">what you use.</span>
          </h2>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-sans">
            No subscriptions. No monthly fees. Buy credits when you need them and use them for research or drafting.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Free Trial */}
          <div className="bg-white/5 p-10 rounded-[2rem] border border-white/10 flex flex-col hover:bg-white/[0.07] transition-colors">
            <h3 className="text-2xl font-light text-white mb-2">Trial</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="font-serif text-5xl font-light tracking-tight text-white">Free</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-10 font-sans">To test the waters</p>
            <ul className="space-y-6 mb-12 flex-grow">
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" /> 500 Free Credits
              </li>
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" /> ~5 Research Queries
              </li>
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" /> ~2 AI-assisted drafts
              </li>
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" /> Access to all document types
              </li>
            </ul>
            <Link href="/sign-in" className="w-full py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-colors text-sm tracking-wide text-center block">
              Claim Free Credits
            </Link>
          </div>

          {/* Pay As You Go */}
          <div className="bg-white text-black p-10 rounded-[2rem] flex flex-col relative md:my-4 shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--accent)] text-black text-xs font-bold uppercase tracking-widest py-2 px-6 rounded-full">
              Most Flexible
            </div>
            <h3 className="text-2xl font-light text-black mb-2">Top-Up</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="font-serif text-6xl font-light tracking-tight text-black">₹999</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-10 font-sans">For 10,000 Credits</p>
            <ul className="space-y-6 mb-12 flex-grow">
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-black shrink-0" /> Credits never expire
              </li>
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-black shrink-0" /> ~100 Research Queries
              </li>
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-black shrink-0" /> ~40 AI-assisted drafts
              </li>
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-black shrink-0" /> Download as Word / PDF
              </li>
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-black shrink-0" /> Priority support
              </li>
            </ul>
            <Link href="/sign-in" className="w-full py-4 rounded-full bg-black text-white font-medium hover:bg-[var(--bg-sidebar-hover)] transition-colors text-sm tracking-wide text-center block">
              Buy Credits
            </Link>
          </div>

          {/* Chamber */}
          <div className="bg-white/5 p-10 rounded-[2rem] border border-white/10 flex flex-col hover:bg-white/[0.07] transition-colors">
            <h3 className="text-2xl font-light text-white mb-2">Chamber Bulk</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="font-serif text-5xl font-light tracking-tight text-white">₹4,499</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-10 font-sans">For 50,000 Credits (10% off)</p>
            <ul className="space-y-6 mb-12 flex-grow">
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" /> Share credits with team
              </li>
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" /> Up to 5 users
              </li>
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" /> Shared matter workspaces
              </li>
              <li className="flex items-start gap-4 text-sm text-[var(--text-secondary)] font-sans">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" /> Junior/clerk review workflow
              </li>
            </ul>
            <Link href="/sign-in" className="w-full py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-colors text-sm tracking-wide text-center block">
              Buy Bulk Credits
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
