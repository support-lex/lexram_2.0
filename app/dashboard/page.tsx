'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, FileText, GitBranch, Scale, Layers, BookOpen, Calendar,
  Search, FileSearch, Users, FileSignature, Building2, Briefcase,
  Megaphone, Network, Activity, FolderOpen, BarChart3, Clock,
  Bot, CreditCard, Settings as SettingsIcon, ArrowRight,
} from 'lucide-react';
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

// Module map for the "All Resources" grid. Each entry surfaces a top-level
// dashboard route. Grouped by category so the grid reads as a navigable
// directory rather than a wall of icons.
const RESOURCE_GROUPS: {
  title: string;
  items: { href: string; icon: typeof FileText; title: string; desc: string }[];
}[] = [
  {
    title: 'AI & Research',
    items: [
      { href: '/dashboard/research-2', icon: Search, title: 'Legal Research', desc: 'AI-powered research with grounded citations' },
      { href: '/dashboard/ai', icon: Bot, title: 'AI Tools', desc: 'Drafts, summaries and analysis' },
      { href: '/dashboard/tsr', icon: FileSearch, title: 'Title Scrutiny', desc: 'Generate TSR for any client' },
    ],
  },
  {
    title: 'Legal Corpus',
    items: [
      { href: '/dashboard/acts', icon: Scale, title: 'Acts', desc: 'Browse and search central + state acts' },
      { href: '/dashboard/sub-legislation', icon: Layers, title: 'Sub-Legislation', desc: 'Rules, regulations and orders' },
      { href: '/dashboard/circulars', icon: Megaphone, title: 'Circulars', desc: 'Ministry-issued circulars and notifications' },
      { href: '/dashboard/amendments', icon: GitBranch, title: 'Amendments', desc: 'Track amendments across acts' },
      { href: '/dashboard/schedules', icon: Calendar, title: 'Schedules', desc: 'Legislative schedules and annexures' },
      { href: '/dashboard/case-law', icon: BookOpen, title: 'Case Library', desc: 'Judgments and citations' },
    ],
  },
  {
    title: 'Practice',
    items: [
      { href: '/dashboard/matters', icon: Briefcase, title: 'Matters', desc: 'Active cases and engagements' },
      { href: '/dashboard/client', icon: Users, title: 'Clients', desc: 'Client roster and case map' },
      { href: '/dashboard/contracts', icon: FileSignature, title: 'Contracts', desc: 'Review and analyse contracts' },
      { href: '/dashboard/documents', icon: FolderOpen, title: 'Documents', desc: 'All uploaded files and drafts' },
      { href: '/dashboard/deadlines', icon: Clock, title: 'Deadlines', desc: 'Upcoming dates across matters' },
      { href: '/dashboard/case-status', icon: Activity, title: 'Case Status', desc: 'Court status of your cases' },
    ],
  },
  {
    title: 'Network & Insights',
    items: [
      { href: '/dashboard/network', icon: Network, title: 'Lexram Network', desc: 'Collaborate with other advocates' },
      { href: '/dashboard/legal-analytics', icon: BarChart3, title: 'Legal Analytics', desc: 'Trends and corpus analytics' },
      { href: '/dashboard/activity', icon: Activity, title: 'Activity', desc: 'Recent activity across the workspace' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/dashboard/billing', icon: CreditCard, title: 'Billing', desc: 'Invoices and payment history' },
      { href: '/dashboard/subscription', icon: CreditCard, title: 'Subscription', desc: 'Plan and credit balance' },
      { href: '/dashboard/settings', icon: SettingsIcon, title: 'Settings', desc: 'Profile and preferences' },
    ],
  },
];

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

      {/* ── All Resources — every top-level module reachable from one place ── */}
      <section className="pt-4 border-t border-[var(--border-default)]">
        <div className="mb-4">
          <p className="text-xs font-medium tracking-widest uppercase text-charcoal-400 mb-1">
            Workspace
          </p>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            All Resources
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Every Lexram module — research, corpus, practice, network and account — one click away.
          </p>
        </div>

        <div className="space-y-6">
          {RESOURCE_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--lex-maroon,#7a1f2b)] mb-2">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map(({ href, icon: Icon, title, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group bg-[var(--surface-glass,#fff)] backdrop-blur-xl p-4 rounded-xl ring-1 ring-[var(--border-default)] hover:ring-[var(--lex-maroon,#7a1f2b)]/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover,0_18px_40px_-20px_rgba(122,31,43,0.25))] transition-all duration-300 flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--lex-maroon,#7a1f2b)]/8 text-[var(--lex-maroon,#7a1f2b)] shrink-0 group-hover:bg-[var(--lex-maroon,#7a1f2b)] group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate">
                          {title}
                        </h4>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                      </div>
                      <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                        {desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Legal Intelligence Overview — live corpus stats from LexRam ── */}
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
            <Loader2 className="w-6 h-6 animate-spin text-[var(--lex-rust,#b94826)]" />
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
