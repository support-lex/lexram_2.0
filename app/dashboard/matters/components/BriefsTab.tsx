"use client";

import { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Search, Filter, MoreVertical,
  Calendar, Clock, CheckCircle2, AlertCircle,
  ChevronRight, GripVertical, FileSignature, BookOpen,
  AlignLeft, Save, Download, Printer, Sparkles,
  ChevronDown, ChevronUp, ArrowLeft, Import, X, Upload,
  Trash2, File, FileJson, FileCode
} from 'lucide-react';
import { getStoredData, setStoredData, STORAGE_KEYS } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { useMatterContext } from '@/lib/matter-context';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

interface BriefSection {
  id: string;
  title: string;
  content: string;
}

interface BriefDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  date: string;
  mimeType: string;
  data?: string;
}

interface Brief {
  id: string;
  title: string;
  matter: string;
  lastEdited: string;
  status: string;
  words: number;
  sections: BriefSection[];
  documents: BriefDocument[];
  linkedResearch: string[];
}

const DEFAULT_SECTIONS: BriefSection[] = [
  { id: 'cover', title: 'Cover Page', content: 'Enter the case title, court name, case number, and parties.' },
  { id: 'index', title: 'Index', content: 'This section will auto-populate based on your brief sections.' },
  { id: 'synopsis', title: 'Synopsis', content: 'Write a brief summary of the case and the relief sought.' },
  { id: 'dates', title: 'List of Dates', content: 'Chronologically list key events relevant to the case.' },
  { id: 'facts', title: 'Statement of Facts', content: 'Present the factual background of the case.' },
  { id: 'questions', title: 'Questions of Law', content: 'Frame the legal questions that arise from the facts.' },
  { id: 'arguments', title: 'Arguments', content: 'Present your legal arguments with supporting authorities.' },
  { id: 'prayer', title: 'Prayer', content: 'State the specific relief you are requesting from the court.' },
  { id: 'cases', title: 'List of Cases Relied Upon', content: 'List all case authorities cited in your arguments.' },
];

interface BriefsTabProps {
  matterId: string;
}

