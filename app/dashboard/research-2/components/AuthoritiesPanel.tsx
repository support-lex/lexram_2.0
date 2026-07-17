"use client";

import { useState } from "react";
import {
  ArrowUpRight, Copy, Plus, Landmark, FileText,
  Eye, Download, X, ExternalLink, Scale, BookOpen, Gavel, FileCheck, ScrollText,
} from "lucide-react";
import { EditorArtifact } from "./EditorArtifact";
import type { ArtifactTab, ChunkSource, ChunkSourceType, LegalAnswer } from "../types";

// ── Type badge config ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ChunkSourceType, { label: string; dot: string; badge: string; icon: React.ReactNode }> = {
  sc_judgment: {
    label: "Supreme Court",
    dot:   "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon:  <Scale className="w-3 h-3" />,
  },
  hc_judgment: {
    label: "High Court",
    dot:   "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon:  <Gavel className="w-3 h-3" />,
  },
  statute: {
    label: "Central Act",
    dot:   "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon:  <BookOpen className="w-3 h-3" />,
  },
  sc_order: {
    label: "SC Order",
    dot:   "bg-purple-500",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    icon:  <FileCheck className="w-3 h-3" />,
  },
  state_act: {
    label: "State Act",
    dot:   "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon:  <ScrollText className="w-3 h-3" />,
  },
};

function getSourceUrl(src: ChunkSource): string | undefined {
  return src.source_url || src.pdf_url || undefined;
}

function getSourceTitle(src: ChunkSource): string {
  if (src.title) return src.title;
  if (src.act_name) return src.act_name;
  if (src.citation) return src.citation;
  return "Untitled";
}

// ── SOURCE CHUNK modal ───────────────────────────────────────────────────────

