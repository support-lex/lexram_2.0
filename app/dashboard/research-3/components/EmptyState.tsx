"use client";

import { Search, FileSearch, FileText } from "lucide-react";
import { UNIFIED_QUICK_STARTS } from "../types";

const CATEGORY_ICONS = {
  Search,
  FileSearch,
  FileText,
};

interface EmptyStateProps {
  onPickQuickStart: (query: string) => void;
  onUpload: () => void;
}

/**
 * Empty-state hero shown above the chat input when there are no messages yet.
 * NOTE: this component intentionally does NOT render the chat input — the
 * input is hoisted up to page.tsx so it stays at a fixed position when
 * transitioning from "no messages" to "has messages".
 */
export default function EmptyState({ onPickQuickStart, onUpload }: EmptyStateProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--surface-glass),_transparent_60%)]">
      <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-6 gap-6 sm:gap-8 py-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-primary)] mb-2">
            What can I help with?
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Research Indian case law, analyze documents, or draft legal content
          </p>
        </div>

        {/* Quick-start cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl stagger-children">
          {UNIFIED_QUICK_STARTS.map((category) => {
            const Icon =
              CATEGORY_ICONS[category.icon as keyof typeof CATEGORY_ICONS] ?? Search;
            return (
              <div
                key={category.id}
                className="rounded-xl ring-1 ring-[var(--border-default)] bg-[var(--bg-surface)] hover:ring-[var(--accent)]/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {category.title}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {category.subtitle}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {category.chips.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => {
                        if (chip.action === "upload") {
                          onUpload();
                        } else if (chip.query) {
                          onPickQuickStart(chip.query);
                        }
                      }}
                      className="text-left text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] px-2.5 py-1.5 rounded-lg transition-colors truncate"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
