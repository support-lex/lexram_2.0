// Super-admin TSR dashboard endpoint.
//
// Returns a single payload aggregating every TSR-related table on the lexram
// supabase (tsr_clients, tsr_documents, tsr_payments, tsr_org_requests,
// organizations, organization_members) plus auth.users email lookups, so the
// /dashboard/tsr/admin/dashboard view can render the entire platform state
// without making one round-trip per table.
//
// Service-role is used to bypass RLS — auth gate above is the only check.

import { NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

const RECENT_LIMIT = 20;

interface TokenUsage {
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
}

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  plan: "trial" | "standard" | "enterprise";
  status: "active" | "suspended";
  seat_limit: number;
  admin_email: string | null;
  admin_name: string | null;
  account_type: "individual" | "organization" | null;
  created_at: string;
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
  updated_at: string;
}

interface DocumentRow {
  id: string;
  case_id: string;
  filename: string;
  status: string;
  created_at: string;
}

interface PaymentRow {
  id: string;
  user_id: string;
  org_id: string | null;
  case_id: string | null;
  amount_inr: number;
  status: "pending" | "success" | "failed";
  invoice_no: string;
  user_email: string | null;
  created_at: string;
  paid_at: string | null;
}

interface MemberRow {
  org_id: string;
  user_id: string;
  role: "admin" | "member";
  status: "active" | "invited" | "suspended";
}

interface RequestRow {
  id: string;
  organization_name: string;
  contact_name: string;
  contact_email: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
}

