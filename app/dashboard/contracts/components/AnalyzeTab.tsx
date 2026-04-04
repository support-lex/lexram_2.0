'use client';

import {
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Info,
  FileText,
  Download,
  ShieldAlert,
  History,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type {
  AnalysisResult,
  SavedContractAnalysis,
} from '@/app/dashboard/contracts/types';
import React from 'react';

interface AnalyzeTabProps {
  isUploaded: boolean;
  isAnalyzing: boolean;
  analysisTab: string;
  setAnalysisTab: (tab: string) => void;
  analysisResult: AnalysisResult | null;
  error: string | null;
  fileName: string;
  savedAnalyses: SavedContractAnalysis[];
  amendmentStates: Map<number, 'accepted' | 'rejected' | null>;
  showMyContracts: boolean;
  setShowMyContracts: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportAnalysis: () => void;
  handleAmendmentAction: (index: number, action: 'accepted' | 'rejected' | null) => void;
  loadSavedAnalysis: (doc: SavedContractAnalysis) => void;
  triggerFileInput: () => void;
}

export function AnalyzeTab({
  isUploaded,
  isAnalyzing,
  analysisTab,
  setAnalysisTab,
  analysisResult,
  error,
  fileName,
  savedAnalyses,
  amendmentStates,
  showMyContracts,
  setShowMyContracts,
  fileInputRef,
  handleFileUpload,
  handleExportAnalysis,
  handleAmendmentAction,
  loadSavedAnalysis,
  triggerFileInput,
}: AnalyzeTabProps) {
  return (
    <>
      {!isUploaded ? (
        <div className="pt-8 md:pt-16">
          <h1 className="font-sans text-3xl font-sans font-bold text-[var(--text-primary)] mb-2 text-center">
            Analyze Contract
          </h1>
          <p className="text-[var(--text-secondary)] text-center mb-8">
            Upload a contract to identify risks, missing clauses, and
            get AI-powered suggestions.
          </p>

          <div
            className="bg-[var(--surface-glass)] backdrop-blur-xl border-2 border-dashed border-[var(--border-default)] rounded-3xl p-16 text-center hover:border-[var(--accent)] hover:bg-[var(--surface-glass)] transition-all cursor-pointer shadow-sm group"
            onClick={triggerFileInput}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
            />
            <div className="w-20 h-20 bg-[var(--surface-hover)] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[var(--bg-sidebar)] group-hover:text-[var(--accent)] transition-colors text-[var(--text-muted)]">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="font-sans font-sans text-xl font-bold text-[var(--text-primary)] mb-2">
              Drag & drop your contract here
            </h3>
            <p className="text-[var(--text-secondary)] mb-8">
              Supports PDF, DOCX (Max 50MB)
            </p>
            <button className="bg-[var(--bg-sidebar)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--bg-sidebar-hover)] transition-colors shadow-sm inline-flex items-center gap-2">
              Browse Files
            </button>
          </div>

          {error && (
            <div className="mt-6 w-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-sans font-bold text-sm">Analysis Error</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
      ) : isAnalyzing ? (
        <div className="pt-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin mb-4" />
          <h2 className="font-sans text-xl font-bold text-[var(--text-primary)]">Analyzing Contract...</h2>
          <p className="text-[var(--text-secondary)] mt-2">Our AI is reviewing {fileName} for risks and key clauses.</p>
        </div>
      ) : analysisResult ? (
        <div className="space-y-6">
          {/* Analysis Header */}
          <div className="bg-[var(--surface-glass)] backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-sans text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-[var(--accent)]" />{" "}
                {fileName}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Analyzed just now
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-sidebar)] text-white rounded-xl text-sm font-bold hover:bg-[var(--bg-sidebar-hover)] transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Export Report
              </button>

              {/* Risk Gauge */}
              <div className="flex items-center gap-4 bg-[var(--surface-hover)] p-4 rounded-2xl border border-[var(--border-light)]">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 36 36"
                  >
                    <path
                      className="text-[var(--border-default)]"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${analysisResult.riskScore > 70
                        ? "text-red-500"
                        : analysisResult.riskScore > 40
                          ? "text-amber-500"
                          : "text-emerald-500"
                        }`}
                      strokeWidth="3"
                      strokeDasharray={`${analysisResult.riskScore}, 100`}
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-lg font-bold text-[var(--text-primary)]">
                    {analysisResult.riskScore}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    Risk Score
                  </p>
                  <p className={`text-xs font-bold uppercase tracking-wider ${analysisResult.riskScore > 70
                    ? "text-red-500"
                    : analysisResult.riskScore > 40
                      ? "text-amber-500"
                      : "text-emerald-500"
                    }`}>
                    {analysisResult.riskLevel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Tabs */}
          <div className="bg-[var(--surface-glass)] backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden">
            <div className="flex overflow-x-auto custom-scrollbar border-b border-[var(--border-light)]">
              {[
                "Key Clauses",
                "Red Flags",
                "Missing Clauses",
                "Suggested Amendments",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAnalysisTab(tab)}
                  className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${analysisTab === tab
                    ? "border-[var(--accent)] text-[var(--text-primary)] bg-[var(--surface-hover)]/50"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]/30"
                    }`}
                >
                  {tab}
                  {tab === "Red Flags" && analysisResult && (
                    <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-[10px]">
                      {analysisResult.redFlags.length}
                    </span>
                  )}
                  {tab === "Missing Clauses" && analysisResult && (
                    <span className="ml-2 bg-amber-100 text-amber-600 py-0.5 px-2 rounded-full text-[10px]">
                      {analysisResult.missingClauses.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {analysisTab === "Red Flags" && (
                <div className="space-y-4">
                  {analysisResult.redFlags.length > 0 ? (
                    analysisResult.redFlags.map((flag, index) => (
                      <div key={index} className="bg-[var(--bg-surface)] border border-red-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-red-50/50 p-4 border-b border-red-100 flex items-start gap-3">
                          <div className="bg-red-100 p-1.5 rounded-lg shrink-0 mt-0.5">
                            <ShieldAlert className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-red-900">
                              {flag.clause} ({flag.issue})
                            </h4>
                            <p className="text-xs text-red-700/80 mt-1.5 leading-relaxed">
                              {flag.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[var(--text-secondary)]">No red flags identified.</div>
                  )}
                </div>
              )}

              {analysisTab === "Key Clauses" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-default)]">
                        <th className="pb-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                          Clause
                        </th>
                        <th className="pb-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                          Summary
                        </th>
                        <th className="pb-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">
                          Risk Level
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)]">
                      {analysisResult.keyClauses.map((clause, index) => (
                        <tr key={index} className="hover:bg-[var(--surface-hover)] transition-colors">
                          <td className="py-4 pr-4 font-bold text-[var(--text-primary)] text-sm">
                            {clause.clause}
                          </td>
                          <td className="py-4 pr-4 text-sm text-[var(--text-secondary)]">
                            {clause.summary}
                          </td>
                          <td className="py-4 text-right">
                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase ${clause.riskLevel === "High"
                              ? "bg-red-100 text-red-700"
                              : clause.riskLevel === "Medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                              }`}>
                              {clause.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {analysisTab === "Missing Clauses" && (
                <div className="space-y-3">
                  {analysisResult.missingClauses.length > 0 ? (
                    analysisResult.missingClauses.map((clause, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-[var(--surface-hover)] rounded-xl border border-[var(--border-default)]">
                        <div className="w-5 h-5 rounded border-2 border-[var(--border-default)] flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">
                            {clause.name}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {clause.explanation}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[var(--text-secondary)]">No missing standard clauses identified.</div>
                  )}
                </div>
              )}

              {analysisTab === "Suggested Amendments" && (
                <div className="space-y-6">
                  {analysisResult.suggestedAmendments.length > 0 ? (
                    analysisResult.suggestedAmendments.map((amendment, index) => {
                      const status = amendmentStates.get(index);
                      return (
                        <div
                          key={index}
                          className={`bg-[var(--bg-surface)] border-2 rounded-2xl overflow-hidden shadow-sm transition-all ${
                            status === "accepted"
                              ? "border-emerald-200 bg-emerald-50/30"
                              : status === "rejected"
                                ? "border-[var(--border-default)] bg-[var(--surface-hover)] opacity-60"
                                : "border border-[var(--border-default)]"
                          }`}
                        >
                          <div className={`p-4 border-b transition-all ${
                            status === "accepted"
                              ? "border-emerald-100 bg-emerald-50/50"
                              : status === "rejected"
                                ? "border-[var(--border-light)]"
                                : "border-[var(--border-light)] bg-[var(--surface-hover)]/50"
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`text-sm font-bold ${
                                  status === "rejected" ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                                }`}>
                                  {amendment.clause}
                                </h4>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                  {amendment.suggestion}
                                </p>
                              </div>
                              {status === "accepted" && (
                                <div className="ml-3 p-1.5 bg-emerald-100 rounded-lg flex-shrink-0">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>
                              )}
                              {status === "rejected" && (
                                <div className="ml-3 p-1.5 bg-[var(--border-default)] rounded-lg flex-shrink-0">
                                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="p-4">
                            <div className={`text-sm p-3 rounded-xl border mb-4 font-sans leading-relaxed ${
                              status === "accepted"
                                ? "bg-emerald-50 border-emerald-200 text-[var(--text-primary)]"
                                : status === "rejected"
                                  ? "bg-[var(--surface-hover)] border-[var(--border-default)] text-[var(--text-muted)]"
                                  : "bg-[var(--surface-hover)] border-[var(--border-default)] text-[var(--text-primary)]"
                            }`}>
                              &quot;{amendment.amendedText}&quot;
                            </div>
                            {!status ? (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleAmendmentAction(index, "accepted")}
                                  className="flex-1 bg-[var(--bg-sidebar)] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[var(--bg-sidebar-hover)] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleAmendmentAction(index, "rejected")}
                                  className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] text-xs font-bold py-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors shadow-sm"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAmendmentAction(index, null)}
                                className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] text-xs font-bold py-2 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                              >
                                Clear Decision
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-[var(--text-secondary)]">No amendments suggested.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* My Contracts Drawer */}
      {showMyContracts && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-[var(--bg-sidebar)]/20 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMyContracts(false)}
          />
          <div className="relative w-80 bg-[var(--bg-surface)] backdrop-blur-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-white/40">
            <div className="p-4 border-b border-[var(--border-default)]/50 flex items-center justify-between bg-[var(--surface-glass)]">
              <h3 className="font-sans font-bold text-[var(--text-primary)] flex items-center gap-2">
                <History className="w-4 h-4" /> My Contracts
              </h3>
              <button
                onClick={() => setShowMyContracts(false)}
                className="p-1 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-secondary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {savedAnalyses.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)] text-sm">No contract analyses yet. Upload a contract to get started.</div>
              ) : savedAnalyses.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => { loadSavedAnalysis(doc); }}
                  className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)]/50 cursor-pointer hover:border-[var(--accent)] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <p className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-tight">
                      {doc.name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${doc.score > 70
                        ? "bg-red-100 text-red-700"
                        : doc.score > 40
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                        }`}
                    >
                      {doc.score}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{new Date(doc.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
