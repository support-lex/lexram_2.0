'use client';

import { CheckCircle2 } from 'lucide-react';
import { stories } from '@/lib/data';

export default function UserStoriesSection() {
  return (
    <section className="py-24 bg-[var(--bg-surface)] border-y border-[var(--border-default)]/50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4">
            Real advocates. Real matters. Real results.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 stagger-children">
          {stories.map((story, i) => (
            <div
              key={i}
              className="bg-[var(--bg-primary)] p-8 rounded-3xl ring-1 ring-[var(--border-default)]/50 shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[var(--bg-sidebar)] rounded-full flex items-center justify-center font-serif font-bold text-[var(--accent)] text-lg shadow-sm">
                  {story.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">
                    {story.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] font-medium">
                    {story.name}
                  </p>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed font-medium">
                {story.desc}
              </p>
              <div className="bg-[var(--bg-surface)] p-5 rounded-2xl ring-1 ring-[var(--border-default)]/50 mb-6 shadow-[var(--shadow-card)]">
                <p className="text-sm text-[var(--text-primary)] font-serif italic">
                  &quot;{story.action}&quot;
                </p>
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)] flex items-start gap-2 bg-emerald-500/10 text-emerald-600 p-3 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                {story.result}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
