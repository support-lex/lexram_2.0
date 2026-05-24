"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useRef, useState } from "react";
import { Search, X, MessageSquare, Trash2, Pencil, Check, Pin, PinOff, Zap, Plus } from "lucide-react";
import {
  pinnedSessionRepository,
  archivedSessionRepository,
} from "@/modules/chat/repository/feedback.repository";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { ResearchSession } from "../types";

type HistorySidebarProps = {
  open: boolean;
  onToggle: () => void;
  groupedSessions: Record<string, ResearchSession[]>;
  filteredSessions: ResearchSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession?: (id: string) => void;
  onRenameSession?: (id: string, title: string) => void;
  historySearch: string;
  setHistorySearch: (v: string) => void;
  relativeDateLabel: (ts: string) => string;
  onUpgrade?: () => void;
  /** Authenticated user's current credit balance, or null if signed out. */
  creditBalance?: number | null;
  /** Highest balance ever held — denominator for the meter's progress bar. */
  creditCeiling?: number;
  /** First credits fetch hasn't returned yet → show a skeleton instead of 0/0. */
  creditsLoading?: boolean;
  /** First /sessions fetch hasn't returned yet → show skeleton rows instead of "No threads yet". */
  sessionsLoading?: boolean;
};

function ConversationItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onRename,
  relativeDateLabel,
}: {
  session: ResearchSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onRename?: (title: string) => void;
  relativeDateLabel: (ts: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(session.title);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, session.title]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== session.title && onRename) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  return (
    <div
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group/item relative cursor-pointer ${
        isActive
          ? "bg-[var(--accent)]/10 text-[var(--text-primary)]"
          : "hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
      }`}
      onClick={() => { if (!editing) onSelect(); }}
      role="button"
      tabIndex={0}
      aria-label={session.title}
      onKeyDown={(e) => { if (!editing && (e.key === "Enter" || e.key === " ")) onSelect(); }}
    >
      {isActive && (
        <div className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full bg-[var(--accent)]" />
      )}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") commit();
              else if (e.key === "Escape") { setEditing(false); setDraft(session.title); }
            }}
            onBlur={commit}
            className="w-full bg-[var(--bg-surface)] border border-[var(--accent)]/40 rounded px-1.5 py-0.5 text-[13px] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)] leading-5"
          />
        ) : (
          <div
            className={`text-[13px] truncate font-medium leading-5 group-hover/item:whitespace-normal group-hover/item:overflow-visible group-hover/item:text-clip group-hover/item:break-words ${
              isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            }`}
          >
            {session.title}
          </div>
        )}
        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
          {relativeDateLabel(session.updatedAt)}
        </div>
      </div>

      {editing ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); commit(); }}
          title="Save"
          className="p-1 rounded hover:bg-[var(--accent)]/10 text-[var(--accent)] transition-all"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
          {onRename && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              title="Rename conversation"
              className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Delete this conversation? This cannot be undone.")) {
                  onDelete();
                }
              }}
              title="Delete conversation"
              className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  groupedSessions,
  filteredSessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  historySearch,
  setHistorySearch,
  relativeDateLabel,
  onClose,
  onUpgrade,
  creditBalance,
  creditCeiling,
  creditsLoading,
  sessionsLoading,
}: HistorySidebarProps & { onClose: () => void }) {
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => new Set(pinnedSessionRepository.list()));
  // Archived ids — filtered out of the visible history. The 3-dot menu in the
  // chat header writes to `archivedSessionRepository`; this Set is read once
  // on mount and refreshed on the global `lexram-archive-changed` event so
  // archive actions reflect immediately.
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => new Set(archivedSessionRepository.list()));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshArchived = () => setArchivedIds(new Set(archivedSessionRepository.list()));
    // Pinned set is hydrated from Supabase on auth resolution (see
    // useResearchSessions). When that hydration finishes, the hook fires
    // `lexram-pin-changed` so this sidebar can rebuild its Set from the
    // freshly-replaced cache instead of holding the empty mount-time read.
    const refreshPinned = () => setPinnedIds(new Set(pinnedSessionRepository.list()));
    window.addEventListener("lexram-archive-changed", refreshArchived);
    window.addEventListener("lexram-pin-changed", refreshPinned);
    return () => {
      window.removeEventListener("lexram-archive-changed", refreshArchived);
      window.removeEventListener("lexram-pin-changed", refreshPinned);
    };
  }, []);

  const togglePin = async (sessionId: string) => {
    if (pinnedIds.has(sessionId)) {
      await pinnedSessionRepository.unpin(sessionId);
      setPinnedIds((prev) => { const next = new Set(prev); next.delete(sessionId); return next; });
    } else {
      await pinnedSessionRepository.pin(sessionId);
      setPinnedIds((prev) => new Set(prev).add(sessionId));
    }
  };

  const visibleSessions = filteredSessions.filter((s) => !archivedIds.has(s.id));
  const pinnedSessions = visibleSessions.filter((s) => pinnedIds.has(s.id));

  // ── Infinite scroll for the unpinned section ───────────────────────────
  // Lawyers can end up with hundreds of threads — rendering every row up
  // front made the sidebar mount visibly slow. We slice the unpinned
  // sessions to `visibleCount`, then grow the slice when an
  // IntersectionObserver sentinel at the bottom of the list comes into
  // view. Pinned + the search filter are NOT sliced (those lists are
  // intentional/short).
  const INITIAL_VISIBLE = 15;
  const VISIBLE_PAGE = 20;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  // Reset the slice whenever the search query changes (otherwise a new
  // filter would still show the previous count).
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [historySearch]);

  const unpinnedFlat = Object.entries(groupedSessions).flatMap(([group, sessions]) =>
    (sessions as ResearchSession[])
      .filter((s) => !pinnedIds.has(s.id) && !archivedIds.has(s.id))
      .map((s) => ({ group, session: s })),
  );
  const unpinnedSliced = unpinnedFlat.slice(0, visibleCount);
  const hasMoreUnpinned = unpinnedFlat.length > unpinnedSliced.length;

  // Re-group AFTER slicing so the "Today / This Week / Earlier" headers
  // still appear above their first entry without leaking empty buckets.
  const unpinnedGrouped: Record<string, ResearchSession[]> = {};
  unpinnedSliced.forEach(({ group, session }) => {
    (unpinnedGrouped[group] ??= []).push(session);
  });

  // Sentinel observer — when the loader row scrolls into the viewport,
  // grow the slice by another page. Cheap and matches Notion / ChatGPT.
  //
  // Two guards prevent the "cascade load everything on mount" bug we hit
  // earlier (where a sidebar tall enough to fit all 15 rows kept the
  // sentinel permanently visible, so every visibleCount bump immediately
  // triggered the next one until the entire list rendered in one tick):
  //
  //   1. `userScrolledRef` — the sentinel is ignored until the user has
  //      scrolled the container at least once. This stops the first burst
  //      on mount.
  //   2. `loadingMoreRef` — once a page load fires, we hold a 350 ms cool-
  //      down before another can fire. Long enough for the new rows to
  //      render and push the sentinel back below the fold under any
  //      realistic row count.
  //
  // We also flip a real `loadingMore` state so the skeleton stays visible
  // for the cooldown window — without it the "Loading more…" indicator
  // would only flash for a single frame and the user wouldn't perceive
  // any pagination at all.
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const userScrolledRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root) return;
    const onScroll = () => {
      if (root.scrollTop > 4) userScrolledRef.current = true;
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!hasMoreUnpinned) return;
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (!userScrolledRef.current) return;
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        // Brief artificial delay so the skeleton actually registers
        // visually — a sub-frame pagination feels invisible.
        setTimeout(() => {
          setVisibleCount((n) => n + VISIBLE_PAGE);
          setLoadingMore(false);
          // Extra cooldown after render to keep the cascade in check.
          setTimeout(() => { loadingMoreRef.current = false; }, 150);
        }, 350);
      },
      {
        root: scrollRootRef.current,
        rootMargin: "0px 0px 200px 0px",
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreUnpinned, unpinnedSliced.length]);
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--lex-shadow-soft)] overflow-hidden lex-animate-slide-left">
      {/* ── Threads header — serif title + filled maroon "+" ───── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex flex-col leading-tight">
          <span className="text-[22px] font-bold text-[var(--lex-maroon)] font-serif tracking-tight">
            Threads
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mt-1">
            {filteredSessions.length} {filteredSessions.length === 1 ? "Conversation" : "Conversations"}
          </span>
        </div>
        <button
          type="button"
          onClick={onNewSession}
          aria-label="New thread"
          title="New thread"
          className="grid place-items-center size-9 rounded-full bg-[var(--lex-maroon)] text-[var(--lex-cream)] hover:opacity-90 shadow-[var(--lex-shadow-soft)] transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="h-px bg-[var(--border-light)] mx-5" />

      {/* Search — cream-tinted pill, matches reference */}
      <div className="px-5 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-light)] bg-[var(--lex-cream-soft)] px-3 py-2">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search threads…"
            className="w-full bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
          />
        </div>
      </div>

      {/* Session list with Pinned section */}
      <div ref={scrollRootRef} className="flex-1 overflow-y-auto px-2 pb-3 custom-scrollbar">
        {sessionsLoading && filteredSessions.length === 0 ? (
          // Skeleton rows while the first /sessions fetch is in flight.
          // Avoids the empty-state flash that misled users into thinking
          // they had no threads when the page had just mounted.
          <ul className="space-y-1.5 px-1 pt-2 pb-3" aria-busy="true" aria-live="polite">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-[var(--lex-cream-soft)]"
              >
                <div
                  className="h-3 rounded-full bg-[var(--border-default)] lex-skeleton-shimmer"
                  style={{ width: `${60 + (i * 7) % 30}%` }}
                />
                <div
                  className="h-2 rounded-full bg-[var(--border-default)]/60 lex-skeleton-shimmer"
                  style={{ width: `${30 + (i * 5) % 20}%` }}
                />
              </li>
            ))}
          </ul>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
            <MessageSquare className="w-6 h-6 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-muted)]">
              No threads yet.
              <br />
              Ask a question to start.
            </p>
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinnedSessions.length > 0 && (
              <div className="mb-3">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--oracle-primary-container,#c6a76e)] flex items-center gap-1.5">
                  <Pin className="w-3 h-3" /> Pinned
                </div>
                {pinnedSessions.map((session) => (
                  <div key={session.id} className="relative group/pin">
                    <ConversationItem
                      session={session}
                      isActive={currentSessionId === session.id}
                      onSelect={() => onSelectSession(session.id)}
                      onDelete={onDeleteSession ? () => onDeleteSession(session.id) : undefined}
                      onRename={onRenameSession ? (title) => onRenameSession(session.id, title) : undefined}
                      relativeDateLabel={relativeDateLabel}
                    />
                    <button
                      onClick={() => togglePin(session.id)}
                      title="Unpin"
                      className="absolute right-8 top-2.5 p-1 rounded opacity-0 group-hover/pin:opacity-100 hover:bg-[var(--surface-hover)] text-[var(--oracle-primary-container,#c6a76e)] transition-all"
                    >
                      <PinOff className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {pinnedSessions.length > 0 && Object.keys(unpinnedGrouped).length > 0 && (
              <div className="h-px bg-[var(--oracle-outline-variant,#d0c5b6)]/20 mx-3 mb-2" />
            )}
            {/* Unpinned grouped */}
            {Object.entries(unpinnedGrouped).map(([group, sessions]) => (
              <div key={group} className="mb-3">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {group}
                </div>
                {(sessions as ResearchSession[]).map((session) => (
                  <div key={session.id} className="relative group/pin">
                    <ConversationItem
                      session={session}
                      isActive={currentSessionId === session.id}
                      onSelect={() => onSelectSession(session.id)}
                      onDelete={onDeleteSession ? () => onDeleteSession(session.id) : undefined}
                      onRename={onRenameSession ? (title) => onRenameSession(session.id, title) : undefined}
                      relativeDateLabel={relativeDateLabel}
                    />
                    <button
                      onClick={() => togglePin(session.id)}
                      title="Pin"
                      className="absolute right-8 top-2.5 p-1 rounded opacity-0 group-hover/pin:opacity-100 hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--oracle-primary-container,#c6a76e)] transition-all"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ))}

            {/* Infinite-scroll sentinel — when this enters the viewport
                AND the user has scrolled at least once, we grow the slice
                by another VISIBLE_PAGE. The wording shifts between "Scroll
                for more" and "Loading more…" so the user understands the
                pagination model instead of seeing a perpetual "loading"
                placeholder. */}
            {hasMoreUnpinned && (
              <div ref={loadMoreRef} className="px-3 py-3" aria-busy={loadingMore}>
                <div className="space-y-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 rounded-full bg-[var(--border-default)]/60 ${loadingMore ? "lex-skeleton-shimmer" : "opacity-40"}`}
                      style={{ width: `${60 + (i * 10) % 30}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 text-center text-[10px] text-[var(--text-muted)]">
                  {loadingMore ? "Loading more…" : "Scroll for more"} · {unpinnedFlat.length - unpinnedSliced.length} left
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--oracle-outline-variant,#d0c5b6)]/20 mx-4" />

      {/* Bottom section: Credit meter + Upgrade */}
      <div className="px-4 py-4 flex-shrink-0 space-y-3">
        {creditsLoading ? (
          // Skeleton while the first credits fetch is in flight. Replaces
          // the "0 / 0" flash that briefly showed on every page mount.
          <div className="px-1" aria-busy="true" aria-live="polite">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <Zap className="w-2.5 h-2.5 text-[var(--accent)]" />
                Credits
              </div>
              <span className="h-3 w-14 rounded-full bg-[var(--border-default)] lex-skeleton-shimmer" />
            </div>
            <div className="h-1 w-full rounded-full bg-[var(--border-default)]/40 overflow-hidden lex-skeleton-shimmer" />
          </div>
        ) : typeof creditBalance === "number" && (
          <div className="px-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <Zap className="w-2.5 h-2.5 text-[var(--accent)]" />
                Credits
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {creditBalance.toLocaleString("en-IN")} / {(creditCeiling ?? creditBalance).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-[var(--oracle-outline-variant,#d0c5b6)]/30 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  creditBalance <= 0
                    ? "bg-red-500"
                    : creditBalance / Math.max(1, creditCeiling ?? creditBalance) < 0.2
                    ? "bg-amber-500"
                    : "bg-[var(--accent)]"
                }`}
                style={{
                  width: `${Math.max(
                    creditBalance > 0 ? 4 : 0,
                    Math.min(100, (creditBalance / Math.max(1, creditCeiling ?? creditBalance)) * 100)
                  )}%`,
                }}
              />
            </div>
            {creditBalance <= 0 && (
              <p className="mt-1 text-[10px] text-red-500">Out of credits — top up to continue.</p>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={onUpgrade}
          className="block w-full py-3 rounded-xl text-sm font-semibold text-[var(--lex-rust)] border-2 border-[var(--lex-rust)]/40 bg-[var(--lex-cream-deep)] hover:bg-[var(--lex-rust)] hover:text-[var(--lex-cream)] hover:border-[var(--lex-rust)] transition-all text-center"
        >
          Top Up
        </button>
      </div>
    </div>
  );
}

export default function HistorySidebar(props: HistorySidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={props.open} onOpenChange={(open) => !open && props.onToggle()}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-[var(--bg-surface)] border-r border-[var(--border-default)]"
        >
          <SidebarContent {...props} onClose={props.onToggle} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-200 ease-in-out ${
        props.open ? "w-64" : "w-0"
      }`}
    >
      {props.open && <SidebarContent {...props} onClose={props.onToggle} />}
    </aside>
  );
}
