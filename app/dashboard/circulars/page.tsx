'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { LexramAPI, unwrap, type Circular } from '@/lib/lexram/api';
import { cn } from '@/lib/utils';

const TYPES = [
  { key: 'all', label: 'All' },
  { key: 'notification', label: 'Notifications' },
  { key: 'circular', label: 'Circulars' },
  { key: 'ordinance', label: 'Ordinances' },
];

const PAGE_SIZE = 50;

export default function CircularsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [ministry, setMinistry] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);

  const [items, setItems] = useState<Circular[]>([]);
  const [ministries, setMinistries] = useState<Array<{ ministry: string; count: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LexramAPI.circulars({
        limit: PAGE_SIZE,
        offset,
        ministry: ministry || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: search || undefined,
      });
      setItems(unwrap(res));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load circulars');
    } finally {
      setLoading(false);
    }
  }, [offset, ministry, typeFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, nonce]);

  useEffect(() => {
    LexramAPI.circularMinistries()
      .then((m) => setMinistries(Array.isArray(m) ? m : []))
      .catch(() => setMinistries([]));
  }, []);

  // Group by month
  const grouped: Record<string, Circular[]> = useMemo(() => {
    const g: Record<string, Circular[]> = {};
    items.forEach((c) => {
      const key = c.issue_date
        ? new Date(c.issue_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : 'Date unknown';
      if (!g[key]) g[key] = [];
      g[key].push(c);
    });
    return g;
  }, [items]);

  const hasFilters = Boolean(ministry || search || typeFilter !== 'all');

  function clearFilters() {
    setMinistry('');
    setSearch('');
    setTypeFilter('all');
    setOffset(0);
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const canPrev = offset > 0;
  const canNext = items.length === PAGE_SIZE;

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
              Circulars &amp; Notifications
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">
              Browse notifications, circulars, and ordinances
            </p>
          </div>

          {/* Type tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTypeFilter(t.key);
                  setOffset(0);
                }}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
                  typeFilter === t.key
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-sky-300',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-6">
            {/* Sidebar filters */}
            <aside className="w-56 shrink-0 space-y-4 hidden lg:block">
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-sm p-4">
                <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-3">
                  Filters
                </p>

                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setOffset(0);
                    }}
                    placeholder="Search subjects..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-[var(--border-default)] rounded-lg focus:outline-none focus:border-sky-400 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-xs text-charcoal-400 block mb-1">Ministry</label>
                  <select
                    value={ministry}
                    onChange={(e) => {
                      setMinistry(e.target.value);
                      setOffset(0);
                    }}
                    className="w-full text-xs border border-[var(--border-default)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-sky-400 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="">All ministries</option>
                    {ministries.map((m) => (
                      <option key={m.ministry} value={m.ministry}>
                        {m.ministry} ({m.count})
                      </option>
                    ))}
                  </select>
                </div>

                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-charcoal-400 hover:text-charcoal-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </div>
            </aside>

            {/* Main list */}
            <div className="flex-1 min-w-0">
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center justify-between mb-4">
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
                  <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16 text-charcoal-400">No circulars found</div>
              ) : (
                <>
                  {Object.entries(grouped).map(([month, monthItems]) => (
                    <div key={month} className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{month}</h3>
                        <span className="text-xs text-charcoal-400">({monthItems.length})</span>
                        <div className="flex-1 h-px bg-[var(--border-default)]" />
                      </div>
                      <div className="space-y-2">
                        {monthItems.map((c) => (
                          <Link
                            key={c.id}
                            href={`/dashboard/circulars/${c.id}`}
                            className="block bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4 hover:border-sky-300 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                                    {c.subject}
                                  </p>
                                  {c.circular_number && (
                                    <span className="text-[11px] font-mono text-charcoal-400 shrink-0">
                                      {c.circular_number}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-charcoal-500">
                                  {c.ministry && <span>{c.ministry}</span>}
                                  {c.issuing_authority && <span>&middot; {c.issuing_authority}</span>}
                                  {c.issue_date && (
                                    <span>
                                      &middot;{' '}
                                      {new Date(c.issue_date).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      disabled={!canPrev}
                      onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                      className="p-2 rounded-lg border border-[var(--border-default)] disabled:opacity-40 hover:bg-charcoal-50 flex items-center gap-1 text-sm px-3"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-sm text-[var(--text-secondary)]">Page {page}</span>
                    <button
                      disabled={!canNext}
                      onClick={() => setOffset((o) => o + PAGE_SIZE)}
                      className="p-2 rounded-lg border border-[var(--border-default)] disabled:opacity-40 hover:bg-charcoal-50 flex items-center gap-1 text-sm px-3"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
