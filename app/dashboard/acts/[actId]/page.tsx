'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  Gavel,
  Calendar,
  Loader2,
  ChevronDown,
  Tag,
  Globe2,
  Building2,
  Hash,
  Languages,
  ScrollText,
  CalendarClock,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Layers,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ActsAPI,
  unwrapList,
  instrumentTitle,
  instrumentKind,
  type ActDetail,
  type ChapterDetail,
  type SectionDetail,
  type Instrument,
} from '@/lib/lexram/acts-fastapi';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'sections' | 'chapters' | 'instruments' | 'metadata';

function formatDate(d?: string | null) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d ?? '';
  }
}

function chapterTitle(c: ChapterDetail) {
  return (
    c.title ??
    c.chapter_title ??
    c.name ??
    (c.chapter_number ? `Chapter ${c.chapter_number}` : 'Chapter')
  );
}

function chapterNumber(c: ChapterDetail) {
  return c.chapter_number ?? (c.chapter_order ?? c.order ?? '');
}

function sectionNumber(s: SectionDetail) {
  return s.section_number ?? '';
}

function sectionHeading(s: SectionDetail) {
  return s.heading ?? s.description ?? `Section ${sectionNumber(s)}`;
}

function Accordion({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--border-light)] last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3.5 text-left group gap-3"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
            {title}
          </span>
          {badge}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function SectionCard({ section }: { section: SectionDetail }) {
  return (
    <div className="bg-[var(--bg-primary)]/50 rounded-lg border border-[var(--border-light)] p-4">
      {section.content || section.description ? (
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
          {section.content ?? section.description}
        </p>
      ) : (
        <p className="text-xs text-[var(--text-muted)] italic">
          Section text not yet extracted.
        </p>
      )}
      {section.enforcement_status && (
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              section.enforcement_status.toLowerCase().includes('repeal')
                ? 'bg-rose-400'
                : 'bg-emerald-500'
            }`}
          />
          {section.enforcement_status.replace(/_/g, ' ')}
        </div>
      )}
    </div>
  );
}

export default function ActDetailPage() {
  const params = useParams<{ actId: string }>();
  const actId = params?.actId
    ? decodeURIComponent(params.actId as string)
    : '';

  const [law, setLaw] = useState<ActDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [instrumentsLoading, setInstrumentsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const load = useCallback(async () => {
    if (!actId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ActsAPI.act(actId);
      setLaw(data);

      // Instruments — best-effort, separate request.
      setInstrumentsLoading(true);
      ActsAPI.instruments(actId)
        .then((res) => setInstruments(unwrapList<Instrument>(res)))
        .catch(() => setInstruments([]))
        .finally(() => setInstrumentsLoading(false));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load act');
    } finally {
      setLoading(false);
    }
  }, [actId]);

  useEffect(() => {
    load();
  }, [load, nonce]);

  const chapters: ChapterDetail[] = useMemo(() => law?.chapters ?? [], [law]);
  const flatSections: SectionDetail[] = useMemo(
    () => chapters.flatMap((c) => c.sections ?? []),
    [chapters]
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !law) {
    return (
      <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <Link
              href="/dashboard/acts"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> All Acts
            </Link>
            <div className="text-center py-24">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)] text-sm mb-3">
                {error ? `Failed to load: ${error}` : 'Act not found.'}
              </p>
              {error && (
                <button
                  onClick={() => setNonce((n) => n + 1)}
                  className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                >
                  Retry
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  const totalSections =
    law.total_sections ??
    flatSections.length ??
    0;
  const totalChapters = law.total_chapters ?? chapters.length;

  const tabs: { id: Tab; label: string; icon: typeof BookOpen; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'chapters', label: 'Chapters', icon: Layers, count: totalChapters },
    { id: 'sections', label: 'Sections', icon: ScrollText, count: totalSections },
    { id: 'instruments', label: 'Rules & Circulars', icon: Gavel, count: instruments.length },
    { id: 'metadata', label: 'Metadata', icon: Hash },
  ];

  const isRepealed =
    law.is_repealed === true ||
    law.enforcement_status?.toLowerCase().includes('repeal') === true ||
    law.status?.toLowerCase().includes('repeal') === true;

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Back */}
            <Link
              href="/dashboard/acts"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> All Acts
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
              {/* LEFT NAV RAIL */}
              <aside className="lg:sticky lg:top-0 self-start bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
                <div className="mb-4 pb-4 border-b border-[var(--border-light)]">
                  <p className="font-semibold text-[var(--text-primary)] text-sm leading-snug mb-2 line-clamp-3">
                    {law.name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {law.year ?? '—'}
                    </span>
                    {law.act_number && (
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
                        · Act {law.act_number}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <StatusPill
                      repealed={isRepealed}
                      label={
                        law.enforcement_status ??
                        law.status ??
                        (isRepealed ? 'Repealed' : 'In force')
                      }
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors',
                          activeTab === t.id
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium border-l-2 border-[var(--accent)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="flex-1 text-left">{t.label}</span>
                        {t.count !== undefined && t.count > 0 && (
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            {t.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick links */}
                <div className="mt-4 pt-4 border-t border-[var(--border-light)] space-y-1.5">
                  {law.pdf_url && (
                    <a
                      href={law.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="truncate">
                        PDF
                        {law.pdf_page_count ? ` · ${law.pdf_page_count} pages` : ''}
                      </span>
                    </a>
                  )}
                  {law.indiacode_url && (
                    <a
                      href={law.indiacode_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="truncate">IndiaCode source</span>
                    </a>
                  )}
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <section>
                {/* Masthead */}
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-6 mb-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <h1 className="font-serif text-2xl font-semibold text-[var(--text-primary)] leading-tight mb-1">
                        {law.full_name ?? law.name}
                      </h1>
                      {law.short_name && law.short_name !== law.name && (
                        <p className="text-sm text-[var(--text-muted)]">{law.short_name}</p>
                      )}
                      {law.hindi_title && (
                        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                          <Languages className="w-3 h-3" /> {law.hindi_title}
                        </p>
                      )}
                      <p className="font-mono text-[12px] text-[var(--text-muted)] mt-1.5">
                        Act No. {law.act_number ?? '—'} of {law.year ?? '—'}
                      </p>
                    </div>
                    <StatusPill
                      repealed={isRepealed}
                      label={
                        law.enforcement_status ??
                        law.status ??
                        (isRepealed ? 'Repealed' : 'In force')
                      }
                    />
                  </div>

                  {/* Quick meta grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <MetaCard
                      icon={Globe2}
                      label="Domain"
                      value={law.domain}
                    />
                    <MetaCard
                      icon={Building2}
                      label="Ministry"
                      value={law.ministry}
                    />
                    <MetaCard
                      icon={Tag}
                      label="Category"
                      value={law.category}
                    />
                    <MetaCard
                      icon={CalendarClock}
                      label="Commenced"
                      value={formatDate(law.commencement_date)}
                    />
                  </div>

                  {/* Tag chips */}
                  {((law.keywords && law.keywords.length) ||
                    (law.tags && law.tags.length)) && (
                    <div className="flex flex-wrap gap-1.5">
                      {(law.keywords ?? []).slice(0, 8).map((k) => (
                        <span
                          key={`kw-${k}`}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/8 text-[var(--accent)] border border-[var(--accent)]/15"
                        >
                          {k}
                        </span>
                      ))}
                      {(law.tags ?? []).slice(0, 6).map((t) => (
                        <span
                          key={`tag-${t}`}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-default)]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* TAB CONTENT */}
                {activeTab === 'overview' && (
                  <OverviewTab law={law} totalSections={totalSections} totalChapters={totalChapters} />
                )}

                {activeTab === 'chapters' && (
                  <ChaptersTab chapters={chapters} />
                )}

                {activeTab === 'sections' && (
                  <SectionsTab chapters={chapters} flatSections={flatSections} />
                )}

                {activeTab === 'instruments' && (
                  <InstrumentsTab
                    instruments={instruments}
                    loading={instrumentsLoading}
                  />
                )}

                {activeTab === 'metadata' && <MetadataTab law={law} />}
              </section>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

/* ─── Tab views ───────────────────────────────────────────────────── */

function OverviewTab({
  law,
  totalChapters,
  totalSections,
}: {
  law: ActDetail;
  totalChapters: number;
  totalSections: number;
}) {
  const summaryBlocks: { label: string; value?: string | null }[] = [
    { label: 'Long title', value: law.long_title },
    { label: 'Preamble', value: law.preamble },
    { label: 'Statement of objects & reasons', value: law.statement_of_objects },
    { label: 'Objectives', value: law.objectives },
    { label: 'Introduction', value: law.introduction },
    { label: 'Abstract', value: law.abstract },
    { label: 'Applicability', value: law.applicability },
    { label: 'Territorial extent', value: law.territorial_extent },
    { label: 'Description', value: law.description },
  ].filter((b) => b.value && b.value.trim().length > 0);

  return (
    <div className="space-y-4">
      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <CountCard
          label="Chapters"
          value={totalChapters}
          icon={Layers}
          tone="indigo"
        />
        <CountCard
          label="Sections"
          value={totalSections}
          icon={ScrollText}
          tone="emerald"
        />
        <CountCard
          label="PDF pages"
          value={law.pdf_page_count ?? 0}
          icon={FileText}
          tone="amber"
        />
      </div>

      {summaryBlocks.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5 text-center text-[var(--text-muted)] text-sm">
          <Sparkles className="w-5 h-5 mx-auto mb-2 opacity-60" />
          No narrative summary yet for this act.
        </div>
      ) : (
        summaryBlocks.map((b) => (
          <div
            key={b.label}
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-2">
              {b.label}
            </p>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
              {b.value}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

function ChaptersTab({ chapters }: { chapters: ChapterDetail[] }) {
  if (chapters.length === 0) {
    return (
      <Empty
        icon={Layers}
        message="No chapter breakdown is available for this act yet."
      />
    );
  }
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] divide-y divide-[var(--border-light)]">
      {chapters.map((c, idx) => (
        <Link
          key={String(c.id ?? idx)}
          href={`#chapter-${c.id ?? idx}`}
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--surface-hover)] transition-colors group"
        >
          <span className="font-mono text-xs bg-[var(--bg-primary)] text-[var(--text-secondary)] px-2 py-0.5 rounded border border-[var(--border-default)]">
            Ch. {chapterNumber(c) || idx + 1}
          </span>
          <span className="flex-1 text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate">
            {chapterTitle(c)}
          </span>
          {(c.section_count ?? c.sections?.length) !== undefined && (
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              {c.section_count ?? c.sections?.length} §
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

function SectionsTab({
  chapters,
  flatSections,
}: {
  chapters: ChapterDetail[];
  flatSections: SectionDetail[];
}) {
  if (chapters.length > 0) {
    return (
      <div className="space-y-6">
        {chapters.map((ch, ci) => (
          <div
            key={`ch-${ch.id ?? ci}`}
            id={`chapter-${ch.id ?? ci}`}
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5"
          >
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <span className="font-mono text-xs bg-[var(--bg-primary)] text-[var(--text-secondary)] px-2 py-0.5 rounded border border-[var(--border-default)]">
                Ch. {chapterNumber(ch) || ci + 1}
              </span>
              {chapterTitle(ch)}
            </h2>
            <div>
              {(ch.sections ?? []).length === 0 ? (
                <p className="text-[12px] text-[var(--text-muted)] italic py-2">
                  No sections extracted for this chapter.
                </p>
              ) : (
                (ch.sections ?? []).map((s, si) => (
                  <Accordion
                    key={`s-${s.id ?? si}`}
                    title={
                      <>
                        <span className="font-mono text-[12px] text-[var(--accent)] mr-2">
                          §{sectionNumber(s) || si + 1}
                        </span>
                        <span className="text-[14px]">{sectionHeading(s)}</span>
                      </>
                    }
                  >
                    <SectionCard section={s} />
                  </Accordion>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (flatSections.length === 0) {
    return (
      <Empty
        icon={ScrollText}
        message="Sections have not yet been extracted for this act."
      />
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5">
      {flatSections.map((s, si) => (
        <Accordion
          key={`s-${s.id ?? si}`}
          title={
            <>
              <span className="font-mono text-[12px] text-[var(--accent)] mr-2">
                §{sectionNumber(s) || si + 1}
              </span>
              <span className="text-[14px]">{sectionHeading(s)}</span>
            </>
          }
        >
          <SectionCard section={s} />
        </Accordion>
      ))}
    </div>
  );
}

function InstrumentsTab({
  instruments,
  loading,
}: {
  instruments: Instrument[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }
  if (instruments.length === 0) {
    return (
      <Empty
        icon={Gavel}
        message="No rules, circulars or notifications are linked to this act yet."
      />
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {instruments.map((inst, i) => {
        const kind = instrumentKind(inst);
        const title = instrumentTitle(inst);
        const date =
          (inst.issue_date as string) ??
          (inst.effective_date as string) ??
          (inst.enactment_date as string) ??
          (inst.gazette_date as string);
        const href =
          (inst.pdf_url as string) ?? (inst.url as string) ?? null;
        const body = (
          <>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 uppercase">
                {kind}
              </span>
              {inst.number && (
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  {inst.number as string}
                </span>
              )}
              {date && (
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  · {formatDate(date)}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-1">
              {title}
            </p>
            {inst.ministry && (
              <p className="text-xs text-[var(--text-muted)] truncate">
                {inst.ministry as string}
              </p>
            )}
          </>
        );
        return href ? (
          <a
            key={String(inst.id ?? i)}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="block bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4 hover:border-[var(--accent)]/40 hover:shadow-sm transition-all"
          >
            {body}
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--accent)]">
              <ExternalLink className="w-3 h-3" /> Open
            </span>
          </a>
        ) : (
          <div
            key={String(inst.id ?? i)}
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4"
          >
            {body}
          </div>
        );
      })}
    </div>
  );
}

function MetadataTab({ law }: { law: ActDetail }) {
  const rows: { label: string; value?: string | number | null }[] = [
    { label: 'ID', value: law.id },
    { label: 'Full name', value: law.full_name },
    { label: 'Short name', value: law.short_name },
    { label: 'Hindi title', value: law.hindi_title },
    { label: 'Act number', value: law.act_number },
    { label: 'Act type', value: law.act_type },
    { label: 'Year', value: law.year },
    { label: 'Domain', value: law.domain },
    { label: 'Ministry', value: law.ministry },
    { label: 'Department', value: law.department },
    { label: 'Category', value: law.category },
    { label: 'Jurisdiction', value: law.jurisdiction },
    { label: 'Jurisdiction kind', value: law.jurisdiction_kind },
    { label: 'State code', value: law.state_code },
    { label: 'Enforcement status', value: law.enforcement_status },
    { label: 'Repealed', value: law.is_repealed === true ? 'Yes' : law.is_repealed === false ? 'No' : null },
    { label: 'Repealed by', value: law.repealed_by },
    { label: 'Commencement date', value: formatDate(law.commencement_date) },
    { label: 'Enactment date', value: formatDate(law.enactment_date) },
    { label: 'Gazette date', value: formatDate(law.gazette_date) },
    { label: 'Gazette number', value: law.gazette_number },
    { label: 'Notification number', value: law.notification_number },
    { label: 'PDF pages', value: law.pdf_page_count },
    { label: 'Sync status', value: law.sync_status },
    { label: 'Last synced', value: formatDate(law.last_synced_at) },
  ].filter((r) => r.value !== null && r.value !== undefined && r.value !== '');

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.label}
              className={
                i % 2 === 0 ? 'bg-[var(--bg-primary)]/40' : ''
              }
            >
              <td className="px-5 py-2.5 text-[12px] font-medium uppercase tracking-wide text-[var(--text-muted)] w-1/3">
                {r.label}
              </td>
              <td className="px-5 py-2.5 text-[var(--text-primary)] break-words">
                {r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Shared bits ──────────────────────────────────────────────────── */

function Empty({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className="text-center py-16 text-[var(--text-muted)]">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)]/40 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
        {value || '—'}
      </p>
    </div>
  );
}

const TONE_BG: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
};

function CountCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: keyof typeof TONE_BG;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 flex items-center gap-3">
      <span
        className={`grid place-items-center w-9 h-9 rounded-lg border ${TONE_BG[tone]}`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </p>
        <p className="text-lg font-semibold text-[var(--text-primary)] font-mono leading-tight">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function StatusPill({
  repealed,
  label,
}: {
  repealed: boolean;
  label: string;
}) {
  const Icon = repealed ? ShieldAlert : ShieldCheck;
  const cls = repealed
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border ${cls}`}
    >
      <Icon className="w-3 h-3" />
      <span className="capitalize">{label.replace(/_/g, ' ')}</span>
    </span>
  );
}

