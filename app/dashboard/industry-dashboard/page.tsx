'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Search,
  ChevronDown,
  Building2,
  LayoutGrid,
  List,
  Loader2,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { LexramAPI, type Industry } from '@/lib/lexram/api';

const DEFAULT_COLOR = '#94A3B8';

export default function IndustryDashboardPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<(Industry & { children?: Industry[] }) | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'entities' | 'name'>('entities');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await LexramAPI.industries();
        if (cancelled) return;
        setIndustries(Array.isArray(data) ? data : []);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message || 'Failed to load industries');
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
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const data = await LexramAPI.industry(selectedCode);
        if (cancelled) return;
        setDetail(data);
      } catch (e) {
        if (cancelled) return;
        setDetailError((e as Error).message || 'Failed to load industry');
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCode]);

  const topIndustries = useMemo(
    () => industries.filter((i) => i.level === 1),
    [industries],
  );

  const filteredIndustries = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    const result = topIndustries.filter(
      (i) =>
        i.name.toLowerCase().includes(lower) ||
        i.code.toLowerCase().includes(lower),
    );
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'entities') cmp = (a.entity_count ?? 0) - (b.entity_count ?? 0);
      else cmp = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [topIndustries, searchTerm, sortBy, sortOrder]);

  // Detail view
  if (selectedCode) {
    return (
      <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <button
              onClick={() => setSelectedCode(null)}
              className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Industries
            </button>

            {detailLoading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
              </div>
            )}

            {detailError && !detailLoading && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <p className="text-rose-700">{detailError}</p>
              </div>
            )}

            {!detailLoading && !detailError && detail && (
              <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: detail.color ?? DEFAULT_COLOR }}
                    >
                      {detail.icon && detail.icon.length <= 2 ? (
                        <span>{detail.icon}</span>
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-serif font-bold text-charcoal-900">{detail.name}</h1>
                      <p className="text-charcoal-500 text-sm font-mono">{detail.code}</p>
                    </div>
                  </div>

                  {detail.description && (
                    <p className="text-sm text-charcoal-600 mb-4 max-w-3xl">{detail.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-charcoal-100 p-4 shadow-sm">
                      <div className="text-xs text-charcoal-500 uppercase tracking-wide mb-1">Entities</div>
                      <div className="text-2xl font-bold text-charcoal-900 font-mono">
                        {(detail.entity_count ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-charcoal-100 p-4 shadow-sm">
                      <div className="text-xs text-charcoal-500 uppercase tracking-wide mb-1">Level</div>
                      <div className="text-2xl font-bold text-charcoal-900 font-mono">{detail.level}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-charcoal-100 p-4 shadow-sm">
                      <div className="text-xs text-charcoal-500 uppercase tracking-wide mb-1">Sub-industries</div>
                      <div className="text-2xl font-bold text-charcoal-900 font-mono">
                        {detail.children?.length ?? 0}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="bg-white rounded-xl border border-charcoal-100 p-6 shadow-sm">
                  <h2 className="text-lg font-serif font-semibold text-charcoal-900 mb-4">Sub-Industries</h2>
                  {detail.children && detail.children.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {detail.children.map((child) => (
                        <button
                          key={child.code}
                          onClick={() => setSelectedCode(child.code)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-charcoal-100 hover:border-charcoal-200 hover:shadow-sm transition-all text-left"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shrink-0"
                            style={{ backgroundColor: child.color ?? DEFAULT_COLOR }}
                          >
                            {child.icon && child.icon.length <= 2 ? (
                              <span>{child.icon}</span>
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-charcoal-900 truncate">{child.name}</div>
                            <div className="text-xs text-charcoal-500 font-mono">
                              {child.code} · {(child.entity_count ?? 0).toLocaleString()} entities
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-charcoal-500 text-sm">No sub-industries available</p>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-1">Industry Intelligence</h1>
            <p className="text-charcoal-500">
              Browse {topIndustries.length} top-level industries with regulatory data
            </p>
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
              <div className="bg-white rounded-xl border border-charcoal-100 p-4 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search industries by name or code..."
                      className="w-full pl-9 pr-4 py-2 bg-charcoal-50 border border-charcoal-200 rounded-lg text-sm focus:outline-none focus:border-gold-500 transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'entities' | 'name')}
                      className="px-3 py-2 bg-charcoal-50 border border-charcoal-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                    >
                      <option value="entities">Sort by Entities</option>
                      <option value="name">Sort by Name</option>
                    </select>
                    <button
                      onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                      className="p-2 border border-charcoal-200 rounded-lg hover:bg-charcoal-50 transition-colors"
                      title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      <ChevronDown
                        className={cn('w-4 h-4 transition-transform', sortOrder === 'asc' && 'rotate-180')}
                      />
                    </button>
                    <div className="flex border border-charcoal-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          'p-2 transition-colors',
                          viewMode === 'grid' ? 'bg-gold-50 text-gold-600' : 'hover:bg-charcoal-50',
                        )}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                          'p-2 transition-colors',
                          viewMode === 'list' ? 'bg-gold-50 text-gold-600' : 'hover:bg-charcoal-50',
                        )}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                      : 'space-y-2'
                  }
                >
                  {filteredIndustries.map((industry) => (
                    <motion.button
                      key={industry.code}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedCode(industry.code)}
                      className={cn(
                        'bg-white rounded-xl border border-charcoal-100 p-5 shadow-sm hover:shadow-md hover:border-charcoal-200 transition-all text-left group',
                        viewMode === 'list' && 'flex items-center gap-4 p-4',
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-xl flex items-center justify-center text-white group-hover:scale-105 transition-transform shrink-0',
                          viewMode === 'grid' ? 'w-12 h-12 mb-3' : 'w-10 h-10',
                        )}
                        style={{ backgroundColor: industry.color ?? DEFAULT_COLOR }}
                      >
                        {industry.icon && industry.icon.length <= 2 ? (
                          <span>{industry.icon}</span>
                        ) : (
                          <Building2 className="w-6 h-6" />
                        )}
                      </div>
                      {viewMode === 'list' && (
                        <>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-charcoal-900 group-hover:text-gold-700 transition-colors text-sm">
                              {industry.name}
                            </h3>
                            <p className="text-xs text-charcoal-400 font-mono">{industry.code}</p>
                          </div>
                          <span className="font-mono text-xs text-charcoal-600">
                            {(industry.entity_count ?? 0).toLocaleString()} entities
                          </span>
                        </>
                      )}
                      {viewMode === 'grid' && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-charcoal-900 group-hover:text-gold-700 transition-colors text-base">
                            {industry.name}
                          </h3>
                          <p className="text-xs text-charcoal-400 font-mono">{industry.code}</p>
                          {industry.description && (
                            <p className="text-xs text-charcoal-500 line-clamp-2">{industry.description}</p>
                          )}
                          <div className="pt-2 border-t border-charcoal-50">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-charcoal-500">Entities</span>
                              <span className="font-mono font-semibold text-charcoal-900">
                                {(industry.entity_count ?? 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              </AnimatePresence>

              {filteredIndustries.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-charcoal-300 mx-auto mb-3" />
                  <p className="text-charcoal-500">
                    {searchTerm ? `No industries matching "${searchTerm}"` : 'No industries available'}
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
