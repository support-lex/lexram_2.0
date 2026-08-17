'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, TrendingUp, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

type Relevance = 'high' | 'medium' | 'low';

interface IndustryImpact {
  code: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  relevance: number; // backend returns 0-1
  is_primary: boolean;
  tag_source: string;
}

const RELEVANCE_COLORS: Record<Relevance, string> = {
  high: '#d97706',
  medium: '#7c3aed',
  low: '#0284c7',
};

// Thresholds on the 0-100 displayed scale.
const RELEVANCE_THRESHOLDS = { high: 80, medium: 50 };

function getRelevanceLevel(pct: number): Relevance {
  if (pct >= RELEVANCE_THRESHOLDS.high) return 'high';
  if (pct >= RELEVANCE_THRESHOLDS.medium) return 'medium';
  return 'low';
}

function getRelevanceColor(pct: number): string {
  return RELEVANCE_COLORS[getRelevanceLevel(pct)];
}

export default function MatrixPage() {
  const [entityType, setEntityType] = useState<'circular' | 'amendment'>('circular');
  const [entityInput, setEntityInput] = useState('1');
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'circular' | 'amendment'; id: number } | null>({
    type: 'circular',
    id: 1,
  });
  const [industries, setIndustries] = useState<IndustryImpact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedEntity) return;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(
          `/api/lexram/industries/${selectedEntity.type}/${selectedEntity.id}/impact`,
          { signal: controller.signal }
        );
        if (!r.ok) {
          if (r.status === 404) {
            setIndustries([]);
            setError(`No impact data found for ${selectedEntity.type} #${selectedEntity.id}`);
          } else {
            throw new Error(`Request failed: ${r.status}`);
          }
          return;
        }
        const data = (await r.json()) as IndustryImpact[];
        setIndustries(Array.isArray(data) ? data : []);
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return;
        setError('Failed to load impact data. Please try again.');
        setIndustries([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [selectedEntity]);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(entityInput, 10);
    if (!Number.isNaN(id)) setSelectedEntity({ type: entityType, id });
  }

  // Backend returns 0-1; convert to 0-100 once for display.
  const display = industries.map((ind) => {
    const pct = Math.round(ind.relevance * 100);
    return { ...ind, pct };
  });

  const chartData = display.map((ind) => ({
    name: ind.name.length > 24 ? ind.name.substring(0, 24) + '…' : ind.name,
    fullName: ind.name,
    relevance: ind.pct,
    isPrimary: ind.is_primary,
  }));

  const highRelevance = display.filter((i) => getRelevanceLevel(i.pct) === 'high');
  const mediumRelevance = display.filter((i) => getRelevanceLevel(i.pct) === 'medium');
  const lowRelevance = display.filter((i) => getRelevanceLevel(i.pct) === 'low');

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)' }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
                  Compliance Impact Matrix
                </h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  See which industries are affected by regulatory changes
                </p>
              </div>
            </div>
          </div>

          {/* Entity Lookup */}
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-6 shadow-sm mb-6">
            <h2 className="text-lg font-serif font-semibold text-[var(--text-primary)] mb-4">
              Find Impact Analysis
            </h2>
            <form onSubmit={handleLookup} className="flex flex-wrap gap-3">
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as 'circular' | 'amendment')}
                className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="circular">Circular</option>
                <option value="amendment">Amendment</option>
              </select>
              <input
                type="number"
                value={entityInput}
                onChange={(e) => setEntityInput(e.target.value)}
                placeholder="Enter ID..."
                className="w-48 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text, #fff)',
                }}
              >
                Look Up
              </button>
            </form>
            {selectedEntity && (
              <p className="mt-3 text-xs text-[var(--text-secondary)]">
                Showing impact for <span className="font-mono">{selectedEntity.type} #{selectedEntity.id}</span>
              </p>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}

          {error && !loading && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}

          {!loading && !error && industries.length > 0 && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
                      Total Industries
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
                    {industries.length}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                      High Impact
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono">
                    {highRelevance.length}
                  </div>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-900/50 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-xs text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                      Medium Impact
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-violet-700 dark:text-violet-300 font-mono">
                    {mediumRelevance.length}
                  </div>
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-900/50 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs text-sky-700 dark:text-sky-300 uppercase tracking-wide">
                      Low Impact
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-sky-700 dark:text-sky-300 font-mono">
                    {lowRelevance.length}
                  </div>
                </div>
              </div>

              {/* Impact Bar Chart */}
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-6 shadow-sm mb-6">
                <h2 className="text-lg font-serif font-semibold text-[var(--text-primary)] mb-4">
                  Impact by Industry
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                      <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} domain={[0, 100]} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={200}
                        stroke="var(--text-secondary)"
                        fontSize={11}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                        }}
                        formatter={(value, _name, props) => [
                          `${value}% relevance`,
                          (props?.payload as { fullName?: string } | undefined)?.fullName ?? '',
                        ]}
                      />
                      <Bar dataKey="relevance" name="Relevance" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getRelevanceColor(entry.relevance)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Industry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {display.map((ind, idx) => {
                  const level = getRelevanceLevel(ind.pct);
                  return (
                    <motion.div
                      key={`${ind.code}-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        'rounded-xl border p-4 shadow-sm',
                        level === 'high' && 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50',
                        level === 'medium' && 'border-violet-300 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-900/50',
                        level === 'low' && 'border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-900/50'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-[var(--text-primary)]">{ind.name}</h3>
                          <p className="text-xs text-[var(--text-secondary)] font-mono">{ind.code}</p>
                        </div>
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs font-mono font-semibold',
                            level === 'high' && 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
                            level === 'medium' && 'bg-violet-200 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
                            level === 'low' && 'bg-sky-200 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200'
                          )}
                        >
                          {ind.pct}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {ind.is_primary && (
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                              color: 'var(--accent)',
                            }}
                          >
                            Primary
                          </span>
                        )}
                        <span className="text-[var(--text-secondary)]">Source: {ind.tag_source}</span>
                      </div>

                      <div className="mt-3">
                        <div className="h-2 bg-[var(--border-default)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${ind.pct}%`,
                              backgroundColor: getRelevanceColor(ind.pct),
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {!loading && !error && selectedEntity && industries.length === 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-12 text-center">
              <Building2 className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
              <p className="text-[var(--text-secondary)]">
                No impact data available for {selectedEntity.type} #{selectedEntity.id}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
