"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseStreamingField } from "../hooks/use-research-chat";

type StreamingIndicatorProps = {
  streamingText: string;
};

export default function StreamingIndicator({ streamingText }: StreamingIndicatorProps) {
  const [thinkOpen, setThinkOpen] = useState(false);

  const thinkingText = parseStreamingField(streamingText, "thinkingText");
  const streamText = parseStreamingField(streamingText, "streamText");

  const hasThinking = Boolean(thinkingText);
  const hasStream = Boolean(streamText);

  // Title mirrors Ant Design X Think: changes as steps complete
  const thinkTitle = hasStream
    ? "Deep thinking complete"
    : hasThinking
      ? "Deep thinking…"
      : "Assessing query…";

  const isThinking = !hasStream; // still in thinking/planning phase

  return (
    <div className="flex items-start gap-2.5 w-full">
      {/* LexRam avatar */}
      <div className="w-7 h-7 rounded-full bg-[var(--bg-sidebar)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-[var(--text-muted)]">L</span>
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Think block — Ant Design X Think style */}
        <div className="relative rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--accent)]/20" />
          <button
            onClick={() => setThinkOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-left"
          >
            {/* Blinking dot — only while thinking */}
            {isThinking && (
              <span className="flex items-center gap-0.5 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-[blink_1s_ease-in-out_infinite]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/60 animate-[blink_1s_ease-in-out_0.2s_infinite]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/30 animate-[blink_1s_ease-in-out_0.4s_infinite]" />
              </span>
            )}

            <span
              className={`text-sm font-medium flex-1 ${
                isThinking ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
              }`}
            >
              {thinkTitle}
            </span>

            {thinkOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
            )}
          </button>

          {thinkOpen && (
            <div className="border-t border-dashed border-[var(--border-default)] px-4 py-3 bg-[var(--surface-hover)]">
              <pre className="text-[12px] font-mono whitespace-pre-wrap leading-5 text-[var(--text-secondary)] max-h-48 overflow-y-auto custom-scrollbar">
                {thinkingText || "Waiting for thinking tokens…"}
              </pre>
            </div>
          )}
        </div>

        {/* Live streaming answer */}
        {streamText && (
          <div className="rounded-2xl rounded-tl-sm bg-[var(--bg-surface)] border border-[var(--border-light)] shadow-sm px-5 py-4">
            <div className="prose prose-sm max-w-none text-[var(--text-primary)] leading-7">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {`${streamText}▌`}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Placeholder bubble when no stream yet */}
        {!streamText && (
          <div className="rounded-2xl rounded-tl-sm bg-[var(--bg-surface)] border border-[var(--border-light)] shadow-sm px-5 py-4">
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
