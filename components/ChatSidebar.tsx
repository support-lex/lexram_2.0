"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
  Search,
  Settings,
  Trash2,
  MessageSquare,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

export interface ChatItem {
  id: string;
  title: string;
  /** ISO timestamp of last activity, used for date bucketing. */
  updatedAt: string;
}

export interface ChatSidebarUser {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface ChatSidebarProps {
  chats: ChatItem[];
  activeChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteChat?: (id: string) => void;
  user?: ChatSidebarUser;
  /** Defaults to "ChatApp" — set to your product name. */
  brand?: string;
  className?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Tunables
// ────────────────────────────────────────────────────────────────────────────

const LS_KEY = "chat-sidebar:open";
const MOBILE_BREAKPOINT_PX = 768;
const WIDTH_COLLAPSED = 64;
const WIDTH_EXPANDED = 280;

// ────────────────────────────────────────────────────────────────────────────
// Persisted open/close state
// ────────────────────────────────────────────────────────────────────────────

function useSidebarState(defaultOpen = true) {
  // Render `defaultOpen` on first paint to avoid SSR/CSR markup mismatch.
  // Hydrate from localStorage on mount, then mirror every subsequent change.
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const hydratedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw === "0" || raw === "1") setIsOpen(raw === "1");
    } catch {
      /* private mode or storage disabled — fall back to default */
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(LS_KEY, isOpen ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [isOpen]);

  return {
    isOpen,
    open: useCallback(() => setIsOpen(true), []),
    close: useCallback(() => setIsOpen(false), []),
    toggle: useCallback(() => setIsOpen((v) => !v), []),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Mobile detection (matchMedia)
// ────────────────────────────────────────────────────────────────────────────

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isMobile;
}

// ────────────────────────────────────────────────────────────────────────────
// Date bucketing — Today / Yesterday / Previous 7 days / Earlier
// ────────────────────────────────────────────────────────────────────────────

const BUCKET_ORDER = ["Today", "Yesterday", "Previous 7 days", "Earlier"] as const;

function bucketize(chats: ChatItem[]): Record<(typeof BUCKET_ORDER)[number], ChatItem[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const startOfWeekAgo = startOfToday - 7 * 86_400_000;
  const out: Record<string, ChatItem[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Earlier: [],
  };
  for (const c of chats) {
    const t = new Date(c.updatedAt).getTime();
    if (Number.isNaN(t)) {
      out.Earlier.push(c);
    } else if (t >= startOfToday) out.Today.push(c);
    else if (t >= startOfYesterday) out.Yesterday.push(c);
    else if (t >= startOfWeekAgo) out["Previous 7 days"].push(c);
    else out.Earlier.push(c);
  }
  return out as Record<(typeof BUCKET_ORDER)[number], ChatItem[]>;
}

// ────────────────────────────────────────────────────────────────────────────
// Reusable nav row — collapsed = icon-only with tooltip, expanded = icon+label
// ────────────────────────────────────────────────────────────────────────────

interface NavRowProps {
  icon: ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick?: () => void;
  /** Optional keyboard hint to render in the tooltip ("⌘B"). */
  hint?: string;
}

function NavRow({ icon, label, collapsed, active, onClick, hint }: NavRowProps) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={collapsed ? undefined : label}
        className={[
          "flex items-center gap-3 w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
          active
            ? "bg-zinc-200/70 text-zinc-900 font-medium"
            : "text-zinc-700 hover:bg-zinc-200/50 hover:text-zinc-900",
          collapsed ? "justify-center" : "",
        ].join(" ")}
      >
        <span className="shrink-0 w-5 h-5 grid place-items-center">{icon}</span>
        <span
          className={[
            "flex-1 text-left truncate transition-[opacity,width] duration-150",
            collapsed ? "w-0 opacity-0 pointer-events-none" : "opacity-100",
          ].join(" ")}
        >
          {label}
        </span>
      </button>
      {/* Tooltip: only when collapsed. Pure CSS hover, no portal needed. */}
      {collapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-zinc-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg flex items-center gap-2"
        >
          {label}
          {hint && (
            <kbd className="text-[10px] font-mono text-zinc-300 border border-zinc-700 rounded px-1 py-px">
              {hint}
            </kbd>
          )}
        </span>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────

export default function ChatSidebar({
  chats,
  activeChatId = null,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  user,
  brand = "ChatApp",
  className = "",
}: ChatSidebarProps) {
  const { isOpen, toggle, close } = useSidebarState(true);
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Keyboard shortcut: Ctrl/Cmd + B toggles ──────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // ── Close on Escape (mobile) ─────────────────────────────────────────────
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isMobile, isOpen, close]);

  // ── Filter + bucket the chat list ────────────────────────────────────────
  const buckets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? chats.filter((c) => c.title.toLowerCase().includes(q))
      : chats;
    return bucketize(list);
  }, [chats, search]);

  const collapsed = !isOpen;

  return (
    <>
      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      {/* ── Floating opener (mobile, when sidebar is closed) ───────────── */}
      {isMobile && !isOpen && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Open sidebar"
          className="fixed top-3 left-3 z-30 w-9 h-9 rounded-lg bg-white shadow ring-1 ring-zinc-200 grid place-items-center text-zinc-700 hover:bg-zinc-50 md:hidden"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      <aside
        aria-label="Chat history"
        className={[
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-[280px] bg-zinc-50 transform transition-transform duration-300 ease-out ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "relative bg-zinc-50 border-r border-zinc-200 h-screen transition-[width] duration-300 ease-out overflow-hidden shrink-0",
          className,
        ].join(" ")}
        style={isMobile ? undefined : { width: collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED }}
      >
        <div className="flex flex-col h-full">
          {/* ── Header: brand + collapse toggle ──────────────────────── */}
          <header className="flex items-center px-3 h-14 shrink-0 gap-2">
            <div
              className={[
                "flex items-center gap-2 min-w-0 transition-[opacity,width] duration-150",
                collapsed ? "w-0 opacity-0 pointer-events-none" : "opacity-100",
              ].join(" ")}
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-900 grid place-items-center text-white text-[11px] font-bold shrink-0">
                AI
              </div>
              <span className="font-semibold text-zinc-900 truncate">{brand}</span>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
              title={collapsed ? "Open sidebar (⌘B)" : "Close sidebar (⌘B)"}
              className="ml-auto w-9 h-9 rounded-lg grid place-items-center text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 transition-colors shrink-0"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </header>

          {/* ── Top actions: New chat + Search ───────────────────────── */}
          <div className="px-2 space-y-0.5">
            <NavRow
              icon={<SquarePen className="w-4 h-4" />}
              label="New chat"
              collapsed={collapsed}
              onClick={onNewChat}
            />

            {collapsed ? (
              <NavRow
                icon={<Search className="w-4 h-4" />}
                label="Search chats"
                collapsed
                onClick={() => {
                  toggle();
                  // Focus the input after the expand animation has run.
                  window.setTimeout(() => searchRef.current?.focus(), 320);
                }}
              />
            ) : (
              <div className="px-1.5 pt-2 pb-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search chats"
                    aria-label="Search chats"
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-md bg-zinc-200/40 placeholder:text-zinc-400 text-sm text-zinc-900 outline-none focus:bg-zinc-200/70 focus:ring-2 focus:ring-zinc-300 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Chat list (hidden when collapsed) ────────────────────── */}
          <nav
            className={[
              "flex-1 overflow-y-auto px-2 py-2 space-y-3 transition-opacity duration-150",
              collapsed ? "opacity-0 pointer-events-none" : "opacity-100",
            ].join(" ")}
            aria-hidden={collapsed}
          >
            {chats.length === 0 ? (
              <div className="px-3 py-10 text-center text-xs text-zinc-400">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                No chats yet
              </div>
            ) : (
              BUCKET_ORDER.map((label) => {
                const items = buckets[label];
                if (!items || items.length === 0) return null;
                return (
                  <div key={label}>
                    <h3 className="px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                      {label}
                    </h3>
                    <ul className="space-y-0.5">
                      {items.map((c) => (
                        <li key={c.id} className="group/item relative">
                          <button
                            type="button"
                            onClick={() => onSelectChat?.(c.id)}
                            className={[
                              "w-full text-left flex items-center gap-2 rounded-md pl-2 pr-8 py-1.5 text-sm transition-colors",
                              activeChatId === c.id
                                ? "bg-zinc-200/70 text-zinc-900 font-medium"
                                : "text-zinc-700 hover:bg-zinc-200/50",
                            ].join(" ")}
                            title={c.title}
                          >
                            <span className="flex-1 truncate">{c.title}</span>
                          </button>
                          {onDeleteChat && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(c.id);
                              }}
                              aria-label={`Delete ${c.title}`}
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 focus:opacity-100 w-7 h-7 rounded-md grid place-items-center text-zinc-500 hover:text-red-600 hover:bg-zinc-200/70 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </nav>

          {/* ── Footer: settings + user ──────────────────────────────── */}
          <footer className="p-2 border-t border-zinc-200/80 shrink-0">
            <NavRow
              icon={<Settings className="w-4 h-4" />}
              label="Settings"
              collapsed={collapsed}
            />
            {user && (
              <div
                className={[
                  "mt-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-200/50 cursor-pointer transition-colors",
                  collapsed ? "justify-center" : "",
                ].join(" ")}
                title={collapsed ? user.name ?? user.email ?? "You" : undefined}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 grid place-items-center text-white text-xs font-semibold shrink-0 overflow-hidden">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()
                  )}
                </div>
                <div
                  className={[
                    "flex-1 min-w-0 leading-tight transition-[opacity,width] duration-150",
                    collapsed ? "w-0 opacity-0 pointer-events-none" : "opacity-100",
                  ].join(" ")}
                >
                  <div className="text-sm font-medium text-zinc-900 truncate">
                    {user.name ?? "You"}
                  </div>
                  {user.email && (
                    <div className="text-[11px] text-zinc-500 truncate">{user.email}</div>
                  )}
                </div>
              </div>
            )}
          </footer>
        </div>
      </aside>
    </>
  );
}
