'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  Gavel,
  Bell,
  Calendar,
  Pencil,
  FileStack,
  Loader2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  LexramAPI,
  unwrap,
  type ActFull,
  type ActChapter,
  type ActSection,
  type Circular,
  type SubLegislation,
  type Amendment,
  type Schedule,
} from '@/lib/lexram/api';
import { cn } from '@/lib/utils';

type Tab = 'sections' | 'rules' | 'circulars' | 'schedules' | 'amendments' | 'documents';

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

// Inline minimal Accordion
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-charcoal-200/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="font-serif text-lg md:text-xl text-charcoal-900 group-hover:text-charcoal-700 transition-colors">
          {title}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-charcoal-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div className="pb-6">{children}</div>}
    </div>
  );
}

function SectionCard({ section }: { section: ActSection }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] p-4 mb-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs bg-charcoal-100 text-charcoal-700 px-2 py-0.5 rounded">
            § {section.number}
          </span>
          <h4 className="font-semibold text-charcoal-900 text-sm">{section.heading}</h4>
        </div>
      </div>
      {section.content && (
        <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">
          {section.content}
        </p>
      )}
      {section.ai_summary && (
        <p className="text-xs text-indigo-700 mt-2 italic">{section.ai_summary}</p>
      )}
    </div>
  );
}

