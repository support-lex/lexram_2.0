"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, User as UserIcon, Mail, Phone, MapPin, Hash,
  Sparkles, Loader2, AlertCircle, Plus, Trash2, Users, Globe,
  Banknote, Upload, Languages, BarChart3, FileText, IdCard,
} from "lucide-react";
import {
  submitOrgRequest,
  type OrgRequestTeamMember, type EntityType, type MonthlyVolumeRange,
} from "@/lib/rbac";

const ENTITY_TYPES: EntityType[] = ["Sole Proprietorship", "Partnership", "LLP", "Private Limited", "Public Limited", "Other"];

const PRIMARY_BANKS = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
  "Punjab National Bank", "Canara Bank", "Bank of Baroda", "Indian Bank",
  "Union Bank of India", "Bank of India", "Kotak Mahindra Bank",
  "IDBI Bank", "IDFC First Bank", "Indian Overseas Bank", "Yes Bank",
  "Federal Bank", "South Indian Bank", "Karur Vysya Bank",
  "Tamilnad Mercantile Bank", "City Union Bank", "Karnataka Bank",
  "RBL Bank", "Bandhan Bank", "AU Small Finance Bank",
];

const VOLUME_RANGES: { value: MonthlyVolumeRange; label: string }[] = [
  { value: "0-50",    label: "Up to 50 / month" },
  { value: "50-200",  label: "50 – 200 / month" },
  { value: "200-500", label: "200 – 500 / month" },
  { value: "500+",    label: "500+ / month" },
];

const LANGUAGES = ["English", "Bilingual (English + Tamil)", "Bilingual (English + Hindi)", "Other"];

