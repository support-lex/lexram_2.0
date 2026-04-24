// Repository for /sessions on the LexRam Legal Research backend.
// All calls go through the Next.js rewrite (`/legal-api/*`) so the HTTPS
// frontend can reach the HTTP origin without mixed-content blocking.
//
// The backend's response shape isn't pinned in the OpenAPI schema, so we
// model the fields the UI reads and tolerate the rest as `[k: string]: unknown`.

import { lexramRequest } from "../api/lexram.api";
import type { QueryMode } from "../api/queryStream";

export interface QueryResponseEnvelope {
  session_id?: string;
  query_type?: string;
  answer?: string;
  judgments_output?: string;
  acts_output?: string;
  [k: string]: unknown;
}

export interface LexramSession {
  /** id is the same value the docs call thread_id. */
  id?: string;
  thread_id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  [k: string]: unknown;
}

function extractList(raw: unknown): LexramSession[] {
  if (Array.isArray(raw)) return raw as LexramSession[];
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.sessions)) return r.sessions as LexramSession[];
    if (Array.isArray(r.data)) return r.data as LexramSession[];
    if (Array.isArray(r.items)) return r.items as LexramSession[];
  }
  return [];
}

async function lexramRename(id: string, title: string): Promise<void> {
  await lexramRequest(`/sessions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { title },
  });
}

export const lexramSessionRepository = {
  /** GET /sessions — list all sessions for the logged-in user. */
  async list(): Promise<LexramSession[]> {
    const raw = await lexramRequest<unknown>("/sessions");
    return extractList(raw);
  },

  /**
   * POST /sessions — create a new session, then immediately PATCH the title.
   *
   * Why the immediate PATCH:
   *   The LexRam backend ignores the title passed to POST in some builds and
   *   always stores "New Chat". A follow-up PATCH /sessions/{id} guarantees
   *   the title we asked for actually lands on the row before the caller
   *   ever sees it. The PATCH failure is non-fatal — we still return the
   *   created session even if rename errors out.
   */
  async create(title: string = "New Chat"): Promise<LexramSession> {
    const created = await lexramRequest<LexramSession>("/sessions", {
      method: "POST",
      body: { title },
    });

    const id = lexramSessionId(created);
    if (id && title) {
      try {
        await lexramRename(id, title);
        // Reflect the renamed title locally so the caller doesn't have to
        // re-fetch the row to see the latest state.
        return { ...created, title };
      } catch (err) {
        console.warn(
          "[lexramSessionRepository.create] follow-up PATCH failed (non-fatal)",
          err
        );
      }
    }
    return created;
  },

  /** PATCH /sessions/{id} — rename. */
  async rename(id: string, title: string): Promise<void> {
    return lexramRename(id, title);
  },

  /** DELETE /sessions/{id} — hard delete + clear LangGraph checkpoints. */
  async remove(id: string): Promise<void> {
    await lexramRequest(`/sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  /**
   * POST /sessions/{id}/query — non-streaming query.
   *
   * Used as a fallback when SSE isn't viable (corporate proxies that buffer
   * responses, mobile WebView quirks). Same body as the stream endpoint —
   * returns the final envelope in one shot once the pipeline completes.
   */
  async query(
    id: string,
    query: string,
    mode: QueryMode = "instant"
  ): Promise<QueryResponseEnvelope> {
    return lexramRequest<QueryResponseEnvelope>(
      `/sessions/${encodeURIComponent(id)}/query`,
      { method: "POST", body: { query, mode } }
    );
  },
};

export function lexramSessionId(s: LexramSession): string {
  return String(s.id ?? s.thread_id ?? "");
}
