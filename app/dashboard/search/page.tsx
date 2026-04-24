'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search as SearchIcon,
  Loader2,
  FileText,
  Scale,
  Landmark,
  BookOpen,
  History,
  X,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  ragQuery,
  ACT_FILTERS,
  MOEFCC_FILTER_ID,
  type RagResponse,
  RagError,
} from '@/lib/rag-client';
import { AnswerCard } from '@/components/search/AnswerCard';
import { SourceCard } from '@/components/search/SourceCard';
import { MoefccAnswerPanel } from '@/components/search/MoefccAnswerPanel';
import { MoefccSourceCard } from '@/components/search/MoefccSourceCard';
import { MoefccClusterCard } from '@/components/search/MoefccClusterCard';
import { useMoefccRAG } from '@/hooks/useMoefccRAG';

interface ActRow {
  id: string;
  name: string;
  year: number | null;
  domain: string | null;
  ministry: string | null;
}
interface CircularRow {
  id: string | number;
  subject: string;
  ministry: string | null;
  issue_date: string | null;
  circular_type: string | null;
}
interface SubLegRow {
  id: string | number;
  name: string;
  doc_type: string | null;
  year: number | null;
  ministry: string | null;
}
interface SectionRow {
  id: string | number;
  section_number: string | null;
  heading: string | null;
  category_id: number | null;
}
interface AmendmentRow {
  id: number;
  amendment_act_name: string | null;
  amendment_year: number | null;
  act_id: string | null;
  status: string | null;
}
interface SearchResults {
  q: string;
  acts: ActRow[];
  circulars: CircularRow[];
  sub_legislation: SubLegRow[];
  sections: SectionRow[];
  amendments: AmendmentRow[];
  elapsedMs: number;
}

type TabKey = 'all' | 'acts' | 'circulars' | 'sub_legislation' | 'amendments' | 'sections';

type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const TABS: { key: TabKey; label: string; icon: IconComponent }[] = [
  { key: 'all', label: 'All', icon: SearchIcon },
  { key: 'acts', label: 'Acts', icon: Scale },
  { key: 'circulars', label: 'Circulars', icon: FileText },
  { key: 'sub_legislation', label: 'Sub-Legislation', icon: BookOpen },
  { key: 'amendments', label: 'Amendments', icon: Landmark },
  { key: 'sections', label: 'Sections', icon: FileText },
];

const SUGGESTIONS = [
  'Digital lending guidelines',
  'Companies Act CSR rules',
  'Insider trading regulations',
  'Data protection penalties',
  'Environmental clearance process',
  'GST input tax credit',
];

const HISTORY_KEY = 'lexram-search-history';

function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  const add = useCallback((q: string) => {
    setHistory((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 8);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  const clear = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  }, []);
  return { history, add, clear };
}

function renderAnswerWithCitations(text: string): React.ReactNode[] {
  const regex = /\[(act|circular|sub-leg|amendment|section):([^\]]+)\]/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, type, id] = match;
    const href = (() => {
      switch (type) {
        case 'act':
          return `/dashboard/acts/${id}`;
        case 'circular':
          return `/dashboard/circulars/${id}`;
        case 'sub-leg':
          return `/dashboard/sub-legislation/${id}`;
        case 'amendment':
          return `/dashboard/amendments/tracker?id=${id}`;
        case 'section':
          return `#`;
        default:
          return '#';
      }
    })();
    nodes.push(
      <Link
        key={`cite-${key++}`}
        href={href}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-semibold border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] transition-colors align-baseline"
        title={`${type}:${id}`}
      >
        {type}:{id.length > 14 ? id.slice(0, 14) + '…' : id}
      </Link>,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