export default function ActDetailPage() {
  const params = useParams<{ actId: string }>();
  const router = useRouter();
  const actId = params?.actId as string;

  const [law, setLaw] = useState<ActFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const [subLegs, setSubLegs] = useState<SubLegislation[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>('sections');
  const [activeSection, setActiveSection] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const load = useCallback(async () => {
    if (!actId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await LexramAPI.act(actId);
      setLaw(data);
      // Related — best-effort, not fatal
      const [amRes, schRes] = await Promise.allSettled([
        LexramAPI.amendments({ limit: 50, act_id: actId }),
        LexramAPI.schedules({ limit: 50, act_id: actId }),
      ]);
      if (amRes.status === 'fulfilled') setAmendments(unwrap(amRes.value));
      if (schRes.status === 'fulfilled') setSchedules(unwrap(schRes.value));
      // Generic lists — best-effort
      const [subRes, cirRes] = await Promise.allSettled([
        LexramAPI.subLegislation({ limit: 6 }),
        LexramAPI.circulars({ limit: 6, ministry: data.ministry ?? undefined }),
      ]);
      if (subRes.status === 'fulfilled') setSubLegs(unwrap(subRes.value));
      if (cirRes.status === 'fulfilled') setCirculars(unwrap(cirRes.value));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load act');
    } finally {
      setLoading(false);
    }
  }, [actId]);

  useEffect(() => {
    load();
  }, [load, nonce]);

  const chapters: ActChapter[] = useMemo(() => law?.chapters ?? [], [law]);
  const flatSections: ActSection[] = useMemo(() => {
    if (!law) return [];
    const fromChapters = chapters.flatMap((c) => c.sections ?? []);
    if (fromChapters.length > 0) return fromChapters;
    return law.sections ?? [];
  }, [law, chapters]);

  async function handleAskAI(e: React.FormEvent) {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    await new Promise((r) => setTimeout(r, 600));
    setAiAnswer(
      `This act (${law?.name ?? ''}) covers the following key area: ${aiQuestion}. Based on available sections, consult §1–§3 for definitions and scope.`
    );
    setAiLoading(false);
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
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
              className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> All Acts
            </Link>
            <div className="text-center py-24">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-charcoal-200" />
              <p className="text-charcoal-600 text-sm mb-3">
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

  const tabs: { id: Tab; label: string; icon: typeof BookOpen; count?: number }[] = [
    { id: 'sections', label: 'Sections', icon: BookOpen, count: flatSections.length },
    { id: 'rules', label: 'Rules & Regs', icon: Gavel, count: subLegs.length },
    { id: 'circulars', label: 'Circulars', icon: Bell, count: circulars.length },
    { id: 'schedules', label: 'Schedules', icon: Calendar, count: schedules.length },
    { id: 'amendments', label: 'Amendments', icon: Pencil, count: amendments.length },
    { id: 'documents', label: 'Documents', icon: FileStack, count: 0 },
  ];

  const statusLabel = law.status || 'In force';

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
              className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> All Acts
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-6">
              {/* LEFT RAIL */}
              <aside className="lg:sticky lg:top-0 self-start bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
                <div className="mb-4 pb-4 border-b border-charcoal-100">
                  <p className="font-semibold text-charcoal-800 text-sm leading-snug mb-1">
                    {law.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-charcoal-400">{law.year ?? '—'}</span>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5 mb-4">
                  {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors',
                          activeTab === t.id
                            ? 'bg-gold-50 text-gold-700 font-medium border-l-2 border-gold-500'
                            : 'text-charcoal-600 hover:bg-charcoal-50'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="flex-1 text-left">{t.label}</span>
                        {t.count !== undefined && t.count > 0 && (
                          <span className="text-[11px] font-mono text-charcoal-400">{t.count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {activeTab === 'sections' && chapters.length > 0 && (
                  <div className="border-t border-charcoal-100 pt-3 space-y-2">
                    {chapters.map((ch) => (
                      <div key={ch.id}>
                        <button
                          onClick={() => {
                            setActiveSection(`chapter-${ch.id}`);
                            document
                              .getElementById(`chapter-${ch.id}`)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="text-xs font-semibold text-charcoal-800 text-left w-full hover:text-gold-700"
                        >
                          {ch.title || ch.name}
                        </button>
                        <div className="mt-1 space-y-0.5 pl-2">
                          {(ch.sections ?? []).map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setActiveSection(`section-${s.id}`);
                                document
                                  .getElementById(`section-${s.id}`)
                                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              className="block text-[11px] text-charcoal-500 hover:text-charcoal-800 text-left"
                            >
                              §{s.number} {s.heading}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeSection && <span className="hidden" />}
              </aside>

              {/* CENTER CONTENT */}
              <section>
                {/* Masthead */}
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-6 mb-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h1 className="font-serif text-2xl font-semibold text-[var(--text-primary)] leading-tight mb-1">
                        {law.name}
                      </h1>
                      {law.short_name && law.short_name !== law.name && (
                        <p className="text-sm text-charcoal-500">{law.short_name}</p>
                      )}
                      <p className="font-mono text-sm text-charcoal-500 mt-1">
                        Act No. {law.act_number || '\u2014'} of {law.year ?? '—'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded">
                      {statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-0.5">
                        Ministry
                      </p>
                      <span className="text-sm text-charcoal-700">{law.ministry || '\u2014'}</span>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-0.5">
                        Domain
                      </p>
                      <span className="text-sm text-charcoal-700">{law.domain || '\u2014'}</span>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-0.5">
                        Applicability
                      </p>
                      <span className="text-sm text-charcoal-700 line-clamp-2">
                        {law.applicability || 'Whole of India'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[var(--border-default)] rounded-lg text-charcoal-600 hover:border-gold-400 hover:text-gold-700 transition-colors"
                      type="button"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/cross-refs')}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[var(--border-default)] rounded-lg text-charcoal-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Cross-References
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/amendment-chain')}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[var(--border-default)] rounded-lg text-charcoal-600 hover:border-rose-400 hover:text-rose-600 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Version Tracker
                    </button>
                  </div>
                </div>

                {/* Tab content */}
                {activeTab === 'sections' && (
                  <div>
                    {law.preamble && (
                      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5 mb-4">
                        <p className="text-[11px] font-mono uppercase tracking-wide text-charcoal-400 mb-2">
                          Preamble
                        </p>
                        <p className="text-[15px] leading-relaxed text-charcoal-600 italic">
                          {law.preamble}
                        </p>
                      </div>
                    )}
                    {law.introduction && (
                      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5 mb-4">
                        <p className="text-[11px] font-mono uppercase tracking-wide text-charcoal-400 mb-2">
                          Introduction
                        </p>
                        <p className="text-[15px] leading-relaxed text-charcoal-700">
                          {law.introduction}
                        </p>
                      </div>
                    )}

                    {chapters.length > 0 ? (
                      chapters.map((ch) => (
                        <div key={ch.id} id={`chapter-${ch.id}`} className="mb-6">
                          <h2 className="text-base font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                            {ch.order !== undefined && (
                              <span className="font-mono text-xs bg-charcoal-100 text-charcoal-500 px-2 py-0.5 rounded">
                                Ch. {ch.order}
                              </span>
                            )}
                            {ch.title || ch.name}
                          </h2>
                          <div className="border-t border-charcoal-200/60">
                            {(ch.sections ?? []).map((s) => (
                              <div key={s.id} id={`section-${s.id}`}>
                                <Accordion title={`§${s.number}  ${s.heading}`}>
                                  <SectionCard section={s} />
                                </Accordion>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : flatSections.length > 0 ? (
                      <div className="border-t border-charcoal-200/60">
                        {flatSections.map((s) => (
                          <div key={s.id} id={`section-${s.id}`}>
                            <Accordion title={`§${s.number}  ${s.heading}`}>
                              <SectionCard section={s} />
                            </Accordion>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-charcoal-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 text-charcoal-200" />
                        <p>Sections not yet extracted for this act.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'rules' && (
                  <div>
                    {subLegs.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {subLegs.map((sl) => (
                          <Link
                            key={sl.id}
                            href={`/dashboard/sub-legislation/${sl.id}`}
                            className="block bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4 hover:border-gold-400 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 uppercase">
                                {sl.doc_type}
                              </span>
                              <span className="text-[11px] font-mono text-charcoal-400">
                                {formatDate(sl.effective_date ?? sl.enactment_date)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-charcoal-900 line-clamp-2 mb-1">
                              {sl.name}
                            </p>
                            <p className="text-xs text-charcoal-500">{sl.ministry}</p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-charcoal-400">
                        <Gavel className="w-10 h-10 mx-auto mb-3 text-charcoal-200" />
                        <p>No subordinate legislation found.</p>
                      </div>
                    )}
                    <button
                      onClick={() => router.push('/dashboard/sub-legislation')}
                      className="mt-4 flex items-center gap-1.5 text-sm text-gold-600 hover:text-gold-700"
                    >
                      View all rules & regulations <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {activeTab === 'circulars' && (
                  <div>
                    {circulars.length > 0 ? (
                      <div className="space-y-3">
                        {circulars.map((c) => (
                          <Link
                            key={c.id}
                            href={`/dashboard/circulars/${c.id}`}
                            className="block bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4 hover:border-gold-400 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono text-sky-700">
                                {c.circular_number}
                              </span>
                              <span className="text-[11px] font-mono text-charcoal-400">
                                {formatDate(c.issue_date)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-charcoal-900 mb-0.5">
                              {c.subject}
                            </p>
                            <p className="text-xs text-charcoal-500">{c.ministry}</p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-charcoal-400">
                        <Bell className="w-10 h-10 mx-auto mb-3 text-charcoal-200" />
                        <p>No circulars found for this act.</p>
                      </div>
                    )}
                    <button
                      onClick={() => router.push('/dashboard/circulars')}
                      className="mt-4 flex items-center gap-1.5 text-sm text-gold-600 hover:text-gold-700"
                    >
                      View all circulars <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {activeTab === 'amendments' && (
                  <div>
                    {amendments.length > 0 ? (
                      <div className="space-y-4">
                        {amendments.map((a) => (
                          <div
                            key={a.id}
                            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                {a.amendment_type ?? 'Amendment'}
                              </span>
                              <span className="text-[11px] font-mono text-charcoal-400">
                                {formatDate(a.amendment_date ?? a.effective_date)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-charcoal-900 mb-1">
                              {a.amendment_act_name ?? a.description ?? 'Amendment'}
                            </p>
                            {a.description && (
                              <p className="text-xs text-charcoal-500">{a.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-charcoal-400">
                        <Pencil className="w-10 h-10 mx-auto mb-3 text-charcoal-200" />
                        <p>No amendments found for this act.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'schedules' && (
                  <div>
                    {schedules.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {schedules.map((s) => (
                          <div
                            key={s.id}
                            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] border-t-[3px] border-t-teal-400 p-4"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                                Schedule
                              </span>
                              <span className="text-xs font-mono text-charcoal-400">
                                {s.schedule_number}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-charcoal-900">{s.title}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-charcoal-400">
                        <Calendar className="w-10 h-10 mx-auto mb-3 text-charcoal-200" />
                        <p>No schedules linked.</p>
                      </div>
                    )}
                    <button
                      onClick={() => router.push('/dashboard/schedules')}
                      className="mt-4 text-sm text-gold-600 hover:text-gold-700"
                    >
                      View in Schedules browser →
                    </button>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="text-center py-16 text-charcoal-400">
                    <FileStack className="w-10 h-10 mx-auto mb-3 text-charcoal-200" />
                    <p>No documents found for this act.</p>
                  </div>
                )}
              </section>

              {/* RIGHT RAIL */}
              <aside className="lg:sticky lg:top-0 self-start bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-charcoal-800">AI Companion</span>
                  </div>
                  <form onSubmit={handleAskAI} className="space-y-2">
                    <textarea
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="What does this act cover?"
                      rows={2}
                      className="w-full text-sm border border-[var(--border-default)] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-indigo-400 text-charcoal-700 bg-[var(--bg-surface)]"
                    />
                    <button
                      type="submit"
                      disabled={aiLoading || !aiQuestion.trim()}
                      className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors"
                    >
                      {aiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Ask AI
                    </button>
                  </form>
                  {aiAnswer && (
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-charcoal-700">
                      {aiAnswer}
                    </div>
                  )}
                </div>

                <hr className="border-charcoal-100" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                      Sub-Legislation
                    </p>
                    <span className="text-[11px] font-mono text-violet-600">{subLegs.length}</span>
                  </div>
                  {subLegs.slice(0, 3).map((sl) => (
                    <div key={sl.id} className="py-1.5 border-b border-charcoal-50 last:border-0">
                      <p className="text-xs text-charcoal-700 line-clamp-2">{sl.name}</p>
                      <p className="text-[11px] font-mono text-charcoal-400">
                        {sl.doc_type} · {formatDate(sl.effective_date ?? sl.enactment_date)}
                      </p>
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveTab('rules')}
                    className="mt-1 text-xs text-gold-600 hover:text-gold-700"
                  >
                    View all {subLegs.length} →
                  </button>
                </div>

                <hr className="border-charcoal-100" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                      Recent Circulars
                    </p>
                    <span className="text-[11px] font-mono text-sky-600">{circulars.length}</span>
                  </div>
                  {circulars.slice(0, 3).map((c) => (
                    <div key={c.id} className="py-1.5 border-b border-charcoal-50 last:border-0">
                      <p className="text-xs text-charcoal-700 line-clamp-1">{c.subject}</p>
                      <p className="text-[11px] font-mono text-charcoal-400">
                        {formatDate(c.issue_date)}
                      </p>
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveTab('circulars')}
                    className="mt-1 text-xs text-gold-600 hover:text-gold-700"
                  >
                    View all {circulars.length} →
                  </button>
                </div>

                <button
                  onClick={() => router.push('/dashboard/cross-refs')}
                  className="w-full text-left p-3 bg-charcoal-50 hover:bg-charcoal-100 rounded-lg border border-[var(--border-default)] transition-colors"
                >
                  <p className="text-xs font-semibold text-charcoal-700">Legislative Ecosystem</p>
                  <p className="text-[11px] text-charcoal-400 mt-0.5">
                    Visualize all connected legislation →
                  </p>
                </button>
              </aside>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
