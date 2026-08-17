"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  Send,
  Square,
  X,
  Settings2,
  FileText,
  Mic,
  MicOff,
  LayoutTemplate,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useVoiceTyping } from "@/hooks/use-voice-typing";
import type { AttachedFile, CommandMode, OutputFormat, AnalysisDepth, WritingStyle } from "../types";
import { PROMPT_PRESETS } from "../types";
import type { QueryMode } from "@/modules/legal/api/queryStream";
import type { DraftTemplate } from "./TemplatesPanel";

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
    isAuthenticated?: boolean;
    onSignUp?: () => void;
    selectedTemplate?: DraftTemplate | null;
    onOpenTemplates?: () => void;
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
  isAuthenticated = true,
  onSignUp,
  selectedTemplate,
  onOpenTemplates,
}: ChatInputProps) {
  type InputTab = "ask" | "docChat" | "draft";
  const [inputTab, setInputTab] = useState<InputTab>(
    () => (queryMode === "draft" ? "draft" : "ask")
  );

  // Sync tab if queryMode is changed externally
  useEffect(() => {
    if (queryMode === "draft" && inputTab !== "draft") setInputTab("draft");
    else if (queryMode !== "draft" && inputTab === "draft") setInputTab("ask");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryMode]);

  const handleTabChange = (tab: InputTab) => {
    setInputTab(tab);
    setQueryMode(tab === "draft" ? "draft" : "deep");
  };

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

  // Voice typing — shared with EmptyState via the useVoiceTyping hook so
  // dictation behaves identically in the post-thread input bar and the new-
  // thread hero. The hook handles Chrome's habit of ending sessions on short
  // pauses (auto-restarts while the user still intends to dictate).
  const { isListening, supported: speechSupported, toggle: toggleVoiceTyping } =
    useVoiceTyping({ query, setQuery, textareaRef: queryTextareaRef });

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
      <div className={`max-w-[760px] mx-auto ${hasThread ? "px-3 sm:px-4 md:px-8 py-3" : "px-3 sm:px-4 md:px-8 pb-4 sm:pb-6"}`}>
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

        {/* Guest CTA — takes the place of the old SignupPromptModal. Clicking
            sends the user to /sign-in with the current query stashed for
            auto-submit after they finish signup. */}
        {!isAuthenticated && (
          <div className="flex justify-center mb-2.5">
            <button
              type="button"
              onClick={onSignUp}
              className="px-3 py-1 rounded-full text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              Sign up to get{" "}
              <span className="text-[var(--accent)] font-semibold underline underline-offset-2 decoration-[var(--accent)]/40">
                3 free queries
              </span>
            </button>
          </div>
        )}


          {/* Mode tabs — Ask / DocChat / Draft */}
        <div className="flex items-center gap-1 mb-2 px-1">
          {(["ask", "docChat", "draft"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                inputTab === tab
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {tab === "ask" ? "Ask" : tab === "docChat" ? "DocChat" : "Draft"}
              {tab === "draft" && (
                <span className={`text-[8px] font-bold tracking-wider px-1 py-0.5 rounded ${
                  inputTab === "draft" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-600"
                }`}>
                  BETA
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Template chip — draft mode only */}
        {inputTab === "draft" && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <button
              type="button"
              onClick={onOpenTemplates}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors border ${
                selectedTemplate
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]"
              }`}
            >
              <LayoutTemplate className="w-3 h-3" />
              {selectedTemplate ? selectedTemplate.name : "Use a template"}
            </button>
            {selectedTemplate && (
              <span className="text-[10px] text-[var(--text-muted)] italic">format locked to template</span>
            )}
          </div>
        )}

        {/* Main input bar */}
        <div className="flex items-center gap-2 sm:gap-3 rounded-full border border-[var(--oracle-outline-variant,#d0c5b6)]/30 bg-transparent px-3 sm:px-4 py-2.5 shadow-[var(--input-shadow)] focus-within:border-[var(--oracle-primary-container,#c6a76e)]/60 focus-within:shadow-[0_0_0_2px_rgba(198,167,110,0.15),var(--input-shadow)] transition-all duration-300">
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
            placeholder={
              hasThread
                ? "Inquire further..."
                : inputTab === "docChat"
                ? "Ask about a judgment, statute, or uploaded document…"
                : inputTab === "draft"
                ? "Describe the document you want to draft…"
                : "Ask anything about Indian law…"
            }
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60 outline-none border-0 appearance-none focus:outline-none focus:ring-0 leading-6 max-h-[120px] overflow-y-auto custom-scrollbar py-1.5"
          />

          {/* Right: mic + send */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

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
