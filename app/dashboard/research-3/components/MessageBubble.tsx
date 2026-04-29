"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Copy,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  Circle,
  FileText,
  Network,
  Landmark,
  RefreshCw,
  Share2,
  Pin,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import type { Message } from "../types";
import InlineBlock from "./inline/InlineBlock";
import MermaidDiagram from "./inline/MermaidDiagram";
import InlineAuthorities from "./inline/InlineAuthorities";
import InlineDraftEditor from "./inline/InlineDraftEditor";
import CitationBox from "./CitationBox";
import ProceduralTimeline from "./ProceduralTimeline";

type MessageBubbleProps = {
  message: Message;
  userInitials?: string;
  formatDate: (timestamp: string) => string;
  expandedWorking: boolean;
  expandedThinkingTokens: boolean;
  onToggleWorking: () => void;
  onToggleThinkingTokens: () => void;
  onQuerySelect: (query: string) => void;
  /** Optional: still used by the page-level paywall flow if a fallback panel exists. */
  onOpenAuthorities?: (index: number) => void;
  onOpenEditor?: () => void;
  onOpenWorkflow?: () => void;
  /** Called when the user clicks "Proceed to Draft" inside a plan block. */
  onProceedWithDraft?: () => void;
  /** Extra className forwarded from ChatThread (e.g. entry animation). */
  className?: string;
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
  pre: ({ children }: any) => {
    // If the fenced block is mermaid, render it unwrapped — the code renderer
    // below returns a MermaidDiagram and doesn't need the "Code" chrome.
    const child = Array.isArray(children) ? children[0] : children;
    if (child?.props?.className?.includes("mermaid")) return <>{children}</>;
    return (
      <div className="my-4 rounded-xl overflow-hidden border border-[var(--border-default)]">
        <div className="flex items-center px-3 py-1.5 bg-[var(--bg-sidebar)] text-[11px] text-[var(--text-on-sidebar)]">
          <span className="font-mono opacity-60">Code</span>
        </div>
        <pre className="p-4 bg-[var(--surface-hover)]/50 overflow-x-auto text-sm font-mono leading-relaxed">
          {children}
        </pre>
      </div>
    );
  },
  code: ({ children, className }: any) => {
    // Fenced ```mermaid blocks — render as a live diagram instead of raw text.
    if (className?.includes("mermaid")) {
      return <MermaidDiagram source={String(children).trimEnd()} />;
    }
    return (
      <code className="px-1 py-0.5 rounded bg-[var(--surface-hover)] text-[0.9em] font-mono">
        {children}
      </code>
    );
  },
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
  onProceedWithDraft,
  className,
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
      <div className={`flex items-end justify-end gap-2 sm:gap-2.5 group ${className ?? ""}`}>
        <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end gap-1">
          <div className="bg-[var(--accent)] text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
            <p className="text-[14px] leading-6 whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] text-[var(--text-muted)]">
              {formatDate(message.timestamp)}
            </span>
            <button
              onClick={() => handleCopy(message.content)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
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

  const inlineAuthorities = (() => {
    const fromBlocks = response.uiBlocks?.find((b) => b.type === "authorities");
    if (fromBlocks && fromBlocks.type === "authorities") return fromBlocks.data;
    return response.authorities ?? [];
  })();

  // Custom <cite>N</cite> renderer for LexRam responses. The backend ships
  // markers like `<cite>1</cite>` or `<cite>2,3,4,5</cite>` in the prose; we
  // turn each number into a clickable superscript pill that scrolls to the
  // matching authority card in the right-side panel.
  const renderCite = (props: any) => {
    const inner = Array.isArray(props.children) ? props.children.join("") : String(props.children ?? "");
    const nums = inner
      .split(/[,\s]+/)
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => Number.isFinite(n) && n > 0);
    if (nums.length === 0) return null;
    return (
      <span className="inline-flex gap-0.5 align-super">
        {nums.map((n: number) => {
          const idx = n - 1;
          const auth = inlineAuthorities[idx];
          return (
            <button
              key={`cite-${n}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (auth && onOpenAuthorities) onOpenAuthorities(idx);
              }}
              className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-[var(--accent)]/10 text-[9px] font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white hover:scale-110 transition-all duration-150 cursor-pointer"
              title={auth ? `${n}. ${auth.caseName}` : `Source ${n}`}
            >
              {n}
            </button>
          );
        })}
      </span>
    );
  };

  const liveMarkdownComponents = { ...markdownComponents, cite: renderCite };

  // ── "Quick results from the web" preview cards ──────────────────────────
  // Show up to 2 source cards with favicon + title + snippet + host above
  // the AI answer, mirroring the Gemini / ChatGPT search-grounded layout.
  const webPreviews = inlineAuthorities
    .filter((a) => !!a.linkHint)
    .slice(0, 2);
  const getHost = (url: string): string => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  };
  const getFavicon = (url: string, size = 32): string => {
    const host = getHost(url);
    return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=${size}` : "";
  };

  // The text may now contain inline `<cite>N</cite>` tags from the LexRam
  // backend. Use rehype-raw so ReactMarkdown parses HTML, and route `<cite>`
  // through our custom renderer above. If the backend doesn't ship cite tags,
  // this code path is identical to plain markdown.
  const hasInlineCites = /<cite>[\s\d,\s]*<\/cite>/i.test(contentText);

  const renderContentWithCitations = (content: string, _citationStart = 0): ReactNode => {
    void _citationStart;
    const blocks = content
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);

    return blocks.map((block, bi) => (
      <div key={`${message.id}-b${bi}`} className="mb-3.5 leading-7 text-[var(--text-primary)]">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={hasInlineCites ? [rehypeRaw] : undefined}
          components={liveMarkdownComponents}
        >
          {block}
        </ReactMarkdown>
      </div>
    ));
  };

  const streamParagraphCount = contentText
    .split(/\n\s*\n/)
    .filter((b) => b.trim() && !/^#{1,6}\s/.test(b.trim())).length;

  return (
    <div className={`flex items-start gap-2 sm:gap-2.5 group ${className ?? ""}`}>
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-[var(--bg-sidebar)] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-1">
        L
      </div>

      <div className="flex-1 min-w-0">
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

        {/* Quick results from the web — Gemini/ChatGPT-style preview cards */}
        {webPreviews.length > 0 && (
          <div className="mb-3">
            <div className="text-[13px] text-[var(--text-secondary)] mb-2">
              Quick results from the web:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {webPreviews.map((a, i) => {
                const host = getHost(a.linkHint!);
                const favicon = getFavicon(a.linkHint!, 32);
                return (
                  <a
                    key={`web-${i}`}
                    href={a.linkHint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl border border-[var(--border-light)] bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] hover:border-[var(--border-default)] transition-colors p-3.5 group min-w-0"
                  >
                    <div className="text-[13px] font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug mb-1.5">
                      {a.caseName}
                    </div>
                    <div className="text-[12px] text-[var(--text-secondary)] line-clamp-2 leading-snug mb-2.5">
                      {a.proposition}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-[var(--text-muted)]">
                      {favicon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={favicon}
                          alt=""
                          width={14}
                          height={14}
                          className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                        />
                      )}
                      <span className="truncate font-medium text-[var(--text-secondary)]">
                        {host || a.court}
                      </span>
                      <span className="opacity-40">·</span>
                      <span className="truncate">{a.linkHint}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* 2-column row: answer (+ procedural timeline + draft + actions) on
            the left, dark Authorities card pinned on the right. The whole row
            scrolls together inside ChatThread — no separate scroll panel. On
            screens narrower than lg, the right column stacks below the bubble. */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-start">
        <div className="flex-1 min-w-0">

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

          {/* ── Draft-mode fallback warning ─────────────────────────────── */}
          {/* User picked Draft mode but backend returned research-style output
              instead of a drafted document. Surface it honestly rather than
              faking a draft in the editor. */}
          {message.mode === "draft" &&
            !(response.uiBlocks ?? []).some((b) => b.type === "draft") && (
              <div className="mt-3 rounded-lg border border-amber-300/60 bg-amber-50/60 px-3 py-2.5 flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 text-[10px] font-bold">!</span>
                <div className="text-[12px] text-amber-900 leading-relaxed">
                  <strong className="font-semibold">Draft not generated.</strong> The
                  server returned research output instead of a drafted document.
                  Try a more specific prompt, e.g.&nbsp;
                  <em>
                    "Draft a bail application for [accused name] in FIR [no.] PS
                    [station] under Section 302 BNS."
                  </em>
                </div>
              </div>
            )}

          {/* ── Inline UI blocks (model-driven, only when present) ───────── */}
          {response.uiBlocks && response.uiBlocks.length > 0 && (
            <div className="mt-2">
              {response.uiBlocks.map((block, bi) => {
                if (block.type === "mindmap") {
                  return (
                    <InlineBlock
                      key={`mm-${bi}`}
                      icon={<Network className="w-3.5 h-3.5" />}
                      label="View Diagram"
                      defaultOpen={false}
                    >
                      <MermaidDiagram source={block.data} />
                    </InlineBlock>
                  );
                }
                if (block.type === "authorities") {
                  return (
                    <InlineBlock
                      key={`auth-${bi}`}
                      icon={<Landmark className="w-3.5 h-3.5" />}
                      label="View Authorities"
                      count={block.data.length}
                      defaultOpen={true}
                    >
                      <InlineAuthorities authorities={block.data} />
                    </InlineBlock>
                  );
                }
                if (block.type === "plan") {
                  return (
                    <div key={`plan-${bi}`} className="mt-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--bg-surface)] overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--surface-hover)]">
                        <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">Drafting Plan</span>
                      </div>
                      <div className="px-5 py-4 text-sm text-[var(--text-secondary)] leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                          {block.data}
                        </ReactMarkdown>
                      </div>
                      <div className="px-5 pb-5">
                        <button
                          type="button"
                          onClick={() => onProceedWithDraft?.()}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
                        >
                          Proceed to Draft
                        </button>
                      </div>
                    </div>
                  );
                }
                if (block.type === "draft") {
                  return (
                    <InlineBlock
                      key={`draft-${bi}`}
                      icon={<FileText className="w-3.5 h-3.5" />}
                      label="View Draft"
                      defaultOpen={false}
                    >
                      <InlineDraftEditor
                        content={block.data}
                        storageKey={`lexram-research3-editor-${message.id}`}
                      />
                    </InlineBlock>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Procedural timeline — cream card with gold connector line. Renders
            when the answer has structured workflow steps (procedural flow). */}
        {response.workflowSteps && response.workflowSteps.length > 0 && (
          <ProceduralTimeline steps={response.workflowSteps} title="Procedural Timeline" />
        )}

        {/* Citations are no longer rendered inline — they live in the right
            side panel (AuthoritiesSidePanel) keyed to the selected/latest AI
            message. The inline `<cite>N</cite>` superscripts in the prose
            still scroll-to / select the matching authority on click. */}

        {/* Hover toolbar — copy, regenerate, share, pin, thumbs */}
        <div className="flex items-center gap-0.5 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => handleCopy(contentText)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            Copy
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Regenerate"
          >
            <RefreshCw className="w-3 h-3" /> Redo
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Share"
          >
            <Share2 className="w-3 h-3" />
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Pin to matter"
          >
            <Pin className="w-3 h-3" />
          </button>
          <span className="w-px h-3.5 bg-[var(--border-default)] mx-0.5" />
          <button
            className="inline-flex items-center rounded-lg p-1 text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Good answer"
          >
            <ThumbsUp className="w-3 h-3" />
          </button>
          <button
            className="inline-flex items-center rounded-lg p-1 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Bad answer"
          >
            <ThumbsDown className="w-3 h-3" />
          </button>
        </div>

        {/* Follow-up suggestion chips — categorized style */}
        {response.nextQuestions && response.nextQuestions.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] font-semibold tracking-widest text-[var(--text-muted)] mb-2 px-1">
              CONTINUE WITH
            </div>
            <div className="flex flex-wrap gap-1.5">
              {response.nextQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onQuerySelect(q)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[12px] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] hover:shadow-sm transition-all max-w-[300px] lexram-hover-glow"
                >
                  <Lightbulb className="w-3 h-3 text-[var(--accent)] flex-shrink-0" />
                  <span className="truncate">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
        {/* ── Right column: dark "AUTHORITIES / N CITED" card pinned next to
            this AI message. Rendered only when this message has authorities
            so the chat column doesn't shift around for citationless answers. */}
        {inlineAuthorities.length > 0 && (
          <div className="lg:w-[320px] lg:flex-shrink-0 -mt-1">
            <CitationBox citations={inlineAuthorities} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
