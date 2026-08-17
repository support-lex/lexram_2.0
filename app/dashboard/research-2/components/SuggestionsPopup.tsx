"use client";

import { useEffect, useState } from "react";

type SuggestionsPopupProps = {
  heading?: string;
  suggestions: string[];
  onPick: (answer: string) => void;
};

/**
 * Bottom-sheet quick-reply card. Slides up from beneath the chat input — same
 * vibe as Claude Code's permission dialog: a bold heading, a numbered vertical
 * list of choices, the first one highlighted as the default, and an "Esc"
 * footer. Pressing the matching number key (1-9) picks an option; Esc dismisses
 * the popup until the next AI message reopens it.
 */
export default function SuggestionsPopup({ heading, suggestions, onPick }: SuggestionsPopupProps) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissal when a new set of suggestions arrives (different AI turn).
  // Keying on the join so identical reorderings still match — fine for demo.
  useEffect(() => {
    setDismissed(false);
  }, [suggestions.join("|")]);

  useEffect(() => {
    if (dismissed) return;
    const handler = (e: KeyboardEvent) => {
      // Number-key shortcut: 1..9 picks the matching option.
      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < suggestions.length) {
          e.preventDefault();
          onPick(suggestions[idx]);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissed(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [suggestions, onPick, dismissed]);

  if (!suggestions.length || dismissed) return null;

  const splitOption = (a: string): { title: string; detail?: string } => {
    const idx = a.indexOf(" — ");
    if (idx > 0) return { title: a.slice(0, idx), detail: a.slice(idx + 3) };
    return { title: a };
  };

  return (
    <div className="px-4 sm:px-8 pt-2" role="dialog" aria-label="Suggested replies">
      <div className="mx-auto max-w-[640px]">
        <div className="lexram-popup-rise rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
              {heading ?? "Pick a reply"}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Press a number to choose, or type your own reply below.
            </p>
          </div>

          {/* Numbered options */}
          <div className="px-2 pb-2">
            {suggestions.map((s, i) => {
              const { title, detail } = splitOption(s);
              const isPrimary = i === 0;
              return (
                <button
                  key={`${i}-${s}`}
                  type="button"
                  onClick={() => onPick(s)}
                  title={s}
                  className={
                    "w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors " +
                    (isPrimary
                      ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--surface-hover)]")
                  }
                >
                  <span
                    className={
                      "flex-shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold " +
                      (isPrimary
                        ? "bg-white/20 text-white"
                        : "bg-[var(--surface-hover)] text-[var(--text-muted)]")
                    }
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={"block text-[13px] font-semibold leading-snug " + (isPrimary ? "text-white" : "")}>
                      {title}
                    </span>
                    {detail && (
                      <span
                        className={
                          "block text-[12px] mt-0.5 leading-snug " +
                          (isPrimary ? "text-white/85" : "text-[var(--text-secondary)]")
                        }
                      >
                        {detail}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-2 border-t border-[var(--border-light)] bg-[var(--surface-hover)]/40">
            <p className="text-[10px] text-[var(--text-muted)]">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] text-[10px] font-mono">Esc</kbd>
              {" "}to dismiss
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
