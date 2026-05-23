'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  ChevronDown,
  FileText,
  Globe2,
  Building2,
  Database,
  ScrollText,
  BadgeCheck,
} from 'lucide-react';
import {
  ActsAPI,
  type ActSummary,
  type ActStats,
  type NamedCount,
  type ActsListParams,
  bucketName,
} from '@/lib/lexram/acts-fastapi';

/* ── Domain badge colours ────────────────────────────────────────────── */
const DOMAIN_COLORS: Record<string, string> = {
  'Family Law': 'bg-amber-100 text-amber-800 border-amber-200',
  'Criminal Law': 'bg-red-100 text-red-800 border-red-200',
  'Labour Law': 'bg-blue-100 text-blue-800 border-blue-200',
  'Civil Law': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Banking Law': 'bg-violet-100 text-violet-800 border-violet-200',
  'Constitutional Law': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Corporate Law': 'bg-slate-100 text-slate-800 border-slate-200',
  'Environmental Law': 'bg-green-100 text-green-800 border-green-200',
  'Tax Law': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Commercial Law': 'bg-orange-100 text-orange-800 border-orange-200',
  'Property Law': 'bg-teal-100 text-teal-800 border-teal-200',
  'IP Law': 'bg-cyan-100 text-cyan-800 border-cyan-200',
};
function domainClass(d?: string | null) {
  return d
    ? DOMAIN_COLORS[d] ??
        'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20'
    : '';
}

function actTitle(a: ActSummary) {
  return a.name ?? a.short_name ?? a.id;
}
function actSub(a: ActSummary) {
  const sub = a.short_name ?? a.description ?? '';
  return sub && sub !== actTitle(a) ? sub : null;
}

type SortOption = {
  value: NonNullable<ActsListParams['sort_by']>;
  order: NonNullable<ActsListParams['sort_order']>;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { value: 'name', order: 'asc', label: 'Name A→Z' },
  { value: 'name', order: 'desc', label: 'Name Z→A' },
  { value: 'year', order: 'desc', label: 'Year (newest)' },
  { value: 'year', order: 'asc', label: 'Year (oldest)' },
  { value: 'ministry', order: 'asc', label: 'Ministry' },
  { value: 'domain', order: 'asc', label: 'Domain' },
  { value: 'commencement_date', order: 'desc', label: 'Recently commenced' },
];

const JURISDICTION_KIND_OPTIONS = [
  { value: '', label: 'All jurisdictions' },
  { value: 'central', label: 'Central' },
  { value: 'state', label: 'State' },
  { value: 'ut', label: 'Union Territory' },
];

const ENFORCEMENT_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'in_force', label: 'In force' },
  { value: 'repealed', label: 'Repealed' },
  { value: 'unknown', label: 'Unknown' },
];

