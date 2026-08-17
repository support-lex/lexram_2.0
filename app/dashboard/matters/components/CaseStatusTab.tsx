"use client";

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import {
  Search, Plus, Bell, BellOff, Trash2, RefreshCw,
  Scale, Calendar, AlertCircle, ArrowRight,
  Download, CheckSquare, Square, X,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { TrackedCase } from '@/app/dashboard/case-status/types';
import { getStatusColor, isUpcomingHearing, generateDetailedHearings } from '@/app/dashboard/case-status/utils';
import {
  getTrackedCases,
  removeTrackedCase,
  updateTrackedCase,
  trackCase,
  searchByCNR,
  exportCases,
  getErrorLogs,
  clearErrorLogs as clearErrorLogsApi,
} from '@/lib/case-status-fetchers';
import { CaseActionButtons } from '@/app/dashboard/case-status/components/CaseActionButtons';
import { ExpandedCaseDetails } from '@/app/dashboard/case-status/components/ExpandedCaseDetails';
import { AddCaseModal } from '@/app/dashboard/case-status/components/AddCaseModal';

interface CaseStatusTabProps {
  matterId?: string;
}

export function CaseStatusTab({ matterId = '' }: CaseStatusTabProps) {
  const [trackedCases, setTrackedCases] = useState<TrackedCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<string | null>(null);
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);
  const [importingCaseIds] = useState<Set<string>>(new Set());
  const [refreshingCaseIds, setRefreshingCaseIds] = useState<Set<string>>(new Set());
  const [showErrorLog, setShowErrorLog] = useState(false);
  const [errorLogs, setErrorLogs] = useState<Array<{ timestamp: string; source: string; cnr_number?: string; error: string; details?: string }>>([]);
  const [errorLogsLoading, setErrorLogsLoading] = useState(false);
  const [expandedLogEntries, setExpandedLogEntries] = useState<Set<number>>(new Set());

  const toastSuccess = (msg: string) => toast.success(msg);
  const toastError = (msg: string) => toast.error(msg);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showAddModal]);

  useEffect(() => { loadTrackedCases(); }, []);

  // -- Data loading ---------------------------------------------------------------

  const loadTrackedCases = async () => {
    try {
      const result = await getTrackedCases();
      setTrackedCases(result.success && result.data ? result.data : []);
    } catch (error) {
      console.error('Failed to load tracked cases:', error);
      toastError('Failed to load tracked cases');
      setTrackedCases([]);
    } finally {
      setLastUpdateCheck(new Date().toLocaleString());
      setIsLoading(false);
    }
  };

  // -- Case actions ---------------------------------------------------------------

  const handleRemoveCase = (caseId: string) => {
    setConfirmDelete({ type: 'single', id: caseId });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'single' && confirmDelete.id) {
        const trackedCase = trackedCases.find(c => c.id === confirmDelete.id);
        if (trackedCase?.cnr_number) {
          const result = await removeTrackedCase(trackedCase.cnr_number);
          if (result.success) {
            await loadTrackedCases();
            toastSuccess('Case removed from tracker');
          } else {
            toastError(result.error || 'Failed to remove case');
          }
        }
      } else if (confirmDelete.type === 'bulk') {
        const count = selectedCases.size;
        let failed = 0;
        for (const caseId of selectedCases) {
          const trackedCase = trackedCases.find(c => c.id === caseId);
          if (trackedCase?.cnr_number) {
            const result = await removeTrackedCase(trackedCase.cnr_number);
            if (!result.success) failed++;
          }
        }
        await loadTrackedCases();
        setSelectedCases(new Set());
        if (failed === 0) {
          toastSuccess(`${count} case${count !== 1 ? 's' : ''} removed`);
        } else {
          toastError(`${count - failed} removed, ${failed} failed`);
        }
      }
    } catch {
      toastError('Failed to remove case');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleToggleNotification = async (caseId: string) => {
    const trackedCase = trackedCases.find(c => c.id === caseId);
    if (!trackedCase) return;
    const newValue = !trackedCase.notification_enabled;
    try {
      const result = await updateTrackedCase(caseId, { notification_enabled: newValue });
      if (result.success) {
        setTrackedCases(prev => prev.map(c => c.id === caseId ? { ...c, notification_enabled: newValue } : c));
      } else {
        toastError('Failed to update notification setting');
      }
    } catch {
      toastError('Failed to update notification setting');
    }
  };

  const handleRefreshStatus = async (caseId: string) => {
    const trackedCase = trackedCases.find(c => c.id === caseId);
    if (!trackedCase?.cnr_number) return;
    setRefreshingCaseIds(prev => new Set(prev).add(caseId));
    try {
      const result = await searchByCNR(trackedCase.cnr_number);
      if (result.success && result.data) {
        // Only use generated hearings as fallback if scraper returned none
        if (!result.data.hearings?.length) {
          result.data.hearings = generateDetailedHearings(trackedCase.cnr_number);
        }
        await trackCase({
          cnr_number: trackedCase.cnr_number,
          case_data: result.data,
          custom_name: trackedCase.case_name,
        });
        await loadTrackedCases();
        toastSuccess('Status updated');
      } else {
        toastError(result.error || 'Failed to refresh status');
      }
    } catch {
      toastError('Failed to refresh — check connection');
    } finally {
      setRefreshingCaseIds(prev => {
        const s = new Set(prev);
        s.delete(caseId);
        return s;
      });
    }
  };

  const refreshAllStatuses = async () => {
    for (const tc of trackedCases) {
      if (tc.cnr_number) await handleRefreshStatus(tc.id);
    }
    setLastUpdateCheck(new Date().toLocaleString());
  };

  const handleExportAll = async () => {
    try {
      const result = await exportCases(trackedCases);
      if (result.success && result.csv && result.filename) {
        const blob = new Blob([result.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toastSuccess('Cases exported to CSV');
      } else {
        toastError('Export failed — please try again');
      }
    } catch {
      toastError('Export failed — check connection');
    }
  };

  // -- Bulk selection -------------------------------------------------------------

  const toggleCaseSelection = (caseId: string) => {
    const s = new Set(selectedCases);
    s.has(caseId) ? s.delete(caseId) : s.add(caseId);
    setSelectedCases(s);
  };

  const toggleSelectAll = () => {
    setSelectedCases(
      selectedCases.size === filteredCases.length
        ? new Set()
        : new Set(filteredCases.map(c => c.id))
    );
  };

  const handleBulkDelete = () => {
    if (selectedCases.size === 0) return;
    setConfirmDelete({ type: 'bulk' });
  };

  const handleBulkRefresh = async () => {
    for (const caseId of selectedCases) {
      const tc = trackedCases.find(c => c.id === caseId);
      if (tc?.cnr_number) await handleRefreshStatus(caseId);
    }
  };

  const loadErrorLogs = async () => {
    setErrorLogsLoading(true);
    try {
      const result = await getErrorLogs(50);
      setErrorLogs(result.success ? (result.data ?? []) : []);
    } catch {
      toastError('Failed to load error logs');
    } finally {
      setErrorLogsLoading(false);
    }
  };

  const clearErrorLogs = async () => {
    try {
      await clearErrorLogsApi();
      setErrorLogs([]);
      toastSuccess('Error log cleared');
    } catch {
      toastError('Failed to clear error log');
    }
  };

  const toggleErrorLog = () => {
    if (!showErrorLog) {
      loadErrorLogs();
      setExpandedLogEntries(new Set());
    }
    setShowErrorLog(v => !v);
  };

  const toggleLogEntry = (idx: number) => {
    setExpandedLogEntries(prev => {
      const s = new Set(prev);
      s.has(idx) ? s.delete(idx) : s.add(idx);
      return s;
    });
  };

  /** Threshold in characters before we show the expand toggle */
  const LOG_PREVIEW_LEN = 200;

  // -- Derived state --------------------------------------------------------------

  const filteredCases = trackedCases.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.case_name?.toLowerCase().includes(q) ||
      c.cnr_number?.toLowerCase().includes(q) ||
      c.status?.case_title?.toLowerCase().includes(q) ||
      c.status?.advocate?.toLowerCase().includes(q) ||
      c.status?.petitioner?.toLowerCase().includes(q) ||
      c.status?.respondent?.toLowerCase().includes(q)
    );
  });

  const activeCount   = trackedCases.filter(c => c.status?.status?.toLowerCase().match(/active|pending/)).length;
  const upcomingCount = trackedCases.filter(c => isUpcomingHearing(c.status?.next_hearing_date || '')).length;
  const disposedCount = trackedCases.filter(c => c.status?.status?.toLowerCase().match(/disposed|closed/)).length;

  // -- Render ---------------------------------------------------------------------

  return (
    <div className="space-y-6">

      {/* -- Action Bar (no page header) -- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {lastUpdateCheck && trackedCases.length > 0 && (
            <p className="text-sm text-[var(--text-secondary)]">
              Updated {lastUpdateCheck}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {trackedCases.length > 0 && (
            <>
              <button
                onClick={refreshAllStatuses}
                disabled={refreshingCaseIds.size > 0}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg disabled:opacity-50 transition-colors"
                title="Refresh all cases"
              >
                <RefreshCw className={`w-4 h-4 ${refreshingCaseIds.size > 0 ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExportAll}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </>
          )}
          <button
            onClick={toggleErrorLog}
            className={`p-2 rounded-lg transition-colors ${
              showErrorLog
                ? 'text-red-500 bg-red-500/10 ring-1 ring-red-500/20'
                : 'text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10'
            }`}
            title="View fetch error log"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[var(--accent)] text-[var(--accent-text)] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 shadow-[var(--shadow-card)]"
          >
            <Plus className="w-4 h-4" />
            {trackedCases.length === 0 ? 'Add Case' : 'New'}
          </button>
        </div>
      </div>

      {/* -- Stats Bar -- */}
      {trackedCases.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Cases', value: trackedCases.length, gold: false },
            { label: 'Active', value: activeCount, gold: false },
            { label: 'Upcoming (7d)', value: upcomingCount, gold: upcomingCount > 0 },
            { label: 'Disposed', value: disposedCount, gold: false },
          ].map(stat => (
            <div
              key={stat.label}
              className={`bg-[var(--bg-surface)] rounded-xl border p-4 transition-colors ${
                stat.gold
                  ? 'border-[var(--accent)]/60 shadow-sm shadow-[var(--accent)]/10'
                  : 'border-[var(--border-default)]'
              }`}
            >
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.gold ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* -- Error Log Panel -- */}
      {showErrorLog && (
        <div className="bg-red-500/5 ring-1 ring-red-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-800">eCourts Fetch Error Log</span>
              {errorLogs.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-200 text-red-800 rounded-full">
                  {errorLogs.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadErrorLogs}
                disabled={errorLogsLoading}
                className="text-xs font-semibold text-red-700 hover:text-red-900 px-2 py-1 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                title="Refresh error log"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${errorLogsLoading ? 'animate-spin' : ''}`} />
              </button>
              {errorLogs.length > 0 && (
                <button
                  onClick={clearErrorLogs}
                  className="text-xs font-semibold text-red-700 hover:text-red-900 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                >
                  Clear
                </button>
              )}
              <button onClick={() => setShowErrorLog(false)} className="text-red-500 hover:text-red-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {errorLogsLoading ? (
            <div className="p-4 text-sm text-red-700 text-center">Loading...</div>
          ) : errorLogs.length === 0 ? (
            <div className="p-4 text-sm text-red-700 text-center">No errors logged.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-red-100">
              {errorLogs.map((entry, idx) => {
                const isExpanded = expandedLogEntries.has(idx);
                const errorText = entry.error ?? '';
                const isLong = errorText.length > LOG_PREVIEW_LEN;
                const displayText = isLong && !isExpanded
                  ? errorText.slice(0, LOG_PREVIEW_LEN) + '...'
                  : errorText;
                const detailsText = entry.details ?? '';
                const detailsLong = detailsText.length > LOG_PREVIEW_LEN;
                const displayDetails = detailsLong && !isExpanded
                  ? detailsText.slice(0, LOG_PREVIEW_LEN) + '...'
                  : detailsText;

                return (
                  <div key={idx} className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-red-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      {entry.cnr_number && (
                        <span className="font-mono font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                          {entry.cnr_number}
                        </span>
                      )}
                      <span className="text-red-500 bg-red-100 px-1.5 py-0.5 rounded">
                        {entry.source}
                      </span>
                    </div>
                    {/* Error text -- use <pre> to preserve Python traceback indentation */}
                    <pre className="text-red-800 font-medium whitespace-pre-wrap break-words font-sans">
                      {displayText}
                    </pre>
                    {/* Details (e.g. action name) */}
                    {detailsText && (
                      <pre className="text-red-500 mt-0.5 whitespace-pre-wrap break-words font-sans">
                        {displayDetails}
                      </pre>
                    )}
                    {/* Expand / collapse toggle for long entries */}
                    {(isLong || detailsLong) && (
                      <button
                        onClick={() => toggleLogEntry(idx)}
                        className="mt-1.5 text-red-600 hover:text-red-800 font-semibold underline underline-offset-2 text-[11px] transition-colors"
                      >
                        {isExpanded ? 'Show less' : 'Show full traceback'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -- Search Filter -- */}
      {trackedCases.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search cases by name, CNR, advocate, petitioner, respondent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* -- Bulk-selection Toolbar -- */}
      {selectedCases.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-xl">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {selectedCases.size} case{selectedCases.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkRefresh}
              disabled={refreshingCaseIds.size > 0}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg disabled:opacity-50 transition-colors"
              title="Refresh selected"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingCaseIds.size > 0 ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleBulkDelete}
              className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* -- Main Table -- */}
      <div className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : filteredCases.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-2xl bg-[var(--bg-sidebar)] flex items-center justify-center mb-6 ring-4 ring-[var(--accent)]/20 shadow-lg">
              <Scale className="w-10 h-10 text-[var(--accent)]" />
            </div>
            <h3 className="font-sans font-sans text-xl font-sans font-bold text-[var(--text-primary)] mb-2">
              {searchQuery ? 'No cases found' : 'Start tracking your cases'}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-sm text-center leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Add your cases by CNR number to get real-time status updates from eCourts'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[var(--accent)] text-[var(--accent-text)] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 shadow-[var(--shadow-card)]"
              >
                <Plus className="w-4 h-4" />
                Add Your First Case
              </button>
            )}
          </div>
        ) : (
          <>
            {/* -- Desktop Table -- */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-sidebar)]">
                    <th className="p-4 w-10">
                      <button onClick={toggleSelectAll} className="text-[var(--text-muted)] hover:text-[var(--text-on-sidebar)] transition-colors">
                        {selectedCases.size === filteredCases.length && filteredCases.length > 0
                          ? <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
                          : <Square className="w-4 h-4" />
                        }
                      </button>
                    </th>
                    <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Case</th>
                    <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Court</th>
                    <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Next Hearing</th>
                    <th className="p-4 w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light,#f4f4f5)]">
                  {filteredCases.map((trackedCase) => {
                    const status     = trackedCase.status;
                    const upcoming   = isUpcomingHearing(status?.next_hearing_date || '');
                    const isSelected = selectedCases.has(trackedCase.id);
                    const isRefreshing  = refreshingCaseIds.has(trackedCase.id);
                    const isImportingThis = importingCaseIds.has(trackedCase.id);
                    const isExpanded = expandedCase === trackedCase.id;

                    return (
                      <Fragment key={trackedCase.id}>
                        <tr
                          className={`hover:bg-[var(--surface-hover)] transition-colors group ${
                            isSelected ? 'bg-[var(--accent)]/5' : ''
                          } ${upcoming ? 'border-l-2 border-l-[var(--accent)]' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="p-4">
                            <button
                              onClick={() => toggleCaseSelection(trackedCase.id)}
                              className={`p-1 rounded transition-all ${
                                isSelected
                                  ? 'text-[var(--accent)]'
                                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>

                          {/* Case */}
                          <td className="p-4 max-w-sm">
                            <div className="font-sans font-semibold text-[var(--text-primary)] text-sm truncate">
                              {status?.case_title || trackedCase.case_name || 'Untitled Case'}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs font-bold font-mono text-[var(--text-muted)] bg-[var(--bg-sidebar)]/6 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {trackedCase.cnr_number || 'N/A'}
                              </span>
                              {status?.case_number && (
                                <span className="text-xs text-[var(--text-muted)]">· {status.case_number}</span>
                              )}
                              {status?.case_type && (
                                <span className="text-xs text-[var(--text-muted)]">· {status.case_type}</span>
                              )}
                              {(isRefreshing || isImportingThis) && (
                                <RefreshCw className="w-3 h-3 text-[var(--accent)] animate-spin" />
                              )}
                            </div>
                          </td>

                          {/* Court */}
                          <td className="p-4 max-w-[200px]">
                            <div className="text-sm text-[var(--text-secondary)] truncate">
                              {status?.court_name || (isImportingThis ? 'Fetching...' : '\u2014')}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            {status ? (
                              <div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getStatusColor(status.status)}`}>
                                  {status.status}
                                </span>
                                {upcoming && (
                                  <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                                    <AlertCircle className="w-3 h-3" /> Upcoming
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">
                                {isImportingThis ? 'Fetching...' : '\u2014'}
                              </span>
                            )}
                          </td>

                          {/* Next Hearing */}
                          <td className="p-4">
                            {status?.next_hearing_date ? (
                              <div className={`flex items-center gap-1.5 text-sm font-semibold ${upcoming ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                {status.next_hearing_date}
                              </div>
                            ) : (
                              <span className="text-sm text-[var(--text-muted)]">{'\u2014'}</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {trackedCase.cnr_number && (
                                <Link
                                  href={`/dashboard/case-status/${trackedCase.cnr_number}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                    text-xs font-semibold text-[var(--accent)]
                                    bg-[var(--accent)]/8 hover:bg-[var(--accent)]/15
                                    border border-[var(--accent)]/20 transition-colors"
                                >
                                  View <ArrowRight className="w-3 h-3" />
                                </Link>
                              )}
                              <CaseActionButtons
                                trackedCase={trackedCase}
                                isRefreshing={isRefreshing}
                                isExpanded={isExpanded}
                                onToggleNotification={() => handleToggleNotification(trackedCase.id)}
                                onRefresh={() => handleRefreshStatus(trackedCase.id)}
                                onRemove={() => handleRemoveCase(trackedCase.id)}
                                onToggleExpand={() => setExpandedCase(isExpanded ? null : trackedCase.id)}
                                variant="desktop"
                              />
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        {isExpanded && status && (
                          <tr key={`${trackedCase.id}-expanded`} className="bg-[var(--bg-primary)]">
                            <td colSpan={6} className="p-6">
                              <ExpandedCaseDetails trackedCase={trackedCase} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* -- Mobile Card List -- */}
            <div className="lg:hidden divide-y divide-[var(--border-light,#f4f4f5)]">
              {filteredCases.map((trackedCase) => {
                const status         = trackedCase.status;
                const upcoming       = isUpcomingHearing(status?.next_hearing_date || '');
                const isSelected     = selectedCases.has(trackedCase.id);
                const isRefreshing   = refreshingCaseIds.has(trackedCase.id);
                const isImportingThis = importingCaseIds.has(trackedCase.id);
                const isExpanded     = expandedCase === trackedCase.id;

                return (
                  <div
                    key={trackedCase.id}
                    className={`p-4 transition-colors ${upcoming ? 'border-l-4 border-l-[var(--accent)]' : ''} ${isSelected ? 'bg-[var(--accent)]/5' : ''}`}
                  >
                    {/* Top row: checkbox + CNR + actions */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => toggleCaseSelection(trackedCase.id)}
                          className={`p-1 rounded flex-shrink-0 ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                        <span className="text-xs font-bold font-mono text-[var(--text-primary)] bg-[var(--bg-sidebar)]/6 px-2 py-0.5 rounded-md uppercase tracking-wider truncate">
                          {trackedCase.cnr_number || 'N/A'}
                        </span>
                        {(isRefreshing || isImportingThis) && (
                          <RefreshCw className="w-3 h-3 text-[var(--accent)] animate-spin flex-shrink-0" />
                        )}
                      </div>
                      <CaseActionButtons
                        trackedCase={trackedCase}
                        isRefreshing={isRefreshing}
                        isExpanded={isExpanded}
                        onToggleNotification={() => handleToggleNotification(trackedCase.id)}
                        onRefresh={() => handleRefreshStatus(trackedCase.id)}
                        onRemove={() => handleRemoveCase(trackedCase.id)}
                        onToggleExpand={() => setExpandedCase(isExpanded ? null : trackedCase.id)}
                        variant="mobile"
                      />
                    </div>

                    {/* Case title */}
                    <p className="font-sans font-semibold text-[var(--text-primary)] text-sm mb-0.5 line-clamp-2">
                      {status?.case_title || trackedCase.case_name || 'Untitled Case'}
                    </p>
                    {status?.case_type && (
                      <p className="text-xs text-[var(--text-muted)] mb-1.5">{status.case_type}</p>
                    )}

                    {/* Court */}
                    {(status?.court_name || isImportingThis) && (
                      <p className="text-xs text-[var(--text-secondary)] mb-2 truncate">
                        {status?.court_name || 'Fetching court info...'}
                      </p>
                    )}

                    {/* Status badge + next hearing + view link */}
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      {status ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${getStatusColor(status.status)}`}>
                          {status.status}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">{isImportingThis ? 'Fetching...' : '\u2014'}</span>
                      )}
                      {status?.next_hearing_date && (
                        <span className={`flex items-center gap-1 text-xs font-semibold ${upcoming ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {status.next_hearing_date}
                          {upcoming && <AlertCircle className="w-3 h-3" />}
                        </span>
                      )}
                      {trackedCase.cnr_number && (
                        <Link
                          href={`/dashboard/case-status/${trackedCase.cnr_number}`}
                          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold
                            text-[var(--accent)] hover:opacity-80 transition-opacity"
                        >
                          View case <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && status && (
                      <div className="mt-4 border-t border-[var(--border-light,#f4f4f5)] pt-4">
                        <ExpandedCaseDetails trackedCase={trackedCase} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* -- Add Case Modal -- */}
      <AddCaseModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onImportComplete={loadTrackedCases}
        toastSuccess={toastSuccess}
        toastError={toastError}
      />

      {/* -- Confirm Delete Dialog -- */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title={confirmDelete?.type === 'bulk' ? `Remove ${selectedCases.size} Cases` : 'Remove Case'}
        message={
          confirmDelete?.type === 'bulk'
            ? `Remove ${selectedCases.size} selected case${selectedCases.size !== 1 ? 's' : ''} from your tracker? You can re-add them later.`
            : 'Remove this case from your tracker? You can re-add it later.'
        }
        confirmLabel="Remove"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Toaster />
    </div>
  );
}
