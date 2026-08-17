"use client";

// Read-only transcript viewer for one research session, opened from the "Recent
// research sessions" table on the Usage tab.
//
// Fetched on demand (GET /api/admin/sessions/[id]/messages) rather than being part of
// the dashboard's initial payload — chat_sessions.messages is an unbounded JSON blob per
// session, and loading it for all 40 recently-listed sessions on every dashboard visit
// would be pure waste for the rare click.
//
// Deliberately a plain transcript, not the full research-3 chat UI (MessageBubble):
// this is an admin audit view, not a place to re-render mindmaps, authority cards or
// draft artifacts. Each AI turn falls back through the same fields the real chat UI
// prioritises (streamText, then shortAnswer) so a message that never streamed still
// shows its answer.

import { useEffect, useState } from "react";
import { Bot, Loader2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fmtDateTime } from "./ui";

interface TranscriptMessage {
  id: string;
  role: "user" | "ai";
  content?: string;
  timestamp?: string;
  response?: { streamText?: string; shortAnswer?: string };
}

interface TranscriptResponse {
  title: string;
  createdAt: string | null;
  lastActive: string | null;
  messages: TranscriptMessage[];
}

function messageText(m: TranscriptMessage): string {
  if (m.role === "user") return m.content || "";
  return m.content || m.response?.streamText || m.response?.shortAnswer || "";
}

export default function SessionTranscriptDialog({
  sessionId,
  onClose,
}: {
  sessionId: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<TranscriptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Nothing to fetch, and the dialog is closed (open={sessionId != null}) so any
    // stale `data`/`error` from a previous session stays hidden — no reset needed.
    if (!sessionId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/admin/sessions/${sessionId}/messages`, { cache: "no-store" });
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || `Request failed (${r.status})`);
        if (!cancelled) setData(body as TranscriptResponse);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load transcript");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <Dialog open={sessionId != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-lg)] max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-[var(--border-default)] shrink-0">
          <DialogTitle className="text-[var(--text-primary)] font-extrabold pr-8">
            {data?.title || "Research session"}
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)]">
            {data
              ? `Last active ${fmtDateTime(data.lastActive)} · started ${fmtDateTime(data.createdAt)}`
              : "Loading session details…"}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading transcript…
            </div>
          )}

          {error && !loading && (
            <p className="rounded-lg border border-[#d03b3b]/35 bg-[#d03b3b]/10 px-3 py-2.5 text-xs font-semibold text-[#a82c2c]">
              {error}
            </p>
          )}

          {!loading && !error && data && data.messages.length === 0 && (
            <p className="text-center text-sm text-[var(--text-muted)] py-12">
              This session has no saved messages.
            </p>
          )}

          {!loading &&
            !error &&
            data?.messages.map((m) => {
              const text = messageText(m);
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-[var(--lex-maroon)]/12 text-[var(--lex-maroon)] flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <div className={`max-w-[80%] ${isUser ? "order-first" : ""}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                        isUser
                          ? "bg-[var(--lex-maroon)] text-[var(--accent-text)] rounded-tr-sm"
                          : "bg-[var(--bg-primary)]/30 border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-sm"
                      }`}
                    >
                      {text || <span className="italic opacity-60">No text content</span>}
                    </div>
                    {m.timestamp && (
                      <div
                        className={`mt-1 text-[10px] font-semibold text-[var(--text-muted)] ${
                          isUser ? "text-right" : "text-left"
                        }`}
                      >
                        {fmtDateTime(m.timestamp)}
                      </div>
                    )}
                  </div>
                  {isUser && (
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-[var(--text-muted)]/14 text-[var(--text-secondary)] flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
