'use client';

/**
 * hooks/useTrackedCases.ts
 *
 * Data hook that owns all tracked-case CRUD operations and their loading state.
 * Extracted from CaseStatusTab.tsx to separate API concerns from UI rendering.
 *
 * Usage:
 *   const { trackedCases, isLoading, refresh, remove, update, track } = useTrackedCases();
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getTrackedCases,
  removeTrackedCase,
  updateTrackedCase,
  trackCase,
  exportCases,
  searchByCNR,
} from '@/lib/case-status-fetchers';
import type { TrackedCase, SearchResult } from '@/app/dashboard/case-status/types';

export function useTrackedCases() {
  const [trackedCases, setTrackedCases] = useState<TrackedCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingCaseIds, setRefreshingCaseIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTrackedCases();
      if (result.success && result.data) setTrackedCases(result.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const remove = useCallback(async (cnrNumber: string) => {
    await removeTrackedCase(cnrNumber);
    setTrackedCases(prev => prev.filter(c => c.cnr_number !== cnrNumber));
  }, []);

  const removeBulk = useCallback(async (cnrNumbers: string[]) => {
    await Promise.all(cnrNumbers.map(cnr => removeTrackedCase(cnr)));
    setTrackedCases(prev => prev.filter(c => c.cnr_number != null && !cnrNumbers.includes(c.cnr_number)));
  }, []);

  const update = useCallback(async (
    id: string,
    updates: Partial<Pick<TrackedCase, 'notification_enabled' | 'case_name'>>,
  ) => {
    const result = await updateTrackedCase(id, updates);
    if (result.success) {
      setTrackedCases(prev =>
        prev.map(c => c.id === id ? { ...c, ...updates } : c),
      );
    }
    return result;
  }, []);

  const track = useCallback(async (params: {
    cnr_number: string;
    case_data: SearchResult['data'];
    custom_name?: string;
  }) => {
    return trackCase(params);
  }, []);

  const refreshSingleCase = useCallback(async (cnrNumber: string) => {
    setRefreshingCaseIds(prev => new Set(prev).add(cnrNumber));
    try {
      const result = await searchByCNR(cnrNumber);
      if (result.success && result.data) {
        await trackCase({ cnr_number: cnrNumber, case_data: result.data });
        await refresh();
      }
      return result;
    } finally {
      setRefreshingCaseIds(prev => {
        const next = new Set(prev);
        next.delete(cnrNumber);
        return next;
      });
    }
  }, [refresh]);

  const exportToCSV = useCallback(async () => {
    return exportCases(trackedCases);
  }, [trackedCases]);

  return {
    trackedCases,
    isLoading,
    refreshingCaseIds,
    refresh,
    remove,
    removeBulk,
    update,
    track,
    refreshSingleCase,
    exportToCSV,
  };
}
