'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { MoefccSource } from '@/lib/rag-client';

interface Props {
  source: MoefccSource;
  index: number;
  highlight?: boolean;
}

const PREVIEW_LENGTH = 300;

function langTone(lang?: string): string {
  switch (lang) {
    case 'english':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300';
    case 'hindi':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
    case 'mixed':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300';
    default:
      return 'bg-[var(--surface-hover)] text-[var(--text-secondary)]';
  }
}

export function MoefccSourceCard({ source, index, highlight }: Props) {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = source.content.length > PREVIEW_LENGTH;
  const visible =
    expanded || !needsExpand
      ? source.content
      : source.content.slice(0, PREVIEW_LENGTH) + '…';
  const distancePct =
    typeof source.distance === 'number'
      ? Math.max(0, Math.min(100, Math.round((1 - source.distance) * 100)))
      : null;

  return (
    <div
      id={`moefcc-source-${index + 1}`}
      className={`bg-[var(--bg-surface)] border rounded-xl p-4 scroll-mt-24 transition-all ${
        highlight
          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
          : 'border-[var(--border-default)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold font-mono"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
            color: 'var(--accent)',
          }}
        >
          [{index + 1}]
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2">
            {source.title || source.parent_id}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-mono">
            {source.source_type && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                {source.source_type}
              </span>
            )}
            {source.language && (
              <span className={`px-1.5 py-0.5 rounded ${langTone(source.language)}`}>
                {source.language}
              </span>
            )}
            {distancePct !== null && (
              <span className="text-[var(--text-secondary)]">
                match {distancePct}%
              </span>
            )}
            <span className="text-[var(--text-secondary)] truncate">
              {source.parent_id}
            </span>
          </div>
        </div>
      </div>
      <div className="text-[13.5px] leading-relaxed text-[var(--text-primary)] mt-3 whitespace-pre-wrap">
        {visible}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          {expanded ? 'Show less' : `Show full text (${source.content.length} chars)`}
        </button>
      )}
    </div>
  );
}
