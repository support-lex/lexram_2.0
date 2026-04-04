import type { TrackedCase } from '@/app/dashboard/case-status/types';
import { getStoredData, setStoredData } from '@/lib/storage';

const STORAGE_KEY = 'lexram_tracked_cases';

function getCasesFromStorage(): TrackedCase[] {
  return getStoredData<TrackedCase[]>(STORAGE_KEY, []);
}

export async function getTrackedCases(): Promise<{ success: boolean; data: TrackedCase[] }> {
  return { success: true, data: getCasesFromStorage() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function trackCase(caseData: Record<string, any>): Promise<{ success: boolean; data?: TrackedCase; error?: string }> {
  try {
    const cases = getCasesFromStorage();
    const newCase: TrackedCase = {
      id: `TC-${Date.now()}`,
      notification_enabled: true,
      created_at: new Date().toISOString(),
      ...caseData,
    } as TrackedCase;
    cases.push(newCase);
    setStoredData(STORAGE_KEY, cases);
    return { success: true, data: newCase };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function removeTrackedCase(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cases = getCasesFromStorage().filter(c => c.id !== id && c.cnr_number !== id);
    setStoredData(STORAGE_KEY, cases);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateTrackedCase(id: string, updates: Partial<TrackedCase>): Promise<{ success: boolean; data?: TrackedCase }> {
  const cases = getCasesFromStorage();
  const idx = cases.findIndex(c => c.id === id);
  if (idx === -1) return { success: false };
  cases[idx] = { ...cases[idx], ...updates };
  setStoredData(STORAGE_KEY, cases);
  return { success: true, data: cases[idx] };
}

export async function exportCases(cases?: TrackedCase[]): Promise<{ success: boolean; csv?: string; filename?: string }> {
  const data = cases ?? getCasesFromStorage();
  const headers = ['ID', 'CNR Number', 'Case Name', 'Status', 'Next Hearing', 'Created At'];
  const rows = data.map(c => [
    c.id, c.cnr_number ?? '', c.case_name ?? '', c.status?.status ?? '', c.status?.next_hearing_date ?? '', c.created_at,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return { success: true, csv, filename: `lexram-cases-${new Date().toISOString().slice(0, 10)}.csv` };
}
