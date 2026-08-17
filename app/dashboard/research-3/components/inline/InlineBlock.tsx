"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface InlineBlockProps {
  icon: ReactNode;
  label: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Visually-separated, collapsible container used inside an AI message bubble
 * to host an inline UI block (mind map, authorities list, draft editor).
 */
export default function InlineBlock({
  icon,
  label,
  count,
  defaultOpen = true,
  children,
}: InlineBlockProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="my-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-colors"
      >
        <span className="text-[var(--accent)] flex-shrink-0">{icon}</span>
        <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">
          {label}
          {typeof count === "number" && count > 0 && (
            <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">
              ({count})
            </span>
          )}
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        )}
      </button>
      {open && (
        <div className="border-t border-[var(--border-default)] px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
