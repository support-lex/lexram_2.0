'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Save,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronRight,
  Edit3,
  CheckCircle,
  AlertCircle,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_ACTS, mockLaw } from '@/lib/lexram/mock';

// -- Local admin-editor types (mirrors source shape, decoupled from backend) --
interface ActMeta {
  file: string;
  id: string;
  name: string;
  act: string;
  applicability: string;
  hasEdits: boolean;
  chapterCount: number;
}

interface AdminSection {
  id: string;
  title: string;
  section?: string;
  description: string;
  detailedAnalysis?: string;
}

interface AdminChapter {
  id: string;
  title: string;
  section?: string;
  description?: string;
  sections: AdminSection[];
}

interface AdminActDetail {
  id: string;
  name: string;
  act: string;
  applicability: string;
  introduction?: string;
  proceduralNote?: string;
  chapters: AdminChapter[];
}

// -- Mock action helper --
async function mockAction(label: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[admin] Mock action: ${label}`);
  await new Promise((r) => setTimeout(r, 150));
}

// -- Toast --
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium',
        type === 'success'
          ? 'bg-green-900 text-green-100 border border-green-700'
          : 'bg-red-900 text-red-100 border border-red-700',
      )}
    >
      {type === 'success' ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}
      {message}
    </div>
  );
}

// -- Editable text --
function EditableField({
  label,
  value,
  multiline = false,
  onSave,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onSave: (v: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="group relative mb-4">
        <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-1">{label}</p>
        <div
          className="text-sm text-charcoal-300 leading-relaxed cursor-pointer group-hover:bg-charcoal-800/40 rounded px-2 py-1 -mx-2 transition-colors"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
        >
          {value || <span className="italic text-charcoal-600">Click to edit...</span>}
          <Edit3 className="inline-block w-3 h-3 ml-2 opacity-0 group-hover:opacity-60 transition-opacity" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-1">{label}</p>
      {multiline ? (
        <textarea
          autoFocus
          className="w-full bg-charcoal-800 border border-gold-600/50 rounded-lg px-3 py-2 text-sm text-charcoal-100 resize-y focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[80px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <input
          autoFocus
          className="w-full bg-charcoal-800 border border-gold-600/50 rounded-lg px-3 py-2 text-sm text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-700 hover:bg-gold-600 text-gold-50 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="px-3 py-1.5 text-charcoal-400 hover:text-charcoal-200 text-xs rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// -- Section row --
function SectionRow({
  section,
  onSaved,
}: {
  section: AdminSection;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const save = async (field: keyof AdminSection, _value: string) => {
    try {
      await mockAction(`updateSection:${section.id}:${String(field)}`);
      setToast({ msg: `"${String(field)}" saved (mock)`, type: 'success' });
      onSaved();
    } catch {
      setToast({ msg: 'Save failed', type: 'error' });
    }
  };

  return (
    <div className="border border-charcoal-700/60 rounded-lg overflow-hidden mb-2">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-charcoal-800/50 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-charcoal-500 flex-shrink-0" />
        )}
        <span className="text-xs font-mono text-gold-600 flex-shrink-0">
          {section.section ?? '-'}
        </span>
        <span className="text-sm text-charcoal-300 truncate">{section.title}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-charcoal-700/40 pt-3 bg-charcoal-900/50">
          <EditableField label="Title" value={section.title} onSave={(v) => save('title', v)} />
          <EditableField
            label="Description"
            value={section.description}
            multiline
            onSave={(v) => save('description', v)}
          />
          <EditableField
            label="Detailed Analysis"
            value={section.detailedAnalysis ?? ''}
            multiline
            onSave={(v) => save('detailedAnalysis', v)}
          />
        </div>
      )}
    </div>
  );
}

// -- Chapter block --
function ChapterBlock({
  chapter,
  onSaved,
}: {
  chapter: AdminChapter;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const save = async (field: keyof AdminChapter, _value: string) => {
    try {
      await mockAction(`updateChapter:${chapter.id}:${String(field)}`);
      setToast({ msg: 'Chapter saved (mock)', type: 'success' });
      onSaved();
    } catch {
      setToast({ msg: 'Save failed', type: 'error' });
    }
  };

  return (
    <div className="border border-charcoal-700 rounded-xl overflow-hidden mb-3">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left bg-charcoal-800/60 hover:bg-charcoal-800 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-gold-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-charcoal-500" />
        )}
        <span className="text-xs font-mono text-gold-600/80 flex-shrink-0">
          {chapter.section ?? '-'}
        </span>
        <span className="text-sm font-medium text-charcoal-200">{chapter.title}</span>
        <span className="ml-auto text-xs text-charcoal-500">
          {chapter.sections.length} sections
        </span>
      </button>
      {open && (
        <div className="px-5 py-4 bg-charcoal-900/30">
          <EditableField
            label="Chapter Title"
            value={chapter.title}
            onSave={(v) => save('title', v)}
          />
          <EditableField
            label="Chapter Description"
            value={chapter.description ?? ''}
            multiline
            onSave={(v) => save('description', v)}
          />
          <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-3 mt-4">
            Sections
          </p>
          {chapter.sections.map((s) => (
            <SectionRow key={s.id} section={s} onSaved={onSaved} />
          ))}
        </div>
      )}
    </div>
  );
}

// -- Build admin detail from mock law --
function buildAdminDetail(actId: string): AdminActDetail {
  const law = mockLaw(actId);
  const chapters: AdminChapter[] = law.chapters.map((c) => ({
    id: c.id,
    title: c.title ?? c.name,
    section: c.section,
    description: undefined,
    sections: c.sections.map((s) => ({
      id: s.id,
      title: s.heading,
      section: s.number,
      description: s.description,
      detailedAnalysis: s.detailed_content ?? s.detailed_analysis ?? '',
    })),
  }));
  return {
    id: law.id,
    name: law.name,
    act: law.act_number ?? law.name,
    applicability: law.applicability ?? '',
    introduction: law.introduction ?? '',
    proceduralNote: law.procedural_note,
    chapters,
  };
}

export default function AdminPanelPage() {
  const allMeta = useMemo<ActMeta[]>(
    () =>
      MOCK_ACTS.map((a) => ({
        file: `${a.id}.ts`,
        id: a.id,
        name: a.name,
        act: a.act_number ?? a.name,
        applicability: a.description ?? '',
        hasEdits: false,
        chapterCount: a.chapter_count ?? 0,
      })),
    [],
  );

  const [acts, setActs] = useState<ActMeta[]>(allMeta);
  const [selected, setSelected] = useState<AdminActDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [serverOk, setServerOk] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') =>
    setToast({ msg, type });

  // Mock "backend reachable" signal (replaces SSE / fetch probe)
  useEffect(() => {
    const t = setTimeout(() => setServerOk(true), 250);
    return () => clearTimeout(t);
  }, []);

  const loadActs = useCallback(() => {
    setActs(allMeta);
  }, [allMeta]);

  const selectAct = useCallback((id: string) => {
    setLoading(true);
    setSelectedId(id);
    try {
      setSelected(buildAdminDetail(id));
    } catch {
      setSelected(null);
    }
    setLoading(false);
  }, []);

  const handleDiscard = async () => {
    if (!selectedId) return;
    await mockAction(`discardEdits:${selectedId}`);
    showToast('Edits discarded (mock)');
    selectAct(selectedId);
    loadActs();
  };

  const handleExport = async () => {
    if (!selectedId) return;
    await mockAction(`exportAct:${selectedId}`);
    showToast(`Exported to ${selectedId}.ts (mock)`);
    loadActs();
  };

  const filtered = acts.filter(
    (a) =>
      !query ||
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.act.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

          <div className="flex bg-charcoal-950/60 border border-charcoal-800 rounded-2xl overflow-hidden min-h-[calc(100vh-8rem)]">
            {/* Sidebar */}
            <div className="w-72 flex-shrink-0 border-r border-charcoal-800 flex flex-col">
              <div className="p-5 border-b border-charcoal-800">
                <h2 className="text-base font-serif font-semibold text-charcoal-50">
                  Content Editor
                </h2>
                <p className="text-[10px] text-charcoal-500 mt-0.5">
                  {serverOk ? (
                    <span className="text-green-400">● Mock backend connected</span>
                  ) : (
                    <span className="text-red-400">● Connecting...</span>
                  )}
                </p>
              </div>

              <div className="px-4 py-3 border-b border-charcoal-800/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-500" />
                  <input
                    className="w-full bg-charcoal-800 rounded-lg pl-8 pr-3 py-2 text-xs text-charcoal-200 placeholder-charcoal-600 focus:outline-none focus:ring-1 focus:ring-gold-600/50"
                    placeholder="Search acts..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {filtered.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => selectAct(act.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-charcoal-800/30 transition-colors',
                      selectedId === act.id
                        ? 'bg-charcoal-800 border-l-2 border-l-gold-500'
                        : 'hover:bg-charcoal-900/60',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-charcoal-200 truncate flex-1">
                        {act.name}
                      </span>
                      {act.hasEdits && (
                        <span
                          className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0"
                          title="Has unsaved edits"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-charcoal-500 mt-0.5">
                      {act.chapterCount} chapters
                    </p>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-center text-xs text-charcoal-600 py-8">No acts found</p>
                )}
              </div>
            </div>

            {/* Editor pane */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selected ? (
                <>
                  <div className="flex items-center justify-between px-8 py-4 border-b border-charcoal-800 bg-charcoal-900/50">
                    <div>
                      <h3 className="text-base font-serif font-semibold text-charcoal-50">
                        {selected.name}
                      </h3>
                      <p className="text-xs text-charcoal-500 mt-0.5">{selected.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDiscard}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs text-charcoal-400 hover:text-red-400 hover:bg-red-900/20 border border-charcoal-700 hover:border-red-800 rounded-lg transition-all"
                      >
                        <RotateCcw className="w-3 h-3" /> Discard Edits
                      </button>
                      <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs bg-gold-700 hover:bg-gold-600 text-gold-50 font-medium rounded-lg transition-colors"
                      >
                        <Download className="w-3 h-3" /> Export to TS
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    {loading ? (
                      <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        <div className="mb-8 p-5 bg-charcoal-900/50 rounded-xl border border-charcoal-800">
                          <p className="text-xs font-bold text-charcoal-400 uppercase tracking-widest mb-4">
                            Metadata
                          </p>
                          <EditableField
                            label="Name"
                            value={selected.name}
                            onSave={async (v) => {
                              await mockAction(`updateAct:${selected.id}:name`);
                              setSelected({ ...selected, name: v });
                              showToast('Saved (mock)');
                              loadActs();
                            }}
                          />
                          <EditableField
                            label="Act"
                            value={selected.act}
                            onSave={async (v) => {
                              await mockAction(`updateAct:${selected.id}:act`);
                              setSelected({ ...selected, act: v });
                              showToast('Saved (mock)');
                            }}
                          />
                          <EditableField
                            label="Applicability"
                            value={selected.applicability}
                            multiline
                            onSave={async (v) => {
                              await mockAction(`updateAct:${selected.id}:applicability`);
                              setSelected({ ...selected, applicability: v });
                              showToast('Saved (mock)');
                            }}
                          />
                          <EditableField
                            label="Introduction"
                            value={selected.introduction ?? ''}
                            multiline
                            onSave={async (v) => {
                              await mockAction(`updateAct:${selected.id}:introduction`);
                              setSelected({ ...selected, introduction: v });
                              showToast('Saved (mock)');
                            }}
                          />
                          {selected.proceduralNote !== undefined && (
                            <EditableField
                              label="Procedural Note"
                              value={selected.proceduralNote}
                              multiline
                              onSave={async (v) => {
                                await mockAction(`updateAct:${selected.id}:proceduralNote`);
                                setSelected({ ...selected, proceduralNote: v });
                                showToast('Saved (mock)');
                              }}
                            />
                          )}
                        </div>

                        <p className="text-xs font-bold text-charcoal-400 uppercase tracking-widest mb-4">
                          Chapters &amp; Sections ({selected.chapters.length})
                        </p>
                        {selected.chapters.map((chapter) => (
                          <ChapterBlock
                            key={chapter.id}
                            chapter={chapter}
                            onSaved={() => selectAct(selected.id)}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-charcoal-600 py-24">
                  <Edit3 className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-sm">Select an Act from the sidebar to edit</p>
                  <p className="text-xs mt-1">
                    Changes are saved as overrides - use Export to write to source
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
