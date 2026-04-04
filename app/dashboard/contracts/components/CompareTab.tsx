'use client';

import {
  FileText,
  FileSignature,
  AlertTriangle,
  Plus,
  X,
  AlertCircle,
  Loader2,
  SplitSquareHorizontal,
  FileWarning,
} from 'lucide-react';
import type { CompareResult } from '@/app/dashboard/contracts/types';
import React from 'react';

interface CompareTabProps {
  compareFile1: File | null;
  compareFile2: File | null;
  isComparing: boolean;
  compareResult: CompareResult | null;
  compareError: string | null;
  compareInput1Ref: React.RefObject<HTMLInputElement | null>;
  compareInput2Ref: React.RefObject<HTMLInputElement | null>;
  handleFile1Upload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFile2Upload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCompare: () => void;
  resetCompare: () => void;
  triggerFile1: () => void;
  triggerFile2: () => void;
}

export function CompareTab({
  compareFile1,
  compareFile2,
  isComparing,
  compareResult,
  compareError,
  compareInput1Ref,
  compareInput2Ref,
  handleFile1Upload,
  handleFile2Upload,
  handleCompare,
  resetCompare,
  triggerFile1,
  triggerFile2,
}: CompareTabProps) {
  return (
    <div className="pt-8 md:pt-16">
      {!compareResult ? (
        <>
          <h1 className="font-sans text-3xl font-sans font-bold text-[var(--text-primary)] mb-2 text-center">
            Compare Contracts
          </h1>
          <p className="text-[var(--text-secondary)] text-center mb-8">
            Upload two versions of a contract to see the differences.
          </p>

          {compareError && (
            <div className="mb-8 w-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-sans font-bold text-sm">Comparison Error</h3>
                <p className="text-sm mt-1">{compareError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => triggerFile1()}
              className="bg-[var(--surface-glass)] backdrop-blur-xl border-2 border-dashed border-[var(--border-default)] rounded-3xl p-10 text-center hover:border-[var(--accent)] hover:bg-[var(--surface-glass)] transition-all cursor-pointer shadow-sm"
            >
              <input
                type="file"
                ref={compareInput1Ref}
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFile1Upload}
              />
              <div className="w-16 h-16 bg-[var(--surface-hover)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-sans font-sans text-lg font-bold text-[var(--text-primary)] mb-1">
                Original Version
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                {compareFile1 ? compareFile1.name : "Upload V1"}
              </p>
              <button className="bg-[var(--surface-hover)] text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[var(--surface-hover)] transition-colors">
                {compareFile1 ? "Change File" : "Browse"}
              </button>
            </div>

            <div
              onClick={() => triggerFile2()}
              className="bg-[var(--surface-glass)] backdrop-blur-xl border-2 border-dashed border-[var(--border-default)] rounded-3xl p-10 text-center hover:border-[var(--accent)] hover:bg-[var(--surface-glass)] transition-all cursor-pointer shadow-sm"
            >
              <input
                type="file"
                ref={compareInput2Ref}
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFile2Upload}
              />
              <div className="w-16 h-16 bg-[var(--surface-hover)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
                <FileSignature className="w-8 h-8" />
              </div>
              <h3 className="font-sans font-sans text-lg font-bold text-[var(--text-primary)] mb-1">
                Revised Version
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                {compareFile2 ? compareFile2.name : "Upload V2"}
              </p>
              <button className="bg-[var(--surface-hover)] text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[var(--surface-hover)] transition-colors">
                {compareFile2 ? "Change File" : "Browse"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleCompare}
              disabled={!compareFile1 || !compareFile2 || isComparing}
              className="bg-[var(--bg-sidebar)] text-white px-8 py-3 rounded-xl font-bold hover:bg-[var(--bg-sidebar-hover)] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <SplitSquareHorizontal className="w-5 h-5" /> Compare Now
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Comparison Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-sans text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                <SplitSquareHorizontal className="w-6 h-6 text-[var(--accent)]" />
                Comparison Results
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {compareFile1?.name} vs {compareFile2?.name}
              </p>
            </div>
            <button
              onClick={resetCompare}
              className="px-4 py-2 bg-[var(--bg-sidebar)] text-white rounded-xl font-bold hover:bg-[var(--bg-sidebar-hover)] transition-colors"
            >
              Start New Comparison
            </button>
          </div>

          {/* Summary */}
          {compareResult.summary && (
            <div className="bg-[var(--surface-glass)] backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6">
              <h3 className="font-sans font-sans text-lg font-bold text-[var(--text-primary)] mb-2">Summary</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">{compareResult.summary}</p>
            </div>
          )}

          {/* Key Differences */}
          {compareResult.keyDifferences && compareResult.keyDifferences.length > 0 && (
            <div className="bg-[var(--surface-glass)] backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6">
              <h3 className="font-sans font-sans text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Key Differences ({compareResult.keyDifferences.length})
              </h3>
              <div className="space-y-3">
                {compareResult.keyDifferences.map((diff: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-[var(--text-primary)]">{diff}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Added Clauses */}
          {compareResult.addedClauses && compareResult.addedClauses.length > 0 && (
            <div className="bg-[var(--surface-glass)] backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6">
              <h3 className="font-sans font-sans text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                Added Clauses ({compareResult.addedClauses.length})
              </h3>
              <div className="space-y-3">
                {compareResult.addedClauses.map((clause: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-emerald-900">{clause}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed Clauses */}
          {compareResult.removedClauses && compareResult.removedClauses.length > 0 && (
            <div className="bg-[var(--surface-glass)] backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6">
              <h3 className="font-sans font-sans text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" />
                Removed Clauses ({compareResult.removedClauses.length})
              </h3>
              <div className="space-y-3">
                {compareResult.removedClauses.map((clause: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-red-900 line-through">{clause}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modified Terms */}
          {compareResult.modifiedTerms && compareResult.modifiedTerms.length > 0 && (
            <div className="bg-[var(--surface-glass)] backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6">
              <h3 className="font-sans font-sans text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-blue-500" />
                Modified Terms ({compareResult.modifiedTerms.length})
              </h3>
              <div className="space-y-4">
                {compareResult.modifiedTerms.map((mod: any, i: number) => (
                  <div key={i} className="border border-[var(--border-default)] rounded-lg overflow-hidden">
                    <div className="bg-[var(--surface-hover)] p-3 border-b border-[var(--border-light)]">
                      <p className="text-sm font-bold text-[var(--text-primary)]">{mod.term}</p>
                    </div>
                    <div className="p-4 space-y-2">
                      <div>
                        <p className="text-xs text-red-600 font-bold mb-1">Original</p>
                        <p className="text-sm text-[var(--text-secondary)] bg-red-50 p-2 rounded border border-red-200">
                          {mod.original}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600 font-bold mb-1">Revised</p>
                        <p className="text-sm text-[var(--text-secondary)] bg-emerald-50 p-2 rounded border border-emerald-200">
                          {mod.revised}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
