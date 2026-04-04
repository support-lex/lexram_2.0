'use client';

import {
  Search,
  ArrowRight,
  ChevronRight,
  FileText,
  Download,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { CONTRACT_TEMPLATES, type ContractTemplate } from '@/app/dashboard/contracts/types';
import React from 'react';

interface TemplateTabProps {
  selectedTemplate: ContractTemplate | null;
  setSelectedTemplate: (t: ContractTemplate | null) => void;
  partyA: string;
  setPartyA: (v: string) => void;
  partyB: string;
  setPartyB: (v: string) => void;
  keyTerms: string;
  setKeyTerms: (v: string) => void;
  isGenerating: boolean;
  preview: string | null;
  error: string | null;
  handleGenerate: () => void;
  downloadPreview: () => void;
  resetTemplate: () => void;
}

export function TemplateTab({
  selectedTemplate,
  setSelectedTemplate,
  partyA,
  setPartyA,
  partyB,
  setPartyB,
  keyTerms,
  setKeyTerms,
  isGenerating,
  preview,
  error,
  handleGenerate,
  downloadPreview,
  resetTemplate,
}: TemplateTabProps) {
  return (
    <div className="pt-8 md:pt-12">
      {!selectedTemplate ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-sans text-3xl font-sans font-bold text-[var(--text-primary)] mb-2">
                Template Library
              </h1>
              <p className="text-[var(--text-secondary)]">
                Start with a standard, legally sound template.
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search templates..."
                className="pl-9 pr-4 py-2 bg-[var(--surface-glass)] backdrop-blur-md border border-[var(--border-default)]/50 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] w-64 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CONTRACT_TEMPLATES.map((template, i) => (
              <div
                key={i}
                onClick={() => setSelectedTemplate(template)}
                className="bg-[var(--surface-glass)] backdrop-blur-xl p-5 rounded-2xl border border-white/40 hover:border-[var(--accent)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group cursor-pointer flex flex-col justify-between h-32"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold bg-[var(--surface-hover)] text-[var(--text-secondary)] px-2 py-0.5 rounded uppercase tracking-wider">
                      {template.type}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="font-sans font-bold text-[var(--text-primary)] line-clamp-2">
                    {template.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Template Form Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={resetTemplate}
              className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h2 className="font-sans text-2xl font-bold text-[var(--text-primary)]">
                {selectedTemplate.name}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Customize your contract with party information and key terms
              </p>
            </div>
          </div>

          {/* Template Form */}
          <div className="bg-[var(--surface-glass)] backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                Party A Name *
              </label>
              <input
                type="text"
                value={partyA}
                onChange={(e) => setPartyA(e.target.value)}
                placeholder="e.g., Acme Corporation"
                className="w-full px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                Party B Name *
              </label>
              <input
                type="text"
                value={partyB}
                onChange={(e) => setPartyB(e.target.value)}
                placeholder="e.g., John Smith"
                className="w-full px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                Key Terms & Conditions
              </label>
              <textarea
                value={keyTerms}
                onChange={(e) => setKeyTerms(e.target.value)}
                placeholder="e.g., Service term: 2 years, Payment: Monthly, Renewal: Auto-renewal unless 30 days notice"
                className="w-full px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none h-32"
              />
            </div>

            {error && (
              <div className="mt-4 w-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-sans font-bold text-sm">Error</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !partyA || !partyB}
              className="w-full bg-[var(--bg-sidebar)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--bg-sidebar-hover)] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Contract...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate from Template
                </>
              )}
            </button>
          </div>

          {preview && (
            <div className="bg-[var(--surface-glass)] backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6">
              <h3 className="font-sans font-sans text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--accent)]" /> Generated Contract Preview
              </h3>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 mb-4 max-h-96 overflow-y-auto custom-scrollbar">
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-sans leading-relaxed">
                  {preview.substring(0, 2000)}
                  {preview.length > 2000 && "..."}
                </p>
              </div>
              <button
                onClick={downloadPreview}
                className="w-full bg-[var(--bg-sidebar)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--bg-sidebar-hover)] transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Contract
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
