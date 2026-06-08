// JWT-injecting fetch helper for the TSR (Lex-Doc-Analyzer) backend.
// Ported from the lexram app. Token is cached in module state to avoid
// navigator.locks contention when several requests race on first mount.

import { supabase as lexramSupabase } from "@/lib/supabase/client";

const API_BASE =
  (typeof window !== "undefined"
    ? "" // browser: relative URL → Next.js proxy at /api/tsr/
    : process.env.NEXT_PUBLIC_TSR_API_URL) ??
  "https://lex-doc-analyzer.onrender.com";

let cachedToken: string | null = null;
let initialFetch: Promise<string | null> | null = null;
let listenerAttached = false;

const TOKEN_TIMEOUT_MS = 15_000;
const FETCH_TIMEOUT_MS = 45_000;

function timeout<T>(ms: number, label: string): Promise<T> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
  );
}

async function getAccessToken(): Promise<string | null> {
  if (cachedToken !== null) return cachedToken;
  if (!initialFetch) {
    const sb = lexramSupabase();
    if (!listenerAttached && typeof window !== "undefined") {
      sb.auth.onAuthStateChange((_event, session) => {
        cachedToken = session?.access_token ?? null;
      });
      listenerAttached = true;
    }
    const sessionPromise = sb.auth.getSession().then(({ data }) => {
      cachedToken = data.session?.access_token ?? null;
      initialFetch = null;
      return cachedToken;
    }).catch(() => {
      initialFetch = null;
      return null;
    });
    initialFetch = Promise.race([
      sessionPromise,
      timeout<string | null>(TOKEN_TIMEOUT_MS, "getSession()"),
    ]);
  }
  return initialFetch;
}

export async function tsrApi(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const url = API_BASE === "" ? `/api/tsr${path}` : `${API_BASE}${path}`;
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
}

export async function tsrApiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await tsrApi(path, options);
  if (!res.ok) {
    const detail = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`${res.status} ${res.statusText}: ${detail.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ── Typed contracts ──────────────────────────────────────────────────────────
export interface TsrDocument {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  page_count: number | null;
  status: "processing" | "processed" | "error" | "uploaded";
  created_at: string;
}

export interface TsrTokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  model: string;
}

export interface TsrCaseSummary {
  id: string;
  case_name: string;
  case_no: string;
  bank_name: string;
  status: string;
  progress: number;
  status_message: string;
  token_usage: TsrTokenUsage | null;
  scrutiny_report: unknown | null;
  master_case_json: unknown | null;
  active_queries: unknown[];
  created_at: string;
  document_count: number;
  documents: TsrDocument[];
}

export interface TsrViewUrl {
  url: string;
  filename: string;
  expires_in: number;
}

/** Signed GCS view URL — served by the backend (documents live in GCS). */
export function getDocumentViewUrl(caseId: string, docId: string) {
  return tsrApiJson<TsrViewUrl>(`/cases/${caseId}/documents/${docId}/view-url`);
}
