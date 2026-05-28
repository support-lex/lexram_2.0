"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  PanelLeftClose,
  SquarePen,
  Search,
  Settings,
  Trash2,
  MessageSquare,
  Pencil,
  Pin,
  PinOff,
  MoreHorizontal,
  Check,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

export interface ChatItem {
  id: string;
  title: string;
  /** ISO timestamp used for date bucketing. */
  updatedAt: string;
}

export interface ChatLayoutUser {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface ChatLayoutSidebarProps {
  chats: ChatItem[];
  activeChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteChat?: (id: string) => void;
  onRenameChat?: (id: string, title: string) => void;
  /** Ids that should appear in a "Pinned" section above the date buckets. */
  pinnedIds?: string[];
  onTogglePin?: (id: string) => void;
  onOpenSettings?: () => void;
  user?: ChatLayoutUser;
  /** Called by the in-sidebar collapse/close button. */
  onClose: () => void;
  /** Affects the close button's aria-label. */
  isMobile: boolean;
  className?: string;
}

const BUCKETS = ["Today", "Yesterday", "Previous 7 days", "Earlier"] as const;
type Bucket = (typeof BUCKETS)[number];

function bucketize(chats: ChatItem[]): Record<Bucket, ChatItem[]> {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86_400_000;
  const startWeek = startToday - 7 * 86_400_000;
  const out: Record<Bucket, ChatItem[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Earlier: [],
  };
  for (const c of chats) {
    const t = new Date(c.updatedAt).getTime();
    if (Number.isNaN(t)) out.Earlier.push(c);
    else if (t >= startToday) out.Today.push(c);
    else if (t >= startYesterday) out.Yesterday.push(c);
    else if (t >= startWeek) out["Previous 7 days"].push(c);
    else out.Earlier.push(c);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Per-row menu (Rename / Pin / Delete) — anchored by the kebab button
// ────────────────────────────────────────────────────────────────────────────

interface RowMenuProps {
  open: boolean;
  pinned: boolean;
  canRename: boolean;
  canPin: boolean;
  canDelete: boolean;
  onClose: () => void;
  onRename: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

function RowMenu({
  open,
  pinned,
  canRename,
  canPin,
  canDelete,
  onClose,
  onRename,
  onTogglePin,
  onDelete,
}: RowMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Chat actions"
      className="absolute right-0 top-full mt-1 z-30 w-44 rounded-lg border border-zinc-200 bg-white shadow-lg py-1 motion-reduce:transition-none"
    >
      {canRename && (
        <button
          type="button"
          role="menuitem"
          onClick={(e) => {
            e.stopPropagation();
            onRename();
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none"
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden /> Rename
        </button>
      )}
      {canPin && (
        <button
          type="button"
          role="menuitem"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none"
        >
          {pinned ? (
            <>
              <PinOff className="w-3.5 h-3.5" aria-hidden /> Unpin
            </>
          ) : (
            <>
              <Pin className="w-3.5 h-3.5" aria-hidden /> Pin
            </>
          )}
        </button>
      )}
      {canDelete && (
        <>
          {(canRename || canPin) && <div className="my-1 h-px bg-zinc-100" aria-hidden />}
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden /> Delete
          </button>
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Conversation row — selectable, renameable, pinnable, deletable
// ────────────────────────────────────────────────────────────────────────────

interface ConversationRowProps {
  chat: ChatItem;
  isActive: boolean;
  isPinned: boolean;
  canRename: boolean;
  canPin: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (next: string) => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

function ConversationRow({
  chat,
  isActive,
  isPinned,
  canRename,
  canPin,
  canDelete,
  onSelect,
  onRename,
  onTogglePin,
  onDelete,
}: ConversationRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(chat.title);
      const id = window.setTimeout(() => inputRef.current?.select(), 0);
      return () => window.clearTimeout(id);
    }
  }, [editing, chat.title]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== chat.title) onRename(trimmed);
    setEditing(false);
  }, [draft, chat.title, onRename]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") commit();
    else if (e.key === "Escape") {
      setEditing(false);
      setDraft(chat.title);
    }
  };

  const handleContextMenu = (e: ReactMouseEvent<HTMLLIElement>) => {
    if (!canRename && !canPin && !canDelete) return;
    e.preventDefault();
    setMenuOpen(true);
  };

  return (
    <li
      className="group/item relative"
      onContextMenu={handleContextMenu}
    >
      {editing ? (
        <div className="flex items-center gap-2 rounded-md pl-2 pr-2 py-1.5 bg-zinc-100">
          {isPinned && <Pin className="w-3 h-3 text-zinc-500 shrink-0" aria-hidden />}
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={commit}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Rename chat: ${chat.title}`}
            className="flex-1 min-w-0 bg-white border border-zinc-300 rounded px-1.5 py-0.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              commit();
            }}
            aria-label="Save"
            className="w-6 h-6 rounded grid place-items-center text-zinc-600 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <Check className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onSelect}
            aria-current={isActive ? "page" : undefined}
            title={chat.title}
            className={[
              "w-full text-left flex items-center gap-2 rounded-md pl-2 pr-8 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 motion-reduce:transition-none",
              isActive
                ? "bg-zinc-200/70 text-zinc-900 font-medium"
                : "text-zinc-700 hover:bg-zinc-200/50",
            ].join(" ")}
          >
            {isPinned && (
              <Pin
                className={`w-3 h-3 shrink-0 ${isActive ? "text-zinc-700" : "text-zinc-400"}`}
                aria-label="Pinned"
              />
            )}
            <span className="flex-1 truncate group-hover/item:whitespace-normal group-hover/item:overflow-visible group-hover/item:text-clip group-hover/item:break-words">
              {chat.title}
            </span>
          </button>

          {(canRename || canPin || canDelete) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              aria-label={`Open actions for ${chat.title}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 data-[open=true]:opacity-100 w-7 h-7 rounded-md grid place-items-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 transition-opacity motion-reduce:transition-none"
              data-open={menuOpen}
            >
              <MoreHorizontal className="w-4 h-4" aria-hidden />
            </button>
          )}

          <RowMenu
            open={menuOpen}
            pinned={isPinned}
            canRename={canRename}
            canPin={canPin}
            canDelete={canDelete}
            onClose={() => setMenuOpen(false)}
            onRename={() => setEditing(true)}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
          />
        </>
      )}
    </li>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sidebar (no branding — icons + threads only)
// ────────────────────────────────────────────────────────────────────────────

export default function ChatLayoutSidebar({
  chats,
  activeChatId = null,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  pinnedIds,
  onTogglePin,
  onOpenSettings,
  user,
  onClose,
  isMobile,
  className = "",
}: ChatLayoutSidebarProps) {
  const [search, setSearch] = useState("");

  const pinnedSet = useMemo(() => new Set(pinnedIds ?? []), [pinnedIds]);

  const { pinned, unpinnedBuckets } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? chats.filter((c) => c.title.toLowerCase().includes(q))
      : chats;
    const pinnedItems: ChatItem[] = [];
    const others: ChatItem[] = [];
    for (const c of filtered) {
      if (pinnedSet.has(c.id)) pinnedItems.push(c);
      else others.push(c);
    }
    return { pinned: pinnedItems, unpinnedBuckets: bucketize(others) };
  }, [chats, search, pinnedSet]);

  return (
    <div
      className={[
        "flex flex-col h-full w-[280px] bg-zinc-50 border-r border-zinc-200",
        className,
      ].join(" ")}
    >
      {/* Top action row — no branding text, no logo. */}
      <div className="flex items-center gap-1 px-2 h-12 shrink-0">
        <button
          type="button"
          onClick={onNewChat}
          aria-label="Start a new chat"
          className="flex items-center gap-2 flex-1 min-w-0 rounded-lg px-2.5 py-2 text-sm text-zinc-700 hover:bg-zinc-200/70 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 transition-colors motion-reduce:transition-none"
        >
          <SquarePen className="w-4 h-4 shrink-0" aria-hidden />
          <span className="truncate">New chat</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={isMobile ? "Close sidebar" : "Collapse sidebar"}
          title={isMobile ? "Close sidebar" : "Collapse sidebar (⌘B)"}
          className="w-9 h-9 rounded-lg grid place-items-center text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 transition-colors shrink-0 motion-reduce:transition-none"
        >
          <PanelLeftClose className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 pb-2 shrink-0">
        <label className="sr-only" htmlFor="chat-history-search">
          Search chats
        </label>
        <div className="relative">
          <Search
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            aria-hidden
          />
          <input
            id="chat-history-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="w-full pl-8 pr-2.5 py-1.5 rounded-md bg-zinc-200/40 placeholder:text-zinc-400 text-sm text-zinc-900 outline-none focus:bg-zinc-200/70 focus:ring-2 focus:ring-zinc-300 transition-colors motion-reduce:transition-none"
          />
        </div>
      </div>

      {/* Threads list */}
      <nav
        aria-label="Chat history"
        className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-3"
      >
        {chats.length === 0 ? (
          <div className="px-3 py-12 text-center text-xs text-zinc-400">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" aria-hidden />
            No chats yet
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <section aria-label="Pinned">
                <h3 className="px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
                  <Pin className="w-3 h-3" aria-hidden /> Pinned
                </h3>
                <ul className="space-y-0.5">
                  {pinned.map((c) => (
                    <ConversationRow
                      key={c.id}
                      chat={c}
                      isActive={activeChatId === c.id}
                      isPinned
                      canRename={!!onRenameChat}
                      canPin={!!onTogglePin}
                      canDelete={!!onDeleteChat}
                      onSelect={() => onSelectChat?.(c.id)}
                      onRename={(next) => onRenameChat?.(c.id, next)}
                      onTogglePin={() => onTogglePin?.(c.id)}
                      onDelete={() => onDeleteChat?.(c.id)}
                    />
                  ))}
                </ul>
              </section>
            )}

            {BUCKETS.map((label) => {
              const items = unpinnedBuckets[label];
              if (!items || items.length === 0) return null;
              return (
                <section key={label} aria-label={label}>
                  <h3 className="px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                    {label}
                  </h3>
                  <ul className="space-y-0.5">
                    {items.map((c) => (
                      <ConversationRow
                        key={c.id}
                        chat={c}
                        isActive={activeChatId === c.id}
                        isPinned={false}
                        canRename={!!onRenameChat}
                        canPin={!!onTogglePin}
                        canDelete={!!onDeleteChat}
                        onSelect={() => onSelectChat?.(c.id)}
                        onRename={(next) => onRenameChat?.(c.id, next)}
                        onTogglePin={() => onTogglePin?.(c.id)}
                        onDelete={() => onDeleteChat?.(c.id)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer: settings + user */}
      <footer className="p-2 border-t border-zinc-200/80 shrink-0">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          className="flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-sm text-zinc-700 hover:bg-zinc-200/50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 transition-colors motion-reduce:transition-none"
        >
          <Settings className="w-4 h-4 shrink-0" aria-hidden />
          <span className="truncate">Settings</span>
        </button>
        {user && (
          <button
            type="button"
            aria-label={`Account: ${user.name ?? user.email ?? "You"}`}
            className="mt-1 w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-200/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 transition-colors text-left motion-reduce:transition-none"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 grid place-items-center text-white text-xs font-semibold shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                (user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-sm font-medium text-zinc-900 truncate">
                {user.name ?? "You"}
              </div>
              {user.email && (
                <div className="text-[11px] text-zinc-500 truncate">{user.email}</div>
              )}
            </div>
          </button>
        )}
      </footer>
    </div>
  );
}
