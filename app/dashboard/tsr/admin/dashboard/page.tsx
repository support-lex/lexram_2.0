"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, BarChart3, ChevronDown, ChevronRight,
  ExternalLink, FileText, Image as ImageIcon, Loader2,
  RefreshCw, Search, Shield, Users, Zap,
} from "lucide-react";
import { useRoleContext, fmtTokens } from "@/lib/rbac";

// ── Types ──────────────────────────────────────────────────────────────────

interface SuperAdminDocument {
  id:           string;
  file_name:    string;
  file_size_mb: number;
  page_count:   number | null;
  view_url:     string;
  status?:      string;
}

interface SuperAdminCase {
  id:                   string;
  case_number:          string;
  case_name:            string;
  bank_name:            string;
  status:               string;
  total_documents:      number;
  total_pages_all_docs: number;
  tokens_input:         number;
  tokens_output:        number;
  tokens_thinking:      number;
  tokens_total:         number;
  documents:            SuperAdminDocument[];
}

interface SuperAdminUser {
  user_id: string;
  email:   string;
  cases:   SuperAdminCase[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

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
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
      {status}
    </span>
  );
}

function DocIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isImage = ["png", "jpg", "jpeg", "tiff", "tif", "webp"].includes(ext);
  return isImage
    ? <ImageIcon className="w-4 h-4 text-rust shrink-0" />
    : <FileText  className="w-4 h-4 text-maroon/60 shrink-0" />;
}

function fmtMB(mb: number): string {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}

// ── Level 3: Document row ──────────────────────────────────────────────────

