'use client';

export default function StatsSection() {
  return (
    <section className="py-32 bg-[var(--bg-sidebar)] text-white px-4 sm:px-6 lg:px-8 border-y border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="font-serif text-5xl md:text-7xl font-light mb-6 tracking-tight">
            The depth behind <span className="italic text-[var(--accent)]">every answer.</span>
          </h2>
          <p className="text-[var(--text-muted)] text-xl font-light">
            Powered by the most comprehensive legal database in India.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {[
            { value: "50k+", label: "Supreme Court Judgments" },
            { value: "200k+", label: "Precedent Relationships" },
            { value: "1.5k+", label: "Central Acts & Statutes" },
            { value: "8s", label: "Avg. Research Time" }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-serif text-6xl md:text-8xl font-light mb-4 text-white tracking-tighter">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest font-sans">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
