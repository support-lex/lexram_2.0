"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, User as UserIcon, Mail, Phone, MapPin, Hash,
  Loader2, AlertCircle, Database, Globe, Banknote, Languages, BarChart3,
  IdCard, ImageIcon, Trash2, CheckCircle2, ShieldAlert, Sparkles,
} from "lucide-react";
import {
  createOrganization, sanitizeSchemaName, schemaNameError, useRoleContext,
  type EntityType, type MonthlyVolumeRange, type OrgPlan, type CreateOrgResult,
} from "@/lib/rbac";

const ENTITY_TYPES: EntityType[] = ["Sole Proprietorship", "Partnership", "LLP", "Private Limited", "Public Limited", "Other"];
const LANGUAGES = ["English", "Bilingual (English + Tamil)", "Bilingual (English + Hindi)", "Other"];
const VOLUME_RANGES: { value: MonthlyVolumeRange; label: string }[] = [
  { value: "0-50", label: "Up to 50 / month" },
  { value: "50-200", label: "50 – 200 / month" },
  { value: "200-500", label: "200 – 500 / month" },
  { value: "500+", label: "500+ / month" },
];
const PRIMARY_BANKS = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
  "Punjab National Bank", "Canara Bank", "Bank of Baroda", "Indian Bank",
  "Union Bank of India", "Kotak Mahindra Bank", "IDBI Bank", "IDFC First Bank",
  "Indian Overseas Bank", "Federal Bank", "South Indian Bank", "Karur Vysya Bank",
  "Tamilnad Mercantile Bank", "City Union Bank", "Karnataka Bank", "RBL Bank",
];

