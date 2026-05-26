// JWT-injecting fetch helper for the TSR (Lex-Doc-Analyzer) backend.
//
// The backend now validates the Supabase access token via SUPABASE_JWT_SECRET
// on every protected route. Always call supabase.auth.getSession() fresh so we
// pick up auto-refreshed tokens — don't cache the token across calls.
//
// Usage:
//   const res  = await tsrApi("/my-cases");
//   const data = await res.json();

import { supabase as lexramSupabase } from "@/lib/supabase/client";

const API_BASE =
  process.env.NEXT_PUBLIC_TSR_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://lex-doc-analyzer.onrender.com";

export async function tsrApi(path: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await lexramSupabase().auth.getSession();
  const token = session?.access_token;

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

/** Throw on non-2xx, otherwise return parsed JSON. Convenience for typed reads. */
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
  storage_path: string;            // gs://… URI
  mime_type:    string;
  file_size:    number;            // bytes
  page_count:   number | null;     // null on pre-pagecount docs
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
  expires_in: number;              // seconds (typically 3600)
}

export function listMyCases() {
  return tsrApiJson<TsrCaseSummary[]>("/my-cases");
}

export function getDocumentViewUrl(caseId: string, docId: string) {
  return tsrApiJson<TsrViewUrl>(`/cases/${caseId}/documents/${docId}/view-url`);
}
