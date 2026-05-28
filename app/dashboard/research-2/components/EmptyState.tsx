"use client";

import { useEffect, useRef } from "react";
import { Scale, Paperclip, ArrowRight, Mic, MicOff } from "lucide-react";
import { useVoiceTyping } from "@/hooks/use-voice-typing";

interface EmptyStateProps {
  onPickQuickStart: (query: string) => void;
  onUpload: () => void;
  onPickDraft: (query: string) => void;
  onStartDraft: () => void;
  // Hero input controls (page hides the bottom ChatInput when empty)
  query: string;
  setQuery: (v: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  isAuthenticated?: boolean;
  onSignUp?: () => void;
  /** Draft mode toggle — same backend as ChatInput's queryMode === "draft". */
  isDraftMode?: boolean;
  onToggleDraftMode?: () => void;
}

export default function EmptyState({
  onPickQuickStart,
  onUpload,
  query,
  setQuery,
  onSubmit,
  isGenerating,
  isAuthenticated,
  onSignUp,
  isDraftMode = false,
  onToggleDraftMode,
}: EmptyStateProps) {
  // ── Hero input behaviour ───────────────────────────────────────────────
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };
  useEffect(() => {
    resize(textareaRef.current);
  }, [query]);

  // Voice typing — same backend the ChatInput uses, so dictation behaves
  // identically in the new-thread hero and the post-thread input bar.
  const { isListening, supported: speechSupported, toggle: toggleVoiceTyping } =
    useVoiceTyping({ query, setQuery, textareaRef });

  const submit = () => {
    if (!query.trim() || isGenerating) return;
    onSubmit();
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
      {/* Soft maroon → white radial glow background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 0%, rgba(122,31,43,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 100%, rgba(122,31,43,0.04) 0%, transparent 60%), linear-gradient(180deg, #ffffff 0%, #fdf8f8 100%)",
        }}
      />

      <div data-tour="research-empty-state" className="relative min-h-full flex flex-col items-center justify-center px-3 sm:px-6 py-6 sm:py-10 gap-5 sm:gap-6">
        {/* ── Scales icon — maroon→rust gradient, matches the logo ──── */}
        <div
          className="lex-animate-float relative grid place-items-center size-14 rounded-2xl text-[var(--lex-cream)] shadow-[var(--lex-shadow-elevated)]"
          style={{
            background:
              "linear-gradient(135deg, var(--lex-maroon) 0%, var(--lex-rust) 100%)",
          }}
        >
          <Scale className="relative size-6" strokeWidth={1.75} />
        </div>

        {/* ── Hero heading — static italic "research" in rust accent ── */}
        <div className="text-center max-w-2xl lex-animate-fade-up px-2">
          <h1 className="text-[26px] sm:text-[46px] font-serif font-semibold leading-[1.15] text-[var(--lex-ink)] tracking-tight">
            What can I help you{" "}
            <span className="italic text-[var(--lex-rust)]">research</span>
            <span className="text-[var(--lex-ink)]">?</span>
          </h1>
          <p className="mt-2 sm:mt-3 text-[13px] sm:text-[15px] text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
            Ask in plain English. Lexram parses the question, surfaces grounded authority,
            and drafts your memo with verifiable citations.
          </p>
        </div>

        {/* ── Hero input — rounded card with rust focus ring ────── */}
        <div data-tour="research-hero-input" className="w-full max-w-2xl lex-animate-scale-in">
          <div
            data-no-focus-ring
            className="lexram-input-shell group/input relative rounded-2xl bg-white border border-[var(--border-default)] px-5 py-3 shadow-[var(--lex-shadow-elevated)] focus-within:border-[var(--lex-rust)] focus-within:shadow-[0_0_0_4px_rgba(185,72,38,0.15),var(--lex-shadow-elevated)] transition-all duration-300"
          >
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isAuthenticated && onSignUp) {
                    onSignUp();
                    return;
                  }
                  submit();
                }
              }}
              rows={1}
              placeholder="Ask anything about Indian law…"
              className="w-full block bg-transparent border-0 outline-none resize-none appearance-none shadow-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none text-[15px] text-[#1a1010] placeholder:text-[#aa9ea0] leading-[1.55] m-0 p-0"
              style={{
                boxShadow: "none",
                background: "transparent",
                outline: "none",
                outlineOffset: "0",
                WebkitAppearance: "none",
                MozAppearance: "none",
                WebkitTapHighlightColor: "transparent",
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "none";
                e.currentTarget.style.outlineOffset = "0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                data-tour="research-attach"
                onClick={onUpload}
                title="Attach a document"
                className="inline-flex items-center gap-1.5 -ml-1 px-2 py-1.5 rounded-lg text-[13px] font-medium text-[#6b5a5d] hover:bg-[#7a1f2b]/8 hover:text-[#7a1f2b] transition-colors"
              >
                <Paperclip className="size-4" strokeWidth={2} />
                Attach
              </button>

              <div className="flex items-center gap-2">
                {onToggleDraftMode && (
                  <button
                    type="button"
                    onClick={onToggleDraftMode}
                    title="Draft a legal document"
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all flex-shrink-0 ${
                      isDraftMode
                        ? "bg-[var(--lex-rust)] text-[var(--lex-cream)] shadow-sm"
                        : "bg-[var(--lex-cream-deep)] text-[var(--lex-maroon)] hover:bg-[var(--lex-maroon)] hover:text-[var(--lex-cream)] border border-[var(--border-default)]"
                    }`}
                  >
                    Draft
                    <span className={`text-[8px] font-bold tracking-wider px-1 py-0.5 rounded ${
                      isDraftMode ? "bg-white/25 text-white" : "bg-amber-100 text-amber-600"
                    }`}>
                      BETA
                    </span>
                  </button>
                )}

                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleVoiceTyping}
                    aria-label={isListening ? "Stop voice typing" : "Voice typing"}
                    title={isListening ? "Stop voice typing" : "Voice typing"}
                    className={`grid place-items-center size-9 rounded-full transition-all flex-shrink-0 ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse shadow-[0_0_0_4px_rgba(239,68,68,0.15)]"
                        : "bg-[var(--lex-cream-deep)] text-[var(--lex-maroon)] hover:bg-[var(--lex-maroon)] hover:text-[var(--lex-cream)]"
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}

              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated && onSignUp) {
                    onSignUp();
                    return;
                  }
                  submit();
                }}
                disabled={isGenerating}
                aria-label="Ask Lexram"
                className={`group/send inline-flex items-center gap-2 pl-3 pr-2.5 sm:pl-5 sm:pr-3.5 h-10 rounded-full text-[14px] font-semibold text-[var(--lex-cream)] transition-all duration-200 ${
                  query.trim()
                    ? "shadow-[var(--lex-shadow-elevated)] hover:opacity-95 hover:-translate-y-0.5"
                    : "opacity-90 shadow-[var(--lex-shadow-soft)]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  background:
                    "linear-gradient(135deg, var(--lex-maroon) 0%, var(--lex-rust) 100%)",
                }}
              >
                <span className="hidden sm:inline">Ask Lexram</span>
                <span className="grid place-items-center size-6 rounded-full bg-white/15 transition-transform duration-200 group-hover/send:translate-x-0.5">
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </span>
              </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
