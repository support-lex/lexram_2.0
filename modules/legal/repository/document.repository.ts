// Repository for /cases/{case_id}/documents on the LexRam backend.
//
// Backend v2 moved documents off sessions onto cases: a case is the durable
// container for documents; sessions are chat threads that *reference* the
// active case. Uploading/listing/deleting all happen by case_id.

import { lexramRequest } from "../api/lexram.api";

export type DocumentStatus =
  | "processing"
  | "ready"
  | "low_quality"
  | "failed"
  | "infected"
  | string;

/**
 * The backend's document shape isn't pinned by the OpenAPI schema (the
 * response is `application/json` with no $ref), so we model the fields the
 * UI actually reads and tolerate the rest as `[k: string]: unknown`.
 */
export interface CaseDocument {
  id?: string;
  doc_id?: string;
  case_id?: string;
  filename?: string;
  name?: string;
  size?: number;
  bytes?: number;
  mime_type?: string;
  content_type?: string;
  status?: DocumentStatus;
  created_at?: string;
  uploaded_at?: string;
  [k: string]: unknown;
}

// Backwards-compat alias; the field names in `CaseDocument` already tolerate
// the old session-scoped shape, so existing callers that imported
// `SessionDocument` continue to type-check.
export type SessionDocument = CaseDocument;

export const documentRepository = {
  async list(caseId: string): Promise<CaseDocument[]> {
    if (!caseId) return [];
    const res = await lexramRequest<CaseDocument[] | { documents?: CaseDocument[] }>(
      `/cases/${encodeURIComponent(caseId)}/documents`
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.documents)) return res.documents;
    return [];
  },

  async get(caseId: string, docId: string): Promise<CaseDocument | null> {
    if (!caseId || !docId) return null;
    try {
      return await lexramRequest<CaseDocument>(
        `/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}`
      );
    } catch (err) {
      console.warn("[documentRepository.get]", err);
      return null;
    }
  },

  async upload(caseId: string, file: File): Promise<CaseDocument | null> {
    if (!caseId) throw new Error("Select a case before uploading");
    const form = new FormData();
    form.append("file", file);
    return lexramRequest<CaseDocument>(
      `/cases/${encodeURIComponent(caseId)}/documents`,
      { method: "POST", formData: form }
    );
  },

  async remove(caseId: string, docId: string): Promise<void> {
    await lexramRequest(
      `/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}`,
      { method: "DELETE" }
    );
  },
};

// ─── Helpers used by the UI ───────────────────────────────────────────────────

export function docId(d: CaseDocument): string {
  return String(d.id ?? d.doc_id ?? "");
}

export function docName(d: CaseDocument): string {
  return String(d.filename ?? d.name ?? "Untitled document");
}

export function docSize(d: CaseDocument): number {
  return Number(d.size ?? d.bytes ?? 0);
}

export function formatBytes(n: number): string {
  if (!n || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
