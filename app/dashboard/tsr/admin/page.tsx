"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2, Plus, Search, Crown, ArrowUpRight,
  CircleCheck, TrendingUp, Sparkles, AlertCircle, Loader2, Shield,
} from "lucide-react";
import {
  useRoleContext, listAllOrganizations, fmtTokens, fmtDate,
  type OrganizationWithStats, type OrgPlan, type OrgStatus,
} from "@/lib/rbac";

const PLAN_BADGE: Record<OrgPlan, string> = {
  trial:      "bg-cream text-maroon border-maroon/20",
  standard:   "bg-rust/15 text-rust border-rust/40",
  enterprise: "bg-maroon text-cream border-maroon",
};

const STATUS_BADGE: Record<OrgStatus, { bg: string; text: string; dot: string; label: string }> = {
  active:    { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A", label: "Active" },
  suspended: { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626", label: "Suspended" },
};

export default function AdminOrganizationsPage() {
  const ctx = useRoleContext();
  const [orgs, setOrgs]       = useState<OrganizationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [query, setQuery]           = useState("");
  const [planFilter, setPlanFilter] = useState<OrgPlan | "all">("all");

  useEffect(() => {
    if (ctx.loading) return;
    if (ctx.role !== "super_admin") { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await listAllOrganizations();
        if (!cancelled) setOrgs(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ctx.loading, ctx.role]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orgs.filter((o) => {
      if (planFilter !== "all" && o.plan !== planFilter) return false;
      if (!q) return true;
      return (
        o.name.toLowerCase().includes(q) ||
        (o.admin_email ?? "").toLowerCase().includes(q) ||
        (o.admin_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [orgs, query, planFilter]);

  const stats = useMemo(() => ({
    total:     orgs.length,
    active:    orgs.filter((o) => o.status === "active").length,
    suspended: orgs.filter((o) => o.status === "suspended").length,
    seats:     orgs.reduce((n, o) => n + o.seats_used, 0),
    seatLimit: orgs.reduce((n, o) => n + o.seat_limit, 0),
    cases:     orgs.reduce((n, o) => n + o.total_cases, 0),
    tokens:    orgs.reduce((n, o) => n + o.total_tokens, 0),
  }), [orgs]);

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
          This view is restricted to Lexram team accounts (app_metadata.role = super_admin).
        </p>
        <Link href="/dashboard/tsr" className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-maroon text-cream text-sm font-semibold hover:bg-maroon-deep transition">
          Back to TSR
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto w-full bg-cream">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            <Crown className="w-3 h-3 text-rust" />
            Super admin
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight text-maroon">Organisations</h1>
          <p className="text-sm text-ink/65 mt-2">
            Every tenant on Lexram. Drill in to view members, suspend, or change a plan.
          </p>
        </div>
        <Link
          href="/dashboard/tsr/admin/new"
          className="inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep text-cream px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-[0_10px_24px_-12px_rgba(104,3,24,0.55)]"
        >
          <Plus className="w-4 h-4" />
          Create organisation
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Couldn&apos;t load organisations</p>
            <p className="text-sm text-red-700/85 mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        {[
          { k: stats.total.toString(),                                  v: "Total orgs",   icon: Building2 },
          { k: stats.active + " / " + (stats.active + stats.suspended), v: "Active",       icon: CircleCheck },
          { k: stats.seats + " / " + stats.seatLimit,                   v: "Seats used",   icon: Sparkles },
          { k: fmtTokens(stats.tokens),                                 v: "Total tokens", icon: TrendingUp },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-xl border border-maroon/12 bg-cream-soft px-4 py-4 shadow-soft">
              <div className="flex items-center justify-between text-ink/55">
                <Icon className="w-4 h-4 text-rust" />
                <span className="text-[9px] tracking-[0.18em] uppercase">{s.v}</span>
              </div>
              <div className="font-display text-2xl font-bold text-maroon mt-1.5 leading-none">{s.k}</div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-maroon/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by org name, admin name, or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-maroon/15 bg-cream-soft text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
          />
        </div>
        <div className="inline-flex p-1 rounded-lg border border-maroon/15 bg-maroon/[0.04] gap-1">
          {(["all", "trial", "standard", "enterprise"] as const).map((p) => {
            const active = planFilter === p;
            return (
              <button key={p} onClick={() => setPlanFilter(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${active ? "bg-maroon text-cream shadow-soft" : "text-ink/70 hover:text-ink"}`}>
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-maroon/12 bg-cream-soft overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-maroon/[0.04] text-[10px] tracking-[0.2em] uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Seats</th>
                <th className="px-4 py-3 font-medium">Cases</th>
                <th className="px-4 py-3 font-medium">Tokens</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="px-4 py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-maroon mx-auto" /></td></tr>}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink/55">
                    {orgs.length === 0 ? "No organisations yet. Click \"Create organisation\" to add the first one." : "No organisations match your filters."}
                  </td>
                </tr>
              )}
              {filtered.map((o) => {
                const sb = STATUS_BADGE[o.status];
                const seatPct = Math.round((o.seats_used / Math.max(o.seat_limit, 1)) * 100);
                const seatColor = seatPct >= 90 ? "#DC2626" : seatPct >= 70 ? "#CA8A04" : "#16A34A";
                return (
                  <tr key={o.id} className="border-t border-maroon/10 hover:bg-maroon/[0.03] transition">
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="font-semibold text-ink leading-tight">{o.name}</div>
                        <div className="text-[11px] text-ink/55 mt-0.5">Created {fmtDate(o.created_at)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm text-ink">{o.admin_name ?? "—"}</div>
                      <div className="text-[11px] text-ink/55">{o.admin_email ?? ""}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center text-[10px] tracking-wider uppercase font-semibold px-2.5 py-0.5 rounded-full border ${PLAN_BADGE[o.plan]}`}>
                        {o.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm text-ink font-medium">{o.seats_used} / {o.seat_limit}</div>
                      <div className="w-20 h-1 mt-1.5 rounded-full bg-maroon/10 overflow-hidden">
                        <div className="h-full" style={{ width: `${seatPct}%`, backgroundColor: seatColor }} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-ink/85">{o.total_cases.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3.5 text-sm text-ink/85">{fmtTokens(o.total_tokens)}</td>
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
          </table>
        </div>
      </div>
    </div>
  );
}
