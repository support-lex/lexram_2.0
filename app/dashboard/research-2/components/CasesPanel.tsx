"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X, Scale, FileText, MessageSquare, Clock, UploadCloud, Pencil,
  CalendarPlus, ChevronDown, Plus, FileCheck2, PenLine, Check,
  Loader2, Trash2, AlertCircle, StickyNote, BriefcaseIcon, LinkIcon,
  Hash, ChevronUp, Eye,
} from "lucide-react";
import DocumentViewer from "./DocumentViewer";
import { toast } from "sonner";
import api from "@/services/legal-api";
import type { Case } from "@/components/CaseSelector";
import type { ResearchSession } from "../types";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { getStoredData, STORAGE_KEYS } from "@/lib/storage";

/* ─── Types ─────────────────────────────────────────────────── */
interface CaseDoc {
  id: string; filename?: string; title?: string;
  content_type?: string; status?: string; created_at?: string;
}

export interface CasesPanelProps {
  open: boolean;
  onToggle: () => void;
  sessions: ResearchSession[];
  currentSessionId: string | null;
  currentCaseId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  relativeDateLabel: (ts: string) => string;
  onUploadDocument?: () => void;
  onCaseChange?: (caseId: string | null) => void;
  onAttachDocs?: (docs: Array<{ id: string; name: string; size: number; type: string; source: "case"; caseDocId?: string }>) => void;
  externalCases?: Case[];
  onCasesChanged?: () => void;
  /**
   * Bump this from the parent (e.g. after DocumentDialog reports a successful
   * upload via its onUploaded callback) to force the panel to re-fetch the
   * case's documents. Without this signal, uploads done via DocumentDialog
   * would not appear in the panel until the user switches cases or reloads.
   */
  documentsRefreshKey?: number;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function hasDraft(s: ResearchSession) {
  return s.messages.some((m) => {
    if (!m.response) return false;
    if (m.response.draftReady) return true;
    return m.response.uiBlocks?.some((b) => b.type === "draft") ?? false;
  });
}
// Number of AI responses in this session that produced a draft (either via
// the legacy `draftReady` string or a `draft` uiBlock). Powers the per-row
// "N drafts" pill next to the existing "N queries" count in the Sessions
// tab — gives lawyers a quick sense of how draft-heavy a thread is without
// opening it.
function draftCount(s: ResearchSession): number {
  return s.messages.reduce((n, m) => {
    if (!m.response) return n;
    if (m.response.draftReady) return n + 1;
    if (m.response.uiBlocks?.some((b) => b.type === "draft")) return n + 1;
    return n;
  }, 0);
}
function draftSnippet(s: ResearchSession) {
  for (const m of s.messages) {
    if (!m.response) continue;
    if (typeof m.response.draftReady === "string" && m.response.draftReady.trim())
      return m.response.draftReady.trim().slice(0, 72);
    const block = m.response.uiBlocks?.find((b) => b.type === "draft");
    if (block && block.type === "draft") return block.data.trim().slice(0, 72);
  }
  return "";
}
function msgPreview(s: ResearchSession): string {
  for (let i = s.messages.length - 1; i >= 0; i--) {
    const m = s.messages[i];
    if (m.role === "ai" && m.response) {
      const t = m.response.streamText || m.response.shortAnswer;
      if (t) return t.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 72);
    }
  }
  return "";
}
function extractError(err: unknown) {
  const e = err as { message?: string; response?: { data?: { detail?: unknown } } };
  const d = e?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x: { msg?: string }) => x.msg ?? "").join("; ");
  return typeof d === "string" ? d : e?.message ?? "Request failed";
}

