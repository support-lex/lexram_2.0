"use client";

import { useState } from "react";
import { Scale, ChevronDown, ChevronRight, Link2 } from "lucide-react";
import type { Authority } from "../types";

type CitationBoxProps = {
  citations: Authority[];
  /** Defaults to expanded; set false for collapsed-by-default. */
  defaultOpen?: boolean;
};

function getHost(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Heuristic split: if the case name is the primary identifier (contains "v."
 * or "In re"), use it as the gold lede and put the citation in dark below.
 * Otherwise the citation itself is the lede (e.g. statute codes like
 * "10 Del. C. § 8106") and the case-name field holds the descriptive title.
 */
function splitLedeAndTitle(c: { caseName: string; citation: string }) {
  const isCaseName = /\bv\.|\bIn re\b/i.test(c.caseName);
  if (isCaseName) {
    return { lede: c.caseName, title: c.citation };
  }
  return { lede: c.citation, title: c.caseName };
}

/**
 * AUTHORITIES card — light paper-style panel inspired by the Stitch reference.
 * Each row is a clean white card: numbered badge on the left, gold lede (case
 * name or statute code), dark bold title underneath, muted description, link
 * icon top-right.
 */
export default function CitationBox({ citations, defaultOpen = true }: CitationBoxProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  if (!citations || citations.length === 0) return null;

  const visible = showAll ? citations : citations.slice(0, 4);
  const hiddenCount = citations.length - visible.length;

  return (
    <div className="mt-3 rounded-2xl lexram-glass shadow-[var(--shadow-card)] overflow-hidden text-[var(--text-primary)]">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-medium text-[var(--text-primary)] oracle-serif">Source Citations</span>
          <span className="text-[10px] uppercase tracking-widest text-[var(--oracle-primary-container,#c6a76e)]">Verification Engine</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold text-[var(--accent)] bg-[var(--accent)]/5 border border-[var(--accent)]/10">
            [{citations.length}]
          </span>
          {open ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {open && (
        <>
          <ol className="px-4 pb-4 pt-1 space-y-3">
            {visible.map((c, i) => {
              const { lede, title } = splitLedeAndTitle(c);
              const yearPart = c.year && c.year !== "—" ? ` (${c.year})` : "";
              const inner = (
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-[var(--bg-sidebar)] text-white text-[10px] font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 relative">
                    {c.linkHint && (
                      <Link2 className="absolute top-0 right-0 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                    <div className="min-w-0 pr-6">
                      <div className="text-[13px] font-semibold text-[var(--accent)] leading-snug truncate">
                        {lede}
                      </div>
                      {title && (
                        <div className="text-[15px] font-bold text-[var(--text-primary)] leading-snug mt-1">
                          {title}
                          {yearPart && (
                            <span className="font-semibold">{yearPart}</span>
                          )}
                        </div>
                      )}
                      {c.proposition && c.proposition !== title && c.proposition !== lede && (
                        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mt-1.5 line-clamp-2">
                          {c.proposition}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
              return (
                <li key={`cit-${i}`}>
                  {c.linkHint ? (
                    <a
                      href={c.linkHint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl oracle-citation-card border-l-4 border-l-[var(--oracle-primary-container,#c6a76e)] p-5 hover:bg-white transition-colors cursor-pointer"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="rounded-xl oracle-citation-card border-l-4 border-l-[var(--oracle-primary-container,#c6a76e)] p-5">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Footer — expand / collapse */}
          {citations.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full px-4 py-2.5 text-[11px] font-bold tracking-[0.16em] text-[var(--accent)] hover:bg-[var(--surface-hover)] border-t border-[var(--border-default)] transition-colors"
            >
              {showAll
                ? "SHOW LESS"
                : `SHOW ALL CITATIONS (${hiddenCount} MORE)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
