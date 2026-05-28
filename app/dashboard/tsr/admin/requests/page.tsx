"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Inbox, Loader2, Crown, CheckCircle2, XCircle, Clock, Mail, Phone,
  Building2, ChevronDown, ChevronRight, AlertCircle, Shield, ArrowLeft,
} from "lucide-react";
import {
  useRoleContext, listOrgRequests, approveOrgRequest, rejectOrgRequest,
  fmtDate, relativeTime,
  type OrgRequest, type OrgRequestStatus, type OrgPlan,
} from "@/lib/rbac";

const STATUS_PILL: Record<OrgRequestStatus, { bg: string; text: string; dot: string; label: string; icon: typeof Clock }> = {
  pending:  { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04", label: "Pending",  icon: Clock },
  approved: { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A", label: "Approved", icon: CheckCircle2 },
  rejected: { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626", label: "Rejected", icon: XCircle },
};

export default function RequestsInboxPage() {
  const ctx = useRoleContext();
  const [requests, setRequests] = useState<OrgRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrgRequestStatus | "all">("pending");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await listOrgRequests();
      setRequests(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (ctx.loading) return;
    if (ctx.role !== "super_admin") { setLoading(false); return; }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.loading, ctx.role]);

  const counts = useMemo(() => ({
    pending:  requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }), [requests]);

  const filtered = useMemo(
    () => requests.filter((r) => filter === "all" || r.status === filter),
    [requests, filter],
  );

  if (ctx.loading || loading) {
    return <div className="min-h-full grid place-items-center py-20"><Loader2 className="w-5 h-5 animate-spin text-maroon" /></div>;
  }
  if (ctx.role !== "super_admin") {
    return (
      <div className="min-h-full flex flex-col items-center justify-center text-center px-6 py-20 bg-cream">
        <div className="w-16 h-16 rounded-2xl bg-maroon/10 grid place-items-center mb-3">
          <Shield className="w-7 h-7 text-maroon/60" />
        </div>
        <h1 className="font-display text-2xl font-bold text-maroon">Super admin only</h1>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 sm:py-10 max-w-5xl mx-auto bg-cream">
      <Link href="/dashboard/tsr/admin" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/65 hover:text-ink transition mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to organisations
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            <Crown className="w-3 h-3 text-rust" />
            Super admin
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight text-maroon">Organisation requests</h1>
          <p className="text-sm text-ink/65 mt-2">
            Review incoming sign-ups. Approval provisions the org + invites the contact as admin.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 break-words">{error}</p>
        </div>
      )}

      <div className="inline-flex p-1 rounded-lg border border-maroon/15 bg-maroon/[0.04] gap-1 mb-5">
        {[
          { v: "pending"  as const, label: `Pending (${counts.pending})` },
          { v: "approved" as const, label: `Approved (${counts.approved})` },
          { v: "rejected" as const, label: `Rejected (${counts.rejected})` },
          { v: "all"      as const, label: `All (${requests.length})` },
        ].map(({ v, label }) => {
          const active = filter === v;
          return (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${active ? "bg-maroon text-cream shadow-soft" : "text-ink/70 hover:text-ink"}`}>
              {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-maroon/12 bg-cream-soft p-10 text-center">
          <Inbox className="w-8 h-8 mx-auto text-ink/30 mb-2" />
          <p className="text-sm text-ink/55">
            {filter === "pending" ? "Inbox zero — no pending requests." : `No ${filter === "all" ? "" : filter} requests.`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((r) => (
          <RequestCard
            key={r.id} request={r}
            expanded={!!expanded[r.id]}
            onToggle={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}
            onUpdated={(next) => setRequests((curr) => curr.map((x) => x.id === next.id ? next : x))}
          />
        ))}
      </div>
    </div>
  );
}

function RequestCard({
  request, expanded, onToggle, onUpdated,
}: {
  request: OrgRequest;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (next: OrgRequest) => void;
}) {
  const s = STATUS_PILL[request.status];
  const StatusIcon = s.icon;
  const [busy, setBusy] = useState(false);

  const onApprove = async () => {
    if (!confirm(`Approve ${request.organization_name}? This creates the org and emails ${request.contact_email}.`)) return;
    setBusy(true);
    try {
      const res = await approveOrgRequest(request.id, { plan: "standard" as OrgPlan, seat_limit: Math.max(3, request.team_size) });
      onUpdated(res.request);
    } catch (e) { alert(`Failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  };

  const onReject = async () => {
    const reason = prompt(`Reason for rejecting ${request.organization_name}? (shown to the requester)`);
    if (reason === null) return;
    setBusy(true);
    try {
      const updated = await rejectOrgRequest(request.id, reason);
      onUpdated(updated);
    } catch (e) { alert(`Failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-maroon/12 bg-cream-soft shadow-soft overflow-hidden">
      <button onClick={onToggle} className="w-full text-left px-5 md:px-6 py-4 flex items-center gap-4 hover:bg-maroon/[0.03] transition">
        {expanded ? <ChevronDown className="w-4 h-4 text-maroon/60 shrink-0" /> : <ChevronRight className="w-4 h-4 text-maroon/60 shrink-0" />}
        <div className="w-10 h-10 rounded-lg bg-maroon/10 grid place-items-center shrink-0">
          <Building2 className="w-5 h-5 text-maroon" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink truncate">{request.organization_name}</div>
          <div className="text-[11px] text-ink/55 mt-0.5 truncate">
            {request.organization_type ?? "—"} · {request.contact_email} · {relativeTime(request.created_at)}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: s.bg, color: s.text }}>
          <StatusIcon className="w-3 h-3" />
          {s.label}
        </span>
      </button>

      {expanded && (
        <div className="px-5 md:px-6 pb-5 border-t border-maroon/10">
          {/* 1. Identity */}
          <SectionLabel>Organisation identity</SectionLabel>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mt-2">
            <Pair label="Entity type"  v={request.entity_type ?? request.organization_type ?? "—"} />
            <Pair label="Firm size"    v={`${request.team_size} people`} />
            <Pair label="Website"      v={request.office_website ?? "—"} />
            <Pair label="Submitted"    v={fmtDate(request.created_at)} />
          </dl>

          {/* 2. Compliance */}
          <SectionLabel className="mt-5">Compliance &amp; invoicing</SectionLabel>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mt-2">
            <Pair label="Organisation PAN" v={request.organization_pan ?? "—"} />
            <Pair label="GSTIN"            v={request.gstin ?? "—"} />
            <Pair label="Billing email"    v={request.billing_email ?? "—"} />
            <Pair label="Address"          v={request.address ?? "—"} className="sm:col-span-2" />
          </dl>

          {/* 3. AI & Operational */}
          <SectionLabel className="mt-5">AI &amp; operational configuration</SectionLabel>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mt-2">
            <Pair label="Default language"          v={request.default_language ?? "English"} />
            <Pair label="Estimated monthly volume"  v={request.estimated_monthly_volume ?? "—"} />
            <Pair label="Bank template" v={request.bank_template_url ? "Uploaded ↗" : "Not yet sent"} />
            <Pair label="Banks served"
                  v={(request.primary_banks_served ?? []).length === 0
                       ? "—"
                       : `${request.primary_banks_served.length} selected`} />
          </dl>
          {(request.primary_banks_served ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {request.primary_banks_served.map((b) => (
                <span key={b} className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-maroon/8 text-maroon">
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* 4. Admin POC */}
          <SectionLabel className="mt-5">Authorised signatory / admin POC</SectionLabel>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mt-2">
            <Pair label="Name"     v={request.contact_name} />
            <Pair label="Email"    v={request.contact_email} />
            <Pair label="Phone"    v={request.contact_phone ?? "—"} icon={Phone} />
          </dl>

          {request.notes && (
            <div className="mt-4 rounded-lg border border-maroon/10 bg-cream p-3 text-sm text-ink/80 leading-relaxed">
              <span className="block text-[10px] tracking-[0.22em] uppercase text-rust font-bold mb-1.5">Notes</span>
              {request.notes}
            </div>
          )}

          {Array.isArray(request.team_details) && request.team_details.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] tracking-[0.22em] uppercase text-rust font-bold mb-2">Team listed</div>
              <div className="space-y-1.5">
                {request.team_details.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md border border-maroon/10 bg-cream/60 text-xs text-ink/85">
                    <span className="font-semibold text-ink">{m.name || "—"}</span>
                    <span className="text-ink/55 truncate">{m.email || "—"}</span>
                    <span className="text-ink/45 ml-auto shrink-0">{m.role || ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {request.status === "pending" && (
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={onApprove} disabled={busy}
                className="inline-flex items-center gap-2 bg-maroon hover:bg-maroon-deep disabled:opacity-70 text-cream px-4 py-2 rounded-lg text-sm font-semibold transition">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve & invite admin</>}
              </button>
              <button onClick={onReject} disabled={busy}
                className="inline-flex items-center gap-2 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold transition">
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <a href={`mailto:${request.contact_email}`} className="inline-flex items-center gap-2 border border-maroon/15 text-ink/70 hover:text-ink hover:border-maroon px-4 py-2 rounded-lg text-sm font-medium transition">
                <Mail className="w-4 h-4" /> Email
              </a>
            </div>
          )}

          {request.status !== "pending" && (
            <div className="mt-5 text-[11px] text-ink/55">
              {request.reviewed_at && <>Reviewed {fmtDate(request.reviewed_at)}.{' '}</>}
              {request.decision_reason && <span className="italic">&ldquo;{request.decision_reason}&rdquo;</span>}
              {request.approved_org_id && (
                <Link href={`/dashboard/tsr/admin/${request.approved_org_id}`} className="ml-2 text-rust hover:text-maroon">
                  → View created org
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Pair({ label, v, icon: Icon, className }: { label: string; v: string; icon?: React.ComponentType<{ className?: string }>; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[10px] tracking-[0.18em] uppercase text-ink/55 inline-flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </dt>
      <dd className="text-ink/85 mt-0.5 break-words">{v}</dd>
    </div>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[10px] tracking-[0.22em] uppercase text-rust font-bold ${className}`}>
      {children}
    </div>
  );
}
