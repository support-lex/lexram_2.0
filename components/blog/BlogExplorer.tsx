"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flame,
  LayoutList,
  Plus,
  Search,
  Sparkles,
  Tag as TagIcon,
  X,
} from "lucide-react";

import ScheduleQueueButton from "@/components/blog/ScheduleQueueButton";
import type { BlogPost } from "@/types/blog";

interface Props {
  posts: BlogPost[];
  isAdmin: boolean;
}

type Sort = "latest" | "trending";
const HERO_INTERVAL_MS = 6000;
const TOP_TAGS = 8;

export default function BlogExplorer({ posts, isAdmin }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("latest");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Drafts are only seen by admins (RLS ensures non-admins never get them).
  const drafts = useMemo(() => posts.filter((p) => p.status === "draft"), [posts]);
  const published = useMemo(() => posts.filter((p) => p.status === "published"), [posts]);

  // Hero carousel: top 5 published posts that have cover images.
  const heroPosts = useMemo(
    () =>
      [...published]
        .filter((p) => !!p.cover_image_url)
        .sort((a, b) => sortByPublished(a, b))
        .slice(0, 5),
    [published],
  );

  // Today's posts: published today, with NEW badge.
  const todays = useMemo(() => {
    const today = startOfDay(new Date());
    return published
      .filter((p) => p.published_at && startOfDay(new Date(p.published_at)).getTime() === today.getTime())
      .slice(0, 6);
  }, [published]);

  // Tag frequency across all visible posts → top 8.
  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_TAGS).map(([t]) => t);
  }, [posts]);

  // Pipeline: search filter → tag filter → sort.
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = posts.slice();
    if (q) {
      rows = rows.filter((p) =>
        [p.title, p.subtitle ?? "", p.category ?? "", ...p.tags].some((s) =>
          s.toLowerCase().includes(q),
        ),
      );
    }
    if (tagFilter) rows = rows.filter((p) => p.tags.includes(tagFilter));
    rows.sort((a, b) =>
      sort === "trending"
        ? (b.view_count ?? 0) - (a.view_count ?? 0)
        : sortByPublished(a, b),
    );
    return rows;
  }, [posts, query, tagFilter, sort]);

  const hasFilters = query !== "" || tagFilter !== null;
  const clearFilters = () => { setQuery(""); setTagFilter(null); };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-[1400px] mx-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="mb-5 sm:mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Blog
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-serif font-light tracking-tight text-[var(--text-primary)]">
            Insights &amp; dispatches
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Notes on legal technology, AI-assisted research, and the future of practice in India.
          </p>
        </div>

        {isAdmin && (
          <div className="shrink-0 flex flex-wrap items-center gap-2">
            <Link
              href="/blog/admin"
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)] transition-colors"
            >
              <LayoutList className="h-4 w-4" /> Manage
            </Link>
            {drafts.length > 0 && <ScheduleQueueButton drafts={drafts} />}
            <Link
              href="/blog/create"
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] shadow-[var(--shadow-sm)] transition-colors"
            >
              <Plus className="h-4 w-4" /> New post
            </Link>
          </div>
        )}
      </header>

      {/* ── Search ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <SearchInput value={query} onChange={setQuery} />
      </div>

      {/* ── Hero carousel ───────────────────────────────────────── */}
      {heroPosts.length > 0 && !hasFilters && <HeroCarousel posts={heroPosts} />}

      {/* ── Today (NEW) ─────────────────────────────────────────── */}
      {todays.length > 0 && !hasFilters && (
        <section className="mt-10">
          <SectionHeading title="Today" hint={`${todays.length} new ${todays.length === 1 ? "post" : "posts"}`} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todays.map((p) => <TodayCard key={p.id} post={p} />)}
          </div>
        </section>
      )}

      {/* ── Filters bar ─────────────────────────────────────────── */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <SortTabs value={sort} onChange={setSort} />
          {tagFilter && (
            <button
              type="button"
              onClick={() => setTagFilter(null)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/20 transition-colors"
            >
              <TagIcon className="h-3.5 w-3.5" /> #{tagFilter}
              <X className="h-3.5 w-3.5 ml-1" />
            </button>
          )}
        </div>

        {popularTags.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)] mb-2">
              Popular tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {popularTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTagFilter(tagFilter === t ? null : t)}
                  className={`inline-flex items-center px-3 h-7 rounded-full text-xs font-medium border transition-colors
                    ${tagFilter === t
                      ? "bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]"
                    }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {list.length === 0 ? (
          <EmptyState onClear={hasFilters ? clearFilters : undefined} isAdmin={isAdmin} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((p) => <PostCard key={p.id} post={p} highlight={sort === "trending"} />)}
          </div>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search posts, tags, categories..."
        className="w-full h-11 pl-10 pr-10 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring-accent)] transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center h-6 w-6 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function HeroCarousel({ posts }: { posts: BlogPost[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance on a timer; reset when active changes manually.
  useEffect(() => {
    if (paused || posts.length <= 1) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % posts.length), HERO_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [active, paused, posts.length]);

  const go = (delta: number) => setActive((i) => (i + delta + posts.length) % posts.length);

  return (
    <section
      className="relative rounded-2xl overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] aspect-[16/9] sm:aspect-[16/7] md:aspect-[2.4/1]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {posts.map((post, i) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          aria-hidden={active !== i}
          tabIndex={active === i ? 0 : -1}
          className="absolute inset-0 transition-opacity duration-700 ease-out group"
          style={{
            opacity: active === i ? 1 : 0,
            pointerEvents: active === i ? "auto" : "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover_image_url ?? ""} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15" aria-hidden />
          <div className="relative h-full flex flex-col justify-end p-5 sm:p-8 md:p-10">
            <div className="flex items-center gap-2 flex-wrap">
              {post.category && (
                <span className="inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-full bg-[var(--accent)] text-[var(--accent-text)]">
                  {post.category}
                </span>
              )}
              {isToday(post.published_at) && <NewBadge />}
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white leading-tight max-w-3xl">
              {post.title}
            </h2>
            {post.subtitle && (
              <p className="mt-2 text-sm sm:text-base text-white/85 max-w-2xl line-clamp-2">
                {post.subtitle}
              </p>
            )}
            <div className="mt-4 flex items-center gap-4 text-xs sm:text-sm text-white/85">
              {post.author_name && <span>{post.author_name}</span>}
              {post.reading_time && (
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.reading_time} min</span>
              )}
              <span className="inline-flex items-center gap-1 ml-auto font-medium text-white">
                Read article <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}

      {/* Prev/Next */}
      {posts.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur px-2 py-1 rounded-full">
            {posts.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === active}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">{title}</h2>
      {hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
    </div>
  );
}

function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500 text-white shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> NEW
    </span>
  );
}

function TodayCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] hover:shadow-[var(--shadow-card-hover)] transition-shadow"
    >
      <div className="relative">
        {post.cover_image_url ? (
          <div className="aspect-[16/9] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 grid place-items-center">
            <BookOpen className="h-8 w-8 text-[var(--accent)]/30" />
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <NewBadge />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        {post.category && (
          <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--accent)]">{post.category}</span>
        )}
        <h3 className="mt-1.5 font-serif text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.subtitle && (
          <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2 flex-1">{post.subtitle}</p>
        )}
      </div>
    </Link>
  );
}

function SortTabs({ value, onChange }: { value: Sort; onChange: (v: Sort) => void }) {
  const items: Array<{ id: Sort; label: string; icon: React.ReactNode }> = [
    { id: "latest", label: "Latest", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "trending", label: "Trending", icon: <Flame className="h-3.5 w-3.5" /> },
  ];
  return (
    <div role="tablist" className="inline-flex items-center p-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)]">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={`inline-flex items-center gap-1.5 px-3.5 h-7 rounded-full text-xs font-semibold transition-all
            ${value === it.id
              ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-[var(--shadow-sm)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
        >
          {it.icon} {it.label}
        </button>
      ))}
    </div>
  );
}

