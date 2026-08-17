// SSE client for GET /legal-api/cases/{case_id}/documents/{doc_id}/stream
//
// The endpoint streams document-processing transitions live so the upload UI
// can update its status badges in place (no polling). Backend v2 scopes this
// to the case (not the session). The exact event shape isn't pinned by the
// OpenAPI spec, so we accept any JSON line and forward it to the caller as a
// generic record.

import { LEXRAM_BASE, getAuthToken } from "./lexram.api";

export interface DocumentStatusEvent {
  type?: string;
  status?: string;
  doc_id?: string;
  case_id?: string;
  message?: string;
  [k: string]: unknown;
}

export interface DocumentStatusStreamCallbacks {
  onEvent?: (event: DocumentStatusEvent) => void;
  onError?: (message: string) => void;
}

export interface DocumentStatusStreamOptions {
  signal?: AbortSignal;
}

export async function streamDocumentStatus(
  caseId: string,
  docId: string,
  callbacks: DocumentStatusStreamCallbacks,
  options: DocumentStatusStreamOptions = {}
): Promise<void> {
  if (!caseId || !docId) throw new Error("Missing case or document id");

  const token = await getAuthToken();
  const headers: Record<string, string> = { Accept: "text/event-stream" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${LEXRAM_BASE}/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}/stream`,
    { method: "GET", headers, signal: options.signal }
  );

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      detail = errBody?.detail ?? errBody?.message ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (!res.body) throw new Error("No response body for status stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.replace(/^\uFEFF/, "").trim();
        if (!line || !line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const event = JSON.parse(payload) as DocumentStatusEvent;
          callbacks.onEvent?.(event);
        } catch (err) {
          console.warn("[streamDocumentStatus] failed to parse SSE line", payload, err);
        }
      }
    }
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      callbacks.onError?.(err?.message || "Document status stream failed");
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* noop */
    }
  }
}