export async function GET() {
  const ctx = await getSessionCtx();
  if (!ctx?.is_super) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sb = supabaseAdmin();

  const [orgsRes, casesRes, docsRes, paymentsRes, membersRes, requestsRes] = await Promise.all([
    sb.from("organizations")
      .select("id, name, slug, plan, status, seat_limit, admin_email, admin_name, account_type, created_at")
      .order("created_at", { ascending: false }),
    sb.from("tsr_clients")
      .select("id, user_id, org_id, case_name, case_no, bank_name, status, token_usage, created_at, updated_at")
      .order("created_at", { ascending: false }),
    sb.from("tsr_documents")
      .select("id, case_id, filename, status, created_at")
      .order("created_at", { ascending: false }),
    sb.from("tsr_payments")
      .select("id, user_id, org_id, case_id, amount_inr, status, invoice_no, user_email, created_at, paid_at")
      .order("created_at", { ascending: false }),
    sb.from("organization_members")
      .select("org_id, user_id, role, status"),
    sb.from("tsr_org_requests")
      .select("id, organization_name, contact_name, contact_email, status, created_at, reviewed_at")
      .order("created_at", { ascending: false }),
  ]);

  const firstError =
    orgsRes.error || casesRes.error || docsRes.error ||
    paymentsRes.error || membersRes.error || requestsRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const orgs = (orgsRes.data ?? []) as OrgRow[];
  const cases = (casesRes.data ?? []) as CaseRow[];
  const docs = (docsRes.data ?? []) as DocumentRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];
  const members = (membersRes.data ?? []) as MemberRow[];
  const requests = (requestsRes.data ?? []) as RequestRow[];

  // Auth email lookup — listUsers paginates at 50 by default; bump to cover
  // realistic tenant sizes. If you go past 1000 users this needs a loop.
  const { data: usersPage } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailByUser = new Map<string, string>();
  for (const u of usersPage?.users ?? []) {
    if (u.email) emailByUser.set(u.id, u.email);
  }

  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const caseById = new Map(cases.map((c) => [c.id, c]));

  // ── Per-org rollups ──────────────────────────────────────────────────────
  const seatsByOrg: Record<string, number> = {};
  for (const m of members) {
    if (m.status === "suspended") continue;
    seatsByOrg[m.org_id] = (seatsByOrg[m.org_id] ?? 0) + 1;
  }

  const orgRollups: Record<string, { cases: number; tokens: number; revenue: number }> = {};
  for (const c of cases) {
    if (!c.org_id) continue;
    const r = orgRollups[c.org_id] ?? { cases: 0, tokens: 0, revenue: 0 };
    r.cases += 1;
    r.tokens += c.token_usage?.total_tokens ?? 0;
    orgRollups[c.org_id] = r;
  }
  for (const p of payments) {
    if (!p.org_id || p.status !== "success") continue;
    const r = orgRollups[p.org_id] ?? { cases: 0, tokens: 0, revenue: 0 };
    r.revenue += p.amount_inr;
    orgRollups[p.org_id] = r;
  }

  // ── Status distributions ─────────────────────────────────────────────────
  const tally = <T extends { status: string }>(rows: T[]): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const r of rows) out[r.status] = (out[r.status] ?? 0) + 1;
    return out;
  };

  // ── Headline stats ───────────────────────────────────────────────────────
  const successfulPayments = payments.filter((p) => p.status === "success");
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const summary = {
    total_orgs:             orgs.length,
    active_orgs:            orgs.filter((o) => o.status === "active").length,
    suspended_orgs:         orgs.filter((o) => o.status === "suspended").length,
    total_members:          members.filter((m) => m.status !== "suspended").length,
    total_users_with_cases: new Set(cases.map((c) => c.user_id)).size,
    total_cases:            cases.length,
    total_documents:        docs.length,
    total_tokens:           cases.reduce((n, c) => n + (c.token_usage?.total_tokens ?? 0), 0),
    total_revenue_inr:      successfulPayments.reduce((n, p) => n + p.amount_inr, 0),
    pending_payments_inr:   pendingPayments.reduce((n, p) => n + p.amount_inr, 0),
    pending_requests:       requests.filter((r) => r.status === "pending").length,
  };

  const orgsEnriched = orgs.map((o) => {
    const r = orgRollups[o.id] ?? { cases: 0, tokens: 0, revenue: 0 };
    return {
      ...o,
      seats_used:   seatsByOrg[o.id] ?? 0,
      total_cases:  r.cases,
      total_tokens: r.tokens,
      revenue_inr:  r.revenue,
    };
  });

  const recent_cases = cases.slice(0, RECENT_LIMIT).map((c) => ({
    id:         c.id,
    case_name:  c.case_name,
    case_no:    c.case_no,
    bank_name:  c.bank_name,
    status:     c.status,
    user_email: emailByUser.get(c.user_id) ?? null,
    org_name:   c.org_id ? orgById.get(c.org_id)?.name ?? null : null,
    tokens:     c.token_usage?.total_tokens ?? 0,
    created_at: c.created_at,
  }));

  const recent_documents = docs.slice(0, RECENT_LIMIT).map((d) => {
    const c = caseById.get(d.case_id);
    return {
      id:         d.id,
      filename:   d.filename,
      status:     d.status,
      case_name:  c?.case_name ?? null,
      user_email: c ? emailByUser.get(c.user_id) ?? null : null,
      created_at: d.created_at,
    };
  });

  const recent_payments = payments.slice(0, RECENT_LIMIT).map((p) => ({
    id:         p.id,
    invoice_no: p.invoice_no,
    amount_inr: p.amount_inr,
    status:     p.status,
    user_email: p.user_email ?? emailByUser.get(p.user_id) ?? null,
    org_name:   p.org_id ? orgById.get(p.org_id)?.name ?? null : null,
    case_name:  p.case_id ? caseById.get(p.case_id)?.case_name ?? null : null,
    created_at: p.created_at,
    paid_at:    p.paid_at,
  }));

  const recent_requests = requests.slice(0, RECENT_LIMIT).map((r) => ({
    id:                r.id,
    organization_name: r.organization_name,
    contact_name:      r.contact_name,
    contact_email:     r.contact_email,
    status:            r.status,
    created_at:        r.created_at,
    reviewed_at:       r.reviewed_at,
  }));

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    summary,
    status_distribution: {
      cases:    tally(cases),
      documents: tally(docs),
      payments: tally(payments),
    },
    orgs: orgsEnriched,
    recent_cases,
    recent_documents,
    recent_payments,
    recent_requests,
  });
}
