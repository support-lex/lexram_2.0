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
  LexRamAPI,
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

// ─────────────────────────────────────────────────────────────────────────────
// localStorage cache — stores the last-known value of each data source
// keyed by name, alongside the timestamp of the write. Reads are best-
// effort (returns the fallback on any parse error); writes are fire-and-
// forget so quota issues never break the page.
//
// We moved up from sessionStorage to localStorage so the cache survives
// tab closes / browser restarts. Combined with stale-while-revalidate
// fetch logic below, every dashboard visit after the first paints
// immediately with last-known data and then silently refreshes.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_PREFIX = 'lexram_dashboard_v3:';

interface CacheEnvelope<T> {
  v: T;
  t: number; // ms epoch when this entry was saved
}

function loadCached<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // Tolerate both the legacy "raw value" shape and the new envelope so
    // a stored sessionStorage cache from the previous build still hydrates
    // the page on first paint rather than forcing a cold load.
    if (parsed && typeof parsed === 'object' && 'v' in parsed) {
      return (parsed as CacheEnvelope<T>).v;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

function hasCached(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CACHE_PREFIX + key) !== null;
  } catch {
    return false;
  }
}

function saveCached<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    const envelope: CacheEnvelope<T> = { v: value, t: Date.now() };
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
  } catch {
    /* quota / disabled storage — swallow */
  }
}

/** Extracts a usable message from any error shape we encounter — Supabase
 *  PostgrestError objects, axios errors, native Error instances, or plain
 *  strings — so the dashboard banner reads "Row level security policy …"
 *  instead of a bare "Failed to load". */
function describeError(err: unknown): string {
  if (!err) return 'Failed to load';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const e = err as { message?: string; error_description?: string; details?: string; hint?: string; code?: string };
    return e.message || e.error_description || e.details || e.hint || e.code || 'Failed to load';
  }
  return 'Failed to load';
}

