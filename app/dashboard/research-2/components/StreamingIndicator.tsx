"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type StreamingIndicatorProps = {
  /** Latest "status" event from the SSE stream (e.g. "Searching case law…") */
  statusMessage?: string;
  /** Concatenated token text streamed so far */
  streamingText: string;
};

export default function StreamingIndicator({
  statusMessage = "",
  streamingText,
}: StreamingIndicatorProps) {
  const hasText = streamingText.trim().length > 0;
  const status = statusMessage || (hasText ? "Synthesizing answer…" : "Working…");

  return (
    <div className="flex items-start gap-2.5 w-full">
      {/* LexRam avatar */}
      <div className="w-7 h-7 rounded-full bg-[var(--bg-sidebar)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-[var(--text-muted)]">L</span>
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Status pill — updates as the backend pipeline progresses */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5">
          <span className="flex items-center gap-0.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-[blink_1s_ease-in-out_infinite]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/60 animate-[blink_1s_ease-in-out_0.2s_infinite]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/30 animate-[blink_1s_ease-in-out_0.4s_infinite]" />
          </span>
          <span className="text-xs font-medium text-[var(--text-secondary)]">{status}</span>
        </div>

        {/* Live token stream */}
        {hasText && (
          <div className="px-1 py-2">
            <div className="prose prose-sm max-w-none text-[var(--text-primary)] leading-7">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {`${streamingText}▌`}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Placeholder while waiting for the first token */}
        {!hasText && (
          <div className="px-1 py-2">
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/60 animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/30 animate-pulse [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
