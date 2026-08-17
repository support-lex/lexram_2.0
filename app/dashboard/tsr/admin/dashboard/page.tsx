"use client";

// Super-admin TSR dashboard — User → Case → Document drill-down.
// Mirrors the lex-doc-analyzer reference design: top-level user list, each
// expanding into a case table that itself expands into the case's documents.

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, ChevronDown, ChevronRight, ExternalLink, FileText, Image as ImageIcon,
  LayoutDashboard, Loader2, RefreshCw, Search, Shield, TrendingUp, Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRoleContext, fmtTokens } from "@/lib/rbac";
import { getDocumentViewUrl } from "@/lib/tsr-api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdminDocument {
  id: string;
  filename: string;
  status: string;
  created_at: string;
  file_size: number;
  page_count: number;
}

interface AdminCase {
  id: string;
  case_name: string;
  case_no: string;
  bank_name: string;
  status: string;
  org_name: string | null;
  created_at: string;
  tokens: { input: number; output: number; total: number };
  document_count: number;
  page_count: number;
  documents: AdminDocument[];
}

interface AdminUser {
  user_id: string;
  email: string | null;
  stats: { cases: number; documents: number; tokens: number };
  cases: AdminCase[];
}

interface DashboardResponse {
  generated_at: string;
  summary: {
    total_users: number;
    total_cases: number;
    total_documents: number;
    total_tokens: number;
    total_orgs: number;
    pending_requests: number;
  };
  users: AdminUser[];
}

// ─── Display helpers ────────────────────────────────────────────────────────

