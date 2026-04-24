"use client";

import { ArrowUpRight, Copy } from "lucide-react";
import type { Authority } from "../../types";

interface InlineAuthoritiesProps {
  authorities: Authority[];
}

const TREATMENT_STYLES: Record<
  Authority["treatment"],
  { dot: string; pillBg: string; pillText: string; cardBg: string }
> = {
  followed: {
    dot: "bg-emerald-500",
    pillBg: "bg-emerald-500/10",
    pillText: "text-emerald-600",
    cardBg: "bg-gradient-to-br from-[var(--bg-surface)] to-emerald-50/10",
  },
  distinguished: {
    dot: "bg-amber-500",
    pillBg: "bg-amber-500/10",
    pillText: "text-amber-600",
    cardBg: "bg-gradient-to-br from-[var(--bg-surface)] to-amber-50/10",
  },
  uncertain: {
    dot: "bg-[var(--text-muted)]",
    pillBg: "bg-[var(--surface-hover)]",
    pillText: "text-[var(--text-secondary)]",
    cardBg: "bg-[var(--bg-surface)]",
  },
};

export default function InlineAuthorities({ authorities }: InlineAuthoritiesProps) {
  if (authorities.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {authorities.map((a, i) => {
        const style = TREATMENT_STYLES[a.treatment];
        const sourceUrl =
          a.linkHint ||
          `https://indiankanoon.org/search/?formInput=${encodeURIComponent(`${a.caseName} ${a.citation}`)}`;
        return (
          <div
            key={`${a.citation}-${i}`}
            className={`group rounded-lg ring-1 ring-[var(--border-default)] p-3 transition-all hover:ring-[var(--accent)]/30 ${style.cardBg}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[var(--text-primary)] inline-flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full bg-[var(--bg-sidebar)] text-white text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {a.caseName}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono">{a.citation}</span>
                  <span className="opacity-40">·</span>
                  <span>{a.court}</span>
                  <span className="opacity-40">·</span>
                  <span>{a.year}</span>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] leading-snug">
                  {a.proposition}
                </p>
              </div>
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${style.pillBg} ${style.pillText}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                {a.treatment}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`${a.caseName} ${a.citation}`)}
                className="px-2 py-1 rounded hover:bg-[var(--surface-hover)] text-[11px] font-medium text-[var(--text-secondary)] inline-flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded hover:bg-[var(--accent)]/10 text-[11px] font-medium text-[var(--accent)] inline-flex items-center gap-1"
              >
                Open source <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
