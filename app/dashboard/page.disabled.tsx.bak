'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, FileText, GitBranch, Scale, Layers, BookOpen, Calendar } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import QuickActions from '@/components/dashboard/QuickActions';
import QuickUpload from '@/components/dashboard/QuickUpload';
import RecentActivity from '@/components/dashboard/RecentActivity';
import RecentDocuments from '@/components/dashboard/RecentDocuments';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import {
  LexramAPI,
  type DashboardStats as DashboardStatsData,
  type DashboardRecent,
  type DashboardDomain,
  type DashboardMinistry,
} from '@/lib/lexram/api';

function formatDate(d?: string | null) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d ?? '';
  }
}

function num(v: string | number | undefined | null): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [recent, setRecent] = useState<DashboardRecent | null>(null);
  const [domains, setDomains] = useState<DashboardDomain[]>([]);
  const [ministries, setMinistries] = useState<DashboardMinistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, r, d, m] = await Promise.all([
        LexramAPI.dashboardStats(),
        LexramAPI.dashboardRecent(),
        LexramAPI.dashboardDomains(),
        LexramAPI.dashboardMinistries(),
      ]);
      setStats(s);
      setRecent(r);
      setDomains(Array.isArray(d) ? d : []);
      setMinistries(Array.isArray(m) ? m : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, nonce]);

  const statCards: { label: string; value: number; icon: typeof FileText; color: string }[] = stats
    ? [
        { label: 'Acts', value: num(stats.acts), icon: Scale, color: 'text-amber-600 bg-amber-50' },
        { label: 'Sections', value: num(stats.sections), icon: BookOpen, color: 'text-indigo-600 bg-indigo-50' },
        {
          label: 'Sub-Legislation',
          value: num(stats.subordinate_legislation),
          icon: Layers,
          color: 'text-violet-600 bg-violet-50',
        },
        { label: 'Circulars', value: num(stats.circulars), icon: FileText, color: 'text-sky-600 bg-sky-50' },
        { label: 'Amendments', value: num(stats.amendments), icon: GitBranch, color: 'text-rose-600 bg-rose-50' },
        { label: 'Schedules', value: num(stats.schedules), icon: Calendar, color: 'text-teal-600 bg-teal-50' },
      ]
    : [];

  const topDomains = [...domains]
    .sort((a, b) => num(b.act_count) + num(b.circular_count) - (num(a.act_count) + num(a.circular_count)))
    .slice(0, 6);
  const topMinistries = [...ministries]
    .sort((a, b) => num(b.count) - num(a.count))
    .slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        today={new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      />
      <DashboardStats />
      <QuickActions />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentDocuments />
          <RecentActivity />
        </div>
        <div className="space-y-6">
          <UpcomingDeadlines />
          <QuickUpload />
        </div>
      </div>

      {/* ---- Legal Intelligence Overview (from real API) ---- */}
      <section className="pt-4 border-t border-[var(--border-default)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-charcoal-400 mb-1">
              Legal Corpus
            </p>
            <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
              Legal Intelligence Overview
            </h2>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-rose-700">Failed to load: {error}</p>
            <button
              onClick={() => setNonce((n) => n + 1)}
              className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {/* Stat grid */}
            {statCards.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {statCards.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-charcoal-500">{s.label}</p>
                      <p className="text-xl font-semibold text-[var(--text-primary)] font-mono">
                        {s.value.toLocaleString('en-IN')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent circulars + amendments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                    Recent Circulars
                  </h3>
                  <Link href="/dashboard/circulars" className="text-xs text-sky-600 hover:text-sky-700">
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {(recent?.circulars ?? []).slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/circulars/${c.id}`}
                      className="block border border-[var(--border-default)] rounded-lg p-3 hover:border-sky-300 transition-colors"
                    >
                      <p className="text-sm text-[var(--text-primary)] line-clamp-1 font-medium">
                        {c.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-charcoal-400 font-mono">
                        {c.circular_number && <span>{c.circular_number}</span>}
                        {c.issue_date && <span>&middot; {formatDate(c.issue_date)}</span>}
                        {c.ministry && <span className="font-sans">&middot; {c.ministry}</span>}
                      </div>
                    </Link>
                  ))}
                  {(recent?.circulars?.length ?? 0) === 0 && (
                    <p className="text-xs text-charcoal-400">No recent circulars.</p>
                  )}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                    Recent Amendments
                  </h3>
                  <Link
                    href="/dashboard/amendments/tracker"
                    className="text-xs text-rose-600 hover:text-rose-700"
                  >
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {(recent?.amendments ?? []).slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className="border border-[var(--border-default)] rounded-lg p-3"
                    >
                      <p className="text-sm text-[var(--text-primary)] line-clamp-1 font-medium">
                        {a.amendment_act_name ?? 'Amendment'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-charcoal-400 font-mono">
                        {a.amendment_year && <span>{a.amendment_year}</span>}
                        {a.amendment_date && <span>&middot; {formatDate(a.amendment_date)}</span>}
                        {a.status && <span className="font-sans">&middot; {a.status}</span>}
                      </div>
                    </div>
                  ))}
                  {(recent?.amendments?.length ?? 0) === 0 && (
                    <p className="text-xs text-charcoal-400">No recent amendments.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Domain + Ministry breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-3">
                  Top Legal Domains
                </h3>
                <div className="space-y-2">
                  {topDomains.map((d) => {
                    const totalDomain =
                      num(d.act_count) + num(d.circular_count) + num(d.subleg_count);
                    return (
                      <div key={d.domain} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-primary)]">{d.domain}</span>
                        <div className="flex items-center gap-3 text-xs text-charcoal-500 font-mono">
                          <span>{num(d.act_count)} acts</span>
                          <span>{num(d.circular_count)} circ.</span>
                          <span className="text-[var(--text-primary)]">
                            {totalDomain.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {topDomains.length === 0 && (
                    <p className="text-xs text-charcoal-400">No domain data.</p>
                  )}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-3">
                  Top Ministries
                </h3>
                <div className="space-y-2">
                  {topMinistries.map((m) => (
                    <div key={m.ministry} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text-primary)] line-clamp-1">{m.ministry}</span>
                      <span className="text-xs text-charcoal-500 font-mono">
                        {num(m.count).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                  {topMinistries.length === 0 && (
                    <p className="text-xs text-charcoal-400">No ministry data.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
