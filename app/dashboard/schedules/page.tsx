'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Calendar, Loader2 } from 'lucide-react';
import { LexramAPI, unwrap, type Schedule } from '@/lib/lexram/api';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'acts' | 'sub-legislation';

export default function SchedulesPage() {
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LexramAPI.schedules({ limit: 100 });
      setSchedules(unwrap(res));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, nonce]);

  const total = schedules.length;

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      if (filterType === 'acts') return !!s.act_id;
      if (filterType === 'sub-legislation') return !!s.sub_leg_id;
      return true;
    });
  }, [schedules, filterType]);

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)] flex items-center gap-3">
              <Calendar className="w-6 h-6 text-teal-500" /> Schedules
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">
              {total} schedules attached to acts and subordinate legislation
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {(
              [
                ['all', 'All'],
                ['acts', 'From Acts'],
                ['sub-legislation', 'From Sub-Legislation'],
              ] as [FilterType, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-full border transition-colors',
                  filterType === key
                    ? 'bg-teal-500 text-white border-teal-500'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-teal-400',
                )}
              >
                {label}
                {key === 'all' && ` (${total})`}
              </button>
            ))}
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
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="bg-[var(--bg-surface)] rounded-xl border border-charcoal-100 border-t-[3px] border-t-teal-400 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                      Schedule
                    </span>
                    {s.schedule_number && (
                      <span className="text-xs font-mono text-charcoal-400">
                        {s.schedule_number}
                      </span>
                    )}
                  </div>
                  {s.title && (
                    <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 mb-2">
                      {s.title}
                    </p>
                  )}
                  <p className="text-xs text-charcoal-500 line-clamp-1 mb-3">
                    {s.act_id
                      ? `Act: ${s.act_id}`
                      : s.sub_leg_id
                      ? `Sub-Leg: ${s.sub_leg_id}`
                      : '\u2014'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && !error && (
            <div className="text-center py-16 text-charcoal-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-charcoal-200" />
              <p>No schedules match the current filter.</p>
            </div>
          )}

          {/* Detail modal */}
          {selected && (
            <div
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setSelected(null)}
            >
              <div
                className="bg-[var(--bg-surface)] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {selected.title || `Schedule ${selected.schedule_number}`}
                    </p>
                    <p className="text-xs text-charcoal-500">
                      {selected.act_id ?? selected.sub_leg_id ?? ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-charcoal-400 hover:text-[var(--text-primary)] text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-1">
                      Schedule Number
                    </p>
                    <p className="font-mono text-sm text-charcoal-700">
                      {selected.schedule_number}
                    </p>
                  </div>
                  {selected.content && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-1">
                        Content
                      </p>
                      <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">
                        {selected.content}
                      </p>
                    </div>
                  )}
                  {!selected.content && (
                    <div className="text-center py-12 text-charcoal-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
                      <p className="text-sm">No inline content available for this schedule.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
