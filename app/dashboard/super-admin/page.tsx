"use client";

/**
 * Super Admin Dashboard
 *
 * GET https://lex-doc-analyzer.onrender.com/api/superadmin/dashboard
 *   Authorization: Bearer <supabase_access_token>
 *
 * Access control (driven by the server's own response codes — we don't try to
 * second-guess from the JWT, because the API is the source of truth):
 *   • 401 → redirect to /sign-in
 *   • 403 → redirect to /dashboard/tsr + toast "Access denied."
 *
 * Layout
 *   ┌── Summary cards: total_users / total_cases / total_documents / total_tokens
 *   ▼ User row (expandable)
 *       ▼ Case row (expandable)
 *           • Document row (terminal — table)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users, Briefcase, FileText, Cpu, ChevronRight, ChevronDown,
  Crown, Loader2, AlertCircle, Search, RefreshCw, ExternalLink,
  Image as ImageIcon, ShieldCheck, Sparkles, Hash, Banknote,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// ─── Types (mirror the API exactly) ─────────────────────────────────────────

interface AdminDocument {
  doc_id:      string;
  filename:    string;
  mime_type:   string;
  file_size:   number;
  page_count:  number;
  status:      string;
  uploaded_at: string;
}

interface AdminCase {
  case_id:               string;
  case_name:             string;
  case_no:               string | null;
  bank_name:             string | null;
  status:                string;
  progress:              number;
  token_usage:           { input_tokens: number; output_tokens: number; total_tokens: number };
  document_count:        number;
  total_pages:           number;
  total_file_size_bytes: number;
  report_file_url:       string | null;
  created_at:            string;
  updated_at:            string;
  documents:             AdminDocument[];
}

interface AdminUser {
  user_id:        string | null;
  email:          string | null;
  full_name:      string | null;
  is_super_admin: boolean;
  joined_at:      string | null;
  case_count:     number;
  total_tokens:   number;
  cases:          AdminCase[];
}

interface SuperAdminDashboardResponse {
  generated_at: string;
  summary: {
    total_users:     number;
    total_cases:     number;
    total_documents: number;
    total_tokens:    number;
  };
  users: AdminUser[];
}

const API_URL = "https://lex-doc-analyzer.onrender.com/api/superadmin/dashboard";

// Mock payload mirrors the spec exactly — used by the "Preview with mock data"
// button so the UI can be demo'd before the real endpoint ships.
const MOCK_RESPONSE: SuperAdminDashboardResponse = {
  generated_at: "2026-05-28T10:00:00+00:00",
  summary: { total_users: 3, total_cases: 5, total_documents: 12, total_tokens: 125430 },
  users: [
    {
      user_id: "a1b2c3d4-0001", email: "marikannant6329@gmail.com", full_name: "Mari Kannan",
      is_super_admin: true, joined_at: "2026-01-15T08:00:00+00:00",
      case_count: 3, total_tokens: 98000,
      cases: [
        {
          case_id: "d9c0f683-43b7-4607-b5ad", case_name: "Test001", case_no: "001", bank_name: "SBI",
          status: "complete", progress: 100,
          token_usage: { input_tokens: 22000, output_tokens: 6082, total_tokens: 28082 },
          document_count: 4, total_pages: 24, total_file_size_bytes: 5242880,
          report_file_url: "https://storage.googleapis.com/example/report.pdf",
          created_at: "2026-05-26T10:00:00+00:00", updated_at: "2026-05-26T12:30:00+00:00",
          documents: [
            { doc_id: "e1f2-0011", filename: "Building Plan Approval.pdf", mime_type: "application/pdf",
              file_size: 1258291, page_count: 3, status: "processed", uploaded_at: "2026-05-26T10:05:00+00:00" },
            { doc_id: "e1f2-0012", filename: "General Power of Attorney 5969.pdf", mime_type: "application/pdf",
              file_size: 2097152, page_count: 15, status: "processed", uploaded_at: "2026-05-26T10:06:00+00:00" },
          ],
        },
        {
          case_id: "d9c0f683-43b7-4607-b5ae", case_name: "Test01", case_no: null, bank_name: null,
          status: "complete", progress: 100,
          token_usage: { input_tokens: 8000, output_tokens: 4000, total_tokens: 12000 },
          document_count: 1, total_pages: 5, total_file_size_bytes: 524288,
          report_file_url: null,
          created_at: "2026-05-20T10:00:00+00:00", updated_at: "2026-05-20T11:00:00+00:00",
          documents: [
            { doc_id: "e1f2-0013", filename: "Sale Deed.pdf", mime_type: "application/pdf",
              file_size: 524288, page_count: 5, status: "processed", uploaded_at: "2026-05-20T10:05:00+00:00" },
          ],
        },
      ],
    },
    {
      user_id: "a1b2c3d4-0002", email: "saras@lexram.ai", full_name: null,
      is_super_admin: false, joined_at: "2026-02-10T09:00:00+00:00",
      case_count: 1, total_tokens: 12000, cases: [],
    },
  ],
};

// ─── Formatting helpers ─────────────────────────────────────────────────────

function fmtNum(n: number): string {
  return n.toLocaleString("en-IN");
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-IN");
}

function fmtBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Status badge — spec-defined colours ────────────────────────────────────

type StatusKind = "complete" | "error" | "processing" | "uploading" | "default";

function classifyStatus(s: string): StatusKind {
  const t = (s ?? "").toLowerCase();
  if (t === "complete" || t === "processed") return "complete";
  if (t === "error" || t === "failed")       return "error";
  if (t === "processing" || t === "extracting" || t === "querying") return "processing";
  if (t === "uploading" || t === "new" || t === "pending") return "uploading";
  return "default";
}

function StatusBadge({ status }: { status: string }) {
  const kind = classifyStatus(status);
  const palette: Record<StatusKind, { bg: string; text: string; dot: string }> = {
    complete:   { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A" },
    error:      { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626" },
    processing: { bg: "#FEF3C7", text: "#78350F", dot: "#D97706" },
    uploading:  { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
    default:    { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  };
  const p = palette[kind];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
      style={{ backgroundColor: p.bg, color: p.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.dot }} />
      {status || "—"}
    </span>
  );
}

// ─── Summary card ───────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  Icon:  React.ComponentType<{ className?: string }>;
  accent?: "maroon" | "rust";
}
function SummaryCard({ label, value, Icon, accent = "maroon" }: SummaryCardProps) {
  const tile = accent === "rust"
    ? "bg-rust text-cream shadow-[0_12px_28px_-16px_rgba(185,72,38,0.55)]"
    : "bg-maroon text-cream shadow-[0_12px_28px_-16px_rgba(104,3,24,0.55)]";
  return (
    <div className="rounded-2xl border border-maroon/15 bg-cream-soft p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl grid place-items-center ${tile}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-rust">{label}</p>
        <p className="font-display text-2xl font-bold text-maroon mt-0.5 leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Document row (level 3) ─────────────────────────────────────────────────

function DocIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isImg = ["png", "jpg", "jpeg", "tiff", "tif", "webp"].includes(ext);
  return isImg ? <ImageIcon className="w-4 h-4 text-rust shrink-0" />
               : <FileText  className="w-4 h-4 text-maroon shrink-0" />;
}

function DocumentRow({ doc }: { doc: AdminDocument }) {
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 border-t border-maroon/8 hover:bg-cream-soft/60 transition-colors">
      <DocIcon name={doc.filename} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink/85 font-medium truncate">{doc.filename}</p>
        <p className="text-[10px] text-ink/50 mt-0.5">
          {doc.mime_type} · uploaded {fmtDate(doc.uploaded_at)}
        </p>
      </div>
      <span className="text-[11px] text-ink/65 font-medium shrink-0 hidden sm:inline-block w-16 text-right">
        {doc.page_count} {doc.page_count === 1 ? "page" : "pages"}
      </span>
      <span className="text-[11px] text-ink/65 font-medium shrink-0 hidden sm:inline-block w-20 text-right">
        {fmtBytes(doc.file_size)}
      </span>
      <div className="shrink-0">
        <StatusBadge status={doc.status} />
      </div>
    </li>
  );
}

// ─── Case row (level 2) ─────────────────────────────────────────────────────

function CaseRow({ caseRow }: { caseRow: AdminCase }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-t border-maroon/8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-3 hover:bg-cream-soft/60 transition-colors text-left"
      >
        <span className={`w-5 h-5 rounded-md bg-rust/10 grid place-items-center transition-transform ${open ? "rotate-90" : ""}`}>
          <ChevronRight className="w-3 h-3 text-rust" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-maroon truncate">{caseRow.case_name}</p>
            <StatusBadge status={caseRow.status} />
          </div>
          <p className="text-[11px] text-ink/55 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {caseRow.case_no && <span className="inline-flex items-center gap-1"><Hash className="w-3 h-3 text-rust" />{caseRow.case_no}</span>}
            {caseRow.bank_name && <span className="inline-flex items-center gap-1"><Banknote className="w-3 h-3 text-rust" />{caseRow.bank_name}</span>}
            <span>{caseRow.document_count} {caseRow.document_count === 1 ? "doc" : "docs"}</span>
            <span>{caseRow.total_pages} pages</span>
            <span>{fmtBytes(caseRow.total_file_size_bytes)}</span>
            <span>{fmtTokens(caseRow.token_usage.total_tokens)} tokens</span>
          </p>
        </div>
        {caseRow.report_file_url && (
          <a
            href={caseRow.report_file_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-rust hover:text-maroon"
          >
            Report <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </button>

      {open && (
        <div className="px-4 pb-3">
          {caseRow.documents.length === 0 ? (
            <p className="text-[11px] text-ink/55 px-2 py-3 italic">No documents uploaded.</p>
          ) : (
            <div className="rounded-xl border border-maroon/10 bg-cream/40 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 bg-maroon/8 text-[10px] font-bold tracking-[0.16em] uppercase text-maroon">
                <span>Document</span>
                <span className="hidden sm:inline-block w-16 text-right">Pages</span>
                <span className="hidden sm:inline-block w-20 text-right">Size</span>
                <span>Status</span>
              </div>
              <ul className="divide-y divide-maroon/5">
                {caseRow.documents.map((d) => <DocumentRow key={d.doc_id} doc={d} />)}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-[11px]">
            <div className="bg-cream-soft border border-maroon/10 rounded-lg p-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-rust">Input tokens</p>
              <p className="text-ink font-semibold mt-0.5">{fmtNum(caseRow.token_usage.input_tokens)}</p>
            </div>
            <div className="bg-cream-soft border border-maroon/10 rounded-lg p-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-rust">Output tokens</p>
              <p className="text-ink font-semibold mt-0.5">{fmtNum(caseRow.token_usage.output_tokens)}</p>
            </div>
            <div className="bg-cream-soft border border-maroon/10 rounded-lg p-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-rust">Total tokens</p>
              <p className="text-ink font-semibold mt-0.5">{fmtNum(caseRow.token_usage.total_tokens)}</p>
            </div>
            <div className="bg-cream-soft border border-maroon/10 rounded-lg p-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-rust">Progress</p>
              <p className="text-ink font-semibold mt-0.5">{caseRow.progress}%</p>
            </div>
          </div>
          <p className="text-[10px] text-ink/50 mt-2">
            Created {fmtDate(caseRow.created_at)} · Updated {fmtDate(caseRow.updated_at)}
          </p>
        </div>
      )}
    </li>
  );
}

// ─── User row (level 1) ─────────────────────────────────────────────────────

function UserRow({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-maroon/15 bg-cream-soft overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full grid grid-cols-[auto_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-cream transition-colors text-left"
      >
        <span className={`w-6 h-6 rounded-lg bg-maroon/10 grid place-items-center transition-transform ${open ? "rotate-90" : ""}`}>
          <ChevronRight className="w-3.5 h-3.5 text-maroon" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-bold text-maroon truncate">
              {user.full_name || user.email || "Unnamed user"}
            </p>
            {user.is_super_admin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rust text-cream text-[9px] font-bold tracking-[0.18em] uppercase">
                <Crown className="w-2.5 h-2.5" /> Super
              </span>
            )}
          </div>
          <p className="text-[11px] text-ink/55 mt-0.5 truncate">
            {user.email ?? "—"}
            {user.joined_at && <span className="mx-2 text-maroon/30">·</span>}
            {user.joined_at && <span>Joined {fmtDate(user.joined_at)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rust">Cases</p>
            <p className="font-display text-sm font-bold text-maroon">{fmtNum(user.case_count)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rust">Tokens</p>
            <p className="font-display text-sm font-bold text-maroon">{fmtTokens(user.total_tokens)}</p>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-maroon/10 bg-cream/40">
          {user.cases.length === 0 ? (
            <p className="text-xs text-ink/55 px-5 py-4 italic">No cases yet.</p>
          ) : (
            <ul>
              {user.cases.map((c) => <CaseRow key={c.case_id} caseRow={c} />)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<SuperAdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [query, setQuery] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    setUsingMock(false);
    try {
      const { data: sessionData } = await supabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.replace("/sign-in");
        return;
      }
      const res = await fetch(API_URL, {
        method:  "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache:   "no-store",
      });
      if (res.status === 401) {
        router.replace("/sign-in");
        return;
      }
      if (res.status === 403) {
        toast.error("Access denied.");
        router.replace("/dashboard/tsr");
        return;
      }
      if (res.status === 404) {
        setEndpointMissing(true);
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const body = (await res.json()) as SuperAdminDashboardResponse;
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadMock = useCallback(() => {
    setData(MOCK_RESPONSE);
    setUsingMock(true);
    setEndpointMissing(false);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.users;
    return data.users.filter((u) =>
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      u.cases.some((c) =>
        c.case_name.toLowerCase().includes(q) ||
        (c.case_no ?? "").toLowerCase().includes(q) ||
        (c.bank_name ?? "").toLowerCase().includes(q)
      )
    );
  }, [data, query]);

  return (
    <div className="min-h-full bg-cream px-4 sm:px-6 py-8 sm:py-10 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rust/12 text-rust text-[10px] font-bold tracking-[0.22em] uppercase mb-3">
            <ShieldCheck className="w-3 h-3" />
            Super Admin
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-maroon">
            Platform overview
          </h1>
          <p className="text-sm text-ink/65 mt-1.5">
            Every user, every case, every document — drill down to inspect activity across LEXRAM TSR.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-maroon hover:bg-maroon-deep disabled:opacity-50 text-cream text-sm font-semibold transition shadow-[0_10px_24px_-12px_rgba(104,3,24,0.55)]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <SummaryCard label="Total users"     value={data ? fmtNum(data.summary.total_users) : "—"}       Icon={Users}      accent="maroon" />
        <SummaryCard label="Total cases"     value={data ? fmtNum(data.summary.total_cases) : "—"}       Icon={Briefcase}  accent="rust"   />
        <SummaryCard label="Total documents" value={data ? fmtNum(data.summary.total_documents) : "—"}   Icon={FileText}   accent="maroon" />
        <SummaryCard label="Total tokens"    value={data ? fmtTokens(data.summary.total_tokens) : "—"}   Icon={Cpu}        accent="rust"   />
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maroon/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by user name, email, case, bank…"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-cream-soft border border-maroon/15 text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-maroon"
          />
        </div>
        {data && (
          <p className="text-[11px] text-ink/55 self-center">
            Generated {fmtDate(data.generated_at)} · {filteredUsers.length} / {data.users.length} users shown
          </p>
        )}
      </div>

      {/* Mock-mode banner */}
      {usingMock && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>Mock data preview.</strong> The real endpoint isn&apos;t deployed yet — this is the
            sample payload from the spec. <button onClick={fetchDashboard} className="underline font-semibold ml-1 hover:text-amber-900">Try the live endpoint again</button>.
          </p>
        </div>
      )}

      {/* Body */}
      {loading && !data ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-maroon" />
        </div>
      ) : endpointMissing ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 grid place-items-center shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Backend endpoint not deployed yet</p>
            <p className="text-xs text-amber-800/85 mt-1.5 leading-relaxed">
              <code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px]">GET {API_URL}</code> returned <strong>404 Not Found</strong>.
              The spec describes the endpoint but it hasn&apos;t been published on the Lex-Doc-Analyzer service yet.
              Have the backend team mount the handler, redeploy, and refresh this page.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={fetchDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-semibold transition"
              >
                <RefreshCw className="w-3 h-3" /> Retry live endpoint
              </button>
              <button
                type="button"
                onClick={loadMock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-maroon hover:bg-maroon-deep text-cream text-xs font-semibold transition"
              >
                <Sparkles className="w-3 h-3" /> Preview with mock data
              </button>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Could not load dashboard</p>
            <p className="text-xs text-red-700/85 mt-1 break-words">{error}</p>
            <button
              type="button"
              onClick={fetchDashboard}
              className="mt-3 text-xs font-semibold text-red-800 hover:text-red-900 inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      ) : !data || data.users.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-maroon/10 grid place-items-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-maroon/60" />
          </div>
          <p className="font-display text-lg font-bold text-maroon">No users yet</p>
          <p className="text-xs text-ink/55 mt-1">As users sign up and generate reports, they&apos;ll show up here.</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-ink/55">No matches for &ldquo;{query}&rdquo;.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => (
            <UserRow key={u.user_id ?? u.email ?? Math.random().toString()} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
