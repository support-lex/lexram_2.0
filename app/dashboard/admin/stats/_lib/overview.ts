// Admin overview data layer — SERVER ONLY.
//
// Every read here goes through the service-role client on purpose. RLS on
// profiles / payments / credit_transactions / token_usage scopes rows to
// `auth.uid()`, so an admin page built on the *user* session would silently
// render one person's data and call it "platform totals". The page component
// verifies super-admin before calling anything in this file.
//
// Design rules:
//  • Every query is wrapped in safe() — one missing table or renamed column
//    degrades a single tile instead of blanking the whole dashboard. Failures
//    surface as `warnings` at the top of the page rather than empty zeros.
//  • Day buckets are IST (Asia/Kolkata), not UTC. "Signups today" has to mean
//    what an operator in India means by today, otherwise the number is wrong
//    for 5.5 hours out of every day.
//  • PostgREST caps a response at 1000 rows. Anything we sum over (credit
//    transactions, token usage) is paged via pageAll() — a plain .select()
//    would silently truncate and undercount lifetime totals.

import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ── Time helpers (IST) ──────────────────────────────────────────────────────

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** UTC instant of IST midnight, `daysAgo` days back. */
export function istDayStart(daysAgo = 0): Date {
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  const ms = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - daysAgo);
  return new Date(ms - IST_OFFSET_MS);
}

