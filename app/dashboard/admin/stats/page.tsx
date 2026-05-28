// Admin analytics dashboard — single server component that fans out parallel
// Supabase reads for every public table the app touches, computes "today /
// week / total" deltas, and renders it as a one-page snapshot of the
// product's state. Admin-only via user_metadata.role check (same gate as
// /dashboard/blog/admin).

import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Wallet,
  Pin,
  Archive,
  TrendingUp,
  Calendar,
  Eye,
} from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin stats | LexRam",
};

// Server component — always pull fresh numbers, never serve a cached snapshot
// that would mislead the admin into thinking the system is quieter than it is.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Helpers ──────────────────────────────────────────────────────────────
function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function startOfWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function fmtInt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("en-IN");
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtINR(paise: number | null | undefined): string {
  if (!paise) return "₹0";
  // payments table may store amount in paise or rupees — heuristic: > 9999 ⇒ paise.
  const rupees = paise > 9999 ? paise / 100 : paise;
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

interface PaymentRow {
  id?: string;
  user_id?: string;
  order_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  created_at?: string;
}
interface ProfileRow {
  id?: string;
  email?: string;
  full_name?: string;
  display_name?: string;
  role?: string;
  created_at?: string;
}
interface SessionRow {
  id?: string;
  user_id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

export default async function AdminStatsPage() {
  const sb = await createSupabaseServerClient();

  // ── Auth gate ─────────────────────────────────────────────────────────
  const { data: userData } = await sb.auth.getUser();
  const role = (userData.user?.user_metadata as { role?: string } | null)?.role;
  if (role !== "admin") redirect("/dashboard");

  const today = startOfToday();
  const week = startOfWeek();

  // ── Fan out every query in parallel ───────────────────────────────────
  // Each query is allowed to fail (a missing table or RLS denial shouldn't
  // tank the whole dashboard); we read `count`/`data` and tolerate `null`s.
  const [
    profilesTotal,
    profilesToday,
    profilesWeek,
    recentProfiles,
    sessionsTotal,
    sessionsToday,
    sessionsWeek,
    recentSessions,
    blogTotal,
    blogPublished,
    blogDraft,
    blogScheduled,
    blogTopViewed,
    pinnedCount,
    archivedCount,
    feedbackUp,
    feedbackDown,
    paymentsAll,
    recentPayments,
  ] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", today),
    sb.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", week),
    sb.from("profiles").select("*").order("created_at", { ascending: false }).limit(10),

    sb.from("chat_sessions").select("id", { count: "exact", head: true }),
    sb.from("chat_sessions").select("id", { count: "exact", head: true }).gte("created_at", today),
    sb.from("chat_sessions").select("id", { count: "exact", head: true }).gte("created_at", week),
    sb.from("chat_sessions").select("id, title, user_id, created_at, updated_at").order("updated_at", { ascending: false }).limit(10),

    sb.from("blog_posts").select("id", { count: "exact", head: true }),
    sb.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    sb.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    sb.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
    sb.from("blog_posts").select("title, slug, view_count, status, published_at").order("view_count", { ascending: false }).limit(5),

    sb.from("pinned_sessions").select("session_id", { count: "exact", head: true }),
    sb.from("archived_sessions").select("session_id", { count: "exact", head: true }),

    sb.from("message_feedback").select("rating", { count: "exact", head: true }).eq("rating", "up"),
    sb.from("message_feedback").select("rating", { count: "exact", head: true }).eq("rating", "down"),

    sb.from("payments").select("status, amount, created_at"),
    sb.from("payments").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  // ── Derive payment aggregates client-side (Supabase free tier has no
  //    SQL aggregate function exposed via PostgREST without an RPC). ────
  const payments = (paymentsAll.data as PaymentRow[] | null) ?? [];
  const paymentsCount = payments.length;
  const paymentsByStatus = payments.reduce<Record<string, number>>((acc, p) => {
    const s = (p.status ?? "unknown").toLowerCase();
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const revenueSuccessful = payments
    .filter((p) => ["success", "paid", "completed"].includes((p.status ?? "").toLowerCase()))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalFeedback = (feedbackUp.count ?? 0) + (feedbackDown.count ?? 0);
  const positiveRate = totalFeedback === 0 ? 0 : Math.round(((feedbackUp.count ?? 0) / totalFeedback) * 100);

  return (
    <div className="h-full overflow-y-auto bg-[var(--lex-cream)]" style={{ background: "var(--lex-gradient-hero)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--lex-maroon)] transition-colors">
              ← Dashboard
            </Link>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--lex-maroon)] tracking-tight mt-1">
              Admin overview
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Live snapshot of every Supabase table. Updated each request.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Calendar className="w-3.5 h-3.5" />
            <span>As of {fmtDate(new Date().toISOString())}</span>
          </div>
        </header>

        {/* ── Hero: new signups, top of the page ─────────────────────
            Moved out of the secondary grid so the freshest user activity
            sits first — admins land on this page to see "who joined" and
            shouldn't have to scroll past KPI tiles to find them. The two
            today/week pill counts up front give the size of the cohort
            without making the admin do mental arithmetic. */}
        <section>
          <div className="rounded-2xl bg-white border border-[var(--border-default)] shadow-[var(--lex-shadow-soft)] overflow-hidden lex-animate-fade-up">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border-light)] bg-[var(--lex-cream-soft)]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--lex-maroon)]" />
                <h2 className="font-serif text-lg font-bold text-[var(--lex-maroon)]">New signups</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--lex-rust-soft)] text-[var(--lex-rust)] border border-[var(--lex-rust)]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--lex-rust)]" />
                  {fmtInt(profilesToday.count)} today
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--lex-cream-deep)] text-[var(--lex-maroon)] border border-[var(--lex-maroon)]/20">
                  {fmtInt(profilesWeek.count)} this week
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--lex-cream-soft)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                  {fmtInt(profilesTotal.count)} total
                </span>
              </div>
            </div>
            {recentProfiles.error ? (
              <ErrorRow msg={recentProfiles.error.message} />
            ) : (
              <Table
                headers={["User", "Role", "Joined"]}
                rows={((recentProfiles.data ?? []) as ProfileRow[]).map((p) => [
                  <div key="user" className="flex flex-col">
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {p.full_name ?? p.display_name ?? p.email ?? p.id ?? "—"}
                    </span>
                    {p.email && (p.full_name || p.display_name) && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate">{p.email}</span>
                    )}
                  </div>,
                  <Badge key="role" tone={p.role === "admin" ? "rust" : "muted"}>
                    {p.role ?? "user"}
                  </Badge>,
                  fmtDate(p.created_at),
                ])}
                emptyHint="No signups recorded yet."
              />
            )}
          </div>
        </section>

        {/* ── KPI cards — six tiles across, wraps on smaller widths ── */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Kpi icon={<Users className="w-4 h-4" />} label="Users today" value={fmtInt(profilesToday.count)} sub={`${fmtInt(profilesWeek.count)} this week`} accent="maroon" />
          <Kpi icon={<Users className="w-4 h-4" />} label="Total users" value={fmtInt(profilesTotal.count)} sub="Lifetime signups" />
          <Kpi icon={<MessageSquare className="w-4 h-4" />} label="Sessions today" value={fmtInt(sessionsToday.count)} sub={`${fmtInt(sessionsWeek.count)} this week`} accent="rust" />
          <Kpi icon={<MessageSquare className="w-4 h-4" />} label="Total sessions" value={fmtInt(sessionsTotal.count)} sub="Lifetime research threads" />
          <Kpi icon={<FileText className="w-4 h-4" />} label="Blog posts" value={fmtInt(blogTotal.count)} sub={`${fmtInt(blogPublished.count)} live · ${fmtInt(blogDraft.count)} draft`} />
          <Kpi icon={<Wallet className="w-4 h-4" />} label="Revenue (success)" value={fmtINR(revenueSuccessful)} sub={`${fmtInt(paymentsCount)} total orders`} accent="maroon" />
        </section>

        {/* ── Secondary KPI row — engagement signals ──────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={<ThumbsUp className="w-4 h-4" />} label="Positive feedback" value={fmtInt(feedbackUp.count)} sub={`${positiveRate}% positive rate`} />
          <Kpi icon={<ThumbsDown className="w-4 h-4" />} label="Negative feedback" value={fmtInt(feedbackDown.count)} sub={`${fmtInt(totalFeedback)} total votes`} />
          <Kpi icon={<Pin className="w-4 h-4" />} label="Pinned sessions" value={fmtInt(pinnedCount.count)} sub="Across all users" />
          <Kpi icon={<Archive className="w-4 h-4" />} label="Archived sessions" value={fmtInt(archivedCount.count)} sub="Hidden but not deleted" />
        </section>

        {/* ── Recent research threads (signups moved up to hero) ─── */}
        <section>
          <Card title="Latest research threads" icon={<MessageSquare className="w-4 h-4" />}>
            {recentSessions.error ? (
              <ErrorRow msg={recentSessions.error.message} />
            ) : (
              <Table
                headers={["Title", "Updated"]}
                rows={((recentSessions.data ?? []) as SessionRow[]).map((s) => [
                  <span key="title" className="font-medium text-[var(--text-primary)] truncate block">
                    {s.title || "Untitled"}
                  </span>,
                  fmtDate(s.updated_at ?? s.created_at),
                ])}
                emptyHint="No sessions yet."
              />
            )}
          </Card>
        </section>

        {/* ── Blog stats + payments breakdown ─────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Top blog posts" icon={<TrendingUp className="w-4 h-4" />}>
            {blogTopViewed.error ? (
              <ErrorRow msg={blogTopViewed.error.message} />
            ) : (
              <Table
                headers={["Title", "Status", "Views"]}
                rows={(blogTopViewed.data ?? []).map((b: any) => [
                  b.slug ? (
                    <Link
                      key="title"
                      href={`/dashboard/blog/${b.slug}`}
                      className="font-medium text-[var(--text-primary)] hover:text-[var(--lex-maroon)] truncate block"
                    >
                      {b.title}
                    </Link>
                  ) : (
                    <span key="title">{b.title}</span>
                  ),
                  <Badge key="status" tone={b.status === "published" ? "rust" : "muted"}>
                    {b.status}
                  </Badge>,
                  <span key="views" className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                    <Eye className="w-3 h-3" /> {fmtInt(b.view_count)}
                  </span>,
                ])}
                emptyHint="No published posts yet."
              />
            )}
            <div className="px-4 pt-3 mt-3 border-t border-[var(--border-light)] grid grid-cols-3 gap-2 text-center">
              <Mini label="Published" value={fmtInt(blogPublished.count)} />
              <Mini label="Drafts" value={fmtInt(blogDraft.count)} />
              <Mini label="Scheduled" value={fmtInt(blogScheduled.count)} />
            </div>
          </Card>

          <Card title="Payments breakdown" icon={<Wallet className="w-4 h-4" />}>
            {paymentsAll.error ? (
              <ErrorRow msg={paymentsAll.error.message} />
            ) : Object.keys(paymentsByStatus).length === 0 ? (
              <p className="px-4 py-6 text-sm text-[var(--text-muted)] text-center">No payments recorded yet.</p>
            ) : (
              <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(paymentsByStatus).map(([status, count]) => (
                  <Mini key={status} label={status} value={fmtInt(count)} />
                ))}
              </div>
            )}
            {((recentPayments.data ?? []) as PaymentRow[]).length > 0 && (
              <Table
                headers={["Order", "Status", "Amount", "Created"]}
                rows={((recentPayments.data ?? []) as PaymentRow[]).map((p) => [
                  <span key="order" className="font-mono text-[11px] text-[var(--text-secondary)] truncate block">
                    {p.order_id ?? p.id ?? "—"}
                  </span>,
                  <Badge
                    key="status"
                    tone={["success", "paid", "completed"].includes((p.status ?? "").toLowerCase()) ? "rust" : "muted"}
                  >
                    {p.status ?? "—"}
                  </Badge>,
                  fmtINR(p.amount),
                  fmtDate(p.created_at),
                ])}
                emptyHint=""
              />
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}

// ── Presentational primitives ──────────────────────────────────────────
function Kpi({
  icon,
  label,
  value,
  sub,
  accent = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: "default" | "maroon" | "rust";
}) {
  const accentClass =
    accent === "maroon"
      ? "text-[var(--lex-maroon)]"
      : accent === "rust"
      ? "text-[var(--lex-rust)]"
      : "text-[var(--text-secondary)]";
  return (
    <div className="rounded-2xl bg-white border border-[var(--border-default)] shadow-[var(--lex-shadow-soft)] p-4 lex-animate-fade-up">
      <div className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${accentClass}`}>
        {icon}
        <span className="text-[var(--text-muted)]">{label}</span>
      </div>
      <div className="mt-2 font-serif text-2xl font-bold text-[var(--text-primary)] tracking-tight">{value}</div>
      <div className="text-[11px] text-[var(--text-muted)] mt-1">{sub}</div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-[var(--border-default)] shadow-[var(--lex-shadow-soft)] overflow-hidden lex-animate-fade-up">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-light)] bg-[var(--lex-cream-soft)]">
        <span className="text-[var(--lex-maroon)]">{icon}</span>
        <h2 className="font-serif text-base font-bold text-[var(--lex-maroon)]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Table({
  headers,
  rows,
  emptyHint,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyHint: string;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-6 text-sm text-[var(--text-muted)] text-center">{emptyHint}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] border-b border-[var(--border-light)]">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--border-light)] last:border-b-0 hover:bg-[var(--lex-cream-soft)] transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-[var(--text-secondary)] align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ tone, children }: { tone: "rust" | "maroon" | "muted"; children: React.ReactNode }) {
  const cls =
    tone === "rust"
      ? "bg-[var(--lex-rust-soft)] text-[var(--lex-rust)] border border-[var(--lex-rust)]/30"
      : tone === "maroon"
      ? "bg-[var(--lex-maroon-soft)] text-[var(--lex-maroon)] border border-[var(--lex-maroon)]/30"
      : "bg-[var(--lex-cream-deep)] text-[var(--text-secondary)] border border-[var(--border-default)]";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--lex-cream-soft)] border border-[var(--border-light)] px-3 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</div>
      <div className="font-serif text-lg font-bold text-[var(--lex-maroon)] mt-0.5">{value}</div>
    </div>
  );
}

function ErrorRow({ msg }: { msg: string }) {
  return (
    <p className="px-4 py-6 text-xs text-red-600 bg-red-50 m-3 rounded-lg border border-red-200">
      Query failed: {msg}
    </p>
  );
}
