// Schema-aware data layer. Every read/write targets the org's OWN Postgres
// schema (e.g. avr.cases / avr.documents) via supabase.schema(ORG_SLUG).
// RLS on those tables enforces auth.uid() = user_id, so members only see their
// own cases within the org.

import { supabase } from "@/lib/supabase/client";
import { ORG_SLUG } from "@/lib/org-config";
import type { TsrCaseSummary, TsrDocument } from "@/lib/tsr-api";

export const CASES_TABLE = "cases";
export const DOCS_TABLE = "documents";

function db() {
  return supabase().schema(ORG_SLUG);
}

export interface CaseRow {
  id: string;
  user_id: string;
  case_name: string;
  case_no: string;
  bank_name: string;
  status: string;
  progress: number | null;
  status_message: string | null;
  token_usage: { input_tokens?: number; output_tokens?: number; total_tokens?: number; model?: string } | null;
  scrutiny_report: unknown | null;
  final_report: unknown | null;
  master_case_json: unknown | null;
  active_queries: unknown[] | null;
  report_file_url: string | null;
  created_at: string;
}

const CASE_COLS =
  "id, user_id, case_name, case_no, bank_name, status, progress, status_message, token_usage, scrutiny_report, final_report, master_case_json, active_queries, report_file_url, created_at";

function toDoc(d: Record<string, unknown>): TsrDocument {
  return {
    id: String(d.id),
    filename: String(d.filename ?? ""),
    storage_path: String(d.storage_path ?? ""),
    mime_type: String(d.mime_type ?? ""),
    file_size: typeof d.file_size === "number" ? d.file_size : 0,
    page_count: typeof d.page_count === "number" ? d.page_count : null,
    status: (d.status as TsrDocument["status"]) ?? "uploaded",
    created_at: String(d.created_at ?? new Date().toISOString()),
  };
}

function toSummary(c: CaseRow, docs: TsrDocument[]): TsrCaseSummary {
  const tu = c.token_usage ?? null;
  return {
    id: c.id,
    case_name: c.case_name,
    case_no: c.case_no,
    bank_name: c.bank_name,
    status: c.status,
    progress: c.progress ?? 0,
    status_message: c.status_message ?? "",
    token_usage: tu
      ? {
          input_tokens: tu.input_tokens ?? 0,
          output_tokens: tu.output_tokens ?? 0,
          total_tokens: tu.total_tokens ?? 0,
          model: tu.model ?? "",
        }
      : null,
    scrutiny_report: c.scrutiny_report,
    master_case_json: c.master_case_json,
    active_queries: Array.isArray(c.active_queries) ? c.active_queries : [],
    created_at: c.created_at,
    document_count: docs.length,
    documents: docs,
  };
}

/** List the signed-in user's cases (with their documents) from the org schema. */
export async function listCases(userId: string): Promise<TsrCaseSummary[]> {
  const { data: caseRows, error } = await db()
    .from(CASES_TABLE)
    .select(CASE_COLS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const cases = (caseRows ?? []) as CaseRow[];
  if (cases.length === 0) return [];

  const ids = cases.map((c) => c.id);
  const { data: docRows } = await db()
    .from(DOCS_TABLE)
    .select("id, case_id, filename, storage_path, status, created_at")
    .in("case_id", ids);

  const byCase = new Map<string, TsrDocument[]>();
  for (const d of (docRows ?? []) as Record<string, unknown>[]) {
    const cid = String(d.case_id);
    const arr = byCase.get(cid) ?? [];
    arr.push(toDoc(d));
    byCase.set(cid, arr);
  }
  return cases.map((c) => toSummary(c, byCase.get(c.id) ?? []));
}

/** Lightweight case list for the sidebar. */
export async function listSidebarCases(userId: string) {
  const { data, error } = await db()
    .from(CASES_TABLE)
    .select("id, case_name, case_no, bank_name, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; case_name: string; case_no: string; bank_name: string; status: string }[];
}

export async function getCase(id: string): Promise<CaseRow | null> {
  const { data, error } = await db().from(CASES_TABLE).select(CASE_COLS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CaseRow) ?? null;
}

export async function createCase(input: {
  user_id: string;
  org_id: string | null;
  case_name: string;
  case_no: string;
  bank_name: string;
}): Promise<{ id: string }> {
  // Source of truth: the org's own schema.
  const { data, error } = await db()
    .from(CASES_TABLE)
    .insert({ ...input, status: "new" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const id = (data as { id: string }).id;

  // ── Pipeline bridge (temporary) ──────────────────────────────────────────
  // The Lex-Doc-Analyzer backend + payments verify the case in
  // public.tsr_clients. Until the backend is schema-aware, mirror a shadow row
  // there with the SAME id so uploads/payments resolve. Drop this once the
  // backend writes per-schema.
  await supabase()
    .from("tsr_clients")
    .upsert({ id, ...input, status: "new" }, { onConflict: "id" });

  return { id };
}

export async function deleteCase(id: string): Promise<void> {
  const { error } = await db().from(CASES_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
  // Remove the public shadow too (best-effort).
  await supabase().from("tsr_clients").delete().eq("id", id);
}

/** Patch a case (e.g. persist pipeline results into the org schema). */
export async function updateCase(id: string, patch: Partial<CaseRow>): Promise<void> {
  const { error } = await db().from(CASES_TABLE).update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listDocuments(caseId: string): Promise<TsrDocument[]> {
  const { data, error } = await db()
    .from(DOCS_TABLE)
    .select("id, case_id, filename, storage_path, status, created_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(toDoc);
}

export async function addDocument(input: {
  case_id: string;
  filename: string;
  storage_path: string;
  status?: string;
}): Promise<void> {
  const { error } = await db().from(DOCS_TABLE).insert({ status: "uploaded", ...input });
  if (error) throw new Error(error.message);
}
