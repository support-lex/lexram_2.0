"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Plus, Mail, Shield, MoreHorizontal, Check,
  Pause, Play, UserMinus, Loader2, AlertCircle, X, Sparkles, Building2,
} from "lucide-react";
import {
  useRoleContext, listMyOrgMembers, inviteMember, updateMember, removeMember,
  fmtDate, relativeTime,
  type OrganizationMember, type MemberStatus, type MemberRole,
} from "@/lib/rbac";

const STATUS_PILL: Record<MemberStatus, { bg: string; text: string; dot: string; label: string }> = {
  active:    { bg: "#DCFCE7", text: "#14532D", dot: "#16A34A", label: "Active" },
  invited:   { bg: "#FEF9C3", text: "#713F12", dot: "#CA8A04", label: "Invited" },
  suspended: { bg: "#FEE2E2", text: "#7F1D1D", dot: "#DC2626", label: "Suspended" },
};

export default function TeamPage() {
  const router = useRouter();
  const ctx = useRoleContext();
  const org = ctx.org;

  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!org) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listMyOrgMembers(org.id);
        if (!cancelled) setMembers(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [org]);

  const activeMembers = useMemo(() => members.filter((m) => m.status !== "suspended").length, [members]);

  if (ctx.loading) {
    return <div className="min-h-full grid place-items-center py-20"><Loader2 className="w-5 h-5 animate-spin text-maroon" /></div>;
  }
  if (ctx.role !== "admin" && ctx.role !== "super_admin") {
    return (
      <div className="min-h-full flex flex-col items-center justify-center text-center px-6 py-20 bg-cream">
        <div className="w-16 h-16 rounded-2xl bg-maroon/10 grid place-items-center mb-3">
          <Shield className="w-7 h-7 text-maroon/60" />
        </div>
        <h1 className="font-display text-2xl font-bold text-maroon">Team management is admin-only</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-md">Only the organisation admin can invite or manage users.</p>
        <button onClick={() => router.push("/dashboard/tsr")} className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-maroon text-cream text-sm font-semibold hover:bg-maroon-deep transition">
          Back to TSR
        </button>
      </div>
    );
  }
  if (!org) {
    return <div className="px-6 py-20 text-center text-sm text-ink/60">Your account isn&apos;t linked to an organisation yet.</div>;
  }

  const seatPct = Math.round((activeMembers / Math.max(org.seat_limit, 1)) * 100);
  const seatColor = seatPct >= 90 ? "#DC2626" : seatPct >= 70 ? "#CA8A04" : "#16A34A";

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto w-full bg-cream">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            <Shield className="w-3 h-3 text-rust" />
            Organisation admin
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-maroon">{org.name}</h1>
          <p className="text-sm sm:text-base text-ink/65 mt-2">Invite teammates, change roles, and keep an eye on seat usage.</p>
        </div>
        <button onClick={() => setInviteOpen(true)} disabled={activeMembers >= org.seat_limit}
          className="inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep disabled:bg-maroon/40 disabled:cursor-not-allowed text-cream px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-[0_10px_24px_-12px_rgba(104,3,24,0.55)]"
          title={activeMembers >= org.seat_limit ? "Seat limit reached. Contact LexRam." : "Invite a new member"}>
          <Plus className="w-4 h-4" />Invite member
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 break-words">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <Stat icon={Building2} label="Plan" value={org.plan} />
        <div className="rounded-xl border border-maroon/12 bg-cream-soft px-4 py-3.5">
          <div className="flex items-center justify-between text-[9px] tracking-[0.2em] uppercase text-ink/55 mb-1.5">
            <span>Seats</span><span>{seatPct}%</span>
          </div>
          <div className="font-display text-xl font-bold text-maroon leading-none">{activeMembers} / {org.seat_limit}</div>
          <div className="mt-2 h-1 rounded-full bg-maroon/10 overflow-hidden">
            <div className="h-full" style={{ width: `${seatPct}%`, backgroundColor: seatColor }} />
          </div>
        </div>
        <Stat icon={Users} label="Active members" value={activeMembers.toString()} />
        <Stat icon={Sparkles} label="Pending invites" value={members.filter((m) => m.status === "invited").length.toString()} />
      </div>

      <div className="rounded-2xl border border-maroon/12 bg-cream-soft overflow-hidden shadow-soft">
        <div className="px-5 md:px-6 py-4 border-b border-maroon/10 flex items-center gap-2 text-maroon">
          <Users className="w-4 h-4 text-rust" />
          <h2 className="font-semibold">Members</h2>
          <span className="text-xs text-ink/55">({members.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-maroon/[0.04] text-[10px] tracking-[0.2em] uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cases</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last active</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-4 py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-maroon mx-auto" /></td></tr>}
              {!loading && members.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-ink/55">No members yet. Invite someone to get started.</td></tr>
              )}
              {members.map((m) => (
                <MemberRow key={m.id} m={m} isSelf={m.user_id === ctx.user_id}
                  onUpdated={(next) => setMembers((curr) => curr.map((x) => (x.id === next.id ? { ...x, ...next } : x)))}
                  onRemoved={(id) => setMembers((curr) => curr.filter((x) => x.id !== id))} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {inviteOpen && (
        <InviteModal onClose={() => setInviteOpen(false)} orgId={org.id} seatsRemaining={org.seat_limit - activeMembers}
          onInvited={(member) => { setMembers((curr) => [...curr, member]); setInviteOpen(false); }} />
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-maroon/12 bg-cream-soft px-4 py-3.5">
      <div className="flex items-center justify-between text-ink/55">
        <Icon className="w-4 h-4 text-rust" />
        <span className="text-[9px] tracking-[0.2em] uppercase">{label}</span>
      </div>
      <div className="font-display text-xl font-bold text-maroon mt-1.5 leading-none capitalize">{value}</div>
    </div>
  );
}

function MemberRow({
  m, isSelf, onUpdated, onRemoved,
}: {
  m: OrganizationMember; isSelf: boolean;
  onUpdated: (next: OrganizationMember) => void;
  onRemoved: (id: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const s = STATUS_PILL[m.status];
  const initials = (m.name || m.email).split(/[\s@]+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const run = async (op: () => Promise<void>) => {
    setBusy(true);
    try { await op(); } catch (e) { alert(`Failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); setMenu(false); }
  };

  return (
    <tr className="border-t border-maroon/10 hover:bg-maroon/[0.03] transition">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-rust/15 border border-rust/30 grid place-items-center text-rust text-xs font-bold shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink truncate">{m.name || "—"}</div>
            <div className="text-[11px] text-ink/55 truncate">{m.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex text-[10px] tracking-wider uppercase font-semibold px-2.5 py-0.5 rounded-full ${m.role === "admin" ? "bg-maroon text-cream" : "bg-maroon/8 text-maroon"}`}>{m.role}</span>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />{s.label}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-ink/75">{m.case_count}</td>
      <td className="px-4 py-3.5 text-sm text-ink/60">{fmtDate(m.joined_at)}</td>
      <td className="px-4 py-3.5 text-sm text-ink/60">{relativeTime(m.last_active_at)}</td>
      <td className="px-4 py-3.5 text-right relative">
        {isSelf ? <span className="text-[11px] text-ink/45 italic">(you)</span> : (
          <>
            <button onClick={() => setMenu((o) => !o)} disabled={busy} aria-label="Member actions"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-maroon/15 text-ink/65 hover:border-maroon hover:text-maroon disabled:opacity-50 transition">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
            </button>
            {menu && (
              <div className="absolute right-4 top-12 z-10 w-52 rounded-lg border border-maroon/15 bg-cream-soft shadow-[0_18px_40px_-12px_rgba(104,3,24,0.45)] py-1.5 text-sm text-ink">
                {m.status === "active" && (
                  <button onClick={() => run(async () => {
                    const updated = await updateMember(m.id, { role: m.role === "admin" ? "member" : "admin" });
                    onUpdated({ ...m, role: updated.role });
                  })} className="w-full text-left px-3.5 py-2 hover:bg-maroon/5 inline-flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-rust" />
                    {m.role === "admin" ? "Demote to member" : "Promote to admin"}
                  </button>
                )}
                {m.status !== "suspended" ? (
                  <button onClick={() => run(async () => {
                    const updated = await updateMember(m.id, { status: "suspended" });
                    onUpdated({ ...m, status: updated.status });
                  })} className="w-full text-left px-3.5 py-2 hover:bg-maroon/5 inline-flex items-center gap-2">
                    <Pause className="w-3.5 h-3.5 text-rust" />Suspend access
                  </button>
                ) : (
                  <button onClick={() => run(async () => {
                    const updated = await updateMember(m.id, { status: "active" });
                    onUpdated({ ...m, status: updated.status });
                  })} className="w-full text-left px-3.5 py-2 hover:bg-maroon/5 inline-flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-emerald-600" />Reactivate
                  </button>
                )}
                <button onClick={() => {
                  if (!confirm(`Remove ${m.name || m.email}?`)) return;
                  run(async () => { await removeMember(m.id); onRemoved(m.id); });
                }} className="w-full text-left px-3.5 py-2 hover:bg-red-50 hover:text-red-700 text-ink/85 inline-flex items-center gap-2 border-t border-maroon/10 mt-1 pt-2.5">
                  <UserMinus className="w-3.5 h-3.5" />Remove from org
                </button>
              </div>
            )}
          </>
        )}
      </td>
    </tr>
  );
}

function InviteModal({
  onClose, onInvited, orgId, seatsRemaining,
}: {
  onClose: () => void;
  onInvited: (member: OrganizationMember) => void;
  orgId: string; seatsRemaining: number;
}) {
  const [email, setEmail] = useState("");
  const [name, setName]   = useState("");
  const [role, setRole]   = useState<MemberRole>("member");
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (seatsRemaining <= 0) { setErr("Seat limit reached. Contact LexRam."); return; }
    setBusy(true);
    try {
      const member = await inviteMember({ org_id: orgId, email, name, role });
      onInvited(member);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-maroon-deep/45 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative bg-cream-soft rounded-2xl shadow-[0_30px_80px_-20px_rgba(104,3,24,0.55)] w-full max-w-md p-7 border border-maroon/10">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-ink/40 hover:text-maroon p-1.5 rounded-lg hover:bg-maroon/10 transition">
          <X className="w-4 h-4" />
        </button>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
          <Sparkles className="w-3 h-3 text-rust" />New invite
        </div>
        <h2 className="font-display text-xl font-bold text-maroon leading-tight">Invite a teammate</h2>
        <p className="text-sm text-ink/60 mt-1.5">We&apos;ll email them a magic-link invite.</p>

        {err && (
          <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span className="break-words">{err}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Email <span className="text-rust">*</span></span>
            <div className="relative">
              <Mail className="w-4 h-4 text-maroon/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="adv.kumar@yourfirm.in"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
            </div>
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Display name (optional)</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adv. Kumar"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
          </label>
          <div>
            <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Role</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["member", "admin"] as MemberRole[]).map((r) => {
                const active = role === r;
                return (
                  <button type="button" key={r} onClick={() => setRole(r)}
                    className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition ${active ? "bg-maroon text-cream shadow-soft" : "bg-maroon/[0.04] text-ink/75 hover:bg-maroon/10"}`}>
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] text-ink/55 leading-snug">
            <span className="font-semibold text-ink/75">{seatsRemaining}</span> seat{seatsRemaining === 1 ? "" : "s"} remaining on this plan.
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-ink/70 hover:text-ink hover:bg-maroon/5 transition border border-maroon/15">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep disabled:opacity-70 text-cream px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-[0_10px_24px_-12px_rgba(104,3,24,0.55)]">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Send invite</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
