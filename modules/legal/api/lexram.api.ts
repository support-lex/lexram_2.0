// Thin fetch wrapper for the LexRam Legal Research v2 backend.
//
// Two modes, selected by NEXT_PUBLIC_LEGAL_API_BASE:
//   - unset (default) → "/legal-api", routed through the Next.js rewrite to
//     the HTTP origin. Safe for mixed-content but capped at Vercel's 4.5 MB
//     FUNCTION_PAYLOAD_TOO_LARGE limit (kills large document uploads).
//   - set (e.g. "https://api.lexram.ai") → browser hits the backend directly,
//     bypassing the 4.5 MB cap. Requires the backend to terminate TLS and
//     send CORS headers for the frontend origin.
//
// Auth: HTTPBearer. We use the Supabase access token by default; callers can
// override by passing an explicit token.

import { getAccessToken, refreshAuthToken } from "@/lib/auth-store";
import { begin as activityBegin, end as activityEnd } from "@/lib/api-activity";

export const LEXRAM_BASE =
  process.env.NEXT_PUBLIC_LEGAL_API_BASE || "/legal-api";
const BASE = LEXRAM_BASE;

// Delegates to the single auth source. getAccessToken() AWAITS auth readiness
// before resolving, so the very first authenticated request can't go out
// token-less (the 401-on-cold-load that silently emptied the sidebar / case
// dropdown). Kept as a named export because queryStream imports it.
export async function getAuthToken(): Promise<string | null> {
  return getAccessToken();
}

export { refreshAuthToken };

export interface LexRamRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;          // JSON-stringified
  formData?: FormData;     // for multipart uploads
  signal?: AbortSignal;
  /**
   * Abort the request after this many ms. Used by lifecycle calls (e.g. session
   * create / rename) so a hung or cold-starting backend surfaces as a thrown
   * error instead of leaving the caller awaiting forever — which manifested as
   * the research chat spinning on "working…" indefinitely when POST /sessions
   * never responded and ensureSession() therefore never resolved. Ignored when
   * an explicit `signal` is supplied (the caller owns abort in that case).
   */
  timeoutMs?: number;
}

/**
 * JSON.stringify variant that escapes every non-ASCII character into its
 * `\uXXXX` form. The LexRam backend's body parser rejects raw multi-byte
 * UTF-8 sequences (e.g. em-dash 0xE2 0x80 0x94 → 400 "error parsing the body"),
 * but accepts the same characters when sent as JSON unicode escapes. Forcing
 * the wire payload to pure ASCII makes the parser happy regardless of what
 * the user typed.
 */
export function jsonAsciiSafe(value: unknown): string {
  return JSON.stringify(value).replace(
    /[\u0080-\uFFFF]/g,
    (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")
  );
}

export async function lexramRequest<T = unknown>(
  path: string,
  opts: LexRamRequestOptions = {}
): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
    // Don't set Content-Type — the browser will set the multipart boundary.
  } else if (opts.body !== undefined) {
    // Force ASCII-safe JSON so the backend's body parser doesn't choke on
    // raw multi-byte UTF-8 (em-dash, smart quotes, foreign scripts, …).
    body = jsonAsciiSafe(opts.body);
    headers["Content-Type"] = "application/json; charset=utf-8";
  }

  // An explicit signal wins; otherwise fall back to a timeout-based abort so a
  // hung backend can't leave the request (and its caller) pending forever.
  const signal =
    opts.signal ??
    (opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined);

  // Bump the global in-flight counter so the top progress bar shows for
  // every LexRam API call (matched in the finally below).
  activityBegin();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body,
      signal,
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        detail = errBody?.detail ?? errBody?.message ?? detail;
        if (Array.isArray(detail)) detail = detail.map((d: any) => d.msg ?? d).join("; ");
      } catch { /* ignore */ }
      throw new Error(`[${res.status}] ${detail}`);
    }

    // Some endpoints return empty 200s
    const text = await res.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  } finally {
    activityEnd();
  }
}
