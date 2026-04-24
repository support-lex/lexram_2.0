"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useRef, useState } from "react";
import { Search, X, MessageSquare, SquarePen, Trash2, Pencil, Check } from "lucide-react";
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
      onKeyDown={(e) => { if (!editing && (e.key === "Enter" || e.key === " ")) onSelect(); }}
    >
      {isActive && (
        <div className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full bg-[var(--accent)]" />
      )}
      <MessageSquare
        className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
          isActive
            ? "text-[var(--accent)]"
            : "text-[var(--text-muted)] group-hover/item:text-[var(--text-secondary)]"
        }`}
      />
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
            className={`text-[13px] truncate font-medium leading-5 ${
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
}: HistorySidebarProps & { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Conversations
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewSession}
            title="New conversation"
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            <SquarePen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2.5 flex-shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-default)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/60 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 custom-scrollbar">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
            <MessageSquare className="w-6 h-6 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-muted)]">
              No conversations yet.
              <br />
              Ask a question to start.
            </p>
          </div>
        ) : (
          Object.entries(groupedSessions).map(([group, sessions]) => (
            <div key={group} className="mb-3">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {group}
              </div>
              {sessions.map((session) => (
                <ConversationItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  onSelect={() => onSelectSession(session.id)}
                  onDelete={onDeleteSession ? () => onDeleteSession(session.id) : undefined}
                  onRename={onRenameSession ? (title) => onRenameSession(session.id, title) : undefined}
                  relativeDateLabel={relativeDateLabel}
                />
              ))}
            </div>
          ))
        )}
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
      className={`hidden lg:flex flex-col flex-shrink-0 overflow-hidden transition-all duration-200 ease-in-out border-r border-[var(--border-default)] bg-[var(--bg-surface)] ${
        props.open ? "w-60" : "w-0"
      }`}
    >
      {props.open && <SidebarContent {...props} onClose={props.onToggle} />}
    </aside>
  );
}
