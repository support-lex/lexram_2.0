"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Building2, Users, Pause, Play, Crown, Mail,
  Shield as ShieldIcon, AlertCircle, Loader2,
} from "lucide-react";
import {
  useRoleContext, getOrganizationDetail, updateOrganization,
  fmtTokens, fmtDate, relativeTime,
  type OrganizationWithStats, type OrganizationMember, type MemberStatus, type MemberRole,
} from "@/lib/rbac";

const STATUS_PILL: Record<MemberStatus, { bg: string; text: string; dot: string; label: string }> = {
  active:    { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A", label: "Active" },
  invited:   { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04", label: "Invited" },
  suspended: { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626", label: "Suspended" },
};
const ROLE_PILL: Record<MemberRole, string> = {
  admin:  "bg-maroon text-cream",
  member: "bg-maroon/8 text-maroon",
};

export default function OrgDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const ctx = useRoleContext();
  const [org, setOrg] = useState<OrganizationWithStats | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id || ctx.loading) return;
    if (ctx.role !== "super_admin") { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await getOrganizationDetail(id);
        if (!cancelled) { setOrg(data.org); setMembers(data.members); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, ctx.loading, ctx.role]);

  if (ctx.loading || loading) {
    return <div className="min-h-full grid place-items-center py-20"><Loader2 className="w-5 h-5 animate-spin text-maroon" /></div>;
  }
  if (ctx.role !== "super_admin") {
    return <div className="px-6 py-20 text-center text-sm text-ink/60">Super admin only.</div>;
  }
  if (error || !org) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-maroon/10 grid place-items-center mx-auto mb-3">
          <AlertCircle className="w-5 h-5 text-maroon/60" />
        </div>
        <h1 className="font-display text-2xl font-bold text-maroon">{error ?? "Organisation not found"}</h1>
        <Link href="/dashboard/tsr/admin" className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-rust">← Back to organisations</Link>
      </div>
    );
  }

  const seatPct = Math.round((org.seats_used / Math.max(org.seat_limit, 1)) * 100);
  const seatColor = seatPct >= 90 ? "#DC2626" : seatPct >= 70 ? "#CA8A04" : "#16A34A";
  const suspended = org.status === "suspended";

  const onToggleSuspend = async () => {
    if (!confirm(`${suspended ? "Reactivate" : "Suspend"} ${org.name}?`)) return;
    setBusy(true);
    try {
      const updated = await updateOrganization(org.id, { status: suspended ? "active" : "suspended" });
      setOrg({ ...org, status: updated.status });
    } catch (e) {
      alert(`Couldn't update: ${e instanceof Error ? e.message : String(e)}`);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 sm:py-10 max-w-5xl mx-auto bg-cream">
      <Link href="/dashboard/tsr/admin" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/65 hover:text-ink transition mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        All organisations
      </Link>

      <div className="rounded-2xl border border-maroon/12 bg-cream-soft shadow-soft p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-maroon grid place-items-center shrink-0 shadow-soft">
              <Building2 className="w-5 h-5 text-cream" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rust/12 text-rust text-[9px] font-bold tracking-[0.2em] uppercase mb-2">
                <Crown className="w-3 h-3" />Organisation
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-maroon leading-tight">{org.name}</h1>
              <div className="mt-2 text-[11px] text-ink/55 tracking-wide">
                <code className="px-1.5 py-0.5 rounded bg-maroon/8 font-mono">{org.slug}</code>
                <span className="mx-2 text-ink/30">·</span>
                Created {fmtDate(org.created_at)}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span className={`inline-flex items-center justify-center text-[10px] tracking-wider uppercase font-semibold px-3 py-1.5 rounded-full ${suspended ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
              {suspended ? "Suspended" : "Active"}
            </span>
            <button onClick={onToggleSuspend} disabled={busy}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-50 ${suspended ? "border-emerald-500/40 text-emerald-700 hover:bg-emerald-50" : "border-red-500/40 text-red-700 hover:bg-red-50"}`}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : suspended ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {suspended ? "Reactivate" : "Suspend org"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7 pt-6 border-t border-maroon/10">
          <Tile label="Plan"   value={<span className="capitalize">{org.plan}</span>} />
          <Tile label="Seats"  value={`${org.seats_used} / ${org.seat_limit}`} progress={{ pct: seatPct, color: seatColor }} />
          <Tile label="Cases"  value={org.total_cases.toLocaleString("en-IN")} />
          <Tile label="Tokens" value={fmtTokens(org.total_tokens)} />
        </div>
      </div>

      {(org.admin_name || org.admin_email) && (
        <div className="rounded-2xl border border-maroon/12 bg-cream-soft shadow-soft p-6 mb-6">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-rust mb-3">
            <ShieldIcon className="w-3.5 h-3.5" />Organisation admin
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rust/15 border border-rust/40 grid place-items-center text-rust font-display font-bold">
              {(org.admin_name ?? org.admin_email ?? "?").split(/[\s@]+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-ink">{org.admin_name ?? "—"}</div>
              <div className="text-sm text-ink/60 inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />{org.admin_email ?? "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-maroon/12 bg-cream-soft shadow-soft overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b border-maroon/10 flex items-center gap-2 text-ink">
          <Users className="w-4 h-4 text-rust" />
          <h2 className="font-semibold">Members</h2>
          <span className="text-xs text-ink/55">({members.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-maroon/[0.03] text-[10px] tracking-[0.2em] uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cases</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-ink/55">No members yet.</td></tr>}
              {members.map((m) => {
                const s = STATUS_PILL[m.status];
                const initials = (m.name || m.email).split(/[\s@]+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                return (
                  <tr key={m.id} className="border-t border-maroon/10 hover:bg-maroon/[0.03] transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-maroon/10 border border-maroon/15 grid place-items-center text-ink/75 text-xs font-bold shrink-0">{initials}</div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-ink truncate">{m.name || "—"}</div>
                          <div className="text-[11px] text-ink/55 truncate">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex text-[10px] tracking-wider uppercase font-semibold px-2.5 py-0.5 rounded-full ${ROLE_PILL[m.role]}`}>{m.role}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />{s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-ink/75">{m.case_count}</td>
                    <td className="px-4 py-3.5 text-sm text-ink/60">{fmtDate(m.joined_at)}</td>
                    <td className="px-4 py-3.5 text-sm text-ink/60">{relativeTime(m.last_active_at)}</td>
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

function Tile({ label, value, progress }: { label: string; value: React.ReactNode; progress?: { pct: number; color: string } }) {
  return (
    <div className="rounded-lg border border-maroon/10 bg-cream/60 px-3.5 py-3">
      <div className="flex items-center justify-between text-[9px] tracking-[0.2em] uppercase text-ink/55 mb-1">
        <span>{label}</span>{progress && <span>{progress.pct}%</span>}
      </div>
      <div className="font-display text-xl font-bold text-maroon leading-none">{value}</div>
      {progress && (
        <div className="mt-2 h-1 rounded-full bg-maroon/10 overflow-hidden">
          <div className="h-full" style={{ width: `${progress.pct}%`, backgroundColor: progress.color }} />
        </div>
      )}
    </div>
  );
}
