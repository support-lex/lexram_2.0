// Feedback / pin / archive repository.
//
// Supabase is the source of truth — pinned and archived state must be shared
// across devices, not stuck on whatever machine the user pinned from.
// localStorage is kept as a synchronous cache so existing call sites (e.g.
// HistorySidebar reading `pinnedSessionRepository.list()` from a useState
// initializer) don't have to switch to async.
//
// Flow on app load: caller invokes `hydrate*()` once after auth resolves.
// That function pulls the full list from Supabase and replaces the cache.
// Subsequent reads come from the cache; writes update the cache optimistically
// and persist to Supabase in the background. On the next page load, the
// hydrate step re-reconciles in case the background write failed.

import { supabase } from "@/lib/supabase/client";

export type FeedbackRating = "up" | "down";

const LS_FEEDBACK_KEY = "lexram_feedback";
const LS_PINNED_KEY = "lexram_pinned";
const LS_ARCHIVED_KEY = "lexram_archived";

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — ignore */ }
}

// ── Feedback ─────────────────────────────────────────────────────────────

type FeedbackMap = Record<string, FeedbackRating>; // key = "sessionId:messageId"

function fbKey(sessionId: string, messageId: string) {
  return `${sessionId}:${messageId}`;
}

export const feedbackRepository = {
  /**
   * Persist a vote (optionally with a free-text comment). The comment is
   * what the dislike report popup writes — leave it `undefined` for
   * thumbs-up votes or no-comment thumbs-down. Passing `null` explicitly
   * clears any previously-saved comment for this message.
   *
   * Returns a Promise that resolves when the DB write has completed (so
   * callers can show a "Report sent" toast). Failures resolve to `false`
   * — the localStorage write is always synchronous and best-effort.
   */
  upsert(
    sessionId: string,
    messageId: string,
    rating: FeedbackRating,
    comment?: string | null
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const map = readLS<FeedbackMap>(LS_FEEDBACK_KEY, {});
    map[fbKey(sessionId, messageId)] = rating;
    writeLS(LS_FEEDBACK_KEY, map);
    return (async () => {
      try {
        const { data: userData } = await supabase().auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return { ok: false as const, error: "Not signed in" };
        const row: Record<string, unknown> = {
          user_id: userId,
          session_id: sessionId,
          message_id: messageId,
          rating,
        };
        // Only include `comment` when the caller explicitly provided one.
        // `undefined` → preserve whatever's in the row; `null` → clear it.
        if (comment !== undefined) row.comment = comment;
        const { error } = await supabase()
          .from("message_feedback")
          .upsert(row, { onConflict: "user_id,session_id,message_id" });
        if (error) {
          console.warn("[feedbackRepository.upsert]", error);
          return { ok: false as const, error: error.message || "Database error" };
        }
        return { ok: true as const };
      } catch (err) {
        console.warn("[feedbackRepository.upsert] threw", err);
        const msg = err instanceof Error ? err.message : "Unexpected error";
        return { ok: false as const, error: msg };
      }
    })();
  },

  remove(sessionId: string, messageId: string): void {
    const map = readLS<FeedbackMap>(LS_FEEDBACK_KEY, {});
    delete map[fbKey(sessionId, messageId)];
    writeLS(LS_FEEDBACK_KEY, map);
    (async () => {
      try {
        const { data: userData } = await supabase().auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        await supabase()
          .from("message_feedback")
          .delete()
          .match({ user_id: userId, session_id: sessionId, message_id: messageId });
      } catch { /* ignore */ }
    })();
  },

  getForMessage(sessionId: string, messageId: string): FeedbackRating | null {
    const map = readLS<FeedbackMap>(LS_FEEDBACK_KEY, {});
    return map[fbKey(sessionId, messageId)] ?? null;
  },

  listForSession(sessionId: string): Record<string, FeedbackRating> {
    const map = readLS<FeedbackMap>(LS_FEEDBACK_KEY, {});
    const result: Record<string, FeedbackRating> = {};
    const prefix = `${sessionId}:`;
    for (const [k, v] of Object.entries(map)) {
      if (k.startsWith(prefix)) {
        result[k.slice(prefix.length)] = v;
      }
    }
    return result;
  },
};

// ── Pinned Sessions ──────────────────────────────────────────────────────