export function BriefsTab({ matterId }: BriefsTabProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const { matters: allMatters } = useMatterContext();
  const [activeBrief, setActiveBrief] = useState<Brief | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    cover: true,
    synopsis: true,
    arguments: true
  });
  const [expandedDocuments, setExpandedDocuments] = useState(false);

  // Modals
  const [showNewBriefModal, setShowNewBriefModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [researchSessions, setResearchSessions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // New Brief Form
  const [newTitle, setNewTitle] = useState('');

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const stored = getStoredData<Brief[]>(STORAGE_KEYS.BRIEFS, []);

    // Migration: Move documents from old storage to briefs
    const oldDocuments = getStoredData<any[]>(STORAGE_KEYS.DOCUMENTS, []);
    let migratedBriefs = stored.length > 0 ? stored : [];

    if (oldDocuments.length > 0 && stored.length === 0) {
      // One-time migration during initialization
      migratedBriefs = stored.map(brief => {
        if (!brief.documents) {
          const matchingDocs = oldDocuments.filter((doc: any) => doc.matter === brief.matter);
          return {
            ...brief,
            documents: matchingDocs,
            linkedResearch: brief.linkedResearch || []
          };
        }
        return brief;
      });
    }

    if (migratedBriefs.length === 0) {
      // Seed data
      const seed: Brief[] = [
        {
          id: 'BRF-001',
          title: 'Written Submissions - Ramesh Kumar',
          matter: 'MAT-2026-001',
          lastEdited: new Date().toISOString(),
          status: 'Draft',
          words: 4500,
          sections: DEFAULT_SECTIONS,
          documents: [],
          linkedResearch: []
        },
      ];
      setBriefs(seed);
      setStoredData(STORAGE_KEYS.BRIEFS, seed);
    } else {
      // Ensure all briefs have documents and linkedResearch fields
      const normalizedBriefs = migratedBriefs.map(b => ({
        ...b,
        documents: b.documents || [],
        linkedResearch: b.linkedResearch || []
      }));
      setBriefs(normalizedBriefs);
      setStoredData(STORAGE_KEYS.BRIEFS, normalizedBriefs);
    }

    setResearchSessions(getStoredData<any[]>(STORAGE_KEYS.RESEARCH_SESSIONS, []));
  }, []);

  const saveBriefs = (newBriefs: Brief[]) => {
    setBriefs(newBriefs);
    setStoredData(STORAGE_KEYS.BRIEFS, newBriefs);
  };

  const handleCreateBrief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newBrief: Brief = {
      id: `BRF-${Date.now()}`,
      title: newTitle,
      matter: matterId,
      lastEdited: new Date().toISOString(),
      status: 'Draft',
      words: 0,
      sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)),
      documents: [],
      linkedResearch: []
    };

    saveBriefs([newBrief, ...briefs]);
    setShowNewBriefModal(false);
    setNewTitle('');
    openBrief(newBrief);
  };

  const openBrief = (brief: Brief) => {
    setActiveBrief(brief);
    setIsEditing(true);
    const newWordCount = calculateWordCount(brief.sections);
    setWordCount(newWordCount);
  };

  const closeBrief = () => {
    if (activeBrief) {
      // Save current state
      const updatedBriefs = briefs.map(b => b.id === activeBrief.id ? { ...activeBrief, lastEdited: new Date().toISOString() } : b);
      saveBriefs(updatedBriefs);
    }
    setIsEditing(false);
    setActiveBrief(null);
  };

  const calculateWordCount = (sections: BriefSection[]) => {
    const totalContent = sections.map(s => s.content).join(' ');
    const words = totalContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    return words;
  };

  const updateSectionContent = (sectionId: string, content: string) => {
    if (!activeBrief) return;
    const updatedSections = activeBrief.sections.map(s => s.id === sectionId ? { ...s, content } : s);
    const updatedBrief = { ...activeBrief, sections: updatedSections };
    setActiveBrief(updatedBrief);

    // Calculate new word count
    const newWordCount = calculateWordCount(updatedSections);
    setWordCount(newWordCount);

    // Trigger auto-save with debounce
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaveStatus('saving');
    autoSaveTimeoutRef.current = setTimeout(() => {
      const updatedBriefs = briefs.map(b => b.id === activeBrief.id ? { ...updatedBrief, lastEdited: new Date().toISOString() } : b);
      saveBriefs(updatedBriefs);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 2000);
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleImportResearch = (session: any) => {
    if (!activeBrief) return;

    // Find the first expanded section to insert into
    const targetSectionId = Object.keys(expandedSections).find(k => expandedSections[k]) || 'arguments';

    // Format research content
    const lastMessage = session.messages[session.messages.length - 1];
    if (!lastMessage || !lastMessage.result) return;

    const result = lastMessage.result;
    let importText = `\n\n[Imported from Research: ${session.title}]\n\n`;
    importText += `POSITION OF LAW:\n${result.positionOfLaw}\n\n`;
    importText += `KEY AUTHORITIES:\n`;
    result.precedents.forEach((p: any) => {
      importText += `- ${p.caseName} (${p.citation}): ${p.summary}\n`;
    });

    const updatedSections = activeBrief.sections.map(s => {
      if (s.id === targetSectionId) {
        return { ...s, content: s.content + importText };
      }
      return s;
    });

    const updatedLinkedResearch = Array.from(new Set([...activeBrief.linkedResearch, session.id]));

    setActiveBrief({
      ...activeBrief,
      sections: updatedSections,
      linkedResearch: updatedLinkedResearch
    });
    setShowImportModal(false);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('json')) return <FileJson className="w-4 h-4" />;
    if (mimeType.includes('text') || mimeType.includes('plain')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeBrief || !e.target.files) return;

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target?.result as string;
      const newDocument: BriefDocument = {
        id: `DOC-${Date.now()}`,
        name: file.name,
        type: 'Evidence',
        size: file.size,
        date: new Date().toISOString(),
        mimeType: file.type,
        data: fileData
      };

      const updatedDocuments = [...activeBrief.documents, newDocument];
      setActiveBrief({ ...activeBrief, documents: updatedDocuments });
    };

    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (!activeBrief) return;
    const updatedDocuments = activeBrief.documents.filter(d => d.id !== docId);
    setActiveBrief({ ...activeBrief, documents: updatedDocuments });
  };

  const handleDownloadDocument = (doc: BriefDocument) => {
    if (!doc.data) return;
    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.name;
    link.click();
  };

  const handleExportDocx = () => {
    if (!activeBrief) return;

    // TODO: Use a proper DOCX library like docx or docxtemplater for production
    let fullContent = `${activeBrief.title}\n\n`;
    activeBrief.sections.forEach(s => {
      fullContent += `${s.title}\n${s.content}\n\n`;
    });

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBrief.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statuses = ['Draft', 'Review', 'Final', 'Filed'];

  if (isEditing && activeBrief) {
    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden relative">
        {/* Editor Header */}
        <div className="px-6 py-4 border-b border-[var(--border-default)]/50 bg-[var(--surface-glass)] backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between shrink-0 shadow-[var(--shadow-card)] z-10 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={closeBrief}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 text-sm font-bold bg-[var(--surface-hover)] px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-px h-6 bg-[var(--border-default)] hidden sm:block"></div>
            <div>
              <h2 className="font-sans font-bold text-lg text-[var(--text-primary)] flex items-center gap-3">
                {activeBrief.title}
                {activeBrief.documents.length > 0 && (
                  <span className="text-xs font-bold bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-1 rounded-md">
                    {activeBrief.documents.length} Documents
                  </span>
                )}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium">{activeBrief.matter} {'\u2022'} {wordCount} words {'\u2022'} {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
            {/* Status Workflow */}
            <div className="flex flex-wrap items-center bg-[var(--surface-hover)] p-1 rounded-lg border border-[var(--border-default)]/50 mr-2">
              {statuses.map((s, i) => (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => setActiveBrief({ ...activeBrief, status: s })}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeBrief.status === s
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-default)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    {s}
                  </button>
                  {i < statuses.length - 1 && <ChevronRight className="w-3 h-3 text-[var(--text-muted)] mx-1" />}
                </div>
              ))}
            </div>

            <button onClick={handleExportDocx} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors border border-[var(--border-default)] bg-[var(--bg-surface)]" title="Export DOCX">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={closeBrief} className="bg-[var(--bg-sidebar)] text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-[var(--bg-sidebar-hover)] transition-colors flex items-center gap-2 shadow-[var(--shadow-card)] whitespace-nowrap">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        {/* Main Editor Area - Single Column */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar bg-[var(--bg-primary)] flex justify-center">
          <div className="w-full max-w-[800px] space-y-6 pb-32 animate-in fade-in duration-500">

            {/* Import from Research Button */}
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowImportModal(true)} className="bg-[var(--surface-glass)] backdrop-blur-md ring-1 ring-[var(--accent)]/50 text-[var(--text-primary)] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 shadow-[var(--shadow-card)]">
                <Import className="w-4 h-4 text-[var(--accent)]" /> Import from Research
              </button>
            </div>

            {/* Case Documents Panel */}
            <div className="bg-[var(--surface-glass)] backdrop-blur-xl ring-1 ring-white/40 rounded-2xl shadow-[var(--shadow-card)] overflow-hidden group transition-all duration-300">
              <div
                className="bg-[var(--surface-glass)] px-6 py-4 border-b border-[var(--border-light)]/50 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-glass)] transition-colors"
                onClick={() => setExpandedDocuments(!expandedDocuments)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                  <h3 className="font-sans font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider">Case Documents</h3>
                  <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-hover)] px-2 py-0.5 rounded">{activeBrief.documents.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    {expandedDocuments ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {expandedDocuments && (
                <div className="p-6 space-y-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-[var(--accent)]/10 border-2 border-dashed border-[var(--accent)] text-[var(--accent)] px-4 py-3 rounded-xl text-sm font-bold hover:bg-[var(--accent)]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Upload Document
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.json,.jpg,.png"
                  />

                  {activeBrief.documents.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No documents uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeBrief.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 bg-[var(--surface-hover)] rounded-lg ring-1 ring-[var(--border-default)] hover:bg-[var(--surface-hover)] transition-colors group"
                        >
                          <div className="text-[var(--text-secondary)]">
                            {getFileIcon(doc.mimeType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{doc.name}</p>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                              <span className="px-2 py-0.5 bg-[var(--border-default)] rounded text-[10px] font-bold uppercase">{doc.type}</span>
                              <span>{formatFileSize(doc.size)}</span>
                              <span>{formatDate(doc.date)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible Sections */}
            {activeBrief.sections.map((section, index) => {
              const isExpanded = expandedSections[section.id];
              return (
                <div key={section.id} className="bg-[var(--surface-glass)] backdrop-blur-xl ring-1 ring-white/40 rounded-2xl shadow-[var(--shadow-card)] overflow-hidden group transition-all duration-300">
                  <div
                    className="bg-[var(--surface-glass)] px-6 py-4 border-b border-[var(--border-light)]/50 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-glass)] transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[var(--text-muted)] w-5">{index + 1}.</span>
                      <h3 className="font-sans font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider">{section.title}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <textarea
                      className="w-full p-8 font-sans text-[var(--text-primary)] leading-loose whitespace-pre-wrap outline-none min-h-[300px] text-[15px] bg-transparent resize-none focus:bg-[var(--surface-hover)] transition-colors"
                      value={section.content}
                      onChange={(e) => updateSectionContent(section.id, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Import research">
            <div className="absolute inset-0 bg-[var(--bg-sidebar)]/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
            <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onKeyDown={(e) => e.key === 'Escape' && setShowImportModal(false)}>
              <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sidebar)] text-white">
                <h3 className="font-sans font-bold flex items-center gap-2"><Search className="w-4 h-4 text-[var(--accent)]" /> Import Research</h3>
                <button onClick={() => setShowImportModal(false)} className="hover:text-[var(--text-on-sidebar)]" aria-label="Close import modal"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                {researchSessions.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-secondary)]">No research history found.</div>
                ) : (
                  researchSessions.map((session) => (
                    <div key={session.id} onClick={() => handleImportResearch(session)} className="p-4 ring-1 ring-[var(--border-default)] rounded-xl hover:ring-[var(--accent)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors">
                      <h4 className="font-bold text-[var(--text-primary)] mb-1">{session.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mb-2">{formatDate(session.updatedAt)}</p>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{session.messages[session.messages.length - 1]?.result?.positionOfLaw}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <button
          onClick={() => setShowNewBriefModal(true)}
          className="bg-[var(--accent)] text-[var(--accent-text)] px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 shadow-[var(--shadow-card)]"
        >
          <Plus className="w-5 h-5" /> Create New Brief
        </button>
      </div>

      <div className="bg-[var(--surface-glass)] backdrop-blur-xl rounded-3xl ring-1 ring-white/40 shadow-[var(--shadow-card)] overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border-default)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-glass)]">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'all' ? 'bg-[var(--bg-sidebar)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'}`}
            >
              All Briefs
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'draft' ? 'bg-[var(--bg-sidebar)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'}`}
            >
              Drafts
            </button>
            <button
              onClick={() => setActiveTab('final')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'final' ? 'bg-[var(--bg-sidebar)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'}`}
            >
              Final / Filed
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search briefs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-[var(--border-light)]">
          {(() => {
            const filteredBriefs = briefs
              .filter(b => b.matter === matterId)
              .filter(b => activeTab === 'all' || (activeTab === 'draft' && b.status === 'Draft') || (activeTab === 'final' && (b.status === 'Final' || b.status === 'Filed')))
              .filter(b => !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.matter.toLowerCase().includes(searchQuery.toLowerCase()));

            if (filteredBriefs.length === 0) {
              return (
                <div className="py-12">
                  <EmptyState
                    icon={BookOpen}
                    title={briefs.filter(b => b.matter === matterId).length === 0 ? "No briefs yet" : "No briefs found"}
                    description={briefs.filter(b => b.matter === matterId).length === 0 ? "Create your first brief to start drafting." : "Try changing the filter tab or search query."}
                    action={{ label: "Create Brief", onClick: () => setShowNewBriefModal(true) }}
                  />
                </div>
              );
            }

            return filteredBriefs.map((brief) => (
              <div
                key={brief.id}
                onClick={() => openBrief(brief)}
                className="p-5 hover:bg-[var(--surface-glass)] transition-colors group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded bg-[var(--surface-hover)] flex items-center justify-center shrink-0 group-hover:bg-[var(--bg-sidebar)] group-hover:text-[var(--accent)] transition-colors text-[var(--text-secondary)]">
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <h3 className="font-sans font-sans font-bold text-[var(--text-primary)] truncate text-lg group-hover:text-[var(--accent)] transition-colors">{brief.title}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-[var(--text-secondary)] ml-11">
                    <span className="text-xs font-bold text-[var(--text-primary)] bg-[var(--surface-hover)] px-2 py-0.5 rounded uppercase tracking-wider">{brief.matter}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(brief.lastEdited)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto shrink-0 ml-11 sm:ml-0">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">{brief.documents.length} docs</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${brief.status === 'Draft' ? 'bg-amber-500/10 text-amber-600' :
                    brief.status === 'Review' ? 'bg-blue-500/10 text-blue-600' :
                      brief.status === 'Final' ? 'bg-emerald-500/10 text-emerald-600' :
                        'bg-[var(--surface-hover)] text-[var(--text-primary)]'
                    }`}>
                    {brief.status}
                  </span>
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors transform group-hover:translate-x-1" />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* New Brief Modal */}
      {showNewBriefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Create new brief">
          <div className="absolute inset-0 bg-[var(--bg-sidebar)]/40 backdrop-blur-sm" onClick={() => setShowNewBriefModal(false)} />
          <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onKeyDown={(e) => e.key === 'Escape' && setShowNewBriefModal(false)}>
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sidebar)] text-white">
              <h3 className="font-sans font-bold">Create New Brief</h3>
              <button onClick={() => setShowNewBriefModal(false)} className="hover:text-[var(--text-on-sidebar)]" aria-label="Close create brief modal"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateBrief} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Brief Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Written Submissions - Appeal"
                  className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Linked Matter</label>
                <p className="text-sm text-[var(--text-primary)] font-medium bg-[var(--surface-hover)] px-3 py-2 rounded-lg">{matterId}</p>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewBriefModal(false)} className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
