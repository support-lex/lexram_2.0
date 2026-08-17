"use client";

// In-app document viewer. Re-fetches the doc via the repository on open so
// we always have a fresh `signed_url` (the backend hands out 1-hour Supabase
// Storage signed URLs and instructs the frontend NOT to cache them). Renders
// inline based on mime_type:
//   - application/pdf → <iframe>
//   - image/*         → <img>
//   - everything else → download link (browser can't render natively)
//
// Also surfaces the post-processing metadata sidebar (doc_type, summary,
// key_entities, token_count, quality_score) per the backend's integration
// guide so admins/lawyers can see at a glance what the AI extracted.

import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  ExternalLink,
  Download,
  FileText,
  AlertTriangle,
  Sparkles,
  Hash,
} from "lucide-react";
import {
  documentRepository,
  docId as getDocId,
  docName as getDocName,
  type CaseDocument,
} from "@/modules/legal/repository/document.repository";

interface DocumentViewerProps {
  caseId: string;
  doc: CaseDocument;
  onClose: () => void;
}

export default function DocumentViewer({ caseId, doc: initialDoc, onClose }: DocumentViewerProps) {
  // Start with whatever metadata we already have (saves a fetch round-trip
  // for filename / status display) but always re-fetch to refresh signed_url.
  const [doc, setDoc] = useState<CaseDocument>(initialDoc);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ESC closes; body scroll locked while overlay is open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Re-fetch the doc to get a fresh signed_url every time the viewer opens.
  useEffect(() => {
    const id = getDocId(initialDoc);
    if (!caseId || !id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    documentRepository
      .get(caseId, id)
      .then((fresh) => {
        if (cancelled) return;
        if (fresh) setDoc(fresh);
        else setFetchError("Could not load the document — please try again.");
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, initialDoc]);

  const name = getDocName(doc);
  const mime = (doc.mime_type ?? doc.content_type ?? "").toLowerCase();
  const signedUrl = doc.signed_url ?? null;
  const status = doc.status;

  const isPdf = mime.includes("pdf");
  const isImage = mime.startsWith("image/");
  const isUnviewable = !isPdf && !isImage && !!signedUrl;
  const isProcessing =
    status && ["processing", "classifying", "indexing"].includes(String(status).toLowerCase());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Document viewer: ${name}`}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 lex-animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden lex-animate-scale-in"
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-light)] bg-[var(--lex-cream-soft)]">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-[var(--lex-maroon)] flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="font-serif text-base font-bold text-[var(--lex-maroon)] truncate">
                {doc.doc_name || name}
              </h2>
              <p className="text-[10px] text-[var(--text-muted)] truncate">
                {mime || "Unknown type"}
                {status ? ` · ${status}` : ""}
                {doc.doc_type ? ` · ${doc.doc_type}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new tab"
                className="grid place-items-center size-9 rounded-full text-[var(--text-muted)] hover:bg-[var(--lex-cream-deep)] hover:text-[var(--lex-maroon)] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close viewer"
              className="grid place-items-center size-9 rounded-full text-[var(--text-muted)] hover:bg-[var(--lex-cream-deep)] hover:text-[var(--lex-maroon)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body — viewer pane (flex-1) + metadata sidebar on md+ */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Viewer pane */}
          <div className="flex-1 min-h-0 bg-[var(--lex-cream-soft)] overflow-auto">
            {loading ? (
              <div className="h-full grid place-items-center text-[var(--text-muted)] gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">Loading document…</span>
              </div>
            ) : fetchError ? (
              <EmptyState icon={<AlertTriangle className="w-8 h-8 text-amber-500" />} title="Couldn't load the document" body={fetchError} />
            ) : isProcessing ? (
              <EmptyState
                icon={<Loader2 className="w-8 h-8 text-[var(--lex-maroon)] animate-spin" />}
                title={`Document is still ${status}`}
                body="The viewer will open once the pipeline finishes (~10–30 seconds for most files)."
              />
            ) : !signedUrl ? (
              <EmptyState
                icon={<AlertTriangle className="w-8 h-8 text-amber-500" />}
                title="File unavailable"
                body={
                  doc.error_message ||
                  "The signed URL was not returned by the backend. The file may be missing or signing failed."
                }
              />
            ) : isPdf ? (
              // Native PDF embed — works in every modern browser without a JS lib.
              <iframe src={signedUrl} title={name} className="w-full h-full min-h-[60vh] border-0" />
            ) : isImage ? (
              <div className="h-full grid place-items-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signedUrl} alt={name} className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
              </div>
            ) : (
              // DOCX / TXT / anything else — browser can't render inline.
              <div className="h-full grid place-items-center gap-3 p-6 text-center">
                <FileText className="w-10 h-10 text-[var(--lex-maroon)]" />
                <p className="text-sm text-[var(--text-secondary)] max-w-md">
                  This file type can't be previewed inline. Download or open it in a new tab to view.
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-semibold bg-[var(--lex-maroon)] text-[var(--lex-cream)] hover:opacity-90 shadow-[var(--lex-shadow-soft)] transition-opacity"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
                  </a>
                  <a
                    href={signedUrl}
                    download={name}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-semibold border border-[var(--border-default)] text-[var(--lex-maroon)] hover:bg-[var(--lex-cream-deep)] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>
            )}
            {/* Suppress unused-var warning for isUnviewable — kept as a
                semantic flag for future analytics hooks. */}
            <span className="hidden">{isUnviewable ? "u" : ""}</span>
          </div>

          {/* Metadata sidebar — collapses below the viewer on mobile */}
          {(doc.summary || (doc.key_entities && doc.key_entities.length > 0) || doc.token_count || doc.quality_score) && (
            <aside className="md:w-72 md:flex-shrink-0 border-t md:border-t-0 md:border-l border-[var(--border-light)] bg-white p-4 overflow-y-auto md:max-h-full">
              {doc.summary && (
                <Section icon={<Sparkles className="w-3.5 h-3.5 text-[var(--lex-rust)]" />} title="Summary">
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{doc.summary}</p>
                </Section>
              )}
              {doc.key_entities && doc.key_entities.length > 0 && (
                <Section icon={<Hash className="w-3.5 h-3.5 text-[var(--lex-rust)]" />} title="Key entities">
                  <div className="flex flex-wrap gap-1.5">
                    {doc.key_entities.map((e) => (
                      <span
                        key={e}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--lex-cream-deep)] text-[var(--lex-maroon)] border border-[var(--lex-maroon)]/20"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
              {(doc.token_count || doc.quality_score) && (
                <Section icon={<Sparkles className="w-3.5 h-3.5 text-[var(--lex-rust)]" />} title="Stats">
                  <div className="grid grid-cols-2 gap-2">
                    {doc.token_count !== undefined && <Stat label="Tokens" value={doc.token_count.toLocaleString()} />}
                    {doc.quality_score !== undefined && <Stat label="Quality" value={`${doc.quality_score}%`} />}
                  </div>
                </Section>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--lex-cream-soft)] border border-[var(--border-light)] px-2 py-1.5">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
      <div className="text-[13px] font-bold text-[var(--lex-maroon)]">{value}</div>
    </div>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="h-full grid place-items-center text-center p-6 gap-2">
      {icon}
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="text-xs text-[var(--text-muted)] max-w-sm">{body}</p>
    </div>
  );
}
