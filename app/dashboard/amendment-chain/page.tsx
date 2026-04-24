'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  GitMerge,
  Calendar,
  Loader2,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { LexramAPI, type AmendmentChainNode } from '@/lib/lexram/api';

const DEFAULT_ID = 660;

function formatDate(date?: string | null): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

function statusColor(status?: string | null): string {
  if (!status) return 'bg-charcoal-100 text-charcoal-600';
  const s = status.toLowerCase();
  if (s.includes('force') || s.includes('active')) return 'bg-emerald-100 text-emerald-700';
  if (s.includes('repeal')) return 'bg-rose-100 text-rose-700';
  if (s.includes('pending')) return 'bg-amber-100 text-amber-700';
  return 'bg-charcoal-100 text-charcoal-600';
}

export default function AmendmentChainPage() {
  const router = useRouter();
  const [inputId, setInputId] = useState<string>(String(DEFAULT_ID));
  const [currentId, setCurrentId] = useState<number>(DEFAULT_ID);
  const [chain, setChain] = useState<AmendmentChainNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await LexramAPI.amendmentChain(currentId);
        if (cancelled) return;
        const nodes = Array.isArray(res?.chain) ? res.chain : [];
        setChain(nodes);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message || 'Failed to load amendment chain');
        setChain([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  function handleLookup(e: FormEvent) {
    e.preventDefault();
    const id = parseInt(inputId, 10);
    if (Number.isNaN(id)) return;
    setCurrentId(id);
  }

  const maxDepth = chain.reduce((m, n) => Math.max(m, n.depth ?? 0), 0);

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/amendments')}
              className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                <GitMerge className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-charcoal-900">Amendment Chain Analysis</h1>
                <p className="text-charcoal-500 text-sm">
                  Trace an amendment's ripple effect across related amendments
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-charcoal-100 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-serif font-semibold text-charcoal-900 mb-4">Find Amendment</h2>
            <form onSubmit={handleLookup} className="flex flex-wrap gap-3 items-center">
              <input
                type="number"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="Amendment ID..."
                className="w-64 px-3 py-2 bg-charcoal-50 border border-charcoal-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors text-sm font-medium"
              >
                Look Up
              </button>
              <span className="text-xs text-charcoal-500">
                Currently viewing <span className="font-mono">#{currentId}</span>
              </span>
            </form>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}

          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-rose-700 mb-3">{error}</p>
              <button
                onClick={() => setCurrentId((id) => id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {!loading && !error && chain.length === 0 && (
            <div className="bg-white rounded-xl border border-charcoal-100 p-12 text-center">
              <GitMerge className="w-12 h-12 text-charcoal-300 mx-auto mb-3" />
              <p className="text-charcoal-500">No amendment chain found for #{currentId}</p>
            </div>
          )}

          {!loading && !error && chain.length > 0 && (
            <div className="bg-white rounded-xl border border-charcoal-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-serif font-semibold text-charcoal-900">Ripple Effect Chain</h3>
                <div className="flex items-center gap-3 text-xs text-charcoal-500">
                  <span>{chain.length} node{chain.length !== 1 ? 's' : ''}</span>
                  <span>Max depth: {maxDepth}</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {chain.map((node, idx) => {
                    const depth = node.depth ?? 0;
                    const isRoot = depth === 0;
                    return (
                      <motion.div
                        key={`${node.id}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx, 20) * 0.04 }}
                        style={{ marginLeft: `${Math.min(depth, 8) * 24}px` }}
                        className="flex items-start gap-3 relative"
                      >
                        {depth > 0 && (
                          <div
                            className="absolute left-[-16px] top-5 h-px bg-charcoal-200"
                            style={{ width: 16 }}
                            aria-hidden
                          />
                        )}
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                            isRoot ? 'bg-rose-100' : 'bg-charcoal-100',
                          )}
                        >
                          <GitMerge
                            className={cn('w-5 h-5', isRoot ? 'text-rose-600' : 'text-charcoal-500')}
                          />
                        </div>
                        <div
                          className={cn(
                            'flex-1 border rounded-xl p-4',
                            isRoot ? 'bg-rose-50 border-rose-200' : 'bg-white border-charcoal-100',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={cn(
                                    'font-semibold truncate',
                                    isRoot ? 'text-rose-800' : 'text-charcoal-900',
                                  )}
                                >
                                  {node.amendment_act_name ?? `Amendment #${node.id}`}
                                  {node.amendment_year && ` (${node.amendment_year})`}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-charcoal-100 text-charcoal-600 shrink-0">
                                  depth {depth}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-500">
                                <span className="font-mono">#{node.id}</span>
                                {node.act_id && (
                                  <button
                                    onClick={() => router.push(`/dashboard/acts/${node.act_id}`)}
                                    className="font-mono text-gold-600 hover:text-gold-700 truncate max-w-[200px]"
                                  >
                                    act:{node.act_id}
                                  </button>
                                )}
                                {node.amendment_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(node.amendment_date)}
                                  </span>
                                )}
                                {node.amendment_type && (
                                  <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
                                    {node.amendment_type}
                                  </span>
                                )}
                                {node.status && (
                                  <span className={cn('px-1.5 py-0.5 rounded', statusColor(node.status))}>
                                    {node.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
