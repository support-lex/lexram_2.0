"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, User as UserIcon, Mail, Phone, MapPin, Hash,
  Sparkles, Loader2, AlertCircle, Plus, Trash2, Users,
} from "lucide-react";
import { submitOrgRequest, type OrgRequestTeamMember } from "@/lib/rbac";

const ORG_TYPES = ["Law firm", "Bank panel verifier", "Title company", "Real estate developer", "Solo chambers", "Other"];

export default function OrganizationRequestPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organization_name: "",
    organization_type: "Law firm",
    contact_name:      "",
    contact_email:     "",
    contact_phone:     "",
    address:           "",
    gstin:             "",
    team_size:         3,
    notes:             "",
  });
  const [team, setTeam] = useState<OrgRequestTeamMember[]>([
    { name: "", email: "", role: "Associate" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTeammate = () => setTeam((t) => [...t, { name: "", email: "", role: "Associate" }]);
  const removeTeammate = (i: number) => setTeam((t) => t.filter((_, idx) => idx !== i));
  const updateTeammate = (i: number, patch: Partial<OrgRequestTeamMember>) =>
    setTeam((t) => t.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await submitOrgRequest({
        ...form,
        team_details: team.filter((m) => (m.name?.trim() || m.email?.trim())),
      });
      router.replace("/dashboard/tsr/onboarding/pending");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 sm:py-10 max-w-3xl mx-auto bg-cream">
      <Link href="/dashboard/tsr/onboarding" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/65 hover:text-ink transition mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to onboarding
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rust/12 text-rust text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
          <Sparkles className="w-3 h-3" />
          Organisation request
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight text-maroon">
          Tell us about your firm
        </h1>
        <p className="text-sm text-ink/65 mt-2 max-w-xl">
          Lexram reviews each request manually to make sure organisations are set up correctly.
          You&apos;ll hear back within one working day via email at <strong className="text-ink/80">{form.contact_email || "the email you provide below"}</strong>.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 break-words">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="rounded-2xl border border-maroon/12 bg-cream-soft shadow-soft p-6 md:p-8 space-y-6">
        {/* Org details */}
        <section className="space-y-4">
          <h3 className="text-[10px] tracking-[0.22em] uppercase text-rust font-bold">Organisation</h3>
          <Field label="Organisation name" icon={Building2} required value={form.organization_name} onChange={(v) => setForm({ ...form, organization_name: v })} placeholder="e.g. Subramanian & Partners" />
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Type</label>
            <select
              value={form.organization_type}
              onChange={(e) => setForm({ ...form, organization_type: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
            >
              {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Field label="Address" icon={MapPin} value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Office address (optional)" />
          <Field label="GSTIN" icon={Hash} value={form.gstin} onChange={(v) => setForm({ ...form, gstin: v })} placeholder="Optional, for invoicing" />
        </section>

        {/* Primary contact */}
        <section className="space-y-4 pt-2 border-t border-maroon/10">
          <h3 className="text-[10px] tracking-[0.22em] uppercase text-rust font-bold pt-4">Primary contact (will become the org admin)</h3>
          <Field label="Full name"   icon={UserIcon} required value={form.contact_name}  onChange={(v) => setForm({ ...form, contact_name: v })}  placeholder="e.g. Ravi Subramanian" />
          <Field label="Email"       icon={Mail} type="email" required value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} placeholder="ravi@yourfirm.in" />
          <Field label="Phone"       icon={Phone} type="tel"  value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} placeholder="+91 …" />
        </section>

        {/* Team */}
        <section className="space-y-4 pt-2 border-t border-maroon/10">
          <div className="flex items-center justify-between pt-4">
            <h3 className="text-[10px] tracking-[0.22em] uppercase text-rust font-bold">Team</h3>
            <span className="text-[10px] text-ink/55">{team.length} listed</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Estimated team size</label>
            <input
              type="number" min={1} max={500} required
              value={form.team_size}
              onChange={(e) => setForm({ ...form, team_size: parseInt(e.target.value || "1", 10) })}
              className="w-full px-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
            />
          </div>

          <div className="space-y-3">
            {team.map((m, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2 items-end">
                <input
                  type="text" placeholder="Name"
                  value={m.name ?? ""}
                  onChange={(e) => updateTeammate(i, { name: e.target.value })}
                  className="px-3 py-2 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
                />
                <input
                  type="email" placeholder="email@yourfirm.in"
                  value={m.email ?? ""}
                  onChange={(e) => updateTeammate(i, { email: e.target.value })}
                  className="px-3 py-2 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
                />
                <input
                  type="text" placeholder="Role"
                  value={m.role ?? ""}
                  onChange={(e) => updateTeammate(i, { role: e.target.value })}
                  className="px-3 py-2 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
                />
                <button
                  type="button"
                  onClick={() => removeTeammate(i)}
                  disabled={team.length === 1}
                  aria-label="Remove teammate"
                  className="w-9 h-9 rounded-md border border-maroon/15 text-ink/65 hover:border-red-400 hover:text-red-700 disabled:opacity-40 disabled:hover:border-maroon/15 disabled:hover:text-ink/65 transition grid place-items-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button" onClick={addTeammate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rust hover:text-maroon transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add teammate
            </button>
          </div>
        </section>

        {/* Notes */}
        <section className="space-y-3 pt-2 border-t border-maroon/10">
          <h3 className="text-[10px] tracking-[0.22em] uppercase text-rust font-bold pt-4">Anything else?</h3>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Use case, expected volume, special requirements…"
            className="w-full px-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition resize-none"
          />
        </section>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <Link href="/dashboard/tsr/onboarding" className="px-4 py-2.5 rounded-lg text-sm font-medium text-ink/70 hover:text-ink hover:bg-maroon/5 text-center transition">
            Cancel
          </Link>
          <button type="submit" disabled={busy}
            className="inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep disabled:opacity-70 text-cream px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-[0_10px_24px_-12px_rgba(104,3,24,0.55)]">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Users className="w-4 h-4" /> Submit request</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, icon: Icon, value, onChange, type = "text", placeholder, required,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">
        {label}{required && <span className="text-rust"> *</span>}
      </span>
      <div className="relative">
        <Icon className="w-4 h-4 text-maroon/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
        />
      </div>
    </label>
  );
}
