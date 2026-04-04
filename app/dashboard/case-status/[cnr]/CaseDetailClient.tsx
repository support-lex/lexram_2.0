"use client";

import { useState } from 'react';
import {
  Scale, Calendar, MapPin, User, FileText, Gavel,
  RefreshCw, Sparkles, ChevronDown, ChevronUp,
  Clock, AlertCircle, Building2, Hash, Mail, MessageSquare
} from 'lucide-react';
import type { CaseWithDetails } from '@/lib/db/schema';

interface Props {
  caseData: CaseWithDetails;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function InfoCard({ label, value, icon: Icon, accent }: {
  label: string; value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string }>; accent?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={`rounded-xl p-3.5 border ${accent
      ? 'bg-[var(--accent)]/8 border-[var(--accent)]/20'
      : 'bg-[var(--bg-surface)] border-[var(--border-default)]'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className={`text-sm font-semibold break-words leading-snug ${accent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, count }: {
  icon: React.ComponentType<{ className?: string }>; title: string; count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 rounded-lg bg-[var(--accent)]/10">
        <Icon className="w-4 h-4 text-[var(--accent)]" />
      </div>
      <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-full px-2 py-0.5">
          {count}
        </span>
      )}
    </div>
  );
}

// ── stage badge ───────────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage?: string }) {
  if (!stage) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
      bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/20">
      {stage}
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const isDisposed = /dispos|decided|closed/i.test(status);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
      isDisposed
        ? 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20'
        : 'bg-emerald-500/12 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isDisposed ? 'bg-[var(--text-muted)]' : 'bg-emerald-500'}`} />
      {status}
    </span>
  );
}

// ── hearing date chip ─────────────────────────────────────────────────────────

function HearingDateChip({ date }: { date: string }) {
  if (!date) return <span className="text-[var(--text-muted)] text-xs">—</span>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let d: Date | null = null;
  // parse DD-MM-YYYY or DD/MM/YYYY
  const m = date.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (m) d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const diff = d ? Math.ceil((d.getTime() - today.getTime()) / 86400000) : null;
  const cls =
    diff === null ? 'text-[var(--text-muted)]' :
    diff === 0    ? 'text-red-500 font-bold' :
    diff > 0      ? 'text-emerald-600 dark:text-emerald-400 font-semibold' :
                    'text-[var(--text-muted)]';
  return <span className={`text-xs font-mono ${cls}`}>{date}</span>;
}

// ── AI Billing Opportunity Finder ─────────────────────────────────────────────

