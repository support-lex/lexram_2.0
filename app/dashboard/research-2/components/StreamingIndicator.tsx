"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type StreamingIndicatorProps = {
  /** Latest "status" event from the SSE stream (e.g. "Searching case law…") */
  statusMessage?: string;
  /**
   * Optional sub-lines that the backend ships alongside the status headline
   * (e.g. "→ Mapping citation chains to surface how the doctrine has
   * evolved…"). Each status event REPLACES the previous detail set — this
   * panel is a live "currently doing this" view, not a running log.
   */
  statusDetail?: string[];
  /** Concatenated token text streamed so far */
  streamingText: string;
};

export default function StreamingIndicator({
  statusMessage = "",
  statusDetail,
  streamingText,
}: StreamingIndicatorProps) {
  const hasText = streamingText.trim().length > 0;
  const status = statusMessage || (hasText ? "Synthesizing answer…" : "Working…");
  const detailLines = (statusDetail ?? []).filter((s) => s && s.trim().length > 0);

  return (
    <div className="flex items-start gap-2.5 w-full">
      {/* LexRam avatar */}
      <div className="w-7 h-7 rounded-full bg-[var(--bg-sidebar)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-[var(--text-muted)]">L</span>
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Status pill — updates as the backend pipeline progresses */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5">
            <span className="flex items-center gap-0.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-[blink_1s_ease-in-out_infinite]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/60 animate-[blink_1s_ease-in-out_0.2s_infinite]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/30 animate-[blink_1s_ease-in-out_0.4s_infinite]" />
            </span>
            <span className="text-xs font-medium text-[var(--text-secondary)]">{status}</span>
          </div>

          {/* Detail sub-lines — smaller text, indented, beneath the headline.
              Replaced (not accumulated) every time the headline changes, so
              the user reads what the *current* tool is doing during the long
              silences between tool calls. Explicit non-clipping styles
              (whitespace-normal, no overflow, break-words) so we never
              ellipsize — if a line LOOKS truncated, it's the backend
              cutting it before send; a title-hover fallback exposes the
              full string for inspection regardless. */}
          {detailLines.length > 0 && (
            <ul className="mt-2 ml-3 space-y-1 border-l border-[var(--border-default)] pl-3 text-[12px] leading-relaxed text-[var(--text-muted)] lex-animate-fade-in">
              {detailLines.map((line, i) => (
                <li
                  key={`${i}-${line}`}
                  title={line}
                  className="whitespace-normal break-words [overflow-wrap:anywhere] overflow-visible max-w-full"
                >
                  {line}
                </li>
              ))}
            </ul>
          )}
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
