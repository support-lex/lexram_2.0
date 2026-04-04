'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Scale, ArrowUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const suggestions = [
  'What are the grounds for divorce under HMA?',
  'Does POCSO apply to marital offences?',
  'How is maintenance calculated under §125 CrPC?',
  'Explain Section 498A IPC',
];

export default function Hero() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleAsk(text?: string) {
    const q = (text ?? query).trim();
    if (!q) return;
    sessionStorage.setItem('lexram_pending_query', q);
    router.push('/dashboard/research-3');
  }

  return (
    <section className="relative flex items-center justify-center bg-[var(--bg-sidebar)] text-white overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--bg-sidebar-hover)_0%,_var(--bg-sidebar)_70%)]" aria-hidden="true" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-[var(--accent)]/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-medium tracking-wide text-[var(--accent)] uppercase"
          >
            <Scale className="w-4 h-4" />
            LexRam 2.0 is Live
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[1.1]"
          >
            The Legal AI for <br />
            <span className="italic text-[var(--accent)]">Indian Advocates.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl mx-auto font-sans text-base md:text-lg text-[var(--text-muted)] font-normal leading-relaxed"
          >
            Instant access to the full depth of Indian jurisprudence. Research, draft, and analyze with the precision of a senior advocate.
          </motion.p>

          {/* ── Ask Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 w-full max-w-xl"
          >
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl focus-within:border-[var(--accent)]/50 focus-within:bg-white/10 transition-all shadow-lg">
              <input
                className="flex-1 bg-transparent text-base text-white placeholder-white/40 outline-none font-sans"
                placeholder="Ask a legal question..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && query.trim()) handleAsk(); }}
              />
              <motion.button
                onClick={() => handleAsk()}
                disabled={!query.trim()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black hover:bg-[var(--accent)] hover:text-white transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {suggestions.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
                  whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAsk(s)}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:border-white/25 hover:text-white/80 transition-colors"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/sign-in" className="group relative overflow-hidden px-7 py-3 bg-white text-black rounded-full text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-shadow hover:shadow-[0_0_24px_rgba(255,255,255,0.2)]">
                Start Free Trial
                <motion.span
                  className="inline-block"
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <a href="#pricing" className="px-7 py-3 bg-transparent text-white border border-white/20 rounded-full text-sm font-semibold tracking-wide hover:bg-white/5 hover:border-white/35 transition-all block">
                View Pricing
              </a>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
