'use client';

import { Upload, X, Info } from 'lucide-react';
import { generateDetailedHearings } from '@/app/dashboard/case-status/utils';
import type { SearchResult } from '@/app/dashboard/case-status/types';
import { searchByCNR } from '@/lib/case-status-fetchers/case-status';
import { trackCase } from '@/lib/case-status-fetchers/tracked-cases';

interface BulkPreviewModalProps {
  show: boolean;
  pendingCnrs: string[];
  onConfirm: (dataToImport: Array<{ cnr_number: string; case_name?: string }>) => Promise<void>;
  onCancel: () => void;
  toastError: (msg: string) => void;
}

export function BulkPreviewModal({
  show,
  pendingCnrs,
  onConfirm,
  onCancel,
  toastError,
}: BulkPreviewModalProps) {
  if (!show) return null;

  const handleConfirm = async () => {
    const data = pendingCnrs.map(cnr => ({ cnr_number: cnr.trim() }));
    onCancel();
    await onConfirm(data);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--bg-sidebar)]/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--bg-sidebar-hover)] flex items-center justify-between bg-[var(--bg-sidebar)]">
          <h2 className="font-sans text-base font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-[var(--accent)]" />
            Confirm Bulk Import
          </h2>
          <button
            onClick={onCancel}
            className="text-[var(--text-muted)] hover:text-[var(--text-on-sidebar)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Found{' '}
            <span className="font-bold text-[var(--text-primary)]">{pendingCnrs.length} CNR numbers</span>{' '}
            to import:
          </p>

          <div className="max-h-64 overflow-y-auto border border-[var(--border-default)] rounded-xl bg-[var(--bg-primary)] p-3 mb-4 space-y-2">
            {pendingCnrs.map((cnr, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 py-2 px-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]"
              >
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-[var(--bg-sidebar)] text-[var(--accent)] text-xs font-bold rounded-full">
                  {idx + 1}
                </span>
                <span className="font-mono text-sm text-[var(--text-primary)]">{cnr}</span>
              </div>
            ))}
          </div>

          <div className="bg-[var(--bg-sidebar)]/5 border border-[var(--bg-sidebar)]/10 rounded-xl p-3 mb-5">
            <p className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[var(--text-muted)]" />
              All {pendingCnrs.length} cases will be added. Case details will be fetched automatically.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Import {pendingCnrs.length} Cases
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