/* ─── Panel Content ─────────────────────────────────────────── */
function PanelContent({
  sessions, currentSessionId, currentCaseId,
  onSelectSession, onNewSession, relativeDateLabel,
  onUploadDocument, onCaseChange, onAttachDocs, onClose,
  externalCases, onCasesChanged, documentsRefreshKey,
}: CasesPanelProps & { onClose: () => void }) {
  const router = useRouter();

  /* Cases state */
  const [cases, setCases] = useState<Case[]>(externalCases ?? []);
  const [casesLoading, setCasesLoading] = useState(!externalCases);

  useEffect(() => {
    if (externalCases !== undefined) { setCases(externalCases); setCasesLoading(false); }
  }, [externalCases]);

  const fetchCases = useCallback(async () => {
    if (externalCases !== undefined) return;
    setCasesLoading(true);
    try {
      const res = await api.get<{ cases: Case[] } | Case[]>("/cases");
      setCases(Array.isArray(res.data) ? res.data : res.data?.cases ?? []);
    } catch (err) { toast.error(`Could not load cases: ${extractError(err)}`); }
    finally { setCasesLoading(false); }
  }, [externalCases]);

  useEffect(() => { if (externalCases === undefined) fetchCases(); }, [fetchCases, externalCases]);

  /* Dropdown open state */
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Case docs */
  const [docs, setDocs] = useState<CaseDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [filesOpen, setFilesOpen] = useState(true);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  // Doc currently being previewed in the DocumentViewer modal; null = closed.
  const [viewingDoc, setViewingDoc] = useState<CaseDoc | null>(null);

  // Wipe selection ONLY when the active case changes. Doc-list refreshes
  // (driven by documentsRefreshKey after an upload) must not clear the
  // user's existing tick marks — that's bug fix #2.
  useEffect(() => {
    setSelectedDocs(new Set());
  }, [currentCaseId]);

  useEffect(() => {
    if (!currentCaseId) { setDocs([]); return; }
    setDocsLoading(true);
    api.get<{ documents: CaseDoc[] } | CaseDoc[]>(`/cases/${currentCaseId}/documents`)
      .then((res) => setDocs(Array.isArray(res.data) ? res.data : res.data?.documents ?? []))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));
  }, [currentCaseId, documentsRefreshKey]);

  /* Delete a document — DELETE /cases/{caseId}/documents/{docId}.
     Optimistic update so the row disappears instantly; on failure we
     restore the list and surface the error via toast. */
  const handleDeleteDoc = async (docId: string, docName: string) => {
    if (!currentCaseId) return;
    if (!window.confirm(`Delete "${docName}" from this case? This cannot be undone.`)) return;
    const snapshot = docs;
    setDocs((prev) => prev.filter((d) => d.id !== docId));
    setSelectedDocs((prev) => { const n = new Set(prev); n.delete(docId); return n; });
    setDeletingDocId(docId);
    try {
      await api.delete(`/cases/${currentCaseId}/documents/${docId}`);
      toast.success("Document deleted");
    } catch (err) {
      setDocs(snapshot);
      toast.error(`Could not delete: ${extractError(err)}`);
    } finally {
      setDeletingDocId(null);
    }
  };

  /* CRUD state */
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addExtId, setAddExtId] = useState("");
  const [addExtSrc, setAddExtSrc] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [editCase, setEditCase] = useState<Case | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteCase, setDeleteCase] = useState<Case | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  /* Tabs */
  const [activeTab, setActiveTab] = useState<"sessions" | "drafts">("sessions");

  /* Resize */
  const [width, setWidth] = useState(340);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  /* Derived data */
  const activeCase = cases.find((c) => c.id === currentCaseId) ?? null;

  // SESSION_CASES localStorage used as a quick-lookup index.
  // session.caseId (from backend) is authoritative when present.
  const sessionCasesMap = getStoredData<Record<string, string>>(STORAGE_KEYS.SESSION_CASES, {});
  const effectiveCaseId = (s: ResearchSession) => s.caseId ?? sessionCasesMap[s.id];

  // Per the per-session-isolated-case backend change: GET /cases now returns
  // one private "Unassigned" case per session, not a single shared one. We
  // collapse those into a single visual entry so the dropdown doesn't list
  // 20 separate "Unassigned" rows. Named cases render as-is. MUST sit
  // after `effectiveCaseId` is declared — the `reduce` callback captures
  // it eagerly during render, and Next/SWC hits TDZ if it's referenced
  // before its `const` line.
  const namedCases = cases.filter((c) => c.title !== "Unassigned");
  const unassignedCases = cases.filter((c) => c.title === "Unassigned");
  const unassignedSessionCount = unassignedCases.reduce(
    (sum, c) => sum + sessions.filter((s) => effectiveCaseId(s) === c.id).length,
    0,
  );
  const activeIsUnassigned = activeCase?.title === "Unassigned";

  // When the user picks the consolidated "Unassigned" bucket, the sessions
  // list must show EVERY session whose case is Unassigned (not just the one
  // session that owns currentCaseId's specific private case). Otherwise the
  // dropdown badge says "311 sessions" but the tab only renders one — the
  // exact bug reported. For named cases the filter stays scoped to that
  // case id (cross-case sharing is what named cases are for).
  const unassignedCaseIds = new Set(unassignedCases.map((c) => c.id));
  const inActiveBucket = (s: ResearchSession) =>
    activeIsUnassigned
      ? unassignedCaseIds.has(effectiveCaseId(s))
      : effectiveCaseId(s) === currentCaseId;

  const caseSessions = sessions.filter(inActiveBucket);
  // Drafts tab follows the same scope: drafts inside the active named case,
  // or drafts in any Unassigned session when the Unassigned bucket is active.
  const draftSessions = sessions.filter((s) => inActiveBucket(s) && hasDraft(s));
  // Total drafts in the active bucket — drives the Drafts tab badge. Sum
  // across sessions so the count reflects actual draft artefacts, not the
  // number of sessions that happen to contain at least one.
  const totalDraftsInBucket = draftSessions.reduce((n, s) => n + draftCount(s), 0);

  /* ── Case selection ──────────────────────────────────────── */
  const handleSelectCase = async (chosen: Case) => {
    setDropOpen(false);
    if (chosen.id === currentCaseId) return;
    const prevId = currentCaseId;
    onCaseChange?.(chosen.id);
    // Unassigned cases are per-session private. PATCHing the active
    // session to a foreign Unassigned id would attach this session to
    // another session's private bucket → cross-contamination. Treat the
    // selection as view-only for Unassigned.
    if (chosen.title === "Unassigned") return;
    if (!currentSessionId || currentSessionId.startsWith("temp_")) return;
    setAssignLoading(true);
    try {
      await api.patch(`/sessions/${currentSessionId}/case`, { case_id: chosen.id });
      toast.success(`Switched to "${chosen.title}"`);
    } catch (err) {
      onCaseChange?.(prevId);
      toast.error(`Could not assign case: ${extractError(err)}`);
    } finally { setAssignLoading(false); }
  };

  /* ── Add case ──────────────────────────────────────────────── */
  const submitAdd = async () => {
    if (!addTitle.trim()) { toast.error("Title is required"); return; }
    setAddLoading(true);
    try {
      const res = await api.post<Case>("/cases", {
        title: addTitle.trim(),
        external_id: addExtId.trim() || null,
        external_source: addExtSrc.trim() || null,
      });
      const created = res.data;
      setCases((p) => [created, ...p]);
      onCasesChanged?.();
      setAddOpen(false); setAddTitle(""); setAddExtId(""); setAddExtSrc("");
      toast.success(`"${created.title}" created`);
      await handleSelectCase(created);
    } catch (err) { toast.error(`Create failed: ${extractError(err)}`); }
    finally { setAddLoading(false); }
  };

  /* ── Edit case ───────────────────────────────────────────── */
  const submitEdit = async () => {
    if (!editCase || !editTitle.trim()) return;
    setEditLoading(true);
    const snapshot = cases;
    setCases((p) => p.map((c) => c.id === editCase.id ? { ...c, title: editTitle.trim() } : c));
    try {
      await api.patch(`/cases/${editCase.id}`, { title: editTitle.trim() });
      onCasesChanged?.(); toast.success("Case renamed"); setEditCase(null);
    } catch (err) { setCases(snapshot); toast.error(`Rename failed: ${extractError(err)}`); }
    finally { setEditLoading(false); }
  };

  /* ── Delete case ─────────────────────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteCase) return;
    const snapshot = cases;
    setDeleteLoading(true);
    setCases((p) => p.filter((c) => c.id !== deleteCase.id));
    if (currentCaseId === deleteCase.id) onCaseChange?.(null);
    try {
      await api.delete(`/cases/${deleteCase.id}`);
      onCasesChanged?.(); toast.success("Case archived"); setDeleteCase(null);
    } catch (err) { setCases(snapshot); toast.error(`Archive failed: ${extractError(err)}`); }
    finally { setDeleteLoading(false); }
  };

  /* ── Attach docs ─────────────────────────────────────────── */
  const toggleDoc = (id: string) =>
    setSelectedDocs((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleAttach = () => {
    const chosen = docs
      .filter((d) => selectedDocs.has(d.id))
      .map((d) => ({ id: d.id, name: d.filename ?? d.title ?? d.id, size: 0, type: d.content_type ?? "document", source: "case" as const, caseDocId: d.id }));
    if (!chosen.length) return;
    onAttachDocs?.(chosen);
    // Selection deliberately retained — gives the user visual confirmation
    // of what was attached, and lets them re-attach or unselect manually
    // instead of having the checkboxes silently wiped (bug fix #2).
    toast.success(`${chosen.length} doc${chosen.length > 1 ? "s" : ""} attached`);
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-white rounded-2xl border border-[var(--border-default)] shadow-[var(--lex-shadow-soft)] lex-animate-slide-right" style={{ width }}>

      {/* Resize handle */}
      <div
        onPointerDown={(e) => { dragging.current = true; startX.current = e.clientX; startW.current = width; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (!dragging.current) return; setWidth(Math.min(480, Math.max(280, startW.current + (startX.current - e.clientX)))); }}
        onPointerUp={() => { dragging.current = false; }}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-[var(--accent)]/30 transition-colors"
      />

      {/* ── Header — serif maroon title, filled "+" + close X ─── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex flex-col leading-tight">
          <span className="text-[22px] font-bold text-[var(--lex-maroon)] font-serif tracking-tight">
            Case Hub
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mt-1">
            {cases.length} {cases.length === 1 ? "Case" : "Cases"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            aria-label="New case"
            title="New case"
            className={`grid place-items-center size-8 rounded-full transition-all ${
              addOpen
                ? "bg-[var(--lex-maroon)] text-[var(--lex-cream)] opacity-90"
                : "bg-[var(--lex-maroon)] text-[var(--lex-cream)] hover:opacity-90 shadow-[var(--lex-shadow-soft)]"
            }`}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            title="Close"
            className="grid place-items-center size-8 rounded-full text-[var(--text-muted)] hover:bg-[var(--lex-cream-deep)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="h-px bg-[var(--border-light)] mx-5" />

      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── Add Case inline form ────────────────────────────── */}
        {addOpen && (
          <div className="mx-3 mt-3 mb-1 rounded-xl bg-white border overflow-hidden" style={{ borderColor: "#E8E3DA" }}>
            <div className="px-3 py-2 border-b flex items-center gap-1.5" style={{ borderColor: "#F0EBE3", background: "linear-gradient(to right, rgba(198,167,110,0.06), transparent)" }}>
              <BriefcaseIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">New case</span>
            </div>
            <div className="p-3 space-y-2.5">
              <div>
                <label className="text-[9px] uppercase tracking-[0.12em] font-bold text-[var(--text-muted)] block mb-1">Title *</label>
                <input autoFocus value={addTitle} onChange={(e) => setAddTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitAdd()}
                  placeholder="e.g. State v. Rajan, 2024" disabled={addLoading}
                  className="w-full text-[12px] rounded-lg border px-2.5 py-1.5 bg-[#FAFAF7] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
                  style={{ borderColor: "#E8E3DA" }} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.12em] font-bold text-[var(--text-muted)] block mb-1.5">Link (optional)</label>
                <div className="flex gap-1.5">
                  {[{ label: "CNR", value: "CNR" }, { label: "Manual", value: "manual" }].map((p) => (
                    <button key={p.value} type="button" onClick={() => setAddExtSrc(addExtSrc === p.value ? "" : p.value)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-all ${addExtSrc === p.value ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[#E8E3DA] text-[var(--text-muted)] hover:border-[var(--accent)]/40"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {addExtSrc && (
                <div>
                  <label className="text-[9px] uppercase tracking-[0.12em] font-bold text-[var(--text-muted)] block mb-1">
                    {addExtSrc === "CNR" ? "CNR Number" : "Reference ID"}
                  </label>
                  <input value={addExtId} onChange={(e) => setAddExtId(e.target.value)}
                    placeholder={addExtSrc === "CNR" ? "DLCT010012342024" : "Ref ID"}
                    className="w-full text-[12px] font-mono rounded-lg border px-2.5 py-1.5 bg-[#FAFAF7] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-all"
                    style={{ borderColor: "#E8E3DA" }} />
                </div>
              )}
              <div className="flex gap-2 pt-0.5">
                <button type="button" onClick={() => { setAddOpen(false); setAddTitle(""); setAddExtId(""); setAddExtSrc(""); }}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-medium border text-[var(--text-secondary)] hover:bg-[#F5F0E8] transition-colors" style={{ borderColor: "#E8E3DA" }}>
                  Cancel
                </button>
                <button type="button" onClick={submitAdd} disabled={addLoading || !addTitle.trim()}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1">
                  {addLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CUSTOM CASE DROPDOWN ─────────────────────────────── */}
        <div className="px-3 pt-3 pb-1" ref={dropRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Select case</label>
            {casesLoading && <Loader2 className="w-2.5 h-2.5 text-[var(--text-muted)] animate-spin" />}
          </div>

          {/* Trigger button */}
          <button
            type="button"
            onClick={() => setDropOpen((v) => !v)}
            disabled={assignLoading || casesLoading}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-white text-left transition-all disabled:opacity-60
              ${dropOpen ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/10" : "border-[#E8E3DA] hover:border-[var(--accent)]/40 hover:shadow-sm"}`}
            style={{ boxShadow: activeCase ? "0 1px 3px rgba(0,0,0,0.05)" : undefined }}
          >
            {assignLoading ? (
              <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin flex-shrink-0" />
            ) : activeCase ? (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(198,167,110,0.12)" }}>
                <Scale className="w-3.5 h-3.5 text-[var(--accent)]" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#F5F0E8]">
                <BriefcaseIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {activeCase ? (
                <>
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-tight">{activeCase.title}</p>
                  <p className="text-[9px] text-[var(--text-muted)] truncate mt-0.5 inline-flex items-center gap-1">
                    {activeCase.external_source && <><LinkIcon className="w-2 h-2" />{activeCase.external_source}</>}
                    {activeCase.external_id && <span className="font-mono">{activeCase.external_id}</span>}
                    {!activeCase.external_source && !activeCase.external_id && <span>No external link</span>}
                    {activeCase.document_count ? <><span className="opacity-40">·</span>{activeCase.document_count} docs</> : null}
                  </p>
                </>
              ) : (
                <p className="text-[12px] text-[var(--text-muted)]">
                  {casesLoading ? "Loading…" : cases.length === 0 ? "No cases yet" : "Choose a case…"}
                </p>
              )}
            </div>
            {dropOpen
              ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />}
          </button>

          {/* Dropdown panel */}
          {dropOpen && (
            <div className="mt-1.5 rounded-xl border bg-white overflow-hidden z-30" style={{ borderColor: "#E8E3DA", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
              {/* Header */}
              <div className="px-3.5 py-2 border-b flex items-center justify-between" style={{ borderColor: "#F0EBE3", background: "linear-gradient(to right, rgba(198,167,110,0.04), transparent)" }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Your Cases
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">{cases.length} total</span>
              </div>

              {/* List */}
              <div className="max-h-[230px] overflow-y-auto custom-scrollbar py-1">
                {cases.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <BriefcaseIcon className="w-7 h-7 mx-auto text-[var(--text-muted)] opacity-30 mb-1.5" />
                    <p className="text-[11px] text-[var(--text-muted)]">No cases yet</p>
                  </div>
                ) : (
                  namedCases.map((c) => {
                    const isActive = c.id === currentCaseId;
                    const sessCount = sessions.filter((s) => effectiveCaseId(s) === c.id).length;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          if (editCase?.id === c.id) return;
                          handleSelectCase(c);
                        }}
                        className={`group relative mx-1 my-0.5 flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all
                          ${isActive ? "bg-gradient-to-r from-[var(--accent)]/10 to-transparent ring-1 ring-[var(--accent)]/20" : "hover:bg-[var(--surface-hover)]"}`}
                      >
                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-[var(--accent)]" />}

                        {/* Inline edit */}
                        {editCase?.id === c.id ? (
                          <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input autoFocus value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") submitEdit(); if (e.key === "Escape") setEditCase(null); }}
                              className="flex-1 text-[12px] rounded-md border px-2 py-0.5 outline-none focus:border-[var(--accent)]"
                              style={{ borderColor: "#E8E3DA" }} disabled={editLoading} />
                            <button type="button" onClick={submitEdit} disabled={editLoading}
                              className="w-5 h-5 rounded flex items-center justify-center bg-[var(--accent)] text-white disabled:opacity-50">
                              {editLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                            </button>
                            <button type="button" onClick={() => setEditCase(null)}
                              className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[#E8E3DA]">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Icon */}
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[#F5F0E8] text-[var(--text-muted)]"}`}>
                              <Scale className="w-3.5 h-3.5" />
                            </div>
                            {/* Title + meta */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{c.title}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-[var(--text-muted)]">
                                {c.external_source && (
                                  <span className="inline-flex items-center gap-0.5 uppercase tracking-wide font-semibold">
                                    <Hash className="w-2 h-2" />{c.external_source}
                                  </span>
                                )}
                                {c.external_id && <span className="font-mono">{c.external_id}</span>}
                                {sessCount > 0 && (
                                  <><span className="opacity-40">·</span><span>{sessCount} session{sessCount > 1 ? "s" : ""}</span></>
                                )}
                                {typeof c.document_count === "number" && c.document_count > 0 && (
                                  <><span className="opacity-40">·</span><span>{c.document_count} docs</span></>
                                )}
                              </div>
                            </div>
                            {/* Right actions */}
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {isActive && (
                                <div className="w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center mr-0.5">
                                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </div>
                              )}
                              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={(e) => { e.stopPropagation(); setEditCase(c); setEditTitle(c.title); }}
                                  className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors">
                                  <Pencil className="w-2.5 h-2.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteCase(c); setDropOpen(false); }}
                                  className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors">
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Consolidated Unassigned bucket — clickable. Switches the
                    Case Hub VIEW to the Unassigned bucket so Sessions /
                    Drafts tabs list every session whose case is private
                    Unassigned (matches the count badge). It does NOT
                    reassign the active session's case — handleCaseChange
                    and handleSelectCase both treat Unassigned picks as
                    display-only (no SESSION_CASES write, no PATCH), so
                    the active session keeps its own private case + docs. */}
                {unassignedCases.length > 0 && (
                  <div
                    onClick={() => {
                      if (activeIsUnassigned) return;
                      const isTemp = !currentSessionId || currentSessionId.startsWith("temp_");
                      // Picking the first id is fine because activeIsUnassigned
                      // (derived from title) is what the tabs filter on — they
                      // expand to ALL unassigned cases via inActiveBucket().
                      onCaseChange?.(unassignedCases[0].id);
                      if (isTemp) {
                        toast.success("Viewing Unassigned — your next message will create a fresh private case for this chat");
                      }
                    }}
                    className={`group relative mx-1 mt-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                      activeIsUnassigned
                        ? "bg-gradient-to-r from-[var(--accent)]/10 to-transparent ring-1 ring-[var(--accent)]/20"
                        : "hover:bg-[var(--surface-hover)]"
                    }`}
                    title="Each session has its own private Unassigned case. Documents stay isolated to the session."
                  >
                    {activeIsUnassigned && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-[var(--accent)]" />}
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${activeIsUnassigned ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[#F5F0E8] text-[var(--text-muted)]"}`}>
                      <BriefcaseIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">Unassigned</p>
                      <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                        {unassignedSessionCount} private session{unassignedSessionCount === 1 ? "" : "s"} · isolated docs
                      </p>
                    </div>
                  </div>
                )}

                {/* Explainer — surfaces the auto-assignment behaviour
                    so users understand they don't need to pick a case
                    upfront; one is auto-created for every new chat. */}
                <div className="mx-2 mt-2 px-2.5 py-2 rounded-lg bg-[var(--lex-cream-soft)] border border-[var(--border-light)]">
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    <span className="font-semibold text-[var(--text-secondary)]">Auto-assignment:</span>{" "}
                    Every new chat is automatically placed in its own private
                    <span className="font-semibold"> Unassigned</span> case
                    — your documents stay isolated to that session. Pick a
                    named case above to share documents across multiple
                    sessions, or hit{" "}
                    <span className="font-semibold">+ Add new case</span> below.
                  </p>
                </div>
              </div>

              {/* Footer — add new */}
              <div className="border-t p-1.5" style={{ borderColor: "#F0EBE3", background: "linear-gradient(to bottom, transparent, rgba(245,240,232,0.4))" }}>
                <button type="button" onClick={() => { setDropOpen(false); setAddOpen(true); }}
                  className="group w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-[var(--accent)]/8 transition-all">
                  <div className="w-5 h-5 rounded-md bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-[var(--text-primary)]">Add new case</p>
                    <p className="text-[9px] text-[var(--text-muted)]">Start a fresh research thread</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Delete confirmation ───────────────────────────────── */}
        {deleteCase && (
          <div className="mx-3 mb-2 rounded-xl bg-red-50 border border-red-200 p-3">
            <p className="text-[11px] font-semibold text-red-800 mb-0.5">Archive "{deleteCase.title}"?</p>
            <p className="text-[10px] text-red-700 mb-2">Sessions move to Unassigned.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDeleteCase(null)} disabled={deleteLoading}
                className="flex-1 py-1 text-[11px] font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-100 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={deleteLoading}
                className="flex-1 py-1 text-[11px] font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-colors">
                {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Archive
              </button>
            </div>
          </div>
        )}

        {/* ── Active case quick bar ─────────────────────────────── */}
        {activeCase && !dropOpen && (
          <div className="mx-3 mb-2 rounded-xl bg-white border overflow-hidden" style={{ borderColor: "#E8E3DA", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="h-0.5 bg-gradient-to-r from-[var(--accent)]/30 via-[var(--accent)] to-[var(--accent)]/30" />
            <div className="grid grid-cols-4 divide-x" style={{ borderColor: "#F0EBE3" }}>
              {[
                { icon: <UploadCloud className="w-3.5 h-3.5" />, label: "Upload", action: onUploadDocument ?? (() => router.push("/dashboard/documents")) },
                { icon: <Pencil className="w-3.5 h-3.5" />, label: "Draft", action: onNewSession },
                { icon: <StickyNote className="w-3.5 h-3.5" />, label: "Note", action: () => router.push("/dashboard/matters") },
                { icon: <CalendarPlus className="w-3.5 h-3.5" />, label: "Hearing", action: () => router.push("/dashboard/deadlines") },
              ].map(({ icon, label, action }) => (
                <button key={label} type="button" onClick={action}
                  className="flex flex-col items-center gap-0.5 py-2.5 text-[var(--text-secondary)] hover:bg-[#F9F6F0] hover:text-[var(--accent)] transition-colors" style={{ borderColor: "#F0EBE3" }}>
                  {icon}
                  <span className="text-[8px] font-semibold uppercase tracking-wide">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Case documents with checkboxes ───────────────────── */}
        {currentCaseId && !dropOpen && (
          <div className="mx-3 mb-2 rounded-xl bg-white border overflow-hidden" style={{ borderColor: "#E8E3DA" }}>
            <button type="button" onClick={() => setFilesOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#FAFAF7] transition-colors">
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[11px] font-semibold text-[var(--text-primary)]">Documents</span>
                {!docsLoading && docs.length > 0 && (
                  <span className="text-[9px] bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.5 rounded-full font-bold">{docs.length}</span>
                )}
              </div>
              <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${filesOpen ? "rotate-180" : ""}`} />
            </button>
            {filesOpen && (
              <div className="border-t" style={{ borderColor: "#F0EBE3" }}>
                {docsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-3.5 h-3.5 text-[var(--text-muted)] animate-spin" />
                    <span className="text-[11px] text-[var(--text-muted)]">Loading…</span>
                  </div>
                ) : docs.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <AlertCircle className="w-4 h-4 mx-auto mb-1 text-[var(--text-muted)]" />
                    <p className="text-[10px] text-[var(--text-muted)]">No documents for this case</p>
                    <button type="button" onClick={onUploadDocument ?? (() => router.push("/dashboard/documents"))}
                      className="mt-1.5 text-[10px] text-[var(--accent)] hover:underline inline-flex items-center gap-0.5">
                      <UploadCloud className="w-2.5 h-2.5" /> Upload
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[9px] text-[var(--text-muted)] px-3 pt-2 pb-1">Tick files to attach them to the session</p>
                    {docs.map((d) => {
                      const checked = selectedDocs.has(d.id);
                      const name = d.filename ?? d.title ?? d.id;
                      const isDeleting = deletingDocId === d.id;
                      return (
                        // Row split: clickable area (checkbox + name) toggles
                        // selection; trailing trash icon deletes the doc.
                        // Wrapped in a single border-t container so the row
                        // separator stays consistent with previous styling.
                        <div key={d.id} className={`group/doc flex items-stretch border-t transition-colors ${checked ? "bg-[var(--accent)]/5" : "hover:bg-[#FAFAF7]"}`} style={{ borderColor: "#F5F0E8" }}>
                          <button
                            type="button"
                            onClick={() => toggleDoc(d.id)}
                            disabled={isDeleting}
                            className="flex-1 flex items-center gap-2.5 px-3 py-2 text-left min-w-0 disabled:opacity-50"
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${checked ? "bg-[var(--accent)] border-[var(--accent)]" : "bg-white border-[#D0C8BE]"}`}>
                              {checked && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#F5F0E8" }}>
                              <FileText className="w-3 h-3 text-[var(--accent)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">{name}</p>
                              <p className="text-[9px] text-[var(--text-muted)]">{d.content_type ?? "Document"}{d.status ? ` · ${d.status}` : ""}</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingDoc(d)}
                            disabled={isDeleting}
                            aria-label={`View ${name}`}
                            title="View document"
                            className="flex items-center justify-center w-9 px-2 text-[var(--text-muted)] hover:bg-[var(--lex-cream-deep)] hover:text-[var(--lex-maroon)] disabled:opacity-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(d.id, name)}
                            disabled={isDeleting}
                            aria-label={`Delete ${name}`}
                            title="Delete document"
                            className="flex items-center justify-center w-9 px-2 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      );
                    })}
                    {selectedDocs.size > 0 && (
                      <div className="px-3 py-2 bg-[var(--accent)]/5 border-t" style={{ borderColor: "#F0EBE3" }}>
                        <button type="button" onClick={handleAttach}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-sm">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          Attach {selectedDocs.size} file{selectedDocs.size > 1 ? "s" : ""} to chat
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Sessions / Drafts tabs ────────────────────────────── */}
        {!dropOpen && (
          <>
            <div className="px-3 mb-1">
              <div className="flex rounded-lg p-0.5" style={{ background: "#EDE8E0" }}>
                <TabBtn active={activeTab === "sessions"} onClick={() => setActiveTab("sessions")}>
                  Sessions
                  {caseSessions.length > 0 && (
                    <span className="ml-1 text-[9px] bg-[var(--accent)]/20 text-[var(--accent)] px-1.5 py-0.5 rounded-full font-bold">
                      {caseSessions.length}
                    </span>
                  )}
                </TabBtn>
                <TabBtn active={activeTab === "drafts"} onClick={() => setActiveTab("drafts")}>
                  Drafts
                  {totalDraftsInBucket > 0 && (
                    // Total drafts across every session in the active
                    // bucket — a session with 3 drafts contributes 3 to
                    // this badge, not 1. Matches the per-row pill below.
                    <span className="ml-1 text-[9px] bg-[var(--accent)]/20 text-[var(--accent)] px-1.5 py-0.5 rounded-full font-bold">
                      {totalDraftsInBucket}
                    </span>
                  )}
                </TabBtn>
              </div>
            </div>

            {/* Sessions tab */}
            {activeTab === "sessions" && (
              <div className="px-3 pb-2">
                {!currentCaseId ? (
                  <div className="py-5 text-center">
                    <Scale className="w-5 h-5 mx-auto mb-1.5 text-[var(--text-muted)] opacity-40" />
                    <p className="text-[11px] text-[var(--text-muted)]">Select a case above to see its sessions</p>
                  </div>
                ) : caseSessions.length === 0 ? (
                  <div className="py-5 text-center">
                    <MessageSquare className="w-5 h-5 mx-auto mb-1.5 text-[var(--text-muted)] opacity-40" />
                    <p className="text-[11px] text-[var(--text-muted)]">No sessions linked to this case yet</p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Research threads assigned here will appear</p>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {caseSessions.map((s) => {
                      const isActive = currentSessionId === s.id;
                      const preview = msgPreview(s);
                      const msgCount = s.messages.filter((m) => m.role === "user").length;
                      const drafts = draftCount(s);
                      return (
                        <li key={s.id}>
                          <button type="button" onClick={() => onSelectSession(s.id)}
                            className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all border group
                              ${isActive
                                ? "bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 border-[var(--accent)]/30 shadow-sm"
                                : "bg-white border-[#E8E3DA] hover:border-[var(--accent)]/25 hover:shadow-sm"}`}>
                            {/* Avatar */}
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                              ${isActive ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-[#F5F0E8] text-[var(--text-muted)] group-hover:bg-[var(--accent)]/10 group-hover:text-[var(--accent)]"}`}>
                              <MessageSquare className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {/* Title */}
                              <p className={`text-[12px] font-semibold truncate leading-tight ${isActive ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>
                                {s.title || "Untitled session"}
                              </p>
                              {/* Preview */}
                              {preview && (
                                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">{preview}</p>
                              )}
                              {/* Meta row */}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] text-[var(--text-muted)] inline-flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />{relativeDateLabel(s.updatedAt)}
                                </span>
                                {msgCount > 0 && (
                                  <span className="text-[9px] text-[var(--text-muted)]">
                                    {msgCount} {msgCount === 1 ? "query" : "queries"}
                                  </span>
                                )}
                                {drafts > 0 && (
                                  <span className="text-[9px] inline-flex items-center gap-0.5 text-[var(--lex-rust)] bg-[var(--lex-rust-soft)] px-1.5 py-[1px] rounded-full font-semibold">
                                    <PenLine className="w-2.5 h-2.5" />
                                    {drafts} {drafts === 1 ? "draft" : "drafts"}
                                  </span>
                                )}
                                {isActive && (
                                  <span className="ml-auto text-[9px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <button type="button" onClick={onNewSession}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-[var(--accent)] border border-dashed hover:bg-[var(--accent)]/5 transition-colors"
                  style={{ borderColor: "rgba(198,167,110,0.4)" }}>
                  <Plus className="w-3.5 h-3.5" /> New session
                </button>
              </div>
            )}

            {/* Drafts tab */}
            {activeTab === "drafts" && (
              <div className="px-3 pb-2">
                {draftSessions.length === 0 ? (
                  <div className="py-6 text-center">
                    <PenLine className="w-6 h-6 mx-auto mb-2 text-[var(--text-muted)] opacity-40" />
                    <p className="text-[12px] font-medium text-[var(--text-muted)]">No drafts yet</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Ask the AI "draft a…" in any session</p>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {draftSessions.map((s) => {
                      const isActive = currentSessionId === s.id;
                      const snippet = draftSnippet(s);
                      const drafts = draftCount(s);
                      const linkedCaseId = effectiveCaseId(s);
                      const linkedCase = linkedCaseId ? cases.find((c) => c.id === linkedCaseId) : null;
                      return (
                        <li key={s.id}>
                          <button type="button" onClick={() => onSelectSession(s.id)}
                            className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all border group
                              ${isActive
                                ? "bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 border-[var(--accent)]/30 shadow-sm"
                                : "bg-white border-[#E8E3DA] hover:border-[var(--accent)]/25 hover:shadow-sm"}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isActive ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "text-[var(--accent)]"}`}
                              style={{ background: isActive ? undefined : "#F5F0E8" }}>
                              <PenLine className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{s.title || "Untitled draft"}</p>
                              {snippet && (
                                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed italic">"{snippet}…"</p>
                              )}
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[9px] text-[var(--text-muted)] inline-flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />{relativeDateLabel(s.updatedAt)}
                                </span>
                                {drafts > 0 && (
                                  <span className="text-[9px] inline-flex items-center gap-0.5 text-[var(--lex-rust)] bg-[var(--lex-rust-soft)] px-1.5 py-[1px] rounded-full font-semibold">
                                    <PenLine className="w-2.5 h-2.5" />
                                    {drafts} {drafts === 1 ? "draft" : "drafts"}
                                  </span>
                                )}
                                {linkedCase && (
                                  <span className="text-[9px] text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[100px]">
                                    {linkedCase.title}
                                  </span>
                                )}
                                {isActive && (
                                  <span className="ml-auto text-[9px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </>
        )}

        <div className="h-3" />
      </div>

      {/* Document viewer — re-fetches the doc on open to get a fresh
          signed_url, then renders inline based on mime_type. Cast bridges
          this file's local `CaseDoc` (subset) to the repository's full
          `CaseDocument` shape that DocumentViewer expects. */}
      {viewingDoc && currentCaseId && (
        <DocumentViewer
          caseId={currentCaseId}
          doc={viewingDoc as unknown as import("@/modules/legal/repository/document.repository").CaseDocument}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${active ? "bg-white text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>
      {children}
    </button>
  );
}

/* ─── Export ─────────────────────────────────────────────────── */
export default function CasesPanel(props: CasesPanelProps) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Sheet open={props.open} onOpenChange={(open) => !open && props.onToggle()}>
        <SheetContent side="right" className="w-80 p-0 border-0">
          <PanelContent {...props} onClose={props.onToggle} />
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <aside
      className={`hidden lg:flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${props.open ? "opacity-100" : "w-0 opacity-0 pointer-events-none"}`}
      style={{ boxShadow: props.open ? "-4px 0 24px rgba(0,0,0,0.06)" : "none", width: props.open ? undefined : 0 }}
    >
      {props.open && <PanelContent {...props} onClose={props.onToggle} />}
    </aside>
  );
}
