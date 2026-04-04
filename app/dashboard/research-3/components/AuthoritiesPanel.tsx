"use client";

import { useState } from "react";
import { ArrowUpRight, Copy, Plus, Landmark, FileText } from "lucide-react";
import { EditorArtifact } from "./EditorArtifact";
import type { ArtifactTab, LegalAnswer } from "../types";


type AuthoritiesPanelProps = {
  showArtifacts: boolean;
  mobilePane: "chat" | "authorities";
  artifactTab: ArtifactTab;
  setArtifactTab: (tab: ArtifactTab) => void;
  lastResponse?: LegalAnswer;
  currentQuestion?: string;
  workflowCount: number;
  authorityCount: number;
  selectedAuthorityIndex: number | null;
  onSelectAuthority: (index: number | null) => void;
  liveEditorContent?: string;
  isDraftArtifactStreaming?: boolean;
  sessionId?: string | null;
  width?: number;
};


export default function AuthoritiesPanel({
  showArtifacts,
  mobilePane,
  artifactTab,
  setArtifactTab,
  lastResponse,
  currentQuestion,
  workflowCount,
  authorityCount,
  selectedAuthorityIndex,
  onSelectAuthority,
  liveEditorContent,
  isDraftArtifactStreaming = false,
  sessionId,
  width = 50,
}: AuthoritiesPanelProps) {
  const hasWorkflow = (lastResponse?.workflowSteps || []).length > 0;
  const hasAuthorities = (lastResponse?.authorities || []).length > 0;
  const editorContent = liveEditorContent || lastResponse?.draftReady || "";
  const hasEditor = Boolean(editorContent.trim());

  if (!showArtifacts || (!hasWorkflow && !hasAuthorities && !hasEditor)) return null;

  return (
    <aside
      className={`w-full h-full border-t lg:border-t-0 lg:border-l border-[var(--border-default)] bg-[var(--surface-glass)] backdrop-blur-2xl flex-col ${mobilePane === "chat" ? "hidden lg:flex" : "flex"}`}
      style={{
        flexBasis: `${width}%`,
        minWidth: '350px',
      }}
    >
      <div className="px-4 py-3 border-b border-[var(--border-default)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 rounded-xl bg-[var(--surface-hover)] p-1 border border-[var(--border-default)]">
          {hasWorkflow && (
            <button
              onClick={() => setArtifactTab("workflow")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${artifactTab === "workflow" ? "bg-[var(--bg-sidebar)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
            >
              Mind map {workflowCount > 0 && <span className="ml-0.5 opacity-70">({workflowCount})</span>}
            </button>
          )}
          {hasAuthorities && (
            <button
              onClick={() => setArtifactTab("authorities")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${artifactTab === "authorities" ? "bg-[var(--bg-sidebar)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
            >
              Authorities {authorityCount > 0 && <span className="ml-0.5 opacity-70">({authorityCount})</span>}
            </button>
          )}
          {hasEditor && (
            <button
              onClick={() => setArtifactTab("editor")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${artifactTab === "editor" ? "bg-[var(--bg-sidebar)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
            >
              Editor
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasEditor && artifactTab !== "editor" && (
            <button
              onClick={() => setArtifactTab("editor")}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20 hover:bg-blue-500/15 hover:ring-blue-500/30 inline-flex items-center gap-1.5 font-semibold text-blue-700 transition-all"
            >
              <FileText className="w-3.5 h-3.5" /> View in Editor
            </button>
          )}
        </div>
      </div>

      <div className={`flex-1 min-h-0 ${artifactTab === "editor" ? "flex flex-col" : "overflow-y-auto p-5"}`}>
        {artifactTab === "workflow" && (
          <div className="max-w-[560px] mx-auto space-y-6">
            {(lastResponse?.workflowSteps || []).length === 0 && (
              <div className="py-16 text-center">
                <div className="text-sm font-medium text-[var(--text-secondary)]">No mind map yet</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Mind map appears only when workflow steps are generated.</div>
              </div>
            )}
            {(lastResponse?.workflowSteps || []).length > 0 && (
              <>
                <div className="text-center">
                  <div className="inline-flex max-w-[360px] items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm">
                    {currentQuestion || "Answer map"}
                  </div>
                </div>
                <div className="w-px h-12 bg-gradient-to-b from-[var(--border-default)] to-transparent mx-auto -mt-2" />
                <div className="grid gap-5 sm:grid-cols-2">
                  {(lastResponse?.workflowSteps || []).map((step, i) => (
                    <div key={i} className="relative rounded-2xl border-2 border-[var(--border-default)] bg-gradient-to-br from-[var(--bg-surface)] to-[var(--surface-hover)] p-5 shadow-md hover:shadow-lg transition-all">
                      <div className="absolute -top-4 left-5 inline-flex items-center justify-center min-w-7 h-7 rounded-full bg-[var(--bg-sidebar)] text-white text-xs font-bold shadow-md">
                        {i + 1}
                      </div>
                      <div className="text-base font-bold text-[var(--text-primary)] mt-3 leading-snug">{step.title}</div>
                      {step.detail && <div className="text-sm text-[var(--text-secondary)] mt-3 leading-6 font-medium">{step.detail}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {artifactTab === "authorities" && (
          <div className="space-y-3 stagger-children">
            {(lastResponse?.authorities || []).length === 0 && (
              <div className="py-16 text-center">
                <Landmark className="w-10 h-10 mx-auto text-[var(--border-default)] mb-3" />
                <div className="text-sm font-medium text-[var(--text-secondary)]">No authorities cited yet</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Ask a question to see relevant case law</div>
              </div>
            )}
            {(lastResponse?.authorities || []).map((a, i) => (
              <div
                key={i}
                onClick={() => onSelectAuthority(i)}
                className={`group rounded-xl ring-1 ring-[var(--border-default)] p-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:ring-[var(--accent)]/30 ${
                  a.treatment === "followed"
                    ? "bg-gradient-to-br from-[var(--bg-surface)] to-emerald-50/10"
                    : a.treatment === "distinguished"
                      ? "bg-gradient-to-br from-[var(--bg-surface)] to-amber-50/10"
                      : "bg-[var(--bg-surface)]"
                } ${selectedAuthorityIndex === i ? "ring-2 ring-[var(--accent)] ring-offset-2" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-base font-bold text-[var(--text-primary)] hover:underline cursor-pointer inline-flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-[var(--bg-sidebar)] text-white text-xs font-bold">{i + 1}</span>
                      {a.caseName}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1 mb-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono">{a.citation}</span>
                      <span className="opacity-40">&#183;</span>
                      <span>{a.court}</span>
                      <span className="opacity-40">&#183;</span>
                      <span>{a.year}</span>
                    </div>
                    <p className="text-base text-[var(--text-primary)] leading-relaxed line-clamp-3 font-medium">{a.proposition}</p>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    a.treatment === "followed"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : a.treatment === "distinguished"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${a.treatment === "followed" ? "bg-emerald-500" : a.treatment === "distinguished" ? "bg-amber-500" : "bg-[var(--text-muted)]"}`} />
                    {a.treatment}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 pt-3 border-t border-[var(--border-light)] opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button className="px-3 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Save
                  </button>
                  <button className="px-3 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5 transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <a href={a.linkHint || `https://indiankanoon.org/search/?formInput=${encodeURIComponent(`${a.caseName} ${a.citation}`)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg hover:bg-[var(--accent)]/10 text-xs font-medium text-[var(--accent)] inline-flex items-center gap-1.5 transition-colors">
                    Open source <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {artifactTab === "editor" && (
          <EditorArtifact
            content={editorContent || "Draft artifact will appear here once generated."}
            isStreaming={isDraftArtifactStreaming}
            storageKey={sessionId ? `lexram-research3-editor-${sessionId}` : undefined}
          />
        )}
      </div>
    </aside>
  );
}
