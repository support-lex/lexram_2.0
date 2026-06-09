"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { chatSessionRepository } from "@/modules/chat/repository/chatSession.repository";
import {
  pinnedSessionRepository,
  archivedSessionRepository,
} from "@/modules/chat/repository/feedback.repository";
import { useAuth } from "@/lib/auth-provider";
import { authStore } from "@/lib/auth-store";
import { getStoredData, setStoredData, STORAGE_KEYS } from "@/lib/storage";
import type { Message, ResearchSession } from "../types";

// ── Guest (temp) session helpers ──────────────────────────────────────────────
// A guest chat runs without a LexRam session. We synthesize a `temp_<uuid>`
// id, keep the thread in localStorage so it survives the sign-in redirect,
// then swap it for a real backend session id once the user authenticates.
const TEMP_SESSION_STORAGE_KEY = "lexram_temp_session";

interface StoredTempSession {
  id: string;
  messages: Message[];
  updatedAt: string;
}

function loadTempSession(): StoredTempSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TEMP_SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTempSession) : null;
  } catch {
    return null;
  }
}

function saveTempSession(s: StoredTempSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TEMP_SESSION_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota or disabled storage — silent */
  }
}

function clearTempSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TEMP_SESSION_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

function generateTempSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `temp_${crypto.randomUUID()}`;
  }
  return `temp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function isTempId(id: string | null | undefined): boolean {
  return !!id && id.startsWith("temp_");
}

// ── Sidebar history cache (stale-while-revalidate) ──────────────────────────
// The history sidebar used to stay on skeletons until GET /sessions returned
// (auth-gated, network round-trip — often a second or more). We now persist the
// last successful list to localStorage, keyed by user, and paint it instantly
// on the next load while a fresh fetch revalidates in the background.
//
// Capped to the most-recent sessions so a heavy user (hundreds of threads with
// long messages) can't blow the ~5 MB localStorage quota; older threads fill in
// once the background refresh completes.
const SESSIONS_CACHE_CAP = 60;

interface SessionsCache {
  userId: string;
  sessions: ResearchSession[];
  cachedAt: number;
}

function readSessionsCache(userId: string): ResearchSession[] | null {
  const cached = getStoredData<SessionsCache | null>(STORAGE_KEYS.SESSIONS_CACHE, null);
  if (!cached || cached.userId !== userId || !Array.isArray(cached.sessions)) return null;
  return cached.sessions;
}

function writeSessionsCache(userId: string, sessions: ResearchSession[]) {
  // Most-recent first (the repository already returns newest-first, but sort
  // defensively) then cap. CRUCIALLY we strip `messages` to an empty array:
  // the cache is ONLY for painting the sidebar list (title/date/case) fast.
  // Caching message content was unsafe — opening a session would load the
  // cached copy, and the debounced auto-save would then write that (possibly
  // stale) copy back over the server's newer messages, destroying drafts.
  const trimmed = [...sessions]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, SESSIONS_CACHE_CAP)
    .map((s) => ({ ...s, messages: [] as Message[] }));
  setStoredData<SessionsCache>(STORAGE_KEYS.SESSIONS_CACHE, {
    userId,
    sessions: trimmed,
    cachedAt: Date.now(),
  });
}

export function useResearchSessions(selectedMatterId: string) {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [sessionsReady, setSessionsReady] = useState(false);
  // Case the user picked from the header CaseSelector *before* the session
  // row exists. ensureSession() and the debounced auto-save both forward
  // this to POST /sessions so the row is linked to the case at creation
  // time. Reset to null when an existing session is selected or a new one
  // is started (so each fresh chat begins as Unassigned by default).
  const [pendingCaseId, setPendingCaseId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Number of messages last committed to the mirror for the active session.
  // A growth in messages.length means a new turn finished (user msg or AI
  // answer) — those are the important commit points and are persisted with
  // NO debounce so a quick reload can't drop the just-finished turn (the
  // "draft vanishes after reload" bug). In-place edits (e.g. inline editor
  // typing that mutates an existing message) keep the 600ms debounce.
  const lastSavedCountRef = useRef(0);
  // Latest messages/session, mirrored into refs so the pagehide/visibility
  // flush handlers (which run outside React's render closure) can persist the
  // newest thread synchronously when the tab is being unloaded.
  const latestMessagesRef = useRef<Message[]>([]);
  const sessionsRef = useRef<ResearchSession[]>([]);
  const titleGeneratedRef = useRef<Set<string>>(new Set());
  // A session the user selected before its real messages were loaded (the
  // sidebar paints from a metadata-only cache, so message content arrives only
  // when refresh() returns). refresh() fills the thread once the authoritative
  // messages land — but only if the user hasn't started a new chat there.
  const pendingSelectRef = useRef<string | null>(null);
  // Mirrors currentSessionId so async callbacks (backend-history recovery) can
  // check the user hasn't navigated away before applying loaded messages.
  const currentSessionIdRef = useRef<string | null>(null);
  // True while ensureSession() is mid-flight creating a session. The debounced
  // auto-save effect must NOT race it with a second create — otherwise we end
  // up with duplicate sessions in the sidebar (the bug this guards against).
  const creatingSessionRef = useRef(false);
  // One-shot guard so a stored guest session is only migrated to a real
  // backend session once per page load (first time we learn the user is
  // authed, whether from the initial getUser() probe or a later auth event).
  const migrationDoneRef = useRef(false);
  // Tracks the user id we have SUCCESSFULLY loaded sessions for. Only set after
  // refresh() returns true, so a failed first load (e.g. a transient backend
  // blip) leaves this null and the next auth event retries — unlike the old
  // dedupe that marked the id up-front and permanently cached an empty load.
  const loadedForUserRef = useRef<string | null>(null);

  // ── Load all sessions for the current user from Supabase ───────────────────
  // Returns true when it produced an authoritative result (either a list, or a
  // deliberate "keep existing data" no-op), false when the fetch threw. The
  // auth-driven effect uses that to decide whether to mark the user as loaded
  // or leave the door open for a retry on the next auth event.
  const refresh = useCallback(async (): Promise<boolean> => {
    let list: ResearchSession[];
    try {
      list = await chatSessionRepository.list();
    } catch (err) {
      console.error('[useResearchSessions.refresh] failed', err);
      setSessionsReady(true);
      return false;
    }
    // Race safety: if we already have sessions in state and this call came
    // back empty (e.g. the repository's silent Supabase fallback fired during
    // a transient LexRam blip), don't overwrite. The next successful refresh
    // will replace; until then the user keeps seeing their real history.
    if (list.length === 0 && sessionsRef.current.length > 0) {
      setSessionsReady(true);
      return true;
    }
    // Per-session merge guard. refresh() runs on a poll (1.5s/3s/5s) after every
    // stream completes, but the message mirror is written by a 600ms debounce —
    // so a refresh can re-read Supabase BEFORE the just-finished turn has landed
    // (read-after-write race). Blindly assigning `list` would then downgrade the
    // richer in-memory thread (which still holds e.g. a freshly generated draft)
    // to the stale/empty mirror copy; switching away and back would then show an
    // empty session and fall through to the lossy /history reconstruction. Keep
    // whichever copy has MORE messages — the debounced save reconciles the mirror
    // moments later, and the next refresh picks up the authoritative version.
    const prevById = new Map(sessionsRef.current.map((s) => [s.id, s]));
    const merged = list.map((s) => {
      const prev = prevById.get(s.id);
      return prev && prev.messages.length > s.messages.length
        ? { ...s, messages: prev.messages }
        : s;
    });
    setSessions(merged);
    sessionsRef.current = merged;
    setSessionsReady(true);

    // Fill a deferred selection: the user opened a session (sidebar/URL) before
    // its real messages were available. Now that the authoritative list is in,
    // load that thread's messages — but ONLY if the user hasn't already started
    // typing/streaming there (functional guard: still empty), so we never
    // clobber an in-flight chat.
    if (pendingSelectRef.current) {
      const sel = merged.find((s) => s.id === pendingSelectRef.current);
      if (sel && sel.messages.length > 0) {
        setMessages((cur) => (cur.length === 0 ? sel.messages : cur));
        pendingSelectRef.current = null;
      }
    }

    // Persist a LIGHTWEIGHT (no-messages) snapshot so the next load paints the
    // sidebar list instantly. Messages are intentionally excluded — caching
    // them risked the auto-save writing a stale cached copy back over the
    // server's newer messages (drafts), so message content always comes from
    // this authoritative refresh, never the cache.
    const uid = authStore.getSnapshot().user?.id;
    if (uid) writeSessionsCache(uid, list);

    // Seed SESSION_CASES localStorage cache from backend case_id so
    // the sidebar and page can read case assignments even after a cache clear.
    const casesMap = getStoredData<Record<string, string>>(STORAGE_KEYS.SESSION_CASES, {});
    let dirty = false;
    list.forEach((s) => {
      if (s.caseId && casesMap[s.id] !== s.caseId) {
        casesMap[s.id] = s.caseId;
        dirty = true;
      }
    });
    if (dirty) setStoredData(STORAGE_KEYS.SESSION_CASES, casesMap);
    return true;
  }, []);

  // Swap a guest `temp_*` session in localStorage for a real LexRam + Supabase
  // session. Called after the first auth event we see. Safe to call multiple
  // times — the `migrationDoneRef` guard makes subsequent calls no-op.
  const migrateTempSessionIfNeeded = useCallback(async () => {
    if (migrationDoneRef.current) return;
    const stored = loadTempSession();
    if (!stored || stored.messages.length === 0) {
      clearTempSession();
      return;
    }
    migrationDoneRef.current = true;
    const created = await chatSessionRepository.create({
      // "New Chat" lets the backend's Groq auto-title hook run after the
      // first query lands in the migrated session. See the sibling create()
      // calls in this file for the full reasoning.
      title: "New Chat",
      messages: stored.messages,
      matter_id: null,
    });
    clearTempSession();
    if (!created) return;
    sessionsRef.current = [created, ...sessionsRef.current];
    setSessions((prev) => [created, ...prev]);
    setCurrentSessionId(created.id);
    setMessages(stored.messages);
  }, []);

  // Hydrate localStorage caches for pinned + archived from Supabase. Fire-
  // and-forget — HistorySidebar will re-render off the localStorage on its
  // next interaction since pinnedIds is seeded via lazy useState. We also
  // dispatch a window event so any open sidebars refresh their derived sets.
  const hydratePinAndArchive = useCallback(async () => {
    await Promise.all([
      pinnedSessionRepository.hydrate(),
      archivedSessionRepository.hydrate(),
    ]);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lexram-pin-changed"));
      window.dispatchEvent(new Event("lexram-archive-changed"));
    }
  }, []);

  // Auth comes from the single source of truth (lib/auth-store via useAuth).
  // `authReady` flips once the first getSession() resolves AND, crucially, the
  // token layers now await that same readiness — so the GET /sessions below
  // can never fire token-less and 401 into an empty sidebar. We load exactly
  // once per successfully-loaded user id; a failed load leaves the door open
  // for the next auth event (TOKEN_REFRESHED, focus) to retry.
  const { user: authUser, ready: authReady } = useAuth();
  const authUserId = authUser?.id ?? null;
  useEffect(() => {
    setIsAuthed(!!authUserId);
    if (!authReady) return;

    if (!authUserId) {
      // Signed out / guest: clear the (authed) sidebar + its cache and allow a
      // future sign-in to reload. The guest temp-session flow lives in the
      // auto-save effect, not here.
      setSessions([]);
      sessionsRef.current = [];
      loadedForUserRef.current = null;
      setStoredData<SessionsCache | null>(STORAGE_KEYS.SESSIONS_CACHE, null);
      setSessionsReady(true);
      return;
    }

    if (loadedForUserRef.current === authUserId) return;

    // Instant paint: seed the sidebar from the cached list (if any) for this
    // user before the network fetch returns. The background refresh() below
    // then revalidates and overwrites both state and cache. Only seed when we
    // don't already have sessions in memory (e.g. from a guest→auth migration).
    if (sessionsRef.current.length === 0) {
      const cachedSessions = readSessionsCache(authUserId);
      if (cachedSessions && cachedSessions.length > 0) {
        setSessions(cachedSessions);
        sessionsRef.current = cachedSessions;
        setSessionsReady(true);
      }
    }

    let cancelled = false;
    (async () => {
      await migrateTempSessionIfNeeded();
      hydratePinAndArchive();
      const ok = await refresh();
      if (!cancelled && ok) loadedForUserRef.current = authUserId;
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, authUserId, refresh, migrateTempSessionIfNeeded, hydratePinAndArchive]);

  // Keep the ref mirror of currentSessionId current for async guards (e.g. the
  // backend-history recovery in handleSelectSession), covering every code path
  // that flips currentSessionId (ensureSession, delete, sign-out, …).
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // NOTE: there is intentionally no useEffect on `currentSessionId` to load
  // messages from cache. Loading is driven explicitly by handleSelectSession
  // (user clicks a session in the rail) and handleNewSession (user clicks
  // New). ensureSession() can therefore set currentSessionId mid-stream
  // without any risk of an effect resetting `messages` and wiping the user's
  // just-typed first message or the in-flight AI stream.

  // ── Auto-save: persist messages to Supabase ────────────────────────────────
  // The actual save body, holding the latest render closure. Stashed in a ref so
  // the navigation flush handlers (pagehide / session switch) can invoke the
  // newest version directly, not a stale one captured at mount.
  const doSaveRef = useRef<() => Promise<void>>(async () => {});
  doSaveRef.current = async () => {
    if (messages.length === 0) return;

    // Existing session → update messages
    if (currentSessionId) {
      lastSavedCountRef.current = messages.length;
      await chatSessionRepository.updateMessages(currentSessionId, messages);
      const updatedAt = new Date().toISOString();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages, updatedAt } : s
        )
      );
      // Keep the ref in sync — the on-select effect now reads from it
      // exclusively, so a stale ref would show old messages on re-selection.
      sessionsRef.current = sessionsRef.current.map((s) =>
        s.id === currentSessionId ? { ...s, messages, updatedAt } : s
      );

      // NOTE: AI title generation via Zhipu (/api/chat/title) is intentionally
      // disabled. Chat answers come exclusively from the LexRam backend now,
      // and we don't want a secondary AI provider in the path. The session
      // keeps the truncated first-message as its title until the user
      // renames it via the pencil icon (which calls PATCH /sessions/{id}).
      return;
    }

    // No session yet → create one with a temporary title.
    // Bail out if ensureSession() is already creating one for this thread —
    // otherwise we'd insert a duplicate session row.
    if (creatingSessionRef.current) return;
    creatingSessionRef.current = true;
    const created = await chatSessionRepository.create({
      // MUST be literally "New Chat" — that's the trigger condition the
      // backend checks before running Groq to auto-generate a 4–6 word
      // title from the first query. Anything else (the old "first 60
      // chars of the message" or "New Conversation") suppresses the
      // auto-title entirely. Verified by direct API probe 2026-05-18.
      title: "New Chat",
      messages,
      matter_id: selectedMatterId !== "all" ? selectedMatterId : null,
      case_id: pendingCaseId,
    });
    creatingSessionRef.current = false;
    if (!created) return;

    lastSavedCountRef.current = messages.length;
    setCurrentSessionId(created.id);
    setSessions((prev) => [created, ...prev]);
    sessionsRef.current = [created, ...sessionsRef.current];
    // The pending case has been baked into the row — clear it so it isn't
    // re-applied if the user later starts a fresh chat without picking again.
    setPendingCaseId(null);
  };

  useEffect(() => {
    // Keep the unload-flush handlers pointed at the newest thread.
    latestMessagesRef.current = messages;

    // Guest flow: mirror the active temp session to localStorage on every
    // messages change so the thread survives the /sign-in redirect and can
    // be migrated into a real backend session after the user authenticates.
    if (!isAuthed) {
      if (isTempId(currentSessionId) && messages.length > 0) {
        saveTempSession({
          id: currentSessionId!,
          messages,
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // A new turn (user message or AI answer) grew the array — persist it with
    // NO debounce. New turns are the important, infrequent commit points; the
    // old blanket 600ms debounce meant a reload within that window dropped the
    // just-finished turn (the "draft vanishes after reload" report). In-place
    // edits (length unchanged — e.g. inline editor mutating a message) keep the
    // debounce so rapid keystrokes don't hammer the network.
    const grew = messages.length > lastSavedCountRef.current;
    const delay = grew ? 0 : 600;
    saveTimeoutRef.current = setTimeout(() => { void doSaveRef.current(); }, delay);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages, currentSessionId, selectedMatterId, isAuthed, pendingCaseId]);

  // Flush any pending save synchronously-as-possible. Called before in-page
  // navigation (session switch / new chat) and on tab unload so the last turn
  // — typically a freshly generated draft — always reaches the mirror instead
  // of dying with the cleared debounce timer.
  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    void doSaveRef.current();
  }, []);

  // Persist on tab hide/close. `pagehide` + `visibilitychange:hidden` are the
  // reliable signals on mobile + desktop (beforeunload is unreliable on mobile
  // Safari). The Supabase write is async and may not finish if the tab is
  // killed instantly, but flushing here closes the common reload/close window;
  // Fix-A's in-memory merge guard covers same-session navigation regardless.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flush = () => {
      if (!isAuthed) return;
      if (latestMessagesRef.current.length <= lastSavedCountRef.current) return;
      flushSave();
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flushSave, isAuthed]);

  // ── Ensure a session exists, creating one on demand if not ────────────────
  // Returns the session id. Authed users get a real LexRam + Supabase session;
  // guests get a client-side `temp_*` id that lets the chat proceed without
  // hitting the backend's /sessions endpoint. The temp id is swapped for a
  // real one after login via migrateTempSessionIfNeeded().
  const ensureSession = useCallback(
    async (titleHint: string): Promise<string | null> => {
      if (currentSessionId) return currentSessionId;

      // Claim the create slot SYNCHRONOUSLY — before the first `await` below.
      // ensureSession() and the debounced auto-save effect BOTH create the
      // session for a brand-new thread; `creatingSessionRef` is how they avoid
      // POSTing two. It used to be set only AFTER `await authStore.whenReady()`,
      // but on a cold load (the very first chat right after the page opens) auth
      // isn't ready yet, so whenReady() suspends here long enough for the 600ms
      // auto-save timer to fire, observe the flag still false, and create its
      // OWN competing session. Streaming then targeted one session while
      // currentSessionId pointed at the other — the "first message does nothing
      // / session not created" bug. Setting the flag before any await closes
      // that window; the finally{} always releases it.
      creatingSessionRef.current = true;
      try {
        // Resolve the AUTHORITATIVE auth state before choosing guest vs. real.
        // `isAuthed` is React state that only flips a tick AFTER the auth store
        // becomes ready; submitting the very first query in that window fell
        // through to the guest/temp branch below, and startResearch then refuses
        // to stream a temp_ session ("Please sign in") — i.e. the first chat does
        // nothing and only works after a refresh. Awaiting readiness and reading
        // the store snapshot directly here closes that race for an authed user.
        await authStore.whenReady();
        const authed = !!authStore.getSnapshot().user;

        if (!authed) {
          const tempId = generateTempSessionId();
          setCurrentSessionId(tempId);
          return tempId;
        }

        const created = await chatSessionRepository.create({
          // See debounced-auto-save sibling: must be literally "New Chat" so
          // the backend's Groq auto-title hook fires on first query.
          title: "New Chat",
          messages: [],
          matter_id: selectedMatterId !== "all" ? selectedMatterId : null,
          case_id: pendingCaseId,
        });
        if (!created) return null;
        // Pure id swap — no effect reads from sessionsRef on this transition,
        // so the user's already-rendered first message stays put.
        sessionsRef.current = [created, ...sessionsRef.current];
        setCurrentSessionId(created.id);
        setSessions((prev) => [created, ...prev]);
        setPendingCaseId(null);
        return created.id;
      } finally {
        creatingSessionRef.current = false;
      }
    },
    [currentSessionId, selectedMatterId, pendingCaseId]
  );

  // ── Delete a session ───────────────────────────────────────────────────────
  const handleDeleteSession = useCallback(
    async (id: string) => {
      const ok = await chatSessionRepository.remove(id);
      if (!ok) return;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      sessionsRef.current = sessionsRef.current.filter((s) => s.id !== id);
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMessages([]);
        lastSavedCountRef.current = 0;
      }
    },
    [currentSessionId]
  );

  // ── Rename a session (PATCH /sessions/{id}) ────────────────────────────────
  const handleRenameSession = useCallback(async (id: string, nextTitle: string) => {
    const trimmed = nextTitle.trim();
    if (!trimmed) return;
    await chatSessionRepository.updateTitle(id, trimmed);
    // Mark as user-renamed so the AI title generator doesn't overwrite it later.
    titleGeneratedRef.current.add(id);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, title: trimmed, updatedAt: new Date().toISOString() } : s
      )
    );
    sessionsRef.current = sessionsRef.current.map((s) =>
      s.id === id ? { ...s, title: trimmed, updatedAt: new Date().toISOString() } : s
    );
  }, []);

  // ── Display helpers (unchanged from previous implementation) ───────────────
  const relativeDateLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "Last week";
    return formatDate(timestamp);
  };

  const filteredSessions = useMemo(
    () =>
      sessions
        .filter((s) => selectedMatterId === "all" || s.matterId === selectedMatterId)
        .filter((session) => {
          if (!historySearch) return true;
          const haystack = [
            session.title,
            ...session.messages.map((m) => m.content || m.response?.streamText || ""),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(historySearch.toLowerCase());
        }),
    [sessions, selectedMatterId, historySearch]
  );

  const groupedSessions = useMemo(
    () =>
      filteredSessions.reduce<Record<string, ResearchSession[]>>((acc, session) => {
        const updated = new Date(session.updatedAt);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
        );
        const bucket =
          diffDays === 0 ? "Today" : diffDays < 7 ? "This Week" : "Earlier";
        acc[bucket] = acc[bucket] || [];
        acc[bucket].push(session);
        return acc;
      }, {}),
    [filteredSessions]
  );

  const handleNewSession = () => {
    // Persist the outgoing thread before we wipe it from state — otherwise a
    // pending debounced save for the session we're leaving is lost.
    flushSave();
    pendingSelectRef.current = null;
    currentSessionIdRef.current = null;
    setCurrentSessionId(null);
    setMessages([]);
    // Fresh thread — reset the per-session saved-count baseline so the first
    // message of the new chat is treated as a new turn (immediate save).
    lastSavedCountRef.current = 0;
    // Clear any case the user pre-selected for an earlier "New chat" attempt
    // they never followed through on, so the picker starts fresh.
    setPendingCaseId(null);
  };

  const handleSelectSession = (id: string) => {
    // Persist the thread we're leaving before swapping in another one, so an
    // in-flight debounced save (e.g. a just-generated draft) isn't dropped.
    flushSave();
    // Load this session's messages from the authoritative in-memory list
    // (populated by refresh() from the Supabase mirror). Inlined here so
    // ensureSession() can also set currentSessionId without ever triggering
    // a read that would clobber an in-flight chat.
    const loaded = sessionsRef.current.find((s) => s.id === id);
    currentSessionIdRef.current = id;
    setCurrentSessionId(id);
    // Selecting an existing session moots any pending case from the picker.
    setPendingCaseId(null);

    if (loaded && loaded.messages.length > 0) {
      // Rich messages already in memory (from the Supabase mirror) — show them.
      // Baseline the saved-count to the loaded length so we don't re-save an
      // unchanged thread, but still detect the next appended turn as growth.
      lastSavedCountRef.current = loaded.messages.length;
      setMessages(loaded.messages);
      pendingSelectRef.current = null;
      return;
    }

    // Unknown/empty thread — baseline at 0 so a recovered or freshly typed
    // message counts as a new turn for the immediate-save path.
    lastSavedCountRef.current = 0;

    // No messages in memory: show empty now (the auto-save's length-0 guard
    // means this can never overwrite the server's real messages) and recover
    // from the backend history — the LexRam thread is authoritative and holds
    // the full conversation (incl. drafted petitions) even when the Supabase
    // mirror is empty. refresh()'s pending-fill is the secondary fallback.
    pendingSelectRef.current = id;
    setMessages([]);
    chatSessionRepository.getMessagesFromBackend(id).then((recovered) => {
      if (recovered.length === 0) return;
      // Only apply if the user is still on this session.
      if (currentSessionIdRef.current !== id) return;
      // Only fill if still empty — never clobber an in-flight chat the user
      // may have started in the meantime.
      setMessages((cur) => (cur.length === 0 ? recovered : cur));
      // Cache in memory so re-selection is instant; the debounced auto-save
      // then re-persists the recovered thread into the Supabase mirror.
      sessionsRef.current = sessionsRef.current.map((s) =>
        s.id === id ? { ...s, messages: recovered } : s
      );
      pendingSelectRef.current = null;
    }).catch(() => { /* silent — refresh() pending-fill still applies */ });
  };

  const historyContextValue = {
    sessions,
    groupedSessions,
    filteredSessions,
    historySearch,
    setHistorySearch,
    currentSessionId,
    relativeDateLabel,
    onSelectSession: handleSelectSession,
    onNewSession: handleNewSession,
    onDeleteSession: handleDeleteSession,
    onRenameSession: handleRenameSession,
  };

  return {
    sessions,
    sessionsReady,
    currentSessionId,
    setCurrentSessionId,
    messages,
    setMessages,
    historySearch,
    setHistorySearch,
    filteredSessions,
    groupedSessions,
    relativeDateLabel,
    handleNewSession,
    handleSelectSession,
    handleDeleteSession,
    handleRenameSession,
    ensureSession,
    historyContextValue,
    pendingCaseId,
    setPendingCaseId,
    // Exposed so the chat hook can re-fetch the sessions list ~1.5s after
    // each stream completes — picks up the LLM-auto-generated session
    // title that the backend writes asynchronously post-response.
    refreshSessions: refresh,
  };
}