export default function OrganizationRequestPage() {
  const router = useRouter();

  /* ─── State ─────────────────────────────────────────────────────────── */
  const [form, setForm] = useState({
    // 1. Organisation Identity
    organization_name:        "",
    entity_type:              "LLP" as EntityType,
    team_size:                3,
    office_website:           "",
    // 2. Compliance & Invoicing
    organization_pan:         "",
    gstin:                    "",
    address:                  "",
    billing_email:            "",
    // 3. AI & Operational
    default_language:         "English",
    estimated_monthly_volume: "50-200" as MonthlyVolumeRange,
    // 4. Admin POC
    contact_name:             "",
    contact_email:            "",
    contact_phone:            "",
    // Misc
    notes:                    "",
  });
  const [banks, setBanks] = useState<string[]>([]);
  const [team, setTeam]   = useState<OrgRequestTeamMember[]>([{ name: "", email: "", role: "Associate" }]);
  const [bankTemplate, setBankTemplate] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBank = (bank: string) =>
    setBanks((prev) => (prev.includes(bank) ? prev.filter((b) => b !== bank) : [...prev, bank]));

  const addTeammate    = () => setTeam((t) => [...t, { name: "", email: "", role: "Associate" }]);
  const removeTeammate = (i: number) => setTeam((t) => t.filter((_, idx) => idx !== i));
  const updateTeammate = (i: number, patch: Partial<OrgRequestTeamMember>) =>
    setTeam((t) => t.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await submitOrgRequest({
        organization_name: form.organization_name,
        entity_type:       form.entity_type,
        office_website:    form.office_website || undefined,
        organization_pan:  form.organization_pan || undefined,
        gstin:             form.gstin || undefined,
        address:           form.address || undefined,
        billing_email:     form.billing_email || undefined,
        primary_banks_served:     banks,
        default_language:         form.default_language,
        estimated_monthly_volume: form.estimated_monthly_volume,
        contact_name:     form.contact_name,
        contact_email:    form.contact_email,
        contact_phone:    form.contact_phone || undefined,
        team_size:        form.team_size,
        team_details:     team.filter((m) => (m.name?.trim() || m.email?.trim())),
        notes: [
          form.notes.trim(),
          bankTemplate ? `Bank template to upload: ${bankTemplate.name} (${(bankTemplate.size / 1024).toFixed(0)} KB) — please send to support@lexram.ai` : null,
        ].filter(Boolean).join("\n\n") || undefined,
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
          Lexram reviews each request manually to keep onboarding clean.
          You&apos;ll hear back within one working day via email at <strong className="text-ink/80">{form.contact_email || "the email you provide below"}</strong>.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 break-words">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* ── Section 1 ────────────────────────────────────────────────── */}
        <Section number="1" title="Organisation Identity" subtitle="The legal entity Lexram is contracting with.">
          <Field
            label="Legal firm name" required icon={Building2}
            value={form.organization_name}
            onChange={(v) => setForm({ ...form, organization_name: v })}
            placeholder="e.g. Subramanian & Partners LLP"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Entity type" required
              value={form.entity_type}
              onChange={(v) => setForm({ ...form, entity_type: v as EntityType })}
              options={ENTITY_TYPES.map((e) => ({ value: e, label: e }))}
            />
            <NumberField
              label="Firm size / team count" required
              value={form.team_size}
              onChange={(v) => setForm({ ...form, team_size: v })}
              min={1} max={500}
              hint="Lawyers + paralegals combined"
            />
          </div>
          <Field
            label="Office website (optional)" icon={Globe} type="url"
            value={form.office_website}
            onChange={(v) => setForm({ ...form, office_website: v })}
            placeholder="https://yourfirm.in"
          />
        </Section>

        {/* ── Section 2 ────────────────────────────────────────────────── */}
        <Section number="2" title="Compliance & Invoicing" subtitle="Used to generate valid B2B GST invoices.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Organisation PAN" required icon={IdCard}
              value={form.organization_pan}
              onChange={(v) => setForm({ ...form, organization_pan: v.toUpperCase() })}
              placeholder="AAAAA0000A"
              maxLength={10}
            />
            <Field
              label="GSTIN" icon={Hash}
              value={form.gstin}
              onChange={(v) => setForm({ ...form, gstin: v.toUpperCase() })}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
            />
          </div>
          <Textarea
            label="Registered business address" required icon={MapPin}
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            placeholder="Full address as on PAN / GST certificate"
            rows={3}
          />
          <Field
            label="Billing / accounts email (optional)" icon={Mail} type="email"
            value={form.billing_email}
            onChange={(v) => setForm({ ...form, billing_email: v })}
            placeholder="accounts@yourfirm.in — if different from the admin"
          />
        </Section>

        {/* ── Section 3 ────────────────────────────────────────────────── */}
        <Section number="3" title="AI & Operational Configuration" subtitle="Helps Lexram tune the workspace for your panel work.">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-2 uppercase">
              <span className="inline-flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-rust" />
                Primary banks served
              </span>
              <span className="text-ink/45 ml-2 normal-case font-medium">({banks.length} selected)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto p-2 rounded-md border border-maroon/15 bg-cream">
              {PRIMARY_BANKS.map((bank) => {
                const active = banks.includes(bank);
                return (
                  <button
                    type="button" key={bank}
                    onClick={() => toggleBank(bank)}
                    className={`text-left text-xs px-2.5 py-1.5 rounded transition ${
                      active
                        ? "bg-maroon text-cream font-semibold"
                        : "bg-maroon/[0.04] text-ink/80 hover:bg-maroon/10"
                    }`}
                  >
                    {bank}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[10px] text-ink/50">Tap to toggle. Scroll for more.</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">
              <span className="inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-rust" />
                Custom bank template (optional)
              </span>
            </label>
            <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-md border border-dashed border-maroon/25 bg-cream cursor-pointer hover:border-maroon/50 transition">
              <FileText className="w-4 h-4 text-maroon/55 shrink-0" />
              <input
                type="file"
                accept=".doc,.docx,.pdf"
                onChange={(e) => setBankTemplate(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <span className="text-sm text-ink/75 truncate flex-1">
                {bankTemplate ? bankTemplate.name : "Choose .doc, .docx, or .pdf"}
              </span>
              {bankTemplate && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setBankTemplate(null); }}
                  className="text-ink/45 hover:text-red-600 transition"
                  aria-label="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </label>
            <p className="mt-1.5 text-[10px] text-ink/50">
              We&apos;ll capture the filename in your request. Email the actual file to <a href="mailto:support@lexram.ai" className="text-rust hover:underline">support@lexram.ai</a> after submitting — uploads are coming soon.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default report language"
              icon={Languages}
              value={form.default_language}
              onChange={(v) => setForm({ ...form, default_language: v })}
              options={LANGUAGES.map((l) => ({ value: l, label: l }))}
            />
            <Select
              label="Estimated monthly case volume"
              icon={BarChart3}
              value={form.estimated_monthly_volume}
              onChange={(v) => setForm({ ...form, estimated_monthly_volume: v as MonthlyVolumeRange })}
              options={VOLUME_RANGES.map((v) => ({ value: v.value, label: v.label }))}
            />
          </div>
        </Section>

        {/* ── Section 4 ────────────────────────────────────────────────── */}
        <Section number="4" title="Admin Point of Contact" subtitle="This person becomes the org admin and receives the magic-link invite.">
          <Field
            label="Authorised signatory name" required icon={UserIcon}
            value={form.contact_name}
            onChange={(v) => setForm({ ...form, contact_name: v })}
            placeholder="Managing partner / authorised signatory"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Login email" required icon={Mail} type="email"
              value={form.contact_email}
              onChange={(v) => setForm({ ...form, contact_email: v })}
              placeholder="ravi@yourfirm.in"
            />
            <Field
              label="Official contact number" icon={Phone} type="tel"
              value={form.contact_phone}
              onChange={(v) => setForm({ ...form, contact_phone: v })}
              placeholder="+91 …"
            />
          </div>
        </Section>

        {/* ── Optional team list + notes ───────────────────────────────── */}
        <Section number="5" title="Team list (optional)" subtitle="Add teammates you'd like invited after the org is approved.">
          <div className="space-y-2">
            {team.map((m, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2 items-center">
                <input type="text" placeholder="Name" value={m.name ?? ""}
                  onChange={(e) => updateTeammate(i, { name: e.target.value })}
                  className="px-3 py-2 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
                <input type="email" placeholder="email@yourfirm.in" value={m.email ?? ""}
                  onChange={(e) => updateTeammate(i, { email: e.target.value })}
                  className="px-3 py-2 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
                <input type="text" placeholder="Role" value={m.role ?? ""}
                  onChange={(e) => updateTeammate(i, { role: e.target.value })}
                  className="px-3 py-2 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
                <button type="button" onClick={() => removeTeammate(i)} disabled={team.length === 1}
                  aria-label="Remove teammate"
                  className="w-9 h-9 rounded-md border border-maroon/15 text-ink/65 hover:border-red-400 hover:text-red-700 disabled:opacity-40 disabled:hover:border-maroon/15 disabled:hover:text-ink/65 transition grid place-items-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addTeammate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rust hover:text-maroon transition">
              <Plus className="w-3.5 h-3.5" />Add teammate
            </button>
          </div>

          <div className="pt-3">
            <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Anything else? (optional)</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Special workflow, integration needs, anything Lexram should know…"
              className="w-full px-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition resize-none" />
          </div>
        </Section>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <Link href="/dashboard/tsr/onboarding"
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-ink/70 hover:text-ink hover:bg-maroon/5 text-center transition">
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

/* ──────────────────────────────────────────────────────────────────────── */

function Section({
  number, title, subtitle, children,
}: { number: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-maroon/12 bg-cream-soft shadow-soft p-6 md:p-7">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-7 h-7 rounded-full bg-rust grid place-items-center text-cream text-xs font-bold shrink-0 font-mono">
          {number}
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-maroon leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-ink/60 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label, icon: Icon, value, onChange, type = "text", placeholder, required, maxLength,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">
        {label}{required && <span className="text-rust"> *</span>}
      </span>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-maroon/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />}
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          required={required} placeholder={placeholder} maxLength={maxLength}
          className={`w-full ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition`}
        />
      </div>
    </label>
  );
}

function NumberField({
  label, value, onChange, min, max, required, hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">
        {label}{required && <span className="text-rust"> *</span>}
      </span>
      <input
        type="number" min={min} max={max} required={required}
        value={value} onChange={(e) => onChange(parseInt(e.target.value || `${min ?? 1}`, 10))}
        className="w-full px-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
      />
      {hint && <p className="mt-1 text-[10px] text-ink/50">{hint}</p>}
    </label>
  );
}

function Textarea({
  label, icon: Icon, value, onChange, placeholder, required, rows = 3,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">
        {label}{required && <span className="text-rust"> *</span>}
        {Icon && <Icon className="w-3.5 h-3.5 inline-block ml-1.5 text-rust" />}
      </span>
      <textarea
        rows={rows} value={value} onChange={(e) => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition resize-none"
      />
    </label>
  );
}

function Select({
  label, value, onChange, options, icon: Icon, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">
        {Icon && <Icon className="w-3.5 h-3.5 inline-block mr-1.5 text-rust" />}
        {label}{required && <span className="text-rust"> *</span>}
      </span>
      <select
        value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full px-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
