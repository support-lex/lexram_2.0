"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { streamDocumentStatus } from "@/modules/legal/api/documentStatusStream";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  UploadCloud,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode2,
} from "lucide-react";
import { toast } from "sonner";
import {
  documentRepository,
  docId,
  docName,
  docSize,
  formatBytes,
  type SessionDocument,
} from "@/modules/legal/repository/document.repository";
import { cn } from "@/lib/utils";

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string | null;
  onAttach?: (
    docs: { id: string; name: string; size?: number; mime_type?: string }[],
  ) => void;
}

const ACCEPT = ".pdf,.txt,.md,.doc,.docx,.xls,.xlsx";
const MAX_BYTES = 50 * 1024 * 1024;

// ─── File type → icon + tint ────────────────────────────────────────────
type TypeMeta = { Icon: typeof FileText; iconClass: string; wellClass: string };

function fileTypeMeta(name: string): TypeMeta {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf")
    return {
      Icon: FileText,
      iconClass: "text-rose-600",
      wellClass: "bg-rose-50 border border-rose-100",
    };
  if (["xls", "xlsx", "csv"].includes(ext))
    return {
      Icon: FileSpreadsheet,
      iconClass: "text-blue-600",
      wellClass: "bg-blue-50 border border-blue-100",
    };
  if (["doc", "docx"].includes(ext))
    return {
      Icon: FileText,
      iconClass: "text-slate-700",
      wellClass: "bg-slate-50 border border-slate-200",
    };
  if (ext === "md")
    return {
      Icon: FileCode2,
      iconClass: "text-violet-600",
      wellClass: "bg-violet-50 border border-violet-100",
    };
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext))
    return {
      Icon: ImageIcon,
      iconClass: "text-emerald-600",
      wellClass: "bg-emerald-50 border border-emerald-100",
    };
  return {
    Icon: FileText,
    iconClass: "text-slate-600",
    wellClass: "bg-slate-50 border border-slate-200",
  };
}

// ─── Relative time ────────────────────────────────────────────────────────
function relativeTime(iso?: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  return `${Math.round(months / 12)}y ago`;
}

// ─── Status pill + animated shimmer for in-progress docs ────────────────
function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { cls: string; label: string }> = {
    ready: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "READY",
    },
    processing: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      label: "PROCESSING",
    },
    low_quality: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      label: "LOW QUALITY",
    },
    failed: {
      cls: "bg-red-50 text-red-700 border-red-200",
      label: "FAILED",
    },
    infected: {
      cls: "bg-red-50 text-red-700 border-red-200",
      label: "INFECTED",
    },
  };
  const m = map[status] ?? {
    cls: "bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border-default)]",
    label: status.toUpperCase(),
  };
  const isProcessing = status === "processing";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider",
        m.cls,
      )}
    >
      {isProcessing && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
      )}
      {m.label}
    </span>
  );
}

