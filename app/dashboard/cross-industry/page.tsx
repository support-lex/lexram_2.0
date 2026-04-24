'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  GitBranch,
  Building2,
  Link2,
  Loader2,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { LexramAPI, type IndustryRelation } from '@/lib/lexram/api';

const TOP_N = 25;

function strengthColor(shared: number, max: number): string {
  const ratio = max > 0 ? shared / max : 0;
  if (ratio >= 0.66) return '#d97706';
  if (ratio >= 0.33) return '#7c3aed';
  return '#0284c7';
}

export default function CrossIndustryPage() {
  const router = useRouter();
  const [all, setAll] = useState<IndustryRelation[]>([]);
  const [filtered, setFiltered] = useState<IndustryRelation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedCode, setSelectedCode] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await LexramAPI.industryRelations();
        if (cancelled) return;
        setAll(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message || 'Failed to load relations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedCode) {
      setFiltered(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setFilterLoading(true);
      try {
        const rows = await LexramAPI.industryRelationsFor(selectedCode);
        if (cancelled) return;
        setFiltered(Array.isArray(rows) ? rows : []);
      } catch {
        if (cancelled) return;
        setFiltered([]);
      } finally {
        if (!cancelled) setFilterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCode]);

  const industryOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of all) {
      if (!map.has(row.source_code)) map.set(row.source_code, row.source_name);
      if (!map.has(row.target_code)) map.set(row.target_code, row.target_name);
    }
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  const rows = filtered ?? all;
  const sorted = useMemo(() => {
    return [...rows]
      .sort((a, b) => (b.shared_entities ?? 0) - (a.shared_entities ?? 0))
      .slice(0, TOP_N);
  }, [rows]);

  const maxShared = sorted[0]?.shared_entities ?? 0;

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/industry-dashboard')}
              className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-charcoal-900">Cross-Industry Map</h1>
                <p className="text-charcoal-500 text-sm">
                  Relationships measured by shared regulated entities
                </p>
              </div>
            </div>
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
                onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="bg-white rounded-xl border border-charcoal-100 p-4 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-sm font-medium text-charcoal-700">Filter by industry</label>
                <select
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-charcoal-50 border border-charcoal-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                >
                  <option value="">All industries</option>
                  {industryOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.name} ({opt.code})
                    </option>
                  ))}
                </select>
                {selectedCode && (
                  <button
                    onClick={() => setSelectedCode('')}
                    className="px-3 py-2 text-xs font-medium text-charcoal-600 hover:text-charcoal-900"
                  >
                    Clear
                  </button>
                )}
              </div>

              {filterLoading && (
                <div className="flex items-center gap-2 text-sm text-charcoal-500 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading relations for {selectedCode}...
                </div>
              )}

              {sorted.length === 0 ? (
                <div className="bg-white rounded-xl border border-charcoal-100 p-12 text-center">
                  <Building2 className="w-12 h-12 text-charcoal-300 mx-auto mb-3" />
                  <p className="text-charcoal-500">No industry relations found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sorted.map((rel, idx) => {
                    const color = strengthColor(rel.shared_entities, maxShared);
                    return (
                      <motion.div
                        key={`${rel.source_code}-${rel.target_code}-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx, 10) * 0.03 }}
                        className="bg-white rounded-xl border border-charcoal-100 p-4 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: color }}
                            >
                              <Link2 className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-mono text-charcoal-400">#{idx + 1}</span>
                          </div>
                          <div
                            className="px-2 py-1 rounded text-xs font-mono font-semibold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {rel.shared_entities.toLocaleString()}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div>
                            <p className="text-xs text-charcoal-400 font-mono">{rel.source_code}</p>
                            <p className="text-sm font-semibold text-charcoal-900 truncate">{rel.source_name}</p>
                          </div>
                          <div className="flex items-center justify-center text-charcoal-300">
                            <GitBranch className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-charcoal-400 font-mono">{rel.target_code}</p>
                            <p className="text-sm font-semibold text-charcoal-900 truncate">{rel.target_name}</p>
                          </div>
                        </div>

                        <div className="h-1.5 bg-charcoal-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${maxShared > 0 ? (rel.shared_entities / maxShared) * 100 : 0}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <p className="text-xs text-charcoal-500 mt-2">
                          {rel.shared_entities.toLocaleString()} shared entities
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
