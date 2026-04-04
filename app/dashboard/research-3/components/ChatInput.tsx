"use client";

import { useEffect, type RefObject } from "react";
import {
  Paperclip,
  Send,
  Square,
  X,
  Settings2,
  Globe,
  GlobeLock,
  FileText,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { AttachedFile, CommandMode, OutputFormat, AnalysisDepth, WritingStyle } from "../types";
import { PROMPT_PRESETS } from "../types";

/** Grouped types — reduce the 26-flat-prop surface to logical clusters */

/** All readable chat configuration values */
export type ChatConfig = {
  query: string;
  mode: CommandMode;
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
    }
  };

  const currentModeLabel = MODES.find((m) => m.value === mode)?.label ?? "Research";

  return (
    <div
      className={`relative ${hasThread ? "border-t border-[var(--border-default)] bg-[var(--bg-surface)]" : ""}`}
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

      <div className={`max-w-3xl mx-auto ${hasThread ? "px-4 py-3" : "px-4 pb-6"}`}>
        {/* Attached files */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-hover)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
              >
                <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main input container */}
        <div className="flex items-end gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] px-3 py-2.5 focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]/20 transition-all">
          {/* Left actions */}
          <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
            {/* Attach file */}
            <button
              type="button"
              onClick={onFileClick}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web search toggle */}
            <button
              type="button"
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`p-1.5 rounded-lg transition-colors ${
                webSearchEnabled
                  ? "text-[var(--accent)] hover:bg-[var(--surface-hover)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              }`}
              title={webSearchEnabled ? "Web search on" : "Web search off"}
            >
              {webSearchEnabled ? (
                <Globe className="w-4 h-4" />
              ) : (
                <GlobeLock className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={queryTextareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasThread ? "Ask a follow-up…" : "Ask a legal question…"
            }
            rows={1}
            className="flex-1 resize-none bg-transparent text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none leading-6 max-h-[220px] overflow-y-auto custom-scrollbar py-0.5"
            style={{ paddingBottom: "1px" }}
          />

          {/* Right actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
            {/* Settings popover */}
            <Popover>
              <PopoverTrigger
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
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

            {/* Mode pill */}
            {mode !== "normal" && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold border border-[var(--accent)]/20">
                {currentModeLabel}
              </span>
            )}

            {/* Send / Stop */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex-shrink-0"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!query.trim()}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                title="Send (⌘Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
