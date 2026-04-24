'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { LexramAPI } from '@/lib/lexram/api';
import { cn } from '@/lib/utils';

type EventType = 'circular' | 'notification' | 'amendment' | 'rules' | 'orders' | 'version';

interface VersionEvent {
  id: string | number;
  type: EventType;
  title: string;
  date?: string;
  number?: string;
  ministry?: string;
}

const badgeStyles: Record<EventType, string> = {
  circular: 'bg-sky-100 text-sky-700 border-sky-200',
  notification: 'bg-violet-100 text-violet-700 border-violet-200',
  amendment: 'bg-amber-100 text-amber-700 border-amber-200',
  rules: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  orders: 'bg-rose-100 text-rose-700 border-rose-200',
  version: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

function EntityBadge({ type }: { type: EventType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium capitalize px-2 py-0.5 text-[10px]',
        badgeStyles[type],
      )}
    >
      {type}
    </span>
  );
}

function normalizeType(raw: unknown): EventType {
  const s = typeof raw === 'string' ? raw.toLowerCase() : '';
  if (s.includes('amend')) return 'amendment';
  if (s.includes('circ')) return 'circular';
  if (s.includes('notif')) return 'notification';
  if (s.includes('rule') || s.includes('reg')) return 'rules';
  if (s.includes('order')) return 'orders';
  return 'version';
}

function parseVersionEvents(raw: unknown): VersionEvent[] {
  const extractArray = (): unknown[] => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data;
      if (Array.isArray(obj.versions)) return obj.versions;
      if (Array.isArray(obj.events)) return obj.events;
      if (Array.isArray(obj.history)) return obj.history;
    }
    return [];
  };
  const arr = extractArray();
  return arr
    .map((item, idx): VersionEvent | null => {
      if (!item || typeof item !== 'object') return null;
      const r = item as Record<string, unknown>;
      const id =
        (r.id as string | number | undefined) ??
        (r.version_id as string | number | undefined) ??
        idx;
      const title =
        (r.title as string | undefined) ??
        (r.name as string | undefined) ??
        (r.description as string | undefined) ??
        (r.amendment_act_name as string | undefined) ??
        `Event ${idx + 1}`;
      const date =
        (r.date as string | undefined) ??
        (r.event_date as string | undefined) ??
        (r.effective_date as string | undefined) ??
        (r.amendment_date as string | undefined) ??
        (r.issue_date as string | undefined);
      const number =
        (r.number as string | undefined) ??
        (r.version as string | undefined) ??
        (r.notification_no as string | undefined) ??
        (r.circular_number as string | undefined);
      const ministry = (r.ministry as string | undefined) ?? undefined;
      const type = normalizeType(r.type ?? r.event_type ?? r.kind);
      return { id, type, title, date, number, ministry };
    })
    .filter((e): e is VersionEvent => e !== null);
}

function VersionTrackerContent() {
  const searchParams = useSearchParams();
  const actId = searchParams.get('actId');

  const [raw, setRaw] = useState<unknown>(null);
  const [events, setEvents] = useState<VersionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!actId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    LexramAPI.actVersions(actId)
      .then((r) => {
        if (cancelled) return;
        setRaw(r);
        setEvents(parseVersionEvents(r));
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
  }, [actId, reloadKey]);

  const grouped = useMemo(() => {
    const g: Record<string, VersionEvent[]> = {};
    events.forEach((e) => {
      const yr = e.date ? new Date(e.date).getFullYear().toString() : 'Unknown';
      if (!g[yr]) g[yr] = [];
      g[yr].push(e);
    });
    return g;
  }, [events]);

  const years = useMemo(
    () => Object.keys(grouped).sort((a, b) => Number(b) - Number(a)),
    [grouped],
  );

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      {actId && (
        <Link
          href={`/dashboard/acts/${actId}`}
          className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Act
        </Link>
      )}

      <h1 className="font-serif text-2xl font-semibold text-charcoal-900 mb-0.5">
        Version Tracker
      </h1>
      <p className="text-sm text-charcoal-500 mb-5">
        {actId
          ? `${actId} - ${events.length} events`
          : 'No actId provided in URL.'}
      </p>

      {!actId && (
        <div className="bg-charcoal-50 border border-charcoal-200 rounded-xl p-6 text-center">
          <p className="text-sm text-charcoal-600">
            Provide an <code className="font-mono">?actId=</code> query parameter to view version history.
          </p>
        </div>
      )}

      {actId && loading && (
        <div className="flex items-center justify-center min-h-[64px] py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        </div>
      )}

      {actId && error && !loading && (
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

      {actId && !loading && !error && (
        <>
          {events.length > 0 ? (
            <div className="space-y-6">
              {years.map((yr) => (
                <div key={yr}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-charcoal-200" />
                    <span className="text-sm font-semibold text-charcoal-500 font-mono">{yr}</span>
                    <div className="h-px flex-1 bg-charcoal-200" />
                  </div>
                  <div className="space-y-3">
                    {grouped[yr].map((ev) => (
                      <div
                        key={`${ev.type}-${ev.id}`}
                        className="bg-white rounded-xl border border-charcoal-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <EntityBadge type={ev.type} />
                          {ev.date && (
                            <span className="font-mono text-xs text-charcoal-400">
                              {ev.date}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-charcoal-800 leading-snug">
                          {ev.title}
                        </p>
                        {ev.number && (
                          <p className="text-xs font-mono text-charcoal-400 mt-1">
                            No: {ev.number}
                          </p>
                        )}
                        {ev.ministry && (
                          <p className="text-xs text-charcoal-400">{ev.ministry}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-charcoal-200 p-5">
              <p className="text-sm font-semibold text-charcoal-800 mb-2">Raw API Response</p>
              <p className="text-xs text-charcoal-500 mb-3">
                The version endpoint returned a shape this UI could not parse into a timeline. Raw JSON is shown below.
              </p>
              <pre className="bg-charcoal-50 border border-charcoal-100 rounded p-3 text-[11px] font-mono text-charcoal-700 overflow-x-auto max-h-[600px]">
                {JSON.stringify(raw, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function VersionTrackerPage() {
  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[64px] py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          }
        >
          <VersionTrackerContent />
        </Suspense>
      </div>
    </div>
  );
}
