'use client';

import { useState } from 'react';
import {
  Upload, Download, RefreshCw, FileSpreadsheet, Info,
} from 'lucide-react';
import {
  validateCNRs,
  parseCSV,
} from '@/app/dashboard/case-status/utils';
import type { SearchResult } from '@/app/dashboard/case-status/types';
import { searchByCNR } from '@/lib/case-status-fetchers/case-status';
import { trackCase } from '@/lib/case-status-fetchers/tracked-cases';

type CsvRow = {
  cnr_number: string;
  case_name?: string;
  state?: string;
  district?: string;
  establishment?: string;
  case_type?: string;
  case_number?: string;
  year?: string;
};

interface BulkImportTabProps {
  onCaseAdded: () => Promise<void>;
  onShowPreview: (cnrs: string[]) => void;
  toastSuccess: (msg: string) => void;
  toastError: (msg: string) => void;
}

export function BulkImportTab({
  onCaseAdded,
  onShowPreview,
  toastSuccess,
  toastError,
}: BulkImportTabProps) {
  const [bulkCnrNumbers, setBulkCnrNumbers] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCsvData, setParsedCsvData] = useState<CsvRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: Array<{ cnr: string; error: string }>;
  }>({ successful: 0, failed: 0, errors: [] });

  const handleCsvFileChange = (file: File | null) => {
    setCsvFile(file);
    setParsedCsvData([]);
    setImportResults({ successful: 0, failed: 0, errors: [] });

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setParsedCsvData(parseCSV(text));
      };
      reader.readAsText(file);
    }
  };

  const handleBulkImport = async (dataToImport: Array<{ cnr_number: string; case_name?: string }>) => {
    if (dataToImport.length === 0) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: dataToImport.length });
    setImportResults({ successful: 0, failed: 0, errors: [] });

    const results = { successful: 0, failed: 0, errors: [] as Array<{ cnr: string; error: string }> };

    for (let i = 0; i < dataToImport.length; i++) {
      const row = dataToImport[i];
      setImportProgress({ current: i + 1, total: dataToImport.length });

      if (!row.cnr_number?.trim()) continue;

      try {
        const searchRes: SearchResult = await searchByCNR(row.cnr_number.trim());

        if (searchRes.success && searchRes.data) {
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

    await onCaseAdded();
    setImportResults(results);
    setIsImporting(false);

    if (results.failed === 0) {
      toastSuccess(`${results.successful} case${results.successful !== 1 ? 's' : ''} imported successfully`);
    } else {
      toastError(`Import complete: ${results.successful} succeeded, ${results.failed} failed`);
    }
  };

  return (
    <>
      {/* Quick paste */}
      <div className="p-4 bg-[var(--bg-sidebar)]/5 border border-[var(--bg-sidebar)]/10 rounded-xl">
        <h3 className="font-sans font-sans text-sm font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Paste CNR Numbers
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          Paste multiple CNR numbers separated by commas or spaces
        </p>
        <textarea
          value={bulkCnrNumbers}
          onChange={(e) => setBulkCnrNumbers(e.target.value)}
          placeholder="HCMA010147332018, HCMA010771102018, HCMA010163642018…"
          className="w-full px-3 py-2.5 text-sm bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 min-h-[72px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[var(--text-muted)]">
            {bulkCnrNumbers.trim()
              ? `${bulkCnrNumbers.trim().split(/[\s,]+/).filter(Boolean).length} CNRs detected`
              : ''}
          </span>
          <button
            onClick={() => {
              const cnrs = bulkCnrNumbers.trim().split(/[\s,]+/).filter(Boolean);
              if (cnrs.length === 0) return;
              const { valid, invalid } = validateCNRs(cnrs);
              if (invalid.length > 0) {
                toastError(
                  `Invalid CNR format: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? ` +${invalid.length - 3} more` : ''}`
                );
                return;
              }
              if (valid.length === 0) {
                toastError('No valid CNR numbers found');
                return;
              }
              onShowPreview(valid);
              setBulkCnrNumbers('');
            }}
            disabled={!bulkCnrNumbers.trim() || isImporting}
            className="px-4 py-2 text-xs font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {isImporting
              ? <><RefreshCw className="w-3 h-3 animate-spin" /> Importing…</>
              : <><Upload className="w-3 h-3" /> Import {bulkCnrNumbers.trim().split(/[\s,]+/).filter(Boolean).length || ''} Cases</>
            }
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border-default)]" />
        <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">or upload CSV</span>
        <div className="flex-1 h-px bg-[var(--border-default)]" />
      </div>

      {/* CSV Upload */}
      <div>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            csvFile
              ? 'border-[var(--accent)]/60 bg-[var(--accent)]/5'
              : 'border-[var(--border-default)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-primary)]'
          }`}
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            onChange={(e) => handleCsvFileChange(e.target.files?.[0] || null)}
            className="hidden"
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" />
          {csvFile ? (
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{csvFile.name}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {(csvFile.size / 1024).toFixed(1)} KB
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); handleCsvFileChange(null); }}
                className="mt-3 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">CSV file with a CNR column</p>
            </div>
          )}
        </div>

        <div className="mt-3 text-center">
          <button
            onClick={() => {
              const template = `CNR Number,Case Name,State,District,Establishment,Case Type,Case Number,Year\nTNKP1C0001322014,Example Case 1,Tamil Nadu,Kancheepuram,Judicial Magistrate,CC,1234,2014\nDLH0123456202024,Example Case 2,Delhi,Delhi,District Court,CS,5678,2024`;
              const blob = new Blob([template], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'case_import_template.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] inline-flex items-center gap-1 transition-colors"
          >
            <Download className="w-3 h-3" />
            Download CSV template
          </button>
        </div>
      </div>

      {/* CSV Preview */}
      {parsedCsvData.length > 0 && importResults.successful === 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              Preview — {parsedCsvData.length} cases
            </h4>
            <button
              onClick={() => handleBulkImport(parsedCsvData)}
              disabled={isImporting}
              className="px-4 py-2 text-sm font-bold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] rounded-xl disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              {isImporting
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing…</>
                : <><Upload className="w-3.5 h-3.5" /> Import All</>
              }
            </button>
          </div>

          {isImporting && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                <span>Importing…</span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-[var(--border-default)] rounded-full h-1.5">
                <div
                  className="bg-[var(--accent)] h-1.5 rounded-full transition-all"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="border border-[var(--border-default)] rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-[var(--bg-sidebar)] sticky top-0">
                <tr>
                  {['CNR Number', 'Case Name', 'State', 'District'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-bold text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light,#f4f4f5)]">
                {parsedCsvData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                    <td className="px-3 py-2 font-mono text-[var(--text-primary)]">{row.cnr_number}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.case_name || '—'}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.state || '—'}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.district || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedCsvData.length > 10 && (
              <div className="px-3 py-2 text-xs text-[var(--text-muted)] text-center border-t border-[var(--border-default)] bg-[var(--bg-primary)]">
                Showing 10 of {parsedCsvData.length} cases
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Results */}
      {(importResults.successful > 0 || importResults.failed > 0) && (
        <div>
          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Import Results</h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{importResults.successful}</p>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">Imported</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
              <p className="text-xs text-red-700 font-semibold mt-0.5">Failed</p>
            </div>
          </div>
          {importResults.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <h5 className="text-xs font-bold text-red-800 mb-2">Failed Cases</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {importResults.errors.map((err, idx) => (
                  <div key={idx} className="text-xs text-red-700">
                    <span className="font-mono">{err.cnr}</span>: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCsvFile(null);
                setParsedCsvData([]);
                setImportResults({ successful: 0, failed: 0, errors: [] });
                setBulkCnrNumbers('');
              }}
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-xl transition-colors"
            >
              Done
            </button>
            <button
              onClick={() => {
                setCsvFile(null);
                setParsedCsvData([]);
                setImportResults({ successful: 0, failed: 0, errors: [] });
              }}
              className="px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
            >
              Import More
            </button>
          </div>
        </div>
      )}
    </>
  );
}
