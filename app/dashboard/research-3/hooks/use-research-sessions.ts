"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { chatSessionRepository } from "@/modules/chat/repository/chatSession.repository";
import { generateChatTitle } from "@/modules/chat/usecase/generateTitle";
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

  // Reload messages when the user selects a different session.
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const session = sessionsRef.current.find((s) => s.id === currentSessionId);
    setMessages(session?.messages || []);
  }, [currentSessionId]);

  // ── Debounced auto-save: persist messages to Supabase ──────────────────────
  useEffect(() => {
    if (!isAuthed) return; // guests can't save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (messages.length === 0) return;

      // Existing session → update messages
      if (currentSessionId) {
        await chatSessionRepository.updateMessages(currentSessionId, messages);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages, updatedAt: new Date().toISOString() }
              : s
          )
        );

        // Generate AI title once we have at least one user + one ai message
        // and the session still has the placeholder title.
        const session = sessionsRef.current.find((s) => s.id === currentSessionId);
        const hasUser = messages.some((m) => m.role === "user");
        const hasAi   = messages.some((m) => m.role === "ai");
        if (
          session &&
          hasUser && hasAi &&
          !titleGeneratedRef.current.has(currentSessionId) &&
          (session.title === "New Conversation" || session.title.length < 8)
        ) {
          titleGeneratedRef.current.add(currentSessionId);
          const firstUserMsg = messages.find((m) => m.role === "user")?.content ?? "";
          const newTitle = await generateChatTitle(firstUserMsg);
          await chatSessionRepository.updateTitle(currentSessionId, newTitle);
          setSessions((prev) =>
            prev.map((s) => (s.id === currentSessionId ? { ...s, title: newTitle } : s))
          );
        }
        return;
      }

      // No session yet → create one with a temporary title.
      const firstUser = messages.find((m) => m.role === "user")?.content ?? "";
      const created = await chatSessionRepository.create({
        title: firstUser.slice(0, 60) || "New Conversation",
        messages,
        matter_id: selectedMatterId !== "all" ? selectedMatterId : null,
      });
      if (!created) return;

      setCurrentSessionId(created.id);
      setSessions((prev) => [created, ...prev]);
      sessionsRef.current = [created, ...sessionsRef.current];
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages, currentSessionId, selectedMatterId, isAuthed]);

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
    historyContextValue,
  };
}