export default function DashboardPage() {
  // Each data source has its OWN state + loading flag and fires its OWN
  // fetch — the old Promise.allSettled([...]) held the whole UI hostage
  // until every endpoint returned, so one slow source (LexRam sessions or
  // the network query) made the dashboard feel broken. With independent
  // loaders + sessionStorage seeding, each tile / rail hydrates as soon
  // as its data lands and repeat visits paint last-known values
  // immediately.
  const [sessions, setSessions]               = useState<ResearchSession[]>(() => loadCached<ResearchSession[]>('sessions', []));
  const [sessionsLoading, setSessionsLoading] = useState(() => loadCached<ResearchSession[]>('sessions', []).length === 0);

  const [cases, setCases]                     = useState<CaseItem[]>(() => loadCached<CaseItem[]>('cases', []));
  const [casesLoading, setCasesLoading]       = useState(() => loadCached<CaseItem[]>('cases', []).length === 0);

  const [tsrCases, setTsrCases]               = useState<TsrCase[]>(() => loadCached<TsrCase[]>('tsrCases', []));
  const [tsrLoading, setTsrLoading]           = useState(() => loadCached<TsrCase[]>('tsrCases', []).length === 0);

  const [blogPosts, setBlogPosts]             = useState<BlogPost[]>(() => loadCached<BlogPost[]>('blogPosts', []));
  const [blogLoading, setBlogLoading]         = useState(() => loadCached<BlogPost[]>('blogPosts', []).length === 0);

  const [connectionCount, setConnectionCount] = useState(() => loadCached<number>('network', 0));
  const [networkLoading, setNetworkLoading]   = useState(() => loadCached<number>('network', 0) === 0);

  // Aggregate error banner — keyed by source so per-source failures are
  // visible without nuking the whole page.
  const [sourceErrors, setSourceErrors] = useState<Record<string, string>>({});

  // ── Legal corpus (LexRam backend) ──────────────────────────────────────
  const [corpusStats, setCorpusStats]           = useState<DashboardStatsData | null>(() => loadCached<DashboardStatsData | null>('corpusStats', null));
  const [corpusRecent, setCorpusRecent]         = useState<DashboardRecent | null>(() => loadCached<DashboardRecent | null>('corpusRecent', null));
  const [corpusDomains, setCorpusDomains]       = useState<DashboardDomain[]>(() => loadCached<DashboardDomain[]>('corpusDomains', []));
  const [corpusMinistries, setCorpusMinistries] = useState<DashboardMinistry[]>(() => loadCached<DashboardMinistry[]>('corpusMinistries', []));
  const [corpusLoading, setCorpusLoading]       = useState(() => loadCached<DashboardStatsData | null>('corpusStats', null) === null);
  const [corpusError, setCorpusError]           = useState<string | null>(null);

  const [reloadNonce, setReloadNonce] = useState(0);

  // Map each error source to a human label so the banner reads
  // "Research, TSR failed to load: <message>" instead of the bare
  // "Failed to load" the previous build was showing. recordError() only
  // populates sourceErrors when the source has NO cached data, so the
  // banner truly indicates a hard miss, not just a transient refresh
  // hiccup with cached data still on screen.
  const ERROR_LABELS: Record<string, string> = {
    sessions:  'Research',
    cases:     'Cases',
    blogPosts: 'Blog',
    tsrCases:  'TSR',
    network:   'Network',
  };
  const erroredSources = Object.keys(sourceErrors);
  const erroredLabels = erroredSources.map((k) => ERROR_LABELS[k] ?? k).join(', ');
  const firstErrorMessage = Object.values(sourceErrors)[0] ?? null;
  const liveError = erroredSources.length
    ? `${erroredLabels} — ${firstErrorMessage}`
    : null;

  // Record a per-source error. When we already have cached data for that
  // source we DON'T surface the error in the banner — it's a stale-while-
  // revalidate flow: the user sees their cached numbers, the refresh quietly
  // failed in the background, no point alarming them. We still keep the
  // error in console for debugging via this log.
  const recordError = useCallback((source: string, err: unknown) => {
    const message = describeError(err);
    console.warn(`[dashboard] ${source} fetch failed:`, message, err);
    if (hasCached(source)) return; // stale data is good enough
    setSourceErrors((prev) => ({ ...prev, [source]: message }));
  }, []);

  const clearError = useCallback((source: string) => {
    setSourceErrors((prev) => {
      if (!(source in prev)) return prev;
      const next = { ...prev };
      delete next[source];
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Pull the lexram user id once so we can scope network + TSR queries.
    // Wrapped in its own promise so each downstream fetch fires the moment
    // the auth probe resolves, instead of blocking on a sequential chain.
    const userIdPromise = lexramSupabase()
      .auth.getUser()
      .then(({ data }) => data.user?.id ?? null)
      .catch(() => null);

    // 1. Research sessions — talks to LexRam + Supabase. Usually the
    //    slowest source, so it gets its own independent flag.
    chatSessionRepository
      .list()
      .then((data) => {
        if (cancelled) return;
        setSessions(data);
        saveCached('sessions', data);
        clearError('sessions');
      })
      .catch((e) => !cancelled && recordError('sessions', e))
      .finally(() => !cancelled && setSessionsLoading(false));

    // 2. Research cases — fast /cases endpoint.
    api
      .get<{ cases: CaseItem[] } | CaseItem[]>('/cases')
      .then((res) => {
        if (cancelled) return;
        const v = res.data;
        const list = Array.isArray(v) ? v : v?.cases ?? [];
        setCases(list);
        saveCached('cases', list);
        clearError('cases');
      })
      .catch((e) => !cancelled && recordError('cases', e))
      .finally(() => !cancelled && setCasesLoading(false));

    // 3. Blog posts — Supabase table, usually under 100 ms.
    listPosts({ includeDrafts: true })
      .then((data) => {
        if (cancelled) return;
        setBlogPosts(data);
        saveCached('blogPosts', data);
        clearError('blogPosts');
      })
      .catch((e) => !cancelled && recordError('blogPosts', e))
      .finally(() => !cancelled && setBlogLoading(false));

    // 4. TSR cases — needs the user id; queues on userIdPromise but
    //    doesn't block any other source.
    userIdPromise
      .then(async (userId) => {
        if (cancelled) return;
        if (!userId) {
          setTsrCases([]);
          setTsrLoading(false);
          return;
        }
        const { data, error } = await tsrSupabase
          .from('tsr_clients')
          .select('id, case_name, case_no, bank_name, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (cancelled) return;
        if (error) {
          recordError('tsrCases', error);
        } else {
          const list = (data ?? []) as TsrCase[];
          setTsrCases(list);
          saveCached('tsrCases', list);
          clearError('tsrCases');
        }
      })
      .catch((e) => !cancelled && recordError('tsrCases', e))
      .finally(() => !cancelled && setTsrLoading(false));

    // 5. Network connections.
    userIdPromise
      .then(async (userId) => {
        if (cancelled) return;
        if (!userId) {
          setConnectionCount(0);
          setNetworkLoading(false);
          return;
        }
        const list = await listAcceptedConnections(userId);
        if (cancelled) return;
        const count = Array.isArray(list) ? list.length : 0;
        setConnectionCount(count);
        saveCached('network', count);
        clearError('network');
      })
      .catch((e) => !cancelled && recordError('network', e))
      .finally(() => !cancelled && setNetworkLoading(false));

    return () => {
      cancelled = true;
    };
  }, [reloadNonce, recordError, clearError]);

  // Legal corpus — its own independent loader. Fires Promise.all here
  // because all four endpoints live on the same upstream; serialising
  // them wouldn't help and the four are conceptually one block.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      LexRamAPI.dashboardStats(),
      LexRamAPI.dashboardRecent(),
      LexRamAPI.dashboardDomains(),
      LexRamAPI.dashboardMinistries(),
    ])
      .then(([s, r, d, m]) => {
        if (cancelled) return;
        setCorpusStats(s);
        setCorpusRecent(r);
        const domains = Array.isArray(d) ? d : [];
        const ministries = Array.isArray(m) ? m : [];
        setCorpusDomains(domains);
        setCorpusMinistries(ministries);
        saveCached('corpusStats', s);
        saveCached('corpusRecent', r);
        saveCached('corpusDomains', domains);
        saveCached('corpusMinistries', ministries);
        setCorpusError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        const message = describeError(e);
        console.warn('[dashboard] corpus fetch failed:', message, e);
        // Stale-while-revalidate: if we already have cached corpus stats,
        // keep showing them and skip the error banner. Only surface when
        // there's nothing cached for the user to see.
        if (hasCached('corpusStats')) return;
        setCorpusError(message);
      })
      .finally(() => !cancelled && setCorpusLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadNonce]);

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
  //
  // Palette is restricted to the brand's creamy / rust / maroon family —
  // each tile differentiates with a slightly different cream tint + icon
  // accent (maroon vs. rust) instead of pulling in off-brand sky/violet/
  // emerald/indigo shades like the previous iteration.
  // Each tile carries its OWN loading flag so a single slow upstream can't
  // freeze the whole tile row. Cached values stay visible while their
  // source revalidates — the skeleton only appears when there's literally
  // nothing to render yet.
  const tiles: {
    label: string;
    value: number;
    href: string;
    icon: typeof FileText;
    iconBg: string;
    iconColor: string;
    loading: boolean;
  }[] = [
    { label: 'Research Threads', value: sessionCount,    href: '/dashboard/research-2', icon: MessageSquare, iconBg: 'bg-[#FFF0DF]', iconColor: 'text-[#680318]', loading: sessionsLoading },
    { label: 'Cases',            value: caseCount,       href: '/dashboard/research-2', icon: Briefcase,     iconBg: 'bg-[#F9E4C9]', iconColor: 'text-[#B94826]', loading: casesLoading },
    { label: 'Drafts',           value: draftCount,      href: '/dashboard/research-2', icon: NotebookPen,   iconBg: 'bg-[#FFE6CB]', iconColor: 'text-[#680318]', loading: sessionsLoading },
    { label: 'TSR Reports',      value: tsrCount,        href: '/dashboard/tsr',        icon: FileSearch,    iconBg: 'bg-[#F9E4C9]', iconColor: 'text-[#8f3318]', loading: tsrLoading },
    { label: 'Blog Posts',       value: blogCount,       href: '/dashboard/blog',       icon: PenLine,       iconBg: 'bg-[#FFF0DF]', iconColor: 'text-[#B94826]', loading: blogLoading },
    { label: 'Network',          value: connectionCount, href: '/dashboard/network',    icon: Network,       iconBg: 'bg-[#FFE6CB]', iconColor: 'text-[#7a1f2b]', loading: networkLoading },
  ];

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (
    // The parent <main> in app/dashboard/layout.tsx is a flex column with
    // overflow-hidden — every dashboard page is expected to own its own
    // scroll container. Wrapping in flex-1 + min-h-0 + overflow-y-auto is
    // what makes /dashboard scrollable here (previously it was a plain
    // block div so all the content below the fold was being clipped).
    <div
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 70% 0%, rgba(185,72,38,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 100%, rgba(104,3,24,0.06) 0%, transparent 60%), linear-gradient(180deg, #FFF7EC 0%, #FFF0DF 100%)',
      }}
    >
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
          <div className="mb-3 bg-[#FFE6CB] border border-[#B94826]/30 rounded-lg p-3 flex items-center justify-between">
            <p className="text-xs text-[#680318]">Some workspace data failed to load: {liveError}</p>
            <button
              onClick={() => setReloadNonce((n) => n + 1)}
              className="text-[11px] px-2.5 py-1 bg-[#680318] hover:bg-[#4a0210] text-[#FFF0DF] rounded-md transition-colors"
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
                className="group bg-white/90 backdrop-blur-sm border border-[#680318]/12 rounded-xl p-4 hover:border-[#680318]/35 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(104,3,24,0.30)] transition-all duration-300"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${t.iconBg} ${t.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#680318]/70">
                  {t.label}
                </p>
                <p className="text-2xl font-semibold text-[#3a0510] font-mono mt-0.5 flex items-center gap-1.5">
                  {t.loading && t.value === 0 ? (
                    <span className="inline-block h-7 w-10 rounded bg-[#680318]/15 animate-pulse align-middle" />
                  ) : (
                    <>
                      {t.value.toLocaleString('en-IN')}
                      {t.loading && (
                        // Cached value present + fresh fetch in flight —
                        // a tiny spinner shows it's revalidating, no full
                        // skeleton flash.
                        <Loader2 className="w-3 h-3 animate-spin text-[#B94826]/60" />
                      )}
                    </>
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
          {/* Recent research threads — maroon accent */}
          <div className="bg-white/95 backdrop-blur-sm border border-[#680318]/12 rounded-xl p-5 shadow-[0_18px_40px_-30px_rgba(104,3,24,0.35)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#680318]" />
                <h3 className="text-sm font-semibold text-[#3a0510] uppercase tracking-wide">
                  Recent Research
                </h3>
              </div>
              <Link href="/dashboard/research-2" className="text-xs text-[#680318] hover:text-[#B94826] font-medium transition-colors">
                Open Research
              </Link>
            </div>
            {sessionsLoading && recentSessions.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-[#680318]/8 animate-pulse" />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#680318]/60 mb-3">No research threads yet.</p>
                <Link
                  href="/dashboard/research-2"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#680318] hover:text-[#B94826]"
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
                      className="block border border-[#680318]/10 rounded-lg p-3 hover:border-[#680318]/35 hover:bg-[#FFF0DF]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-[#3a0510] line-clamp-1 font-medium flex-1">
                          {s.title || 'Untitled thread'}
                        </p>
                        {hasDraft && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F9E4C9] text-[#680318] text-[10px] font-semibold">
                            <NotebookPen className="w-2.5 h-2.5" /> Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#680318]/55 font-mono">
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

          {/* Recent blog posts — rust accent */}
          <div className="bg-white/95 backdrop-blur-sm border border-[#680318]/12 rounded-xl p-5 shadow-[0_18px_40px_-30px_rgba(104,3,24,0.35)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-[#B94826]" />
                <h3 className="text-sm font-semibold text-[#3a0510] uppercase tracking-wide">
                  Recent Blogs
                </h3>
                <span className="text-[10px] text-[#680318]/55 font-mono">
                  {publishedBlogs} published · {blogCount - publishedBlogs} draft
                </span>
              </div>
              <Link href="/dashboard/blog" className="text-xs text-[#B94826] hover:text-[#8f3318] font-medium transition-colors">
                All posts
              </Link>
            </div>
            {blogLoading && recentBlogs.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-[#B94826]/8 animate-pulse" />
                ))}
              </div>
            ) : recentBlogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#680318]/60 mb-3">No blog posts yet.</p>
                <Link
                  href="/dashboard/blog/create"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B94826] hover:text-[#8f3318]"
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
                      className="block border border-[#680318]/10 rounded-lg p-3 hover:border-[#B94826]/35 hover:bg-[#F9E4C9]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-[#3a0510] line-clamp-1 font-medium flex-1">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#B94826] text-[#FFF0DF] text-[10px] font-semibold">
                              <Sparkles className="w-2.5 h-2.5" /> NEW
                            </span>
                          )}
                          {!p.published_at && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#F9E4C9] text-[#8f3318] text-[10px] font-semibold">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#680318]/55 font-mono">
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
          {/* Recent TSR cases — rust-deep accent */}
          <div className="bg-white/95 backdrop-blur-sm border border-[#680318]/12 rounded-xl p-5 shadow-[0_18px_40px_-30px_rgba(104,3,24,0.35)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-[#8f3318]" />
                <h3 className="text-sm font-semibold text-[#3a0510] uppercase tracking-wide">
                  TSR Cases
                </h3>
              </div>
              <Link href="/dashboard/tsr" className="text-xs text-[#8f3318] hover:text-[#680318] font-medium transition-colors">
                Open TSR
              </Link>
            </div>
            {tsrLoading && recentTsr.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-[#8f3318]/8 animate-pulse" />
                ))}
              </div>
            ) : recentTsr.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-[#680318]/60 mb-3">No TSR cases yet.</p>
                <Link
                  href="/dashboard/tsr"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8f3318] hover:text-[#680318]"
                >
                  <Plus className="w-3.5 h-3.5" /> Create your first TSR
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentTsr.map((c) => {
                  // Status pills: keep the original semantic colors (green
                  // for complete, red for error) but warm them toward the
                  // brand cream/rust family for the rest.
                  const status = c.status || 'new';
                  const pillStyle =
                    status === 'complete'
                      ? { backgroundColor: '#E7F4D8', color: '#3F5B14' }
                      : status === 'error'
                      ? { backgroundColor: '#F9D6CC', color: '#7a1f17' }
                      : status === 'processing'
                      ? { backgroundColor: '#F9E4C9', color: '#8f3318' }
                      : { backgroundColor: '#FFF0DF', color: '#680318' };
                  return (
                    <Link
                      key={c.id}
                      href={`/dashboard/tsr/${c.id}`}
                      className="block border border-[#680318]/10 rounded-lg p-3 hover:border-[#8f3318]/35 hover:bg-[#F9E4C9]/40 transition-colors"
                    >
                      <p className="text-sm text-[#3a0510] line-clamp-1 font-medium">
                        {c.case_name || 'Untitled case'}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-[#680318]/55 font-mono">
                        <span className="truncate">{c.case_no} · {c.bank_name}</span>
                        <span className="px-1.5 py-0.5 rounded-full font-semibold text-[10px]" style={pillStyle}>
                          {status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions — cream gradient panel with maroon/rust accents */}
          <div
            className="rounded-xl p-5 border border-[#680318]/15"
            style={{
              background: 'linear-gradient(135deg, #FFF0DF 0%, #F9E4C9 100%)',
            }}
          >
            <h3 className="text-sm font-semibold text-[#3a0510] uppercase tracking-wide mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { href: '/dashboard/research-2',  icon: Search,      label: 'New research thread', accent: 'text-[#680318]' },
                { href: '/dashboard/tsr',         icon: FileSearch,  label: 'New TSR report',      accent: 'text-[#8f3318]' },
                { href: '/dashboard/blog/create', icon: PenLine,     label: 'Write a blog post',   accent: 'text-[#B94826]' },
                { href: '/dashboard/network',     icon: Network,     label: 'Browse network',      accent: 'text-[#7a1f2b]' },
              ].map(({ href, icon: Icon, label, accent }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/85 backdrop-blur-sm border border-[#680318]/10 hover:border-[#680318]/35 hover:bg-white transition-colors"
                >
                  <Icon className={`w-4 h-4 ${accent}`} />
                  <span className="text-sm font-medium text-[#3a0510] flex-1">{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#680318]/55 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── More resources — every other top-level module in one place ── */}
      <section className="pt-4 border-t border-[#680318]/15">
        <div className="mb-4">
          <p className="text-xs font-medium tracking-widest uppercase text-[#680318]/65 mb-1">
            Workspace
          </p>
          <h2 className="text-2xl font-serif font-bold text-[#3a0510]">
            More Resources
          </h2>
        </div>

        <div className="space-y-6">
          {RESOURCE_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B94826] mb-2">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map(({ href, icon: Icon, title, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group bg-white/90 backdrop-blur-sm p-3.5 rounded-xl border border-[#680318]/12 hover:border-[#680318]/40 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(104,3,24,0.30)] transition-all duration-300 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#FFF0DF] text-[#680318] shrink-0 group-hover:bg-[#680318] group-hover:text-[#FFF0DF] transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm text-[#3a0510] truncate">
                        {title}
                      </h4>
                      <p className="text-[12px] text-[#680318]/60 mt-0.5 line-clamp-1">
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
      <section className="pt-4 border-t border-[#680318]/15">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#680318]/65 mb-1">
              Legal Corpus
            </p>
            <h2 className="text-2xl font-serif font-bold text-[#3a0510]">
              Legal Intelligence Overview
            </h2>
          </div>
        </div>

        {corpusLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#B94826]" />
          </div>
        )}

        {corpusError && !corpusLoading && (
          <div className="bg-[#FFE6CB] border border-[#B94826]/30 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-[#680318]">Failed to load corpus: {corpusError}</p>
            <button
              onClick={() => setReloadNonce((n) => n + 1)}
              className="text-xs px-3 py-1.5 bg-[#680318] hover:bg-[#4a0210] text-[#FFF0DF] rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!corpusLoading && !corpusError && corpusStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Acts',       value: num(corpusStats.acts),                    icon: Scale,    iconBg: 'bg-[#FFF0DF]',  iconColor: 'text-[#680318]' },
                { label: 'Sections',   value: num(corpusStats.sections),                icon: BookOpen, iconBg: 'bg-[#F9E4C9]',  iconColor: 'text-[#8f3318]' },
                { label: 'Sub-Leg.',   value: num(corpusStats.subordinate_legislation), icon: Layers,   iconBg: 'bg-[#FFE6CB]',  iconColor: 'text-[#B94826]' },
                { label: 'Circulars',  value: num(corpusStats.circulars),               icon: FileText, iconBg: 'bg-[#FFF0DF]',  iconColor: 'text-[#7a1f2b]' },
                { label: 'Amendments', value: num(corpusStats.amendments),              icon: GitBranch,iconBg: 'bg-[#F9E4C9]',  iconColor: 'text-[#680318]' },
                { label: 'Schedules',  value: num(corpusStats.schedules),               icon: Calendar, iconBg: 'bg-[#FFE6CB]',  iconColor: 'text-[#8f3318]' },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white/90 backdrop-blur-sm border border-[#680318]/12 rounded-xl p-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.iconBg} ${s.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-[#680318]/65">{s.label}</p>
                    <p className="text-xl font-semibold text-[#3a0510] font-mono">
                      {s.value.toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/90 backdrop-blur-sm border border-[#680318]/12 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#3a0510] uppercase tracking-wide">
                    Recent Circulars
                  </h3>
                  <Link href="/dashboard/circulars" className="text-xs text-[#680318] hover:text-[#B94826] font-medium transition-colors">
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {(corpusRecent?.circulars ?? []).slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/circulars/${c.id}`}
                      className="block border border-[#680318]/10 rounded-lg p-3 hover:border-[#680318]/35 hover:bg-[#FFF0DF]/40 transition-colors"
                    >
                      <p className="text-sm text-[#3a0510] line-clamp-1 font-medium">{c.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#680318]/55 font-mono">
                        {c.circular_number && <span>{c.circular_number}</span>}
                        {c.issue_date && <span>· {formatDate(c.issue_date)}</span>}
                        {c.ministry && <span className="font-sans">· {c.ministry}</span>}
                      </div>
                    </Link>
                  ))}
                  {(corpusRecent?.circulars?.length ?? 0) === 0 && (
                    <p className="text-xs text-[#680318]/55">No recent circulars.</p>
                  )}
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm border border-[#680318]/12 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#3a0510] uppercase tracking-wide">
                    Recent Amendments
                  </h3>
                  <Link href="/dashboard/amendments/tracker" className="text-xs text-[#B94826] hover:text-[#8f3318] font-medium transition-colors">
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {(corpusRecent?.amendments ?? []).slice(0, 5).map((a) => (
                    <div key={a.id} className="border border-[#680318]/10 rounded-lg p-3">
                      <p className="text-sm text-[#3a0510] line-clamp-1 font-medium">
                        {a.amendment_act_name ?? 'Amendment'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#680318]/55 font-mono">
                        {a.amendment_year && <span>{a.amendment_year}</span>}
                        {a.amendment_date && <span>· {formatDate(a.amendment_date)}</span>}
                        {a.status && <span className="font-sans">· {a.status}</span>}
                      </div>
                    </div>
                  ))}
                  {(corpusRecent?.amendments?.length ?? 0) === 0 && (
                    <p className="text-xs text-[#680318]/55">No recent amendments.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/90 backdrop-blur-sm border border-[#680318]/12 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#3a0510] uppercase tracking-wide mb-3">
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
                          <span className="text-[#3a0510]">{d.domain}</span>
                          <div className="flex items-center gap-3 text-xs text-[#680318]/65 font-mono">
                            <span>{num(d.act_count)} acts</span>
                            <span>{num(d.circular_count)} circ.</span>
                            <span className="text-[#3a0510]">{total.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      );
                    })}
                  {corpusDomains.length === 0 && <p className="text-xs text-[#680318]/55">No domain data.</p>}
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm border border-[#680318]/12 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#3a0510] uppercase tracking-wide mb-3">
                  Top Ministries
                </h3>
                <div className="space-y-2">
                  {[...corpusMinistries]
                    .sort((a, b) => num(b.count) - num(a.count))
                    .slice(0, 6)
                    .map((m) => (
                      <div key={m.ministry} className="flex items-center justify-between text-sm">
                        <span className="text-[#3a0510] line-clamp-1">{m.ministry}</span>
                        <span className="text-xs text-[#680318]/65 font-mono">
                          {num(m.count).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  {corpusMinistries.length === 0 && <p className="text-xs text-[#680318]/55">No ministry data.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
    </div>
  );
}
