"use client";

import { lazy, Suspense, useState } from "react";
import { Loader2, Undo2, Redo2, Save, X } from "lucide-react";

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

  return (
    <>
      <div className="mt-3 rounded-2xl bg-[#FAF7F0] ring-1 ring-black/[0.06] shadow-[0_4px_24px_-8px_rgba(10,22,40,0.18)] overflow-hidden">
        {/* Toolbar — undo/redo on the left, Save to Matter pill on the right */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.06] bg-[#F5F1E8]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 rounded-md text-[#0A1628]/60 hover:text-[#0A1628] hover:bg-black/[0.05] transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-md text-[#0A1628]/60 hover:text-[#0A1628] hover:bg-black/[0.05] transition-colors"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPopupOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-[#0A1628] transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            SAVE TO MATTER
          </button>
        </div>

        {/* Document header — serif title + classification caps subtitle */}
        <div className="px-8 pt-8 pb-4 text-center">
          <h2
            className="text-[22px] font-bold text-[#0A1628] tracking-wide"
            style={{ fontFamily: "Georgia, 'Source Serif Pro', 'Lora', serif" }}
          >
            {documentTitle}
          </h2>
          <div className="mt-1.5 text-[10px] font-semibold tracking-[0.22em] text-[#0A1628]/50">
            {classification}
          </div>
          <div className="mt-4 mx-auto h-px w-16 bg-[var(--accent)]/40" />
        </div>

        {/* Editor body — keep cream background by overriding the bundled editor's bg */}
        <div className="px-2 pb-4 [&_*]:!bg-transparent">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12 text-sm text-[#0A1628]/60">
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

      {/* Save-to-Matter full-screen overlay — fills the viewport, X to close */}
      {popupOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <button
            type="button"
            onClick={() => setPopupOpen(false)}
            className="absolute right-4 top-4 z-10 p-2 rounded-lg text-[#0A1628]/60 hover:text-[#0A1628] hover:bg-black/[0.05] transition-colors shadow-sm ring-1 ring-black/[0.06] bg-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-16 text-sm text-[#0A1628]/60">
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
        </div>
      )}
    </>
  );
}
