'use client';

import { useState } from 'react';
import { Scale, X, Search, FileSpreadsheet } from 'lucide-react';
import { SingleCaseSearch } from './add-case/SingleCaseSearch';
import { BulkImportTab } from './add-case/BulkImportTab';
import { BulkPreviewModal } from './add-case/BulkPreviewModal';
import type { SearchResult } from '@/app/dashboard/case-status/types';
import { generateDetailedHearings } from '@/app/dashboard/case-status/utils';
import { searchByCNR } from '@/lib/case-status-fetchers';
import { trackCase } from '@/lib/case-status-fetchers/tracked-cases';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AddCaseModalProps {
  show: boolean;
  onClose: () => void;
  /** Called after a successful add or bulk import — triggers loadTrackedCases() in parent */
  onImportComplete: () => Promise<void>;
  toastSuccess: (msg: string) => void;
  toastError: (msg: string) => void;
}

type ModalTab = 'single' | 'bulk';

// ── Component ─────────────────────────────────────────────────────────────────

export function AddCaseModal({
  show,
  onClose,
  onImportComplete,
  toastSuccess,
  toastError,
}: AddCaseModalProps) {
  // ── Modal-local state ──────────────────────────────────────────────────────
  const [modalTab, setModalTab] = useState<ModalTab>('single');

  // Bulk preview modal
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [pendingCnrs, setPendingCnrs] = useState<string[]>([]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const close = () => {
    setModalTab('single');
    setShowBulkPreview(false);
    setPendingCnrs([]);
    onClose();
  };

  const handleShowPreview = (cnrs: string[]) => {
    setPendingCnrs(cnrs);
    setShowBulkPreview(true);
  };

  const handleBulkImportConfirm = async (dataToImport: Array<{ cnr_number: string; case_name?: string }>) => {
    if (dataToImport.length === 0) return;

    const results = { successful: 0, failed: 0, errors: [] as Array<{ cnr: string; error: string }> };

    for (let i = 0; i < dataToImport.length; i++) {
      const row = dataToImport[i];

      if (!row.cnr_number?.trim()) continue;

      try {
        const searchRes: SearchResult = await searchByCNR(row.cnr_number.trim());

        if (searchRes.success && searchRes.data) {
          // Only use generated hearings as fallback if scraper returned none
          if (!searchRes.data.hearings?.length) {
            searchRes.data.hearings = generateDetailedHearings(row.cnr_number.trim());
          }

          const trackResult = await trackCase({
            cnr_number: row.cnr_number.trim(),
            case_data: searchRes.data,
            custom_name: row.case_name || searchRes.data.case_title,
          });

          if (trackResult.success || trackResult.error?.includes('already tracked')) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push({ cnr: row.cnr_number, error: trackResult.error || 'Failed to save' });
          }
        } else {
          results.failed++;
          results.errors.push({ cnr: row.cnr_number, error: searchRes.error || 'Search failed' });
        }
      } catch {
        results.failed++;
        results.errors.push({ cnr: row.cnr_number, error: 'Network error' });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await onImportComplete();

    if (results.failed === 0) {
      toastSuccess(`${results.successful} case${results.successful !== 1 ? 's' : ''} imported successfully`);
    } else {
      toastError(`Import complete: ${results.successful} succeeded, ${results.failed} failed`);
    }

    close();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!show) return null;

  return (
    <>
      {/* ── Add Case Modal ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Add new case"
      >
        <div className="absolute inset-0 bg-[var(--bg-sidebar)]/60 backdrop-blur-sm" onClick={close} />
        <div
          className="relative bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onKeyDown={(e) => e.key === 'Escape' && close()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--bg-sidebar-hover)] flex items-center justify-between bg-[var(--bg-sidebar)]">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="font-sans font-bold text-white">Add New Case</h3>
            </div>
            <button onClick={close} className="text-[var(--text-muted)] hover:text-[var(--text-on-sidebar)] transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-64px)]">

            {/* Tab switcher */}
            <div className="flex gap-2 p-1 bg-[var(--bg-primary)] rounded-xl">
              <button
                onClick={() => setModalTab('single')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                  modalTab === 'single'
                    ? 'bg-[var(--bg-sidebar)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Single Case
              </button>
              <button
                onClick={() => setModalTab('bulk')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                  modalTab === 'bulk'
                    ? 'bg-[var(--bg-sidebar)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Bulk Import
              </button>
            </div>

            {/* ── Single Case Tab ── */}
            {modalTab === 'single' && (
              <SingleCaseSearch
                onCaseAdded={async () => {
                  await onImportComplete();
                  close();
                }}
                toastSuccess={toastSuccess}
                toastError={toastError}
              />
            )}

            {/* ── Bulk Import Tab ── */}
            {modalTab === 'bulk' && (
              <BulkImportTab
                onCaseAdded={onImportComplete}
                onShowPreview={handleShowPreview}
                toastSuccess={toastSuccess}
                toastError={toastError}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Bulk Preview Confirmation Modal ── */}
      <BulkPreviewModal
        show={showBulkPreview}
        pendingCnrs={pendingCnrs}
        onConfirm={handleBulkImportConfirm}
        onCancel={() => {
          setShowBulkPreview(false);
          setPendingCnrs([]);
        }}
        toastError={toastError}
      />
    </>
  );
}

export default AddCaseModal;
