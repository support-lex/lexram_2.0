'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, X, ChevronLeft, ChevronRight, Scroll, Loader2 } from 'lucide-react';
import { LexramAPI, unwrap, type SubLegislation } from '@/lib/lexram/api';
import { cn } from '@/lib/utils';

const DOC_TYPES: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'rule', label: 'Rules' },
  { key: 'regulation', label: 'Regulations' },
  { key: 'order', label: 'Orders' },
  { key: 'notification', label: 'Notifications' },
];

const PAGE_SIZE = 50;

export default function SubLegislationPage() {
  const [docType, setDocType] = useState<string>('all');
  const [ministry, setMinistry] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);

  const [items, setItems] = useState<SubLegislation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LexramAPI.subLegislation({
        limit: PAGE_SIZE,
        offset,
        doc_type: docType !== 'all' ? docType : undefined,
        ministry: ministry || undefined,
        search: search || undefined,
      });
      setItems(unwrap(res));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sub-legislation');
    } finally {
      setLoading(false);
    }
  }, [offset, docType, ministry, search]);

  useEffect(() => {
    const t = setTimeout(load, search || ministry ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, nonce]);

  const hasFilters = Boolean(search || ministry || docType !== 'all');

  function clearFilters() {
    setSearch('');
    setMinistry('');
    setDocType('all');
    setOffset(0);
  }

  const typePalette: Record<string, string> = {
    rule: 'bg-violet-50 text-violet-700 border-violet-200',
    regulation: 'bg-blue-50 text-blue-700 border-blue-200',
    order: 'bg-amber-50 text-amber-700 border-amber-200',
    notification: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const canPrev = offset > 0;
  const canNext = items.length === PAGE_SIZE;

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
              Rules &amp; Regulations
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">
              Subordinate instruments &mdash; rules, regulations, orders, and notifications
            </p>
          </div>

          {/* Type tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {DOC_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setDocType(t.key);
                  setOffset(0);
                }}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
                  docType === t.key
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-violet-300',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-6">
            <aside className="hidden lg:block w-56 shrink-0">
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
                    placeholder="Search by name..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-[var(--border-default)] rounded-lg focus:outline-none focus:border-violet-400 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-xs text-charcoal-400 block mb-1">Ministry</label>
                  <input
                    value={ministry}
                    onChange={(e) => {
                      setMinistry(e.target.value);
                      setOffset(0);
                    }}
                    placeholder="e.g. Finance"
                    className="w-full text-xs border border-[var(--border-default)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-400 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  />
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
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16 text-charcoal-400">No items found</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/dashboard/sub-legislation/${item.id}`}
                        className="block bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4 hover:border-violet-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono',
                              typePalette[item.doc_type] ??
                                'bg-charcoal-50 text-charcoal-700 border-charcoal-200',
                            )}
                          >
                            {item.doc_type}
                          </span>
                          <Scroll className="w-4 h-4 text-violet-400 shrink-0" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 mb-2">
                          {item.name}
                        </p>
                        {item.short_title && item.short_title !== item.name && (
                          <p className="text-xs text-charcoal-500 line-clamp-1">
                            {item.short_title}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-charcoal-100">
                          <span className="text-[11px] text-charcoal-400 line-clamp-1">
                            {item.ministry ?? '\u2014'}
                          </span>
                          <span className="text-[11px] font-mono text-charcoal-400">
                            {item.year ?? '—'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>

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
