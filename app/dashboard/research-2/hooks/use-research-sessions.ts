"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { chatSessionRepository } from "@/modules/chat/repository/chatSession.repository";
import { supabase } from "@/lib/supabase/client";
import type { Message, ResearchSession } from "../types";

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

  // ── Load all sessions for the current user from Supabase ───────────────────
  const refresh = useCallback(async () => {
    const list = await chatSessionRepository.list();
    setSessions(list);
    sessionsRef.current = list;
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase().auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const signedIn = !!data.user;
      setIsAuthed(signedIn);
      if (signedIn) refresh();
    });

    const { data: sub } = supabase().auth.onAuthStateChange((_e, session) => {
      const signedIn = !!session?.user;
      setIsAuthed(signedIn);
      if (signedIn) refresh();
      else setSessions([]);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  // NOTE: there is intentionally no useEffect on `currentSessionId` to load
  // messages from cache. Loading is driven explicitly by handleSelectSession
  // (user clicks a session in the rail) and handleNewSession (user clicks
  // New). ensureSession() can therefore set currentSessionId mid-stream
  // without any risk of an effect resetting `messages` and wiping the user's
  // just-typed first message or the in-flight AI stream.

  // ── Debounced auto-save: persist messages to Supabase ──────────────────────
  useEffect(() => {
    if (!isAuthed) return; // guests can't save
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
  // Returns the session id. If we already have a current session, returns it
  // immediately. Otherwise creates a new session via the repository (which
  // calls POST /sessions on LexRam, then PATCHes the title) and updates state.
  const ensureSession = useCallback(
    async (titleHint: string): Promise<string | null> => {
      if (currentSessionId) return currentSessionId;
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
    [currentSessionId, selectedMatterId]
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