function SourceChunkModal({
  source,
  onClose,
  onOpenPdf,
}: {
  source: ChunkSource;
  onClose: () => void;
  onOpenPdf: () => void;
}) {
  const url = getSourceUrl(source);
  const title = getSourceTitle(source);
  const cfg = TYPE_CONFIG[source.type] ?? TYPE_CONFIG.sc_judgment;

  const handleCopy = () => {
    if (source.chunk_text) {
      navigator.clipboard.writeText(source.chunk_text).catch(() => {});
    }
  };

  const handleDownload = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[var(--bg-surface)] rounded-2xl shadow-2xl ring-1 ring-[var(--border-default)] w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[var(--border-light)] flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold mb-2 ${cfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                SOURCE CHUNK · {cfg.label.toUpperCase()}
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug">{title}</h3>
              {source.citation && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{source.citation}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-[14px] leading-7 text-[var(--text-primary)] whitespace-pre-wrap">
          {source.chunk_text || "No text available for this chunk."}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[var(--border-light)] flex items-center gap-2 flex-wrap flex-shrink-0">
          {url && (
            <button
              onClick={source.embed ? onOpenPdf : () => window.open(url, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-sidebar)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              Open PDF
            </button>
          )}
          {url && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ring-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ring-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PDF iframe overlay (HC judgments only) ───────────────────────────────────

function PdfOverlay({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-sidebar)] text-white flex-shrink-0">
        <span className="text-sm font-semibold truncate max-w-[70%]">{title}</span>
        <div className="flex items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open in tab
          </a>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* iframe */}
      <iframe
        src={src}
        title={title}
        className="flex-1 w-full border-0"
        allow="fullscreen"
      />
    </div>
  );
}

// ── Chunk source card ────────────────────────────────────────────────────────

function SourceCard({ source, index }: { source: ChunkSource; index: number }) {
  const [showChunkModal, setShowChunkModal] = useState(false);
  const [showPdfOverlay, setShowPdfOverlay] = useState(false);
  const cfg = TYPE_CONFIG[source.type] ?? TYPE_CONFIG.sc_judgment;
  const url = getSourceUrl(source);
  const title = getSourceTitle(source);
  const snippet = source.chunk_text?.slice(0, 240).trim();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (source.chunk_text) {
      navigator.clipboard.writeText(source.chunk_text).catch(() => {});
    }
  };

  const handleLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    if (source.embed) {
      setShowPdfOverlay(true);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="group rounded-xl ring-1 ring-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-[var(--border-default)]">
        {/* Top row: number + type badge + actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-sidebar)] text-white text-[10px] font-bold flex-shrink-0">
              {index + 1}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${cfg.badge}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
          {/* Icon actions — always visible */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleCopy}
              title="Copy chunk text"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowChunkModal(true); }}
              title="View full chunk"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            {url && (
              <button
                onClick={handleLink}
                title={source.embed ? "View PDF" : "Open in new tab"}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            {url && (
              <button
                onClick={handleDownload}
                title="Download"
                className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <p className="text-[13px] font-bold text-[var(--text-primary)] leading-snug line-clamp-2 mb-1.5">
          {title}
        </p>

        {/* Snippet */}
        {snippet && (
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-3 mb-2">
            {snippet}{source.chunk_text && source.chunk_text.length > 240 ? "…" : ""}
          </p>
        )}

        {/* Footer: court · date */}
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-medium">
          {source.court && <span className="truncate">{source.court}</span>}
          {source.court && source.date && <span className="opacity-40">·</span>}
          {source.date && <span className="flex-shrink-0">{source.date.slice(0, 10)}</span>}
          {source.section_number && (
            <>
              <span className="opacity-40">·</span>
              <span className="flex-shrink-0">§{source.section_number}</span>
            </>
          )}
          {source.cnr && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate font-mono text-[10px]">{source.cnr}</span>
            </>
          )}
        </div>
      </div>

      {showChunkModal && (
        <SourceChunkModal
          source={source}
          onClose={() => setShowChunkModal(false)}
          onOpenPdf={() => { setShowChunkModal(false); if (url) setShowPdfOverlay(true); }}
        />
      )}

      {showPdfOverlay && url && (
        <PdfOverlay
          src={url}
          title={title}
          onClose={() => setShowPdfOverlay(false)}
        />
      )}
    </>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

type AuthoritiesPanelProps = {
  showArtifacts: boolean;
  mobilePane: "chat" | "authorities";
  artifactTab: ArtifactTab;
  setArtifactTab: (tab: ArtifactTab) => void;
  lastResponse?: LegalAnswer;
  currentQuestion?: string;
  workflowCount: number;
  authorityCount: number;
  selectedAuthorityIndex: number | null;
  onSelectAuthority: (index: number | null) => void;
  liveEditorContent?: string;
  isDraftArtifactStreaming?: boolean;
  sessionId?: string | null;
  width?: number;
  streamingSources?: ChunkSource[];
};

export default function AuthoritiesPanel({
  showArtifacts,
  mobilePane,
  artifactTab,
  setArtifactTab,
  lastResponse,
  currentQuestion,
  workflowCount,
  authorityCount,
  selectedAuthorityIndex,
  onSelectAuthority,
  liveEditorContent,
  isDraftArtifactStreaming = false,
  sessionId,
  width = 50,
  streamingSources = [],
}: AuthoritiesPanelProps) {
  const hasSources = streamingSources.length > 0;

  const getHost = (url?: string): string => {
    if (!url) return "";
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
  };
  const getFavicon = (url?: string, size = 64): string => {
    const host = getHost(url);
    return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=${size}` : "";
  };

  const editorContent = liveEditorContent || lastResponse?.draftReady || "";
  const hasEditor = Boolean(editorContent.trim());

  if (!showArtifacts || (!hasEditor && !hasSources)) return null;

  const tabBtn = (tab: ArtifactTab, label: string) => (
    <button
      onClick={() => setArtifactTab(tab)}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        artifactTab === tab
          ? "bg-[var(--bg-sidebar)] text-white shadow-sm"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <aside
      className={`w-full h-full border-t lg:border-t-0 lg:border-l border-[var(--border-default)] bg-[var(--surface-glass)] backdrop-blur-2xl flex-col ${mobilePane === "chat" ? "hidden lg:flex" : "flex"}`}
      style={{ flexBasis: `${width}%`, minWidth: "280px" }}
    >
      {/* Tab bar */}
      <div className="px-4 py-3 border-b border-[var(--border-default)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 rounded-xl bg-[var(--surface-hover)] p-1 border border-[var(--border-default)]">
          {hasSources && tabBtn("sources", `Sources (${streamingSources.length})`)}
          {hasEditor  && tabBtn("editor",  "Editor")}
        </div>
        <div className="flex items-center gap-2">
          {hasEditor && artifactTab !== "editor" && (
            <button
              onClick={() => setArtifactTab("editor")}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20 hover:bg-blue-500/15 hover:ring-blue-500/30 inline-flex items-center gap-1.5 font-semibold text-blue-700 transition-all"
            >
              <FileText className="w-3.5 h-3.5" /> View in Editor
            </button>
          )}
        </div>
      </div>

      <div className={`flex-1 min-h-0 ${artifactTab === "editor" ? "flex flex-col" : "overflow-y-auto p-4"}`}>

        {/* ── SOURCES tab ─────────────────────────────────────────────────── */}
        {artifactTab === "sources" && (
          <div className="space-y-2">
            {streamingSources.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-sm font-medium text-[var(--text-secondary)]">No sources yet</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Sources appear as tools retrieve them</div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border-light)]">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {streamingSources.length} retrieved
                  </p>
                  <div className="flex items-center gap-1.5">
                    {(["sc_judgment", "hc_judgment", "statute", "sc_order"] as ChunkSourceType[])
                      .filter((t) => streamingSources.some((s) => s.type === t))
                      .map((t) => {
                        const c = TYPE_CONFIG[t];
                        return (
                          <span key={t} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                            {c.label}
                          </span>
                        );
                      })}
                  </div>
                </div>
                {streamingSources.map((src, i) => (
                  <SourceCard key={i} source={src} index={i} />
                ))}
              </>
            )}
          </div>
        )}

        {/* ── WORKFLOW tab ─────────────────────────────────────────────────── */}
        {artifactTab === "workflow" && (
          <div className="max-w-[560px] mx-auto space-y-6">
            {(lastResponse?.workflowSteps || []).length === 0 && (
              <div className="py-16 text-center">
                <div className="text-sm font-medium text-[var(--text-secondary)]">No mind map yet</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Mind map appears only when workflow steps are generated.</div>
              </div>
            )}
            {(lastResponse?.workflowSteps || []).length > 0 && (
              <>
                <div className="text-center">
                  <div className="inline-flex max-w-[360px] items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm">
                    {currentQuestion || "Answer map"}
                  </div>
                </div>
                <div className="w-px h-12 bg-gradient-to-b from-[var(--border-default)] to-transparent mx-auto -mt-2" />
                <div className="grid gap-5 sm:grid-cols-2">
                  {(lastResponse?.workflowSteps || []).map((step, i) => (
                    <div key={i} className="relative rounded-2xl border-2 border-[var(--border-default)] bg-gradient-to-br from-[var(--bg-surface)] to-[var(--surface-hover)] p-5 shadow-md hover:shadow-lg transition-all">
                      <div className="absolute -top-4 left-5 inline-flex items-center justify-center min-w-7 h-7 rounded-full bg-[var(--bg-sidebar)] text-white text-xs font-bold shadow-md">
                        {i + 1}
                      </div>
                      <div className="text-base font-bold text-[var(--text-primary)] mt-3 leading-snug">{step.title}</div>
                      {step.detail && <div className="text-sm text-[var(--text-secondary)] mt-3 leading-6 font-medium">{step.detail}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── AUTHORITIES tab ──────────────────────────────────────────────── */}
        {artifactTab === "authorities" && (
          <div className="space-y-3 stagger-children">
            {(lastResponse?.authorities || []).length === 0 && (
              <div className="py-16 text-center">
                <Landmark className="w-10 h-10 mx-auto text-[var(--border-default)] mb-3" />
                <div className="text-sm font-medium text-[var(--text-secondary)]">No authorities cited yet</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Ask a question to see relevant case law</div>
              </div>
            )}
            {(lastResponse?.authorities || []).length > 0 && (
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex -space-x-1.5 flex-shrink-0">
                    {(lastResponse?.authorities || []).filter((a) => !!a.linkHint).slice(0, 3).map((a, i) => {
                      const fav = getFavicon(a.linkHint, 64);
                      if (!fav) return null;
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={`hdr-${i}`} src={fav} alt="" width={20} height={20} className="w-5 h-5 rounded-full ring-2 ring-[var(--bg-surface)] bg-white" />
                      );
                    })}
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {(lastResponse?.authorities || []).length} sites
                  </span>
                </div>
              </div>
            )}
            {(lastResponse?.authorities || []).map((a, i) => (
              <div
                key={i}
                onClick={() => onSelectAuthority(i)}
                className={`group rounded-xl ring-1 ring-[var(--border-default)] p-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:ring-[var(--accent)]/30 ${
                  a.treatment === "followed"
                    ? "bg-gradient-to-br from-[var(--bg-surface)] to-emerald-50/10"
                    : a.treatment === "distinguished"
                      ? "bg-gradient-to-br from-[var(--bg-surface)] to-amber-50/10"
                      : "bg-[var(--bg-surface)]"
                } ${selectedAuthorityIndex === i ? "ring-2 ring-[var(--accent)] ring-offset-2" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[var(--text-primary)] hover:underline cursor-pointer inline-flex items-center gap-2 mb-1.5 leading-snug">
                      <span className="inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-[var(--bg-sidebar)] text-white text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <span className="line-clamp-2">{a.caseName}</span>
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-3 mb-2">{a.proposition}</p>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 min-w-0">
                      {(() => { const fav = getFavicon(a.linkHint, 32); return fav ? <img src={fav} alt="" width={14} height={14} className="w-3.5 h-3.5 rounded-sm flex-shrink-0" /> : null; })()}
                      <span className="truncate font-medium text-[var(--text-secondary)]">{getHost(a.linkHint) || a.court}</span>
                      {a.year && a.year !== "—" && <><span className="opacity-40">·</span><span>{a.year}</span></>}
                    </div>
                  </div>
                  {a.linkHint ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getFavicon(a.linkHint, 128)} alt="" width={56} height={56} className="w-14 h-14 rounded-xl bg-white object-contain p-2 ring-1 ring-[var(--border-light)] flex-shrink-0" />
                  ) : (
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ${a.treatment === "followed" ? "bg-emerald-500/10 text-emerald-600" : a.treatment === "distinguished" ? "bg-amber-500/10 text-amber-600" : "bg-[var(--surface-hover)] text-[var(--text-secondary)]"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${a.treatment === "followed" ? "bg-emerald-500" : a.treatment === "distinguished" ? "bg-amber-500" : "bg-[var(--text-muted)]"}`} />
                      {a.treatment}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3 pt-3 border-t border-[var(--border-light)] opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button className="px-3 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Save
                  </button>
                  <button className="px-3 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5 transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <a href={a.linkHint || `https://indiankanoon.org/search/?formInput=${encodeURIComponent(`${a.caseName} ${a.citation}`)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg hover:bg-[var(--accent)]/10 text-xs font-medium text-[var(--accent)] inline-flex items-center gap-1.5 transition-colors">
                    Open source <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EDITOR tab ───────────────────────────────────────────────────── */}
        {artifactTab === "editor" && (
          <EditorArtifact
            content={editorContent || "Draft artifact will appear here once generated."}
            isStreaming={isDraftArtifactStreaming}
            storageKey={sessionId ? `lexram-research3-editor-${sessionId}` : undefined}
          />
        )}
      </div>
    </aside>
  );
}
