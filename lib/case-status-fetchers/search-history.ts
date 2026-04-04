import { getStoredData, setStoredData } from '@/lib/storage';

const STORAGE_KEY = 'lexram_search_history';

export interface SearchHistoryEntry {
  id: string;
  query: string;
  type: string;
  timestamp: string;
}

export function getSearchHistory(): SearchHistoryEntry[] {
  return getStoredData<SearchHistoryEntry[]>(STORAGE_KEY, []);
}
