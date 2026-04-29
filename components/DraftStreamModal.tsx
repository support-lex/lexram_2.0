"use client";

import { lazy, Suspense } from "react";
import { X, Loader2 } from "lucide-react";

const InlineDraftEditor = lazy(() =>
  import("@/app/dashboard/research-2/components/inline/InlineDraftEditor")
);

interface DraftStreamModalProps {
  open: boolean;
  onClose: () => void;
  /** Live text while the AI is still generating. */
  streamingText: string;
  isSearching: boolean;
  /** Final draft content once generation is complete. */
  content: string;
  messageId: string;
}

export default function DraftStreamModal({
  open,
  onClose,
  streamingText,
  isSearching,
  content,
  messageId,
}: DraftStreamModalProps) {
  if (!open) return null;

  const showStreaming = isSearching;
  const displayText = showStreaming ? streamingText : content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--bg-primary)] shadow-2xl ring-1 ring-[var(--border-default)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-3">
            {showStreaming && (
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
            )}
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {showStreaming ? "Drafting in progress…" : "Draft ready"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {showStreaming ? (
            <div
              className="rounded-2xl bg-[#FDFBF7] ring-1 ring-[var(--border-default)] p-8 min-h-[300px] font-serif text-[15px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap"
              style={{ fontFamily: "Georgia, 'Source Serif Pro', serif" }}
            >
              {displayText || (
                <span className="text-[var(--text-muted)] italic">Generating draft…</span>
              )}
              {/* Blinking cursor */}
              <span className="inline-block w-0.5 h-4 bg-[var(--accent)] ml-0.5 animate-pulse align-middle" />
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-16 text-sm text-[var(--text-muted)]">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading editor…
                </div>
              }
            >
              <InlineDraftEditor
                content={displayText}
                storageKey={`lexram-draft-modal-${messageId}`}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
