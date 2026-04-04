"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getStoredData, setStoredData } from "@/lib/storage";
import { formatDate, generateId } from "@/lib/utils";
import type { Message, ResearchSession } from "../types";

const RESEARCH3_STORAGE_KEY = "lexram_research_sessions_v3";

export function useResearchSessions(selectedMatterId: string) {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historySearch, setHistorySearch] = useState("");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionsRef = useRef<ResearchSession[]>([]);

  useEffect(() => {
    setSessions(getStoredData<ResearchSession[]>(RESEARCH3_STORAGE_KEY, []));
  }, []);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const session = sessionsRef.current.find((s) => s.id === currentSessionId);
    setMessages(session?.messages || []);
  }, [currentSessionId]);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (messages.length === 0) return;

      if (currentSessionId) {
        setSessions((prev) => {
          const updated = prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages, updatedAt: new Date().toISOString() }
              : s
          );
          setStoredData(RESEARCH3_STORAGE_KEY, updated);
          return updated;
        });
      } else {
        const id = generateId();
        const session: ResearchSession = {
          id,
          title: messages[0]?.content.slice(0, 60) || "Research Session",
          messages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          matterId: selectedMatterId !== "all" ? selectedMatterId : undefined,
        };
        setSessions((prev) => {
          const next = [session, ...prev];
          setStoredData(RESEARCH3_STORAGE_KEY, next);
          return next;
        });
        setCurrentSessionId(id);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages, currentSessionId, selectedMatterId]);

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
    historyContextValue,
  };
}