/** "YYYY-MM-DD" of an ISO timestamp, in IST. */
function istDayKey(iso: string): string {
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Ordered day keys covering the last `days` days, oldest first, IST. */
function dayKeyRange(days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push(new Date(istDayStart(i).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Bucket rows into a dense daily series. Dense matters: a sparse series drawn
 * as evenly spaced columns turns "3 quiet days" into "no gap at all" and
 * misreads the trend.
 */
function toDailySeries<T>(
  rows: T[],
  days: number,
  getDate: (row: T) => string | null | undefined,
  getValue: (row: T) => number = () => 1
): DailyPoint[] {
  const buckets = new Map<string, number>(dayKeyRange(days).map((k) => [k, 0]));
  for (const row of rows) {
    const iso = getDate(row);
    if (!iso) continue;
    const key = istDayKey(iso);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + getValue(row));
  }
  return [...buckets].map(([date, value]) => ({ date, value }));
}

/**
 * Dense daily series over the WHOLE dataset (earliest record → today), IST.
 *
 * This is what lets the page carry a real date-range filter. Sending one full-history
 * series per metric (a few hundred small points) instead of a fixed 30-day window means
 * the client can recompute every KPI and chart for 7d / 30d / 90d / 12m / all-time
 * instantly, with no refetch — and the raw row-level data never has to cross the wire.
 */
function toFullSeries<T>(
  rows: T[],
  getDate: (row: T) => string | null | undefined,
  getValue: (row: T) => number = () => 1
): DailyPoint[] {
  const buckets = new Map<string, number>();
  let earliest: string | null = null;
  for (const row of rows) {
    const iso = getDate(row);
    if (!iso) continue;
    const key = istDayKey(iso);
    if (!earliest || key < earliest) earliest = key;
    buckets.set(key, (buckets.get(key) ?? 0) + getValue(row));
  }
  if (!earliest) return [];

  // Fill the gaps: a sparse series drawn as evenly spaced columns turns quiet days into
  // no gap at all, which misreads the trend.
  const out: DailyPoint[] = [];
  const todayKey = new Date(istDayStart(0).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
  const cursor = new Date(`${earliest}T00:00:00Z`);
  const end = new Date(`${todayKey}T00:00:00Z`);
  // Guard against a bad timestamp producing a runaway loop (10 years of days).
  for (let i = 0; cursor <= end && i < 3700; i++) {
    const key = cursor.toISOString().slice(0, 10);
    out.push({ date: key, value: buckets.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

// ── Query helpers ───────────────────────────────────────────────────────────

async function safe<T>(label: string, fallback: T, run: () => Promise<T>, warnings: string[]): Promise<T> {
  try {
    return await run();
  } catch (err) {
    warnings.push(`${label} — ${err instanceof Error ? err.message : String(err)}`);
    return fallback;
  }
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

/** Exact row count without transferring rows. */
async function countRows(table: string, apply?: (q: any) => any): Promise<number> {
  let q = supabaseAdmin().from(table).select("*", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Page past PostgREST's 1000-row ceiling so lifetime sums are actually complete. */
async function pageAll<T>(build: (from: number, to: number) => any, hardCap = 50_000): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; from < hardCap; from += PAGE) {
    const rows = unwrap<T[]>(await build(from, from + PAGE - 1));
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

// ── Shapes ──────────────────────────────────────────────────────────────────

export interface DailyPoint {
  date: string;
  value: number;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  balance: number | null;
  joined: string | null;
  lastSeen: string | null;
  verified: boolean;
  superAdmin: boolean;
  spent: number;
  toppedUp: number;
}

export interface TopUpRow {
  id: string;
  orderId: string;
  userLabel: string;
  amountInr: number;
  creditsGranted: number | null;
  status: string;
  method: string | null;
  invoiceNumber: string | null;
  createdAt: string | null;
  paidAt: string | null;
}

export interface OrgRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  accountType: string | null;
  provisionStatus: string | null;
  seatLimit: number | null;
  seatsUsed: number;
  adminEmail: string | null;
  createdAt: string | null;
}

export interface SessionRow {
  id: string;
  title: string;
  userLabel: string;
  lastActive: string | null;
}

/**
 * Full-history daily series, one per metric. The client slices these to whatever range
 * the operator picks — every headline number on the page is derived from here, so the
 * range filter is real rather than decorative.
 */
export interface AdminSeries {
  signups: DailyPoint[];
  revenue: DailyPoint[];
  orders: DailyPoint[];
  paidOrders: DailyPoint[];
  creditsGranted: DailyPoint[];
  creditsSpent: DailyPoint[];
  sessions: DailyPoint[];
  tokens: DailyPoint[];
}

export interface AdminOverview {
  generatedAt: string;
  warnings: string[];
  series: AdminSeries;

  users: {
    total: number;
    verified: number;
    newToday: number;
    new7d: number;
    new30d: number;
    activeToday: number;
    active7d: number;
    active30d: number;
    neverSignedIn: number;
    signupSeries: DailyPoint[];
    rows: UserRow[];
  };

  money: {
    revenueInr: number;
    paidOrders: number;
    pendingOrders: number;
    pendingValueInr: number;
    failedOrders: number;
    creditsSold: number;
    avgOrderInr: number;
    conversionPct: number;
    revenue30dInr: number;
    revenueSeries: DailyPoint[];
    topUps: TopUpRow[];
    byStatus: Array<{ status: string; count: number; valueInr: number }>;
  };

  credits: {
    outstanding: number;
    walletCount: number;
    granted: number;
    spent: number;
    byReason: Array<{ reason: string; count: number; credits: number }>;
    burnSeries: DailyPoint[];
  };

  usage: {
    sessionsTotal: number;
    sessionsToday: number;
    sessions7d: number;
    casesTotal: number;
    documentsTotal: number;
    tokensIn: number;
    tokensOut: number;
    tokensTotal: number;
    tokensByMode: Array<{ mode: string; calls: number; tokens: number }>;
    tokenSeries: DailyPoint[];
    evalTotal: number;
    evalPassed: number;
    feedbackUp: number;
    feedbackDown: number;
    recentSessions: SessionRow[];
  };

  orgs: {
    total: number;
    active: number;
    members: number;
    pendingRequests: number;
    tsrCases: number;
    lodCases: number;
    tsrDocuments: number;
    rows: OrgRow[];
  };

  content: {
    blogTotal: number;
    blogPublished: number;
    blogDraft: number;
    blogScheduled: number;
    networkProfiles: number;
    networkPosts: number;
    networkConnections: number;
  };
}

// ── Loader ──────────────────────────────────────────────────────────────────

export async function loadAdminOverview(): Promise<AdminOverview> {
  const sb = supabaseAdmin();
  const warnings: string[] = [];

  const today = istDayStart(0).toISOString();
  const d7 = istDayStart(7).toISOString();
  const d30 = istDayStart(30).toISOString();

  const [authUsers, profiles, wallets, transactions, payments, tokenUsage, orgs, members, sessions, counts] =
    await Promise.all([
      // auth.users is the only place last_sign_in_at lives — "active users"
      // cannot be derived from public.profiles at all.
      safe(
        "auth.users",
        [] as AuthUser[],
        async () => {
          const acc: AuthUser[] = [];
          for (let page = 1; page <= 20; page++) {
            const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
            if (error) throw new Error(error.message);
            const batch = (data?.users ?? []) as unknown as AuthUser[];
            acc.push(...batch);
            if (batch.length < 1000) break;
          }
          return acc;
        },
        warnings
      ),

      safe(
        "profiles",
        [] as ProfileRow[],
        async () =>
          pageAll<ProfileRow>((from, to) =>
            sb
              .from("profiles")
              .select("id, first_name, last_name, email, phone, country, created_at, is_verified, is_super_admin")
              .order("created_at", { ascending: false })
              .range(from, to)
          ),
        warnings
      ),

      safe(
        "user_credits",
        [] as WalletRow[],
        async () => pageAll<WalletRow>((from, to) => sb.from("user_credits").select("user_id, balance").range(from, to)),
        warnings
      ),

      safe(
        "credit_transactions",
        [] as TxRow[],
        async () =>
          pageAll<TxRow>((from, to) =>
            sb
              .from("credit_transactions")
              .select("user_id, delta, reason, created_at")
              .order("created_at", { ascending: false })
              .range(from, to)
          ),
        warnings
      ),

      safe(
        "payments",
        [] as PaymentRow[],
        async () =>
          pageAll<PaymentRow>((from, to) =>
            sb
              .from("payments")
              .select(
                "id, user_id, order_id, amount_inr, credits_granted, status, payment_method, invoice_number, customer_name, customer_email, created_at, paid_at"
              )
              .order("created_at", { ascending: false })
              .range(from, to)
          ),
        warnings
      ),

      safe(
        "token_usage",
        [] as TokenRow[],
        async () =>
          pageAll<TokenRow>((from, to) =>
            sb
              .from("token_usage")
              .select("mode, input_tokens, output_tokens, total_tokens, created_at")
              .order("created_at", { ascending: false })
              .range(from, to)
          ),
        warnings
      ),

      safe(
        "organizations",
        [] as OrgTableRow[],
        async () =>
          pageAll<OrgTableRow>((from, to) =>
            sb
              .from("organizations")
              .select(
                "id, name, slug, plan, status, account_type, provision_status, seat_limit, admin_email, created_at"
              )
              .order("created_at", { ascending: false })
              .range(from, to)
          ),
        warnings
      ),

      safe(
        "organization_members",
        [] as MemberRow[],
        async () =>
          pageAll<MemberRow>((from, to) =>
            sb.from("organization_members").select("org_id, user_id, status").range(from, to)
          ),
        warnings
      ),

      // Paged in full (not the old limit(12)) because the sessions-per-day series and any
      // range-filtered session count are derived from these timestamps. Only the derived
      // series and a short recent list ever leave the server.
      safe(
        "chat_sessions",
        [] as ChatSessionRow[],
        async () =>
          pageAll<ChatSessionRow>((from, to) =>
            sb
              .from("chat_sessions")
              .select("id, user_id, title, created_at, last_active_at, updated_at")
              .order("created_at", { ascending: false })
              .range(from, to)
          ),
        warnings
      ),

      // Cheap head-only counts, fanned out together.
      safe(
        "counts",
        {} as Record<string, number>,
        async () => {
          const specs: Array<[string, string, ((q: any) => any) | undefined]> = [
            ["sessionsTotal", "chat_sessions", undefined],
            ["sessionsToday", "chat_sessions", (q) => q.gte("created_at", today)],
            ["sessions7d", "chat_sessions", (q) => q.gte("created_at", d7)],
            ["casesTotal", "cases", (q) => q.is("deleted_at", null)],
            ["documentsTotal", "documents", undefined],
            ["evalTotal", "eval_results", undefined],
            ["evalPassed", "eval_results", (q) => q.eq("overall_pass", true)],
            ["feedbackUp", "message_feedback", (q) => q.eq("rating", "up")],
            ["feedbackDown", "message_feedback", (q) => q.eq("rating", "down")],
            ["tsrCases", "tsr_clients", undefined],
            ["lodCases", "lod_cases", undefined],
            ["tsrDocuments", "tsr_documents", undefined],
            ["pendingRequests", "tsr_org_requests", (q) => q.eq("status", "pending")],
            ["blogTotal", "blog_posts", undefined],
            ["blogPublished", "blog_posts", (q) => q.eq("status", "published")],
            ["blogDraft", "blog_posts", (q) => q.eq("status", "draft")],
            ["blogScheduled", "blog_posts", (q) => q.eq("status", "scheduled")],
            ["networkProfiles", "network_profiles", undefined],
            ["networkPosts", "network_posts", undefined],
            ["networkConnections", "network_connections", (q) => q.eq("status", "accepted")],
          ];
          const settled = await Promise.all(
            specs.map(async ([key, table, apply]) => {
              try {
                return [key, await countRows(table, apply)] as const;
              } catch {
                // A single unreadable table shouldn't cost us the other 19.
                return [key, 0] as const;
              }
            })
          );
          return Object.fromEntries(settled);
        },
        warnings
      ),
    ]);

  // ── Identity index ────────────────────────────────────────────────────────
  // Neither table alone can label a user: phone signups leave profiles.email
  // empty, and auth.users has no name. Merge, then fall back down the chain.
  const authById = new Map(authUsers.map((u) => [u.id, u]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const balanceById = new Map(wallets.map((w) => [w.user_id, Number(w.balance) || 0]));

  const spentById = new Map<string, number>();
  const toppedUpById = new Map<string, number>();
  for (const tx of transactions) {
    if (!tx.user_id) continue;
    const delta = Number(tx.delta) || 0;
    if (delta < 0) spentById.set(tx.user_id, (spentById.get(tx.user_id) ?? 0) - delta);
    else toppedUpById.set(tx.user_id, (toppedUpById.get(tx.user_id) ?? 0) + delta);
  }

  function labelFor(userId: string | null | undefined, fallback?: string | null): string {
    if (!userId) return fallback || "—";
    const p = profileById.get(userId);
    const a = authById.get(userId);
    const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
    return name || p?.email || a?.email || p?.phone || a?.phone || fallback || `${userId.slice(0, 8)}…`;
  }

  // Union of both sides — an auth user with no profile row is still a user, and
  // counting only profiles would under-report the platform.
  const allIds = new Set<string>([...profileById.keys(), ...authById.keys()]);

  const userRows: UserRow[] = [...allIds]
    .map((id) => {
      const p = profileById.get(id);
      const a = authById.get(id);
      const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
      return {
        id,
        name: name || "—",
        email: p?.email || a?.email || "",
        phone: p?.phone || a?.phone || "",
        country: p?.country || "",
        balance: balanceById.has(id) ? (balanceById.get(id) as number) : null,
        joined: p?.created_at ?? a?.created_at ?? null,
        lastSeen: a?.last_sign_in_at ?? null,
        verified: Boolean(p?.is_verified || a?.phone_confirmed_at),
        superAdmin: Boolean(p?.is_super_admin),
        spent: spentById.get(id) ?? 0,
        toppedUp: toppedUpById.get(id) ?? 0,
      };
    })
    .sort((a, b) => (b.joined ?? "").localeCompare(a.joined ?? ""));

  const since = (iso: string, at: string | null | undefined) => Boolean(at && at >= iso);

  // ── Money ─────────────────────────────────────────────────────────────────
  const PAID = new Set(["paid", "success", "completed", "captured"]);
  const paid = payments.filter((p) => PAID.has((p.status ?? "").toLowerCase()));
  const pending = payments.filter((p) => (p.status ?? "").toLowerCase() === "pending");
  const failed = payments.filter((p) => ["failed", "cancelled", "canceled"].includes((p.status ?? "").toLowerCase()));

  const revenueInr = paid.reduce((s, p) => s + (Number(p.amount_inr) || 0), 0);
  const creditsSold = paid.reduce((s, p) => s + (Number(p.credits_granted) || 0), 0);
  const pendingValueInr = pending.reduce((s, p) => s + (Number(p.amount_inr) || 0), 0);

  const statusTotals = new Map<string, { count: number; valueInr: number }>();
  for (const p of payments) {
    const key = (p.status ?? "unknown").toLowerCase();
    const cur = statusTotals.get(key) ?? { count: 0, valueInr: 0 };
    cur.count += 1;
    cur.valueInr += Number(p.amount_inr) || 0;
    statusTotals.set(key, cur);
  }

  // Revenue is dated by paid_at, not created_at — an order created Monday and
  // captured Wednesday is Wednesday's money.
  const paidIn30d = paid.filter((p) => since(d30, p.paid_at ?? p.created_at));

  // ── Credits ───────────────────────────────────────────────────────────────
  const reasonTotals = new Map<string, { count: number; credits: number }>();
  for (const tx of transactions) {
    const key = tx.reason ?? "unknown";
    const cur = reasonTotals.get(key) ?? { count: 0, credits: 0 };
    cur.count += 1;
    cur.credits += Number(tx.delta) || 0;
    reasonTotals.set(key, cur);
  }
  const granted = transactions.reduce((s, t) => s + Math.max(0, Number(t.delta) || 0), 0);
  const spent = transactions.reduce((s, t) => s + Math.max(0, -(Number(t.delta) || 0)), 0);
  const burnRows = transactions.filter((t) => (Number(t.delta) || 0) < 0 && since(d30, t.created_at));

  // ── Tokens ────────────────────────────────────────────────────────────────
  const modeTotals = new Map<string, { calls: number; tokens: number }>();
  for (const t of tokenUsage) {
    const key = t.mode ?? "unknown";
    const cur = modeTotals.get(key) ?? { calls: 0, tokens: 0 };
    cur.calls += 1;
    cur.tokens += Number(t.total_tokens) || 0;
    modeTotals.set(key, cur);
  }

  // ── Orgs ──────────────────────────────────────────────────────────────────
  const seatsByOrg = new Map<string, number>();
  for (const m of members) {
    if (!m.org_id) continue;
    if (m.status && m.status !== "active") continue;
    seatsByOrg.set(m.org_id, (seatsByOrg.get(m.org_id) ?? 0) + 1);
  }

  return {
    generatedAt: new Date().toISOString(),
    warnings,

    // Everything the range filter reads. Revenue is dated by capture (paid_at), not by
    // order creation — an order raised Monday and captured Wednesday is Wednesday's money.
    series: {
      signups: toFullSeries(userRows, (u) => u.joined),
      revenue: toFullSeries(paid, (p) => p.paid_at ?? p.created_at, (p) => Number(p.amount_inr) || 0),
      orders: toFullSeries(payments, (p) => p.created_at),
      paidOrders: toFullSeries(paid, (p) => p.paid_at ?? p.created_at),
      creditsGranted: toFullSeries(
        transactions.filter((t) => (Number(t.delta) || 0) > 0),
        (t) => t.created_at,
        (t) => Number(t.delta) || 0
      ),
      creditsSpent: toFullSeries(
        transactions.filter((t) => (Number(t.delta) || 0) < 0),
        (t) => t.created_at,
        (t) => Math.abs(Number(t.delta) || 0)
      ),
      sessions: toFullSeries(sessions, (s) => s.created_at),
      tokens: toFullSeries(tokenUsage, (t) => t.created_at, (t) => Number(t.total_tokens) || 0),
    },

    users: {
      total: allIds.size,
      verified: userRows.filter((u) => u.verified).length,
      newToday: userRows.filter((u) => since(today, u.joined)).length,
      new7d: userRows.filter((u) => since(d7, u.joined)).length,
      new30d: userRows.filter((u) => since(d30, u.joined)).length,
      activeToday: userRows.filter((u) => since(today, u.lastSeen)).length,
      active7d: userRows.filter((u) => since(d7, u.lastSeen)).length,
      active30d: userRows.filter((u) => since(d30, u.lastSeen)).length,
      neverSignedIn: userRows.filter((u) => !u.lastSeen).length,
      signupSeries: toDailySeries(userRows, 30, (u) => u.joined),
      rows: userRows,
    },

    money: {
      revenueInr,
      paidOrders: paid.length,
      pendingOrders: pending.length,
      pendingValueInr,
      failedOrders: failed.length,
      creditsSold,
      avgOrderInr: paid.length ? Math.round(revenueInr / paid.length) : 0,
      conversionPct: payments.length ? Math.round((paid.length / payments.length) * 100) : 0,
      revenue30dInr: paidIn30d.reduce((s, p) => s + (Number(p.amount_inr) || 0), 0),
      revenueSeries: toDailySeries(paidIn30d, 30, (p) => p.paid_at ?? p.created_at, (p) => Number(p.amount_inr) || 0),
      // Every order, not a page of them — the table filters by date range client-side, and
      // a truncated list would silently under-report any range the operator picks.
      topUps: payments.slice(0, 2000).map((p) => ({
        id: p.id ?? p.order_id ?? "",
        orderId: p.order_id ?? "—",
        userLabel: labelFor(p.user_id, p.customer_email ?? p.customer_name),
        amountInr: Number(p.amount_inr) || 0,
        creditsGranted: p.credits_granted == null ? null : Number(p.credits_granted),
        status: (p.status ?? "unknown").toLowerCase(),
        method: p.payment_method ?? null,
        invoiceNumber: p.invoice_number ?? null,
        createdAt: p.created_at ?? null,
        paidAt: p.paid_at ?? null,
      })),
      byStatus: [...statusTotals]
        .map(([status, v]) => ({ status, ...v }))
        .sort((a, b) => b.count - a.count),
    },

    credits: {
      outstanding: wallets.reduce((s, w) => s + (Number(w.balance) || 0), 0),
      walletCount: wallets.length,
      granted,
      spent,
      byReason: [...reasonTotals]
        .map(([reason, v]) => ({ reason, ...v }))
        .sort((a, b) => Math.abs(b.credits) - Math.abs(a.credits)),
      burnSeries: toDailySeries(burnRows, 30, (t) => t.created_at, (t) => Math.abs(Number(t.delta) || 0)),
    },

    usage: {
      sessionsTotal: counts.sessionsTotal ?? 0,
      sessionsToday: counts.sessionsToday ?? 0,
      sessions7d: counts.sessions7d ?? 0,
      casesTotal: counts.casesTotal ?? 0,
      documentsTotal: counts.documentsTotal ?? 0,
      tokensIn: tokenUsage.reduce((s, t) => s + (Number(t.input_tokens) || 0), 0),
      tokensOut: tokenUsage.reduce((s, t) => s + (Number(t.output_tokens) || 0), 0),
      tokensTotal: tokenUsage.reduce((s, t) => s + (Number(t.total_tokens) || 0), 0),
      tokensByMode: [...modeTotals].map(([mode, v]) => ({ mode, ...v })).sort((a, b) => b.tokens - a.tokens),
      tokenSeries: toDailySeries(
        tokenUsage.filter((t) => since(d30, t.created_at)),
        30,
        (t) => t.created_at,
        (t) => Number(t.total_tokens) || 0
      ),
      evalTotal: counts.evalTotal ?? 0,
      evalPassed: counts.evalPassed ?? 0,
      feedbackUp: counts.feedbackUp ?? 0,
      feedbackDown: counts.feedbackDown ?? 0,
      recentSessions: sessions.slice(0, 40).map((s) => ({
        id: s.id,
        title: s.title || "Untitled",
        userLabel: labelFor(s.user_id),
        lastActive: s.last_active_at ?? s.updated_at ?? s.created_at ?? null,
      })),
    },

    orgs: {
      total: orgs.length,
      active: orgs.filter((o) => (o.status ?? "").toLowerCase() === "active").length,
      members: members.filter((m) => !m.status || m.status === "active").length,
      pendingRequests: counts.pendingRequests ?? 0,
      tsrCases: counts.tsrCases ?? 0,
      lodCases: counts.lodCases ?? 0,
      tsrDocuments: counts.tsrDocuments ?? 0,
      rows: orgs.map((o) => ({
        id: o.id,
        name: o.name ?? "—",
        slug: o.slug ?? "—",
        plan: o.plan ?? "—",
        status: o.status ?? "—",
        accountType: o.account_type ?? null,
        provisionStatus: o.provision_status ?? null,
        seatLimit: o.seat_limit == null ? null : Number(o.seat_limit),
        seatsUsed: seatsByOrg.get(o.id) ?? 0,
        adminEmail: o.admin_email ?? null,
        createdAt: o.created_at ?? null,
      })),
    },

    content: {
      blogTotal: counts.blogTotal ?? 0,
      blogPublished: counts.blogPublished ?? 0,
      blogDraft: counts.blogDraft ?? 0,
      blogScheduled: counts.blogScheduled ?? 0,
      networkProfiles: counts.networkProfiles ?? 0,
      networkPosts: counts.networkPosts ?? 0,
      networkConnections: counts.networkConnections ?? 0,
    },
  };
}

// ── Raw row shapes (only the columns we select) ──────────────────────────────

interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  phone_confirmed_at?: string | null;
}
interface ProfileRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  created_at?: string | null;
  is_verified?: boolean | null;
  is_super_admin?: boolean | null;
}
interface WalletRow {
  user_id: string;
  balance?: number | null;
}
interface TxRow {
  user_id?: string | null;
  delta?: number | null;
  reason?: string | null;
  created_at?: string | null;
}
interface PaymentRow {
  id?: string;
  user_id?: string | null;
  order_id?: string | null;
  amount_inr?: number | null;
  credits_granted?: number | null;
  status?: string | null;
  payment_method?: string | null;
  invoice_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  created_at?: string | null;
  paid_at?: string | null;
}
interface TokenRow {
  mode?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  created_at?: string | null;
}
interface OrgTableRow {
  id: string;
  name?: string | null;
  slug?: string | null;
  plan?: string | null;
  status?: string | null;
  account_type?: string | null;
  provision_status?: string | null;
  seat_limit?: number | null;
  admin_email?: string | null;
  created_at?: string | null;
}
interface MemberRow {
  org_id?: string | null;
  user_id?: string | null;
  status?: string | null;
}
interface ChatSessionRow {
  id: string;
  user_id?: string | null;
  title?: string | null;
  created_at?: string | null;
  last_active_at?: string | null;
  updated_at?: string | null;
}
