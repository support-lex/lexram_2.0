"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Landmark,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  Circle,
  FileText,
  Network,
  ArrowUpRight,
} from "lucide-react";
import type { Message } from "../types";

type MessageBubbleProps = {
  message: Message;
  userInitials?: string;
  formatDate: (timestamp: string) => string;
  expandedWorking: boolean;
  expandedThinkingTokens: boolean;
  onToggleWorking: () => void;
  onToggleThinkingTokens: () => void;
  onOpenAuthorities: (index: number) => void;
  onOpenEditor: () => void;
  onOpenWorkflow?: () => void;
  onQuerySelect: (query: string) => void;
};

const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="font-sans text-[22px] font-semibold mt-5 mb-2 text-[var(--text-primary)]">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="font-sans text-[18px] font-semibold mt-4 mb-2 text-[var(--text-primary)]">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="font-sans text-[15px] font-semibold mt-3 mb-1 text-[var(--text-primary)]">{children}</h3>
  ),
  p: ({ children }: any) => <span className="leading-7">{children}</span>,
  ul: ({ children }: any) => (
    <ul className="my-2.5 pl-5 space-y-1 list-disc">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-2.5 pl-5 space-y-1 list-decimal">{children}</ol>
  ),
  li: ({ children }: any) => <li className="leading-7">{children}</li>,
  strong: ({ children }: any) => (
    <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
  ),
  em: ({ children }: any) => <em className="italic">{children}</em>,
  pre: ({ children }: any) => (
    <div className="my-4 rounded-xl overflow-hidden border border-[var(--border-default)]">
      <div className="flex items-center px-3 py-1.5 bg-[var(--bg-sidebar)] text-[11px] text-[var(--text-on-sidebar)]">
        <span className="font-mono opacity-60">Code</span>
      </div>
      <pre className="p-4 bg-[var(--surface-hover)]/50 overflow-x-auto text-sm font-mono leading-relaxed">
        {children}
      </pre>
    </div>
  ),
  code: ({ children }: any) => (
    <code className="px-1 py-0.5 rounded bg-[var(--surface-hover)] text-[0.9em] font-mono">
      {children}
    </code>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-[var(--accent)]/30 pl-4 italic text-[var(--text-secondary)] my-3 bg-[var(--surface-hover)]/30 py-2 rounded-r-lg">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-[var(--border-default)]">
      <table className="min-w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-[var(--surface-hover)]">{children}</thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="[&>tr:nth-child(even)]:bg-[var(--surface-hover)]/50">{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="border-b border-[var(--border-default)] last:border-b-0">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)]">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2 align-top text-[var(--text-secondary)]">{children}</td>
  ),
};

