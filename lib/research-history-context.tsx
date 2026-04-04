"use client";

import { createContext, useContext } from "react";
import type { ResearchSession } from "@/app/dashboard/research-3/types";

export type ResearchHistoryContextValue = {
  sessions: ResearchSession[];
  groupedSessions: Record<string, ResearchSession[]>;
  filteredSessions: ResearchSession[];
  historySearch: string;
  setHistorySearch: (v: string) => void;
  currentSessionId: string | null;
  relativeDateLabel: (ts: string) => string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
};

export const ResearchHistoryContext = createContext<ResearchHistoryContextValue | null>(null);

export function useResearchHistory() {
  return useContext(ResearchHistoryContext);
}