function DocumentRow({ doc }: { doc: SuperAdminDocument }) {
  return (
    <tr className="border-t border-maroon/8 hover:bg-cream-warm/30 transition-colors">
      <td className="pl-14 pr-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <DocIcon name={doc.file_name} />
          <span className="text-sm text-ink font-medium truncate max-w-xs">{doc.file_name}</span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        {doc.status
          ? <StatusPill status={doc.status} />
          : <span className="text-ink/35 text-xs">—</span>}
      </td>
      <td className="px-4 py-2.5 text-sm text-ink/65 tabular-nums">{fmtMB(doc.file_size_mb)}</td>
      <td className="px-4 py-2.5 text-sm text-ink/65 tabular-nums">
        {doc.page_count != null
          ? doc.page_count.toLocaleString("en-IN")
          : <span className="text-ink/35">—</span>}
      </td>
      <td className="px-4 py-2.5 text-right">
        {doc.view_url ? (
          <a
            href={doc.view_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon hover:text-rust transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Doc
          </a>
        ) : (
          <span className="text-xs text-ink/35">No URL</span>
        )}
      </td>
    </tr>
  );
}

// ── Level 2: Case row (expandable) ─────────────────────────────────────────

function CaseRow({ c }: { c: SuperAdminCase }) {
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <>
      <tr className="border-t border-maroon/8 bg-cream/50 hover:bg-cream-soft/70 transition-colors">
        {/* Case name + toggle */}
        <td className="pl-10 pr-4 py-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-start gap-2 text-left group"
            aria-expanded={open}
          >
            <Chevron className="w-3.5 h-3.5 mt-0.5 shrink-0 text-maroon/40 group-hover:text-maroon transition-colors" />
            <span>
              <span className="block text-sm font-semibold text-ink leading-tight">{c.case_name}</span>
              <span className="block text-[11px] text-ink/45 font-mono mt-0.5">{c.case_number}</span>
            </span>
          </button>
        </td>
        <td className="px-4 py-3 text-sm text-ink/75 whitespace-nowrap">{c.bank_name}</td>
        <td className="px-4 py-3 whitespace-nowrap"><StatusPill status={c.status} /></td>
        {/* Docs */}
        <td className="px-4 py-3">
          <span className="text-sm font-semibold text-ink tabular-nums">{c.total_documents}</span>
        </td>
        {/* Pages */}
        <td className="px-4 py-3">
          <span className="text-sm font-semibold text-ink tabular-nums">
            {c.total_pages_all_docs.toLocaleString("en-IN")}
          </span>
        </td>
        {/* Token breakdown */}
        <td className="px-4 py-3">
          <div className="flex flex-col gap-0.5 min-w-[130px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-ink/45 uppercase tracking-wider w-8">In</span>
              <span className="text-[11px] font-medium text-ink tabular-nums">{fmtTokens(c.tokens_input)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-ink/45 uppercase tracking-wider w-8">Out</span>
              <span className="text-[11px] font-medium text-ink tabular-nums">{fmtTokens(c.tokens_output)}</span>
            </div>
            {c.tokens_thinking > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-ink/45 uppercase tracking-wider w-8">Think</span>
                <span className="text-[11px] font-medium text-rust tabular-nums">{fmtTokens(c.tokens_thinking)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 border-t border-maroon/10 pt-0.5 mt-0.5">
              <span className="text-[10px] font-bold text-maroon/60 uppercase tracking-wider w-8">Total</span>
              <span className="text-[11px] font-bold text-maroon tabular-nums">{fmtTokens(c.tokens_total)}</span>
            </div>
          </div>
        </td>
      </tr>

      {/* Level 3: Documents */}
      {open && (
        <tr>
          <td colSpan={6} className="p-0 border-t border-maroon/8 bg-cream-soft/60">
            {c.documents.length === 0 ? (
              <p className="text-xs text-ink/45 italic pl-14 py-3">No documents for this case.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-maroon/[0.025]">
                    <th className="pl-14 pr-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45">File</th>
                    <th className="px-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45">Status</th>
                    <th className="px-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45">Size</th>
                    <th className="px-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45">Pages</th>
                    <th className="px-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45 text-right">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {c.documents.map((d) => (
                    <DocumentRow key={d.id} doc={d} />
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Level 1: User row (expandable) ─────────────────────────────────────────

function UserRow({ user }: { user: SuperAdminUser }) {
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronDown : ChevronRight;

  const totalDocs = user.cases.reduce((n, c) => n + c.total_documents, 0);
  const totalToks = user.cases.reduce((n, c) => n + c.tokens_total, 0);

  return (
    <>
      {/* User header row */}
      <tr className="border-t border-maroon/12 hover:bg-maroon/[0.02] transition-colors">
        <td colSpan={6} className="px-4 py-3.5">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-3 text-left w-full group"
            aria-expanded={open}
          >
            <div
              className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 transition-colors ${
                open ? "bg-maroon text-cream" : "bg-maroon/10 text-maroon"
              }`}
            >
              <Chevron className="w-3.5 h-3.5" />
            </div>
            {/* Email + ID */}
            <div className="flex-1 min-w-0">
              <span className="block font-semibold text-sm text-ink leading-tight">{user.email}</span>
              <span className="block text-[11px] text-ink/40 font-mono mt-0.5 truncate">{user.user_id}</span>
            </div>
            {/* Quick stats */}
            <div className="hidden sm:flex items-center divide-x divide-maroon/10 shrink-0">
              {[
                { v: user.cases.length.toLocaleString("en-IN"), l: "cases" },
                { v: totalDocs.toLocaleString("en-IN"),         l: "docs" },
                { v: fmtTokens(totalToks),                      l: "tokens" },
              ].map(({ v, l }) => (
                <div key={l} className="px-4 text-right">
                  <div className="text-sm font-bold text-maroon leading-none tabular-nums">{v}</div>
                  <div className="text-[10px] text-ink/40 uppercase tracking-wider mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </button>
        </td>
      </tr>

      {/* Level 2: Cases */}
      {open && (
        user.cases.length === 0 ? (
          <tr>
            <td colSpan={6} className="pl-12 pr-4 py-3 text-xs text-ink/45 italic bg-cream-soft/50 border-t border-maroon/8">
              No cases for this user.
            </td>
          </tr>
        ) : (
          <>
            {/* Case column headers */}
            <tr className="bg-maroon/[0.03] border-t border-maroon/8">
              <td className="pl-10 pr-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45">Case</td>
              <td className="px-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45">Bank</td>
              <td className="px-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45">Status</td>
              <td className="px-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45">Docs</td>
              <td className="px-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45">Pages</td>
              <td className="px-4 py-2 text-[10px] font-medium tracking-[0.16em] uppercase text-ink/45">Token Usage</td>
            </tr>
            {user.cases.map((c) => (
              <CaseRow key={c.id} c={c} />
            ))}
          </>
        )
      )}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const ctx    = useRoleContext();

  const [users,   setUsers]   = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [query,   setQuery]   = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/dashboard", { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        router.replace("/dashboard");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(text.slice(0, 280));
      }
      const data: SuperAdminUser[] = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ctx.loading) return;
    if (ctx.role !== "super_admin") return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.loading, ctx.role]);

  // ── Global stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalCases = users.reduce((n, u) => n + u.cases.length, 0);
    const totalDocs  = users.reduce((n, u) => u.cases.reduce((m, c) => m + c.total_documents, n), 0);
    const totalPages = users.reduce((n, u) => u.cases.reduce((m, c) => m + c.total_pages_all_docs, n), 0);
    const totalToks  = users.reduce((n, u) => u.cases.reduce((m, c) => m + c.tokens_total, n), 0);
    return { users: users.length, cases: totalCases, docs: totalDocs, pages: totalPages, tokens: totalToks };
  }, [users]);

  // ── Filtered list ────────────────────────────────────────────────────────

  const filtered = useMemo<SuperAdminUser[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.reduce<SuperAdminUser[]>((acc, u) => {
      const emailMatch = u.email.toLowerCase().includes(q) || u.user_id.toLowerCase().includes(q);
      const matchedCases = u.cases.filter((c) =>
        c.case_name.toLowerCase().includes(q) ||
        c.case_number.toLowerCase().includes(q) ||
        c.bank_name.toLowerCase().includes(q),
      );
      if (emailMatch) { acc.push(u); return acc; }
      if (matchedCases.length > 0) { acc.push({ ...u, cases: matchedCases }); return acc; }
      return acc;
    }, []);
  }, [users, query]);

  // ── Auth loading ─────────────────────────────────────────────────────────

  if (ctx.loading) {
    return (
      <div className="min-h-full grid place-items-center py-20 bg-cream">
        <Loader2 className="w-5 h-5 animate-spin text-maroon" />
      </div>
    );
  }

  // ── Auth guard ────────────────────────────────────────────────────────────

  if (ctx.role !== "super_admin") {
    return (
      <div className="min-h-full flex flex-col items-center justify-center text-center px-6 py-20 bg-cream">
        <div className="w-16 h-16 rounded-2xl bg-maroon/10 grid place-items-center mb-3">
          <Shield className="w-7 h-7 text-maroon/60" />
        </div>
        <h1 className="font-display text-2xl font-bold text-maroon">Super admin only</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-md">
          This view is restricted to Lexram team accounts (app_metadata.role = super_admin).
        </p>
        <Link
          href="/dashboard/tsr"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-maroon text-cream text-sm font-semibold hover:bg-maroon-deep transition"
        >
          Back to TSR
        </Link>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 sm:py-10 max-w-7xl mx-auto w-full bg-cream">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            <BarChart3 className="w-3 h-3 text-rust" />
            Super admin
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight text-maroon">
            User Activity Dashboard
          </h1>
          <p className="text-sm text-ink/65 mt-2 max-w-2xl">
            Every user, their cases, and documents in one drilldown view.
            Expand a user to see their cases; expand a case to inspect documents.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-maroon/15 bg-cream-soft text-sm font-semibold text-maroon hover:bg-maroon/5 disabled:opacity-50 transition shadow-soft"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stat strip */}
      {!loading && !error && users.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-7">
          {[
            { k: stats.users.toLocaleString("en-IN"),  v: "Users",     Icon: Users    },
            { k: stats.cases.toLocaleString("en-IN"),  v: "Cases",     Icon: BarChart3 },
            { k: stats.docs.toLocaleString("en-IN"),   v: "Documents", Icon: FileText },
            { k: stats.pages.toLocaleString("en-IN"),  v: "Pages",     Icon: FileText },
            { k: fmtTokens(stats.tokens),              v: "Tokens",    Icon: Zap      },
          ].map(({ k, v, Icon }) => (
            <div key={v} className="rounded-xl border border-maroon/12 bg-cream-soft px-4 py-4 shadow-soft">
              <div className="flex items-center justify-between text-ink/55 mb-1.5">
                <Icon className="w-4 h-4 text-rust" />
                <span className="text-[9px] tracking-[0.18em] uppercase">{v}</span>
              </div>
              <div className="font-display text-2xl font-bold text-maroon leading-none tabular-nums">{k}</div>
            </div>
          ))}
        </div>
      )}

      {/* Error banner */}
      {!loading && error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-800">Could not load dashboard data</p>
            <p className="text-sm text-red-700/85 mt-1 break-words">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 text-maroon/45 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, user ID, case name, case number, or bank…"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-maroon/15 bg-cream-soft text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
        />
      </div>

      {/* Nested accordion table */}
      <div className="rounded-2xl border border-maroon/12 bg-cream-soft overflow-hidden shadow-soft">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-maroon" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-12 h-12 rounded-2xl bg-maroon/10 grid place-items-center mb-3">
              <Users className="w-5 h-5 text-maroon/50" />
            </div>
            <p className="text-sm font-semibold text-maroon">
              {users.length === 0
                ? "No data returned from the API."
                : "No results match your search."}
            </p>
            <p className="text-xs text-ink/45 mt-1">
              {users.length === 0
                ? "Check that /api/superadmin/dashboard is returning data."
                : "Try a different keyword."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-maroon/[0.04]">
                <tr>
                  <th
                    colSpan={6}
                    className="px-4 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-ink/55"
                  >
                    Users &mdash; {filtered.length}{" "}
                    {filtered.length === 1 ? "user" : "users"}
                    {query && users.length !== filtered.length && (
                      <span className="text-ink/35"> (filtered from {users.length})</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <UserRow key={u.user_id} user={u} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-ink/35 mt-6">
        Data from{" "}
        <code className="font-mono bg-maroon/5 px-1.5 py-0.5 rounded text-ink/50">
          GET /api/superadmin/dashboard
        </code>{" "}
        — expand rows to drill down.
      </p>
    </div>
  );
}
