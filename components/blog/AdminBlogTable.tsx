"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  Pencil,
  Trash2,
  Search,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  Clock,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

import { deletePost } from "@/lib/blog/api";
import type { BlogPost, BlogStatus } from "@/types/blog";

type StatusFilter = "all" | BlogStatus;
type SortKey = "updated" | "published" | "title" | "views";

interface Props {
  initialPosts: BlogPost[];
}

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "scheduled", label: "Scheduled" },
  { id: "draft", label: "Draft" },
];

export default function AdminBlogTable({ initialPosts }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [confirming, setConfirming] = useState<BlogPost | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    draft: posts.filter((p) => p.status === "draft").length,
  }), [posts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = posts.slice();
    if (statusFilter !== "all") rows = rows.filter((p) => p.status === statusFilter);
    if (q) {
      rows = rows.filter((p) =>
        [p.title, p.subtitle ?? "", p.category ?? "", p.author_name ?? "", ...p.tags].some((s) =>
          s.toLowerCase().includes(q),
        ),
      );
    }
    rows.sort((a, b) => {
      switch (sortKey) {
        case "title":
          return a.title.localeCompare(b.title);
        case "views":
          return (b.view_count ?? 0) - (a.view_count ?? 0);
        case "published": {
          const at = a.published_at ?? "";
          const bt = b.published_at ?? "";
          return bt.localeCompare(at);
        }
        case "updated":
        default:
          return b.updated_at.localeCompare(a.updated_at);
      }
    });
    return rows;
  }, [posts, query, statusFilter, sortKey]);

  async function handleDelete(post: BlogPost) {
    setDeletingId(post.id);
    try {
      await deletePost(post.id);
      setPosts((rows) => rows.filter((r) => r.id !== post.id));
      toast.success(`Deleted "${post.title}"`);
      setConfirming(null);
    } catch (e) {
      toast.error("Delete failed", { description: (e as Error).message });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    // Own the page scroll — dashboard layout's <main> is overflow-hidden so
    // a long blog list (especially after publishing many posts) would clip.
    <div className="h-full overflow-y-auto bg-[var(--bg-primary)]">
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-2 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Back to blog
          </Link>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Blog admin
          </p>
          <h1 className="mt-1 text-3xl font-serif font-light tracking-tight text-[var(--text-primary)]">
            All posts
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Manage every draft, scheduled post, and published article in one place.
          </p>
        </div>
        <Link
          href="/blog/create"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] shadow-[var(--shadow-sm)] transition-colors"
        >
          <Plus className="h-4 w-4" /> New post
        </Link>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={counts.all} accent="muted" />
        <StatCard label="Published" value={counts.published} accent="emerald" />
        <StatCard label="Scheduled" value={counts.scheduled} accent="amber" />
        <StatCard label="Drafts" value={counts.draft} accent="default" />
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-default)] flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, subtitle, author, tags..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring-accent)] transition-all"
            />
          </div>

          {/* Status tabs */}
          <div role="tablist" className="inline-flex items-center p-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)]">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`inline-flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-all
                  ${statusFilter === f.id
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
              >
                {f.label}
                <span className="text-[10px] text-[var(--text-muted)]">({counts[f.id]})</span>
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring-accent)]"
            aria-label="Sort"
          >
            <option value="updated">Recently updated</option>
            <option value="published">Recently published</option>
            <option value="views">Most viewed</option>
            <option value="title">Title (A→Z)</option>
          </select>
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-primary)]/40 border-b border-[var(--border-default)]">
              <tr className="text-left">
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Category</Th>
                <Th className="text-right">Views</Th>
                <Th>Date</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--text-muted)] text-sm">
                    No posts match these filters.
                  </td>
                </tr>
              ) : visible.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-primary)]/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover_image_url} alt="" className="h-10 w-14 rounded object-cover shrink-0" />
                      ) : (
                        <div className="h-10 w-14 rounded bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate">{p.title || "(untitled)"}</div>
                        {p.subtitle && (
                          <div className="text-xs text-[var(--text-muted)] truncate">{p.subtitle}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{p.category ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-secondary)]">
                    {p.status === "published" ? (p.view_count ?? 0).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs whitespace-nowrap">
                    <DateCell post={p} />
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      post={p}
                      onDelete={() => setConfirming(p)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden divide-y divide-[var(--border-default)]">
          {visible.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--text-muted)]">No posts match these filters.</div>
          ) : visible.map((p) => (
            <div key={p.id} className="p-4 flex gap-3">
              {p.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover_image_url} alt="" className="h-14 w-20 rounded object-cover shrink-0" />
              ) : (
                <div className="h-14 w-20 rounded bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusPill status={p.status} />
                  {p.category && <span className="text-[11px] text-[var(--text-muted)]">{p.category}</span>}
                </div>
                <div className="font-medium text-[var(--text-primary)] mt-1 line-clamp-2">{p.title || "(untitled)"}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1"><DateCell post={p} /></div>
                <div className="mt-2"><RowActions post={p} onDelete={() => setConfirming(p)} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirming && (
        <DeleteConfirmModal
          post={confirming}
          deleting={deletingId === confirming.id}
          onCancel={() => setConfirming(null)}
          onConfirm={() => handleDelete(confirming)}
        />
      )}
    </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] ${className ?? ""}`}>
      {children}
    </th>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: "default" | "emerald" | "amber" | "muted" }) {
  const accentClass: Record<string, string> = {
    default: "text-[var(--text-primary)]",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    muted: "text-[var(--text-secondary)]",
  };
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</div>
      <div className={`mt-1 text-2xl font-serif font-bold tabular-nums ${accentClass[accent]}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: BlogStatus }) {
  const styles: Record<BlogStatus, string> = {
    published: "bg-emerald-100 text-emerald-800 border-emerald-200",
    scheduled: "bg-amber-100 text-amber-800 border-amber-200",
    draft: "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-default)]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
}

function DateCell({ post }: { post: BlogPost }) {
  if (post.status === "scheduled" && post.scheduled_for) {
    return (
      <span className="inline-flex items-center gap-1">
        <Calendar className="h-3 w-3" /> {fmt(post.scheduled_for)}
      </span>
    );
  }
  if (post.status === "published" && post.published_at) {
    return <span>{fmt(post.published_at)}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Clock className="h-3 w-3" /> Updated {fmt(post.updated_at)}
    </span>
  );
}

function RowActions({ post, onDelete }: { post: BlogPost; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/blog/${post.slug}`}
        title="View"
        aria-label="View"
        className="grid place-items-center h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <Link
        href={`/blog/create?edit=${post.id}`}
        title="Edit"
        aria-label="Edit"
        className="grid place-items-center h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        aria-label="Delete"
        className="grid place-items-center h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-600 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function DeleteConfirmModal({
  post,
  deleting,
  onCancel,
  onConfirm,
}: {
  post: BlogPost;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
      onClick={() => !deleting && onCancel()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-lg)] overflow-hidden"
      >
        <div className="p-5 flex items-start gap-3 border-b border-[var(--border-default)]">
          <div className="grid place-items-center h-9 w-9 rounded-lg bg-red-500/10 text-red-600 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Delete post?</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              This will permanently delete <strong className="text-[var(--text-primary)]">{post.title || "(untitled)"}</strong> and its data. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="grid place-items-center h-7 w-7 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 flex items-center justify-end gap-2 bg-[var(--bg-primary)]/40">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-3 h-9 rounded-lg text-sm font-medium border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 shadow-[var(--shadow-sm)] transition-colors"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? "Deleting..." : "Delete post"}
          </button>
        </div>
      </div>
    </div>
  );
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