const STATUS_PILL: Record<string, { bg: string; text: string; dot: string }> = {
  new:        { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  uploading:  { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  extracting: { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  processing: { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  querying:   { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  uploaded:   { bg: "#DBEAFE", text: "#1E3A8A", dot: "#2563EB" },
  processed:  { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A" },
  complete:   { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A" },
  error:      { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_PILL[status] ?? STATUS_PILL.new;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {status}
    </span>
  );
}

function DocIcon({ filename }: { filename: string }) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const isImage = ["png", "jpg", "jpeg", "tiff", "tif", "webp"].includes(ext);
  return isImage
    ? <ImageIcon className="w-4 h-4 text-rust shrink-0" />
    : <FileText  className="w-4 h-4 text-maroon/60 shrink-0" />;
}

function fmtBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-IN");
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SuperAdminTsrDashboard() {
  const ctx = useRoleContext();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tsr-dashboard", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json as DashboardResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (ctx.loading) return;
    if (ctx.role !== "super_admin") { setLoading(false); return; }
    fetchData();
  }, [ctx.loading, ctx.role, fetchData]);

  const toggleUser = (id: string) => setExpandedUsers((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleCase = (id: string) => setExpandedCases((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const openDocument = async (caseId: string, doc: AdminDocument) => {
    setOpeningDoc(doc.id);
    try {
      const { url } = await getDocumentViewUrl(caseId, doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error("Could not load document", { description: (err as Error).message });
    } finally {
      setOpeningDoc(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.users;
    return data.users.filter((u) => {
      if ((u.email ?? "").toLowerCase().includes(q)) return true;
      if (u.user_id.toLowerCase().includes(q)) return true;
      return u.cases.some((c) =>
        c.case_name.toLowerCase().includes(q) ||
        c.case_no.toLowerCase().includes(q) ||
        (c.bank_name ?? "").toLowerCase().includes(q),
      );
    });
  }, [data, query]);

  // ── Gates ───────────────────────────────────────────────────────────────
  if (ctx.loading) {
    return <div className="min-h-full grid place-items-center py-20"><Loader2 className="w-5 h-5 animate-spin text-maroon" /></div>;
  }

  if (ctx.role !== "super_admin") {
    return (
      <div className="min-h-full flex flex-col items-center justify-center text-center px-6 py-20 bg-cream">
        <div className="w-16 h-16 rounded-2xl bg-maroon/10 grid place-items-center mb-3">
          <Shield className="w-7 h-7 text-maroon/60" />
        </div>
        <h1 className="font-display text-2xl font-bold text-maroon">Super admin only</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-md">
          The TSR dashboard is restricted to LexRam team accounts (app_metadata.role = super_admin).
        </p>
        <Link href="/dashboard/tsr/my-cases" className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-maroon text-cream text-sm font-semibold hover:bg-maroon-deep transition">
          Back to TSR
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 sm:py-10 max-w-7xl mx-auto w-full bg-cream">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            <LayoutDashboard className="w-3 h-3 text-rust" />
            Super admin · Dashboard
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight text-maroon">TSR Dashboard</h1>
          <p className="text-sm text-ink/65 mt-2">
            Every user, every case, every document — drill down to inspect activity across LEXRAM TSR.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep disabled:opacity-60 text-cream px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-[0_10px_24px_-12px_rgba(104,3,24,0.55)]"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Couldn&apos;t load dashboard</p>
            <p className="text-sm text-red-700/85 mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="min-h-[40vh] grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-maroon" />
        </div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            <StatCard icon={Users}      label="Total users"   primary={fmtNum(data.summary.total_users)} sub="With ≥1 case" />
            <StatCard icon={FileText}   label="Total cases"   primary={fmtNum(data.summary.total_cases)} sub={`${fmtNum(data.summary.total_orgs)} orgs`} />
            <StatCard icon={FileText}   label="Documents"     primary={fmtNum(data.summary.total_documents)} sub="Across all cases" />
            <StatCard icon={TrendingUp} label="Total tokens"  primary={fmtTokens(data.summary.total_tokens)} sub={`${data.summary.pending_requests} pending requests`} />
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="w-4 h-4 text-maroon/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by user email, user id, case name, case no, or bank…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-maroon/15 bg-cream-soft text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
            />
          </div>

          {/* User list */}
          <div className="rounded-2xl border border-maroon/12 bg-cream-soft overflow-hidden shadow-soft">
            {filteredUsers.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-ink/55">
                {data.users.length === 0
                  ? "No users have TSR cases yet."
                  : "No users match your filter."}
              </div>
            ) : filteredUsers.map((user, idx) => {
              const isOpen = expandedUsers.has(user.user_id);
              const Chevron = isOpen ? ChevronDown : ChevronRight;
              return (
                <div key={user.user_id} className={idx > 0 ? "border-t border-maroon/10" : ""}>
                  {/* User row */}
                  <button
                    type="button"
                    onClick={() => toggleUser(user.user_id)}
                    className="w-full flex items-center gap-4 px-4 sm:px-5 py-4 text-left hover:bg-maroon/[0.03] transition"
                  >
                    <Chevron className="w-4 h-4 text-maroon/55 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-maroon truncate">{user.email ?? "—"}</div>
                      <div className="text-[11px] text-ink/50 font-mono mt-0.5 truncate">{user.user_id}</div>
                    </div>
                    <UserStatCol label="cases"  value={fmtNum(user.stats.cases)} />
                    <UserStatCol label="docs"   value={fmtNum(user.stats.documents)} />
                    <UserStatCol label="tokens" value={fmtTokens(user.stats.tokens)} />
                  </button>

                  {/* Expanded: cases table */}
                  {isOpen && (
                    <div className="bg-cream/60 border-t border-maroon/10 px-3 sm:px-5 py-4">
                      {user.cases.length === 0 ? (
                        <p className="text-xs text-ink/55 italic px-2 py-3">No cases for this user.</p>
                      ) : (
                        <CasesTable
                          cases={user.cases}
                          expandedCases={expandedCases}
                          toggleCase={toggleCase}
                          openDocument={openDocument}
                          openingDoc={openingDoc}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, primary, sub,
}: {
  icon: typeof Users; label: string; primary: string; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-maroon/12 bg-cream-soft px-4 py-4 shadow-soft">
      <div className="flex items-center justify-between text-ink/55">
        <Icon className="w-4 h-4 text-rust" />
        <span className="text-[9px] tracking-[0.18em] uppercase">{label}</span>
      </div>
      <div className="font-display text-2xl font-bold text-maroon mt-1.5 leading-none">{primary}</div>
      {sub && <div className="text-[11px] text-ink/55 mt-1.5">{sub}</div>}
    </div>
  );
}

function UserStatCol({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right shrink-0 w-16 sm:w-20">
      <div className="font-display text-lg font-bold text-maroon leading-none">{value}</div>
      <div className="text-[9px] tracking-[0.18em] uppercase text-ink/55 mt-1.5">{label}</div>
    </div>
  );
}

function CasesTable({
  cases, expandedCases, toggleCase, openDocument, openingDoc,
}: {
  cases: AdminCase[];
  expandedCases: Set<string>;
  toggleCase: (id: string) => void;
  openDocument: (caseId: string, doc: AdminDocument) => void | Promise<void>;
  openingDoc: string | null;
}) {
  return (
    <div className="rounded-xl border border-maroon/10 bg-cream-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-maroon/[0.04] text-[10px] tracking-[0.2em] uppercase text-ink/60">
            <tr>
              <th className="w-8"></th>
              <th className="px-4 py-2.5 font-medium">Case</th>
              <th className="px-4 py-2.5 font-medium">Bank</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Docs</th>
              <th className="px-4 py-2.5 font-medium">Pages</th>
              <th className="px-4 py-2.5 font-medium text-right">Token usage</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const isOpen = expandedCases.has(c.id);
              const Chevron = isOpen ? ChevronDown : ChevronRight;
              return (
                <Fragment key={c.id}>
                  <tr className="border-t border-maroon/10 hover:bg-maroon/[0.03] transition">
                    <td className="pl-3 align-top pt-4">
                      <button onClick={() => toggleCase(c.id)} aria-label={isOpen ? "Collapse case" : "Expand case"}>
                        <Chevron className="w-3.5 h-3.5 text-maroon/55 hover:text-maroon" />
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink leading-tight">{c.case_name || "—"}</div>
                      <div className="text-[11px] text-ink/55 mt-0.5">{c.case_no || "—"}</div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-ink/85">{c.bank_name || "—"}</td>
                    <td className="px-4 py-3.5"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3.5 text-sm text-ink/85">{c.document_count}</td>
                    <td className="px-4 py-3.5 text-sm text-ink/85">{c.page_count}</td>
                    <td className="px-4 py-3.5">
                      <TokenUsageBlock tokens={c.tokens} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-maroon/10">
                      <td colSpan={7} className="bg-cream/60 px-4 py-3">
                        {c.documents.length === 0 ? (
                          <p className="text-xs text-ink/55 italic px-2 py-3">No documents uploaded for this case.</p>
                        ) : (
                          <DocumentsTable caseId={c.id} documents={c.documents} openDocument={openDocument} openingDoc={openingDoc} />
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TokenUsageBlock({ tokens }: { tokens: AdminCase["tokens"] }) {
  return (
    <div className="text-right text-[11px] leading-tight space-y-0.5 min-w-[120px]">
      <div className="flex justify-between gap-3"><span className="text-ink/55 uppercase tracking-wider">In</span>    <span className="text-ink font-medium">{fmtTokens(tokens.input)}</span></div>
      <div className="flex justify-between gap-3"><span className="text-ink/55 uppercase tracking-wider">Out</span>   <span className="text-ink font-medium">{fmtTokens(tokens.output)}</span></div>
      <div className="flex justify-between gap-3 pt-0.5 border-t border-maroon/10 mt-0.5"><span className="text-maroon/75 uppercase tracking-wider font-semibold">Total</span> <span className="text-maroon font-bold">{fmtTokens(tokens.total)}</span></div>
    </div>
  );
}

function DocumentsTable({
  caseId, documents, openDocument, openingDoc,
}: {
  caseId: string;
  documents: AdminDocument[];
  openDocument: (caseId: string, doc: AdminDocument) => void | Promise<void>;
  openingDoc: string | null;
}) {
  return (
    <div className="rounded-lg border border-maroon/10 bg-white overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-maroon/[0.04] text-[10px] tracking-[0.2em] uppercase text-ink/55">
          <tr>
            <th className="px-4 py-2 font-medium">File</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Size</th>
            <th className="px-4 py-2 font-medium">Pages</th>
            <th className="px-4 py-2 font-medium text-right">Link</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id} className="border-t border-maroon/8 hover:bg-cream-warm/30 transition">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <DocIcon filename={d.filename} />
                  <span className="text-sm text-ink font-medium truncate">{d.filename}</span>
                </div>
              </td>
              <td className="px-4 py-3"><StatusPill status={d.status} /></td>
              <td className="px-4 py-3 text-sm text-ink/70">{fmtBytes(d.file_size)}</td>
              <td className="px-4 py-3 text-sm text-ink/70">{d.page_count}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => openDocument(caseId, d)}
                  disabled={openingDoc === d.id}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-maroon hover:text-rust disabled:opacity-50 transition-colors"
                >
                  {openingDoc === d.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <ExternalLink className="w-3.5 h-3.5" />}
                  View Doc
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
