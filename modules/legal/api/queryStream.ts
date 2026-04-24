// SSE client for POST /legal-api/sessions/{session_id}/query/stream.
//
// EventSource only supports GET, so we use fetch + ReadableStream and parse
// the SSE wire format manually:
//
//   data: {"type":"status","message":"Classifying query..."}\n\n
//   data: {"type":"token","content":"Section"}\n\n
//   data: {"type":"done","session_id":"...","query_type":"...", ...}\n\n
//   data: {"type":"error","message":"..."}\n\n

import { LEXRAM_BASE, getAuthToken, jsonAsciiSafe } from "./lexram.api";

// Query modes sent to the backend. "instant" = quick answer, "deep" = full
// research + authorities, "draft" = produce a legal-document draft using the
// current session + case context (per spec from Ravi Bala: a mode alongside
// Instant/Deep so users can draft inside the same chat session they researched in).
export type QueryMode = "instant" | "deep" | "draft";

export interface QueryStreamDoneEvent {
  type: "done";
  session_id?: string;
  query_type?: string;
  judgments_output?: string;
  acts_output?: string;
  [k: string]: unknown;
}

export interface QueryStreamCallbacks {
  onStatus?: (message: string) => void;
  onToken?: (content: string) => void;
  onDone?: (event: QueryStreamDoneEvent) => void;
  onError?: (message: string) => void;
}

export interface QueryStreamOptions {
  signal?: AbortSignal;
}

export async function streamLexramQuery(
  sessionId: string,
  query: string,
  mode: QueryMode,
  callbacks: QueryStreamCallbacks,
  options: QueryStreamOptions = {}
): Promise<void> {
  if (!sessionId) throw new Error("Missing session id for query stream");
  if (!query?.trim()) throw new Error("Empty query");

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "text/event-stream",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${LEXRAM_BASE}/sessions/${encodeURIComponent(sessionId)}/query/stream`,
    {
      method: "POST",
      headers,
      // ASCII-safe encoding — see jsonAsciiSafe doc for the backend bug we work around.
      body: jsonAsciiSafe({ query, mode }),
      signal: options.signal,
    }
  );

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      detail = errBody?.detail ?? errBody?.message ?? detail;
      if (Array.isArray(detail)) detail = detail.map((d: any) => d.msg ?? d).join("; ");
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  if (!res.body) throw new Error("No response body for query stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by blank lines but most servers (and
      // python-sse) emit one event per line, so we split on \n and look for
      // lines starting with `data:`.
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.replace(/^\uFEFF/, "").trim();
        if (!line || !line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const event = JSON.parse(payload);
          switch (event.type) {
            case "status":
              callbacks.onStatus?.(String(event.message ?? ""));
              break;
            case "token":
              callbacks.onToken?.(String(event.content ?? ""));
              break;
            case "done":
              callbacks.onDone?.(event as QueryStreamDoneEvent);
              break;
            case "error":
              callbacks.onError?.(String(event.message ?? "Unknown error"));
              break;
            default:
              // ignore unknown event types
              break;
          }
        } catch (err) {
          console.warn("[streamLexramQuery] failed to parse SSE line", payload, err);
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* noop */
    }
  }
}
