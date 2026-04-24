'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import type { RagSource } from '@/lib/rag-client';

interface SourceCardProps {
  source: RagSource;
  index: number;
  highlight?: boolean;
}

const CONTENT_PREVIEW_LENGTH = 400;

export function SourceCard({ source, index, highlight }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = source.content.length > CONTENT_PREVIEW_LENGTH;
  const shown = expanded || !needsExpand ? source.content : source.content.slice(0, CONTENT_PREVIEW_LENGTH) + '…';

  const actTitle = source.act_id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // MoEFCC sources have parent_ids like "regulatory_instruments-4394" that
  // aren't backed by an act detail page — don't offer a broken Open link.
  const hasActDetail =
    !!source.act_id && !/^(regulatory_instruments|sub_legislation|circulars?)-/i.test(source.act_id);

  // Numeric citations ([1] [2]…) anchor to source-<n>; section-token
  // citations (§11) anchor to source-<section>. Ship both ids on the same
  // element so the card is reachable from either style.
  const numericAnchorId = `source-${index + 1}`;
  const sectionAnchorId = source.section ? `source-${source.section}` : null;
  const primaryId = sectionAnchorId ?? numericAnchorId;
  // Display a numeric badge for MoEFCC (no true section number), or § badge
  // for acts-style sources.
  const badge = source.section && !/^(notification|amendment|rule|order|regulation)$/i.test(source.section)
    ? `§${source.section}`
    : `[${index + 1}]`;

  return (
    <div
      id={primaryId}
      className={`bg-[var(--bg-surface)] border rounded-xl p-4 transition-all scroll-mt-24 ${
        highlight ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20' : 'border-[var(--border-default)]'
      }`}
    >
      {sectionAnchorId && sectionAnchorId !== numericAnchorId && (
        <span id={numericAnchorId} className="block -mt-24 h-24 pointer-events-none" aria-hidden />
      )}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold font-mono"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
              color: 'var(--accent)',
            }}
          >
            {badge}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2">
              {source.heading}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-secondary)] font-mono">
              <span>#{index + 1}</span>
              <span>·</span>
              <span>{actTitle}</span>
              {typeof source.rerank_score === 'number' && source.rerank_score > 0 && (
                <>
                  <span>·</span>
                  <span>
                    relevance {(source.rerank_score > 1 ? source.rerank_score : source.rerank_score * 100).toFixed(2)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {hasActDetail && (
          <Link
            href={`/dashboard/acts/${source.act_id}#section-${source.section}`}
            className="shrink-0 flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors px-2 py-1 rounded"
            title="Open in act viewer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open</span>
          </Link>
        )}
      </div>
      <div className="text-[13.5px] leading-relaxed text-[var(--text-primary)] mt-3 whitespace-pre-wrap">
        {shown}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          {expanded ? 'Show less' : `Show full text (${source.content.length} chars)`}
        </button>
      )}
    </div>
  );
}
