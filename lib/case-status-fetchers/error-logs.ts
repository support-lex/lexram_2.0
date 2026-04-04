import { getStoredData, setStoredData } from '@/lib/storage';

const STORAGE_KEY = 'lexram_error_logs';

export interface ErrorLog {
  id: string;
  message: string;
  timestamp: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorLogs(_limit?: number): { success: boolean; data: any[] } {
  return { success: true, data: getStoredData<any[]>(STORAGE_KEY, []) };
}

export function clearErrorLogs(): void {
  setStoredData(STORAGE_KEY, []);
}
