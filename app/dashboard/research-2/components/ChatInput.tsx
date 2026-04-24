"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Paperclip,
  Send,
  Square,
  X,
  Settings2,
  Globe,
  GlobeLock,
  FileText,
  Mic,
  MicOff,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { AttachedFile, CommandMode, OutputFormat, AnalysisDepth, WritingStyle } from "../types";
import { PROMPT_PRESETS } from "../types";
import type { QueryMode } from "@/modules/legal/api/queryStream";

/** Grouped types — reduce the 26-flat-prop surface to logical clusters */

/** All readable chat configuration values */
export type ChatConfig = {
  query: string;
  mode: CommandMode;
  queryMode: QueryMode;
  webSearchEnabled: boolean;
  outputFormat: OutputFormat;
  analysisDepth: AnalysisDepth;
  writingStyle: WritingStyle;
  selectedPromptPreset: string | null;
};

/** Setters that mutate ChatConfig fields */
export type ChatConfigSetters = {
  setQuery: (v: string) => void;
  setMode: (m: CommandMode) => void;
  setQueryMode: (m: QueryMode) => void;
  setWebSearchEnabled: (v: boolean) => void;
  setOutputFormat: (v: OutputFormat) => void;
  setAnalysisDepth: (v: AnalysisDepth) => void;
  setWritingStyle: (v: WritingStyle) => void;
  setSelectedPromptPreset: (v: string | null) => void;
};

/** File-related state & handlers */
export type FileInputProps = {
  attachedFiles: AttachedFile[];
  removeFile: (id: string) => void;
  isDragActive: boolean;
  dropHandlers: {
    onDragOver: React.DragEventHandler<HTMLDivElement>;
    onDragLeave: React.DragEventHandler<HTMLDivElement>;
    onDrop: React.DragEventHandler<HTMLDivElement>;
  };
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileClick: () => void;
};

/** Flat props kept at top-level because they don't belong to a natural group */
type ChatInputProps = ChatConfig &
  ChatConfigSetters &
  FileInputProps & {
    queryTextareaRef: RefObject<HTMLTextAreaElement | null>;
    resizeTextarea: (el: HTMLTextAreaElement | null) => void;
    onSubmit: () => void;
    onStop: () => void;
    isGenerating: boolean;
    hasThread: boolean;
  };

const MODES: { value: CommandMode; label: string }[] = [
  { value: "normal", label: "Research" },
  { value: "counter", label: "Counter" },
  { value: "draft", label: "Draft" },
  { value: "timeline", label: "Timeline" },
];

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "memo", label: "Memo" },
  { value: "bullets", label: "Bullets" },
  { value: "email", label: "Email" },
  { value: "chronology", label: "Chronology" },
];

const DEPTH_OPTIONS: { value: AnalysisDepth; label: string }[] = [
  { value: "fast", label: "Fast" },
  { value: "standard", label: "Standard" },
  { value: "deep", label: "Deep" },
];

const STYLE_OPTIONS: { value: WritingStyle; label: string }[] = [
  { value: "neutral", label: "Neutral" },
  { value: "assertive", label: "Assertive" },
  { value: "client-ready", label: "Client-ready" },
];