function PostCard({ post, highlight }: { post: BlogPost; highlight?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] hover:shadow-[var(--shadow-card-hover)] transition-shadow"
    >
      <div className="relative">
        {post.cover_image_url ? (
          <div className="aspect-[16/9] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 grid place-items-center">
            <BookOpen className="h-10 w-10 text-[var(--accent)]/30" />
          </div>
        )}
        {isToday(post.published_at) && (
          <div className="absolute top-2.5 left-2.5"><NewBadge /></div>
        )}
        {highlight && (post.view_count ?? 0) > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-500 text-white shadow">
              <Flame className="h-3 w-3" /> {compactNumber(post.view_count ?? 0)}
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <Meta post={post} />
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.subtitle && (
          <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2 flex-1">{post.subtitle}</p>
        )}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="inline-block px-1.5 py-0.5 text-[10px] rounded-md bg-[var(--bg-primary)] text-[var(--text-muted)]">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function Meta({ post }: { post: BlogPost }) {
  const date = post.published_at ? new Date(post.published_at) : new Date(post.created_at);
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] flex-wrap">
      {post.status !== "published" && (
        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
          {post.status}
        </span>
      )}
      {post.category && (
        <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
          {post.category}
        </span>
      )}
      <span>{date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
      {post.reading_time && (
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.reading_time} min</span>
      )}
      {post.status === "published" && (
        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {compactNumber(post.view_count ?? 0)}</span>
      )}
    </div>
  );
}

function EmptyState({ onClear, isAdmin }: { onClear?: () => void; isAdmin: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] p-12 text-center">
      <BookOpen className="h-8 w-8 mx-auto mb-3 text-[var(--text-muted)]" />
      <p className="text-sm text-[var(--text-muted)]">
        {onClear ? "No posts match your filters." : isAdmin ? "No posts yet — start the first one." : "Articles will appear here soon."}
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return startOfDay(new Date(iso)).getTime() === startOfDay(new Date()).getTime();
}

function sortByPublished(a: BlogPost, b: BlogPost): number {
  const at = a.published_at ?? a.created_at;
  const bt = b.published_at ?? b.created_at;
  return bt.localeCompare(at);
}

function compactNumber(n: number): string {
  if (n < 1_000) return n.toString();
  if (n < 1_000_000) return `${(n / 1_000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}
