'use client';
import { Search, Sparkles } from 'lucide-react';

export default function ResearchSection() {
  return (
    <section id="research" className="py-32 bg-[var(--bg-sidebar)] text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--accent)]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-[var(--accent)] mb-8 tracking-widest uppercase">
              <Search className="w-4 h-4" /> Deep Research
            </div>
            <h2 className="font-serif text-5xl md:text-7xl font-normal mb-8 leading-[1.1] tracking-tight">
              Ask any legal question. <br />
              <span className="italic text-[var(--text-secondary)]">
                Get the answer a senior advocate would give.
              </span>
            </h2>
            <p className="text-xl text-[var(--text-muted)] leading-relaxed mb-12 font-normal">
              When a matter is complex, high-stakes, or headed to a High Court or the Supreme Court — surface research is not enough. LexRam traces the full arc of any legal principle.
            </p>

            <div className="space-y-6 mb-8">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-[var(--text-on-sidebar)]/80 font-serif italic text-xl leading-relaxed">
                  &quot;What is the test for injunction in a property dispute where the plaintiff claims adverse possession for 15 years?&quot;
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/20 to-transparent rounded-[2.5rem] transform rotate-3 scale-105 opacity-30"></div>
              <div className="relative bg-[#0a0a0a] p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                    <span className="font-medium text-white tracking-wide">Position of Law</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full uppercase tracking-widest">
                    High Confidence
                  </span>
                </div>

                <div className="space-y-6 text-base text-[var(--text-on-sidebar)]/70 leading-relaxed font-normal">
                  <p>
                    <span className="text-white font-medium">The Governing Principle:</span> To establish criminal breach of trust under Section 405 IPC (now Section 316 BNS), the prosecution must prove two essential ingredients:
                  </p>
                  <ol className="list-decimal list-inside space-y-3 pl-2 text-[var(--text-on-sidebar)]/80">
                    <li>Entrustment of property or dominion over property.</li>
                    <li>Dishonest misappropriation or conversion to one&apos;s own use.</li>
                  </ol>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5 mt-6">
                    <p>
                      <span className="text-[var(--accent)] font-medium">Leading Authority:</span> In <span className="italic text-white">S.W. Palanitkar v. State of Bihar (2002) 1 SCC 241</span>, the Supreme Court clarified that mere breach of contract cannot give rise to criminal prosecution for cheating or breach of trust unless fraudulent or dishonest intention is shown right at the beginning of the transaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
