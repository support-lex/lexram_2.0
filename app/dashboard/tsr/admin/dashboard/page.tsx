"use client";

// Super-admin TSR dashboard — the single pane that shows every TSR-related
// row sitting in supabase: orgs, members, cases, documents, payments, and
// onboarding requests. Backed by /api/admin/tsr-dashboard (service-role).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, ArrowUpRight, Banknote, Building2, ChevronDown, ChevronRight,
  Crown, FileText, IndianRupee, Inbox, LayoutDashboard, Loader2, RefreshCw,
  Search, Shield, Sparkles, TrendingUp, Users, Zap,
} from "lucide-react";
import { useRoleContext, fmtTokens, fmtDate } from "@/lib/rbac";

// ─── API shape ──────────────────────────────────────────────────────────────

type OrgPlan = "trial" | "standard" | "enterprise";
type OrgStatus = "active" | "suspended";
type PaymentStatus = "pending" | "success" | "failed";
type RequestStatus = "pending" | "approved" | "rejected";

interface OrgRollup {
  id: string;
  name: string;
  plan: OrgPlan;
  status: OrgStatus;
  account_type: "individual" | "organization" | null;
  seat_limit: number;
  admin_email: string | null;
  admin_name: string | null;
  created_at: string;
  seats_used: number;
  total_cases: number;
  total_tokens: number;
  revenue_inr: number;
}

interface RecentCase {
  id: string;
  case_name: string;
  case_no: string;
  bank_name: string;
  status: string;
  user_email: string | null;
  org_name: string | null;
  tokens: number;
  created_at: string;
}

interface RecentDocument {
  id: string;
  filename: string;
  status: string;
  case_name: string | null;
  user_email: string | null;
  created_at: string;
}

interface RecentPayment {
  id: string;
  invoice_no: string;
  amount_inr: number;
  status: PaymentStatus;
  user_email: string | null;
  org_name: string | null;
  case_name: string | null;
  created_at: string;
  paid_at: string | null;
}

interface RecentRequest {
  id: string;
  organization_name: string;
  contact_name: string;
  contact_email: string;
  status: RequestStatus;
  created_at: string;
  reviewed_at: string | null;
}

interface DashboardResponse {
  generated_at: string;
  summary: {
    total_orgs: number;
    active_orgs: number;
    suspended_orgs: number;
    total_members: number;
    total_users_with_cases: number;
    total_cases: number;
    total_documents: number;
    total_tokens: number;
    total_revenue_inr: number;
    pending_payments_inr: number;
    pending_requests: number;
  };
  status_distribution: {
    cases: Record<string, number>;
    documents: Record<string, number>;
    payments: Record<string, number>;
  };
  orgs: OrgRollup[];
  recent_cases: RecentCase[];
  recent_documents: RecentDocument[];
  recent_payments: RecentPayment[];
  recent_requests: RecentRequest[];
}

// ─── Display helpers ────────────────────────────────────────────────────────

const PLAN_BADGE: Record<OrgPlan, string> = {
  trial:      "bg-cream text-maroon border-maroon/20",
  standard:   "bg-rust/15 text-rust border-rust/40",
  enterprise: "bg-maroon text-cream border-maroon",
};