export default function DocumentDialog({
  open,
  onOpenChange,
  caseId,
  onAttach,
}: DocumentDialogProps) {
  const [docs, setDocs] = useState<SessionDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setShowAll(false);
    }
  }, [open]);
  useEffect(() => {
    setSelectedIds(new Set());
  }, [caseId]);

  const refresh = useCallback(async () => {
    if (!caseId) {
      setDocs([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await documentRepository.list(caseId);
      setDocs(list);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const pendingDocIds = useMemo(
    () =>
      docs
        .filter(
          (d) =>
            !d.status ||
            (d.status !== "ready" && d.status !== "failed" && d.status !== "infected"),
        )
        .map((d) => docId(d))
        .filter(Boolean),
    [docs],
  );
  const pendingKey = pendingDocIds.join(",");

  useEffect(() => {
    if (!open || !caseId || pendingDocIds.length === 0) return;

    const controllers: AbortController[] = [];
    pendingDocIds.forEach((id) => {
      const ctrl = new AbortController();
      controllers.push(ctrl);
      streamDocumentStatus(
        caseId,
        id,
        {
          onEvent: (event) => {
            const newStatus = (event.status ?? event.type ?? "") as string;
            if (!newStatus) return;
            setDocs((prev) =>
              prev.map((d) =>
                docId(d) === id ? ({ ...d, status: newStatus } as SessionDocument) : d,
              ),
            );
          },
          onError: (msg) => {
            console.warn(`[DocumentDialog] status stream for ${id} failed`, msg);
          },
        },
        { signal: ctrl.signal },
      ).catch(() => {});
    });

    return () => controllers.forEach((c) => c.abort());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, caseId, pendingKey]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const readyDocs = useMemo(
    () => docs.filter((d) => d.status === "ready" && docId(d)),
    [docs],
  );
  const allReadySelected =
    readyDocs.length > 0 && readyDocs.every((d) => selectedIds.has(docId(d)));
  const toggleSelectAll = () => {
    if (allReadySelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(readyDocs.map((d) => docId(d))));
  };

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;
      if (!caseId) {
        setError("Pick a case first — documents attach to the active case.");
        return;
      }
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setUploading(true);
      setError(null);
      let successCount = 0;
      for (const file of fileArray) {
        if (file.size > MAX_BYTES) {
          setError(`${file.name} exceeds the 50 MB upload limit.`);
          continue;
        }
        try {
          await documentRepository.upload(caseId, file);
          successCount += 1;
        } catch (err) {
          setError(`${file.name}: ${(err as Error).message}`);
        }
      }
      setUploading(false);
      if (successCount > 0) {
        toast.success(
          successCount === 1 ? "Document uploaded" : `${successCount} documents uploaded`,
          { description: "Indexing — they'll be ready in a moment." },
        );
        refresh();
      }
    },
    [caseId, refresh],
  );

  const handleDelete = async (id: string) => {
    if (!caseId || !id) return;
    setDeletingId(id);
    try {
      await documentRepository.remove(caseId, id);
      setDocs((prev) => prev.filter((d) => docId(d) !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Document deleted");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleConfirmReference = () => {
    if (!onAttach || selectedIds.size === 0) return;
    const chosen = docs
      .filter((d) => selectedIds.has(docId(d)))
      .map((d) => ({
        id: docId(d),
        name: docName(d),
        size: docSize(d),
        mime_type: (d.mime_type ?? d.content_type) as string | undefined,
      }));
    onAttach(chosen);
    toast.success(
      chosen.length === 1
        ? `Attached "${chosen[0].name}" to chat`
        : `Attached ${chosen.length} files to chat`,
    );
  };

  const visibleDocs = showAll ? docs : docs.slice(0, 6);
  const hiddenCount = docs.length - visibleDocs.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl w-[calc(100vw-1.5rem)] sm:w-full max-h-[88vh] overflow-hidden bg-white border border-slate-200/70 shadow-[0_20px_48px_-16px_rgba(15,23,42,0.18)] rounded-2xl flex flex-col">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4 flex-shrink-0">
          <DialogHeader className="space-y-0 text-left">
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
              File Hub
            </DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500 mt-0.5">
              Reference across sessions on this case
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="-mt-1 -mr-1 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-7 pb-5 space-y-5">
          {/* No-case guard */}
          {!caseId && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-900 flex-1">
                Select a case from the dropdown first — documents are scoped to a case.
              </p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-700 flex-1">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="p-0.5 rounded hover:bg-red-500/10 text-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Drop zone ───────────────────────────────────────────────── */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (caseId) setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              "relative rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all",
              dragActive
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50",
              !caseId && "opacity-50 pointer-events-none",
            )}
          >
            <div
              className={cn(
                "mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white border transition-all",
                dragActive
                  ? "border-slate-900 shadow-md scale-105"
                  : "border-slate-200 shadow-sm",
              )}
            >
              <UploadCloud
                className={cn(
                  "w-5 h-5 transition-colors",
                  dragActive ? "text-slate-900" : "text-slate-500",
                )}
              />
            </div>
            <p className="text-[15px] font-semibold text-slate-900 mt-3">
              {dragActive ? "Release to upload" : "Drag and drop case files"}
            </p>
            <p className="text-[12px] text-slate-500 mt-1">
              PDF, DOCX, or Excel up to 50MB
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !caseId}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-1.5 text-[13px] font-semibold text-slate-900 hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              onChange={(e) => {
                handleFiles(e.target.files);
                if (e.target) e.target.value = "";
              }}
            />
          </div>

          {/* ── Recent uploads ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Recent Uploads
                {docs.length > 0 && (
                  <span className="ml-1.5 font-mono text-slate-400">({docs.length})</span>
                )}
              </h3>
              <div className="flex items-center gap-3">
                {onAttach && readyDocs.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {allReadySelected ? "Clear" : "Select all"}
                  </button>
                )}
                {docs.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className="text-[12px] font-semibold text-slate-900 hover:underline underline-offset-2 transition-colors"
                  >
                    {showAll ? "Show less" : "View all"}
                  </button>
                )}
              </div>
            </div>

            {loading && docs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2 opacity-50" />
                Loading…
              </div>
            ) : docs.length === 0 ? (
              <div className="py-10 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 mb-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-[13px] font-medium text-slate-700">No uploads yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Files you add here stay with the case.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {visibleDocs.map((d) => {
                  const id = docId(d);
                  const name = docName(d);
                  const meta = fileTypeMeta(name);
                  const { Icon } = meta;
                  const isConfirming = confirmDeleteId === id;
                  const isDeleting = deletingId === id;
                  const isSelected = selectedIds.has(id);
                  const canSelect = Boolean(onAttach && id && d.status === "ready");
                  const isProcessing = d.status === "processing" || !d.status;
                  const time = relativeTime(
                    (d.uploaded_at ?? d.created_at) as string | undefined,
                  );
                  return (
                    <li
                      key={id || name}
                      onClick={() => canSelect && toggleSelect(id)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 transition-all overflow-hidden",
                        canSelect && "cursor-pointer",
                        isSelected
                          ? "border-slate-900 shadow-sm ring-1 ring-slate-900/10"
                          : "border-slate-200/80 hover:border-slate-300 hover:shadow-sm",
                        isDeleting && "opacity-50",
                        isConfirming && "border-red-300 bg-red-50/40",
                      )}
                    >
                      {/* Animated shimmer along bottom edge for processing */}
                      {isProcessing && (
                        <span className="lexram-progress-bar pointer-events-none absolute bottom-0 left-0 right-0 rounded-b-xl" />
                      )}

                      {/* Checkbox (ready docs only) */}
                      {canSelect && (
                        <div
                          role="checkbox"
                          aria-checked={isSelected}
                          className={cn(
                            "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border-2 transition-all",
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white group-hover:border-slate-500",
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                      )}

                      {/* File icon */}
                      <div
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                          meta.wellClass,
                        )}
                      >
                        <Icon className={cn("w-5 h-5", meta.iconClass)} strokeWidth={1.75} />
                      </div>

                      {/* Meta */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-slate-900 truncate">
                          {name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {time && <>Uploaded {time} · </>}
                          <span className="font-mono">{formatBytes(docSize(d))}</span>
                        </div>
                      </div>

                      {/* Right cluster */}
                      {!isConfirming ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <StatusPill status={d.status} />
                          {id && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(id);
                              }}
                              disabled={isDeleting}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-all"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[11px] font-semibold text-red-700 mr-0.5">
                            Delete?
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            disabled={isDeleting}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(id);
                            }}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm disabled:opacity-60"
                          >
                            {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                            Confirm
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
                {!showAll && hiddenCount > 0 && (
                  <li className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAll(true)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      + {hiddenCount} more
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center justify-between gap-4 px-7 py-4 border-t border-slate-200 bg-slate-50/40">
          <p className="text-[12px] italic text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
            Automated indexing active for all uploads.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            {onAttach && (
              <button
                type="button"
                onClick={handleConfirmReference}
                disabled={selectedIds.size === 0}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold shadow-sm transition-all",
                  selectedIds.size === 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md",
                )}
              >
                Confirm Reference
                {selectedIds.size > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/20 text-[10px] font-bold">
                    {selectedIds.size}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