export default function ActsPage() {
  /* ── Result state ─────────────────────────────────────────────────── */
  const [acts, setActs] = useState<ActSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Stats banner ─────────────────────────────────────────────────── */
  const [stats, setStats] = useState<ActStats | null>(null);

  /* ── Filter values (dropdown sources) ─────────────────────────────── */
  const [domains, setDomains] = useState<NamedCount[]>([]);
  const [ministries, setMinistries] = useState<NamedCount[]>([]);
  const [categories, setCategories] = useState<NamedCount[]>([]);
  const [departments, setDepartments] = useState<NamedCount[]>([]);

  /* ── Inputs ───────────────────────────────────────────────────────── */
  const [q, setQ] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortIdx, setSortIdx] = useState(0);

  const [fDomain, setFDomain] = useState('');
  const [fMinistry, setFMinistry] = useState('');
  const [fDepartment, setFDepartment] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fJurisdictionKind, setFJurisdictionKind] = useState('');
  const [fYearFrom, setFYearFrom] = useState('');
  const [fYearTo, setFYearTo] = useState('');
  const [fActType, setFActType] = useState('');
  const [fEnforcement, setFEnforcement] = useState('');
  const [fHasPdf, setFHasPdf] = useState<'' | 'true' | 'false'>('');

  const activeFilters = [
    fDomain,
    fMinistry,
    fDepartment,
    fCategory,
    fJurisdictionKind,
    fYearFrom,
    fYearTo,
    fActType,
    fEnforcement,
    fHasPdf,
  ].filter(Boolean).length;

  const sort = SORT_OPTIONS[sortIdx] ?? SORT_OPTIONS[0];

  /* ── Load stats + filter buckets once ─────────────────────────────── */
  useEffect(() => {
    ActsAPI.stats().then(setStats).catch(() => null);
    ActsAPI.domains('count').then(setDomains).catch(() => null);
    ActsAPI.ministries(100).then(setMinistries).catch(() => null);
    ActsAPI.categories('count').then(setCategories).catch(() => null);
    ActsAPI.departments(150, 'count').then(setDepartments).catch(() => null);
  }, []);

  /* ── Main data fetch ──────────────────────────────────────────────── */
  const fetchActs = useCallback(
    async (pg: number) => {
      setLoading(true);
      setError(null);
      try {
        const baseParams = {
          page: pg,
          limit: 50,
          domain: fDomain || undefined,
          ministry: fMinistry || undefined,
          department: fDepartment || undefined,
          category: fCategory || undefined,
          jurisdiction_kind: fJurisdictionKind || undefined,
          year_from: fYearFrom ? Number(fYearFrom) : undefined,
          year_to: fYearTo ? Number(fYearTo) : undefined,
          act_type: fActType || undefined,
          enforcement_status: fEnforcement || undefined,
          has_pdf:
            fHasPdf === '' ? undefined : fHasPdf === 'true',
        };
        const res = q.trim().length >= 2
          ? await ActsAPI.search({ q: q.trim(), ...baseParams })
          : await ActsAPI.acts({
              ...baseParams,
              sort_by: sort.value,
              sort_order: sort.order,
            });
        setActs(res.data ?? []);
        setTotal(res.total ?? 0);
        setTotalPages(res.pages ?? 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load acts');
      } finally {
        setLoading(false);
      }
    },
    [
      q,
      fDomain,
      fMinistry,
      fDepartment,
      fCategory,
      fJurisdictionKind,
      fYearFrom,
      fYearTo,
      fActType,
      fEnforcement,
      fHasPdf,
      sort.value,
      sort.order,
    ]
  );

  /* Debounced trigger when filters / query change → reset to page 1 */
  const triggerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (triggerRef.current) clearTimeout(triggerRef.current);
    triggerRef.current = setTimeout(
      () => {
        setPage(1);
        fetchActs(1);
      },
      q ? 350 : 0
    );
    return () => {
      if (triggerRef.current) clearTimeout(triggerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    q,
    fDomain,
    fMinistry,
    fDepartment,
    fCategory,
    fJurisdictionKind,
    fYearFrom,
    fYearTo,
    fActType,
    fEnforcement,
    fHasPdf,
    sortIdx,
  ]);

  /* Subsequent page changes */
  useEffect(() => {
    fetchActs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const clearAll = () => {
    setQ('');
    setFDomain('');
    setFMinistry('');
    setFDepartment('');
    setFCategory('');
    setFJurisdictionKind('');
    setFYearFrom('');
    setFYearTo('');
    setFActType('');
    setFEnforcement('');
    setFHasPdf('');
  };

  /* ── Pagination helpers ───────────────────────────────────────────── */
  const goPage = (pg: number) => {
    if (pg < 1 || pg > totalPages) return;
    setPage(pg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNums = (): (number | '...')[] => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const domainOptions = useMemo(
    () => domains.map(bucketName).filter(Boolean),
    [domains]
  );
  const ministryOptions = useMemo(
    () => ministries.map(bucketName).filter(Boolean),
    [ministries]
  );
  const categoryOptions = useMemo(
    () => categories.map(bucketName).filter(Boolean),
    [categories]
  );
  const departmentOptions = useMemo(
    () => departments.map(bucketName).filter(Boolean),
    [departments]
  );

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* ── Header ──────────────────────────────────────────────── */}
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
                  {total > 0
                    ? `${total.toLocaleString()} matching acts`
                    : 'Indian Central & State legislation'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortIdx}
                    onChange={(e) => setSortIdx(Number(e.target.value))}
                    className="appearance-none text-[12px] font-medium pl-3 pr-8 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] transition-all"
                  >
                    {SORT_OPTIONS.map((s, i) => (
                      <option key={`${s.value}-${s.order}-${i}`} value={i}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all ${
                    filterOpen || activeFilters > 0
                      ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
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

          {/* ── Stats banner ────────────────────────────────────────── */}
          {stats && (
            <section className="mb-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              <StatTile
                label="Total Acts"
                value={stats.total_acts}
                icon={Database}
                tone="indigo"
              />
              <StatTile
                label="Domains"
                value={stats.domains}
                icon={Globe2}
                tone="emerald"
              />
              <StatTile
                label="Ministries"
                value={stats.unique_ministries}
                icon={Building2}
                tone="amber"
              />
              <StatTile
                label="With PDF"
                value={stats.with_pdf}
                icon={FileText}
                tone="sky"
              />
              <StatTile
                label="Repealed"
                value={stats.repealed}
                icon={ScrollText}
                tone="rose"
              />
              <StatTile
                label="Synced"
                value={stats.synced}
                icon={BadgeCheck}
                tone="violet"
              />
            </section>
          )}

          {/* ── Search bar ──────────────────────────────────────────── */}
          <div className="mb-4">
            <div className="relative flex items-center border border-[var(--border-default)] rounded-xl px-4 py-2.5 gap-3 bg-[var(--bg-surface)] hover:border-[var(--accent)]/40 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10 transition-all">
              <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search 13,000+ acts by name, description, ministry, domain or keyword…"
                className="flex-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none bg-transparent"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Quick jurisdiction pills ────────────────────────────── */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {JURISDICTION_KIND_OPTIONS.map((j) => (
              <button
                key={j.value || 'all'}
                type="button"
                onClick={() => setFJurisdictionKind(j.value)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                  fJurisdictionKind === j.value
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--accent)]/40'
                }`}
              >
                {j.label}
              </button>
            ))}
            <span className="mx-2 text-[var(--text-muted)] text-xs">·</span>
            {ENFORCEMENT_OPTIONS.map((e) => (
              <button
                key={e.value || 'any'}
                type="button"
                onClick={() => setFEnforcement(e.value)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                  fEnforcement === e.value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-emerald-400'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>

          {/* ── Filter panel ────────────────────────────────────────── */}
          {filterOpen && (
            <div className="mb-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <FilterSelect
                  label="Domain"
                  value={fDomain}
                  onChange={setFDomain}
                  options={domainOptions}
                />
                <FilterSelect
                  label="Ministry"
                  value={fMinistry}
                  onChange={setFMinistry}
                  options={ministryOptions}
                />
                <FilterSelect
                  label="Department"
                  value={fDepartment}
                  onChange={setFDepartment}
                  options={departmentOptions}
                />
                <FilterSelect
                  label="Category"
                  value={fCategory}
                  onChange={setFCategory}
                  options={categoryOptions}
                />
                <FilterInput
                  label="Year from"
                  type="number"
                  value={fYearFrom}
                  onChange={setFYearFrom}
                  placeholder="1860"
                />
                <FilterInput
                  label="Year to"
                  type="number"
                  value={fYearTo}
                  onChange={setFYearTo}
                  placeholder="2026"
                />
                <FilterInput
                  label="Act type"
                  value={fActType}
                  onChange={setFActType}
                  placeholder="central / state…"
                />
                <FilterSelect
                  label="Has PDF"
                  value={fHasPdf}
                  onChange={(v) => setFHasPdf(v as '' | 'true' | 'false')}
                  options={['true', 'false']}
                  labelMap={{ true: 'With PDF', false: 'Without PDF' }}
                />
              </div>
              {activeFilters > 0 && (
                <button
                  onClick={clearAll}
                  className="mt-3 text-[11px] text-[var(--text-muted)] hover:text-red-600 inline-flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {activeFilters > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[
                { val: fDomain, label: 'Domain', clear: () => setFDomain('') },
                {
                  val: fMinistry,
                  label: 'Ministry',
                  clear: () => setFMinistry(''),
                },
                {
                  val: fDepartment,
                  label: 'Dept',
                  clear: () => setFDepartment(''),
                },
                {
                  val: fCategory,
                  label: 'Category',
                  clear: () => setFCategory(''),
                },
                {
                  val: fJurisdictionKind,
                  label: 'Jurisdiction',
                  clear: () => setFJurisdictionKind(''),
                },
                {
                  val: fYearFrom,
                  label: 'From',
                  clear: () => setFYearFrom(''),
                },
                { val: fYearTo, label: 'To', clear: () => setFYearTo('') },
                { val: fActType, label: 'Type', clear: () => setFActType('') },
                {
                  val: fEnforcement,
                  label: 'Status',
                  clear: () => setFEnforcement(''),
                },
                {
                  val: fHasPdf,
                  label: 'PDF',
                  clear: () => setFHasPdf(''),
                },
              ]
                .filter((f) => f.val)
                .map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                  >
                    <span className="opacity-60">{f.label}:</span> {f.val}
                    <button
                      type="button"
                      onClick={f.clear}
                      className="hover:bg-[var(--accent)]/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
            </div>
          )}

          {/* ── Error ───────────────────────────────────────────────── */}
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm text-rose-700">{error}</p>
              <button
                onClick={() => fetchActs(page)}
                className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Results ─────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] text-[var(--text-muted)]">
                  {total.toLocaleString()} acts
                  {page > 1 ? ` · page ${page} of ${totalPages}` : ''}
                  {q && (
                    <span className="ml-2 text-[var(--accent)]">
                      · search “{q}”
                    </span>
                  )}
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
                      <Th w="hidden sm:table-cell w-28">Jurisdiction</Th>
                      <Th w="w-28">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {acts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-14 text-center text-[var(--text-muted)] text-sm"
                        >
                          No acts match the current filters.
                        </td>
                      </tr>
                    ) : (
                      acts.map((act) => (
                        <tr
                          key={act.id}
                          className="border-b border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-colors group"
                        >
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/dashboard/acts/${encodeURIComponent(act.id)}`}
                              className="block"
                            >
                              <div className="font-medium text-[var(--text-primary)] text-sm group-hover:text-[var(--accent)] transition-colors">
                                {actTitle(act)}
                              </div>
                              {actSub(act) && (
                                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1 max-w-lg">
                                  {actSub(act)}
                                </div>
                              )}
                              <div className="mt-1 flex flex-wrap gap-1">
                                {act.act_number && (
                                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                                    Act No. {act.act_number}
                                  </span>
                                )}
                                {act.category && (
                                  <span className="text-[10px] text-[var(--text-muted)]">
                                    · {act.category}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)] font-mono">
                            {act.year ?? '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            {act.domain && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFDomain(act.domain!);
                                  setFilterOpen(true);
                                }}
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium border transition-colors hover:opacity-80 ${domainClass(
                                  act.domain
                                )}`}
                              >
                                {act.domain}
                              </button>
                            )}
                          </td>
                          <td className="hidden lg:table-cell px-5 py-3.5 text-[12px] text-[var(--text-secondary)] line-clamp-1 max-w-[180px]">
                            {act.ministry ?? '—'}
                          </td>
                          <td className="hidden sm:table-cell px-5 py-3.5">
                            <JurisdictionBadge
                              kind={act.jurisdiction_kind}
                              state={act.state_code}
                            />
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge
                              status={act.enforcement_status ?? act.status}
                              repealed={act.is_repealed}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-1.5">
                  <PgButton
                    onClick={() => goPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </PgButton>
                  {pageNums().map((p, i) =>
                    p === '...' ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-1 text-[var(--text-muted)]"
                      >
                        …
                      </span>
                    ) : (
                      <PgButton
                        key={p}
                        onClick={() => goPage(p as number)}
                        active={p === page}
                      >
                        {p}
                      </PgButton>
                    )
                  )}
                  <PgButton
                    onClick={() => goPage(page + 1)}
                    disabled={page === totalPages}
                    aria-label="Next"
                  >
                    <ChevronRight className="w-4 h-4" />
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

/* ─── Sub-components ───────────────────────────────────────────────── */

function Th({ children, w }: { children?: React.ReactNode; w?: string }) {
  return (
    <th
      className={`text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] px-5 py-2.5 ${
        w ?? ''
      }`}
    >
      {children}
    </th>
  );
}

const TONE_BG: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  sky: 'bg-sky-50 text-sky-600 border-sky-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
};

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: keyof typeof TONE_BG;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 flex items-center gap-2.5">
      <span
        className={`grid place-items-center w-8 h-8 rounded-lg border ${TONE_BG[tone]}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] truncate">
          {label}
        </p>
        <p className="text-sm font-semibold text-[var(--text-primary)] font-mono">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labelMap,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labelMap?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] block mb-1">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none text-[12px] pl-3 pr-7 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {labelMap?.[o] ?? o}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none" />
      </div>
    </label>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] block mb-1">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[12px] px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-muted)]"
      />
    </label>
  );
}

function JurisdictionBadge({
  kind,
  state,
}: {
  kind?: string | null;
  state?: string | null;
}) {
  if (!kind) return <span className="text-[var(--text-muted)] text-xs">—</span>;
  const k = kind.toLowerCase();
  const style =
    k === 'central'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : k === 'state'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-violet-50 text-violet-700 border-violet-200';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide ${style}`}
    >
      {k}
      {state ? <span className="font-mono opacity-70">· {state}</span> : null}
    </span>
  );
}

function StatusBadge({
  status,
  repealed,
}: {
  status?: string | null;
  repealed?: boolean | null;
}) {
  const isRepealed =
    repealed === true ||
    status?.toLowerCase().includes('repeal');
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          isRepealed ? 'bg-rose-400' : 'bg-emerald-500'
        }`}
      />
      <span className="text-[11px] text-[var(--text-muted)] capitalize">
        {(status ?? (isRepealed ? 'Repealed' : 'In force')).replace(/_/g, ' ')}
      </span>
    </div>
  );
}

function PgButton({
  children,
  onClick,
  disabled,
  active,
  'aria-label': al,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={al}
      className={`min-w-[32px] h-8 px-1 rounded-lg text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-sm'
          : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

