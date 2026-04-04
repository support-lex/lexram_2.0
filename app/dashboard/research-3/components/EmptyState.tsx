"use client";

import { Search, FileSearch, FileText } from "lucide-react";
import type { QuickStartCategory } from "../types";
import { UNIFIED_QUICK_STARTS } from "../types";
import ChatInput from "./ChatInput";
import type { ComponentProps } from "react";

type ChatInputProps = ComponentProps<typeof ChatInput>;

const CATEGORY_ICONS = {
  Search,
  FileSearch,
  FileText,
};

type EmptyStateProps = Omit<ChatInputProps, "hasThread">;

export default function EmptyState(props: EmptyStateProps) {
  return (
    <div
      className="flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--surface-glass),_transparent_60%)]"
      {...props.dropHandlers}
    >
      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 pb-4">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)] mb-2">
            What can I help with?
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Research Indian case law, analyze documents, or draft legal content
          </p>
        </div>

        {/* Quick-start cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl stagger-children">
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
                          props.fileInputRef.current?.click();
                        } else if (chip.query) {
                          props.setQuery(chip.query);
                          setTimeout(() => props.queryTextareaRef.current?.focus(), 0);
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

      {/* Input at bottom */}
      <ChatInput {...props} hasThread={false} />
    </div>
  );
}