function BillingFinder({ caseData }: { caseData: CaseWithDetails }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    opportunities: string[];
    tasks: string[];
    emailDraft: string;
    messageDraft: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        action: 'billing_opportunities',
        caseContext: {
          cnr: caseData.cnr_number,
          caseType: caseData.case_type,
          caseName: caseData.case_title,
          court: caseData.court_name,
          stage: caseData.case_stage,
          nextHearing: caseData.next_hearing_date,
          petitioner: caseData.petitioner,
          respondent: caseData.respondent,
          petitionerAdvocate: caseData.petitioner_advocate,
          act: caseData.act,
          section: caseData.section,
          judge: caseData.judge,
          hearingsCount: caseData.hearings?.length ?? 0,
          lastHearings: (caseData.hearings ?? []).slice(0, 3).map(h => ({
            date: h.hearing_date, stage: h.stage, purpose: h.purpose, judge: h.judge_name,
          })),
          ordersCount: caseData.orders?.length ?? 0,
          lastOrders: (caseData.orders ?? []).slice(0, 2).map(o => ({
            date: o.order_date, text: o.order_text, type: o.order_type,
          })),
          documentsCount: caseData.documents?.length ?? 0,
        },
      };

      const res = await fetch('/api/ai/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/5 to-transparent overflow-hidden">
      {/* Header */}
      <button
        onClick={() => { setOpen(v => !v); if (!open && !result && !loading) run(); }}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--accent)]/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--accent)]/15">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-[var(--text-primary)]">AI Billing Opportunity Finder</p>
            <p className="text-xs text-[var(--text-muted)]">Identify billable events, pending tasks &amp; draft client comms</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Trigger button */}
          {!result && (
            <button
              onClick={run}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold
                hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Analysing case…' : 'Find Billing Opportunities'}
            </button>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Refresh */}
              <button onClick={run} disabled={loading}
                className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:opacity-80 transition-opacity">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh analysis
              </button>

              {/* Billing opportunities */}
              {result.opportunities.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> Billable Events
                  </p>
                  <ul className="space-y-1.5">
                    {result.opportunities.map((opp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action tasks */}
              {result.tasks.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                    <Gavel className="w-3.5 h-3.5" /> Action Items
                  </p>
                  <ul className="space-y-1.5">
                    {result.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                        <span className="mt-1 w-4 h-4 rounded border-2 border-[var(--accent)]/40 shrink-0" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Drafts */}
              {(result.emailDraft || result.messageDraft) && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {result.emailDraft && (
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> Email Draft
                      </p>
                      <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                        {result.emailDraft}
                      </pre>
                      <button
                        onClick={() => navigator.clipboard?.writeText(result.emailDraft)}
                        className="mt-2 text-xs text-[var(--accent)] hover:opacity-80"
                      >Copy</button>
                    </div>
                  )}
                  {result.messageDraft && (
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp / SMS
                      </p>
                      <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                        {result.messageDraft}
                      </pre>
                      <button
                        onClick={() => navigator.clipboard?.writeText(result.messageDraft)}
                        className="mt-2 text-xs text-[var(--accent)] hover:opacity-80"
                      >Copy</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CaseDetailClient({ caseData }: Props) {
  const petitionerParty = caseData.parties?.find(p => p.party_type === 'petitioner');
  const respondentParty = caseData.parties?.find(p => p.party_type === 'respondent');

  const petitionerName = caseData.petitioner || petitionerParty?.name;
  const petitionerAdv  = caseData.petitioner_advocate || petitionerParty?.advocate;
  const respondentName = caseData.respondent || respondentParty?.name;
  const respondentAdv  = caseData.respondent_advocate || respondentParty?.advocate;

  const hearings  = (caseData.hearings  ?? []).sort((a, b) =>
    (b.hearing_date ?? '').localeCompare(a.hearing_date ?? ''));
  const orders    = caseData.orders    ?? [];
  const documents = caseData.documents ?? [];

  return (
    <div className="space-y-6">
      {/* ── Case Header ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest
                text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20
                px-2.5 py-1 rounded-full">
                {caseData.cnr_number}
              </span>
              {caseData.case_type && (
                <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-sidebar)]/8
                  border border-[var(--border-default)] px-2.5 py-1 rounded-full">
                  {caseData.case_type}
                </span>
              )}
            </div>
            {caseData.case_title && (
              <h1 className="text-lg font-bold text-[var(--text-primary)] leading-snug">
                {caseData.case_title}
              </h1>
            )}
            {(!caseData.case_title && (petitionerName || respondentName)) && (
              <h1 className="text-lg font-bold text-[var(--text-primary)] leading-snug">
                {petitionerName || '?'} <span className="text-[var(--text-muted)] font-normal">vs</span> {respondentName || '?'}
              </h1>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <StatusBadge status={caseData.status} />
            <StageBadge stage={caseData.case_stage} />
          </div>
        </div>

        {/* Court */}
        {caseData.court_name && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
            <Building2 className="w-3.5 h-3.5" />
            {caseData.court_name}
          </div>
        )}
      </div>

      {/* ── Key Details Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <InfoCard label="Next Hearing" value={caseData.next_hearing_date} icon={Calendar} accent />
        <InfoCard label="Case No." value={caseData.case_number} icon={Hash} />
        <InfoCard label="Filing Date" value={caseData.filing_date} icon={Calendar} />
        <InfoCard label="Reg. Date" value={caseData.registration_date} icon={Calendar} />
        <InfoCard label="Reg. Number" value={caseData.registration_number} icon={Hash} />
        <InfoCard label="First Hearing" value={caseData.first_hearing_date} icon={Calendar} />
        <InfoCard label="Judge" value={caseData.judge} icon={Gavel} />
        <InfoCard label="Bench" value={caseData.bench} icon={Gavel} />
        {caseData.fir_number && (
          <InfoCard label="FIR No." value={`${caseData.fir_number}${caseData.fir_year ? ` / ${caseData.fir_year}` : ''}${caseData.fir_ps ? ` — ${caseData.fir_ps}` : ''}`} icon={FileText} />
        )}
      </div>

      {/* ── Parties ──────────────────────────────────────────────── */}
      {(petitionerName || respondentName) && (
        <section>
          <SectionHeading icon={User} title="Parties" />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Petitioner / Complainant
              </p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{petitionerName || '—'}</p>
              {petitionerAdv && (
                <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Adv. {petitionerAdv}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Respondent / Accused
              </p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{respondentName || '—'}</p>
              {respondentAdv && (
                <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Adv. {respondentAdv}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Act / Section ─────────────────────────────────────────── */}
      {(caseData.act || caseData.section) && (
        <section>
          <SectionHeading icon={Scale} title="Act &amp; Section" />
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-1">
            {caseData.act && (
              <p className="text-sm font-semibold text-[var(--text-primary)]">{caseData.act}</p>
            )}
            {caseData.section && (
              <p className="text-xs text-[var(--text-muted)]">Section {caseData.section}</p>
            )}
          </div>
        </section>
      )}

      {/* ── AI Billing Opportunity Finder ────────────────────────── */}
      <BillingFinder caseData={caseData} />

      {/* ── Hearing History ──────────────────────────────────────── */}
      {hearings.length > 0 && (
        <section>
          <SectionHeading icon={Calendar} title="Hearing History" count={hearings.length} />
          <div className="rounded-2xl border border-[var(--border-default)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] w-32">
                      Hearing Date
                    </th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] w-32">
                      Business Date
                    </th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Purpose / Stage
                    </th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Judge
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hearings.map((h, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--border-light,#f4f4f5)] last:border-0
                        hover:bg-[var(--bg-surface)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <HearingDateChip date={h.hearing_date} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          {h.business_on_date || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-primary)]">
                          {h.purpose || h.stage || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-secondary)]">
                          {h.judge_name || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Orders ───────────────────────────────────────────────── */}
      {orders.length > 0 && (
        <section>
          <SectionHeading icon={Gavel} title="Orders" count={orders.length} />
          <div className="rounded-2xl border border-[var(--border-default)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] w-32">
                      Date
                    </th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] w-28">
                      Type
                    </th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={i} className="border-b border-[var(--border-light,#f4f4f5)] last:border-0 hover:bg-[var(--bg-surface)] transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-[var(--text-muted)]">{o.order_date || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-[var(--accent)]">{o.order_type || 'Order'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-primary)]">{o.order_text || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Documents ────────────────────────────────────────────── */}
      <section>
        <SectionHeading icon={FileText} title="Documents" count={documents.length} />
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-8 text-center">
            <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-40" />
            <p className="text-sm text-[var(--text-muted)]">No documents uploaded yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 opacity-60">Upload orders, pleadings, or correspondence for this case</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-default)] divide-y divide-[var(--border-light,#f4f4f5)]">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 hover:bg-[var(--bg-surface)] transition-colors">
                <div className="p-2 rounded-lg bg-[var(--accent)]/10 shrink-0">
                  <FileText className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{doc.title || 'Untitled'}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {doc.doc_type && <span className="font-medium text-[var(--accent)]">{doc.doc_type}</span>}
                    {doc.doc_type && doc.doc_date && ' · '}
                    {doc.doc_date}
                  </p>
                </div>
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[var(--accent)] hover:opacity-80 font-medium shrink-0">
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Timestamps ───────────────────────────────────────────── */}
      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 pb-4">
        <Clock className="w-3 h-3" />
        Last synced from eCourts:{' '}
        {caseData.updated_at
          ? new Date(caseData.updated_at).toLocaleString('en-IN')
          : 'Not yet synced'}
        {caseData.district && (
          <span className="flex items-center gap-1 ml-3">
            <MapPin className="w-3 h-3" />
            {[caseData.district, caseData.state].filter(Boolean).join(', ')}
          </span>
        )}
      </p>
    </div>
  );
}
