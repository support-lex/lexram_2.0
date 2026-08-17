'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Layers } from 'lucide-react';
import type { MoefccCluster } from '@/lib/rag-client';

interface Props {
  cluster: MoefccCluster;
  index: number;
  highlight?: boolean;
}

const PREVIEW_LENGTH = 320;

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

export function MoefccClusterCard({ cluster, index, highlight }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showAllChunks, setShowAllChunks] = useState(false);

  const best = cluster.best_chunk;
  const extraChunks = cluster.chunks.slice(1);
  const hasMoreChunks = extraChunks.length > 0;

  const needsExpand = best.content.length > PREVIEW_LENGTH;
  const visibleBest =
    expanded || !needsExpand
      ? best.content
      : best.content.slice(0, PREVIEW_LENGTH) + '…';

  const distancePct =
    typeof cluster.best_distance === 'number'
      ? Math.max(0, Math.min(100, Math.round((1 - cluster.best_distance) * 100)))
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
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">
            {cluster.theme || cluster.parent_id}
          </h3>
          {cluster.raw_title && cluster.raw_title !== cluster.theme && (
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
              {cluster.raw_title}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-mono">
            {cluster.source_type && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                {cluster.source_type}
              </span>
            )}
            {cluster.language && (
              <span className={`px-1.5 py-0.5 rounded ${langTone(cluster.language)}`}>
                {cluster.language}
              </span>
            )}
            {distancePct !== null && (
              <span className="text-[var(--text-secondary)]">
                match {distancePct}%
              </span>
            )}
            {cluster.chunk_count > 1 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--accent) 10%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                <Layers className="w-3 h-3" />
                {cluster.chunk_count} excerpts
              </span>
            )}
            <span className="text-[var(--text-secondary)] truncate">
              {cluster.parent_id}
            </span>
          </div>
        </div>
      </div>

      <div className="text-[13.5px] leading-relaxed text-[var(--text-primary)] mt-3 whitespace-pre-wrap">
        {visibleBest}
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
          {expanded ? 'Show less' : `Show full excerpt (${best.content.length} chars)`}
        </button>
      )}

      {hasMoreChunks && (
        <div className="mt-3 border-t border-[var(--border-default)] pt-3">
          <button
            onClick={() => setShowAllChunks((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            {showAllChunks ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <FileText className="w-3.5 h-3.5" />
            {showAllChunks
              ? 'Hide additional excerpts'
              : `Show ${extraChunks.length} more excerpt${extraChunks.length === 1 ? '' : 's'} from this document`}
          </button>
          {showAllChunks && (
            <div className="mt-3 space-y-3">
              {extraChunks.map((ch, i) => {
                const chPct = Math.max(
                  0,
                  Math.min(100, Math.round((1 - ch.distance) * 100)),
                );
                return (
                  <div
                    key={i}
                    className="rounded-lg bg-[var(--surface-hover)]/50 border border-[var(--border-default)]/60 p-3"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)] mb-1.5">
                      <span>Excerpt {i + 2}</span>
                      <span>·</span>
                      <span>match {chPct}%</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                      {ch.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
