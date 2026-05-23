'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, FileText, GitBranch, Scale, Layers, BookOpen, Calendar,
  Search, FileSearch, Users, FileSignature, Building2, Briefcase,
  Megaphone, Network, Activity, FolderOpen, BarChart3, Clock,
  Bot, CreditCard, Settings as SettingsIcon, ArrowRight,
  MessageSquare, Sparkles, NotebookPen, Plus, PenLine,
} from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { chatSessionRepository } from '@/modules/chat/repository/chatSession.repository';
import { listPosts } from '@/lib/blog/api';
import { listAcceptedConnections } from '@/lib/network/connections';
import { supabase as lexramSupabase } from '@/lib/supabase/client';
import { supabase as tsrSupabase } from '@/utils/supabase/client';
import api from '@/services/legal-api';
import {
  LexramAPI,
  type DashboardStats as DashboardStatsData,
  type DashboardRecent,
  type DashboardDomain,
  type DashboardMinistry,
} from '@/lib/lexram/api';
import type { ResearchSession } from '@/app/dashboard/research-2/types';
import type { BlogPost } from '@/types/blog';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

function relativeDate(ts: string): string {
  const now = Date.now();
  const then = new Date(ts).getTime();
  const diffMin = Math.floor((now - then) / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hr ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} day${diffD > 1 ? 's' : ''} ago`;
  return formatDate(ts);
}

function num(v: string | number | undefined | null): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

// A session is considered a "draft" when any of its AI messages either set
// `response.draftReady` or emit a UI block of type "draft" — that's exactly
// what the research-2 chat does when the user runs a drafting flow.
function sessionHasDraft(s: ResearchSession): boolean {
  return s.messages.some(
    (m) =>
      m.role === 'ai' &&
      (!!m.response?.draftReady ||
        m.response?.uiBlocks?.some((b) => b.type === 'draft')),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Static resource directory (only modules that don't already have a live
// rail on the dashboard — those get top billing instead).
// ─────────────────────────────────────────────────────────────────────────────

const RESOURCE_GROUPS: {
  title: string;
  items: { href: string; icon: typeof FileText; title: string; desc: string }[];
}[] = [
  {
    title: 'Legal Corpus',
    items: [
      { href: '/dashboard/acts', icon: Scale, title: 'Acts', desc: 'Central + state acts' },
      { href: '/dashboard/sub-legislation', icon: Layers, title: 'Sub-Legislation', desc: 'Rules and regulations' },
      { href: '/dashboard/circulars', icon: Megaphone, title: 'Circulars', desc: 'Ministry notifications' },
      { href: '/dashboard/amendments', icon: GitBranch, title: 'Amendments', desc: 'Amendment tracker' },
      { href: '/dashboard/schedules', icon: Calendar, title: 'Schedules', desc: 'Legislative schedules' },
      { href: '/dashboard/case-law', icon: BookOpen, title: 'Case Library', desc: 'Judgments and citations' },
    ],
  },
  {
    title: 'Practice',
    items: [
      { href: '/dashboard/matters', icon: Briefcase, title: 'Matters', desc: 'Active cases' },
      { href: '/dashboard/client', icon: Users, title: 'Clients', desc: 'Client roster' },
      { href: '/dashboard/contracts', icon: FileSignature, title: 'Contracts', desc: 'Contract review' },
      { href: '/dashboard/documents', icon: FolderOpen, title: 'Documents', desc: 'All uploaded files' },
      { href: '/dashboard/deadlines', icon: Clock, title: 'Deadlines', desc: 'Upcoming dates' },
      { href: '/dashboard/case-status', icon: Activity, title: 'Case Status', desc: 'Court status' },
    ],
  },
  {
    title: 'Account & Tools',
    items: [
      { href: '/dashboard/ai', icon: Bot, title: 'AI Tools', desc: 'Drafts and summaries' },
      { href: '/dashboard/legal-analytics', icon: BarChart3, title: 'Legal Analytics', desc: 'Corpus trends' },
      { href: '/dashboard/billing', icon: CreditCard, title: 'Billing', desc: 'Invoices' },
      { href: '/dashboard/subscription', icon: CreditCard, title: 'Subscription', desc: 'Plan and credits' },
      { href: '/dashboard/settings', icon: SettingsIcon, title: 'Settings', desc: 'Profile' },
    ],
  },
];

interface TsrCase {
  id: string;
  case_name: string;
  case_no: string;
  bank_name: string;
  status: string;
  created_at?: string;
}

interface CaseItem {
  id: string;
  title?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [tsrCases, setTsrCases] = useState<TsrCase[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  // ── Legal corpus (LexRam backend) ──────────────────────────────────────
  const [corpusStats, setCorpusStats] = useState<DashboardStatsData | null>(null);
  const [corpusRecent, setCorpusRecent] = useState<DashboardRecent | null>(null);
  const [corpusDomains, setCorpusDomains] = useState<DashboardDomain[]>([]);
  const [corpusMinistries, setCorpusMinistries] = useState<DashboardMinistry[]>([]);
  const [corpusLoading, setCorpusLoading] = useState(true);
  const [corpusError, setCorpusError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const loadLive = useCallback(async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      // Pull the lexram user id once so we can scope network + TSR queries.
      const { data: userRes } = await lexramSupabase().auth.getUser();
      const userId = userRes.user?.id ?? null;

      const [sessionsRes, casesRes, blogRes, tsrRes, connRes] = await Promise.allSettled([
        chatSessionRepository.list(),
        api.get<{ cases: CaseItem[] } | CaseItem[]>('/cases'),
        listPosts({ includeDrafts: true }),
        userId
          ? tsrSupabase
              .from('cases')
              .select('id, case_name, case_no, bank_name, status, created_at')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] as TsrCase[], error: null }),
        userId ? listAcceptedConnections(userId) : Promise.resolve([]),
      ]);

      if (sessionsRes.status === 'fulfilled') setSessions(sessionsRes.value);
      if (casesRes.status === 'fulfilled') {
        const v = casesRes.value.data;
        setCases(Array.isArray(v) ? v : v?.cases ?? []);
      }
      if (blogRes.status === 'fulfilled') setBlogPosts(blogRes.value);
      if (tsrRes.status === 'fulfilled') {
        const value = tsrRes.value as { data: TsrCase[] | null; error: unknown };
        setTsrCases(value.data ?? []);
      }
      if (connRes.status === 'fulfilled') {
        setConnectionCount(Array.isArray(connRes.value) ? connRes.value.length : 0);
      }
    } catch (e) {
      setLiveError(e instanceof Error ? e.message : 'Failed to load workspace data');
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const loadCorpus = useCallback(async () => {
    setCorpusLoading(true);
    setCorpusError(null);
    try {
      const [s, r, d, m] = await Promise.all([
        LexramAPI.dashboardStats(),
        LexramAPI.dashboardRecent(),
        LexramAPI.dashboardDomains(),
        LexramAPI.dashboardMinistries(),
      ]);
      setCorpusStats(s);
      setCorpusRecent(r);
      setCorpusDomains(Array.isArray(d) ? d : []);
      setCorpusMinistries(Array.isArray(m) ? m : []);
    } catch (e) {
      setCorpusError(e instanceof Error ? e.message : 'Failed to load corpus');
    } finally {
      setCorpusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLive();
    loadCorpus();
  }, [loadLive, loadCorpus, reloadNonce]);

  // ── Derived counts ────────────────────────────────────────────────────
  const sessionCount = sessions.length;
  const caseCount = cases.length;
  const draftCount = sessions.filter(sessionHasDraft).length;
  const tsrCount = tsrCases.length;
  const blogCount = blogPosts.length;
  const publishedBlogs = blogPosts.filter((p) => p.published_at).length;

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const recentBlogs = [...blogPosts]
    .sort((a, b) => {
      const ta = new Date(a.published_at ?? a.updated_at ?? a.created_at ?? 0).getTime();
      const tb = new Date(b.published_at ?? b.updated_at ?? b.created_at ?? 0).getTime();
      return tb - ta;
    })
    .slice(0, 5);

  const recentTsr = [...tsrCases].slice(0, 5);

  // Tiles — every value pulled from a real backend (LexRam, TSR Supabase,
  // blog table or network table). No localStorage placeholders.
  const tiles: { label: string; value: number; href: string; icon: typeof FileText; color: string }[] = [
    { label: 'Research Threads', value: sessionCount, href: '/dashboard/research-2', icon: MessageSquare, color: 'text-sky-600 bg-sky-50' },
    { label: 'Cases',            value: caseCount,    href: '/dashboard/research-2', icon: Briefcase,      color: 'text-amber-600 bg-amber-50' },
    { label: 'Drafts',           value: draftCount,   href: '/dashboard/research-2', icon: NotebookPen,    color: 'text-violet-600 bg-violet-50' },
    { label: 'TSR Reports',      value: tsrCount,     href: '/dashboard/tsr',        icon: FileSearch,     color: 'text-rose-600 bg-rose-50' },
    { label: 'Blog Posts',       value: blogCount,    href: '/dashboard/blog',       icon: PenLine,        color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Network',          value: connectionCount, href: '/dashboard/network', icon: Network,        color: 'text-indigo-600 bg-indigo-50' },
  ];

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

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

      {/* ── Live workspace tiles ────────────────────────────────────────── */}
      <section>
        {liveError && (
          <div className="mb-3 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between">
            <p className="text-xs text-rose-700">Some workspace data failed to load: {liveError}</p>
            <button
              onClick={() => setReloadNonce((n) => n + 1)}
              className="text-[11px] px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.label}
                href={t.href}
                className="group bg-white border border-[var(--border-default)] rounded-xl p-4 hover:border-[var(--lex-maroon,#7a1f2b)]/40 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(122,31,43,0.25)] transition-all duration-300"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${t.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {t.label}
                </p>
                <p className="text-2xl font-semibold text-[var(--text-primary)] font-mono mt-0.5">
                  {liveLoading ? (
                    <span className="inline-block h-7 w-10 rounded bg-[var(--border-default)]/60 animate-pulse align-middle" />
                  ) : (
                    t.value.toLocaleString('en-IN')
                  )}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Recent rails: Research / Blog / TSR / Quick Actions ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Recent research + Recent blog (span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent research threads */}
          <div className="bg-white border border-[var(--border-default)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                  Recent Research
                </h3>
              </div>
              <Link href="/dashboard/research-2" className="text-xs text-sky-600 hover:text-sky-700">
                Open Research
              </Link>
            </div>
            {liveLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-[var(--border-default)]/40 animate-pulse" />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--text-muted)] mb-3">No research threads yet.</p>
                <Link
                  href="/dashboard/research-2"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Start your first research
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentSessions.map((s) => {
                  const hasDraft = sessionHasDraft(s);
                  return (
                    <Link
                      key={s.id}
                      href={`/dashboard/research-2?session=${s.id}`}
                      className="block border border-[var(--border-default)] rounded-lg p-3 hover:border-sky-300 hover:bg-sky-50/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-[var(--text-primary)] line-clamp-1 font-medium flex-1">
                          {s.title || 'Untitled thread'}
                        </p>
                        {hasDraft && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-semibold">
                            <NotebookPen className="w-2.5 h-2.5" /> Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)] font-mono">
                        <span>{s.messages.length} msg{s.messages.length === 1 ? '' : 's'}</span>
                        <span>·</span>
                        <span>{relativeDate(s.updatedAt)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent blog posts */}
          <div className="bg-white border border-[var(--border-default)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                  Recent Blogs
                </h3>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {publishedBlogs} published · {blogCount - publishedBlogs} draft
                </span>
              </div>
              <Link href="/dashboard/blog" className="text-xs text-emerald-600 hover:text-emerald-700">
                All posts
              </Link>
            </div>
            {liveLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-[var(--border-default)]/40 animate-pulse" />
                ))}
              </div>
            ) : recentBlogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--text-muted)] mb-3">No blog posts yet.</p>
                <Link
                  href="/dashboard/blog/create"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Write a post
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentBlogs.map((p) => {
                  const ts = p.published_at ?? p.updated_at ?? p.created_at ?? '';
                  const isNew = ts && new Date(ts).getTime() > sevenDaysAgo;
                  return (
                    <Link
                      key={p.id}
                      href={p.slug ? `/blog/${p.slug}` : '/dashboard/blog'}
                      className="block border border-[var(--border-default)] rounded-lg p-3 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-[var(--text-primary)] line-clamp-1 font-medium flex-1">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                              <Sparkles className="w-2.5 h-2.5" /> NEW
                            </span>
                          )}
                          {!p.published_at && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)] font-mono">
                        {p.published_at ? <span>Published {relativeDate(p.published_at)}</span> : <span>Updated {relativeDate(ts)}</span>}
                        {p.reading_time && <span>· {p.reading_time} min read</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — TSR cases + Quick actions */}
        <div className="space-y-6">
          {/* Recent TSR cases */}
          <div className="bg-white border border-[var(--border-default)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                  TSR Cases
                </h3>
              </div>
              <Link href="/dashboard/tsr" className="text-xs text-rose-600 hover:text-rose-700">
                Open TSR
              </Link>
            </div>
            {liveLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-[var(--border-default)]/40 animate-pulse" />
                ))}
              </div>
            ) : recentTsr.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--text-muted)] mb-3">No TSR cases yet.</p>
                <Link
                  href="/dashboard/tsr"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Create your first TSR
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentTsr.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/tsr/${c.id}`}
                    className="block border border-[var(--border-default)] rounded-lg p-3 hover:border-rose-300 hover:bg-rose-50/30 transition-colors"
                  >
                    <p className="text-sm text-[var(--text-primary)] line-clamp-1 font-medium">
                      {c.case_name || 'Untitled case'}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-[var(--text-muted)] font-mono">
                      <span className="truncate">{c.case_no} · {c.bank_name}</span>
                      <span
                        className="px-1.5 py-0.5 rounded-full font-semibold text-[10px]"
                        style={{
                          backgroundColor: c.status === 'complete' ? '#D1FAE5' : c.status === 'error' ? '#FEE2E2' : '#fff7ec',
                          color: c.status === 'complete' ? '#065F46' : c.status === 'error' ? '#991B1B' : '#680318',
                        }}
                      >
                        {c.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#fff7ec] to-white border border-[var(--border-default)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { href: '/dashboard/research-2', icon: Search, label: 'New research thread', accent: 'text-sky-600' },
                { href: '/dashboard/tsr',        icon: FileSearch, label: 'New TSR report',  accent: 'text-rose-600' },
                { href: '/dashboard/blog/create', icon: PenLine, label: 'Write a blog post', accent: 'text-emerald-600' },
                { href: '/dashboard/network',   icon: Network, label: 'Browse network',     accent: 'text-indigo-600' },
              ].map(({ href, icon: Icon, label, accent }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-[var(--border-default)] hover:border-[var(--lex-maroon,#7a1f2b)]/30 transition-colors"
                >
                  <Icon className={`w-4 h-4 ${accent}`} />
                  <span className="text-sm font-medium text-[var(--text-primary)] flex-1">{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── More resources — every other top-level module in one place ── */}
      <section className="pt-4 border-t border-[var(--border-default)]">
        <div className="mb-4">
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--text-muted)] mb-1">
            Workspace
          </p>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            More Resources
          </h2>
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
                    className="group bg-white p-3.5 rounded-xl border border-[var(--border-default)] hover:border-[var(--lex-maroon,#7a1f2b)]/40 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(122,31,43,0.25)] transition-all duration-300 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--lex-maroon,#7a1f2b)]/8 text-[var(--lex-maroon,#7a1f2b)] shrink-0 group-hover:bg-[var(--lex-maroon,#7a1f2b)] group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate">
                        {title}
                      </h4>
                      <p className="text-[12px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
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

      {/* ── Legal Intelligence Overview — live LexRam corpus data ── */}
      <section className="pt-4 border-t border-[var(--border-default)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--text-muted)] mb-1">
              Legal Corpus
            </p>
            <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
              Legal Intelligence Overview
            </h2>
          </div>
        </div>

        {corpusLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--lex-rust,#b94826)]" />
          </div>
        )}

        {corpusError && !corpusLoading && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-rose-700">Failed to load corpus: {corpusError}</p>
            <button
              onClick={() => setReloadNonce((n) => n + 1)}
              className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {!corpusLoading && !corpusError && corpusStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Acts',          value: num(corpusStats.acts),                   icon: Scale,    color: 'text-amber-600 bg-amber-50' },
                { label: 'Sections',      value: num(corpusStats.sections),               icon: BookOpen, color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Sub-Leg.',      value: num(corpusStats.subordinate_legislation),icon: Layers,   color: 'text-violet-600 bg-violet-50' },
                { label: 'Circulars',     value: num(corpusStats.circulars),              icon: FileText, color: 'text-sky-600 bg-sky-50' },
                { label: 'Amendments',    value: num(corpusStats.amendments),             icon: GitBranch,color: 'text-rose-600 bg-rose-50' },
                { label: 'Schedules',     value: num(corpusStats.schedules),              icon: Calendar, color: 'text-teal-600 bg-teal-50' },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white border border-[var(--border-default)] rounded-xl p-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                    <p className="text-xl font-semibold text-[var(--text-primary)] font-mono">
                      {s.value.toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[var(--border-default)] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                    Recent Circulars
                  </h3>
                  <Link href="/dashboard/circulars" className="text-xs text-sky-600 hover:text-sky-700">
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {(corpusRecent?.circulars ?? []).slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/circulars/${c.id}`}
                      className="block border border-[var(--border-default)] rounded-lg p-3 hover:border-sky-300 transition-colors"
                    >
                      <p className="text-sm text-[var(--text-primary)] line-clamp-1 font-medium">{c.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)] font-mono">
                        {c.circular_number && <span>{c.circular_number}</span>}
                        {c.issue_date && <span>· {formatDate(c.issue_date)}</span>}
                        {c.ministry && <span className="font-sans">· {c.ministry}</span>}
                      </div>
                    </Link>
                  ))}
                  {(corpusRecent?.circulars?.length ?? 0) === 0 && (
                    <p className="text-xs text-[var(--text-muted)]">No recent circulars.</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[var(--border-default)] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                    Recent Amendments
                  </h3>
                  <Link href="/dashboard/amendments/tracker" className="text-xs text-rose-600 hover:text-rose-700">
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {(corpusRecent?.amendments ?? []).slice(0, 5).map((a) => (
                    <div key={a.id} className="border border-[var(--border-default)] rounded-lg p-3">
                      <p className="text-sm text-[var(--text-primary)] line-clamp-1 font-medium">
                        {a.amendment_act_name ?? 'Amendment'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)] font-mono">
                        {a.amendment_year && <span>{a.amendment_year}</span>}
                        {a.amendment_date && <span>· {formatDate(a.amendment_date)}</span>}
                        {a.status && <span className="font-sans">· {a.status}</span>}
                      </div>
                    </div>
                  ))}
                  {(corpusRecent?.amendments?.length ?? 0) === 0 && (
                    <p className="text-xs text-[var(--text-muted)]">No recent amendments.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[var(--border-default)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-3">
                  Top Legal Domains
                </h3>
                <div className="space-y-2">
                  {[...corpusDomains]
                    .sort((a, b) => num(b.act_count) + num(b.circular_count) - (num(a.act_count) + num(a.circular_count)))
                    .slice(0, 6)
                    .map((d) => {
                      const total = num(d.act_count) + num(d.circular_count) + num(d.subleg_count);
                      return (
                        <div key={d.domain} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text-primary)]">{d.domain}</span>
                          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono">
                            <span>{num(d.act_count)} acts</span>
                            <span>{num(d.circular_count)} circ.</span>
                            <span className="text-[var(--text-primary)]">{total.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      );
                    })}
                  {corpusDomains.length === 0 && <p className="text-xs text-[var(--text-muted)]">No domain data.</p>}
                </div>
              </div>

              <div className="bg-white border border-[var(--border-default)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-3">
                  Top Ministries
                </h3>
                <div className="space-y-2">
                  {[...corpusMinistries]
                    .sort((a, b) => num(b.count) - num(a.count))
                    .slice(0, 6)
                    .map((m) => (
                      <div key={m.ministry} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-primary)] line-clamp-1">{m.ministry}</span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          {num(m.count).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  {corpusMinistries.length === 0 && <p className="text-xs text-[var(--text-muted)]">No ministry data.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
