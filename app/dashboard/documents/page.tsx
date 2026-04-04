"use client";

import { useState, useEffect, useRef } from 'react';
import {
  FolderOpen, File, UploadCloud, Search, Filter,
  MoreVertical, Download, Eye, Trash2, FileText,
  FileSignature, Scale, Mail, Folder, X, FileImage
} from 'lucide-react';
import { getStoredData, setStoredData, STORAGE_KEYS } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { useMatterContext } from '@/lib/matter-context';
import EmptyState from '@/components/ui/EmptyState';

interface DocumentMeta {
  id: string;
  name: string;
  type: string;
  matter: string;
  size: number;
  date: string;
  mimeType: string;
  data?: string; // base64 data for small files
}

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('All Files');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const { selectedMatterId, matters } = useMatterContext();

  // Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMatter, setUploadMatter] = useState('');
  const [uploadType, setUploadType] = useState('Evidence');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedDocs = getStoredData<DocumentMeta[]>(STORAGE_KEYS.DOCUMENTS, []);
    setDocuments(storedDocs);
  }, []);

  const saveDocuments = (newDocs: DocumentMeta[]) => {
    setDocuments(newDocs);
    setStoredData(STORAGE_KEYS.DOCUMENTS, newDocs);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;

      const newDoc: DocumentMeta = {
        id: `DOC-${Date.now()}`,
        name: uploadFile.name,
        type: uploadType,
        matter: uploadMatter || (selectedMatterId !== 'all' ? selectedMatterId : 'Unassigned'),
        size: uploadFile.size,
        date: new Date().toISOString(),
        mimeType: uploadFile.type,
        data: uploadFile.size < 5 * 1024 * 1024 ? base64String : undefined // Only store if < 5MB
      };

      saveDocuments([newDoc, ...documents]);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadMatter('');
      setUploadType('Evidence');
    };
    reader.readAsDataURL(uploadFile);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      saveDocuments(documents.filter(d => d.id !== id));
    }
  };

  const handleDownload = (doc: DocumentMeta) => {
    if (doc.data) {
      const a = document.createElement('a');
      a.href = doc.data;
      a.download = doc.name;
      a.click();
    } else {
      alert('File content not available in local storage (file was too large).');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('image')) return <FileImage className="w-4 h-4 text-blue-500" />;
    if (mimeType.includes('word')) return <FileText className="w-4 h-4 text-blue-700" />;
    return <File className="w-4 h-4 text-[var(--text-secondary)]" />;
  };

  // Calculate folder stats
  const folderStats = matters.map(m => ({
    name: m.title,
    count: documents.filter(d => d.matter === m.id || d.matter === m.title).length
  })).filter(f => f.count > 0);

  const currentMatter = matters.find(m => m.id === selectedMatterId);
  const selectedMatterTitle = currentMatter ? currentMatter.title : '';

  const filteredDocs = documents.filter(doc => {
    const matchesTab = activeTab === 'All Files' || doc.type === activeTab;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.matter.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMatterContext = selectedMatterId === 'all' || doc.matter === selectedMatterId || doc.matter === selectedMatterTitle;
    return matchesTab && matchesSearch && matchesMatterContext;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-sans font-bold text-[var(--text-primary)] mb-2">Documents</h1>
          <p className="text-[var(--text-secondary)] font-medium">Manage and organize all your case files</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="bg-[var(--accent)] text-[var(--accent-text)] px-6 py-2.5 rounded-xl font-bold hover:bg-[var(--accent-hover)] transition-colors shadow-[var(--shadow-card)] flex items-center justify-center gap-2">
          <UploadCloud className="w-5 h-5" /> Upload Files
        </button>
      </div>

      {/* Folders Row */}
      {folderStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {folderStats.map((folder, i) => (
            <div key={i} className="bg-[var(--surface-glass)] backdrop-blur-xl p-4 rounded-xl ring-1 ring-white/40 hover:ring-[var(--accent)]/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 cursor-pointer flex items-center gap-4 group">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[var(--bg-sidebar)] transition-colors">
                <Folder className="w-5 h-5 text-amber-500 group-hover:text-[var(--accent)]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-sans font-bold text-[var(--text-primary)] truncate">{folder.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium">{folder.count} files</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-[var(--surface-glass)] backdrop-blur-xl ring-1 ring-white/40 rounded-2xl shadow-[var(--shadow-card)] overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border-default)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-glass)]">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
            {['All Files', 'Contracts', 'Evidence', 'Court Orders', 'Correspondence', 'Pleading'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab
                  ? 'bg-[var(--bg-sidebar)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-hover)]/50 border-b border-[var(--border-default)]/50">
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">File Name</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Matter</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Date Uploaded</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Size</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12">
                    <EmptyState
                      icon={FolderOpen}
                      title={documents.length === 0 ? "No documents found" : "No documents in this view"}
                      description={documents.length === 0 ? "Upload files to get started." : "Try changing the selected matter or filter tab."}
                      action={{ label: "Upload Files", onClick: () => setShowUploadModal(true) }}
                    />
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--surface-glass)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[var(--surface-hover)] flex items-center justify-center shrink-0">
                          {getIcon(doc.mimeType)}
                        </div>
                        <span className="font-bold text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent)] transition-colors">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-secondary)]">{doc.matter}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-secondary)]">{formatDate(doc.date)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-secondary)]">{formatSize(doc.size)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDownload(doc)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--bg-sidebar)]/40 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
          <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sidebar)] text-white">
              <h3 className="font-sans font-bold">Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="hover:text-[var(--text-on-sidebar)]"><X className="w-5 h-5" /></button>
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
                {uploadFile && <p className="text-xs text-[var(--text-secondary)] mt-1">Size: {formatSize(uploadFile.size)}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Document Type</label>
                <select value={uploadType} onChange={e => setUploadType(e.target.value)} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50">
                  <option>Evidence</option>
                  <option>Contracts</option>
                  <option>Court Orders</option>
                  <option>Correspondence</option>
                  <option>Pleading</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Linked Matter (Optional)</label>
                <select value={uploadMatter} onChange={e => setUploadMatter(e.target.value)} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50">
                  <option value="">None</option>
                  {matters.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg">Cancel</button>
                <button type="submit" disabled={!uploadFile} className="px-4 py-2 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg disabled:opacity-50">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
