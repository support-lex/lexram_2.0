"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown, ChevronRight, Download, ExternalLink,
  FileText, Image as ImageIcon, Info, Loader2, Sparkles,
} from "lucide-react";
import {
  listMyCases, getDocumentViewUrl,
  type TsrCaseSummary, type TsrDocument,
} from "@/lib/tsr-api";
import { getMockCases } from "@/lib/tsr-mock";

/* ── Formatting helpers ────────────────────────────────────────────────── */

function fmtBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-IN");
}

/** Drives the case status pill colour. */
const STATUS_PILL: Record<string, { bg: string; text: string; dot: string }> = {
  new:        { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  uploading:  { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  extracting: { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  processing: { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  querying:   { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  complete:   { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A" },
  error:      { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_PILL[status] ?? STATUS_PILL.new;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {status}
    </span>
  );
}

function DocIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isImage = ["png", "jpg", "jpeg", "tiff", "tif", "webp"].includes(ext);
  return isImage
    ? <ImageIcon className="w-4 h-4 text-rust shrink-0" />
    : <FileText  className="w-4 h-4 text-maroon shrink-0" />;
}

/* ── Per-case row + collapsible documents table ─────────────────────────── */

function DocumentRow({ caseId, doc, isMock }: { caseId: string; doc: TsrDocument; isMock: boolean }) {
  const [loading, setLoading] = useState(false);

  const onView = async () => {
    if (isMock) {
      alert(`Demo mode — "${doc.filename}" preview is disabled.\nWill open the real PDF once the backend is wired.`);
      return;
    }
    setLoading(true);
    try {
      const { url } = await getDocumentViewUrl(caseId, doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("[view-url] failed:", err);
      alert("Could not load document. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="border-t border-maroon/8 hover:bg-cream-warm/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <DocIcon name={doc.filename} />
          <span className="text-sm text-ink font-medium truncate">{doc.filename}</span>
        </div>
      </td>
      <td className="px-4 py-3"><StatusPill status={doc.status} /></td>
      <td className="px-4 py-3 text-sm text-ink/70">{fmtBytes(doc.file_size)}</td>
      <td className="px-4 py-3 text-sm text-ink/70">
        {doc.page_count != null
          ? doc.page_count
          : <span title="Page count not recorded — re-process to backfill" className="text-ink/40">—</span>}
      </td>
      <td className="px-4 py-3 text-sm text-ink/60">{fmtDate(doc.created_at)}</td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onView}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-maroon hover:text-rust disabled:opacity-50 transition-colors"
        >
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <ExternalLink className="w-3.5 h-3.5" />
          }
          View
        </button>
      </td>
    </tr>
  );
}

function CaseRow({ row, isMock }: { row: TsrCaseSummary; isMock: boolean }) {
  const [open, setOpen] = useState(false);
  const hasReport = !!row.scrutiny_report;
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <>
      <tr className="border-t border-maroon/10 hover:bg-cream-warm/20 transition-colors">
        <td className="px-4 py-3.5">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-start gap-2 text-left group"
            aria-expanded={open}
          >
            <Chevron className="w-4 h-4 mt-0.5 shrink-0 text-maroon/60 group-hover:text-maroon transition-colors" />
            <span>
              <span className="block font-semibold text-ink leading-tight">{row.case_name}</span>
              <span className="block text-[11px] text-ink/55 mt-0.5">{row.case_no}</span>
            </span>
          </button>
        </td>
        <td className="px-4 py-3.5 text-sm text-ink/75">{row.bank_name}</td>
        <td className="px-4 py-3.5"><StatusPill status={row.status} /></td>
        <td className="px-4 py-3.5 text-sm text-ink/75">{row.document_count}</td>
        <td className="px-4 py-3.5 text-sm text-ink/75">
          {row.token_usage ? fmtNum(row.token_usage.total_tokens) : <span className="text-ink/40">—</span>}
        </td>
        <td className="px-4 py-3.5 text-sm text-ink/60">{fmtDate(row.created_at)}</td>
        <td className="px-4 py-3.5 text-right">
          {hasReport ? (
            <a
              href={`/dashboard/tsr/${row.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-maroon hover:text-rust transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Open
            </a>
          ) : (
            <span className="text-xs text-ink/40">No report yet</span>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="bg-cream-soft/60 px-4 py-4 border-t border-maroon/10">
            {row.documents.length === 0 ? (
              <p className="text-xs text-ink/55 italic px-2">No documents uploaded for this client yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-maroon/8 bg-cream">
                <table className="w-full text-left">
                  <thead className="text-[10px] tracking-[0.18em] uppercase text-ink/55 bg-cream-soft/40">
                    <tr>
                      <th className="px-4 py-2 font-medium">File</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Size</th>
                      <th className="px-4 py-2 font-medium">Pages</th>
                      <th className="px-4 py-2 font-medium">Uploaded</th>
                      <th className="px-4 py-2 font-medium text-right">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.documents.map((d) => (
                      <DocumentRow key={d.id} caseId={row.id} doc={d} isMock={isMock} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Page shell ────────────────────────────────────────────────────────── */

export default function MyCasesPage() {
  const [cases,   setCases]   = useState<TsrCaseSummary[] | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  /* True when the page is showing demo fixtures because the backend isn't
     wired yet. Surface this with a banner so demos aren't mistaken for prod. */
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listMyCases();
        if (!cancelled) {
          setCases(data);
          setUsingMock(false);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("[my-cases] backend unavailable — falling back to demo data:", message);
        if (!cancelled) {
          setCases(getMockCases());
          setUsingMock(true);
          /* Stash the backend error so we can surface it inside the banner —
             helps the team debug while still letting designers preview. */
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalDocs   = useMemo(() => cases?.reduce((n, c) => n + c.document_count, 0) ?? 0, [cases]);
  const totalTokens = useMemo(() => cases?.reduce((n, c) => n + (c.token_usage?.total_tokens ?? 0), 0) ?? 0, [cases]);

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto w-full bg-cream">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
          <Sparkles className="w-3 h-3 text-rust" />
          History
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-maroon">
          My Cases
        </h1>
        <p className="text-sm sm:text-base text-ink/65 mt-2 max-w-2xl">
          Every client file you've created, with its documents and scrutiny status.
          Click a row to expand the document list.
        </p>
      </div>

      {/* Summary stat strip */}
      {!loading && cases && cases.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { k: fmtNum(cases.length), v: "Total clients" },
            { k: fmtNum(totalDocs),    v: "Documents" },
            { k: fmtNum(totalTokens),  v: "Tokens used" },
          ].map((s) => (
            <div key={s.v} className="rounded-xl border border-maroon/12 bg-cream-soft/70 px-4 py-3">
              <div className="font-display text-2xl font-bold text-maroon leading-none">{s.k}</div>
              <div className="text-[10px] tracking-[0.18em] uppercase text-ink/55 mt-2">{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Demo-mode banner — shows when we couldn't reach the backend and are
          rendering fixture data instead. Disappears the moment the backend is
          live and returns a real response. */}
      {!loading && usingMock && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-amber-50 border border-amber-200">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900">
              Showing demo data
            </p>
            <p className="text-sm text-amber-800/90 mt-0.5 leading-relaxed">
              The <code className="px-1.5 py-0.5 rounded bg-amber-100 text-[12px] font-mono">/my-cases</code> backend endpoint isn&apos;t ready yet — once <code className="px-1.5 py-0.5 rounded bg-amber-100 text-[12px] font-mono">SUPABASE_JWT_SECRET</code> is set on Render and the service redeploys, real cases will populate automatically.
            </p>
            {error && (
              <details className="mt-2 text-xs text-amber-800/75">
                <summary className="cursor-pointer hover:text-amber-900 transition-colors">Backend response</summary>
                <pre className="mt-1.5 text-[11px] font-mono whitespace-pre-wrap break-words bg-amber-100/60 rounded p-2">{error}</pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-maroon" />
        </div>
      )}

      {!loading && cases && cases.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6 rounded-2xl border border-maroon/10 bg-cream-soft/60">
          <div className="w-14 h-14 rounded-2xl bg-maroon/10 grid place-items-center mb-3">
            <FileText className="w-6 h-6 text-maroon/60" />
          </div>
          <h2 className="font-display text-xl font-bold text-maroon mb-1.5">No clients yet</h2>
          <p className="text-sm text-ink/60 max-w-sm">
            Open the sidebar and click <strong className="text-rust">+ New Client</strong> to grant a Title Scrutiny Report.
          </p>
        </div>
      )}

      {!loading && cases && cases.length > 0 && (
        <div className="rounded-2xl border border-maroon/12 bg-cream-soft overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-maroon/[0.04] text-[10px] tracking-[0.2em] uppercase text-ink/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Bank</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Docs</th>
                  <th className="px-4 py-3 font-medium">Tokens</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Report</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => <CaseRow key={c.id} row={c} isMock={usingMock} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