export const pinnedSessionRepository = {
  /**
   * Pull the user's pinned-session ids from Supabase and replace the local
   * cache. Call once after auth resolves so the sidebar reads the
   * cross-device list instead of whatever this browser remembered.
   * No-ops for anonymous users.
   */
  async hydrate(): Promise<string[]> {
    try {
      const { data: userData } = await supabase().auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return readLS<string[]>(LS_PINNED_KEY, []);
      const { data, error } = await supabase()
        .from("pinned_sessions")
        .select("session_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[pinnedSessionRepository.hydrate]", error);
        return readLS<string[]>(LS_PINNED_KEY, []);
      }
      const ids = (data ?? []).map((r) => r.session_id as string);
      writeLS(LS_PINNED_KEY, ids);
      return ids;
    } catch (err) {
      console.warn("[pinnedSessionRepository.hydrate] threw", err);
      return readLS<string[]>(LS_PINNED_KEY, []);
    }
  },

  list(): string[] {
    return readLS<string[]>(LS_PINNED_KEY, []);
  },

  pin(sessionId: string): boolean {
    const ids = readLS<string[]>(LS_PINNED_KEY, []);
    if (!ids.includes(sessionId)) {
      ids.unshift(sessionId);
      writeLS(LS_PINNED_KEY, ids);
    }
    // Persist to Supabase. Failure is logged (so it's visible in DevTools)
    // but doesn't roll the cache back — the next hydrate() will reconcile.
    (async () => {
      try {
        const { data: userData } = await supabase().auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        const { error } = await supabase()
          .from("pinned_sessions")
          .upsert({ user_id: userId, session_id: sessionId }, { onConflict: "user_id,session_id" });
        if (error) console.warn("[pinnedSessionRepository.pin]", error);
      } catch (err) {
        console.warn("[pinnedSessionRepository.pin] threw", err);
      }
    })();
    return true;
  },

  unpin(sessionId: string): void {
    const ids = readLS<string[]>(LS_PINNED_KEY, []);
    writeLS(LS_PINNED_KEY, ids.filter((id) => id !== sessionId));
    (async () => {
      try {
        const { data: userData } = await supabase().auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        const { error } = await supabase()
          .from("pinned_sessions")
          .delete()
          .match({ user_id: userId, session_id: sessionId });
        if (error) console.warn("[pinnedSessionRepository.unpin]", error);
      } catch (err) {
        console.warn("[pinnedSessionRepository.unpin] threw", err);
      }
    })();
  },

  isPinned(sessionId: string): boolean {
    return readLS<string[]>(LS_PINNED_KEY, []).includes(sessionId);
  },
};

// ── Archived Sessions ────────────────────────────────────────────────────
// Same shape as pinnedSessionRepository. Archived ids are filtered out of
// the visible history list; the underlying session row is not deleted.

export const archivedSessionRepository = {
  async hydrate(): Promise<string[]> {
    try {
      const { data: userData } = await supabase().auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return readLS<string[]>(LS_ARCHIVED_KEY, []);
      const { data, error } = await supabase()
        .from("archived_sessions")
        .select("session_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[archivedSessionRepository.hydrate]", error);
        return readLS<string[]>(LS_ARCHIVED_KEY, []);
      }
      const ids = (data ?? []).map((r) => r.session_id as string);
      writeLS(LS_ARCHIVED_KEY, ids);
      return ids;
    } catch (err) {
      console.warn("[archivedSessionRepository.hydrate] threw", err);
      return readLS<string[]>(LS_ARCHIVED_KEY, []);
    }
  },

  list(): string[] {
    return readLS<string[]>(LS_ARCHIVED_KEY, []);
  },

  archive(sessionId: string): boolean {
    const ids = readLS<string[]>(LS_ARCHIVED_KEY, []);
    if (!ids.includes(sessionId)) {
      ids.unshift(sessionId);
      writeLS(LS_ARCHIVED_KEY, ids);
    }
    (async () => {
      try {
        const { data: userData } = await supabase().auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        const { error } = await supabase()
          .from("archived_sessions")
          .upsert({ user_id: userId, session_id: sessionId }, { onConflict: "user_id,session_id" });
        if (error) console.warn("[archivedSessionRepository.archive]", error);
      } catch (err) {
        console.warn("[archivedSessionRepository.archive] threw", err);
      }
    })();
    return true;
  },

  unarchive(sessionId: string): void {
    const ids = readLS<string[]>(LS_ARCHIVED_KEY, []);
    writeLS(LS_ARCHIVED_KEY, ids.filter((id) => id !== sessionId));
    (async () => {
      try {
        const { data: userData } = await supabase().auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        const { error } = await supabase()
          .from("archived_sessions")
          .delete()
          .match({ user_id: userId, session_id: sessionId });
        if (error) console.warn("[archivedSessionRepository.unarchive]", error);
      } catch (err) {
        console.warn("[archivedSessionRepository.unarchive] threw", err);
      }
    })();
  },

  isArchived(sessionId: string): boolean {
    return readLS<string[]>(LS_ARCHIVED_KEY, []).includes(sessionId);
  },
};
