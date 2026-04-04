"use client";

import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, FileText, Gavel, Clock } from "lucide-react";

interface Hearing {
  date: string;
  stage: string;
  purpose: string;
  business_on_date: string;
  detailed_business: string;
  order_date?: string;
  order_details?: string;
  next_hearing_date?: string;
  judge_name?: string;
  court?: string;
}

interface DetailedHearingHistoryProps {
  hearings: Hearing[];
  totalCount: number;
}

function HearingCard({ hearing, index }: { hearing: Hearing; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStageColor = (stage?: string) => {
    if (!stage) return 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-default)]';
    const stage_lower = stage.toLowerCase();
    if (stage_lower.includes('arguments')) return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    if (stage_lower.includes('evidence')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (stage_lower.includes('judgment') || stage_lower.includes('disposal')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (stage_lower.includes('framing')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-default)]';
  };

  const hasDetailedBusiness = (hearing.detailed_business &&
    hearing.detailed_business !== hearing.business_on_date) ||
    !!hearing.order_details;

  const hasOrder = !!(hearing.order_details || (hearing.order_date && hearing.order_details));

  // Parse date DD-MM-YYYY
  const dateParts = hearing.date.split('-');
  const day = dateParts[0] || '';
  const month = dateParts[1] || '';
  const year = dateParts[2] || '';

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-hidden hover:shadow-md transition-shadow">
      <div 
        className="p-4 cursor-pointer hover:bg-[var(--surface-hover)]"
        onClick={() => hasDetailedBusiness && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 text-center">
            <div className="bg-[var(--bg-sidebar)] text-white rounded-lg p-2 border border-[var(--accent)]/30">
              <div className="text-xs font-medium font-sans uppercase text-[var(--accent)]">{month}</div>
              <div className="text-lg font-bold font-sans">{day}</div>
              <div className="text-xs">{year}</div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold border mb-2 ${getStageColor(hearing.stage)}`}>
                  {hearing.stage}
                </span>
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  <span className="font-medium text-[var(--text-primary)]">Purpose:</span> {hearing.purpose}
                </p>
                <p className="text-sm text-[var(--text-primary)]">
                  <span className="font-semibold font-sans text-[var(--accent)]">Business:</span>{' '}
                  <span className="text-[var(--text-secondary)]">{hearing.business_on_date}</span>
                </p>
              </div>

              {hasDetailedBusiness && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                  className="p-1 hover:bg-[var(--surface-hover)] rounded-full flex-shrink-0"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && hasDetailedBusiness && (
        <div className="border-t border-[var(--border-default)] bg-[var(--bg-primary)] p-4 space-y-4">
          {/* Order / Business text from clicking Business on Date */}
          {hearing.order_details && (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold font-sans text-[var(--text-primary)] mb-2">
                <FileText className="w-4 h-4 text-emerald-500" /> Order / Business Details
                {hearing.order_date && (
                  <span className="text-xs font-normal text-[var(--text-muted)]">({hearing.order_date})</span>
                )}
              </div>
              <div className="bg-emerald-500/10 rounded-lg border border-emerald-500/20 p-4 text-sm text-emerald-300 leading-relaxed whitespace-pre-wrap">
                {hearing.order_details}
              </div>
            </div>
          )}

          {/* Detailed proceedings / next stage */}
          {hearing.detailed_business && hearing.detailed_business !== hearing.business_on_date && (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold font-sans text-[var(--text-primary)] mb-2">
                <Gavel className="w-4 h-4 text-[var(--accent)]" /> Next Stage
              </div>
              <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] p-3 text-sm text-[var(--text-secondary)]">
                {hearing.detailed_business}
              </div>
            </div>
          )}

          {/* Judge and next hearing date from Business on Date page */}
          {(hearing.judge_name || hearing.next_hearing_date) && (
            <div className="flex gap-4 text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border-default)]">
              {hearing.judge_name && (
                <span><span className="font-semibold text-[var(--text-secondary)]">Judge:</span> {hearing.judge_name}</span>
              )}
              {hearing.next_hearing_date && (
                <span><span className="font-semibold text-[var(--text-secondary)]">Next Date:</span> {hearing.next_hearing_date}</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-2 bg-[var(--bg-primary)] border-t border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Hearing #{index + 1}</span>
        </div>
        {hasDetailedBusiness && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium font-sans transition-colors">
            {isExpanded ? "Show Less" : "View Full Proceedings"}
          </button>
        )}
      </div>
    </div>
  );
}

export function DetailedHearingHistory({ hearings, totalCount }: DetailedHearingHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'with-orders' | 'arguments' | 'evidence'>('all');

  const filteredHearings = hearings.filter(h => {
    if (filter === 'with-orders') return h.order_date || h.order_details;
    if (filter === 'arguments') return h.stage?.toLowerCase().includes('arguments');
    if (filter === 'evidence') return h.stage?.toLowerCase().includes('evidence');
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--accent)]" />
          <h3 className="font-bold font-sans text-[var(--text-primary)]">Hearing History</h3>
          <span className="text-sm text-[var(--text-muted)]">({filteredHearings.length} of {totalCount})</span>
        </div>

        <div className="flex gap-1 flex-wrap">
          {(['all', 'with-orders', 'arguments', 'evidence'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium font-sans rounded-lg transition-colors ${
                filter === f ? 'bg-[var(--bg-sidebar)] text-[var(--accent)] border border-[var(--accent)]/30' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'with-orders' ? 'With Orders' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-[var(--border-default)]" />
        <div className="space-y-3 relative">
          {filteredHearings.map((hearing, index) => (
            <HearingCard key={index} hearing={hearing} index={index} />
          ))}
        </div>
      </div>

      {filteredHearings.length === 0 && (
        <div className="text-center py-8 bg-[var(--bg-primary)] rounded-lg border border-dashed border-[var(--border-default)]">
          <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No hearings match the selected filter</p>
        </div>
      )}
    </div>
  );
}

export default DetailedHearingHistory;
