'use client';
import { Clock, Search, FileText } from 'lucide-react';

export default function ProblemSection() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white text-black">
      <div className="text-center mb-24">
        <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tight mb-6">
          The old way of research is <span className="italic text-[var(--text-secondary)]">broken.</span>
        </h2>
        <p className="text-xl text-[var(--text-muted)] font-sans max-w-2xl mx-auto">
          We built LexRam to fix it.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        {[
          { icon: Clock, title: "Hours Wasted", desc: "Stop spending half your day pulling judgments and reading headnotes." },
          { icon: Search, title: "Incomplete Picture", desc: "Never miss if a precedent has been distinguished or quietly overruled." },
          { icon: FileText, title: "Starting from Scratch", desc: "Stop building every writ petition and application from a blank page." }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 rounded-full border border-[var(--border-default)] flex items-center justify-center mb-8 group-hover:border-[var(--text-primary)] transition-colors">
              <item.icon className="w-8 h-8 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
            </div>
            <h3 className="text-2xl font-normal text-[var(--text-primary)] mb-4 font-sans">{item.title}</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed font-sans">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