function WorkingSteps({
  steps,
}: {
  steps: Array<{ label: string; state: "done" | "active" | "pending"; subtext?: string }>;
}) {
  return (
    <div className="px-3 py-2.5 space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <div className="pt-0.5 flex-shrink-0">
            {step.state === "done" ? (
              <Check className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            ) : step.state === "active" ? (
              <Loader2 className="w-3.5 h-3.5 text-[var(--text-muted)] animate-spin" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            )}
          </div>
          <div>
            <div
              className={`text-sm font-medium ${step.state === "pending" ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}
            >
              {step.label}
            </div>
            {step.subtext && (
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{step.subtext}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MessageBubble({
  message,
  userInitials = "U",
  formatDate,
  expandedWorking,
  expandedThinkingTokens,
  onToggleWorking,
  onToggleThinkingTokens,
  onOpenAuthorities,
  onOpenEditor,
  onOpenWorkflow,
  onQuerySelect,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ── User message (right-aligned) ──────────────────────────────────────────
  if (message.role === "user") {
    return (
      <div className="flex items-end justify-end gap-2.5 group">
        <div className="max-w-[75%] flex flex-col items-end gap-1">
          <div className="bg-[var(--accent)] text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
            <p className="text-[14px] leading-6 whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <span className="text-[11px] text-[var(--text-muted)]">
              {formatDate(message.timestamp)}
            </span>
            <button
              onClick={() => handleCopy(message.content)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center gap-0.5"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mb-5">
          {userInitials}
        </div>
      </div>
    );
  }

  // ── AI message (left-aligned) ─────────────────────────────────────────────
  const response = message.response;
  if (!response) return null;

  const contentText = response.streamText || response.shortAnswer;

  const renderContentWithCitations = (content: string, citationStart = 0): ReactNode => {
    const blocks = content
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);

    let citIdx = citationStart;
    return blocks.map((block, bi) => {
      const isHeading = /^#{1,6}\s/.test(block);
      const hasCitation = !isHeading && citIdx < response.authorities.length;
      const currentCitIdx = hasCitation ? citIdx++ : null;

      return (
        <div key={`${message.id}-b${bi}`} className="mb-3.5 leading-7 text-[var(--text-primary)]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {block}
          </ReactMarkdown>
          {currentCitIdx !== null && (
            <button
              onClick={() => onOpenAuthorities(currentCitIdx)}
              className="ml-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-[var(--accent)]/10 text-[9px] font-bold text-[var(--accent)] align-super hover:bg-[var(--accent)] hover:text-white hover:scale-110 transition-all duration-150 cursor-pointer"
              title={`${currentCitIdx + 1}. ${response.authorities[currentCitIdx]?.caseName}`}
            >
              {currentCitIdx + 1}
            </button>
          )}
        </div>
      );
    });
  };

  const streamParagraphCount = contentText
    .split(/\n\s*\n/)
    .filter((b) => b.trim() && !/^#{1,6}\s/.test(b.trim())).length;

  return (
    <div className="flex items-start gap-2.5 group">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-[var(--bg-sidebar)] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-1">
        L
      </div>

      <div className="flex-1 min-w-0 max-w-[90%]">
        {/* Name + timestamp */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">LexRam</span>
          <span className="text-[11px] text-[var(--text-muted)]">
            {formatDate(message.timestamp)}
          </span>
        </div>

        {/* Thinking trace */}
        {response.thinkingText && (
          <div className="mb-3 border border-dashed border-[var(--border-default)] rounded-xl bg-[var(--surface-hover)]/50 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--accent)]/20" />
            <button
              onClick={onToggleWorking}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] inline-flex items-center justify-between"
            >
              <span>Working…</span>
              {expandedWorking ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {expandedWorking && (
              <div className="pb-2">
                <WorkingSteps
                  steps={[
                    { label: "Assessing query", state: "done" },
                    { label: "Planning for analysis", state: "done" },
                    { label: "Researching", state: "done" },
                    { label: "Evaluating and drafting", state: "done" },
                  ]}
                />
                <div className="mx-3 mt-1 border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface)]">
                  <button
                    onClick={onToggleThinkingTokens}
                    className="w-full px-3 py-2 text-left text-[11px] font-semibold text-[var(--text-secondary)] inline-flex items-center justify-between"
                  >
                    <span>Thinking tokens</span>
                    {expandedThinkingTokens ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  {expandedThinkingTokens && (
                    <pre className="px-3 pb-3 text-[11px] font-mono text-[var(--text-secondary)] whitespace-pre-wrap leading-5 max-h-48 overflow-y-auto custom-scrollbar">
                      {response.thinkingText}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main content bubble */}
        <div className="rounded-2xl rounded-tl-sm bg-[var(--bg-surface)] border border-[var(--border-light)] shadow-sm px-5 py-4 text-[15px]">
          {renderContentWithCitations(contentText, 0)}

          {response.reasoning && contentText !== response.reasoning && (
            <>
              <hr className="my-3 border-[var(--border-light)]" />
              <div className="text-[var(--text-secondary)] text-[14px]">
                {renderContentWithCitations(response.reasoning, streamParagraphCount)}
              </div>
            </>
          )}

          {/* Artifact reference buttons */}
          {(response.authorities.length > 0 ||
            response.workflowSteps.length > 0 ||
            response.draftReady) && (
            <>
              <hr className="my-3 border-[var(--border-default)]" />
              <div className="flex flex-wrap gap-2">
                {response.workflowSteps.length > 0 && onOpenWorkflow && (
                  <button
                    onClick={onOpenWorkflow}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-hover)] ring-1 ring-[var(--border-default)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:ring-[var(--text-primary)]/30 hover:shadow-sm transition-all"
                  >
                    <Network className="w-3.5 h-3.5" />
                    Mind Map
                    <span className="ml-0.5 opacity-60">{response.workflowSteps.length}</span>
                    <ArrowUpRight className="w-3 h-3 ml-0.5 opacity-50" />
                  </button>
                )}
                {response.authorities.length > 0 && (
                  <button
                    onClick={() => onOpenAuthorities(0)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-500/15 hover:ring-amber-500/30 transition-all"
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    Authorities
                    <span className="ml-0.5 opacity-70">{response.authorities.length}</span>
                    <ArrowUpRight className="w-3 h-3 ml-0.5 opacity-50" />
                  </button>
                )}
                {response.draftReady && (
                  <button
                    onClick={onOpenEditor}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-500/15 hover:ring-blue-500/30 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Draft Document
                    <ArrowUpRight className="w-3 h-3 ml-0.5 opacity-50" />
                  </button>
                )}
              </div>
            </>
          )}

          {/* Metadata row */}
          {response.authorities.length > 0 && (
            <>
              <hr className="my-3 border-[var(--border-light)]" />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 ring-1 ring-amber-500/20 px-2.5 py-0.5 text-[11px] text-amber-700">
                  <Landmark className="w-3 h-3" />
                  {response.authorities.length} cited
                </span>
                {response.authorities.slice(0, 3).map((a, i) => (
                  <button
                    key={`${a.citation}-${i}`}
                    onClick={() => onOpenAuthorities(i)}
                    className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--surface-hover)] px-2.5 py-0.5 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-colors max-w-[140px] truncate"
                  >
                    {a.caseName}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions row (shown on hover) */}
        <div className="flex items-center gap-1.5 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => handleCopy(contentText)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            Copy
          </button>
          {response.draftReady && (
            <button
              onClick={onOpenEditor}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <FileText className="w-3 h-3" /> Open in editor
            </button>
          )}
        </div>

        {/* Follow-up suggestions */}
        {response.nextQuestions.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] font-medium text-[var(--text-muted)] mb-1.5 px-1">
              Suggested follow-ups
            </div>
            <div className="flex flex-wrap gap-1.5">
              {response.nextQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onQuerySelect(q)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-hover)] px-3 py-1 text-[12px] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)] transition-colors max-w-[280px]"
                >
                  <Lightbulb className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                  <span className="truncate">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
