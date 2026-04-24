'use client';

import { useEffect, useMemo, useState } from 'react';
import { Scale, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { LexramAPI, unwrap, type Court, type Judgment } from '@/lib/lexram/api';

interface StatsLike {
  judgments?: number;
  judgments_count?: number;
  total_judgments?: number;
  [k: string]: unknown;
}

export default function CaseLawPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [totalJudgments, setTotalJudgments] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [courtTypeFilter, setCourtTypeFilter] = useState<string>('');
  const [courtFilter, setCourtFilter] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      LexramAPI.courts(),
      LexramAPI.judgments({ limit: 50 }),
      LexramAPI.stats().catch(() => null),
    ])
      .then(([c, j, s]) => {
        if (cancelled) return;
        setCourts(c);
        setJudgments(unwrap(j));
        const stats = s as StatsLike | null;
        const n =
          stats?.judgments ?? stats?.judgments_count ?? stats?.total_judgments ?? null;
        setTotalJudgments(typeof n === 'number' ? n : null);
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
  }, [reloadKey]);

  const courtTypes = useMemo(
    () => [...new Set(courts.map((c) => c.court_type).filter(Boolean))].sort(),
    [courts],
  );

  const filteredCourts = useMemo(
    () => courts.filter((c) => !courtTypeFilter || c.court_type === courtTypeFilter),
    [courts, courtTypeFilter],
  );

  const filteredJudgments = useMemo(
    () =>
      judgments.filter((j) => {
        if (courtFilter && j.court_id !== courtFilter && j.court !== courtFilter) return false;
        if (courtTypeFilter) {
          const c = courts.find((ct) => ct.id === j.court_id || ct.name === j.court);
          if (!c || c.court_type !== courtTypeFilter) return false;
        }
        return true;
      }),
    [judgments, courtFilter, courtTypeFilter, courts],
  );

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <p className="text-xs font-medium tracking-widest uppercase text-charcoal-400 mb-2">
              Judicial Intelligence
            </p>
            <h1 className="font-serif text-3xl font-semibold text-charcoal-900 mb-2">
              Case Law Database
            </h1>
            <p className="text-sm text-charcoal-500 max-w-2xl leading-relaxed">
              Browse Indian court judgments by court type and jurisdiction.
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
            <>
              {/* Stat strip */}
              <section className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="border border-charcoal-200 rounded-xl p-6 text-center bg-white">
                    <div className="text-3xl font-serif font-bold text-charcoal-900 mb-1">
                      {courts.length}
                    </div>
                    <div className="text-xs text-charcoal-500 uppercase tracking-wider font-medium">
                      Total Courts
                    </div>
                  </div>
                  <div className="border border-charcoal-200 rounded-xl p-6 text-center bg-white">
                    <div className="text-3xl font-serif font-bold text-charcoal-900 mb-1">
                      {courtTypes.length}
                    </div>
                    <div className="text-xs text-charcoal-500 uppercase tracking-wider font-medium">
                      Court Types
                    </div>
                  </div>
                  {totalJudgments !== null && (
                    <div className="border border-charcoal-200 rounded-xl p-6 text-center bg-white">
                      <div className="text-3xl font-serif font-bold text-charcoal-900 mb-1">
                        {totalJudgments.toLocaleString()}
                      </div>
                      <div className="text-xs text-charcoal-500 uppercase tracking-wider font-medium">
                        Total Judgments
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Filters */}
              <section className="mb-6 bg-white rounded-xl border border-charcoal-200 p-4 flex flex-wrap gap-3">
                <select
                  value={courtTypeFilter}
                  onChange={(e) => {
                    setCourtTypeFilter(e.target.value);
                    setCourtFilter('');
                  }}
                  className="text-sm border border-charcoal-200 rounded-lg px-3 py-2 bg-white text-charcoal-700 focus:outline-none focus:border-gold-400"
                >
                  <option value="">All Court Types</option>
                  {courtTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={courtFilter}
                  onChange={(e) => setCourtFilter(e.target.value)}
                  className="text-sm border border-charcoal-200 rounded-lg px-3 py-2 bg-white text-charcoal-700 focus:outline-none focus:border-gold-400"
                >
                  <option value="">All Courts</option>
                  {filteredCourts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </section>

              {/* Court list */}
              <section className="mb-8">
                <h2 className="text-xl font-serif font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-600" />
                  Courts ({filteredCourts.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCourts.slice(0, 30).map((c) => (
                    <div
                      key={c.id}
                      className="border border-charcoal-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-semibold text-charcoal-800">{c.name}</p>
                      <p className="text-xs text-charcoal-500 mt-1">
                        {c.court_type} {c.state ? `· ${c.state}` : ''}
                      </p>
                      {c.established_year && (
                        <p className="text-xs font-mono text-charcoal-400 mt-1">
                          Est. {c.established_year}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Judgments table */}
              <section>
                <h2 className="text-xl font-serif font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  Judgments ({filteredJudgments.length})
                </h2>
                {filteredJudgments.length === 0 ? (
                  <div className="bg-charcoal-50 border border-charcoal-200 rounded-xl p-6 text-center">
                    <p className="text-sm text-charcoal-600">
                      No judgments available from the API at this time.
                    </p>
                    <p className="text-xs text-charcoal-400 mt-1">
                      The judgments endpoint is under construction.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-charcoal-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-charcoal-50 border-b border-charcoal-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-medium text-charcoal-600">
                            Title
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-charcoal-600">
                            Court
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-charcoal-600">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-charcoal-600">
                            Citation
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredJudgments.slice(0, 50).map((j) => (
                          <tr key={j.id} className="border-b border-charcoal-100 hover:bg-charcoal-50">
                            <td className="px-4 py-3 text-sm text-charcoal-800">{j.title}</td>
                            <td className="px-4 py-3 text-sm text-charcoal-600">{j.court ?? '-'}</td>
                            <td className="px-4 py-3 text-sm text-charcoal-500">{j.date ?? '-'}</td>
                            <td className="px-4 py-3 text-sm font-mono text-charcoal-500">
                              {j.citation ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
