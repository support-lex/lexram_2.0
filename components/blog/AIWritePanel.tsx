"use client";

import { useState } from "react";
import { Sparkles, X, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

export interface AIGeneratedBlog {
  title?: string;
  subtitle?: string;
  category?: string | null;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  html: string;
}

interface Props {
  // Current title (passed to the AI for context).
  title: string;
  // Current editor HTML (used when mode = 'continue').
  existingHtml: string;
  // Called with the AI payload. mode='replace' includes metadata + body html;
  // mode='continue' includes only html (to be appended).
  onApply: (payload: AIGeneratedBlog, mode: "replace" | "continue") => void;
}

const SUGGESTIONS = [
  "Recent Supreme Court judgments on data privacy in India",
  "Practical guide: how to draft a watertight rent agreement",
  "Compliance checklist for early-stage Indian SaaS founders",
  "How AI is changing legal research workflows for advocates",
];

export default function AIWritePanel({ title, existingHtml, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"replace" | "continue">("replace");
  const [busy, setBusy] = useState(false);

  const hasContent = stripHtml(existingHtml).length > 0;

  async function generate() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("Tell the AI what to write about");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ai/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          title,
          mode,
          existingHtml: mode === "continue" ? existingHtml : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
      if (typeof data.html !== "string" || !data.html.trim()) {
        throw new Error("AI returned empty content");
      }
      onApply(data as AIGeneratedBlog, mode);
      toast.success(mode === "continue" ? "Continuation added" : "Draft inserted — title, tags, and SEO filled");
      setOpen(false);
      setPrompt("");
    } catch (e) {
      toast.error("AI generation failed", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#b94826]/15 to-[#680318]/10 text-[#680318] border border-[#b94826]/40 hover:from-[#b94826]/25 hover:to-[#680318]/15 hover:border-[#b94826]/60 transition-all"
      >
        <Sparkles className="h-3.5 w-3.5" /> Write with AI
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[#b94826]/40 bg-gradient-to-br from-[#b94826]/8 via-[#fff7ec] to-[#680318]/8 p-4 sm:p-5 space-y-4 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center h-8 w-8 rounded-lg bg-[#b94826]/15 text-[#b94826]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#680318]">Write with AI</h3>
            <p className="text-xs text-[#680318]/60">Describe the post — get an editable draft in seconds.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setOpen(false); setPrompt(""); }}
          disabled={busy}
          className="grid place-items-center h-8 w-8 rounded-lg text-[#680318]/60 hover:bg-[#680318]/8 hover:text-[#680318] disabled:opacity-50 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder='e.g. "A 1,000-word explainer on the Digital Personal Data Protection Act 2023 — what advocates need to tell startup clients."'
          className="w-full px-3 py-2 rounded-lg border border-[#680318]/20 bg-[#fff7ec] text-sm text-[#680318] placeholder:text-[#680318]/60 outline-none focus:border-[#b94826] focus:ring-2 focus:ring-[#b94826]/25 resize-y"
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate(); }}
        />
        <div className="mt-1 text-[11px] text-[#680318]/60 flex justify-between">
          <span>⌘/Ctrl + Enter to generate</span>
          <span>{prompt.length}/2000</span>
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setPrompt(s)}
            disabled={busy}
            className="px-2.5 py-1 text-[11px] rounded-full bg-[#fff7ec] border border-[#680318]/20 text-[#680318]/80 hover:border-[#b94826]/40 hover:text-[#680318] disabled:opacity-50 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Mode picker */}
      {hasContent && (
        <div role="radiogroup" className="grid grid-cols-2 gap-2">
          <ModeOption
            active={mode === "replace"}
            onClick={() => setMode("replace")}
            label="Replace"
            hint="Overwrite the editor with the new draft"
          />
          <ModeOption
            active={mode === "continue"}
            onClick={() => setMode("continue")}
            label="Continue"
            hint="Append a continuation in the same voice"
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => { setOpen(false); setPrompt(""); }}
          disabled={busy}
          className="px-3 h-9 rounded-lg text-sm font-medium text-[#680318]/80 hover:bg-[#680318]/8 hover:text-[#680318] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={generate}
          disabled={busy || !prompt.trim()}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-semibold bg-[#680318] text-[#fff0df] border border-[#680318] hover:bg-[#7a1f2b] hover:border-[#7a1f2b] disabled:opacity-50 shadow-[0_4px_14px_-4px_rgba(104,3,24,0.45)] transition-all"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {busy ? "Writing..." : "Generate"}
        </button>
      </div>
    </div>
  );
}

function ModeOption({
  active,
  onClick,
  label,
  hint,
}: { active: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-left transition-colors border
        ${active
          ? "border-[#b94826] bg-[#b94826]/10"
          : "border-[#680318]/20 bg-[#fff7ec] hover:border-[#b94826]/40"
        }`}
    >
      <div className="text-xs font-semibold text-[#680318]">{label}</div>
      <div className="text-[11px] text-[#680318]/60 mt-0.5">{hint}</div>
    </button>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
