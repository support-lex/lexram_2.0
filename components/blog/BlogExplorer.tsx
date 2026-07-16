"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flame,
  LayoutList,
  Plus,
  Search,
  Tag as TagIcon,
  X,
} from "lucide-react";

import ScheduleQueueButton from "@/components/blog/ScheduleQueueButton";
import type { BlogPost } from "@/types/blog";

interface Props {
  posts: BlogPost[];
  isAdmin: boolean;
}

type SortField = "date" | "views";
type SortDir = "desc" | "asc";
const HERO_INTERVAL_MS = 6000;
const TOP_TAGS = 8;

export default function BlogExplorer({ posts, isAdmin }: Props) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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
    const sign = sortDir === "asc" ? -1 : 1;
    rows.sort((a, b) =>
      sortField === "views"
        ? sign * ((b.view_count ?? 0) - (a.view_count ?? 0))
        : sign * sortByPublished(a, b),
    );
    return rows;
  }, [posts, query, tagFilter, sortField, sortDir]);

  const hasFilters = query !== "" || tagFilter !== null;
  const clearFilters = () => { setQuery(""); setTagFilter(null); };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-3 sm:py-4 max-w-[1400px] mx-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="mb-3 sm:mb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#b94826]">
          Blog
        </p>
        <div className="mt-1 flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light tracking-tight text-[#680318] shrink-0">
            Insights &amp; dispatches
          </h1>
          <div className="flex-1">
            <SearchInput value={query} onChange={setQuery} />
          </div>
          <SortPill field={sortField} dir={sortDir} onField={setSortField} onDir={setSortDir} />
          {isAdmin && (
            <div className="shrink-0 flex items-center gap-2">
              <Link
                href="/blog/admin"
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium border border-[#680318]/25 bg-[#fff7ec] text-[#680318] hover:border-[#b94826]/50 hover:bg-[#680318]/8 transition-colors"
              >
                <LayoutList className="h-4 w-4" /> Manage
              </Link>
              {drafts.length > 0 && <ScheduleQueueButton drafts={drafts} />}
              <Link
                href="/blog/create"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold bg-[#b94826] text-[#fff0df] hover:bg-[#8f3318] shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" /> New post
              </Link>
            </div>
          )}
        </div>
      </header>

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
          {tagFilter && (
            <button
              type="button"
              onClick={() => setTagFilter(null)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium bg-[#b94826]/10 text-[#b94826] border border-[#b94826]/30 hover:bg-[#b94826]/20 transition-colors"
            >
              <TagIcon className="h-3.5 w-3.5" /> #{tagFilter}
              <X className="h-3.5 w-3.5 ml-1" />
            </button>
          )}
        </div>

        {popularTags.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#b94826] mb-2">
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
                      ? "bg-[#680318] text-[#fff0df] border-[#680318]"
                      : "bg-[#fff7ec] text-[#680318]/75 border-[#680318]/20 hover:border-[#b94826]/50 hover:text-[#680318]"
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
            {list.map((p) => <PostCard key={p.id} post={p} highlight={sortField === "views"} />)}
          </div>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function SearchInput({ value, onChange, compact }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
  return (
    <div className="relative">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-[#680318]/55 pointer-events-none ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search posts, tags, categories…"
        className={`w-full pl-8 pr-8 rounded-full border border-[#680318]/12 bg-[#fff7ec] text-[#680318] placeholder:text-[#680318]/40 outline-none focus:border-[#b94826] focus:ring-2 focus:ring-[#b94826]/30 transition-all ${compact ? "h-8 text-xs" : "h-11 text-sm pr-10"}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center h-6 w-6 rounded-full text-[#680318]/55 hover:bg-[#680318]/8 hover:text-[#680318] transition-colors"
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
      className="relative rounded-2xl overflow-hidden border border-[#680318]/15 bg-[#fff7ec] shadow-md"
      style={{ height: "calc(100vh - 170px)" }}
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
                <span className="inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-full bg-[#b94826]text-[#fff0df]">
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
      <h2 className="font-serif text-xl font-bold text-[#680318]">{title}</h2>
      {hint && <span className="text-xs text-[#680318]/40">{hint}</span>}
    </div>
  );
}

function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#b94826] text-[#fff0df] shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> NEW
    </span>
  );
}

function TodayCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl overflow-hidden border border-[#680318]/15 bg-[#fff7ec] hover:shadow-lg transition-shadow"
    >
      <div className="relative">
        {post.cover_image_url ? (
          <div className="aspect-[16/9] overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" aria-hidden />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-[#b94826]/10 to-[#680318]/5 grid place-items-center">
            <BookOpen className="h-8 w-8 text-[#b94826]/30" />
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <NewBadge />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        {post.category && (
          <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-[#b94826]">{post.category}</span>
        )}
        <h3 className="mt-1.5 font-serif text-base font-bold text-[#680318] group-hover:text-[#b94826] transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.subtitle && (
          <p className="mt-1.5 text-xs text-[#680318]/75 line-clamp-2 flex-1">{post.subtitle}</p>
        )}
      </div>
    </Link>
  );
}

function SortPill({
  field, dir, onField, onDir,
}: {
  field: SortField; dir: SortDir;
  onField: (v: SortField) => void; onDir: (v: SortDir) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-[#680318]/20 bg-[#fff7ec] shrink-0">
      <div className="relative flex items-center">
        <select
          value={field}
          onChange={(e) => onField(e.target.value as SortField)}
          className="h-9 pl-3.5 pr-7 text-sm text-[#680318]/80 bg-transparent border-0 outline-none cursor-pointer appearance-none font-medium"
        >
          <option value="date">By date</option>
          <option value="views">By views</option>
        </select>
        <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-[#680318]/45 pointer-events-none" />
      </div>
      <div className="w-px h-5 bg-[#680318]/20 shrink-0" />
      <div className="relative flex items-center">
        <select
          value={dir}
          onChange={(e) => onDir(e.target.value as SortDir)}
          className="h-9 pl-3.5 pr-7 text-sm text-[#680318]/80 bg-transparent border-0 outline-none cursor-pointer appearance-none font-medium"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-[#680318]/45 pointer-events-none" />
      </div>
    </div>
  );
}

function PostCard({ post, highlight }: { post: BlogPost; highlight?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-[#680318]/15 bg-[#fff7ec] hover:shadow-lg transition-shadow"
    >
      <div className="relative">
        {post.cover_image_url ? (
          <div className="aspect-[16/9] overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" aria-hidden />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-[#b94826]/10 to-[#680318]/5 grid place-items-center">
            <BookOpen className="h-10 w-10 text-[#b94826]/30" />
          </div>
        )}
        {isToday(post.published_at) && (
          <div className="absolute top-2.5 left-2.5"><NewBadge /></div>
        )}
        {highlight && (post.view_count ?? 0) > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#680318] text-[#fff0df] shadow">
              <Flame className="h-3 w-3" /> {compactNumber(post.view_count ?? 0)}
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <Meta post={post} />
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-[#680318] group-hover:text-[#b94826] transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.subtitle && (
          <p className="mt-2 text-sm text-[#680318]/75 line-clamp-2 flex-1">{post.subtitle}</p>
        )}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="inline-block px-1.5 py-0.5 text-[10px] rounded-md bg-[#fff0df] text-[#680318]/75">
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
    <div className="flex items-center gap-2 text-xs text-[#680318]/55 flex-wrap">
      {post.status !== "published" && (
        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#fff0df] text-[#680318] border border-[#b94826]/40">
          {post.status}
        </span>
      )}
      {post.category && (
        <span className="inline-block px-2 py-0.5 rounded-full bg-[#b94826]/10 text-[#b94826] font-medium">
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
    <div className="rounded-2xl border border-dashed border-[#680318]/15 bg-[#fff7ec] p-12 text-center">
      <BookOpen className="h-8 w-8 mx-auto mb-3 text-[#680318]/55" />
      <p className="text-sm text-[#680318]/55">
        {onClear ? "No posts match your filters." : isAdmin ? "No posts yet — start the first one." : "Articles will appear here soon."}
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold bg-[#b94826]/10 text-[#b94826] hover:bg-[#b94826]/20 transition-colors"
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
