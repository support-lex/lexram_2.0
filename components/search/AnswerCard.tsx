'use client';

import { useMemo, useState } from 'react';
import { Brain, Check, Copy, Sparkles } from 'lucide-react';
import type { RagSource } from '@/lib/rag-client';
import { cleanAnswer } from '@/lib/answer-cleanup';

interface AnswerCardProps {
  answer: string;
  sources: RagSource[];
  onCitationClick?: (key: string) => void;
}

// Parse both §-style ("[§11]", "§11") AND MoEFCC numeric ("[1]", "[2]") citations.
// Numeric citations scroll to source by index; § citations by section token.
function renderWithCitations(
  text: string,
  sections: Set<string>,
  numSources: number,
  onClick?: (key: string) => void,
): React.ReactNode[] {
  const regex = /(\[(\d+)\]|\[§\s*([A-Za-z0-9()]+)\]|§\s*([A-Za-z0-9()]+))/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const numeric = match[2];
    const sectionToken = (match[3] ?? match[4] ?? '').trim();

    if (numeric) {
      const n = Number(numeric);
      if (Number.isFinite(n) && n >= 1 && n <= numSources) {
        nodes.push(
          <a
            key={`cite-${key++}`}
            href={`#source-${n}`}
            onClick={(e) => {
              e.preventDefault();
              onClick?.(String(n));
            }}
            className="inline-flex items-baseline px-1 py-0.5 mx-0.5 rounded text-[11px] font-mono font-semibold border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] transition-colors no-underline"
          >
            [{n}]
          </a>,
        );
      } else {
        nodes.push(<span key={`cite-${key++}`}>{match[0]}</span>);
      }
    } else if (sectionToken && sections.has(sectionToken)) {
      nodes.push(
        <a
          key={`cite-${key++}`}
          href={`#source-${sectionToken}`}
          onClick={(e) => {
            e.preventDefault();
            onClick?.(sectionToken);
          }}
          className="inline-flex items-baseline px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-semibold border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] transition-colors no-underline"
        >
          §{sectionToken}
        </a>,
      );
    } else {
      nodes.push(<span key={`cite-${key++}`}>{match[0]}</span>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

// Lightweight markdown: paragraphs, bullet lists, bold. Avoids the react-markdown
// bundle here since the answer is short.
function renderMarkdown(
  raw: string,
  sections: Set<string>,
  numSources: number,
  onCitationClick?: (key: string) => void,
): React.ReactNode {
  const blocks = raw.split(/\n{2,}/);
  return blocks.map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    const lines = trimmed.split('\n');
    const isList = lines.every((l) => /^\s*[-*]\s+/.test(l));
    const renderInline = (t: string) => {
      const withBold = t.split(/(\*\*[^*]+\*\*)/g).map((seg, i) => {
        if (/^\*\*[^*]+\*\*$/.test(seg)) {
          return (
            <strong key={`b-${i}`} className="font-semibold">
              {seg.slice(2, -2)}
            </strong>
          );
        }
        return (
          <span key={`s-${i}`}>
            {renderWithCitations(seg, sections, numSources, onCitationClick)}
          </span>
        );
      });
      return withBold;
    };
    if (isList) {
      return (
        <ul key={idx} className="list-disc pl-5 space-y-1 my-2">
          {lines.map((l, i) => (
            <li key={i}>{renderInline(l.replace(/^\s*[-*]\s+/, ''))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={idx} className="mb-3 last:mb-0 whitespace-pre-wrap">
        {renderInline(trimmed)}
      </p>
    );
  });
}

export function AnswerCard({ answer, sources, onCitationClick }: AnswerCardProps) {
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const sectionSet = useMemo(
    () => new Set(sources.map((s) => s.section)),
    [sources],
  );

  const cleaned = useMemo(() => cleanAnswer(answer), [answer]);
  const copyText = cleaned.visible || cleaned.reasoning || answer;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] truncate">
            AI Answer
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cleaned.reasoning && (
            <button
              onClick={() => setShowReasoning((v) => !v)}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-colors"
              title="See the model's reasoning"
            >
              <Brain className="w-3 h-3" />
              {showReasoning ? 'Hide reasoning' : 'Show reasoning'}
            </button>
          )}
          {(cleaned.visible || cleaned.reasoning) && (
            <button
              onClick={copy}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      {cleaned.truncated && (
        <div className="mb-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md px-3 py-2">
          The model emitted its reasoning but was cut off before the final answer.
          Use <strong>Show reasoning</strong> for context, or rerun the query.
        </div>
      )}

      {cleaned.visible && (
        <div className="text-[15px] leading-relaxed text-[var(--text-primary)]">
          {renderMarkdown(cleaned.visible, sectionSet, sources.length, onCitationClick)}
        </div>
      )}

      {showReasoning && cleaned.reasoning && (
        <details
          open
          className="mt-4 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface-hover)]/50 p-3 text-[12.5px] text-[var(--text-secondary)] leading-relaxed"
        >
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Model reasoning
          </summary>
          <pre className="mt-2 whitespace-pre-wrap font-sans">
            {cleaned.reasoning}
          </pre>
        </details>
      )}

      {(cleaned.visible || cleaned.reasoning) && (
        <p className="mt-4 text-[11px] text-[var(--text-secondary)] italic">
          Generated with AI from {sources.length} indexed source{sources.length === 1 ? '' : 's'}. Always verify against the original text.
        </p>
      )}
    </div>
  );
}