export default function ChatInput({
  query,
  setQuery,
  mode,
  setMode,
  onSubmit,
  onStop,
  isGenerating,
  attachedFiles,
  removeFile,
  isDragActive,
  dropHandlers,
  fileInputRef,
  queryTextareaRef,
  resizeTextarea,
  webSearchEnabled,
  setWebSearchEnabled,
  queryMode,
  setQueryMode,
  outputFormat,
  setOutputFormat,
  analysisDepth,
  setAnalysisDepth,
  writingStyle,
  setWritingStyle,
  selectedPromptPreset,
  setSelectedPromptPreset,
  hasThread,
  onFileClick,
}: ChatInputProps) {
  useEffect(() => {
    resizeTextarea(queryTextareaRef.current);
  }, [query, resizeTextarea, queryTextareaRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && query.trim()) onSubmit();
      // (no-op marker — anchor for the upcoming speech recognition block)
    }
  };

  const currentModeLabel = MODES.find((m) => m.value === mode)?.label ?? "Research";

  // ── Voice typing (Web Speech API) ─────────────────────────────────────────
  // Uses the browser's built-in SpeechRecognition (Chrome/Edge/Safari). Falls
  // back to a disabled tooltip on browsers that don't support it (Firefox).
  // Continuous + interim results so the textarea fills as the user speaks.
  const recognitionRef = useRef<any>(null);
  const baseQueryRef = useRef<string>("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // ms of silence with no new transcript before we auto-stop the mic
  const SILENCE_TIMEOUT_MS = 2500;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-IN";

    const armSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        try {
          r.stop();
        } catch {
          /* noop */
        }
      }, SILENCE_TIMEOUT_MS);
    };

    r.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interim += t;
      }
      const merged = `${baseQueryRef.current}${baseQueryRef.current && (finalText || interim) ? " " : ""}${finalText}${interim}`;
      setQuery(merged.replace(/\s+/g, " ").trimStart());
      if (finalText) baseQueryRef.current = `${baseQueryRef.current}${baseQueryRef.current ? " " : ""}${finalText.trim()}`.trim();
      // Reset the silence countdown — every new chunk of speech buys 2.5s.
      armSilenceTimer();
    };
    r.onstart = () => armSilenceTimer();
    r.onspeechstart = () => armSilenceTimer();
    r.onend = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setIsListening(false);
    };
    r.onerror = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setIsListening(false);
    };
    recognitionRef.current = r;
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        r.stop();
      } catch {
        /* noop */
      }
    };
    // setQuery is stable enough — re-binding on every keystroke would
    // recreate the recognizer mid-utterance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleVoiceTyping = () => {
    const r = recognitionRef.current;
    if (!r) return;
    if (isListening) {
      try {
        r.stop();
      } catch {
        /* noop */
      }
      setIsListening(false);
      return;
    }
    baseQueryRef.current = query.trim();
    try {
      r.start();
      setIsListening(true);
      queryTextareaRef.current?.focus();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div
      className={`relative ${hasThread ? "bg-transparent" : ""}`}
      {...dropHandlers}
    >
      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--accent)] bg-[var(--surface-glass)] backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-[var(--accent)]">
            <FileText className="w-8 h-8" />
            <span className="text-sm font-semibold">Drop files to attach</span>
          </div>
        </div>
      )}

      {/* Width + padding MUST match ChatThread so the bubbles and input column
          line up at every viewport, regardless of whether the history rail is open. */}
      <div className={`max-w-[860px] mx-auto ${hasThread ? "px-3 sm:px-4 md:px-8 py-3" : "px-3 sm:px-4 md:px-8 pb-4 sm:pb-6"}`}>
        {/* Attached files */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5">
            {attachedFiles.map((file) => {
              const fromCase = file.source === "case";
              return (
                <div
                  key={file.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                    fromCase
                      ? "border-[var(--accent)]/40 bg-[var(--accent)]/5 text-[var(--text-primary)]"
                      : "border-[var(--border-default)] bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                  }`}
                  title={fromCase ? "From case library" : file.name}
                >
                  <FileText className={`w-3.5 h-3.5 ${fromCase ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  {fromCase && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent)] px-1 py-0 rounded bg-[var(--accent)]/15 leading-tight">
                      case
                    </span>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Context chips row — Statutes / Judgments / Upload PDF / Instant|Deep toggle */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <button
            type="button"
            onClick={onFileClick}
            className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[var(--oracle-outline-variant,#d0c5b6)]/20 text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-2 shadow-sm hover:border-[var(--accent)]/40 transition-all"
          >
            <Paperclip className="w-3.5 h-3.5" />
            Upload PDF
          </button>
          <button
            type="button"
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[var(--oracle-outline-variant,#d0c5b6)]/20 text-[11px] font-semibold flex items-center gap-2 shadow-sm hover:border-[var(--accent)]/40 transition-all ${
              webSearchEnabled ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
            }`}
          >
            {webSearchEnabled ? <Globe className="w-3.5 h-3.5" /> : <GlobeLock className="w-3.5 h-3.5" />}
            {webSearchEnabled ? "Web On" : "Web Off"}
          </button>
          {/* Instant / Deep / Draft toggle */}
          <div className="inline-flex items-center rounded-full bg-white/80 backdrop-blur-md border border-[var(--oracle-outline-variant,#d0c5b6)]/20 p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setQueryMode("instant")}
              className={`px-3.5 py-1 text-[11px] font-semibold rounded-full transition-all ${
                queryMode === "instant"
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Instant
            </button>
            <button
              type="button"
              onClick={() => setQueryMode("deep")}
              className={`px-3.5 py-1 text-[11px] font-semibold rounded-full transition-all ${
                queryMode === "deep"
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Deep
            </button>
            <button
              type="button"
              onClick={() => setQueryMode("draft")}
              title="Draft a legal document using this session's research"
              className={`px-3.5 py-1 text-[11px] font-semibold rounded-full transition-all ${
                queryMode === "draft"
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Draft
            </button>
          </div>
        </div>

        {/* Main input bar — pill shaped, transparent bg, animated gold border */}
        <div className="flex items-center gap-4 rounded-full border border-[var(--oracle-outline-variant,#d0c5b6)]/30 bg-transparent px-5 py-2.5 shadow-[var(--input-shadow)] focus-within:border-[var(--oracle-primary-container,#c6a76e)]/60 focus-within:shadow-[0_0_0_2px_rgba(198,167,110,0.15),var(--input-shadow)] transition-all duration-300">
          {/* + button */}
          <button
            type="button"
            onClick={onFileClick}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex-shrink-0"
            title="Attach"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          </button>

          {/* Textarea */}
          <textarea
            ref={queryTextareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasThread ? "Inquire further..." : "Ask The Oracle anything..."}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60 outline-none leading-6 max-h-[120px] overflow-y-auto custom-scrollbar py-1.5"
          />

          {/* Right: mic + send */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Settings (hidden behind popover) */}
            <Popover>
              <PopoverTrigger
                className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors hidden sm:block"
                title="Settings"
              >
                <Settings2 className="w-4 h-4" />
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                className="w-64 p-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg"
              >
                {/* Mode */}
                <div className="mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Mode
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {MODES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMode(m.value)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          mode === m.value
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="my-2.5 bg-[var(--border-default)]" />

                {/* Output format */}
                <div className="mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Output
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {FORMAT_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => setOutputFormat(o.value)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          outputFormat === o.value
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Depth */}
                <div className="mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Depth
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {DEPTH_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => setAnalysisDepth(o.value)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          analysisDepth === o.value
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Writing style */}
                <div className="mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Style
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {STYLE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => setWritingStyle(o.value)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          writingStyle === o.value
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="my-2.5 bg-[var(--border-default)]" />

                {/* Prompt preset */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Preset
                  </div>
                  <div className="space-y-1">
                    {PROMPT_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() =>
                          setSelectedPromptPreset(
                            selectedPromptPreset === p.id ? null : p.id
                          )
                        }
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                          selectedPromptPreset === p.id
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Voice typing */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoiceTyping}
                disabled={isGenerating}
                className={`transition-colors flex-shrink-0 disabled:opacity-40 ${
                  isListening
                    ? "text-red-500 animate-pulse"
                    : "text-[var(--text-muted)] hover:text-[var(--accent)]"
                }`}
                title={isListening ? "Stop voice typing" : "Voice typing"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Gold round send / stop button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!query.trim()}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--oracle-primary-container,#c6a76e)] text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all flex-shrink-0"
                title="Send (⌘Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
