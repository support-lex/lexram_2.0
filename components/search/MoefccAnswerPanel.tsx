'use client';

import { useMemo, useState } from 'react';
import { Brain, Check, Copy, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MoefccSource } from '@/lib/rag-client';
import { cleanAnswer } from '@/lib/answer-cleanup';

interface Props {
  answer: string;
  sources: MoefccSource[];
  streaming: boolean;
  onCitationClick?: (index: number) => void;
}

// Inject clickable anchors around bracketed citations like [1] [2][3] in the
// markdown text BEFORE rendering. react-markdown then renders them as <a>.
// We use a rare unicode-style marker that react-markdown will safely emit as a link.
const CITATION_REGEX = /\[(\d+)\]/g;

function normalizeAnswer(raw: string, maxIndex: number): string {
  return raw.replace(CITATION_REGEX, (match, nStr) => {
    const n = Number(nStr);
    if (!Number.isFinite(n) || n < 1 || n > maxIndex) return match;
    // Keep as plain token; we'll intercept clicks via an event delegate below.
    return `[[${n}]](#moefcc-source-${n})`;
  });
}

export function MoefccAnswerPanel({
  answer,
  sources,
  streaming,
  onCitationClick,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const cleaned = useMemo(() => cleanAnswer(answer), [answer]);

  const markdown = useMemo(
    () => normalizeAnswer(cleaned.visible, sources.length),
    [cleaned.visible, sources.length],
  );

  const copyText = cleaned.visible || cleaned.reasoning || answer;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const handleCitationClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    const m = /^#moefcc-source-(\d+)$/.exec(href);
    if (!m) return;
    e.preventDefault();
    const idx = Number(m[1]);
    onCitationClick?.(idx);
    const el = document.getElementById(`moefcc-source-${idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] truncate">
            AI Answer · MoEFCC
          </span>
          {streaming && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] shrink-0">
              <Loader2 className="w-3 h-3 animate-spin" />
              {cleaned.isThinking ? 'Reasoning…' : 'Generating…'}
            </span>
          )}
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
          {!streaming && (cleaned.visible || cleaned.reasoning) && (
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

      {cleaned.isThinking && !cleaned.visible && (
        <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--surface-hover)] rounded-md px-3 py-2">
          <Brain className="w-3.5 h-3.5" />
          The model is reasoning through the sources… the answer will appear shortly.
        </div>
      )}

      {!streaming && cleaned.truncated && (
        <div className="mb-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md px-3 py-2">
          The model emitted its reasoning but was cut off before the final answer.
          Use <strong>Show reasoning</strong> for context, or rerun the query.
        </div>
      )}
      <div className="moefcc-markdown text-[15px] leading-relaxed text-[var(--text-primary)]">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children, ...rest }) => {
              const isCitation = href?.startsWith('#moefcc-source-');
              if (isCitation) {
                return (
                  <a
                    href={href}
                    onClick={(e) => handleCitationClick(e, href ?? '')}
                    className="inline-flex items-baseline px-1 py-0.5 mx-0.5 rounded text-[11px] font-mono font-semibold border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] transition-colors no-underline"
                  >
                    {children}
                  </a>
                );
              }
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[var(--accent)] hover:opacity-80"
                  {...rest}
                >
                  {children}
                </a>
              );
            },
            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>
            ),
            code: ({ children }) => (
              <code className="px-1 py-0.5 rounded bg-[var(--surface-hover)] text-[13px] font-mono">
                {children}
              </code>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
        {streaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom bg-[var(--accent)] animate-pulse" />
        )}
      </div>
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
      {!streaming && (cleaned.visible || cleaned.reasoning) && (
        <p className="mt-4 text-[11px] text-[var(--text-secondary)] italic">
          Generated with AI from {sources.length} MoEFCC source
          {sources.length === 1 ? '' : 's'}. Always verify against the original notification.
        </p>
      )}
    </div>
  );
}