const ORG_STATUS_BADGE: Record<OrgStatus, { bg: string; text: string; dot: string; label: string }> = {
  active:    { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A", label: "Active" },
  suspended: { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626", label: "Suspended" },
};

const PAYMENT_STATUS_BADGE: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  success: { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A" },
  failed:  { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626" },
};

const REQUEST_STATUS_BADGE: Record<RequestStatus, { bg: string; text: string; dot: string }> = {
  pending:  { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  approved: { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A" },
  rejected: { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626" },
};

const CASE_STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  new:        { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  uploading:  { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  extracting: { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  processing: { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  querying:   { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04" },
  complete:   { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A" },
  error:      { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626" },
};

function StatusPill({ status, palette }: { status: string; palette: Record<string, { bg: string; text: string; dot: string }> }) {
  const s = palette[status] ?? { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {status}
    </span>
  );
}

function fmtINR(paise: number): string {
  // amount_inr is stored as whole rupees (int), not paise.
  return `₹${paise.toLocaleString("en-IN")}`;
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(iso);
}

// ─── Page ───────────────────────────────────────────────────────────────────

type Tab = "orgs" | "cases" | "documents" | "payments" | "requests";

export default function SuperAdminTsrDashboard() {
  const ctx = useRoleContext();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("orgs");
  const [query, setQuery] = useState("");
  const [orgFilter, setOrgFilter] = useState<OrgPlan | "all">("all");

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

  // ── Filtered subsets driven by `query` + tab-specific filters ───────────
  const filtered = useMemo(() => {
    if (!data) return null;
    const q = query.trim().toLowerCase();
    const match = (s: string | null | undefined) => !q || (s ?? "").toLowerCase().includes(q);
    return {
      orgs: data.orgs.filter((o) => {
        if (orgFilter !== "all" && o.plan !== orgFilter) return false;
        return match(o.name) || match(o.admin_email) || match(o.admin_name);
      }),
      cases: data.recent_cases.filter((c) =>
        match(c.case_name) || match(c.case_no) || match(c.bank_name) ||
        match(c.user_email) || match(c.org_name) || match(c.status),
      ),
      documents: data.recent_documents.filter((d) =>
        match(d.filename) || match(d.case_name) || match(d.user_email) || match(d.status),
      ),
      payments: data.recent_payments.filter((p) =>
        match(p.invoice_no) || match(p.user_email) || match(p.org_name) ||
        match(p.case_name) || match(p.status),
      ),
      requests: data.recent_requests.filter((r) =>
        match(r.organization_name) || match(r.contact_name) ||
        match(r.contact_email) || match(r.status),
      ),
    };
  }, [data, query, orgFilter]);

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
          The TSR dashboard is restricted to Lexram team accounts (app_metadata.role = super_admin).
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
            Every TSR-related record on the lexram supabase, in one place.
            {data?.generated_at && <span className="text-ink/45"> Last refreshed {fmtRelative(data.generated_at)}.</span>}
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
          {/* ── Summary cards ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
            <StatCard icon={Building2}   label="Total orgs"     primary={String(data.summary.total_orgs)} sub={`${data.summary.active_orgs} active`} />
            <StatCard icon={Users}       label="Active members" primary={data.summary.total_members.toLocaleString("en-IN")} sub={`${data.summary.total_users_with_cases} with cases`} />
            <StatCard icon={FileText}    label="Total cases"    primary={data.summary.total_cases.toLocaleString("en-IN")} sub={`${data.summary.total_documents.toLocaleString("en-IN")} docs`} />
            <StatCard icon={TrendingUp}  label="Total tokens"   primary={fmtTokens(data.summary.total_tokens)} sub="Across all cases" />
            <StatCard icon={IndianRupee} label="Revenue"        primary={fmtINR(data.summary.total_revenue_inr)} sub={`${fmtINR(data.summary.pending_payments_inr)} pending`} />
            <StatCard icon={Inbox}       label="Pending requests" primary={String(data.summary.pending_requests)} sub="Onboarding inbox" link="/dashboard/tsr/admin/requests" />
          </div>

          {/* ── Status distribution ribbons ───────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-7">
            <DistributionRow title="Cases by status"     icon={FileText} dist={data.status_distribution.cases} />
            <DistributionRow title="Documents by status" icon={Sparkles} dist={data.status_distribution.documents} />
            <DistributionRow title="Payments by status"  icon={Banknote} dist={data.status_distribution.payments} />
          </div>

          {/* ── Tabs + universal search ────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="inline-flex p-1 rounded-lg border border-maroon/15 bg-maroon/[0.04] gap-1 overflow-x-auto">
              {([
                { id: "orgs",      label: "Organisations", count: data.orgs.length },
                { id: "cases",     label: "Recent cases",  count: data.recent_cases.length },
                { id: "documents", label: "Documents",     count: data.recent_documents.length },
                { id: "payments",  label: "Payments",      count: data.recent_payments.length },
                { id: "requests",  label: "Requests",      count: data.recent_requests.length },
              ] as const).map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${active ? "bg-maroon text-cream shadow-soft" : "text-ink/70 hover:text-ink"}`}
                  >
                    {t.label} <span className="opacity-70">({t.count})</span>
                  </button>
                );
              })}
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-maroon/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter rows…"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-maroon/15 bg-cream-soft text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
              />
            </div>
          </div>

          {/* ── Tab content ────────────────────────────────────────── */}
          {tab === "orgs" && (
            <OrgsTable orgs={filtered?.orgs ?? []} planFilter={orgFilter} onPlanFilter={setOrgFilter} />
          )}
          {tab === "cases"     && <CasesTable     rows={filtered?.cases     ?? []} />}
          {tab === "documents" && <DocumentsTable rows={filtered?.documents ?? []} />}
          {tab === "payments"  && <PaymentsTable  rows={filtered?.payments  ?? []} />}
          {tab === "requests"  && <RequestsTable  rows={filtered?.requests  ?? []} />}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, primary, sub, link,
}: {
  icon: typeof Building2; label: string; primary: string; sub?: string; link?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-maroon/12 bg-cream-soft px-4 py-4 shadow-soft hover:border-maroon/25 transition h-full">
      <div className="flex items-center justify-between text-ink/55">
        <Icon className="w-4 h-4 text-rust" />
        <span className="text-[9px] tracking-[0.18em] uppercase">{label}</span>
      </div>
      <div className="font-display text-2xl font-bold text-maroon mt-1.5 leading-none">{primary}</div>
      {sub && <div className="text-[11px] text-ink/55 mt-1.5">{sub}</div>}
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}

function DistributionRow({
  title, icon: Icon, dist,
}: { title: string; icon: typeof Building2; dist: Record<string, number> }) {
  const entries = Object.entries(dist);
  const total = entries.reduce((n, [, v]) => n + v, 0);
  return (
    <div className="rounded-xl border border-maroon/12 bg-cream-soft px-4 py-3.5">
      <div className="flex items-center gap-2 text-ink/65 text-[11px] font-semibold tracking-wider uppercase">
        <Icon className="w-3.5 h-3.5 text-rust" />
        {title}
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-ink/45 mt-2">No data yet.</p>
      ) : (
        <div className="mt-2.5 space-y-1.5">
          {entries.sort((a, b) => b[1] - a[1]).map(([status, count]) => {
            const pct = Math.round((count / Math.max(total, 1)) * 100);
            return (
              <div key={status} className="flex items-center gap-2.5">
                <span className="text-xs text-ink/75 w-24 truncate">{status}</span>
                <div className="flex-1 h-1.5 rounded-full bg-maroon/10 overflow-hidden">
                  <div className="h-full bg-rust" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] text-ink/55 w-10 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-ink/55">{label}</td>
    </tr>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-maroon/12 bg-cream-soft overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-left">{children}</table>
      </div>
    </div>
  );
}

function OrgsTable({
  orgs, planFilter, onPlanFilter,
}: { orgs: OrgRollup[]; planFilter: OrgPlan | "all"; onPlanFilter: (p: OrgPlan | "all") => void }) {
  return (
    <>
      <div className="flex justify-end mb-3">
        <div className="inline-flex p-1 rounded-lg border border-maroon/15 bg-maroon/[0.04] gap-1">
          {(["all", "trial", "standard", "enterprise"] as const).map((p) => {
            const active = planFilter === p;
            return (
              <button key={p} onClick={() => onPlanFilter(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${active ? "bg-maroon text-cream shadow-soft" : "text-ink/70 hover:text-ink"}`}>
                {p}
              </button>
            );
          })}
        </div>
      </div>
      <TableShell>
        <thead className="bg-maroon/[0.04] text-[10px] tracking-[0.2em] uppercase text-ink/60">
          <tr>
            <th className="px-4 py-3 font-medium">Organisation</th>
            <th className="px-4 py-3 font-medium">Admin</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Seats</th>
            <th className="px-4 py-3 font-medium">Cases</th>
            <th className="px-4 py-3 font-medium">Tokens</th>
            <th className="px-4 py-3 font-medium">Revenue</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Open</th>
          </tr>
        </thead>
        <tbody>
          {orgs.length === 0 ? <EmptyRow colSpan={9} label="No organisations match the filters." /> :
            orgs.map((o) => {
              const sb = ORG_STATUS_BADGE[o.status];
              const seatPct = Math.round((o.seats_used / Math.max(o.seat_limit, 1)) * 100);
              const seatColor = seatPct >= 90 ? "#DC2626" : seatPct >= 70 ? "#CA8A04" : "#16A34A";
              return (
                <tr key={o.id} className="border-t border-maroon/10 hover:bg-maroon/[0.03] transition">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-ink leading-tight">{o.name}</div>
                    <div className="text-[11px] text-ink/55 mt-0.5">
                      {o.account_type === "individual" ? "Individual · " : o.account_type === "organization" ? "Enterprise · " : ""}
                      Created {fmtDate(o.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm text-ink">{o.admin_name ?? "—"}</div>
                    <div className="text-[11px] text-ink/55">{o.admin_email ?? ""}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center text-[10px] tracking-wider uppercase font-semibold px-2.5 py-0.5 rounded-full border ${PLAN_BADGE[o.plan]}`}>{o.plan}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm text-ink font-medium">{o.seats_used} / {o.seat_limit}</div>
                    <div className="w-20 h-1 mt-1.5 rounded-full bg-maroon/10 overflow-hidden">
                      <div className="h-full" style={{ width: `${seatPct}%`, backgroundColor: seatColor }} />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-ink/85">{o.total_cases.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3.5 text-sm text-ink/85">{fmtTokens(o.total_tokens)}</td>
                  <td className="px-4 py-3.5 text-sm text-ink/85">{fmtINR(o.revenue_inr)}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: sb.bg, color: sb.text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sb.dot }} />
                      {sb.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/dashboard/tsr/admin/${o.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-maroon hover:text-rust transition">
                      Open <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </TableShell>
    </>
  );
}

function CasesTable({ rows }: { rows: RecentCase[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  return (
    <TableShell>
      <thead className="bg-maroon/[0.04] text-[10px] tracking-[0.2em] uppercase text-ink/60">
        <tr>
          <th className="w-8"></th>
          <th className="px-4 py-3 font-medium">Case</th>
          <th className="px-4 py-3 font-medium">Bank</th>
          <th className="px-4 py-3 font-medium">User</th>
          <th className="px-4 py-3 font-medium">Org</th>
          <th className="px-4 py-3 font-medium">Tokens</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Created</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={8} label="No cases yet." /> :
          rows.map((c) => {
            const open = expanded.has(c.id);
            const Chevron = open ? ChevronDown : ChevronRight;
            return (
              <tr key={c.id} className="border-t border-maroon/10 hover:bg-maroon/[0.03] transition">
                <td className="pl-3 align-top pt-4">
                  <button onClick={() => setExpanded((s) => { const next = new Set(s); if (open) next.delete(c.id); else next.add(c.id); return next; })}>
                    <Chevron className="w-3.5 h-3.5 text-maroon/55 hover:text-maroon" />
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-ink leading-tight">{c.case_name}</div>
                  <div className="text-[11px] text-ink/55 mt-0.5">{c.case_no}</div>
                </td>
                <td className="px-4 py-3.5 text-sm text-ink/85">{c.bank_name || "—"}</td>
                <td className="px-4 py-3.5 text-sm text-ink/85">{c.user_email ?? "—"}</td>
                <td className="px-4 py-3.5 text-sm text-ink/85">{c.org_name ?? "—"}</td>
                <td className="px-4 py-3.5 text-sm text-ink/85">{c.tokens.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3.5"><StatusPill status={c.status} palette={CASE_STATUS_BADGE} /></td>
                <td className="px-4 py-3.5 text-sm text-ink/55">{fmtRelative(c.created_at)}</td>
              </tr>
            );
          })}
      </tbody>
    </TableShell>
  );
}

function DocumentsTable({ rows }: { rows: RecentDocument[] }) {
  return (
    <TableShell>
      <thead className="bg-maroon/[0.04] text-[10px] tracking-[0.2em] uppercase text-ink/60">
        <tr>
          <th className="px-4 py-3 font-medium">File</th>
          <th className="px-4 py-3 font-medium">Case</th>
          <th className="px-4 py-3 font-medium">User</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Uploaded</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={5} label="No documents yet." /> :
          rows.map((d) => (
            <tr key={d.id} className="border-t border-maroon/10 hover:bg-maroon/[0.03] transition">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-maroon/60 shrink-0" />
                  <span className="text-sm text-ink font-medium truncate">{d.filename}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-sm text-ink/85">{d.case_name ?? "—"}</td>
              <td className="px-4 py-3.5 text-sm text-ink/85">{d.user_email ?? "—"}</td>
              <td className="px-4 py-3.5"><StatusPill status={d.status} palette={CASE_STATUS_BADGE} /></td>
              <td className="px-4 py-3.5 text-sm text-ink/55">{fmtRelative(d.created_at)}</td>
            </tr>
          ))}
      </tbody>
    </TableShell>
  );
}

function PaymentsTable({ rows }: { rows: RecentPayment[] }) {
  return (
    <TableShell>
      <thead className="bg-maroon/[0.04] text-[10px] tracking-[0.2em] uppercase text-ink/60">
        <tr>
          <th className="px-4 py-3 font-medium">Invoice</th>
          <th className="px-4 py-3 font-medium">Amount</th>
          <th className="px-4 py-3 font-medium">User</th>
          <th className="px-4 py-3 font-medium">Org</th>
          <th className="px-4 py-3 font-medium">Case</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">When</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={7} label="No payments yet." /> :
          rows.map((p) => (
            <tr key={p.id} className="border-t border-maroon/10 hover:bg-maroon/[0.03] transition">
              <td className="px-4 py-3.5 text-sm font-mono text-ink/85">{p.invoice_no}</td>
              <td className="px-4 py-3.5 text-sm font-semibold text-maroon">{fmtINR(p.amount_inr)}</td>
              <td className="px-4 py-3.5 text-sm text-ink/85">{p.user_email ?? "—"}</td>
              <td className="px-4 py-3.5 text-sm text-ink/85">{p.org_name ?? "—"}</td>
              <td className="px-4 py-3.5 text-sm text-ink/85">{p.case_name ?? "—"}</td>
              <td className="px-4 py-3.5"><StatusPill status={p.status} palette={PAYMENT_STATUS_BADGE} /></td>
              <td className="px-4 py-3.5 text-sm text-ink/55">
                {p.paid_at ? `Paid ${fmtRelative(p.paid_at)}` : `Started ${fmtRelative(p.created_at)}`}
              </td>
            </tr>
          ))}
      </tbody>
    </TableShell>
  );
}

function RequestsTable({ rows }: { rows: RecentRequest[] }) {
  return (
    <TableShell>
      <thead className="bg-maroon/[0.04] text-[10px] tracking-[0.2em] uppercase text-ink/60">
        <tr>
          <th className="px-4 py-3 font-medium">Organisation</th>
          <th className="px-4 py-3 font-medium">Contact</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Submitted</th>
          <th className="px-4 py-3 font-medium text-right">Open</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={5} label="No onboarding requests yet." /> :
          rows.map((r) => (
            <tr key={r.id} className="border-t border-maroon/10 hover:bg-maroon/[0.03] transition">
              <td className="px-4 py-3.5">
                <div className="font-semibold text-ink leading-tight">{r.organization_name}</div>
              </td>
              <td className="px-4 py-3.5">
                <div className="text-sm text-ink">{r.contact_name}</div>
                <div className="text-[11px] text-ink/55">{r.contact_email}</div>
              </td>
              <td className="px-4 py-3.5"><StatusPill status={r.status} palette={REQUEST_STATUS_BADGE} /></td>
              <td className="px-4 py-3.5 text-sm text-ink/55">{fmtRelative(r.created_at)}</td>
              <td className="px-4 py-3.5 text-right">
                <Link href="/dashboard/tsr/admin/requests" className="inline-flex items-center gap-1 text-xs font-semibold text-maroon hover:text-rust transition">
                  Review <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </td>
            </tr>
          ))}
      </tbody>
    </TableShell>
  );
}

// `Crown` and `Zap` imports kept tree-shakeable — not used here but exported by the icon set.
// Suppress unused-import lint without disabling the rule globally.
void Crown; void Zap;
