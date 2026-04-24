"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { chatSessionRepository } from "@/modules/chat/repository/chatSession.repository";
import { supabase } from "@/lib/supabase/client";
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

export function useResearchSessions(selectedMatterId: string) {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionsRef = useRef<ResearchSession[]>([]);
  const titleGeneratedRef = useRef<Set<string>>(new Set());
  // True while ensureSession() is mid-flight creating a session. The debounced
  // auto-save effect must NOT race it with a second create — otherwise we end
  // up with duplicate sessions in the sidebar (the bug this guards against).
  const creatingSessionRef = useRef(false);
  // One-shot guard so a stored guest session is only migrated to a real
  // backend session once per page load (first time we learn the user is
  // authed, whether from the initial getUser() probe or a later auth event).
  const migrationDoneRef = useRef(false);

  // ── Load all sessions for the current user from Supabase ───────────────────
  const refresh = useCallback(async () => {
    const list = await chatSessionRepository.list();
    setSessions(list);
    sessionsRef.current = list;
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
    const firstUser = stored.messages.find((m) => m.role === "user")?.content ?? "";
    const created = await chatSessionRepository.create({
      title: firstUser.slice(0, 60) || "New Conversation",
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

  useEffect(() => {
    let mounted = true;
    supabase().auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      const signedIn = !!data.user;
      setIsAuthed(signedIn);
      if (signedIn) {
        await migrateTempSessionIfNeeded();
        refresh();
      }
    });

    const { data: sub } = supabase().auth.onAuthStateChange(async (_e, session) => {
      const signedIn = !!session?.user;
      setIsAuthed(signedIn);
      if (signedIn) {
        await migrateTempSessionIfNeeded();
        refresh();
      } else {
        setSessions([]);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refresh, migrateTempSessionIfNeeded]);

  // NOTE: there is intentionally no useEffect on `currentSessionId` to load
  // messages from cache. Loading is driven explicitly by handleSelectSession
  // (user clicks a session in the rail) and handleNewSession (user clicks
  // New). ensureSession() can therefore set currentSessionId mid-stream
  // without any risk of an effect resetting `messages` and wiping the user's
  // just-typed first message or the in-flight AI stream.

  // ── Debounced auto-save: persist messages to Supabase ──────────────────────
  useEffect(() => {
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

    saveTimeoutRef.current = setTimeout(async () => {
      if (messages.length === 0) return;

      // Existing session → update messages
      if (currentSessionId) {
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
      const firstUser = messages.find((m) => m.role === "user")?.content ?? "";
      creatingSessionRef.current = true;
      const created = await chatSessionRepository.create({
        title: firstUser.slice(0, 60) || "New Conversation",
        messages,
        matter_id: selectedMatterId !== "all" ? selectedMatterId : null,
      });
      creatingSessionRef.current = false;
      if (!created) return;

      setCurrentSessionId(created.id);
      setSessions((prev) => [created, ...prev]);
      sessionsRef.current = [created, ...sessionsRef.current];
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages, currentSessionId, selectedMatterId, isAuthed]);

  // ── Ensure a session exists, creating one on demand if not ────────────────
  // Returns the session id. Authed users get a real LexRam + Supabase session;
  // guests get a client-side `temp_*` id that lets the chat proceed without
  // hitting the backend's /sessions endpoint. The temp id is swapped for a
  // real one after login via migrateTempSessionIfNeeded().
  const ensureSession = useCallback(
    async (titleHint: string): Promise<string | null> => {
      if (currentSessionId) return currentSessionId;

      if (!isAuthed) {
        const tempId = generateTempSessionId();
        setCurrentSessionId(tempId);
        return tempId;
      }

      // Mark create-in-flight so the debounced auto-save effect doesn't race
      // and POST a second session for the same thread.
      creatingSessionRef.current = true;
      const created = await chatSessionRepository.create({
        title: titleHint.slice(0, 60) || "New Conversation",
        messages: [],
        matter_id: selectedMatterId !== "all" ? selectedMatterId : null,
      });
      creatingSessionRef.current = false;
      if (!created) return null;
      // Pure id swap — no effect reads from sessionsRef on this transition,
      // so the user's already-rendered first message stays put.
      sessionsRef.current = [created, ...sessionsRef.current];
      setCurrentSessionId(created.id);
      setSessions((prev) => [created, ...prev]);
      return created.id;
    },
    [currentSessionId, isAuthed, selectedMatterId]
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
    setCurrentSessionId(null);
    setMessages([]);
  };

  const handleSelectSession = (id: string) => {
    // Load this session's cached messages (Supabase mirror, populated by
    // refresh() on mount) before flipping currentSessionId. Inlined here so
    // ensureSession() can also set currentSessionId without ever triggering
    // a cache read that would clobber an in-flight chat.
    const cached = sessionsRef.current.find((s) => s.id === id);
    setMessages(cached?.messages ?? []);
    setCurrentSessionId(id);
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
  };
}
