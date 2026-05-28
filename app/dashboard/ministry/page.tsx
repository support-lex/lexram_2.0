'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Gavel, Bell, Loader2, AlertCircle } from 'lucide-react';
import {
  LexramAPI,
  unwrap,
  type Act,
  type Circular,
  type DashboardMinistry,
} from '@/lib/lexram/api';
import { cn } from '@/lib/utils';

const ACCENT_COLORS: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
};

function StatsCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: keyof typeof ACCENT_COLORS;
}) {
  return (
    <div className="bg-white rounded-xl border border-charcoal-200 p-4 flex items-center gap-3">
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center border',
          ACCENT_COLORS[color],
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-charcoal-400">{label}</p>
        <p className="text-xl font-semibold text-charcoal-900 font-mono">{value}</p>
      </div>
    </div>
  );
}

interface MinistryEntry {
  name: string;
  actCount: number;
  circularCount: number;
}

export default function MinistryHubPage() {
  const router = useRouter();

  const [ministries, setMinistries] = useState<MinistryEntry[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [acts, setActs] = useState<Act[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Load ministry list
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([LexramAPI.dashboardMinistries(), LexramAPI.circularMinistries()])
      .then(([dashMinistries, circMinistries]) => {
        if (cancelled) return;
        const map = new Map<string, MinistryEntry>();
        (dashMinistries as DashboardMinistry[]).forEach((m) => {
          if (!m.ministry) return;
          map.set(m.ministry, {
            name: m.ministry,
            actCount: Number(m.count) || 0,
            circularCount: 0,
          });
        });
        circMinistries.forEach((m) => {
          if (!m.ministry) return;
          const existing = map.get(m.ministry);
          if (existing) {
            existing.circularCount = Number(m.count) || 0;
          } else {
            map.set(m.ministry, {
              name: m.ministry,
              actCount: 0,
              circularCount: Number(m.count) || 0,
            });
          }
        });
        const list = [...map.values()].sort(
          (a, b) => b.actCount + b.circularCount - (a.actCount + a.circularCount),
        );
        setMinistries(list);
        if (list.length > 0 && !selected) setSelected(list[0].name);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // Load details when selection changes
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    Promise.all([
      LexramAPI.acts({ ministry: selected, limit: 50 }).catch(() => [] as Act[]),
      LexramAPI.circulars({ ministry: selected, limit: 50 }).catch(
        () => [] as Circular[],
      ),
    ])
      .then(([a, c]) => {
        if (cancelled) return;
        setActs(Array.isArray(a) ? a : []);
        setCirculars(unwrap(c));
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setDetailError(e instanceof Error ? e.message : 'Failed to load ministry detail');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const selectedEntry = useMemo(
    () => ministries.find((m) => m.name === selected),
    [ministries, selected],
  );

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-semibold text-charcoal-900">Ministry Hub</h1>
            <p className="text-sm text-charcoal-500 mt-0.5">
              Browse legislation by ministry.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center min-h-[64px] py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          )}

          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="text-xs px-3 py-1.5 bg-white border border-rose-300 rounded-md hover:bg-rose-100 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="flex gap-6">
              {/* Ministry list */}
              <aside className="w-[260px] shrink-0">
                <div className="bg-white rounded-xl border border-charcoal-200 overflow-hidden">
                  <div className="px-3 py-2 border-b border-charcoal-100 text-[11px] uppercase tracking-wide text-charcoal-400">
                    {ministries.length} Ministries
                  </div>
                  <div className="max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                    {ministries.map((m) => (
                      <button
                        key={m.name}
                        onClick={() => setSelected(m.name)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 border-b border-charcoal-50 text-sm transition-colors',
                          selected === m.name
                            ? 'bg-gold-50 text-gold-800 font-medium'
                            : 'text-charcoal-700 hover:bg-charcoal-50',
                        )}
                      >
                        <div className="truncate">{m.name}</div>
                        <div className="text-[11px] font-mono text-charcoal-400 mt-0.5">
                          {m.actCount} acts · {m.circularCount} circulars
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Detail panel */}
              <div className="flex-1 min-w-0">
                {selectedEntry && (
                  <>
                    <h2 className="font-serif text-xl font-semibold text-charcoal-900 mb-4">
                      {selectedEntry.name}
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <StatsCard
                        label="Acts"
                        value={selectedEntry.actCount}
                        icon={<BookOpen className="w-5 h-5" />}
                        color="amber"
                      />
                      <StatsCard
                        label="Circulars"
                        value={selectedEntry.circularCount}
                        icon={<Bell className="w-5 h-5" />}
                        color="sky"
                      />
                      <StatsCard
                        label="Total Items"
                        value={selectedEntry.actCount + selectedEntry.circularCount}
                        icon={<Gavel className="w-5 h-5" />}
                        color="violet"
                      />
                    </div>

                    {detailLoading && (
                      <div className="flex items-center justify-center min-h-[64px] py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                      </div>
                    )}

                    {detailError && !detailLoading && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 mb-4 text-sm">
                        {detailError}
                      </div>
                    )}

                    {!detailLoading && !detailError && (
                      <>
                        {/* Acts */}
                        <section className="mb-6">
                          <h3 className="text-sm font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-amber-600" />
                            Acts ({acts.length})
                          </h3>
                          {acts.length === 0 ? (
                            <p className="text-charcoal-400 text-sm">
                              No acts found for this ministry.
                            </p>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              {acts.slice(0, 20).map((a) => (
                                <button
                                  key={a.id}
                                  onClick={() => router.push(`/dashboard/acts/${a.id}`)}
                                  className="bg-white rounded-lg border border-charcoal-200 p-4 text-left hover:shadow-md transition-shadow"
                                >
                                  <p className="text-sm font-semibold text-charcoal-800">{a.name}</p>
                                  <p className="font-mono text-xs text-charcoal-400 mt-1">
                                    {a.year ?? '—'} · {a.domain ?? 'General'}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </section>

                        {/* Circulars */}
                        <section>
                          <h3 className="text-sm font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-sky-600" />
                            Circulars ({circulars.length})
                          </h3>
                          {circulars.length === 0 ? (
                            <p className="text-charcoal-400 text-sm">
                              No circulars found for this ministry.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {circulars.slice(0, 20).map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => router.push(`/dashboard/circulars/${c.id}`)}
                                  className="w-full bg-white rounded-lg border border-charcoal-200 p-4 text-left hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-charcoal-800">
                                      {c.subject}
                                    </p>
                                    <span className="text-[10px] font-mono text-charcoal-400">
                                      {c.circular_number ?? ''}
                                    </span>
                                  </div>
                                  <p className="text-xs text-charcoal-500 mt-1">
                                    {c.issuing_authority ?? c.ministry ?? ''}{' '}
                                    {c.issue_date ? `· ${c.issue_date}` : ''}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </section>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