export default function NewOrganizationPage() {
  const router = useRouter();
  const ctx = useRoleContext();

  const [form, setForm] = useState({
    name: "",
    schema_override: "",
    entity_type: "LLP" as EntityType,
    office_website: "",
    organization_pan: "",
    gstin: "",
    address: "",
    billing_email: "",
    default_language: "English",
    estimated_monthly_volume: "50-200" as MonthlyVolumeRange,
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    plan: "standard" as OrgPlan,
    seat_limit: 10,
  });
  const [banks, setBanks] = useState<string[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateOrgResult | null>(null);

  const schema = useMemo(() => sanitizeSchemaName(form.schema_override || form.name), [form.schema_override, form.name]);
  const schemaErr = schema ? schemaNameError(schema) : null;

  const toggleBank = (b: string) => setBanks((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  const onLogo = (file: File | null) => { setLogo(file); setLogoPreview(file ? URL.createObjectURL(file) : null); };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (schemaErr) { setError(schemaErr); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("name", form.name);
      fd.set("schema_name", schema);
      fd.set("entity_type", form.entity_type);
      fd.set("office_website", form.office_website);
      fd.set("organization_pan", form.organization_pan);
      fd.set("gstin", form.gstin);
      fd.set("address", form.address);
      fd.set("billing_email", form.billing_email);
      fd.set("default_language", form.default_language);
      fd.set("estimated_monthly_volume", form.estimated_monthly_volume);
      fd.set("admin_name", form.admin_name);
      fd.set("admin_email", form.admin_email);
      fd.set("admin_phone", form.admin_phone);
      fd.set("plan", form.plan);
      fd.set("seat_limit", String(form.seat_limit));
      fd.set("primary_banks_served", JSON.stringify(banks));
      if (logo) fd.set("logo", logo);
      setResult(await createOrganization(fd));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  if (ctx.loading) return <div className="min-h-full grid place-items-center py-20"><Loader2 className="w-5 h-5 animate-spin text-maroon" /></div>;
  if (ctx.role !== "super_admin") return <div className="px-6 py-20 text-center text-sm text-ink/60">Super admin only.</div>;

  if (result) {
    return (
      <div className="px-6 py-10 max-w-2xl mx-auto bg-cream min-h-full">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 grid place-items-center shrink-0"><CheckCircle2 className="w-5 h-5 text-white" /></div>
            <div className="flex-1">
              <div className="font-display text-xl font-bold text-emerald-900">{result.org.name} created</div>
              <div className="text-sm text-emerald-800/85 mt-1">
                Schema <code className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">{result.org.schema_name}.cases</code> /{" "}
                <code className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">{result.org.schema_name}.documents</code> provisioned.
                {result.invite_sent ? ` Invite emailed to ${result.org.admin_email}.` : " Admin already had an account."}
              </div>
            </div>
          </div>
          {result.manual_steps.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm mb-1.5"><ShieldAlert className="w-4 h-4" /> Operator step needed</div>
              <ul className="text-xs text-amber-900/85 list-disc list-inside space-y-1">{result.manual_steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-5">
          <Link href={`/dashboard/tsr/admin/${result.org.id}`} className="inline-flex items-center gap-2 bg-maroon hover:bg-maroon-deep text-cream px-4 py-2.5 rounded-lg text-sm font-semibold transition">View organisation</Link>
          <Link href="/dashboard/tsr/admin" className="inline-flex items-center gap-2 border border-maroon/15 text-ink/75 hover:text-ink px-4 py-2.5 rounded-lg text-sm font-medium transition">Back to list</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-3xl mx-auto bg-cream">
      <Link href="/dashboard/tsr/admin" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/65 hover:text-ink transition mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to organisations
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rust/12 text-rust text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
          <Sparkles className="w-3 h-3" /> New tenant
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-maroon">Create organisation</h1>
        <p className="text-sm text-ink/65 mt-2 max-w-xl">One click provisions a dedicated Postgres schema, uploads the logo, and invites the admin. The org then runs on its own TSR app.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><p className="text-sm text-red-800 break-words">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Section number="1" title="Organisation identity">
          <div className="flex items-start gap-4">
            <LogoPicker preview={logoPreview} onPick={onLogo} onClear={() => onLogo(null)} />
            <div className="flex-1 space-y-4">
              <Field label="Legal organisation name" required icon={Building2} value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. AVR Associates" />
              <div>
                <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">
                  <span className="inline-flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-rust" /> Schema name</span>
                </label>
                <input value={form.schema_override} onChange={(e) => setForm({ ...form, schema_override: e.target.value })} placeholder={schema || "auto from name"}
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-md border border-maroon/15 bg-cream text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
                <p className={`mt-1 text-[10px] ${schemaErr ? "text-red-600" : "text-ink/50"}`}>
                  {schemaErr ? schemaErr : <>Tables will be created as <code className="font-mono">{schema || "…"}.cases</code> and <code className="font-mono">{schema || "…"}.documents</code>. Leave blank to auto-derive.</>}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Entity type" required value={form.entity_type} onChange={(v) => setForm({ ...form, entity_type: v as EntityType })} options={ENTITY_TYPES.map((e) => ({ value: e, label: e }))} />
            <Field label="Office website" icon={Globe} type="url" value={form.office_website} onChange={(v) => setForm({ ...form, office_website: v })} placeholder="https://avr.in" />
          </div>
        </Section>

        <Section number="2" title="Compliance & invoicing">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organisation PAN" icon={IdCard} value={form.organization_pan} onChange={(v) => setForm({ ...form, organization_pan: v.toUpperCase() })} placeholder="AAAAA0000A" maxLength={10} />
            <Field label="GSTIN" icon={Hash} value={form.gstin} onChange={(v) => setForm({ ...form, gstin: v.toUpperCase() })} placeholder="22AAAAA0000A1Z5" maxLength={15} />
          </div>
          <Textarea label="Registered business address" icon={MapPin} value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Full address as on PAN / GST" rows={3} />
          <Field label="Billing email" icon={Mail} type="email" value={form.billing_email} onChange={(v) => setForm({ ...form, billing_email: v })} placeholder="accounts@avr.in" />
        </Section>

        <Section number="3" title="AI & operational configuration">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-2 uppercase">
              <span className="inline-flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5 text-rust" /> Primary banks served</span>
              <span className="text-ink/45 ml-2 normal-case font-medium">({banks.length} selected)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-2 rounded-md border border-maroon/15 bg-cream">
              {PRIMARY_BANKS.map((b) => {
                const active = banks.includes(b);
                return <button type="button" key={b} onClick={() => toggleBank(b)} className={`text-left text-xs px-2.5 py-1.5 rounded transition ${active ? "bg-maroon text-cream font-semibold" : "bg-maroon/[0.04] text-ink/80 hover:bg-maroon/10"}`}>{b}</button>;
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Default report language" icon={Languages} value={form.default_language} onChange={(v) => setForm({ ...form, default_language: v })} options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
            <Select label="Estimated monthly volume" icon={BarChart3} value={form.estimated_monthly_volume} onChange={(v) => setForm({ ...form, estimated_monthly_volume: v as MonthlyVolumeRange })} options={VOLUME_RANGES} />
          </div>
        </Section>

        <Section number="4" title="Admin & plan">
          <Field label="Admin full name" required icon={UserIcon} value={form.admin_name} onChange={(v) => setForm({ ...form, admin_name: v })} placeholder="e.g. Ravi Kumar" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Admin login email" required icon={Mail} type="email" value={form.admin_email} onChange={(v) => setForm({ ...form, admin_email: v })} placeholder="ravi@avr.in" />
            <Field label="Contact number" icon={Phone} type="tel" value={form.admin_phone} onChange={(v) => setForm({ ...form, admin_phone: v })} placeholder="+91 …" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Plan</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["trial", "standard", "enterprise"] as OrgPlan[]).map((p) => (
                  <button type="button" key={p} onClick={() => setForm({ ...form, plan: p })} className={`px-2.5 py-2 rounded-md text-xs font-medium capitalize transition ${form.plan === p ? "bg-maroon text-cream shadow-soft" : "bg-maroon/[0.04] text-ink/75 hover:bg-maroon/10"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Seat limit</label>
              <input type="number" min={1} max={500} required value={form.seat_limit} onChange={(e) => setForm({ ...form, seat_limit: parseInt(e.target.value || "1", 10) })}
                className="w-full px-3.5 py-2.5 rounded-md border border-maroon/15 bg-cream text-sm text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
            </div>
          </div>
        </Section>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-1">
          <Link href="/dashboard/tsr/admin" className="px-4 py-2.5 rounded-lg text-sm font-medium text-ink/70 hover:text-ink hover:bg-maroon/5 text-center transition">Cancel</Link>
          <button type="submit" disabled={busy || !!schemaErr}
            className="inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep disabled:opacity-60 text-cream px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-soft">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning…</> : <>Create &amp; provision</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function LogoPicker({ preview, onPick, onClear }: { preview: string | null; onPick: (f: File | null) => void; onClear: () => void }) {
  return (
    <div className="shrink-0">
      <label className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Logo</label>
      <label className="w-24 h-24 rounded-xl border border-dashed border-maroon/25 bg-cream grid place-items-center cursor-pointer hover:border-maroon/50 transition overflow-hidden relative">
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={preview} alt="logo preview" className="w-full h-full object-cover" />
        ) : (
          <span className="flex flex-col items-center text-maroon/45"><ImageIcon className="w-6 h-6" /><span className="text-[10px] mt-1">Upload</span></span>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
      </label>
      {preview && <button type="button" onClick={onClear} className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-ink/55 hover:text-red-600 transition"><Trash2 className="w-3 h-3" /> Remove</button>}
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-maroon/12 bg-cream-soft shadow-soft p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-7 h-7 rounded-full bg-rust grid place-items-center text-cream text-xs font-bold shrink-0 font-mono">{number}</div>
        <h2 className="font-display text-lg font-bold text-maroon">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, icon: Icon, value, onChange, type = "text", placeholder, required, maxLength }: {
  label: string; icon?: React.ComponentType<{ className?: string }>; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">{label}{required && <span className="text-rust"> *</span>}</span>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-maroon/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} maxLength={maxLength}
          className={`w-full ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition`} />
      </div>
    </label>
  );
}

function Textarea({ label, icon: Icon, value, onChange, placeholder, rows = 3 }: {
  label: string; icon?: React.ComponentType<{ className?: string }>; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">{label}{Icon && <Icon className="w-3.5 h-3.5 inline-block ml-1.5 text-rust" />}</span>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink placeholder:text-ink/35 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition resize-none" />
    </label>
  );
}

function Select({ label, value, onChange, options, icon: Icon, required }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; icon?: React.ComponentType<{ className?: string }>; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">{Icon && <Icon className="w-3.5 h-3.5 inline-block mr-1.5 text-rust" />}{label}{required && <span className="text-rust"> *</span>}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full px-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
