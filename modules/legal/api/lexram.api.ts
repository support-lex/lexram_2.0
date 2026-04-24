// Thin fetch wrapper for the LexRam Legal Research v2 backend.
// All calls go through the Next.js rewrite (`/legal-api/*` → http://157.245.106.223:8124/*)
// so the HTTPS frontend never makes a direct HTTP call (mixed-content safe).
//
// Auth: HTTPBearer. We use the Supabase access token by default; callers can
// override by passing an explicit token.

import { supabase } from "@/lib/supabase/client";

export const LEXRAM_BASE = "/legal-api";
const BASE = LEXRAM_BASE;

export async function getAuthToken(): Promise<string | null> {
  try {
    const { data } = await supabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export interface LexramRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;          // JSON-stringified
  formData?: FormData;     // for multipart uploads
  signal?: AbortSignal;
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
  opts: LexramRequestOptions = {}
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

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
    signal: opts.signal,
  });

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

  // Some endpoints return empty 200s
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
