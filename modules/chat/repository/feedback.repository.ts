// Feedback & Pin repository — localStorage-first with optional Supabase sync.
// Works immediately without DB tables. If the Supabase tables exist, data is
// also persisted there for cross-device sync; if not, localStorage is the
// single source of truth and errors are silently ignored.

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
  upsert(sessionId: string, messageId: string, rating: FeedbackRating): boolean {
    const map = readLS<FeedbackMap>(LS_FEEDBACK_KEY, {});
    map[fbKey(sessionId, messageId)] = rating;
    writeLS(LS_FEEDBACK_KEY, map);
    // Background Supabase sync (fire-and-forget)
    (async () => {
      try {
        const { data: userData } = await supabase().auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        await supabase()
          .from("message_feedback")
          .upsert(
            { user_id: userId, session_id: sessionId, message_id: messageId, rating },
            { onConflict: "user_id,session_id,message_id" }
          );
      } catch { /* table may not exist — ignore */ }
    })();
    return true;
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
  list(): string[] {
    return readLS<string[]>(LS_PINNED_KEY, []);
  },

  pin(sessionId: string): boolean {
    const ids = readLS<string[]>(LS_PINNED_KEY, []);
    if (!ids.includes(sessionId)) {
      ids.unshift(sessionId);
      writeLS(LS_PINNED_KEY, ids);
    }
    // Background Supabase sync
    (async () => {
      try {
        const { data: userData } = await supabase().auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        await supabase()
          .from("pinned_sessions")
          .upsert({ user_id: userId, session_id: sessionId }, { onConflict: "user_id,session_id" });
      } catch { /* ignore */ }
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
        await supabase()
          .from("pinned_sessions")
          .delete()
          .match({ user_id: userId, session_id: sessionId });
      } catch { /* ignore */ }
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
        await supabase()
          .from("archived_sessions")
          .upsert({ user_id: userId, session_id: sessionId }, { onConflict: "user_id,session_id" });
      } catch { /* table may not exist — ignore */ }
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
        await supabase()
          .from("archived_sessions")
          .delete()
          .match({ user_id: userId, session_id: sessionId });
      } catch { /* ignore */ }
    })();
  },

  isArchived(sessionId: string): boolean {
    return readLS<string[]>(LS_ARCHIVED_KEY, []).includes(sessionId);
  },
};
