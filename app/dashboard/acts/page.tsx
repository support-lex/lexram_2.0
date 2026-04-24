'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { LexramAPI, type Act } from '@/lib/lexram/api';

const domainColors: Record<string, string> = {
  'Family Law': 'bg-amber-100 text-amber-800',
  'Criminal Law': 'bg-red-100 text-red-800',
  'Labour Law': 'bg-blue-100 text-blue-800',
  'Civil Law': 'bg-emerald-100 text-emerald-800',
  'Banking Law': 'bg-violet-100 text-violet-800',
  'Constitutional Law': 'bg-indigo-100 text-indigo-800',
  'Corporate Law': 'bg-slate-100 text-slate-800',
  'Environmental Law': 'bg-green-100 text-green-800',
  'Healthcare Law': 'bg-pink-100 text-pink-800',
  'IP Law': 'bg-cyan-100 text-cyan-800',
  'Commercial Law': 'bg-orange-100 text-orange-800',
  'Tax Law': 'bg-yellow-100 text-yellow-800',
  'Property Law': 'bg-teal-100 text-teal-800',
  'Transport Law': 'bg-gray-100 text-gray-800',
  'Telecom Law': 'bg-sky-100 text-sky-800',
  'Social Welfare': 'bg-rose-100 text-rose-800',
};

export default function ActsPage() {
  const [acts, setActs] = useState<Act[]>([]);
  const [search, setSearch] = useState('');
  const [activeDomain, setActiveDomain] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await LexramAPI.acts({
        limit: 100,
        search: search || undefined,
        domain: activeDomain !== 'All' ? activeDomain : undefined,
      });
      setActs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load acts');
    } finally {
      setLoading(false);
    }
  }, [search, activeDomain]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, nonce]);

  const domains = useMemo(() => {
    const d = new Set<string>();
    acts.forEach((a) => {
      if (a.domain) d.add(a.domain);
    });
    return ['All', ...Array.from(d).sort()];
  }, [acts]);

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <section className="pb-6">
            <p className="text-xs font-medium tracking-widest uppercase text-charcoal-400 mb-2">
              Legislation Database
            </p>
            <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)] mb-2">
              Acts & Statutes
            </h1>
            <p className="text-[var(--text-secondary)] mb-6 max-w-xl">
              Browse {acts.length} central acts across {Math.max(0, domains.length - 1)} legal domains.
            </p>

            {/* Search */}
            <div className="flex items-center border border-[var(--border-default)] rounded-lg px-4 py-2.5 max-w-xl gap-3 bg-[var(--bg-surface)]">
              <Search className="w-4 h-4 text-charcoal-400 flex-shrink-0" />
              <input
                className="flex-1 text-sm text-[var(--text-primary)] placeholder-charcoal-400 outline-none bg-transparent"
                placeholder="Search acts by name, keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-xs text-charcoal-400 hover:text-[var(--text-primary)]"
                >
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* Domain tabs */}
          <section className="border-t border-b border-[var(--border-default)] py-3 flex items-center gap-2 overflow-x-auto">
            {domains.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDomain(d)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                  activeDomain === d
                    ? 'bg-charcoal-900 text-white border-charcoal-900'
                    : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-charcoal-400'
                }`}
              >
                {d}{' '}
                {d !== 'All'
                  ? `(${acts.filter((a) => a.domain === d).length})`
                  : `(${acts.length})`}
              </button>
            ))}
          </section>

          {/* Content */}
          {error && (
            <div className="mt-6 bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center justify-between">
              <p className="text-sm text-rose-700">Failed to load: {error}</p>
              <button
                onClick={() => setNonce((n) => n + 1)}
                className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          ) : (
            <section className="py-6">
              <div className="text-xs text-charcoal-400 mb-4">{acts.length} acts found</div>
              <div className="border border-[var(--border-default)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-charcoal-50 border-b border-[var(--border-default)]">
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500 px-5 py-3">
                        Act Name
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500 px-5 py-3 w-20">
                        Year
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500 px-5 py-3 w-40">
                        Domain
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500 px-5 py-3 w-40">
                        Ministry
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500 px-5 py-3 w-24">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {acts.map((act) => (
                      <tr
                        key={act.id}
                        className="border-b border-charcoal-100 hover:bg-charcoal-50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <Link href={`/dashboard/acts/${act.id}`} className="block">
                            <div className="font-medium text-[var(--text-primary)] text-sm">
                              {act.name}
                            </div>
                            {act.short_name && act.short_name !== act.name && (
                              <div className="text-xs text-charcoal-400 mt-0.5 line-clamp-1 max-w-lg">
                                {act.short_name}
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-sm text-charcoal-600 font-mono">
                          {act.year ?? '\u2014'}
                        </td>
                        <td className="px-5 py-4">
                          {act.domain && (
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                domainColors[act.domain] || 'bg-charcoal-100 text-charcoal-700'
                              }`}
                            >
                              {act.domain}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-charcoal-600 line-clamp-1">
                          {act.ministry ?? '\u2014'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500" />
                            <span className="text-xs text-charcoal-500 capitalize">
                              {act.status ?? 'active'}
                            </span>
                            <Sparkles className="w-3 h-3 text-gold-500" />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {acts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-charcoal-400 text-sm">
                          No acts match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
