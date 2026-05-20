'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search, Loader2, ChevronLeft, ChevronRight,
  SlidersHorizontal, X, ArrowUpDown, ChevronDown, BookOpen,
} from 'lucide-react';
import { LexramV2, type ActV2, type FilterValuesV2, type SuggestItemV2 } from '@/lib/lexram/api';

/* ── Domain badge colours ───────────────────────────────────── */
const DOMAIN_COLORS: Record<string, string> = {
  'Family Law':       'bg-amber-100 text-amber-800 border-amber-200',
  'Criminal Law':     'bg-red-100 text-red-800 border-red-200',
  'Labour Law':       'bg-blue-100 text-blue-800 border-blue-200',
  'Civil Law':        'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Banking Law':      'bg-violet-100 text-violet-800 border-violet-200',
  'Constitutional Law':'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Corporate Law':    'bg-slate-100 text-slate-800 border-slate-200',
  'Environmental Law':'bg-green-100 text-green-800 border-green-200',
  'Tax Law':          'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Commercial Law':   'bg-orange-100 text-orange-800 border-orange-200',
  'Property Law':     'bg-teal-100 text-teal-800 border-teal-200',
  'IP Law':           'bg-cyan-100 text-cyan-800 border-cyan-200',
};
function domainClass(d?: string | null) {
  return d ? (DOMAIN_COLORS[d] ?? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20') : '';
}

/* ── Helpers ────────────────────────────────────────────────── */
function actTitle(a: ActV2) { return a.name ?? a.title ?? a.short_title ?? a.id; }
function actSub(a: ActV2) {
  const sub = a.short_title ?? a.title;
  return sub && sub !== actTitle(a) ? sub : null;
}

const SORT_OPTIONS = [
  { value: 'year',    label: 'Year', order: 'desc' as const },
  { value: 'name',    label: 'Name A→Z', order: 'asc' as const },
  { value: 'name',    label: 'Name Z→A', order: 'desc' as const },
  { value: 'ministry',label: 'Ministry', order: 'asc' as const },
];

export default function ActsPage() {
  /* ── State ────────────────────────────────────────────────── */
  const [acts,        setActs]        = useState<ActV2[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const [q,           setQ]           = useState('');
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [sortIdx,     setSortIdx]     = useState(0);

  /* Filters */
  const [filters,     setFilters]     = useState<FilterValuesV2 | null>(null);
  const [fDomain,     setFDomain]     = useState('');
  const [fMinistry,   setFMinistry]   = useState('');
  const [fYear,       setFYear]       = useState('');
  const [fType,       setFType]       = useState('');
  const [fCategory,   setFCategory]   = useState('');
  const [fJurisdiction,setFJurisdiction] = useState('');
  const [fStatus,     setFStatus]     = useState('');

  /* Autocomplete */
  const [suggestions, setSuggestions] = useState<SuggestItemV2[]>([]);
  const [showSug,     setShowSug]     = useState(false);
  const sugRef        = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const sugTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilters = [fDomain, fMinistry, fYear, fType, fCategory, fJurisdiction, fStatus].filter(Boolean).length;
  const sort = SORT_OPTIONS[sortIdx] ?? SORT_OPTIONS[0];

  /* ── Load filter values once ──────────────────────────────── */
  useEffect(() => {
    LexramV2.filters().then(setFilters).catch(() => null);
  }, []);

  /* ── Main data fetch ──────────────────────────────────────── */
  const fetch = useCallback(async (pg: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await LexramV2.acts({
        page: pg,
        limit: 50,
        sort_by: sort.value,
        order: sort.order,
        q: q || undefined,
        domain: fDomain || undefined,
        ministry: fMinistry || undefined,
        year: fYear ? Number(fYear) : undefined,
        act_type: fType || undefined,
        category: fCategory || undefined,
        jurisdiction: fJurisdiction || undefined,
        status: fStatus || undefined,
      });
      setActs(res.data ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.total_pages ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load acts');
    } finally {
      setLoading(false);
    }
  }, [q, fDomain, fMinistry, fYear, fType, fCategory, fJurisdiction, fStatus, sort.value, sort.order]);

  /* Debounced search trigger */
  const triggerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (triggerRef.current) clearTimeout(triggerRef.current);
    triggerRef.current = setTimeout(() => {
      setPage(1);
      fetch(1);
    }, q ? 350 : 0);
    return () => { if (triggerRef.current) clearTimeout(triggerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, fDomain, fMinistry, fYear, fType, fCategory, fJurisdiction, fStatus, sortIdx]);

  useEffect(() => { fetch(page); }, [page]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Autocomplete ─────────────────────────────────────────── */
  const onQueryChange = (val: string) => {
    setQ(val);
    if (sugTimer.current) clearTimeout(sugTimer.current);
    if (val.length < 2) { setSuggestions([]); setShowSug(false); return; }
    sugTimer.current = setTimeout(async () => {
      try {
        const res = await LexramV2.suggest(val);
        setSuggestions(res ?? []);
        setShowSug(true);
      } catch { /* ignore */ }
    }, 200);
  };

  const pickSuggestion = (s: SuggestItemV2) => {
    setQ(s.title ?? s.short_title ?? s.id);
    setSuggestions([]);
    setShowSug(false);
    inputRef.current?.blur();
  };

  /* Close suggestions on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sugRef.current && !sugRef.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clearAll = () => {
    setQ(''); setFDomain(''); setFMinistry(''); setFYear('');
    setFType(''); setFCategory(''); setFJurisdiction(''); setFStatus('');
  };

  /* ── Pagination helpers ───────────────────────────────────── */
  const goPage = (pg: number) => {
    if (pg < 1 || pg > totalPages) return;
    setPage(pg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNums = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">

          {/* ── Header ────────────────────────────────────── */}
          <section className="mb-6">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--text-muted)] mb-1">
              Legislation Database
            </p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)] mb-1">
                  Acts &amp; Statutes
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {total > 0 ? `${total.toLocaleString()} Indian acts` : 'Indian acts, statutes & central legislation'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortIdx}
                    onChange={(e) => setSortIdx(Number(e.target.value))}
                    className="appearance-none text-[12px] font-medium pl-3 pr-8 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] transition-all"
                  >
                    {SORT_OPTIONS.map((s, i) => (
                      <option key={i} value={i}>{s.label}</option>
                    ))}
                  </select>
                  <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none"/>
                </div>
                {/* Filter toggle */}
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all
                    ${filterOpen || activeFilters > 0
                      ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40'
                    }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5"/>
                  Filters
                  {activeFilters > 0 && (
                    <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--accent)] text-[var(--accent-text)] text-[9px] font-bold">
                      {activeFilters}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* ── Search bar ────────────────────────────────── */}
          <div className="mb-4" ref={sugRef}>
            <div className={`relative flex items-center border rounded-xl px-4 py-2.5 gap-3 bg-[var(--bg-surface)] transition-all ${showSug ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/10' : 'border-[var(--border-default)] hover:border-[var(--accent)]/40'}`}>
              <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0"/>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSug(true)}
                placeholder="Search 11,000+ acts by name, keyword, or CNR..."
                className="flex-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none bg-transparent"
              />
              {q && (
                <button onClick={() => { setQ(''); setSuggestions([]); setShowSug(false); }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              )}
            </div>

            {/* Typeahead dropdown */}
            {showSug && suggestions.length > 0 && (
              <div className="absolute z-30 mt-1 w-full max-w-3xl rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] overflow-hidden">
                <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                  {suggestions.map((s) => (
                    <button key={s.id} type="button"
                      onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-colors">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                          {s.title ?? s.short_title ?? s.id}
                        </p>
                        {s.short_title && s.short_title !== s.title && (
                          <p className="text-[11px] text-[var(--text-muted)] truncate">{s.short_title}</p>
                        )}
                      </div>
                      {s.year && <span className="text-[11px] text-[var(--text-muted)] font-mono flex-shrink-0">{s.year}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Filter panel ──────────────────────────────── */}
          {filterOpen && filters && (
            <div className="mb-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <FilterSelect label="Domain"       value={fDomain}      onChange={setFDomain}      options={filters.domains}/>
                <FilterSelect label="Ministry"     value={fMinistry}    onChange={setFMinistry}    options={filters.ministries}/>
                <FilterSelect label="Year"         value={fYear}        onChange={setFYear}        options={filters.years.map(String)} numeric/>
                <FilterSelect label="Act type"     value={fType}        onChange={setFType}        options={filters.act_types}/>
                <FilterSelect label="Category"     value={fCategory}    onChange={setFCategory}    options={filters.categories}/>
                <FilterSelect label="Jurisdiction" value={fJurisdiction} onChange={setFJurisdiction} options={filters.jurisdictions}/>
                <FilterSelect label="Status"       value={fStatus}      onChange={setFStatus}      options={filters.statuses}/>
              </div>
              {activeFilters > 0 && (
                <button onClick={clearAll}
                  className="mt-3 text-[11px] text-[var(--text-muted)] hover:text-red-600 inline-flex items-center gap-1 transition-colors">
                  <X className="w-3 h-3"/> Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {activeFilters > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[
                { val: fDomain, label: 'Domain', clear: () => setFDomain('') },
                { val: fMinistry, label: 'Ministry', clear: () => setFMinistry('') },
                { val: fYear, label: 'Year', clear: () => setFYear('') },
                { val: fType, label: 'Type', clear: () => setFType('') },
                { val: fCategory, label: 'Category', clear: () => setFCategory('') },
                { val: fJurisdiction, label: 'Jurisdiction', clear: () => setFJurisdiction('') },
                { val: fStatus, label: 'Status', clear: () => setFStatus('') },
              ].filter(f => f.val).map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                  <span className="opacity-60">{f.label}:</span> {f.val}
                  <button type="button" onClick={f.clear} className="hover:bg-[var(--accent)]/20 rounded-full p-0.5 transition-colors">
                    <X className="w-2.5 h-2.5"/>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* ── Error ─────────────────────────────────────── */}
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm text-rose-700">{error}</p>
              <button onClick={() => fetch(page)} className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg">
                Retry
              </button>
            </div>
          )}

          {/* ── Results ───────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]"/>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] text-[var(--text-muted)]">
                  {total.toLocaleString()} acts
                  {page > 1 ? ` · page ${page} of ${totalPages}` : ''}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-default)] overflow-hidden bg-[var(--bg-surface)]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--bg-primary)]/60 border-b border-[var(--border-default)]">
                      <Th>Act Name</Th>
                      <Th w="w-20">Year</Th>
                      <Th w="w-40">Domain</Th>
                      <Th w="hidden lg:table-cell w-44">Ministry</Th>
                      <Th w="hidden sm:table-cell w-28">Type</Th>
                      <Th w="w-24">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {acts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center text-[var(--text-muted)] text-sm">
                          No acts match the current filters.
                        </td>
                      </tr>
                    ) : acts.map((act) => (
                      <tr key={act.id} className="border-b border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-colors group">
                        <td className="px-5 py-3.5">
                          <Link href={`/dashboard/acts/${act.id}`} className="block">
                            <div className="font-medium text-[var(--text-primary)] text-sm group-hover:text-[var(--accent)] transition-colors">
                              {actTitle(act)}
                            </div>
                            {actSub(act) && (
                              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1 max-w-lg">
                                {actSub(act)}
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)] font-mono">{act.year ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          {act.domain && (
                            <button type="button" onClick={() => { setFDomain(act.domain!); setFilterOpen(true); }}
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium border transition-colors hover:opacity-80 ${domainClass(act.domain)}`}>
                              {act.domain}
                            </button>
                          )}
                        </td>
                        <td className="hidden lg:table-cell px-5 py-3.5 text-[12px] text-[var(--text-secondary)] line-clamp-1 max-w-[180px]">
                          {act.ministry ?? '—'}
                        </td>
                        <td className="hidden sm:table-cell px-5 py-3.5">
                          {act.act_type && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-muted)] font-medium uppercase tracking-wide">
                              {act.act_type}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              act.status?.toLowerCase().includes('repeal') ? 'bg-red-400' : 'bg-emerald-500'
                            }`}/>
                            <span className="text-[11px] text-[var(--text-muted)] capitalize">
                              {act.status ?? 'Active'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-1.5">
                  <PgButton onClick={() => goPage(page - 1)} disabled={page === 1} aria-label="Previous">
                    <ChevronLeft className="w-4 h-4"/>
                  </PgButton>
                  {pageNums().map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-[var(--text-muted)]">…</span>
                    ) : (
                      <PgButton key={p} onClick={() => goPage(p as number)} active={p === page}>
                        {p}
                      </PgButton>
                    )
                  )}
                  <PgButton onClick={() => goPage(page + 1)} disabled={page === totalPages} aria-label="Next">
                    <ChevronRight className="w-4 h-4"/>
                  </PgButton>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function Th({ children, w }: { children?: React.ReactNode; w?: string }) {
  return (
    <th className={`text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] px-5 py-2.5 ${w ?? ''}`}>
      {children}
    </th>
  );
}

function FilterSelect({
  label, value, onChange, options, numeric,
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; numeric?: boolean }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] block mb-1">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none text-[12px] pl-3 pr-7 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
        >
          <option value="">All</option>
          {(numeric ? [...options].sort((a, b) => Number(b) - Number(a)) : options).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none"/>
      </div>
    </label>
  );
}

function PgButton({ children, onClick, disabled, active, 'aria-label': al }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean; 'aria-label'?: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={al}
      className={`min-w-[32px] h-8 px-1 rounded-lg text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed
        ${active
          ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-sm'
          : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]'
        }`}>
      {children}
    </button>
  );
}
