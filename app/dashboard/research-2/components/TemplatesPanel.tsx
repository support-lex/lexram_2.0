"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, Trash2, FileText, Check, Loader2, ChevronDown, ChevronRight } from "lucide-react";

export type DraftTemplate = {
  id: string;
  name: string;
  doc_type: string | null;
  structure: object;
  created_at: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  selectedTemplate: DraftTemplate | null;
  onSelect: (t: DraftTemplate | null) => void;
};

export default function TemplatesPanel({ open, onClose, selectedTemplate, onSelect }: Props) {
  const [templates, setTemplates] = useState<DraftTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadFile(f);
    if (!uploadName) setUploadName(f.name.replace(/\.[^.]+$/, ""));
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!uploadFile) { setUploadError("Select a .docx file first"); return; }
    if (!uploadName.trim()) { setUploadError("Give this template a name"); return; }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const extractRes = await fetch("/api/templates/extract", { method: "POST", body: formData });
      const extractData = await extractRes.json();
      if (!extractRes.ok) throw new Error(extractData.error ?? "Extraction failed");

      const saveRes = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadName.trim(),
          structure: extractData.structure,
          raw_text: extractData.raw_text,
          doc_type: extractData.doc_type,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error ?? "Save failed");

      setTemplates((prev) => [saveData.template, ...prev]);
      setUploadFile(null);
      setUploadName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prev = templates;
    setTemplates((t) => t.filter((x) => x.id !== id));
    if (selectedTemplate?.id === id) onSelect(null);
    try {
      await fetch(`/api/templates/${id}`, { method: "DELETE" });
    } catch {
      setTemplates(prev);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-default)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Draft Templates</h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Upload a sample document — AI extracts its structure</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload area */}
        <div className="px-5 py-4 border-b border-[var(--border-light)] space-y-3">
          <input ref={fileInputRef} type="file" accept=".docx,.doc" className="sr-only" onChange={handleFileChange} />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border-default)] hover:border-[var(--accent)] px-4 py-3 cursor-pointer transition-colors group"
          >
            <FileText className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
            <span className="text-[12px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors truncate">
              {uploadFile ? uploadFile.name : "Click to select a .docx template file"}
            </span>
          </div>

          <input
            type="text"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="Template name (e.g. Bail Application – High Court)"
            className="w-full rounded-lg border border-[var(--border-default)] bg-transparent px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors"
          />

          {uploadError && <p className="text-[11px] text-red-500">{uploadError}</p>}

          <button
            onClick={handleUpload}
            disabled={uploading || !uploadFile}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] text-white text-[12px] font-semibold py-2 disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Analysing document…" : "Upload & Extract Structure"}
          </button>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3 space-y-2">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" /></div>
          ) : templates.length === 0 ? (
            <p className="text-center text-[12px] text-[var(--text-muted)] py-6">No templates yet — upload one above</p>
          ) : (
            templates.map((t) => {
              const isSelected = selectedTemplate?.id === t.id;
              const isExpanded = expandedId === t.id;
              return (
                <div
                  key={t.id}
                  className={`rounded-xl border transition-colors ${isSelected ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border-default)] hover:border-[var(--border-default)]"}`}
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <button
                      onClick={() => onSelect(isSelected ? null : t)}
                      className={`flex-shrink-0 w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                        isSelected ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border-default)] hover:border-[var(--accent)]"
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </button>
                    <button onClick={() => onSelect(isSelected ? null : t)} className="flex-1 text-left min-w-0">
                      <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{t.name}</p>
                      {t.doc_type && <p className="text-[10px] text-[var(--text-muted)]">{t.doc_type}</p>}
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Preview structure"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-2.5 border-t border-[var(--border-light)] mt-1 pt-2">
                      <pre className="text-[10px] text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                        {JSON.stringify(t.structure, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {selectedTemplate && (
          <div className="px-5 py-3 border-t border-[var(--border-light)] flex items-center justify-between">
            <p className="text-[11px] text-[var(--text-muted)]">Using: <span className="font-medium text-[var(--text-primary)]">{selectedTemplate.name}</span></p>
            <button
              onClick={() => { onSelect(null); onClose(); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity"
            >
              <Check className="w-3 h-3" /> Use this template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
