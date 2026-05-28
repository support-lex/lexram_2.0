'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, FileText, Download, Loader2 } from 'lucide-react';
import {
  LexramAPI,
  unwrap,
  type SubLegislation,
  type Circular,
  type Schedule,
} from '@/lib/lexram/api';

const typePalette: Record<string, string> = {
  rule: 'bg-violet-50 text-violet-700 border-violet-200',
  regulation: 'bg-blue-50 text-blue-700 border-blue-200',
  order: 'bg-amber-50 text-amber-700 border-amber-200',
  notification: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function SubLegDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';

  const [data, setData] = useState<SubLegislation | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [showPdf, setShowPdf] = useState<boolean>(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const item = await LexramAPI.subLegislationItem(id);
      setData(item);
      // Best-effort related loads
      if (item?.ministry) {
        try {
          const cRes = await LexramAPI.circulars({ limit: 5, ministry: item.ministry });
          setCirculars(unwrap(cRes));
        } catch {
          setCirculars([]);
        }
      }
      if (item?.act_id) {
        try {
          const sRes = await LexramAPI.schedules({ limit: 20, act_id: item.act_id });
          setSchedules(unwrap(sRes));
        } catch {
          setSchedules([]);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, nonce]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <button
              onClick={() => router.push('/dashboard/sub-legislation')}
              className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> All Rules &amp; Regs
            </button>
            <div className="text-center py-24 text-charcoal-400">
              {error ? (
                <div className="space-y-3">
                  <p className="text-sm text-rose-700">Failed to load: {error}</p>
                  <button
                    onClick={() => setNonce((n) => n + 1)}
                    className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <p>Not found.</p>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  const effectiveDate = data.effective_date ?? data.enactment_date;
  const year = data.year ?? (effectiveDate ? new Date(effectiveDate).getFullYear() : null);

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 min-h-0 flex">
        {/* Left nav */}
        <aside className="w-[260px] shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-default)] p-4 overflow-y-auto custom-scrollbar hidden md:block">
          <button
            onClick={() => router.push('/dashboard/sub-legislation')}
            className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> All Rules &amp; Regs
          </button>

          <div className="space-y-2">
            <span
              className={`inline-block text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono ${
                typePalette[data.doc_type] ?? 'bg-charcoal-50 text-charcoal-700 border-charcoal-200'
              }`}
            >
              {data.doc_type}
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{data.name}</p>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />{' '}
              {data.enforcement_status ?? 'Active'}
            </span>
          </div>

          <div className="mt-4 text-center py-6 text-charcoal-400 border border-dashed border-[var(--border-default)] rounded-lg">
            <FileText className="w-8 h-8 mx-auto mb-2 text-charcoal-200" />
            <p className="text-xs">Sections not yet available</p>
            <div className="mt-2 w-16 mx-auto h-1.5 bg-charcoal-100 rounded-full overflow-hidden">
              <div className="h-full w-0 bg-gold-400 rounded-full" />
            </div>
          </div>
        </aside>

        {/* Center */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Header card */}
            <div className="bg-[var(--bg-surface)] rounded-xl border-t-4 border-violet-500 border border-[var(--border-default)] p-5 shadow-sm">
              <h1 className="font-serif text-xl font-semibold text-[var(--text-primary)] mb-1">
                {data.name}
              </h1>
              {data.short_title && data.short_title !== data.name && (
                <p className="text-sm text-[var(--text-secondary)] mb-3">{data.short_title}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.ministry && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-charcoal-400">Ministry</p>
                    <p className="text-sm text-[var(--text-primary)]">{data.ministry}</p>
                  </div>
                )}
                {year && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-charcoal-400">Year</p>
                    <p className="font-mono text-sm text-[var(--text-primary)]">{year}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-charcoal-400">Status</p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />{' '}
                    {data.enforcement_status ?? 'Active'}
                  </span>
                </div>
                {effectiveDate && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-charcoal-400">Effective</p>
                    <p className="font-mono text-sm text-[var(--text-primary)]">
                      {new Date(effectiveDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {data.summary && (
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5">
                <p className="text-[11px] font-mono uppercase tracking-wide text-charcoal-400 mb-2">
                  Summary
                </p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{data.summary}</p>
              </div>
            )}

            {/* Document viewer toggle */}
            <div>
              <button
                onClick={() => setShowPdf((v) => !v)}
                className="flex items-center gap-2 text-sm text-gold-600 hover:text-gold-700 mb-2"
              >
                <FileText className="w-4 h-4" />
                {showPdf ? 'Hide' : 'View'} Document PDF
              </button>
              {showPdf && (
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-8 text-center text-charcoal-400">
                  <Download className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
                  <p className="text-sm">PDF preview not available.</p>
                </div>
              )}
            </div>

            {/* Linked schedules */}
            {schedules.length > 0 && (
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5">
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Linked Schedules ({schedules.length})
                </p>
                <div className="space-y-2">
                  {schedules.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-2 border-b border-charcoal-50 last:border-0"
                    >
                      <span className="text-sm text-[var(--text-primary)]">
                        {s.schedule_number} &mdash; {s.title}
                      </span>
                      <Link
                        href="/dashboard/schedules"
                        className="text-xs text-teal-600 hover:text-teal-700"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right panel */}
        <aside className="w-[280px] shrink-0 bg-[var(--bg-surface)] border-l border-[var(--border-default)] p-4 overflow-y-auto custom-scrollbar space-y-5 hidden xl:block">
          {data.act_id && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400 mb-2">
                Parent Act
              </p>
              <Link
                href={`/dashboard/acts/${data.act_id}`}
                className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Parent Act
              </Link>
              <hr className="border-charcoal-100 mt-4" />
            </div>
          )}

          {circulars.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400 mb-3">
                Related Circulars ({circulars.length})
              </p>
              <div className="space-y-2">
                {circulars.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/circulars/${c.id}`}
                    className="block border border-[var(--border-default)] rounded-lg p-2 hover:border-sky-300 transition-colors"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2">
                      {c.subject}
                    </p>
                    {c.circular_number && (
                      <p className="text-[11px] font-mono text-charcoal-400 mt-1">
                        {c.circular_number}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
