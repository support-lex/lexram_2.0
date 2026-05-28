'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Layers } from 'lucide-react';
import { MOCK_ACTS } from '@/lib/lexram/mock';
import type { Act } from '@/lib/lexram/types';

const domainAccents: Record<string, string> = {
  'Family Law': 'border-l-amber-500',
  'Criminal Law': 'border-l-red-500',
  'Labour Law': 'border-l-blue-500',
  'Civil Law': 'border-l-emerald-500',
  'Banking Law': 'border-l-violet-500',
  'Constitutional Law': 'border-l-indigo-500',
  'Corporate Law': 'border-l-slate-500',
  'Environmental Law': 'border-l-green-500',
  'Healthcare Law': 'border-l-pink-500',
  'IP Law': 'border-l-cyan-500',
  'Commercial Law': 'border-l-orange-500',
  'Tax Law': 'border-l-yellow-500',
  'Property Law': 'border-l-teal-500',
  'Transport Law': 'border-l-gray-500',
  'Telecom Law': 'border-l-sky-500',
  'Social Welfare': 'border-l-rose-500',
};

interface DomainEntry {
  acts: Act[];
  chaptersCount: number;
  sectionsCount: number;
}

export default function DomainsPage() {
  const router = useRouter();
  const acts: Act[] = useMemo(() => MOCK_ACTS, []);

  const domainData = useMemo<[string, DomainEntry][]>(() => {
    const map = new Map<string, DomainEntry>();
    acts.forEach((act) => {
      const d = act.domain || 'Uncategorized';
      if (!map.has(d)) map.set(d, { acts: [], chaptersCount: 0, sectionsCount: 0 });
      const entry = map.get(d)!;
      entry.acts.push(act);
      entry.sectionsCount += act.sections_count || 0;
      entry.chaptersCount += act.chapter_count || 0;
    });
    return Array.from(map.entries()).sort((a, b) => b[1].acts.length - a[1].acts.length);
  }, [acts]);

  const totalSections = domainData.reduce((s, [, d]) => s + d.sectionsCount, 0);

  function handleSelectDomain(domain: string) {
    router.push(`/dashboard/acts?domain=${encodeURIComponent(domain)}`);
  }

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Hero */}
          <section className="bg-charcoal-950 text-white rounded-2xl px-8 pt-10 pb-12 mb-8">
            <p className="text-xs font-medium tracking-widest uppercase text-charcoal-400 mb-3">
              Legal Intelligence
            </p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">
              Explore by Legal Domain
            </h1>
            <p className="text-charcoal-400 max-w-xl leading-relaxed">
              {acts.length} central acts organized across {domainData.length} legal domains. Select
              a domain to browse its legislation.
            </p>
          </section>

          {/* Domain grid */}
          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {domainData.map(([domain, data]) => (
                <div
                  key={domain}
                  onClick={() => handleSelectDomain(domain)}
                  className={`bg-[var(--bg-surface)] border border-[var(--border-default)] border-l-4 ${
                    domainAccents[domain] || 'border-l-charcoal-400'
                  } rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-charcoal-300 transition-all group`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-serif text-xl font-bold text-[var(--text-primary)] group-hover:text-charcoal-700 transition-colors">
                      {domain}
                    </h3>
                    <span className="text-xs text-charcoal-400 font-mono bg-charcoal-50 px-2 py-1 rounded">
                      {data.acts.length} acts
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {data.acts.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className="text-xs px-2 py-0.5 rounded bg-charcoal-100 text-charcoal-600 truncate max-w-44"
                      >
                        {a.name}
                      </span>
                    ))}
                    {data.acts.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-charcoal-100 text-charcoal-500">
                        +{data.acts.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-charcoal-100">
                    <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                      <FileText className="w-3 h-3" />
                      <span>{data.sectionsCount} sections</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                      <Layers className="w-3 h-3" />
                      <span>{data.chaptersCount} chapters</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Stats */}
          <section className="bg-charcoal-950 text-white py-10 px-8 rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-charcoal-800 text-center">
              <div className="px-4">
                <div className="text-3xl font-serif font-bold mb-1">{acts.length}</div>
                <div className="text-xs font-medium uppercase tracking-widest text-charcoal-400">
                  Central Acts
                </div>
              </div>
              <div className="px-4">
                <div className="text-3xl font-serif font-bold mb-1">{domainData.length}</div>
                <div className="text-xs font-medium uppercase tracking-widest text-charcoal-400">
                  Legal Domains
                </div>
              </div>
              <div className="px-4">
                <div className="text-3xl font-serif font-bold mb-1">{totalSections}</div>
                <div className="text-xs font-medium uppercase tracking-widest text-charcoal-400">
                  Sections Mapped
                </div>
              </div>
              <div className="px-4">
                <div className="text-3xl font-serif font-bold mb-1">1860&#8211;2023</div>
                <div className="text-xs font-medium uppercase tracking-widest text-charcoal-400">
                  Year Range
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
