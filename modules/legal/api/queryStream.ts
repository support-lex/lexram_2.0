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
  /**
   * Backend may attach a `detail` array of strings to status events — each
   * one is a short sub-line meant to be rendered beneath the headline so
   * the user sees what the current tool is actually doing. Absent (or
   * empty) for node-level pipeline events like "Classifying query…".
   */
  onStatus?: (message: string, detail?: string[]) => void;
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
  if (sessionId.startsWith("temp_")) throw new Error("Cannot stream query for an unsaved session — please sign in.");
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
  // Set once the backend emits its terminal `done` event. We then STOP reading
  // immediately instead of waiting for the HTTP connection to close. Some SSE
  // backends (uvicorn/FastAPI keep-alive) hold the stream open after `done`,
  // which left reader.read() pending forever — so streamLexramQuery never
  // returned, isSearching never flipped false, and the chat sat on "working…"
  // indefinitely even though the full answer had already arrived.
  let streamDone = false;

  // Idle watchdog. Distinct from the `streamDone` keep-alive guard above: that
  // one handles a backend that finishes (emits `done`) but holds the socket
  // open. THIS handles a backend that accepts the SSE connection and then goes
  // SILENT — no token, no status, no `done` (e.g. the Draft pipeline stalling
  // on a clarification turn). Without it, reader.read() blocks forever,
  // streamLexramQuery never resolves, the caller's finally never clears
  // isSearching, and the chat sits on "Working…" indefinitely. We race each
  // read against a timeout so a stalled stream self-aborts and surfaces a
  // retryable error. Any received chunk (incl. periodic status pings) resets
  // the window by resolving the read, so a legitimately slow-but-alive stream
  // is never killed.
  const IDLE_TIMEOUT_MS = 60000;

  try {
    while (!streamDone) {
      let idleTimer: ReturnType<typeof setTimeout> | undefined;
      const idle = new Promise<never>((_, reject) => {
        idleTimer = setTimeout(
          () => reject(new Error("The server stopped responding. Please try again.")),
          IDLE_TIMEOUT_MS,
        );
      });
      let result: ReadableStreamReadResult<Uint8Array>;
      try {
        result = await Promise.race([reader.read(), idle]);
      } finally {
        if (idleTimer) clearTimeout(idleTimer);
      }
      const { done, value } = result;
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
            case "status": {
              const detail = Array.isArray(event.detail)
                ? (event.detail as unknown[])
                    .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
                : undefined;
              callbacks.onStatus?.(
                String(event.message ?? ""),
                detail && detail.length > 0 ? detail : undefined,
              );
              break;
            }
            case "token":
              callbacks.onToken?.(String(event.content ?? ""));
              break;
            case "done":
              callbacks.onDone?.(event as QueryStreamDoneEvent);
              streamDone = true;
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
        // Terminal event seen — stop processing any trailing keep-alive lines.
        if (streamDone) break;
      }
    }
  } finally {
    // Close the connection explicitly. If the backend keeps the SSE stream
    // open after `done`, cancel() releases it so the fetch settles and the
    // caller's finally{} (which clears isSearching) actually runs.
    try {
      await reader.cancel();
    } catch {
      /* noop */
    }
    try {
      reader.releaseLock();
    } catch {
      /* noop */
    }
  }
}
