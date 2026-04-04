'use client';

export default function TrustStrip() {
  return (
    <div className="bg-[var(--bg-sidebar)] border-y border-[var(--border-default)] py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-8">
          Trusted by advocates at
        </p>
        <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-50 grayscale">
          <div className="font-serif text-xl font-bold text-white">Supreme Court of India</div>
          <div className="font-serif text-xl font-bold text-white">Delhi High Court</div>
          <div className="font-serif text-xl font-bold text-white">Bombay High Court</div>
          <div className="font-serif text-xl font-bold text-white">NCLAT</div>
        </div>
      </div>
    </div>
  );
}
