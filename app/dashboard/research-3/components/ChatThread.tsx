"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import MessageBubble from "./MessageBubble";
import StreamingIndicator from "./StreamingIndicator";
import type { Message } from "../types";

type ChatThreadProps = {
  messages: Message[];
  isSearching: boolean;
  streamingText: string;
  statusMessage?: string;
  error: string | null;
  userInitials: string;
  expandedWorking: Record<string, boolean>;
  expandedThinkingTokens: Record<string, boolean>;
  toggleWorking: (id: string) => void;
  toggleThinkingTokens: (id: string) => void;
  onOpenAuthorities: (index: number, messageId: string) => void;
  onOpenEditor: () => void;
  onOpenWorkflow: () => void;
  onQuerySelect: (query: string) => void;
  onBuildSessionDraft: () => void;
  mobilePane: "chat" | "authorities";
};

export default function ChatThread({
  messages,
  isSearching,
  streamingText,
  statusMessage,
  error,
  userInitials,
  expandedWorking,
  expandedThinkingTokens,
  toggleWorking,
  toggleThinkingTokens,
  onOpenAuthorities,
  onOpenEditor,
  onOpenWorkflow,
  onQuerySelect,
  onBuildSessionDraft,
  mobilePane,
}: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const programmaticScrollRef = useRef(false);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    programmaticScrollRef.current = true;
    endRef.current?.scrollIntoView({ behavior: streamingText ? "auto" : "smooth" });
  }, [messages, isSearching, streamingText]);

  const hasAiResponses = messages.some((m) => m.role === "ai" && m.response);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        if (programmaticScrollRef.current) {
          programmaticScrollRef.current = false;
          return;
        }
        const el = e.currentTarget;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        shouldAutoScrollRef.current = distanceFromBottom < 120;
      }}
      className={`flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-4 md:px-8 pt-4 sm:pt-6 pb-6 ${mobilePane === "authorities" ? "hidden lg:block" : ""}`}
    >
      <div className="max-w-[860px] lg:max-w-[1180px] mx-auto space-y-4 sm:space-y-6">
        {messages.map((message, index) => {
          const sourceQuery =
            messages.slice(0, index).reverse().find((m) => m.role === "user")?.content ||
            "Research";

          return (
            <MessageBubble
              key={message.id}
              className="lexram-msg-enter"
              message={message}
              userInitials={userInitials}
              formatDate={formatDate}
              expandedWorking={Boolean(expandedWorking[message.id])}
              expandedThinkingTokens={Boolean(expandedThinkingTokens[message.id])}
              onToggleWorking={() => toggleWorking(message.id)}
              onToggleThinkingTokens={() => toggleThinkingTokens(message.id)}
              onOpenAuthorities={(i) => onOpenAuthorities(i, message.id)}
              onOpenEditor={onOpenEditor}
              onOpenWorkflow={onOpenWorkflow}
              onQuerySelect={onQuerySelect}
            />
          );
        })}

        {isSearching && (
          <StreamingIndicator streamingText={streamingText} statusMessage={statusMessage} />
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {hasAiResponses && !isSearching && (
          <div className="flex justify-center py-4">
            <button
              onClick={onBuildSessionDraft}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent-hover)] transition-colors"
            >
              <FileText className="w-4 h-4" /> Build Draft From Session
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
