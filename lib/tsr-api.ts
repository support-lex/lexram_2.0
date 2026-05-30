// JWT-injecting fetch helper for the TSR (Lex-Doc-Analyzer) backend.
//
// The backend validates the Supabase access token via SUPABASE_JWT_SECRET
// on every protected route.
//
// Token strategy: we DO NOT call supabase.auth.getSession() on every API
// call — that hits navigator.locks under the hood, and when two requests
// race (which happens on first mount when sidebar + page + middleware all
// fire at once) one of them "steals" the lock and the loser throws:
//
//   AuthRetryableFetchError: Lock broken by another request with the 'steal' option
//
// Instead: lazily fetch the session ONCE, cache the access token in module
// state, and subscribe to onAuthStateChange so the cache stays fresh on
// sign-in / sign-out / token refresh.
//
// Usage:
//   const res  = await tsrApi("/my-cases");
//   const data = await res.json();

import { supabase as lexramSupabase } from "@/lib/supabase/client";

const API_BASE =
  (typeof window !== "undefined"
    ? "" // browser: use relative URL → hits Next.js proxy at /api/tsr/
    : process.env.NEXT_PUBLIC_TSR_API_URL) ??
  "https://lex-doc-analyzer.onrender.com";

// ── Token cache (browser only) ──────────────────────────────────────────────

let cachedToken: string | null = null;
let initialFetch: Promise<string | null> | null = null;
let listenerAttached = false;

<<<<<<< HEAD
const TOKEN_TIMEOUT_MS = 15_000;
const FETCH_TIMEOUT_MS = 45_000;

function timeout<T>(ms: number, label: string): Promise<T> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
  );
}

=======
>>>>>>> tsr
/**
 * Returns the current Supabase access token, lazily fetching the session on
 * first call. Subsequent calls return the cached value (no auth lock contention).
 * Auth state changes (sign-in, sign-out, refresh) update the cache via the
 * onAuthStateChange listener installed below.
 */
async function getAccessToken(): Promise<string | null> {
  if (cachedToken !== null) return cachedToken;

  /* Coalesce concurrent first-time callers so only ONE getSession() runs even
     if the page calls tsrApi() five times before the session is loaded. */
  if (!initialFetch) {
    const sb = lexramSupabase();

    if (!listenerAttached && typeof window !== "undefined") {
      sb.auth.onAuthStateChange((_event, session) => {
        cachedToken = session?.access_token ?? null;
      });
      listenerAttached = true;
    }

<<<<<<< HEAD
    const sessionPromise = sb.auth.getSession().then(({ data }) => {
=======
    initialFetch = sb.auth.getSession().then(({ data }) => {
>>>>>>> tsr
      cachedToken = data.session?.access_token ?? null;
      initialFetch = null;
      return cachedToken;
    }).catch(() => {
      initialFetch = null;
      return null;
    });
<<<<<<< HEAD

    initialFetch = Promise.race([
      sessionPromise,
      timeout<string | null>(TOKEN_TIMEOUT_MS, "getSession()"),
    ]);
=======
>>>>>>> tsr
  }
  return initialFetch;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function tsrApi(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const url =
    API_BASE === ""
      ? `/api/tsr${path}`                // browser: proxy through Next.js
      : `${API_BASE}${path}`;            // server: direct call

<<<<<<< HEAD
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
=======
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
>>>>>>> tsr
}

/** Throw on non-2xx, otherwise return parsed JSON. */
export async function tsrApiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await tsrApi(path, options);
  if (!res.ok) {
    const detail = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`${res.status} ${res.statusText}: ${detail.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ── Typed contracts shared by My Cases page + workspace ──────────────────────

export interface TsrDocument {
  id:           string;
  filename:     string;
  storage_path: string;
  mime_type:    string;
  file_size:    number;
  page_count:   number | null;
  status:       "processing" | "processed" | "error";
  created_at:   string;
}

export interface TsrTokenUsage {
  input_tokens:  number;
  output_tokens: number;
  total_tokens:  number;
  model:         string;
}

export interface TsrCaseSummary {
  id:               string;
  case_name:        string;
  case_no:          string;
  bank_name:        string;
  status:           string;
  progress:         number;
  status_message:   string;
  token_usage:      TsrTokenUsage | null;
  scrutiny_report:  unknown | null;
  master_case_json: unknown | null;
  active_queries:   unknown[];
  created_at:       string;
  document_count:   number;
  documents:        TsrDocument[];
}

export interface TsrViewUrl {
  url:        string;
  filename:   string;
  expires_in: number;
}

export function listMyCases() {
  return tsrApiJson<TsrCaseSummary[]>("/my-cases");
}

export function getDocumentViewUrl(caseId: string, docId: string) {
  return tsrApiJson<TsrViewUrl>(`/cases/${caseId}/documents/${docId}/view-url`);
}