const LOADING_STAGES = [
  'Searching legal database…',
  'Reranking most relevant sections…',
  'Generating answer…',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submittedQ, setSubmittedQ] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { history, add: addHistory, clear: clearHistory } = useSearchHistory();

  // RAG (retrieval-augmented) state — the headline answer + citations.
  const [ragResult, setRagResult] = useState<RagResponse | null>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const [ragStage, setRagStage] = useState(0);
  const [fastMode, setFastMode] = useState(false);
  const [actFilter, setActFilter] = useState<string>('');
  const [highlightSection, setHighlightSection] = useState<string | null>(null);
  const [highlightMoefcc, setHighlightMoefcc] = useState<number | null>(null);
  const ragAbortRef = useRef<AbortController | null>(null);

  // MoEFCC environmental corpus — separate streaming pipeline.
  const isMoefcc = actFilter === MOEFCC_FILTER_ID;
  const moefcc = useMoefccRAG();

  const runSearch = useCallback(
    async (q: string, opts?: { fast?: boolean; act?: string }) => {
      const clean = q.trim();
      if (!clean) return;
      const fast = opts?.fast ?? fastMode;
      const act = opts?.act ?? actFilter;

      setSubmittedQ(clean);
      addHistory(clean);

      // MoEFCC corpus — route through its own streaming pipeline and skip
      // the arbitration RAG + SQL breadth search (different index, different
      // citation style).
      if (act === MOEFCC_FILTER_ID) {
        abortRef.current?.abort();
        ragAbortRef.current?.abort();
        setResults(null);
        setError(null);
        setRagResult(null);
        setRagError(null);
        setRagLoading(false);
        setLoading(false);
        setStreaming(false);
        setHighlightMoefcc(null);
        moefcc.run(clean, fast ? 'quick' : 'answer', 5);
        return;
      }

      moefcc.reset();
      setResults(null);
      setError(null);
      setLoading(true);
      setStreaming(true);
      setRagResult(null);
      setRagError(null);
      setRagLoading(true);
      setRagStage(0);
      setHighlightSection(null);
      abortRef.current?.abort();
      ragAbortRef.current?.abort();
      const ac = new AbortController();
      const ragAc = new AbortController();
      abortRef.current = ac;
      ragAbortRef.current = ragAc;

      // Run the SQL breadth search and the RAG depth search in parallel;
      // neither blocks the other.
      const sqlPromise = (async () => {
        try {
          const res = await fetch('/api/lexram-db/search?q=' + encodeURIComponent(clean), {
            signal: ac.signal,
          });
          if (!res.ok) throw new Error(`Search failed (${res.status})`);
          const parsed = (await res.json()) as SearchResults;
          setResults(parsed);
        } catch (e) {
          if ((e as { name?: string })?.name === 'AbortError') return;
          setError(e instanceof Error ? e.message : 'Search failed');
        } finally {
          setLoading(false);
          setStreaming(false);
        }
      })();

      const ragPromise = (async () => {
        try {
          const data = await ragQuery({
            query: clean,
            act_id: act || undefined,
            k: 5,
            rerank: !fast,
            generate: !fast,
            signal: ragAc.signal,
          });
          setRagResult(data);
        } catch (e) {
          if ((e as { name?: string })?.name === 'AbortError') return;
          if (e instanceof RagError) setRagError(e.message);
          else setRagError(e instanceof Error ? e.message : 'RAG search failed');
        } finally {
          setRagLoading(false);
        }
      })();

      await Promise.allSettled([sqlPromise, ragPromise]);
    },
    [addHistory, fastMode, actFilter, moefcc],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      ragAbortRef.current?.abort();
    };
  }, []);

  // Cycle the RAG loading label every 4s so the user sees progress.
  useEffect(() => {
    if (!ragLoading) {
      setRagStage(0);
      return;
    }
    setRagStage(0);
    const timer = setInterval(() => {
      setRagStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [ragLoading]);

  const scrollToSource = useCallback((section: string) => {
    setHighlightSection(section);
    const el = document.getElementById(`source-${section}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightSection(null), 2000);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const counts = results
    ? {
        all:
          results.acts.length +
          results.circulars.length +
          results.sub_legislation.length +
          results.amendments.length +
          results.sections.length,
        acts: results.acts.length,
        circulars: results.circulars.length,
        sub_legislation: results.sub_legislation.length,
        amendments: results.amendments.length,
        sections: results.sections.length,
      }
    : null;

  const showTab = (k: TabKey) => activeTab === 'all' || activeTab === k;

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)' }}
              >
                <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
                  Legal Research Search
                </h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  AI-grounded search across 9,461 acts · 34,409 circulars · 698 amendments
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mb-3">
            <div
              className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl px-4 py-3 shadow-sm focus-within:border-[var(--accent)]/60"
              style={{ boxShadow: '0 8px 24px -12px rgba(0,0,0,0.08)' }}
            >
              <SearchIcon className="w-5 h-5 text-[var(--text-secondary)] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isMoefcc
                    ? 'Ask about EIA, forest clearance, pollution rules…'
                    : 'Ask a legal question…'
                }
                className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]/70 text-[15px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={!query.trim() || ragLoading || moefcc.state.loading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text, #fff)' }}
              >
                {ragLoading || moefcc.state.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{ragLoading || moefcc.state.loading ? 'Searching' : 'Search'}</span>
              </button>
            </div>
          </form>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3 mb-6 text-xs">
            <label className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <span className="uppercase tracking-wide font-medium">Act</span>
              <select
                value={actFilter}
                onChange={(e) => setActFilter(e.target.value)}
                className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                {ACT_FILTERS.map((opt) => (
                  <option key={opt.id ?? 'all'} value={opt.id ?? ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setFastMode((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors',
                fastMode
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)]/60',
              )}
              title={
                isMoefcc
                  ? 'Quick mode returns MoEFCC sources only (~2s)'
                  : 'Skip AI answer and reranking — retrieves sources only'
              }
            >
              <Zap className="w-3.5 h-3.5" />
              {isMoefcc
                ? fastMode
                  ? 'Quick mode'
                  : 'Answer mode'
                : fastMode
                  ? 'Fast mode on'
                  : 'Fast mode off'}
            </button>
            {!isMoefcc && ragResult && (
              <span className="text-[var(--text-secondary)] font-mono ml-auto">
                {(ragResult.timing_ms.total / 1000).toFixed(1)}s · retrieve {ragResult.timing_ms.retrieve}ms
                {ragResult.timing_ms.rerank > 0 && ` · rerank ${ragResult.timing_ms.rerank}ms`}
                {ragResult.timing_ms.generate > 0 && ` · generate ${ragResult.timing_ms.generate}ms`}
              </span>
            )}
            {isMoefcc && moefcc.state.timing && moefcc.state.stage === 'done' && (
              <span className="text-[var(--text-secondary)] font-mono ml-auto">
                embed {moefcc.state.timing.embed}ms · search {moefcc.state.timing.search}ms
              </span>
            )}
          </div>

          {!submittedQ && (
            <div className="mb-8 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">
                  Try searching for
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s);
                        runSearch(s);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {history.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] flex items-center gap-1">
                      <History className="w-3.5 h-3.5" /> Recent
                    </p>
                    <button
                      onClick={clearHistory}
                      className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((h) => (
                      <button
                        key={h}
                        onClick={() => {
                          setQuery(h);
                          runSearch(h);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MoEFCC: loading skeleton shown while waiting for first SSE event. */}
          {isMoefcc && moefcc.state.loading && moefcc.state.sources.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />
                <span className="text-sm text-[var(--text-primary)]">
                  {moefcc.state.mode === 'quick'
                    ? 'Retrieving MoEFCC sources…'
                    : moefcc.state.stage === 'generate'
                      ? 'Generating answer…'
                      : 'Searching MoEFCC corpus…'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-5/6 rounded bg-[var(--surface-hover)] animate-pulse" />
                <div className="h-3 w-4/6 rounded bg-[var(--surface-hover)] animate-pulse" />
                <div className="h-3 w-3/6 rounded bg-[var(--surface-hover)] animate-pulse" />
              </div>
            </motion.div>
          )}

          {/* MoEFCC: error state with retry. */}
          {isMoefcc && moefcc.state.stage === 'error' && moefcc.state.error && (
            <div className="mb-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 text-sm text-rose-700 dark:text-rose-300">
              {moefcc.state.error}{' '}
              <button
                onClick={() => runSearch(submittedQ)}
                className="underline font-medium ml-1"
              >
                Retry
              </button>
            </div>
          )}

          {/* MoEFCC: sources appear first (at ~2s), then answer streams above. */}
          {isMoefcc && moefcc.state.answer && moefcc.state.mode === 'answer' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <MoefccAnswerPanel
                answer={moefcc.state.answer}
                sources={moefcc.state.sources}
                streaming={moefcc.state.loading}
                onCitationClick={(idx) => {
                  setHighlightMoefcc(idx);
                  setTimeout(() => setHighlightMoefcc(null), 2000);
                }}
              />
            </motion.div>
          )}

          {isMoefcc &&
            (moefcc.state.clusters.length > 0 || moefcc.state.sources.length > 0) && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                    MoEFCC Sources
                  </h2>
                  <span className="text-xs text-[var(--text-secondary)] font-mono">
                    (
                    {moefcc.state.clusters.length ||
                      moefcc.state.sources.length}{' '}
                    {moefcc.state.clusters.length ? 'topics' : 'sources'})
                  </span>
                </div>
                <div className="space-y-2">
                  {moefcc.state.clusters.length > 0
                    ? moefcc.state.clusters.map((c, i) => (
                        <MoefccClusterCard
                          key={`${c.parent_id}-${i}`}
                          cluster={c}
                          index={i}
                          highlight={highlightMoefcc === i + 1}
                        />
                      ))
                    : moefcc.state.sources.map((s, i) => (
                        <MoefccSourceCard
                          key={`${s.parent_id}-${i}`}
                          source={s}
                          index={i}
                          highlight={highlightMoefcc === i + 1}
                        />
                      ))}
                </div>
              </div>
            )}

          {/* MoEFCC: no-results state. */}
          {isMoefcc &&
            moefcc.state.stage === 'done' &&
            moefcc.state.sources.length === 0 && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-10 text-center mb-6">
                <SearchIcon className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
                <p className="text-[var(--text-primary)] font-medium">
                  No MoEFCC sources found. Try a different phrasing.
                </p>
              </div>
            )}

          {!isMoefcc && error && (
            <div className="mb-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 text-sm text-rose-700 dark:text-rose-300">
              {error}
              <button onClick={() => runSearch(submittedQ)} className="ml-2 underline">
                Retry
              </button>
            </div>
          )}

          {!isMoefcc && loading && !results && (
            <div className="flex items-center gap-3 text-[var(--text-secondary)] mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Searching the law database…</span>
            </div>
          )}

          {/* RAG loading skeleton */}
          {!isMoefcc && submittedQ && ragLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />
                <span className="text-sm text-[var(--text-primary)]">
                  {fastMode ? 'Retrieving relevant sections…' : LOADING_STAGES[ragStage]}
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-5/6 rounded bg-[var(--surface-hover)] animate-pulse" />
                <div className="h-3 w-4/6 rounded bg-[var(--surface-hover)] animate-pulse" />
                <div className="h-3 w-3/6 rounded bg-[var(--surface-hover)] animate-pulse" />
              </div>
            </motion.div>
          )}

          {/* RAG error */}
          {!isMoefcc && submittedQ && ragError && !ragLoading && (
            <div className="mb-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 text-sm text-rose-700 dark:text-rose-300">
              {ragError}{' '}
              <button
                onClick={() => runSearch(submittedQ)}
                className="underline font-medium ml-1"
              >
                Retry
              </button>
            </div>
          )}

          {/* RAG answer card */}
          {!isMoefcc && ragResult && ragResult.answer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <AnswerCard
                answer={ragResult.answer}
                sources={ragResult.sources}
                onCitationClick={scrollToSource}
              />
            </motion.div>
          )}

          {/* RAG sources */}
          {!isMoefcc && ragResult && ragResult.sources.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                  Relevant Sections
                </h2>
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  ({ragResult.sources.length})
                </span>
              </div>
              <div className="space-y-2">
                {ragResult.sources.map((source, i) => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    index={i}
                    highlight={
                      highlightSection === source.section ||
                      highlightSection === String(i + 1)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {!isMoefcc && results && counts && (
            <>
              <div className="flex items-center gap-1 border-b border-[var(--border-default)] mb-4 overflow-x-auto">
                {TABS.map(({ key, label, icon: Icon }) => {
                  const count = counts[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors',
                        activeTab === key
                          ? 'border-[var(--accent)] text-[var(--text-primary)] font-semibold'
                          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                      <span className="text-xs text-[var(--text-secondary)] font-mono">({count})</span>
                    </button>
                  );
                })}
                <div className="ml-auto pr-1 text-xs text-[var(--text-secondary)] py-2">
                  {results.elapsedMs}ms
                </div>
              </div>

              <div className="space-y-6 pb-8">
                {showTab('acts') && results.acts.length > 0 && (
                  <Section title="Acts" icon={Scale} count={results.acts.length}>
                    {results.acts.map((a) => (
                      <ResultLink
                        key={`act-${a.id}`}
                        href={`/dashboard/acts/${a.id}`}
                        title={a.name}
                        meta={[a.year ? String(a.year) : null, a.domain, a.ministry].filter(Boolean).join(' · ')}
                        badge="Act"
                      />
                    ))}
                  </Section>
                )}

                {showTab('circulars') && results.circulars.length > 0 && (
                  <Section title="Circulars & Notifications" icon={FileText} count={results.circulars.length}>
                    {results.circulars.map((c) => (
                      <ResultLink
                        key={`circular-${c.id}`}
                        href={`/dashboard/circulars/${c.id}`}
                        title={c.subject}
                        meta={[c.ministry, c.issue_date?.slice(0, 10), c.circular_type].filter(Boolean).join(' · ')}
                        badge={c.circular_type ?? 'Circular'}
                      />
                    ))}
                  </Section>
                )}

                {showTab('sub_legislation') && results.sub_legislation.length > 0 && (
                  <Section title="Subordinate Legislation" icon={BookOpen} count={results.sub_legislation.length}>
                    {results.sub_legislation.map((s) => (
                      <ResultLink
                        key={`subleg-${s.id}`}
                        href={`/dashboard/sub-legislation/${s.id}`}
                        title={s.name}
                        meta={[s.year ? String(s.year) : null, s.doc_type, s.ministry].filter(Boolean).join(' · ')}
                        badge={s.doc_type ?? 'Sub-leg'}
                      />
                    ))}
                  </Section>
                )}

                {showTab('amendments') && results.amendments.length > 0 && (
                  <Section title="Amendments" icon={Landmark} count={results.amendments.length}>
                    {results.amendments.map((a) => (
                      <ResultLink
                        key={`amd-${a.id}`}
                        href={`/dashboard/amendments/tracker?id=${a.id}`}
                        title={a.amendment_act_name ?? `Amendment #${a.id}`}
                        meta={[a.amendment_year ? String(a.amendment_year) : null, a.status, a.act_id ?? null]
                          .filter(Boolean)
                          .join(' · ')}
                        badge="Amendment"
                      />
                    ))}
                  </Section>
                )}

                {showTab('sections') && results.sections.length > 0 && (
                  <Section title="Sections" icon={FileText} count={results.sections.length}>
                    {results.sections.map((s) => (
                      <ResultLink
                        key={`sec-${s.id}`}
                        href="#"
                        title={s.heading ?? `Section ${s.section_number ?? s.id}`}
                        meta={s.section_number ? `§ ${s.section_number}` : ''}
                        badge="Section"
                      />
                    ))}
                  </Section>
                )}

                {counts.all === 0 && (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-10 text-center">
                    <SearchIcon className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
                    <p className="text-[var(--text-primary)] font-medium">
                      No results for &ldquo;{submittedQ}&rdquo;
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Try broader or different keywords.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: IconComponent;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
          {title}
        </h2>
        <span className="text-xs text-[var(--text-secondary)] font-mono">({count})</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ResultLink({
  href,
  title,
  meta,
  badge,
}: {
  href: string;
  title: string;
  meta?: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl hover:border-[var(--accent)]/50 hover:shadow-sm transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="text-[15px] font-medium text-[var(--text-primary)] line-clamp-2 flex-1">
            {title}
          </span>
          {badge && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)] shrink-0">
              {badge}
            </span>
          )}
        </div>
        {meta && (
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono truncate">{meta}</p>
        )}
      </div>
      <ArrowUpRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors mt-0.5 shrink-0" />
    </Link>
  );
}
