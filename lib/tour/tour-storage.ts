/**
 * Persistence for product-tour completion state.
 *
 * Layered:
 *  1. localStorage  — fast, per-device. Source of truth for "should this
 *     browser show the tour?". Survives sign-out/sign-in for unauth flows.
 *  2. Supabase user_metadata — best-effort cross-device sync. Written
 *     fire-and-forget when the user is authenticated. Read on first
 *     dashboard mount and mirrored back into localStorage so subsequent
 *     checks are instant.
 *
 * Storage shape (single key, JSON object):
 *   { completed: { [tourId]: ISO_timestamp }, skipped: { [tourId]: ISO_timestamp } }
 */

import { supabase } from "@/lib/supabase/client";

export type TourId =
  | "dashboard-welcome"
  | "research-walkthrough"
  | "case-hub"
  | string; // open-ended for future tours

interface TourState {
  completed: Record<string, string>;
  skipped: Record<string, string>;
}

const STORAGE_KEY = "lexram_tour_state_v1";
const META_KEY = "tour_state";

function readLocal(): TourState {
  if (typeof window === "undefined") return { completed: {}, skipped: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: {}, skipped: {} };
    const parsed = JSON.parse(raw);
    return {
      completed: parsed?.completed ?? {},
      skipped: parsed?.skipped ?? {},
    };
  } catch {
    return { completed: {}, skipped: {} };
  }
}

function writeLocal(state: TourState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full / disabled — non-fatal */
  }
}

/** Has the user completed (or explicitly skipped) this tour? */
export function isTourSeen(tourId: TourId): boolean {
  const s = readLocal();
  return !!s.completed[tourId] || !!s.skipped[tourId];
}

/** Mark a tour as fully completed. */
export function markTourCompleted(tourId: TourId) {
  const s = readLocal();
  s.completed[tourId] = new Date().toISOString();
  writeLocal(s);
  syncToSupabase(s);
}

/** Mark a tour as skipped (user clicked Skip). */
export function markTourSkipped(tourId: TourId) {
  const s = readLocal();
  s.skipped[tourId] = new Date().toISOString();
  writeLocal(s);
  syncToSupabase(s);
}

/** Wipe a tour's seen state so it can be replayed. */
export function resetTour(tourId: TourId) {
  const s = readLocal();
  delete s.completed[tourId];
  delete s.skipped[tourId];
  writeLocal(s);
  syncToSupabase(s);
}

/** Wipe all tour state — used by the "Replay all tours" action. */
export function resetAllTours() {
  writeLocal({ completed: {}, skipped: {} });
  syncToSupabase({ completed: {}, skipped: {} });
}

/**
 * On first dashboard mount, hydrate localStorage from the signed-in user's
 * Supabase metadata so tour state follows them across devices. If the user
 * is anonymous or the call fails, we silently keep the local state.
 */
export async function hydrateFromSupabase(): Promise<void> {
  try {
    const { data } = await supabase().auth.getUser();
    const remote = (data.user?.user_metadata?.[META_KEY] as TourState | undefined) ?? null;
    if (!remote) return;
    const local = readLocal();
    // Merge — remote completion wins on conflict (more recent commitment).
    const merged: TourState = {
      completed: { ...local.completed, ...remote.completed },
      skipped: { ...local.skipped, ...remote.skipped },
    };
    writeLocal(merged);
  } catch {
    /* swallow — local state is the fallback */
  }
}

function syncToSupabase(state: TourState) {
  // Fire-and-forget. Failures are non-critical because localStorage is
  // already the source of truth for the current session.
  void (async () => {
    try {
      const sb = supabase();
      const { data } = await sb.auth.getUser();
      if (!data.user) return;
      await sb.auth.updateUser({ data: { [META_KEY]: state } });
    } catch {
      /* swallow */
    }
  })();
}
