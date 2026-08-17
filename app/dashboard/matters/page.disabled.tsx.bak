"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Filter, Calendar, FileText, Users,
  ArrowLeft, Edit3, Scale, FileSignature, MessageSquare,
  UploadCloud, Download, Trash2, ChevronRight, X, Sparkles, Briefcase, AlertCircle,
  Clock, BookOpen, Layers
} from 'lucide-react';
import { getStoredData, setStoredData, STORAGE_KEYS } from '@/lib/storage';
import { generateContent } from '@/lib/ai';
import { formatDate } from '@/lib/utils';
import ThinkingSteps, { ThinkingStep } from '@/components/ai/ThinkingSteps';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useMatterContext } from '@/lib/matter-context';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { AddCaseModal } from '@/app/dashboard/case-status/components/AddCaseModal';

// Extracted tab components
import { OverviewTab } from './components/OverviewTab';
import { HearingsTab } from './components/HearingsTab';
import { DocumentsTab } from './components/DocumentsTab';
import { NotesTab } from './components/NotesTab';
import { CaseStatusTab } from './components/CaseStatusTab';
import { BriefsTab } from './components/BriefsTab';

export default function MatterManagerPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [matters, setMatters] = useState<any[]>([]);
  const { setSelectedMatterId, matters: _contextMatters } = useMatterContext();
  const [selectedMatter, setSelectedMatter] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Related content
  const [relatedBriefs, setRelatedBriefs] = useState<any[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<any[]>([]);
  const [relatedResearch, setRelatedResearch] = useState<any[]>([]);
  const [relatedDocuments, setRelatedDocuments] = useState<any[]>([]);
  const [matterNotes, setMatterNotes] = useState('');
  const [notesLastSaved, setNotesLastSaved] = useState<string | null>(null);
  const [notesDirty, setNotesDirty] = useState(false);

  // Modals
  const [showNewMatterModal, setShowNewMatterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);

  const router = useRouter();
  const toastSuccess = (msg: string) => toast.success(msg);
  const toastError = (msg: string) => toast.error(msg);
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    type: 'Civil Suit',
    court: '',
    caseNumber: '',
    nextDate: '',
    status: 'Active',
    description: ''
  });

  useEffect(() => {
    const stored = getStoredData<any[]>(STORAGE_KEYS.MATTERS, []);
    if (stored.length === 0) {
      // Seed data
      const seed = [
        {
          id: 'MAT-2026-001',
          title: 'Ramesh Kumar v. State of Haryana',
          client: 'Ramesh Kumar',
          type: 'Criminal Appeal',
          court: 'Supreme Court of India',
          nextDate: '2026-03-15',
          status: 'Active',
          judge: 'Hon\'ble Mr. Justice A.B. Singh',
          opposingCounsel: 'Mr. Vikram Sharma, Sr. Adv.',
          description: 'Appeal against the conviction order passed by the High Court of Punjab & Haryana in a matter relating to Section 302 IPC. The primary ground is the lack of direct evidence and reliance on uncorroborated circumstantial evidence.',
          timeline: [
            { date: '2026-02-10', event: 'SLP filed in the Supreme Court', type: 'filing' },
            { date: '2026-02-25', event: 'Notice issued to the Respondent State', type: 'hearing' },
            { date: '2026-03-15', event: 'Next date for filing counter-affidavit', type: 'deadline' }
          ],
          notes: ''
        }
      ];
      setMatters(seed);
      setStoredData(STORAGE_KEYS.MATTERS, seed);
    } else {
      setMatters(stored);
    }

    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Load related content when selectedMatter changes
  useEffect(() => {
    if (!selectedMatter) {
      setRelatedBriefs([]);
      setRelatedEvents([]);
      setRelatedResearch([]);
      setRelatedDocuments([]);
      setMatterNotes('');
      setNotesLastSaved(null);
      return;
    }

    // Load briefs linked to this matter
    const allBriefs = getStoredData<any[]>(STORAGE_KEYS.BRIEFS, []);
    const linkedBriefs = allBriefs.filter(b => b.matter === selectedMatter.id);
    setRelatedBriefs(linkedBriefs);

    // Load events/deadlines for this matter
    const allEvents = getStoredData<any[]>('lexram_events', []);
    const linkedEvents = allEvents.filter(e => e.matterId === selectedMatter.id);
    setRelatedEvents(linkedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

    // Load research sessions for this matter
    const allSessions = getStoredData<any[]>(STORAGE_KEYS.RESEARCH_SESSIONS, []);
    const linkedSessions = allSessions.filter(s => s.matterId === selectedMatter.id);
    setRelatedResearch(linkedSessions);

    // Flatten documents from briefs + standalone documents
    const briefDocuments = linkedBriefs.flatMap(b => b.documents || []);
    const allDocuments = getStoredData<any[]>(STORAGE_KEYS.DOCUMENTS, []);
    const standaloneDocuments = allDocuments.filter(d => d.matter === selectedMatter.id);
    setRelatedDocuments([...briefDocuments, ...standaloneDocuments]);

    // Load matter notes
    const matterWithNotes = matters.find(m => m.id === selectedMatter.id);
    setMatterNotes(matterWithNotes?.notes || '');
    setNotesLastSaved(null);
  }, [selectedMatter, matters]);

  // Auto-save notes on blur or after 2 seconds of inactivity
  useEffect(() => {
    if (!selectedMatter || !notesDirty) return;

    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }

    notesTimeoutRef.current = setTimeout(() => {
      const updatedMatters = matters.map(m =>
        m.id === selectedMatter.id ? { ...m, notes: matterNotes } : m
      );
      saveMatters(updatedMatters);
      setNotesLastSaved(new Date().toLocaleTimeString());
      setNotesDirty(false);
    }, 2000);

    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current);
      }
    };
  }, [matterNotes, notesDirty, selectedMatter, matters]);

  const saveMatters = (newMatters: any[]) => {
    setMatters(newMatters);
    setStoredData(STORAGE_KEYS.MATTERS, newMatters);
  };

  const handleCreateMatter = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedDescription = formData.description.replace(/```/g, '').replace(/\bsystem\b:/gi, '').replace(/\bignore\b.*\binstructions?\b/gi, '');
    const newMatter = {
      id: `MAT-${new Date().getFullYear()}-${String(matters.length + 1).padStart(3, '0')}`,
      ...formData,
      description: sanitizedDescription,
      timeline: []
    };
    saveMatters([newMatter, ...matters]);
    setShowNewMatterModal(false);
    setFormData({ title: '', client: '', type: 'Civil Suit', court: '', caseNumber: '', nextDate: '', status: 'Active', description: '' });
  };

  const handleEditMatter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    const updated = matters.map(m => m.id === editFormData.id ? editFormData : m);
    saveMatters(updated);

    // Sync nextDate to lexram_events
    const allEvents = getStoredData<any[]>('lexram_events', []);
    const autoEventId = `AUTO-${editFormData.id}-next-hearing`;

    if (editFormData.nextDate) {
      // Find or create the auto-generated event
      const existingIndex = allEvents.findIndex(e => e.id === autoEventId);
      const newEvent = {
        id: autoEventId,
        title: `Next Hearing: ${editFormData.title}`,
        date: editFormData.nextDate,
        time: '',
        type: 'Hearing',
        matterId: editFormData.id
      };

      if (existingIndex >= 0) {
        allEvents[existingIndex] = newEvent;
      } else {
        allEvents.push(newEvent);
      }
      setStoredData('lexram_events', allEvents);
    }

    setShowEditModal(false);
    setEditFormData(null);
    if (selectedMatter?.id === editFormData.id) {
      setSelectedMatter(editFormData);
    }
  };

  const handleDeleteMatter = (id: string) => {
    if (confirm('Are you sure you want to delete this matter? This cannot be undone.')) {
      saveMatters(matters.filter(m => m.id !== id));
      if (selectedMatter?.id === id) setSelectedMatter(null);
    }
  };

  const handleGenerateTimeline = async () => {
    if (!selectedMatter) return;
    setIsGeneratingTimeline(true);

    try {
      const simulatedDocContent = `Case: ${selectedMatter.title}. Description: ${selectedMatter.description}. On 2025-01-15, the initial complaint was filed. On 2025-03-10, the first hearing took place where the judge ordered mediation. Mediation failed on 2025-05-20.`;

      const response = await generateContent({
        prompt: `Extract all dates and events from this case summary. Return a chronological timeline as JSON: { "events": [{ "date": "YYYY-MM-DD", "event": "string", "type": "filing|hearing|deadline|other" }] }\n\n${simulatedDocContent}`,
        jsonMode: true,
      });

      if (response?.text) {
        const parsed = JSON.parse(response.text);
        const newEvents = parsed.events.map((e: any) => ({ ...e, aiGenerated: true }));

        const updatedMatter = {
          ...selectedMatter,
          timeline: [...(selectedMatter.timeline || []), ...newEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        };

        setSelectedMatter(updatedMatter);
        saveMatters(matters.map(m => m.id === updatedMatter.id ? updatedMatter : m));
      }
    } catch (err) {
      console.error("Error generating timeline:", err);
      setTimelineError("Failed to generate timeline.");
      setTimeout(() => setTimelineError(null), 3000);
    } finally {
      setIsGeneratingTimeline(false);
    }
  };

  const handleNoteBlurSave = () => {
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    const updatedMatters = matters.map(m =>
      m.id === selectedMatter!.id ? { ...m, notes: matterNotes } : m
    );
    saveMatters(updatedMatters);
    setNotesLastSaved(new Date().toLocaleTimeString());
    setNotesDirty(false);
  };

  const openMatter = (m: any) => {
    setSelectedMatter(m);
    setSelectedMatterId(m.id);
  };

  // Tab configuration for detail view
  const detailTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'case-status', label: 'Case Status' },
    { id: 'briefs', label: 'Briefs' },
    { id: 'hearings', label: 'Hearings' },
    { id: 'documents', label: 'Documents' },
    { id: 'notes', label: 'Notes' },
  ];

  if (selectedMatter) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-[var(--bg-primary)]">
        {/* Detail Header */}
        <div className="bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-6 py-4 shrink-0 shadow-sm z-10">
          {timelineError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{timelineError}</span>
            </div>
          )}
          <button
            onClick={() => setSelectedMatter(null)}
            className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Cases
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-[var(--bg-sidebar)]/5 text-[var(--text-primary)] text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                  {selectedMatter.id}
                </span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${selectedMatter.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                  {selectedMatter.status}
                </span>
              </div>
              <h1 className="font-sans text-2xl font-sans font-bold text-[var(--text-primary)] mb-2">{selectedMatter.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] font-medium">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-[var(--accent)]" /> {selectedMatter.client}</span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="flex items-center gap-1.5"><Scale className="w-4 h-4 text-[var(--accent)]" /> {selectedMatter.court || 'Unknown Court'}</span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="flex items-center gap-1.5"><FileSignature className="w-4 h-4 text-[var(--accent)]" /> {selectedMatter.type}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button onClick={() => { setEditFormData({...selectedMatter}); setShowEditModal(true); }} className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl text-sm font-bold hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => handleDeleteMatter(selectedMatter.id)} className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-8 overflow-x-auto no-scrollbar">
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${detailTab === tab.id
                  ? 'border-[var(--accent)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detail Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {detailTab === 'overview' && (
              <OverviewTab
                selectedMatter={selectedMatter}
                relatedDocuments={relatedDocuments}
                relatedEvents={relatedEvents}
                relatedBriefs={relatedBriefs}
                relatedResearch={relatedResearch}
                setDetailTab={setDetailTab}
                isGeneratingTimeline={isGeneratingTimeline}
                handleGenerateTimeline={handleGenerateTimeline}
              />
            )}

            {detailTab === 'case-status' && (
              <CaseStatusTab matterId={selectedMatter.id} />
            )}

            {detailTab === 'briefs' && (
              <BriefsTab matterId={selectedMatter.id} />
            )}

            {detailTab === 'hearings' && (
              <HearingsTab relatedEvents={relatedEvents} />
            )}

            {detailTab === 'documents' && (
              <DocumentsTab relatedDocuments={relatedDocuments} />
            )}

            {detailTab === 'notes' && (
              <NotesTab
                matterNotes={matterNotes}
                setMatterNotes={setMatterNotes}
                setNotesDirty={setNotesDirty}
                notesLastSaved={notesLastSaved}
                onBlurSave={handleNoteBlurSave}
              />
            )}
          </div>
        </div>

        {/* Edit Matter Modal (detail view) */}
        {showEditModal && editFormData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Edit matter">
            <div className="absolute inset-0 bg-[var(--bg-sidebar)]/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
            <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onKeyDown={(e) => e.key === 'Escape' && setShowEditModal(false)}>
              <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sidebar)] text-white shrink-0">
                <h3 className="font-sans font-bold">Edit Matter</h3>
                <button onClick={() => setShowEditModal(false)} className="hover:text-[var(--text-on-sidebar)]" aria-label="Close edit matter modal"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditMatter} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Title *</label>
                    <input required type="text" value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Client</label>
                    <input type="text" value={editFormData.client} onChange={e => setEditFormData({...editFormData, client: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Status</label>
                    <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50">
                      <option>Active</option>
                      <option>Stayed</option>
                      <option>Decided</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Court</label>
                    <input type="text" value={editFormData.court || ''} onChange={e => setEditFormData({...editFormData, court: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Next Hearing Date</label>
                    <input type="date" value={editFormData.nextDate || ''} onChange={e => setEditFormData({...editFormData, nextDate: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Description</label>
                  <textarea value={editFormData.description || ''} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-sans font-bold text-[var(--text-primary)]">Case Manager</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Organize your cases, clients, and court dates.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCaseModal(true)}
            className="border border-[var(--accent)] text-[var(--accent)] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--accent)]/10 transition-colors flex items-center gap-2"
          >
            <Scale className="w-4 h-4" /> Track by CNR
          </button>
          <button onClick={() => setShowNewMatterModal(true)} className="bg-[var(--accent)] text-[var(--accent-text)] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> New Matter
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-hover)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'active' ? 'bg-[var(--bg-sidebar)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('stayed')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'stayed' ? 'bg-[var(--bg-sidebar)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
            >
              Stayed
            </button>
            <button
              onClick={() => setActiveTab('decided')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'decided' ? 'bg-[var(--bg-sidebar)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
            >
              Decided
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-hover)] border-b border-[var(--border-default)]">
                <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Matter No.</th>
                <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Title & Client</th>
                <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Court & Type</th>
                <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Next Date</th>
                <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full rounded-xl" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                  </td>
                </tr>
              ) : matters.filter(m => activeTab === 'all' || m.status.toLowerCase() === activeTab).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12">
                    <EmptyState
                      icon={Briefcase}
                      title={matters.length === 0 ? "No matters found" : "No matters in this view"}
                      description={matters.length === 0 ? "Create a matter to get started." : "Try changing the filter tab."}
                      action={{ label: "Create Matter", onClick: () => setShowNewMatterModal(true) }}
                    />
                  </td>
                </tr>
              ) : (
                matters.filter(m => activeTab === 'all' || m.status.toLowerCase() === activeTab).map((matter) => (
                  <tr
                    key={matter.id}
                    onClick={() => openMatter(matter)}
                    className="hover:bg-[var(--surface-hover)] transition-colors group cursor-pointer"
                  >
                    <td className="p-4">
                      <span className="text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-sidebar)]/5 px-2.5 py-1 rounded uppercase tracking-wider truncate">{matter.id}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-sans font-bold text-[var(--text-primary)] mb-1">{matter.title}</div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                        <Users className="w-3.5 h-3.5 text-[var(--accent)]" /> {matter.client}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">{matter.court}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{matter.type}</div>
                    </td>
                    <td className="p-4">
                      {matter.nextDate ? (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)]">
                          <Calendar className="w-4 h-4 text-[var(--accent)]" /> {formatDate(matter.nextDate)}
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">Not set</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${matter.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                        {matter.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Matter Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Edit matter">
          <div className="absolute inset-0 bg-[var(--bg-sidebar)]/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onKeyDown={(e) => e.key === 'Escape' && setShowEditModal(false)}>
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sidebar)] text-white shrink-0">
              <h3 className="font-sans font-bold">Edit Matter</h3>
              <button onClick={() => setShowEditModal(false)} className="hover:text-[var(--text-on-sidebar)]" aria-label="Close edit matter modal"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditMatter} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Title *</label>
                  <input required type="text" value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Client</label>
                  <input type="text" value={editFormData.client} onChange={e => setEditFormData({...editFormData, client: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Status</label>
                  <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50">
                    <option>Active</option>
                    <option>Stayed</option>
                    <option>Decided</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Court</label>
                  <input type="text" value={editFormData.court || ''} onChange={e => setEditFormData({...editFormData, court: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Next Hearing Date</label>
                  <input type="date" value={editFormData.nextDate || ''} onChange={e => setEditFormData({...editFormData, nextDate: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Description</label>
                <textarea value={editFormData.description || ''} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Matter Modal */}
      {showNewMatterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Create new matter">
          <div className="absolute inset-0 bg-[var(--bg-sidebar)]/60 backdrop-blur-sm" onClick={() => setShowNewMatterModal(false)} />
          <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onKeyDown={(e) => e.key === 'Escape' && setShowNewMatterModal(false)}>
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sidebar)] text-white shrink-0">
              <h3 className="font-sans font-bold">Create New Matter</h3>
              <button onClick={() => setShowNewMatterModal(false)} className="hover:text-[var(--text-on-sidebar)]" aria-label="Close create matter modal"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateMatter} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Title *</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Client Name *</label>
                  <input required type="text" value={formData.client} onChange={e => setFormData({ ...formData, client: e.target.value })} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Case Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50">
                    <option>Civil Suit</option>
                    <option>Criminal Appeal</option>
                    <option>Writ Petition</option>
                    <option>Commercial Suit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Court</label>
                  <input type="text" value={formData.court} onChange={e => setFormData({ ...formData, court: e.target.value })} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Case Number</label>
                  <input type="text" value={formData.caseNumber} onChange={e => setFormData({ ...formData, caseNumber: e.target.value })} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Next Hearing Date</label>
                  <input type="date" value={formData.nextDate} onChange={e => setFormData({ ...formData, nextDate: e.target.value })} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewMatterModal(false)} className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg">Create Matter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AddCaseModal
        show={showAddCaseModal}
        onClose={() => setShowAddCaseModal(false)}
        onImportComplete={async () => { router.push('/dashboard/case-status'); }}
        toastSuccess={toastSuccess}
        toastError={toastError}
      />
      <Toaster />
    </div>
  );
}
