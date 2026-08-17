"use client";

import { Menu, PanelLeftOpen, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ChatLayoutSidebar, {
  type ChatItem,
  type ChatLayoutSidebarProps,
  type ChatLayoutUser,
} from "./ChatLayoutSidebar";
import { useChatSidebar } from "./use-chat-sidebar";

export type { ChatItem, ChatLayoutUser };

export interface ChatLayoutProps
  extends Omit<ChatLayoutSidebarProps, "onClose" | "isMobile" | "className"> {
  /** Title shown in the header (typically the active chat's title). */
  title?: ReactNode;
  /** Right-side header actions (Share, More menu, etc). */
  headerActions?: ReactNode;
  /** Scrollable chat thread (messages). */
  children: ReactNode;
  /** Sticky input bar (textarea + send button + chips). */
  input: ReactNode;
}

const DESKTOP_SIDEBAR_W = 280;
const UNDO_TIMEOUT_MS = 5000;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Full-screen, three-region chat layout: Sidebar | (Header + Thread + Input).
 *
 * v2 features:
 * - Focus trap on the mobile drawer (Tab/Shift+Tab cycle within the panel,
 *   focus is restored to the trigger when the drawer closes).
 * - Optimistic delete with an undo toast — `onDeleteChat` is debounced 5 s so
 *   accidental clicks can be reverted before the parent commits the deletion.
 * - `prefers-reduced-motion` respected via `motion-reduce:` class variants.
 */
export default function ChatLayout({
  title,
  headerActions,
  children,
  input,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  pinnedIds,
  onTogglePin,
  onOpenSettings,
  user,
}: ChatLayoutProps) {
  const sidebar = useChatSidebar({ defaultOpen: true });
  const sidebarId = useId();
  const sidebarRef = useRef<HTMLElement>(null);
  const lastFocusedTriggerRef = useRef<HTMLElement | null>(null);

  // ── Focus trap on the mobile drawer ──────────────────────────────────────
  // Saves the previously focused element on open, focuses the first focusable
  // inside the sidebar, and cycles Tab/Shift+Tab within the panel. Restores
  // focus to the trigger when the drawer closes.
  useEffect(() => {
    if (!sidebar.isMobile) return;
    if (!sidebar.isOpen) {
      // Drawer just closed — restore focus to whoever opened it.
      const last = lastFocusedTriggerRef.current;
      if (last && document.contains(last)) last.focus({ preventScroll: true });
      lastFocusedTriggerRef.current = null;
      return;
    }

    lastFocusedTriggerRef.current = document.activeElement as HTMLElement | null;

    const aside = sidebarRef.current;
    if (!aside) return;

    // Defer the initial focus to the next tick so the slide-in animation
    // doesn't fight with the focus shift.
    const focusInitial = window.setTimeout(() => {
      const first = aside.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = aside.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !aside.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusInitial);
      document.removeEventListener("keydown", onKey);
    };
  }, [sidebar.isMobile, sidebar.isOpen]);

  // ── Optimistic delete + undo toast ───────────────────────────────────────
  // The parent's `chats` prop is the source of truth. While the undo window
  // is open, we hide a chat from the rendered list and show a toast with an
  // Undo button. After UNDO_TIMEOUT_MS we call `onDeleteChat` for real; if
  // the user clicks Undo first, the timer is cleared and the chat re-appears.
  type PendingDelete = {
    chat: ChatItem;
    timer: number;
  };
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  // Cleanup the pending timer on unmount or when a new pending overrides it.
  const clearPendingTimer = useCallback(() => {
    setPendingDelete((prev) => {
      if (prev) window.clearTimeout(prev.timer);
      return null;
    });
  }, []);

  useEffect(() => () => clearPendingTimer(), [clearPendingTimer]);

  const handleDelete = useCallback(
    (id: string) => {
      if (!onDeleteChat) return;
      const chat = chats.find((c) => c.id === id);
      if (!chat) return;
      // If a previous undo window is still open, commit that one immediately
      // before opening a new one — keeps the parent's list consistent.
      setPendingDelete((prev) => {
        if (prev) {
          window.clearTimeout(prev.timer);
          onDeleteChat(prev.chat.id);
        }
        const timer = window.setTimeout(() => {
          onDeleteChat(chat.id);
          setPendingDelete(null);
        }, UNDO_TIMEOUT_MS);
        return { chat, timer };
      });
    },
    [chats, onDeleteChat]
  );

  const handleUndoDelete = useCallback(() => {
    setPendingDelete((prev) => {
      if (prev) window.clearTimeout(prev.timer);
      return null;
    });
  }, []);

  // Filter out the pending-delete chat so the list looks deleted while undo
  // is available; the chat returns to its place if the user undoes.
  const visibleChats = pendingDelete
    ? chats.filter((c) => c.id !== pendingDelete.chat.id)
    : chats;

  // Mobile sidebar always renders at full 280 px (transformed off-screen
  // when closed). Desktop animates the wrapper width 0 ↔ 280; the inner
  // panel is a fixed 280 so its layout doesn't reflow during the slide.
  const desktopWidth = sidebar.isOpen ? DESKTOP_SIDEBAR_W : 0;

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-50 text-zinc-900 antialiased">
      {/* Skip-to-content for keyboard users */}
      <a
        href="#chat-thread"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-zinc-900 focus:text-white focus:px-3 focus:py-1.5 focus:text-sm"
      >
        Skip to chat
      </a>

      {/* Mobile backdrop */}
      {sidebar.isMobile && sidebar.isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none lg:hidden"
          onClick={sidebar.close}
          aria-hidden
        />
      )}

      {/* Sidebar wrapper. On desktop, animates width; on mobile, animates transform. */}
      <aside
        ref={sidebarRef}
        id={sidebarId}
        aria-label="Chat history"
        aria-hidden={!sidebar.isOpen}
        role={sidebar.isMobile ? "dialog" : undefined}
        aria-modal={sidebar.isMobile && sidebar.isOpen ? true : undefined}
        className={
          sidebar.isMobile
            ? `fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-200 ease-out motion-reduce:transition-none ${
                sidebar.isOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "relative h-full overflow-hidden shrink-0 transition-[width] duration-200 ease-out motion-reduce:transition-none"
        }
        style={sidebar.isMobile ? undefined : { width: desktopWidth }}
      >
        <ChatLayoutSidebar
          chats={visibleChats}
          activeChatId={activeChatId}
          onSelectChat={(id) => {
            onSelectChat?.(id);
            if (sidebar.isMobile) sidebar.close();
          }}
          onNewChat={() => {
            onNewChat?.();
            if (sidebar.isMobile) sidebar.close();
          }}
          onDeleteChat={onDeleteChat ? handleDelete : undefined}
          onRenameChat={onRenameChat}
          pinnedIds={pinnedIds}
          onTogglePin={onTogglePin}
          onOpenSettings={onOpenSettings}
          user={user}
          onClose={sidebar.close}
          isMobile={sidebar.isMobile}
        />
      </aside>

      {/* Main column */}
      <div className="flex flex-1 min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 px-3 lg:px-6 h-14 border-b border-zinc-200 bg-white/85 backdrop-blur-md">
          {(!sidebar.isOpen || sidebar.isMobile) && (
            <button
              type="button"
              onClick={sidebar.toggle}
              aria-label={sidebar.isOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={sidebar.isOpen}
              aria-controls={sidebarId}
              title={
                sidebar.isMobile
                  ? sidebar.isOpen
                    ? "Close sidebar"
                    : "Open sidebar"
                  : sidebar.isOpen
                    ? "Close sidebar (⌘B)"
                    : "Open sidebar (⌘B)"
              }
              className="w-9 h-9 rounded-lg grid place-items-center text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 transition-colors shrink-0 motion-reduce:transition-none"
            >
              {sidebar.isMobile ? (
                <Menu className="w-5 h-5" aria-hidden />
              ) : (
                <PanelLeftOpen className="w-4 h-4" aria-hidden />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0 truncate text-sm font-medium text-zinc-900">
            {title}
          </div>

          {headerActions && (
            <div className="flex items-center gap-1 shrink-0">{headerActions}</div>
          )}
        </header>

        {/* Scrollable chat thread */}
        <main
          id="chat-thread"
          tabIndex={-1}
          aria-label="Chat conversation"
          className="flex-1 min-h-0 overflow-y-auto focus:outline-none"
        >
          {children}
        </main>

        {/* Input row pinned to the bottom by virtue of being the last flex child. */}
        <div className="shrink-0 border-t border-zinc-200 bg-white">{input}</div>
      </div>

      {/* Undo toast for optimistic delete */}
      {pendingDelete && (
        <UndoDeleteToast
          title={pendingDelete.chat.title}
          onUndo={handleUndoDelete}
          onDismiss={() => {
            // Dismissing skips the wait and commits the delete immediately.
            window.clearTimeout(pendingDelete.timer);
            onDeleteChat?.(pendingDelete.chat.id);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Undo toast — fixed bottom-center, polite live region for screen readers
// ────────────────────────────────────────────────────────────────────────────

function UndoDeleteToast({
  title,
  onUndo,
  onDismiss,
}: {
  title: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 bottom-4 z-[70] -translate-x-1/2 flex items-center gap-3 rounded-full bg-zinc-900 text-white shadow-lg px-4 py-2 text-sm motion-reduce:transition-none"
    >
      <span className="truncate max-w-[260px]">
        Deleted &ldquo;{title}&rdquo;
      </span>
      <button
        type="button"
        onClick={onUndo}
        className="font-semibold text-zinc-100 hover:text-white underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 rounded"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="w-6 h-6 rounded-full grid place-items-center text-zinc-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
      >
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  );
}
