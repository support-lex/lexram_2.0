'use client';
import { Star } from 'lucide-react';

export default function TestimonialsSection() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white text-black">
      <div className="text-center mb-20">
        <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tight max-w-4xl mx-auto mb-6">
          Advocates have stopped doing research <span className="italic text-[var(--text-secondary)]">the old way.</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
        {[
          {
            quote: "I used to spend 4 hours finding the right precedent for a complex bail matter. LexRam gives me the exact Supreme Court judgment, with the relevant paragraph highlighted, in 10 seconds.",
            author: "Vikram S.",
            role: "Criminal Defense Advocate",
          },
          {
            quote: "The drafting suite is incredible. It doesn't just give you a template; it builds the writ petition around the specific facts I input, complete with the latest case laws.",
            author: "Priya M.",
            role: "High Court Practitioner",
          },
          {
            quote: "As a chamber with 5 juniors, LexRam has standardized our research quality. I no longer worry if a junior missed a recent overruling judgment.",
            author: "Rajesh K.",
            role: "Senior Partner",
          },
        ].map((t, i) => (
          <div key={i} className="bg-[var(--bg-surface)] p-10 rounded-[2rem] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 flex flex-col">
            <div className="flex gap-1 mb-8">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-black text-black" />
              ))}
            </div>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-10 flex-grow font-sans">
              &quot;{t.quote}&quot;
            </p>
            <div className="flex items-center gap-4 border-t border-[var(--border-default)] pt-6">
              <div className="w-12 h-12 bg-[var(--bg-primary)] rounded-full flex items-center justify-center font-medium text-[var(--text-primary)] text-sm ring-1 ring-[var(--border-default)] shadow-[var(--shadow-card)] font-sans">
                {t.author.split(" ")[0][0]}
              </div>
              <div>
                <p className="text-sm font-medium text-black tracking-wide">
                  {t.author}
                </p>
                <p className="text-xs text-[var(--text-muted)] font-normal mt-0.5 font-sans">
                  {t.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
