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
  SESSION_CASES: 'lexram_session_cases',
  // Stale-while-revalidate cache of the research session list so the history
  // sidebar paints instantly on load instead of waiting for the /sessions API.
  SESSIONS_CACHE: 'lexram_sessions_cache_v1',
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

// Keys that older builds wrote but nothing writes anymore. `lexram_research_sessions`
// in particular used to hold FULL sessions including message bodies (case
// authorities, reasoning, draft text) — easily several MB for a heavy user — and
// is now superseded by the lightweight SESSIONS_CACHE plus the backend. Since
// nothing repopulates these keys, the stale data just sits there forever and is
// the dominant cause of the "Storage usage at N%" warning. Purged once on
// dashboard mount (see app/dashboard/layout.tsx).
const LEGACY_STORAGE_KEYS: string[] = [STORAGE_KEYS.RESEARCH_SESSIONS];

// Caches safe to drop when localStorage fills up: the stale-while-revalidate
// sidebar snapshot (re-fetched from the backend on next load) and the one-shot
// draft hand-off slot. Dropping them frees space without losing any
// authoritative, server-backed data.
const EVICTABLE_STORAGE_KEYS: string[] = [STORAGE_KEYS.SESSIONS_CACHE, 'lexram_draft_import'];

/** Remove dead legacy keys. Safe to call on every load; only touches keys nothing writes. */
export function purgeLegacyStorage(): void {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_STORAGE_KEYS) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
  // Re-arm the one-shot warning so it can fire again later if storage refills.
  storageWarningShown = false;
}

/** Drop legacy + evictable caches to relieve storage pressure (quota exceeded). */
export function evictStaleStorage(): void {
  if (typeof window === 'undefined') return;
  for (const key of [...LEGACY_STORAGE_KEYS, ...EVICTABLE_STORAGE_KEYS]) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
  storageWarningShown = false;
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
