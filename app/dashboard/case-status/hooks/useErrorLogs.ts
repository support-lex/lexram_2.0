'use client';

/**
 * hooks/useErrorLogs.ts
 *
 * Data hook that owns error log fetching and clearing.
 * Extracted from CaseStatusTab.tsx.
 */

import { useState, useCallback } from 'react';
import { getErrorLogs, clearErrorLogs } from '@/lib/case-status-fetchers';

export interface ErrorLogEntry {
  timestamp: string;
  source: string;
  cnr_number?: string;
  error: string;
  details?: string;
}

export function useErrorLogs() {
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  const load = useCallback(async (limit = 50) => {
    setIsLoading(true);
    try {
      const result = await getErrorLogs(limit);
      setErrorLogs(result.success ? (result.data ?? []) as ErrorLogEntry[] : []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    await clearErrorLogs();
    setErrorLogs([]);
  }, []);

  const toggleEntry = useCallback((index: number) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }, []);

  return { errorLogs, isLoading, expandedEntries, load, clear, toggleEntry };
}
