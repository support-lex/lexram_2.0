"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Undo2, Redo2, Save, X, Maximize2 } from "lucide-react";

// EditorArtifact is ~1000 lines and pulls in a lot of editor surface area —
// lazy-load it so it only ships when an inline draft block actually appears.
const EditorArtifact = lazy(() =>
  import("../EditorArtifact").then((m) => ({ default: m.EditorArtifact }))
);

interface InlineDraftEditorProps {
  content: string;
  storageKey?: string;
  isStreaming?: boolean;
  /** Document title shown in the cream header. Defaults to MEMORANDUM OF LAW. */
  documentTitle?: string;
  /** Subtitle / classification line under the title. */
  classification?: string;
}

/**
 * Memo-style draft surface — cream paper background, serif title, classification
 * caps subtitle, and a toolbar with undo / redo / Save to Matter (gold pill).
 * Designed to be dropped inline beneath an AI message bubble in the chat flow.
 */
export default function InlineDraftEditor({
  content,
  storageKey,
  isStreaming = false,
  documentTitle = "MEMORANDUM OF LAW",
  classification = "CONFIDENTIAL / ATTORNEY WORK PRODUCT",
}: InlineDraftEditorProps) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // createPortal needs a DOM target; only available after mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC closes the full-window draft view; lock body scroll while open.
  useEffect(() => {
    if (!popupOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopupOpen(false);
    };
    document.addEventListener("keydown", handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [popupOpen]);

  return (
    <>
      <div className="mt-3 rounded-2xl lexram-glass ring-1 ring-[var(--border-default)] shadow-[0_4px_24px_-8px_rgba(10,22,40,0.18)] overflow-hidden">
        {/* Toolbar — undo/redo on the left, Save to Matter pill on the right */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.06] bg-[var(--surface-glass)]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 rounded-md text-[var(--text-primary)]/60 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-md text-[var(--text-primary)]/60 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPopupOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] hover:border-[var(--accent)] px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
              title="Open in full window"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              FULL WINDOW
            </button>
            <button
              type="button"
              onClick={() => setPopupOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-[var(--text-primary)] transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              SAVE TO MATTER
            </button>
          </div>
        </div>

        {/* Document header — serif title + classification caps subtitle */}
        <div className="px-8 pt-8 pb-4 text-center">
          <h2
            className="text-[22px] font-bold text-[var(--text-primary)] tracking-wide"
            style={{ fontFamily: "Georgia, 'Source Serif Pro', 'Lora', serif" }}
          >
            {documentTitle}
          </h2>
          <div className="mt-1.5 text-[10px] font-semibold tracking-[0.22em] text-[var(--text-primary)]/50">
            {classification}
          </div>
          <div className="mt-4 mx-auto h-px w-16 bg-[var(--accent)]/40" />
        </div>

        {/* Editor body — keep cream background by overriding the bundled editor's bg */}
        <div className="px-2 pb-4 [&_*]:!bg-transparent">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12 text-sm text-[var(--text-primary)]/60">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading editor…
              </div>
            }
          >
            <EditorArtifact
              content={content || "Draft will appear here once generated."}
              isStreaming={isStreaming}
              storageKey={storageKey}
            />
          </Suspense>
        </div>
      </div>

      {/* Full-window draft overlay rendered via portal — attaches directly
          to <body> so `fixed inset-0` is positioned relative to the viewport
          (not to any ancestor that creates a containing block via
          transform / backdrop-filter / filter / will-change). */}
      {mounted && popupOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg-primary)] lex-animate-fade-in">
          {/* Title bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="font-serif text-base font-bold text-[var(--text-primary)]">{documentTitle}</h2>
            </div>
            <button
              type="button"
              onClick={() => setPopupOpen(false)}
              aria-label="Close full window view"
              className="grid place-items-center size-9 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-16 text-sm text-[var(--text-primary)]/60">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading editor…
                </div>
              }
            >
              <EditorArtifact
                content={content || "Draft will appear here once generated."}
                isStreaming={isStreaming}
                storageKey={storageKey ? `${storageKey}-popup` : undefined}
              />
            </Suspense>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
