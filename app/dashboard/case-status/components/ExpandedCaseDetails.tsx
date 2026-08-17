"use client";

import { Clock, FileText, ExternalLink } from 'lucide-react';
import { DetailedHearingHistory } from '@/components/case-status/DetailedHearingHistory';
import type { TrackedCase } from '../types';

interface ExpandedCaseDetailsProps {
  trackedCase: TrackedCase;
}

export function ExpandedCaseDetails({ trackedCase }: ExpandedCaseDetailsProps) {
  const status = trackedCase.status;
  if (!status) return null;

  return (
    <div className="space-y-4">
      {/* Key Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Case No.', value: status.case_number },
          { label: 'Filing Date', value: status.filing_date },
          { label: 'Stage', value: status.case_stage },
          { label: 'Judge', value: status.judge },
          { label: 'Advocate', value: status.advocate },
        ].map(item =>
          item.value ? (
            <div
              key={item.label}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3"
            >
              <p className="text-xs text-[var(--text-muted)] mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] break-words">
                {item.value}
              </p>
            </div>
          ) : null
        )}
      </div>

      {/* Parties */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Petitioner
          </p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {status.petitioner || '—'}
          </p>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Respondent
          </p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {status.respondent || '—'}
          </p>
        </div>
      </div>

      {/* Act / Section / IA Status */}
      {(status.act || status.section || (status.ia_status && (status.ia_status as unknown[]).length > 0)) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {status.act && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Under Act(s)
              </p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{status.act}</p>
              {status.section && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">Section: {status.section}</p>
              )}
            </div>
          )}
          {status.ia_status && (status.ia_status as unknown[]).length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                IA Status
              </p>
              {(status.ia_status as Array<{ ia_number?: string; ia_status?: string; ia_date?: string } | string>).map((ia, idx) => (
                <div key={idx} className="text-xs text-[var(--text-secondary)] mb-1">
                  {typeof ia === 'string' ? ia : (
                    <span>{ia.ia_number} – {ia.ia_status}{ia.ia_date ? ` (${ia.ia_date})` : ''}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Hearing History */}
      {status.hearings && status.hearings.length > 0 && (
        <DetailedHearingHistory
          hearings={status.hearings}
          totalCount={status.hearings.length}
        />
      )}

      {/* Orders */}
      {status.orders && status.orders.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Orders ({status.orders.length})
          </p>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {status.orders.map((order, idx) => (
              <div
                key={idx}
                className="py-1.5 border-b border-[var(--border-light,#f4f4f5)] last:border-0"
              >
                <p className="text-xs font-mono text-[var(--text-muted)] mb-0.5">{order.date}</p>
                <p className="text-sm text-[var(--text-primary)]">{order.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {status.documents && status.documents.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Documents ({status.documents.length})
          </p>
          <div className="space-y-2">
            {status.documents.map((doc, idx) => (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors group/doc"
              >
                <div className="p-2 bg-[var(--bg-sidebar)]/6 rounded-lg">
                  <FileText className="w-4 h-4 text-[var(--bg-sidebar)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {doc.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {doc.type} · {doc.date}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover/doc:text-[var(--accent)] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Last updated:{' '}
        {trackedCase.last_updated
          ? new Date(trackedCase.last_updated).toLocaleString()
          : 'Never'}
      </p>
    </div>
  );
}

export default ExpandedCaseDetails;
