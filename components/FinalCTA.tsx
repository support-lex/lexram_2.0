'use client';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-32 bg-[var(--bg-sidebar)] text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,_var(--bg-sidebar-hover)_0%,_var(--bg-sidebar)_70%)]"></div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tight mb-8">
          Ready to transform your <span className="italic text-[var(--accent)]">practice?</span>
        </h2>
        <p className="text-xl text-[var(--text-secondary)] mb-12 font-sans max-w-2xl mx-auto">
          Join thousands of Indian advocates who have already upgraded their research and drafting workflow.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-in" className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full text-sm font-semibold tracking-wide hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-center gap-2 focus:outline-2 focus:outline-offset-2 focus:outline-white">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="mailto:contact@lexram.ai" className="w-full sm:w-auto px-8 py-4 bg-transparent text-white border border-white/20 rounded-full text-sm font-semibold tracking-wide hover:bg-white/5 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-white">
            Contact Sales
          </a>
        </div>
      </div>
    </section>
  );
}
