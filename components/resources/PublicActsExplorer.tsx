"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, ChevronDown, BookOpen, Sparkles, Loader2,
  ScrollText, Building2, Calendar, ArrowRight, Lock, Scale,
} from "lucide-react";
import { LexRamV2, type ActV2, type FilterValuesV2, type SuggestItemV2 } from "@/lib/lexram/api";
import SignupPromptModal from "@/components/SignupPromptModal";

const PAGE_SIZE = 24;

interface Props {
  isAuthenticated: boolean;
}

export default function PublicActsExplorer({ isAuthenticated }: Props) {
  const router = useRouter();

  // Data
  const [acts, setActs] = useState<ActV2[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterValuesV2 | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestItemV2[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [year, setYear] = useState<number | "">("");
  const [ministry, setMinistry] = useState("");
  const [domain, setDomain] = useState("");
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Auth gate
  const [signupPromptOpen, setSignupPromptOpen] = useState(false);
  const [bottomBannerOpen, setBottomBannerOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // ── Debounce search ────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // ── Fetch filters once ─────────────────────────────────────────
  useEffect(() => {
    LexRamV2.filters().then(setFilters).catch(() => setFilters(null));
  }, []);

  // ── Fetch acts list ────────────────────────────────────────────
  const fetchActs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await LexRamV2.acts({
        limit: PAGE_SIZE,
        page: 1,
        sort_by: "year",
        order: "desc",
        q: debounced || undefined,
        year: year || undefined,
        ministry: ministry || undefined,
        domain: domain || undefined,
        fields: "id,name,title,short_title,year,ministry,domain,category,act_type,status",
      });
      setActs(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setActs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debounced, year, ministry, domain]);

  useEffect(() => { fetchActs(); }, [fetchActs]);

  // ── Typeahead ──────────────────────────────────────────────────
  useEffect(() => {
    if (debounced.length < 2) { setSuggestions([]); return; }
    LexRamV2.suggest(debounced).then(setSuggestions).catch(() => setSuggestions([]));
  }, [debounced]);

  // ── Scroll detector for bottom banner ─────────────────────────
  useEffect(() => {
    if (isAuthenticated || bannerDismissed) return;
    const handler = () => {
      if (typeof window === "undefined") return;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = window.scrollY / total;
      if (pct > 0.18) setBottomBannerOpen(true);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [isAuthenticated, bannerDismissed]);

  // ── Handle act click ───────────────────────────────────────────
  const handleActClick = (act: ActV2) => {
    if (isAuthenticated) {
      router.push(`/dashboard/acts/${act.id}`);
    } else {
      setSignupPromptOpen(true);
    }
  };

  const goSignUp = () => {
    const params = new URLSearchParams();
    params.set("redirect", "/dashboard/acts");
    params.set("intent", "signup");
    router.push(`/sign-in?${params.toString()}`);
  };

  const goSignIn = () => {
    const params = new URLSearchParams();
    params.set("redirect", "/dashboard/acts");
    router.push(`/sign-in?${params.toString()}`);
  };

  const hasActiveFilters = !!(year || ministry || domain || debounced);
  const clearFilters = () => { setYear(""); setMinistry(""); setDomain(""); setQuery(""); };

  // Top filter values (truncated for visual density)
  const topYears = useMemo(() => filters?.years.slice(0, 12) ?? [], [filters]);
  const topMinistries = useMemo(() => filters?.ministries.slice(0, 8) ?? [], [filters]);
  const topDomains = useMemo(() => filters?.domains.slice(0, 8) ?? [], [filters]);

  return (
    <>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/8 via-transparent to-transparent" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)] mb-3">
              Indian Legislation Library
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-light leading-[1.1] tracking-tight text-[var(--text-primary)] max-w-3xl">
              Every Indian Act,{" "}
              <span className="text-[var(--accent)] font-normal">searchable in one place</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-[var(--text-secondary)] leading-relaxed">
              Browse {total ? total.toLocaleString("en-IN") : "11,000+"} central and state acts,
              filterable by ministry, domain, and year. Sign up free to read full text, sections,
              and AI-generated summaries.
            </p>

            {/* Search bar */}
            <div className="mt-8 max-w-2xl relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search by act name, e.g. Companies Act, IT Act 2000..."
                  className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-[var(--border-default)] bg-[var(--bg-surface)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all shadow-sm"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Typeahead suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] overflow-hidden z-30 max-h-80 overflow-y-auto">
                  {suggestions.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleActClick(s as ActV2)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border-default)]/40 last:border-0"
                    >
                      <Sparkles className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.title ?? s.id}</p>
                        {s.year && <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.year}</p>}
                      </div>
                      {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl">
              <Stat label="Total Acts" value={total ? total.toLocaleString("en-IN") : "11,000+"} icon={<ScrollText className="w-4 h-4" />} />
              <Stat label="Ministries" value={filters?.ministries.length.toString() ?? "30+"} icon={<Building2 className="w-4 h-4" />} />
              <Stat label="Years covered" value={filters?.years.length ? `${filters.years[filters.years.length - 1]}–${filters.years[0]}` : "1850–2025"} icon={<Calendar className="w-4 h-4" />} />
            </div>
          </div>
        </section>

        {/* ── Filter chips ───────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pb-2">
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
            {/* Quick filters */}
            <div className="p-4 sm:p-5 space-y-3">
              {/* Domain */}
              {topDomains.length > 0 && (
                <FilterRow label="Domain" value={domain} onClear={() => setDomain("")}>
                  {topDomains.map((d) => (
                    <Chip key={d} active={domain === d} onClick={() => setDomain(domain === d ? "" : d)}>
                      {d}
                    </Chip>
                  ))}
                </FilterRow>
              )}
              {/* Ministry */}
              {topMinistries.length > 0 && (
                <FilterRow label="Ministry" value={ministry} onClear={() => setMinistry("")}>
                  {topMinistries.map((m) => (
                    <Chip key={m} active={ministry === m} onClick={() => setMinistry(ministry === m ? "" : m)}>
                      {m}
                    </Chip>
                  ))}
                </FilterRow>
              )}
              {/* Year */}
              {topYears.length > 0 && (
                <FilterRow label="Year" value={year ? String(year) : ""} onClear={() => setYear("")}>
                  {topYears.map((y) => (
                    <Chip key={y} active={year === y} onClick={() => setYear(year === y ? "" : y)}>
                      {y}
                    </Chip>
                  ))}
                </FilterRow>
              )}

              {/* Show all years toggle */}
              {filters && filters.years.length > 12 && (
                <button
                  type="button"
                  onClick={() => setShowAllFilters((v) => !v)}
                  className="text-[11px] text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAllFilters ? "rotate-180" : ""}`} />
                  {showAllFilters ? "Hide" : "Show"} all years ({filters.years.length})
                </button>
              )}
              {showAllFilters && filters && (
                <FilterRow label="">
                  {filters.years.map((y) => (
                    <Chip key={y} active={year === y} onClick={() => setYear(year === y ? "" : y)}>
                      {y}
                    </Chip>
                  ))}
                </FilterRow>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent)] inline-flex items-center gap-1 transition-colors pt-1"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Acts grid ──────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-32">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {hasActiveFilters ? "Search results" : "Featured acts"}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {loading ? "Loading…" : `Showing ${acts.length} of ${total.toLocaleString("en-IN")}`}
            </p>
          </div>

          {loading && acts.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : acts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] p-10 sm:p-16 text-center">
              <ScrollText className="w-8 h-8 mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">No acts found for these filters.</p>
              <button type="button" onClick={clearFilters}
                className="mt-3 text-xs text-[var(--accent)] hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {acts.map((act) => (
                <ActCard key={act.id} act={act} onClick={() => handleActClick(act)} locked={!isAuthenticated} />
              ))}
            </div>
          )}

          {!loading && total > acts.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => isAuthenticated ? router.push("/dashboard/acts") : setSignupPromptOpen(true)}
                className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-[var(--accent)] text-[var(--accent-text)] text-sm font-semibold hover:bg-[var(--accent-hover)] shadow-lg hover:shadow-xl transition-all"
              >
                {isAuthenticated ? "Browse all acts" : "Sign up to see all"}
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {(total - acts.length).toLocaleString("en-IN")} more acts available
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ── Sticky bottom auth banner ──────────────────────────── */}
      {!isAuthenticated && bottomBannerOpen && !bannerDismissed && (
        <BottomAuthBanner
          onSignUp={goSignUp}
          onSignIn={goSignIn}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* ── Click-to-view login modal ──────────────────────────── */}
      <SignupPromptModal open={signupPromptOpen} />
      {signupPromptOpen && (
        <button
          type="button"
          onClick={() => setSignupPromptOpen(false)}
          className="fixed inset-0 z-[55]"
          aria-label="Close prompt"
        />
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[var(--accent)] mb-1">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</span>
      </div>
      <p className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tabular-nums">{value}</p>
    </div>
  );
}

function FilterRow({ label, value, onClear, children }: { label: string; value?: string; onClear?: () => void; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</span>
          {value && onClear && (
            <button type="button" onClick={onClear}
              className="text-[10px] text-[var(--accent)] hover:underline inline-flex items-center gap-0.5">
              <X className="w-2.5 h-2.5" /> Clear
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center px-3 h-7 rounded-full text-xs font-medium border transition-all ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] shadow-sm"
          : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]"
      }`}
    >
      {children}
    </button>
  );
}

function ActCard({ act, onClick, locked }: { act: ActV2; onClick: () => void; locked: boolean }) {
  const title = act.title || act.name || act.id;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col text-left rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5 hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-card-hover)] transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {act.year && (
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
              {act.year}
            </span>
          )}
          {act.act_type && (
            <span className="inline-block text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-default)]">
              {act.act_type}
            </span>
          )}
        </div>
        {locked && (
          <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>

      <h3 className="font-serif text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug line-clamp-3 group-hover:text-[var(--accent)] transition-colors">
        {title}
      </h3>

      <div className="mt-3 pt-3 border-t border-[var(--border-default)]/50 flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)] truncate flex-1 min-w-0">
          {act.ministry || act.domain || "Indian Statute"}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
      </div>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="h-[148px] rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-12 rounded-full bg-[var(--surface-hover)]" />
        <div className="h-5 w-16 rounded-full bg-[var(--surface-hover)]" />
      </div>
      <div className="h-5 w-3/4 rounded bg-[var(--surface-hover)] mb-2" />
      <div className="h-5 w-1/2 rounded bg-[var(--surface-hover)] mb-4" />
      <div className="h-3 w-1/3 rounded bg-[var(--surface-hover)]" />
    </div>
  );
}

function BottomAuthBanner({ onSignUp, onSignIn, onDismiss }: { onSignUp: () => void; onSignIn: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 animate-slide-up">
      <div className="bg-gradient-to-t from-white via-white to-white/95 dark:from-[var(--bg-surface)] dark:via-[var(--bg-surface)] dark:to-[var(--bg-surface)]/95 border-t border-[var(--border-default)] shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:grid place-items-center w-10 h-10 rounded-full bg-[var(--accent)]/10 flex-shrink-0">
              <Scale className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] sm:text-sm font-semibold text-[var(--text-primary)] leading-tight">
                Read full acts, sections &amp; AI summaries — free
              </p>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-0.5 hidden sm:block">
                Join thousands of advocates using LexRam for legal research
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button type="button" onClick={onSignIn}
                className="hidden sm:inline-flex items-center px-3 h-9 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Sign in
              </button>
              <button type="button" onClick={onSignUp}
                className="inline-flex items-center gap-1 px-4 h-9 rounded-full text-xs sm:text-sm font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] shadow-md transition-colors whitespace-nowrap">
                Sign up free
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={onDismiss}
                className="grid place-items-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
                aria-label="Dismiss banner">
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
      `}</style>
    </div>
  );
}
