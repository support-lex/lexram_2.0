'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, GitBranch, Loader2 } from 'lucide-react';
import { LexramAPI, unwrap, type Amendment } from '@/lib/lexram/api';
import { cn } from '@/lib/utils';

type ViewMode = 'by-act' | 'timeline' | 'table';

const PAGE_SIZE = 50;

function formatDate(d?: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d ?? '—';
  }
}

export default function AmendmentsTrackerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('by-act');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const [all, setAll] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LexramAPI.amendments({ limit: 200 });
      setAll(unwrap(res));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load amendments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, nonce]);

  const filtered: Amendment[] = useMemo(() => {
    return all.filter((am) => {
      if (statusFilter && am.status !== statusFilter) return false;
      if (typeFilter) {
        const hay = `${am.amendment_type ?? ''} ${am.amendment_act_name ?? ''} ${
          am.description ?? ''
        }`.toLowerCase();
        if (!hay.includes(typeFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [all, typeFilter, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const byAct = useMemo(() => {
    const out: Record<
      string,
      { actName: string; actId?: string; amendments: Amendment[] }
    > = {};
    paged.forEach((am) => {
      const key = am.act_id ?? 'unknown';
      if (!out[key]) {
        out[key] = {
          actName: am.act_id ?? 'Unknown Act',
          actId: am.act_id ?? undefined,
          amendments: [],
        };
      }
      out[key].amendments.push(am);
    });
    return out;
  }, [paged]);

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-3">
              <GitBranch className="w-6 h-6 text-rose-500" />
              Amendment History
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">
              {total} amendments tracked across Indian legislation
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex gap-1">
              {(['by-act', 'timeline', 'table'] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                    viewMode === m
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-rose-300',
                  )}
                >
                  {m === 'by-act' ? 'By Act' : m === 'timeline' ? 'Timeline' : 'Table'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs border border-[var(--border-default)] rounded-lg px-2 py-1.5 bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-rose-400"
              >
                <option value="">All types</option>
                <option value="amendment">Amendment</option>
                <option value="substitution">Substitution</option>
                <option value="insertion">Insertion</option>
                <option value="omission">Omission</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs border border-[var(--border-default)] rounded-lg px-2 py-1.5 bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-rose-400"
              >
                <option value="">All status</option>
                <option value="In force">In force</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

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
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-16 text-charcoal-400">No amendments found</div>
          ) : (
            <>
              {/* BY ACT view */}
              {viewMode === 'by-act' && (
                <div className="space-y-4">
                  {Object.entries(byAct).map(([key, group]) => (
                    <div
                      key={key}
                      className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-sm overflow-hidden"
                    >
                      <div className="px-5 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                        <div>
                          {group.actId ? (
                            <Link
                              href={`/dashboard/acts/${group.actId}`}
                              className="font-semibold text-[var(--text-primary)] hover:text-rose-700 transition-colors text-sm"
                            >
                              {group.actName}
                            </Link>
                          ) : (
                            <span className="font-semibold text-[var(--text-primary)] text-sm">
                              {group.actName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-rose-500 font-medium">
                          {group.amendments.length} amendment
                          {group.amendments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="px-5 py-4 space-y-3">
                        {group.amendments.map((am, i) => (
                          <AmendmentRow
                            key={am.id}
                            amendment={am}
                            isLast={i === group.amendments.length - 1}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TIMELINE view */}
              {viewMode === 'timeline' && (
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-sm p-5 space-y-3">
                  {paged.map((am, i) => (
                    <AmendmentRow key={am.id} amendment={am} isLast={i === paged.length - 1} />
                  ))}
                </div>
              )}

              {/* TABLE view */}
              {viewMode === 'table' && (
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-charcoal-50 border-b border-[var(--border-default)] text-xs text-charcoal-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-3 font-medium">Act</th>
                        <th className="text-left px-4 py-3 font-medium">Amendment</th>
                        <th className="text-left px-4 py-3 font-medium">Notification</th>
                        <th className="text-left px-4 py-3 font-medium">Date</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-charcoal-100">
                      {paged.map((am) => (
                        <tr key={am.id} className="hover:bg-charcoal-50 transition-colors">
                          <td className="px-4 py-3">
                            {am.act_id ? (
                              <Link
                                href={`/dashboard/acts/${am.act_id}`}
                                className="text-[var(--text-primary)] hover:text-rose-700 font-medium text-xs line-clamp-1"
                              >
                                {am.act_id}
                              </Link>
                            ) : (
                              <span className="text-[var(--text-primary)] text-xs">
                                {'\u2014'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--text-secondary)] max-w-[240px]">
                            <span className="line-clamp-1">
                              {am.amendment_act_name ?? am.description ?? 'Amendment'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-charcoal-500">
                            {am.notification_no ?? '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-charcoal-500">
                            {formatDate(am.amendment_date ?? am.effective_date)}
                          </td>
                          <td className="px-4 py-3 text-xs text-charcoal-500">
                            {am.status ?? '\u2014'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 rounded-lg border border-[var(--border-default)] disabled:opacity-40 hover:bg-charcoal-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-[var(--text-secondary)]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 rounded-lg border border-[var(--border-default)] disabled:opacity-40 hover:bg-charcoal-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function AmendmentRow({ amendment, isLast }: { amendment: Amendment; isLast: boolean }) {
  return (
    <div className={cn('relative pl-6', !isLast && 'pb-3')}>
      <span className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-50" />
      {!isLast && <span className="absolute left-2 top-4 bottom-0 w-px bg-rose-100" />}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
            {amendment.amendment_act_name ?? amendment.description ?? 'Amendment'}
          </p>
          {amendment.description && amendment.amendment_act_name && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">
              {amendment.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-charcoal-400">
            <span>{amendment.notification_no ?? '\u2014'}</span>
            <span>&middot;</span>
            <span>{formatDate(amendment.amendment_date ?? amendment.effective_date)}</span>
            {amendment.amendment_type && (
              <>
                <span>&middot;</span>
                <span className="font-sans">{amendment.amendment_type}</span>
              </>
            )}
          </div>
        </div>
        {amendment.status && (
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono shrink-0',
              amendment.status === 'Pending'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200',
            )}
          >
            {amendment.status}
          </span>
        )}
      </div>
    </div>
  );
}
