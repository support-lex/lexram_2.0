"use client";

// Inline questions form — rendered inside an AI message bubble when the
// model asks the user 2+ numbered questions in a row (the "TRACK 1 —
// Essential Facts" pattern from the drafting flow).
//
// Each question gets its own text input. Clicking Proceed bundles the
// answers into a single "1. <ans>\n2. <ans>\n…" string and submits it
// via the existing onSuggestedAnswer pipeline (same handler the chip
// suggestions use), so the AI sees a clean, ordered response instead of
// the user typing free-form numbered text in the chat input.

import { useState, type ReactNode } from "react";
import { ArrowRight, MessageSquareText } from "lucide-react";

export interface ParsedQuestion {
  number: number;
  label?: string;
  text: string;
}

// Render a plain string with `**bold**` segments turned into <strong> nodes.
// The AI prose often has inline markdown emphasis inside question text
// (e.g. "**regular bail**" / "**anticipatory bail**") that would otherwise
// leak through as raw asterisks inside an <input>'s sibling label.
function renderInlineBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    if (m) {
      return (
        <strong key={i} className="font-semibold text-[var(--text-primary)]">
          {m[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface InlineQuestionsFormProps {
  questions: ParsedQuestion[];
  onProceed: (formattedAnswers: string) => void;
  disabled?: boolean;
}

export default function InlineQuestionsForm({ questions, onProceed, disabled }: InlineQuestionsFormProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleChange = (n: number, v: string) =>
    setAnswers((prev) => ({ ...prev, [n]: v }));

  const handleProceed = () => {
    // Skip entirely-empty rows so the AI doesn't see noise lines like
    // "3. " — placeholders are better expressed by leaving an answer
    // blank and getting a follow-up than by sending empty data.
    const formatted = questions
      .map((q) => {
        const a = (answers[q.number] || "").trim();
        return a ? `${q.number}. ${a}` : null;
      })
      .filter(Boolean)
      .join("\n");
    if (!formatted) return;
    onProceed(formatted);
  };

  const anyAnswered = questions.some((q) => (answers[q.number] || "").trim().length > 0);

  return (
    <div className="mt-4 px-1" role="group" aria-label="Answer to proceed">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-[var(--lex-rust)]">
        <MessageSquareText className="w-3 h-3" />
        Answer to proceed
      </p>
      <div className="rounded-xl border border-[var(--lex-rust)]/30 bg-[var(--lex-cream-soft)] p-3.5 space-y-3 shadow-[var(--lex-shadow-soft)]">
        {questions.map((q) => (
          <div key={q.number}>
            <label className="block mb-1.5 text-[12px] leading-snug text-[var(--text-primary)]">
              <span className="font-bold text-[var(--lex-maroon)]">{q.number}.</span>{" "}
              {q.label && (
                <span className="font-semibold text-[var(--text-primary)]">{q.label}:</span>
              )}{" "}
              <span className="text-[var(--text-secondary)]">{renderInlineBold(q.text)}</span>
            </label>
            <input
              type="text"
              value={answers[q.number] || ""}
              onChange={(e) => handleChange(q.number, e.target.value)}
              placeholder="Your answer…"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleProceed();
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-white text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--lex-rust)] focus:ring-2 focus:ring-[var(--lex-rust)]/15 transition-all disabled:opacity-50"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={handleProceed}
          disabled={disabled || !anyAnswered}
          className="inline-flex items-center gap-1.5 pl-4 pr-3.5 h-9 rounded-full text-[13px] font-semibold text-[var(--lex-cream)] transition-all shadow-[var(--lex-shadow-soft)] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background:
              "linear-gradient(135deg, var(--lex-maroon) 0%, var(--lex-rust) 100%)",
          }}
        >
          Proceed
          <span className="grid place-items-center size-5 rounded-full bg-white/15">
            <ArrowRight className="size-3" strokeWidth={2.5} />
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Detect numbered questions in an AI message's prose. Matches lines that
 * start with `<digit>.` and contain a `?`. Also peels off a `**Label**:`
 * prefix when present so the form can render it as a bolded inline label.
 *
 * Returns an empty array unless at least TWO questions are found in a row
 * — single questions are usually just rhetorical and shouldn't trigger
 * the form UI.
 */
export function parseNumberedQuestions(text: string | undefined): ParsedQuestion[] {
  if (!text) return [];
  const lines = text.split("\n");
  const results: ParsedQuestion[] = [];
  // Match: optional list markers, digit + dot, optional **label** followed
  // by ":" / em-dash / en-dash / hyphen, the question. Anchored to the
  // trimmed start so chat indentation doesn't break the match.
  const RE = /^(\d+)\.\s+(?:\*\*([^*]+)\*\*\s*[:—–\-]\s*)?(.+?)\s*$/;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = RE.exec(line);
    if (!m) continue;
    const text = m[3];
    if (!text.includes("?")) continue;
    results.push({
      number: parseInt(m[1], 10),
      label: m[2]?.trim(),
      text,
    });
  }
  // Need at least two to be worth a form. Also require the numbers to be
  // a consecutive run starting from a low value — guards against false
  // positives on numbered citations or footnotes elsewhere in the prose.
  if (results.length < 2) return [];
  const firstNum = results[0].number;
  if (firstNum > 3) return [];
  for (let i = 1; i < results.length; i++) {
    if (results[i].number !== results[i - 1].number + 1) return [];
  }
  return results;
}
