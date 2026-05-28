'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { LexramAPI, type PulseEvent } from '@/lib/lexram/api';

interface Bucket {
  decade: number;
  label: string;
  acts: number;
  circulars: number;
  amendments: number;
  total: number;
  events: PulseEvent[];
}

const TYPE_COLORS: Record<PulseEvent['type'], string> = {
  act: '#f59e0b',
  circular: '#0ea5e9',
  amendment: '#8b5cf6',
};

export default function LegislativeTimelinePage() {
  const router = useRouter();
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    LexramAPI.dashboardPulse()
      .then((r) => {
        if (!cancelled) setEvents(r);
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

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<number, Bucket>();
    for (const ev of events) {
      if (!ev.event_date) continue;
      const year = new Date(ev.event_date).getFullYear();
      if (isNaN(year)) continue;
      const decade = Math.floor(year / 10) * 10;
      let b = map.get(decade);
      if (!b) {
        b = {
          decade,
          label: `${decade}s`,
          acts: 0,
          circulars: 0,
          amendments: 0,
          total: 0,
          events: [],
        };
        map.set(decade, b);
      }
      if (ev.type === 'act') b.acts += 1;
      else if (ev.type === 'circular') b.circulars += 1;
      else if (ev.type === 'amendment') b.amendments += 1;
      b.total += 1;
      b.events.push(ev);
    }
    return [...map.values()].sort((a, b) => a.decade - b.decade);
  }, [events]);

  const maxTotal = useMemo(
    () => buckets.reduce((m, b) => Math.max(m, b.total), 1),
    [buckets],
  );

  const selectedBucket = useMemo(
    () => buckets.find((b) => b.decade === selectedDecade) ?? null,
    [buckets, selectedDecade],
  );

  const totalCounts = useMemo(
    () => ({
      acts: events.filter((e) => e.type === 'act').length,
      circulars: events.filter((e) => e.type === 'circular').length,
      amendments: events.filter((e) => e.type === 'amendment').length,
    }),
    [events],
  );

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-semibold text-charcoal-900">
              Legislative Timeline
            </h1>
            <p className="text-sm text-charcoal-500 mt-1">
              Indian legislative activity over time, bucketed by decade.
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
              {/* Totals */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-charcoal-200 p-4 flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS.act }}
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-charcoal-400">Acts</p>
                    <p className="text-xl font-semibold text-charcoal-900 font-mono">
                      {totalCounts.acts}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-charcoal-200 p-4 flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS.circular }}
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-charcoal-400">Circulars</p>
                    <p className="text-xl font-semibold text-charcoal-900 font-mono">
                      {totalCounts.circulars}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-charcoal-200 p-4 flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS.amendment }}
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-charcoal-400">
                      Amendments
                    </p>
                    <p className="text-xl font-semibold text-charcoal-900 font-mono">
                      {totalCounts.amendments}
                    </p>
                  </div>
                </div>
              </div>

              {/* Decade bar chart */}
              {buckets.length === 0 ? (
                <div className="bg-white rounded-xl border border-charcoal-200 p-8 text-center text-sm text-charcoal-500">
                  No events available.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-charcoal-200 p-5 mb-5">
                  <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
                    {buckets.map((b) => {
                      const h = Math.max(6, (b.total / maxTotal) * 160);
                      const actsH = (b.acts / b.total) * h;
                      const circH = (b.circulars / b.total) * h;
                      const amendH = (b.amendments / b.total) * h;
                      const isActive = selectedDecade === b.decade;
                      return (
                        <button
                          key={b.decade}
                          onClick={() =>
                            setSelectedDecade((d) => (d === b.decade ? null : b.decade))
                          }
                          className={`flex flex-col items-center gap-1 shrink-0 w-16 group ${
                            isActive ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                          }`}
                          title={`${b.label}: ${b.total} events`}
                        >
                          <div
                            className={`w-full flex flex-col justify-end rounded-t overflow-hidden transition-all ${
                              isActive ? 'ring-2 ring-gold-500' : ''
                            }`}
                            style={{ height: h }}
                          >
                            <div
                              style={{
                                height: amendH,
                                backgroundColor: TYPE_COLORS.amendment,
                              }}
                            />
                            <div
                              style={{
                                height: circH,
                                backgroundColor: TYPE_COLORS.circular,
                              }}
                            />
                            <div
                              style={{
                                height: actsH,
                                backgroundColor: TYPE_COLORS.act,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-charcoal-500">
                            {b.label}
                          </span>
                          <span className="text-[10px] font-mono text-charcoal-400">
                            {b.total}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-charcoal-500">
                    {(['act', 'circular', 'amendment'] as const).map((t) => (
                      <span key={t} className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded"
                          style={{ backgroundColor: TYPE_COLORS[t] }}
                        />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected decade detail */}
              {selectedBucket && (
                <div className="bg-white rounded-xl border border-charcoal-200 p-5">
                  <h2 className="text-base font-semibold text-charcoal-800 mb-3">
                    Events in the {selectedBucket.label}
                    <span className="ml-2 text-sm font-normal text-charcoal-400">
                      ({selectedBucket.total} events)
                    </span>
                  </h2>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {selectedBucket.events.slice(0, 100).map((ev) => (
                      <button
                        key={`${ev.type}-${ev.id}`}
                        onClick={() => {
                          if (ev.type === 'act') router.push(`/dashboard/acts/${ev.id}`);
                          else if (ev.type === 'circular')
                            router.push(`/dashboard/circulars/${ev.id}`);
                        }}
                        className="w-full text-left p-3 rounded-lg border border-charcoal-100 hover:border-gold-300 hover:bg-gold-50 transition-colors flex items-start gap-3"
                      >
                        <span
                          className="mt-1 w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: TYPE_COLORS[ev.type] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-charcoal-800 line-clamp-1">
                            {ev.title}
                          </p>
                          <p className="text-[11px] font-mono text-charcoal-400 mt-0.5">
                            {ev.type} · {ev.event_date}{' '}
                            {ev.ministry ? `· ${ev.ministry}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
