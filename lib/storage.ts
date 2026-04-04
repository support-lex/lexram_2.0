export const STORAGE_KEYS = {
  MATTERS: 'lexram_matters',
  RESEARCH_SESSIONS: 'lexram_research_sessions',
  DRAFTS: 'lexram_drafts',
  BRIEFS: 'lexram_briefs',
  DOCUMENTS: 'lexram_documents_meta',
  SETTINGS: 'lexram_settings',
  THEME: 'lexram_theme',
  EVENTS: 'lexram_events',
  TRACKED_CASES: 'lexram_tracked_cases',
  CASE_STATUSES: 'lexram_case_statuses',
} as const;

let storageWarningShown = false;

function getStorageUsage(): { used: number; total: number } {
  if (typeof window === 'undefined') return { used: 0, total: 5 * 1024 * 1024 };
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage.getItem(key)?.length || 0;
    }
  }
  return { used: total * 2, total: 5 * 1024 * 1024 }; // *2 for UTF-16
}

export function getStoredData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Error parsing stored data for key ${key}:`, e);
    return fallback;
  }
}

export function setStoredData<T>(key: string, data: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);

    // Check usage and warn if above 80%
    const { used, total } = getStorageUsage();
    if (used > total * 0.8 && !storageWarningShown) {
      storageWarningShown = true;
      console.warn(`Storage usage at ${Math.round((used/total) * 100)}%. Consider clearing old research sessions.`);
      // Dispatch a custom event that UI can listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lexram:storage-warning', {
          detail: { usedPercent: Math.round((used/total) * 100) }
        }));
      }
    }
    return true;
  } catch (e) {
    console.error(`Storage error for key ${key}:`, e);
    // Dispatch error event for UI notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lexram:storage-error', {
        detail: { key, message: e instanceof Error ? e.message : 'Storage quota exceeded' }
      }));
    }
    return false;
  }
}
