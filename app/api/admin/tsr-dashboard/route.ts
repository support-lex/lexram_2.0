// Super-admin TSR dashboard endpoint — User → Case → Document drill-down.
//
// Returns every TSR user (anyone with at least one tsr_clients row), nested
// with their cases and the documents on those cases. Service-role bypasses
// RLS; the only gate is the super_admin check below.

import { NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface TokenUsage {
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
}

interface OrgRow {
  id: string;
  name: string;
}

interface CaseRow {
  id: string;
  user_id: string;
  org_id: string | null;
  case_name: string;
  case_no: string;
  bank_name: string;
  status: string;
  token_usage: TokenUsage | null;
  created_at: string;
}

interface DocumentRow {
  id: string;
  case_id: string;
  filename: string;
  status: string;
  created_at: string;
}

interface RequestRow {
  status: "pending" | "approved" | "rejected";
}

export async function GET() {
  const ctx = await getSessionCtx();
  if (!ctx?.is_super) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sb = supabaseAdmin();

  const [casesRes, docsRes, orgsRes, requestsRes] = await Promise.all([
    sb.from("tsr_clients")
      .select("id, user_id, org_id, case_name, case_no, bank_name, status, token_usage, created_at")
      .order("created_at", { ascending: false }),
    sb.from("tsr_documents")
      .select("id, case_id, filename, status, created_at")
      .order("created_at", { ascending: false }),
    sb.from("organizations").select("id, name"),
    sb.from("tsr_org_requests").select("status"),
  ]);

  const firstError = casesRes.error || docsRes.error || orgsRes.error || requestsRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const cases = (casesRes.data ?? []) as CaseRow[];
  const docs = (docsRes.data ?? []) as DocumentRow[];
  const orgs = (orgsRes.data ?? []) as OrgRow[];
  const requests = (requestsRes.data ?? []) as RequestRow[];

  // ── Email lookup from auth.users ────────────────────────────────────────
  // Auth listUsers paginates at 50 by default; bump to 1000 for realistic
  // tenant sizes. Past that, switch to a paginated loop.
  const { data: usersPage } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailByUser = new Map<string, string>();
  for (const u of usersPage?.users ?? []) {
    if (u.email) emailByUser.set(u.id, u.email);
  }

  const orgNameById = new Map(orgs.map((o) => [o.id, o.name]));

  // ── Group docs under their case ─────────────────────────────────────────
  const docsByCase = new Map<string, DocumentRow[]>();
  for (const d of docs) {
    const arr = docsByCase.get(d.case_id) ?? [];
    arr.push(d);
    docsByCase.set(d.case_id, arr);
  }

  // ── Build nested User → Cases → Documents tree ──────────────────────────
  // Group cases by user, build the rich user object, then sort.
  const casesByUser = new Map<string, CaseRow[]>();
  for (const c of cases) {
    const arr = casesByUser.get(c.user_id) ?? [];
    arr.push(c);
    casesByUser.set(c.user_id, arr);
  }

  const users = Array.from(casesByUser.entries()).map(([user_id, userCases]) => {
    const nestedCases = userCases.map((c) => {
      const caseDocs = docsByCase.get(c.id) ?? [];
      const tu = c.token_usage ?? {};
      return {
        id:         c.id,
        case_name:  c.case_name,
        case_no:    c.case_no,
        bank_name:  c.bank_name,
        status:     c.status,
        created_at: c.created_at,
        org_name:   c.org_id ? orgNameById.get(c.org_id) ?? null : null,
        tokens: {
          input:  tu.input_tokens  ?? 0,
          output: tu.output_tokens ?? 0,
          total:  tu.total_tokens  ?? 0,
        },
        document_count: caseDocs.length,
        // tsr_documents has no file_size/page_count columns today — the
        // backend pipeline records these elsewhere. Surface as zeros so the
        // table renders consistently; values populate once the schema gains
        // them.
        page_count: 0,
        documents: caseDocs.map((d) => ({
          id:         d.id,
          filename:   d.filename,
          status:     d.status,
          created_at: d.created_at,
          file_size:  0,
          page_count: 0,
        })),
      };
    });

    const cases_count = nestedCases.length;
    const docs_count  = nestedCases.reduce((n, c) => n + c.document_count, 0);
    const tokens      = nestedCases.reduce((n, c) => n + c.tokens.total, 0);

    return {
      user_id,
      email:    emailByUser.get(user_id) ?? null,
      stats:    { cases: cases_count, documents: docs_count, tokens },
      cases:    nestedCases,
    };
  })
  // Heaviest users first — most-tokens first, then most-cases.
  .sort((a, b) => b.stats.tokens - a.stats.tokens || b.stats.cases - a.stats.cases);

  const summary = {
    total_users:      users.length,
    total_cases:      cases.length,
    total_documents:  docs.length,
    total_tokens:     users.reduce((n, u) => n + u.stats.tokens, 0),
    total_orgs:       orgs.length,
    pending_requests: requests.filter((r) => r.status === "pending").length,
  };

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    summary,
    users,
  });
}
