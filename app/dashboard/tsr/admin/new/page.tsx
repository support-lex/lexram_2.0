"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, User as UserIcon, Mail, Sparkles, Loader2, Check, AlertCircle } from "lucide-react";
import { createOrganization, useRoleContext, type OrgPlan } from "@/lib/rbac";

export default function NewOrganizationPage() {
  const router = useRouter();
  const ctx = useRoleContext();
  const [form, setForm] = useState({
    name: "", admin_name: "", admin_email: "",
    plan: "standard" as OrgPlan, seat_limit: 10,
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createOrganization(form);
      setDone(true);
      setTimeout(() => router.push("/dashboard/tsr/admin"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (ctx.loading) return <div className="min-h-full grid place-items-center py-20"><Loader2 className="w-5 h-5 animate-spin text-maroon" /></div>;
  if (ctx.role !== "super_admin") return (
    <div className="px-6 py-20 text-center text-sm text-ink/60">Super admin only.</div>
  );

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 sm:py-10 max-w-2xl mx-auto bg-cream">
      <Link href="/dashboard/tsr/admin" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/65 hover:text-ink transition mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to organisations
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rust/12 text-rust text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
          <Sparkles className="w-3 h-3" />
          New tenant
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight text-maroon">Create organisation</h1>
        <p className="text-sm text-ink/65 mt-2">
          Provisions the admin user and emails them a magic-link invite.
        </p>
      </div>

      {done ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500 grid place-items-center shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-emerald-900">Organisation created</div>
            <div className="text-sm text-emerald-800/85 mt-1">Invite sent to <strong>{form.admin_email}</strong>. Redirecting…</div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="rounded-2xl border border-maroon/12 bg-cream-soft shadow-soft p-6 md:p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 break-words">{error}</p>
            </div>
          )}
          <Field label="Organisation name" icon={Building2} placeholder="e.g. Subramanian & Partners" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Admin full name"   icon={UserIcon}  placeholder="e.g. Ravi Subramanian"        value={form.admin_name} onChange={(v) => setForm({ ...form, admin_name: v })} required />
          <Field label="Admin email"       icon={Mail} type="email" placeholder="ravi@subramanianpartners.in" value={form.admin_email} onChange={(v) => setForm({ ...form, admin_email: v })} required />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Plan</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["trial", "standard", "enterprise"] as OrgPlan[]).map((p) => {
                  const active = form.plan === p;
                  return (
                    <button type="button" key={p} onClick={() => setForm({ ...form, plan: p })}
                      className={`px-2.5 py-2 rounded-md text-xs font-medium capitalize transition ${active ? "bg-maroon text-cream shadow-soft" : "bg-maroon/[0.04] text-ink/75 hover:bg-maroon/10"}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Seat limit</label>
              <input type="number" min={1} max={500} required value={form.seat_limit}
                onChange={(e) => setForm({ ...form, seat_limit: parseInt(e.target.value || "1", 10) })}
                className="w-full px-3.5 py-2.5 rounded-md border border-maroon/15 bg-cream text-sm text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
            </div>
          </div>

          <div className="rounded-lg border border-maroon/10 bg-cream/60 p-4 text-[11px] text-ink/70 leading-relaxed">
            <strong className="text-ink">What happens next:</strong> admin receives a magic-link email. After they sign in,
            they can invite team members up to the seat limit.
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <Link href="/dashboard/tsr/admin" className="px-4 py-2.5 rounded-lg text-sm font-medium text-ink/70 hover:text-ink hover:bg-maroon/5 text-center transition">Cancel</Link>
            <button type="submit" disabled={busy}
              className="inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep disabled:opacity-70 text-cream px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-soft">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create organisation</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label, icon: Icon, value, onChange, type = "text", placeholder, required,
}: {
  label: string; icon: React.ComponentType<{ className?: string }>;
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">{label}</span>
      <div className="relative">
        <Icon className="w-4 h-4 text-maroon/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
          className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
      </div>
    </label>
  );
}
