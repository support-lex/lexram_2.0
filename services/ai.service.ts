import api from "./api";
import type { AIMessage, AISession } from "@/types/law-firm";

export const aiService = {
  async createSession(): Promise<AISession> {
    const { data } = await api.post<AISession>("/ai/session");
    return data;
  },

  async query(sessionId: string, message: string): Promise<AIMessage> {
    const { data } = await api.post<AIMessage>("/ai/query", { session_id: sessionId, query: message });
    return data;
  },

  async getHistory(sessionId: string): Promise<AIMessage[]> {
    const { data } = await api.get<AIMessage[]>(`/ai/history/${sessionId}`);
    return data;
  },

  async listSessions(): Promise<AISession[]> {
    const { data } = await api.get<AISession[]>("/ai/sessions");
    return data;
  },

  /** SSE stream for real-time token delivery. Returns an AbortController. */
  streamQuery(
    sessionId: string,
    message: string,
    callbacks: { onToken: (t: string) => void; onDone: (full: string) => void; onError: (e: string) => void }
  ): AbortController {
    const ctrl = new AbortController();
    (async () => {
      try {
        const { data: session } = await import("@/lib/supabase/client").then((m) => m.supabase().auth.getSession());
        const token = session.session?.access_token;
        const res = await fetch(`${api.defaults.baseURL}/ai/query/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ session_id: sessionId, query: message }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            try {
              const evt = JSON.parse(trimmed.slice(5));
              if (evt.type === "token") { full += evt.content; callbacks.onToken(evt.content); }
              if (evt.type === "done") callbacks.onDone(full);
              if (evt.type === "error") callbacks.onError(evt.message);
            } catch { /* skip malformed */ }
          }
        }
        if (full) callbacks.onDone(full);
      } catch (err: any) {
        if (err?.name !== "AbortError") callbacks.onError(err?.message || "Stream failed");
      }
    })();
    return ctrl;
  },
};
