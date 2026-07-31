// SSE client for POST /legal-api/sessions/{session_id}/query/stream.
//
// EventSource only supports GET, so we use fetch + ReadableStream and parse
// the SSE wire format manually:
//
//   data: {"type":"status","message":"Classifying query..."}\n\n
//   data: {"type":"token","content":"Section"}\n\n
//   data: {"type":"done","session_id":"...","query_type":"...", ...}\n\n
//   data: {"type":"error","message":"..."}\n\n

import { LEXRAM_BASE, getAuthToken, refreshAuthToken, jsonAsciiSafe } from "./lexram.api";

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
  /** Called each time a tool completes with the retrieved chunk sources.
   *  Arrives progressively during the stream, before `onDone`. */
  onChunks?: (tool: string, sources: unknown[]) => void;
  /** Called when the backend emits a precedent graph via the side channel.
   *  Arrives during the stream (after trace_law_evolution completes), before `onDone`. */
  onGraph?: (graph: { nodes: unknown[]; edges: unknown[] }) => void;
}

export interface QueryStreamOptions {
  signal?: AbortSignal;
  /** Compact structure JSON from a saved draft template — injected into the draft prompt. */
  templateStructure?: object | null;
}

export async function streamLexRamQuery(
  sessionId: string,
  query: string,
  mode: QueryMode,
  callbacks: QueryStreamCallbacks,
  options: QueryStreamOptions = {}
): Promise<void> {
  if (!sessionId) throw new Error("Missing session id for query stream");
  if (sessionId.startsWith("temp_")) throw new Error("Cannot stream query for an unsaved session — please sign in.");
  if (!query?.trim()) throw new Error("Empty query");

  // The caller may have already pressed Stop while we were getting here (e.g.
  // during a slow ensureSession round trip). Bail before doing any work.
  if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const token = await getAuthToken();
  // getAuthToken() awaits Supabase's cross-tab auth lock; Stop pressed during
  // that window must still cancel the turn before we open the socket.
  if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "text/event-stream",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Connect timeout. The idle watchdog below only starts AFTER we hold a reader,
  // so it can't help if the POST is sent but the backend never returns response
  // headers (cold start, proxy buffering, dropped socket) — fetch() would hang
  // forever and the chat would sit on "Working…". Abort the fetch if headers
  // don't arrive in time, surfacing a clean retryable error instead. We chain
  // the caller's signal so the user's Stop still works.
  const CONNECT_TIMEOUT_MS = 30000;
  const connectController = new AbortController();
  const onCallerAbort = () => connectController.abort();
  if (options.signal) {
    if (options.signal.aborted) connectController.abort();
    else options.signal.addEventListener("abort", onCallerAbort, { once: true });
  }
  const connectTimer = setTimeout(() => connectController.abort(), CONNECT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(
      `${LEXRAM_BASE}/sessions/${encodeURIComponent(sessionId)}/query/stream`,
      {
        method: "POST",
        headers,
        // ASCII-safe encoding — see jsonAsciiSafe doc for the backend bug we work around.
        body: jsonAsciiSafe({
          query,
          mode,
          ...(options.templateStructure ? { template_structure: JSON.stringify(options.templateStructure) } : {}),
        }),
        signal: connectController.signal,
      }
    );
  } catch (err) {
    // Connect failed/aborted — tear down the caller-abort wiring before bailing.
    clearTimeout(connectTimer);
    options.signal?.removeEventListener("abort", onCallerAbort);
    // Distinguish a connect-timeout abort (retryable server problem) from a
    // genuine user Stop (clean cancel) so the caller shows the right thing.
    if (
      (err as { name?: string })?.name === "AbortError" &&
      !options.signal?.aborted
    ) {
      throw new Error("The server took too long to respond. Please try again.");
    }
    throw err; // classifyError in use-research-chat maps "Failed to fetch" / "Load failed" → friendly network message
  }
  // Headers arrived — disarm the connect timer, but KEEP the caller-abort →
  // connectController link wired: the response body below was opened with
  // connectController.signal, so the user's Stop must still propagate to it.
  // The wiring is torn down in the reader cleanup finally at the end.
  clearTimeout(connectTimer);

  // On 401: silently refresh the token and retry once before giving up.
  if (res.status === 401) {
    try {
      const freshToken = await refreshAuthToken();
      if (freshToken) {
        headers.Authorization = `Bearer ${freshToken}`;
        const retryRes = await fetch(
          `${LEXRAM_BASE}/sessions/${encodeURIComponent(sessionId)}/query/stream`,
          { method: "POST", headers, body: jsonAsciiSafe({ query, mode, ...(options.templateStructure ? { template_structure: JSON.stringify(options.templateStructure) } : {}) }), signal: connectController.signal }
        );
        if (retryRes.ok) {
          // Swap in the successful retry response and continue
          res = retryRes;
        } else {
          res = retryRes; // fall through to error handling below with the retry status
        }
      }
    } catch { /* refresh or retry failed — fall through */ }
  }

  if (!res.ok) {
    options.signal?.removeEventListener("abort", onCallerAbort);
    let detail = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      detail = errBody?.detail ?? errBody?.message ?? detail;
      if (Array.isArray(detail)) detail = detail.map((d: any) => d.msg ?? d).join("; ");
    } catch { /* ignore */ }
    throw new Error(`[${res.status}] ${detail}`);
  }

  if (!res.body) {
    options.signal?.removeEventListener("abort", onCallerAbort);
    throw new Error("No response body for query stream");
  }

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
            case "chunks":
              if (Array.isArray(event.sources)) {
                callbacks.onChunks?.(String(event.tool ?? ""), event.sources);
              }
              break;
            case "graph":
              if (event.data && Array.isArray(event.data.nodes)) {
                callbacks.onGraph?.(event.data as { nodes: unknown[]; edges: unknown[] });
              }
              break;
            case "error":
              callbacks.onError?.(String(event.message ?? "Unknown error"));
              streamDone = true;
              break;
            default:
              // ignore unknown event types
              break;
          }
        } catch (err) {
          console.warn("[streamLexRamQuery] failed to parse SSE line", payload, err);
        }
        // Terminal event seen — stop processing any trailing keep-alive lines.
        if (streamDone) break;
      }
    }
  } finally {
    // Detach the caller-abort listener now the stream is over (success, idle
    // timeout, or user Stop) so we don't leak it on the caller's signal.
    options.signal?.removeEventListener("abort", onCallerAbort);
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
