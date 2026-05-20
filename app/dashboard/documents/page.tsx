"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FolderOpen, File, UploadCloud, Search,
  Download, Trash2, FileText, FileImage, X, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useMatterContext } from '@/lib/matter-context';
import EmptyState from '@/components/ui/EmptyState';

interface BackendDocument {
  id: string;
  name?: string;
  filename?: string;
  status: 'processing' | 'extracting' | 'classifying' | 'embedding' | 'ready' | 'error' | 'failed';
  size?: number;
  mime_type?: string;
  created_at?: string;
  download_url?: string;
  type?: string;
}

export default function DocumentsPage() {
  const { selectedMatterId, matters } = useMatterContext();
  const [documents, setDocuments] = useState<BackendDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('All Files');
  const [searchQuery, setSearchQuery] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMatter, setUploadMatter] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const activeCaseId = selectedMatterId !== 'all' ? selectedMatterId : null;

  // If NEXT_PUBLIC_LEGAL_API_BASE is set (e.g. https://api.lexram.ai),
  // the browser uploads directly to the backend, bypassing Vercel's
  // 4.5 MB FUNCTION_PAYLOAD_TOO_LARGE limit. Otherwise we fall back to
  // the /legal-api rewrite (capped at 4.5 MB).
  const API_BASE = process.env.NEXT_PUBLIC_LEGAL_API_BASE || '/legal-api';

  const fetchDocuments = useCallback(async (caseId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/documents`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const docs: BackendDocument[] = Array.isArray(data) ? data : [];
      setDocuments(docs);
      docs.forEach(doc => {
        if (doc.status !== 'ready' && doc.status !== 'error' && doc.status !== 'failed') {
          startTracking(caseId, doc.id);
        }
      });
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeCaseId) {
      fetchDocuments(activeCaseId);
    } else {
      setDocuments([]);
    }
    return () => {
      eventSourcesRef.current.forEach(es => es.close());
      eventSourcesRef.current.clear();
      pollIntervalsRef.current.forEach(id => clearInterval(id));
      pollIntervalsRef.current.clear();
    };
  }, [activeCaseId, fetchDocuments]);

  const stopTracking = (docId: string) => {
    eventSourcesRef.current.get(docId)?.close();
    eventSourcesRef.current.delete(docId);
    const iv = pollIntervalsRef.current.get(docId);
    if (iv) { clearInterval(iv); pollIntervalsRef.current.delete(docId); }
  };

  const startTracking = (caseId: string, docId: string) => {
    if (eventSourcesRef.current.has(docId) || pollIntervalsRef.current.has(docId)) return;

    const isTerminal = (s: string) => s === 'ready' || s === 'error' || s === 'failed';

    const onTerminal = (status: string) => {
      stopTracking(docId);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: status as BackendDocument['status'] } : d));
      if (status === 'ready') fetchDocuments(caseId);
    };

    try {
      const es = new EventSource(`${API_BASE}/cases/${caseId}/documents/${docId}/stream`);
      eventSourcesRef.current.set(docId, es);

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const status = data.status as string;
          setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...data } : d));
          if (isTerminal(status)) onTerminal(status);
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        es.close();
        eventSourcesRef.current.delete(docId);
        startPollFallback(caseId, docId, isTerminal, onTerminal);
      };
    } catch {
      startPollFallback(caseId, docId, isTerminal, onTerminal);
    }
  };

  const startPollFallback = (
    caseId: string,
    docId: string,
    isTerminal: (s: string) => boolean,
    onTerminal: (s: string) => void,
  ) => {
    if (pollIntervalsRef.current.has(docId)) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/cases/${caseId}/documents/${docId}`);
        if (!res.ok) return;
        const data = await res.json();
        const status = data.status as string;
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...data } : d));
        if (isTerminal(status)) onTerminal(status);
      } catch { /* ignore */ }
    }, 3000);
    pollIntervalsRef.current.set(docId, iv);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    const caseId = activeCaseId || uploadMatter;
    if (!caseId) { setUploadError('Please select a matter.'); return; }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);

      const docId: string = await res.json();

      const optimistic: BackendDocument = {
        id: docId,
        name: uploadFile.name,
        filename: uploadFile.name,
        status: 'processing',
        size: uploadFile.size,
        mime_type: uploadFile.type,
        created_at: new Date().toISOString(),
      };
      setDocuments(prev => [optimistic, ...prev]);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadMatter('');
      startTracking(caseId, docId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: BackendDocument) => {
    if (!activeCaseId || !confirm(`Delete "${docName(doc)}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/cases/${activeCaseId}/documents/${doc.id}`, { method: 'DELETE' });
      if (res.ok) {
        stopTracking(doc.id);
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
      }
    } catch { /* ignore */ }
  };

  const docName = (doc: BackendDocument) => doc.name || doc.filename || 'Untitled';

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="w-4 h-4 text-[var(--text-secondary)]" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('image')) return <FileImage className="w-4 h-4 text-blue-500" />;
    if (mimeType.includes('word')) return <FileText className="w-4 h-4 text-blue-700" />;
    return <File className="w-4 h-4 text-[var(--text-secondary)]" />;
  };

  const getStatusBadge = (status: BackendDocument['status']) => {
    if (status === 'ready') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" /> Ready
        </span>
      );
    }
    if (status === 'error' || status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
          <AlertCircle className="w-3 h-3" /> Error
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
        <Loader2 className="w-3 h-3 animate-spin" /> {status}
      </span>
    );
  };

  const filteredDocs = documents.filter(doc => {
    const matchesTab = activeTab === 'All Files' || doc.type === activeTab;
    const matchesSearch = docName(doc).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-bold text-[var(--text-primary)] mb-2">Documents</h1>
          <p className="text-[var(--text-secondary)] font-medium">Manage and organize all your case files</p>
        </div>
        <button
          onClick={() => { setShowUploadModal(true); setUploadError(null); setUploadFile(null); }}
          disabled={!activeCaseId && matters.length === 0}
          className="bg-[var(--accent)] text-[var(--accent-text)] px-6 py-2.5 rounded-xl font-bold hover:bg-[var(--accent-hover)] transition-colors shadow-[var(--shadow-card)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UploadCloud className="w-5 h-5" /> Upload Files
        </button>
      </div>

      {!activeCaseId ? (
        <div className="bg-[var(--surface-glass)] backdrop-blur-xl ring-1 ring-white/40 rounded-2xl shadow-[var(--shadow-card)] p-12">
          <EmptyState
            icon={FolderOpen}
            title="Select a matter"
            description="Choose a matter from the sidebar to view and upload its documents."
          />
        </div>
      ) : (
        <div className="bg-[var(--surface-glass)] backdrop-blur-xl ring-1 ring-white/40 rounded-2xl shadow-[var(--shadow-card)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[var(--border-default)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-glass)]">
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
              {['All Files', 'Contracts', 'Evidence', 'Court Orders', 'Correspondence', 'Pleading'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab
                    ? 'bg-[var(--bg-sidebar)] text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-hover)]/50 border-b border-[var(--border-default)]/50">
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Date Uploaded</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12">
                        <EmptyState
                          icon={FolderOpen}
                          title="No documents yet"
                          description="Upload files to get started."
                          action={{ label: 'Upload Files', onClick: () => setShowUploadModal(true) }}
                        />
                      </td>
                    </tr>
                  ) : filteredDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-[var(--surface-glass)] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[var(--surface-hover)] flex items-center justify-center shrink-0">
                            {getIcon(doc.mime_type)}
                          </div>
                          <span className="font-bold text-[var(--text-primary)]">{docName(doc)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[var(--text-secondary)]">
                        {doc.created_at ? formatDate(doc.created_at) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[var(--text-secondary)]">{formatSize(doc.size)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.download_url && (
                            <button
                              onClick={() => window.open(doc.download_url, '_blank')}
                              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--bg-sidebar)]/40 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
          <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sidebar)] text-white">
              <h3 className="font-sans font-bold">Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="hover:opacity-70 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">File *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                  required
                />
                {uploadFile && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{formatSize(uploadFile.size)}</p>
                )}
              </div>

              {!activeCaseId && (
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Matter *</label>
                  <select
                    value={uploadMatter}
                    onChange={e => setUploadMatter(e.target.value)}
                    required
                    className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                  >
                    <option value="">Select a matter</option>
                    {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {uploadError}
                </div>
              )}

              <div className="pt-2 text-xs text-[var(--text-secondary)] bg-[var(--surface-hover)] rounded-lg px-3 py-2">
                After upload the document goes through: <span className="font-bold">Extract → Classify → Chunk+Embed → Ready</span>. Status updates live.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="px-4 py-2 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
