'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, ArrowRight, GitBranch, Loader2 } from 'lucide-react';
import { LexramAPI, unwrap, type Amendment } from '@/lib/lexram/api';

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

export default function AmendmentsPage() {
  const router = useRouter();
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LexramAPI.amendments({ limit: 20 });
      setAmendments(unwrap(res));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load amendments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, nonce]);

  const amendmentCount = amendments.length;

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <section className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-6">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)] mb-3">
              Amendment Tracker
            </h1>
            <p className="text-[var(--text-secondary)] max-w-md leading-relaxed mb-8">
              Track enacted, pending, and proposed amendments with full legislative history across
              central acts.
            </p>

            <div className="flex items-center gap-6 text-sm mb-8">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[var(--text-secondary)]">Database schema ready</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[var(--text-secondary)]">Data ingestion in progress</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard/amendments/tracker')}
              className="inline-flex items-center gap-2 text-sm px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              Open Amendment History
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-10 p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] max-w-sm">
              <p className="text-xs text-[var(--text-secondary)]">
                Amendment data sourced from IndiaCode and legislative archives. Showing{' '}
                {amendmentCount} recent amendments.
              </p>
            </div>
          </section>

          {/* Quick preview */}
          <section className="pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Recent Amendments
              </h2>
              <Link
                href="/dashboard/amendments/tracker"
                className="text-xs text-rose-600 hover:text-rose-700"
              >
                View all &rarr;
              </Link>
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
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {amendments.slice(0, 4).map((am) => (
                  <div
                    key={am.id}
                    className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
                        {am.amendment_act_name ?? am.description ?? 'Amendment'}
                      </p>
                      {am.status && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase font-mono shrink-0">
                          {am.status}
                        </span>
                      )}
                    </div>
                    {am.description && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                        {am.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-charcoal-400 font-mono">
                      <span>{am.notification_no ?? '\u2014'}</span>
                      <span>&middot;</span>
                      <span>{formatDate(am.amendment_date ?? am.effective_date)}</span>
                    </div>
                  </div>
                ))}
                {amendments.length === 0 && (
                  <p className="text-xs text-charcoal-400 col-span-full text-center py-6">
                    No amendments available.
                  </p>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
