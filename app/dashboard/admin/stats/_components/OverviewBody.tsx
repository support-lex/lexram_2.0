// The admin overview's presentation layer.
//
// Split out from page.tsx so the route file holds only the auth gate and the
// data load. Keeping the body a pure function of `data` means it can be rendered
// anywhere the snapshot is available, and it keeps the gate small enough to audit
// at a glance — the thing you least want buried under 300 lines of JSX.

import Link from "next/link";
import {
  Users,
  UserPlus,
  Activity,
  Wallet,
  IndianRupee,
  Clock,
  TrendingDown,
  MessageSquare,
  Cpu,
  Building2,
  FileText,
  ThumbsUp,
  AlertTriangle,
  ShieldCheck,
  Coins,
  BadgeCheck,
  Network,
} from "lucide-react";

import type { AdminOverview } from "../_lib/overview";
import TrendChart from "./TrendChart";
import UsersPanel from "./UsersPanel";
import TopUpsPanel from "./TopUpsPanel";
import {
  Badge,
  Card,
  Hero,
  Kpi,
  Meter,
  Mini,
  SectionHeading,
  Table,
  fmtCompact,
  fmtDateTime,
  fmtINR,
  fmtInt,
  statusTone,
} from "./ui";

export default function OverviewBody({
  data,
  sevenDaysAgo,
}: {
  data: AdminOverview;
  sevenDaysAgo: string;
}) {
  const { users, money, credits, usage, orgs, content } = data;
  const evalPassPct = usage.evalTotal ? (usage.evalPassed / usage.evalTotal) * 100 : 0;
  const totalVotes = usage.feedbackUp + usage.feedbackDown;

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-primary)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/dashboard"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight mt-1">
              Admin overview
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Live read of every table this product writes to. Dates and daily buckets are IST.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            <span className="tabular-nums">As of {fmtDateTime(data.generatedAt)}</span>
          </div>
        </header>

        {/* Failed reads are stated, never swallowed — a zero you can't
            distinguish from a broken query is worse than no number. */}
        {data.warnings.length > 0 && (
          <div className="rounded-xl border border-[#fab219]/45 bg-[#fab219]/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8a5d00]">
              <AlertTriangle className="w-3.5 h-3.5" />
              {data.warnings.length} source{data.warnings.length > 1 ? "s" : ""} could not be read — the tiles below
              exclude {data.warnings.length > 1 ? "them" : "it"}
            </div>
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-[#8a5d00]/90">
              {data.warnings.map((w) => (
                <li key={w} className="font-mono">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Hero + headline KPIs ───────────────────────────────────────── */}
        <Card padded>
          <Hero
            label="Registered users"
            value={fmtInt(users.total)}
            sub={`${fmtInt(users.newToday)} joined today · ${fmtInt(users.new7d)} this week · ${fmtInt(
              users.activeToday
            )} signed in today`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              <Mini label="Active 7d" value={fmtInt(users.active7d)} />
              <Mini label="Active 30d" value={fmtInt(users.active30d)} />
              <Mini label="Verified" value={fmtInt(users.verified)} />
              <Mini label="Never signed in" value={fmtInt(users.neverSignedIn)} />
            </div>
          </Hero>
        </Card>

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Kpi
            icon={<IndianRupee className="w-3.5 h-3.5" />}
            label="Revenue collected"
            value={fmtINR(money.revenueInr)}
            sub={`${fmtInt(money.paidOrders)} paid orders`}
            emphasis
          />
          <Kpi
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Pending checkouts"
            value={fmtINR(money.pendingValueInr)}
            sub={`${fmtInt(money.pendingOrders)} never completed`}
          />
          <Kpi
            icon={<Coins className="w-3.5 h-3.5" />}
            label="Credits sold"
            value={fmtInt(money.creditsSold)}
            sub={`avg order ${fmtINR(money.avgOrderInr)}`}
          />
          <Kpi
            icon={<Wallet className="w-3.5 h-3.5" />}
            label="Credits outstanding"
            value={fmtInt(credits.outstanding)}
            sub={`${fmtInt(credits.walletCount)} wallets`}
          />
          <Kpi
            icon={<MessageSquare className="w-3.5 h-3.5" />}
            label="Research sessions"
            value={fmtInt(usage.sessionsTotal)}
            sub={`${fmtInt(usage.sessionsToday)} today · ${fmtInt(usage.sessions7d)} this week`}
          />
          <Kpi
            icon={<Cpu className="w-3.5 h-3.5" />}
            label="Tokens consumed"
            value={fmtCompact(usage.tokensTotal)}
            sub={`${fmtCompact(usage.tokensIn)} in · ${fmtCompact(usage.tokensOut)} out`}
          />
        </section>

        {/* ── Signups ────────────────────────────────────────────────────── */}
        <SectionHeading
          title="Users & signups"
          icon={<Users className="w-4 h-4" />}
          hint="Merged from auth.users (sign-in activity) and public.profiles (identity), so phone-only accounts are counted too."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card title="New signups per day" hint="Last 30 days, IST" icon={<UserPlus className="w-4 h-4" />}>
              <TrendChart
                points={users.signupSeries}
                format="int"
                unit="signup"
                valueLabel="Signups"
                emptyHint="No signups in the last 30 days."
              />
            </Card>
          </div>

          <Card title="Signup & activation" icon={<BadgeCheck className="w-4 h-4" />} padded>
            <div className="space-y-4">
              <Meter
                label="Phone verified"
                pct={users.total ? (users.verified / users.total) * 100 : 0}
                caption={`${fmtInt(users.verified)} of ${fmtInt(users.total)} accounts completed OTP verification`}
              />
              <Meter
                label="Ever signed in"
                pct={users.total ? ((users.total - users.neverSignedIn) / users.total) * 100 : 0}
                caption={`${fmtInt(users.neverSignedIn)} accounts registered but never signed in`}
              />
              <Meter
                label="Active in last 30 days"
                pct={users.total ? (users.active30d / users.total) * 100 : 0}
                caption={`${fmtInt(users.active30d)} of ${fmtInt(users.total)} signed in this month`}
              />
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Mini label="Today" value={fmtInt(users.newToday)} />
                <Mini label="7 days" value={fmtInt(users.new7d)} />
                <Mini label="30 days" value={fmtInt(users.new30d)} />
              </div>
            </div>
          </Card>
        </div>

        <Card
          title="User directory"
          hint="Search, segment and sort every registered account"
          icon={<Users className="w-4 h-4" />}
        >
          <UsersPanel rows={users.rows} sevenDaysAgo={sevenDaysAgo} />
        </Card>

        {/* ── Top-ups ────────────────────────────────────────────────────── */}
        <SectionHeading
          title="Top-ups & revenue"
          icon={<IndianRupee className="w-4 h-4" />}
          hint="public.payments is the Cashfree order ledger — a 'pending' row is an abandoned checkout, so it is reported separately from revenue rather than added to it."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card
              title="Revenue collected per day"
              hint="Last 30 days, dated by payment capture (IST)"
              icon={<IndianRupee className="w-4 h-4" />}
            >
              <TrendChart
                points={money.revenueSeries}
                format="inr"
                valueLabel="Revenue"
                emptyHint="No payments captured in the last 30 days."
              />
            </Card>
          </div>

          <Card title="Checkout funnel" icon={<TrendingDown className="w-4 h-4" />} padded>
            <div className="space-y-4">
              <Meter
                label="Orders that completed payment"
                pct={money.conversionPct}
                caption={`${fmtInt(money.paidOrders)} paid, ${fmtInt(money.pendingOrders)} abandoned, ${fmtInt(
                  money.failedOrders
                )} failed`}
              />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-2">
                  By status
                </div>
                <Table
                  headers={["Status", "Orders", "Value"]}
                  align={["left", "right", "right"]}
                  rows={money.byStatus.map((s) => [
                    <Badge key="s" tone={statusTone(s.status)}>
                      {s.status}
                    </Badge>,
                    fmtInt(s.count),
                    fmtINR(s.valueInr),
                  ])}
                  empty="No orders recorded."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Mini label="30-day revenue" value={fmtINR(money.revenue30dInr)} />
                <Mini label="Avg order" value={fmtINR(money.avgOrderInr)} />
              </div>
            </div>
          </Card>
        </div>

        <Card
          title="Top-up history"
          hint="Every credit purchase order, newest first"
          icon={<Wallet className="w-4 h-4" />}
        >
          <TopUpsPanel rows={money.topUps} />
        </Card>

        {/* ── Credits ────────────────────────────────────────────────────── */}
        <SectionHeading
          title="Credit ledger"
          icon={<Coins className="w-4 h-4" />}
          hint="Every grant and deduction in public.credit_transactions, summed over the full table."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card title="Credits consumed per day" hint="Last 30 days, IST" icon={<TrendingDown className="w-4 h-4" />}>
              <TrendChart
                points={credits.burnSeries}
                format="int"
                unit="credit"
                valueLabel="Credits spent"
                emptyHint="No credits consumed in the last 30 days."
              />
            </Card>
          </div>

          <Card title="Where credits come from and go" icon={<Activity className="w-4 h-4" />} padded>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Mini label="Granted" value={fmtInt(credits.granted)} />
              <Mini label="Spent" value={fmtInt(credits.spent)} />
            </div>
            <Table
              headers={["Reason", "Events", "Net credits"]}
              align={["left", "right", "right"]}
              rows={credits.byReason.map((r) => [
                <span key="r" className="font-mono text-[11px]">
                  {r.reason}
                </span>,
                fmtInt(r.count),
                <span
                  key="c"
                  className={
                    r.credits < 0 ? "text-[var(--text-secondary)]" : "font-semibold text-[var(--text-primary)]"
                  }
                >
                  {r.credits > 0 ? `+${fmtInt(r.credits)}` : fmtInt(r.credits)}
                </span>,
              ])}
              empty="No credit activity recorded."
            />
          </Card>
        </div>

        {/* ── Usage ──────────────────────────────────────────────────────── */}
        <SectionHeading
          title="Product usage & model spend"
          icon={<Cpu className="w-4 h-4" />}
          hint="Research sessions, documents, token burn and answer-quality evaluations."
        />

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Kpi
            icon={<MessageSquare className="w-3.5 h-3.5" />}
            label="Sessions"
            value={fmtInt(usage.sessionsTotal)}
            sub={`${fmtInt(usage.sessions7d)} this week`}
          />
          <Kpi
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Matters / cases"
            value={fmtInt(usage.casesTotal)}
            sub="Excluding deleted"
          />
          <Kpi
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Documents"
            value={fmtInt(usage.documentsTotal)}
            sub="Uploaded & indexed"
          />
          <Kpi icon={<Cpu className="w-3.5 h-3.5" />} label="Tokens in" value={fmtCompact(usage.tokensIn)} sub="Prompt tokens" />
          <Kpi
            icon={<Cpu className="w-3.5 h-3.5" />}
            label="Tokens out"
            value={fmtCompact(usage.tokensOut)}
            sub="Completion tokens"
          />
          <Kpi
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            label="Eval pass rate"
            value={`${Math.round(evalPassPct)}%`}
            sub={`${fmtInt(usage.evalPassed)} of ${fmtInt(usage.evalTotal)} runs`}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card title="Tokens consumed per day" hint="Last 30 days, IST" icon={<Cpu className="w-4 h-4" />}>
              <TrendChart
                points={usage.tokenSeries}
                format="compact"
                unit="token"
                valueLabel="Tokens"
                emptyHint="No model calls in the last 30 days."
              />
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="By research mode" icon={<Activity className="w-4 h-4" />}>
              <Table
                headers={["Mode", "Calls", "Tokens"]}
                align={["left", "right", "right"]}
                rows={usage.tokensByMode.map((m) => [
                  <span key="m" className="font-medium text-[var(--text-primary)] capitalize">
                    {m.mode}
                  </span>,
                  fmtInt(m.calls),
                  fmtCompact(m.tokens),
                ])}
                empty="No token usage recorded."
              />
            </Card>

            <Card title="Answer feedback" icon={<ThumbsUp className="w-4 h-4" />} padded>
              <Meter
                label="Positive"
                pct={totalVotes ? (usage.feedbackUp / totalVotes) * 100 : 0}
                caption={`${fmtInt(usage.feedbackUp)} up · ${fmtInt(usage.feedbackDown)} down · ${fmtInt(
                  totalVotes
                )} votes total`}
              />
            </Card>
          </div>
        </div>

        <Card title="Latest research sessions" icon={<MessageSquare className="w-4 h-4" />}>
          <Table
            headers={["Title", "User", "Last active"]}
            rows={usage.recentSessions.map((s) => [
              <span key="t" className="font-medium text-[var(--text-primary)] truncate block max-w-[420px]">
                {s.title}
              </span>,
              s.userLabel,
              fmtDateTime(s.lastActive),
            ])}
            empty="No sessions yet."
          />
        </Card>

        {/* ── Orgs & TSR ─────────────────────────────────────────────────── */}
        <SectionHeading
          title="Organisations & TSR"
          icon={<Building2 className="w-4 h-4" />}
          hint="Tenants, seats and scrutiny-report volume."
        />

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Kpi
            icon={<Building2 className="w-3.5 h-3.5" />}
            label="Organisations"
            value={fmtInt(orgs.total)}
            sub={`${fmtInt(orgs.active)} active`}
          />
          <Kpi icon={<Users className="w-3.5 h-3.5" />} label="Seats used" value={fmtInt(orgs.members)} sub="Active memberships" />
          <Kpi
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Pending org requests"
            value={fmtInt(orgs.pendingRequests)}
            sub="Awaiting review"
            emphasis={orgs.pendingRequests > 0}
          />
          <Kpi
            icon={<FileText className="w-3.5 h-3.5" />}
            label="TSR cases"
            value={fmtInt(orgs.tsrCases)}
            sub={`${fmtInt(orgs.tsrDocuments)} documents`}
          />
          <Kpi icon={<FileText className="w-3.5 h-3.5" />} label="LOD cases" value={fmtInt(orgs.lodCases)} sub="List of documents" />
          <Kpi
            icon={<Network className="w-3.5 h-3.5" />}
            label="Network profiles"
            value={fmtInt(content.networkProfiles)}
            sub={`${fmtInt(content.networkConnections)} connections`}
          />
        </section>

        <Card title="Organisations" icon={<Building2 className="w-4 h-4" />}>
          <Table
            headers={["Organisation", "Plan", "Type", "Seats", "Provisioning", "Created", "Status"]}
            align={["left", "left", "left", "right", "left", "left", "left"]}
            rows={orgs.rows.map((o) => [
              <div key="n" className="min-w-0">
                <div className="font-medium text-[var(--text-primary)] truncate">{o.name}</div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">{o.adminEmail ?? o.slug}</div>
              </div>,
              <span key="p" className="capitalize">
                {o.plan}
              </span>,
              <span key="t" className="capitalize">
                {o.accountType ?? "—"}
              </span>,
              `${fmtInt(o.seatsUsed)}${o.seatLimit ? ` / ${fmtInt(o.seatLimit)}` : ""}`,
              o.provisionStatus ? (
                <Badge key="pr" tone={statusTone(o.provisionStatus)}>
                  {o.provisionStatus}
                </Badge>
              ) : (
                "—"
              ),
              fmtDateTime(o.createdAt),
              <Badge key="s" tone={statusTone(o.status)}>
                {o.status}
              </Badge>,
            ])}
            empty="No organisations yet."
          />
        </Card>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <SectionHeading title="Content" icon={<FileText className="w-4 h-4" />} hint="Blog and network activity." />
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Kpi icon={<FileText className="w-3.5 h-3.5" />} label="Blog posts" value={fmtInt(content.blogTotal)} sub="All statuses" />
          <Kpi icon={<FileText className="w-3.5 h-3.5" />} label="Published" value={fmtInt(content.blogPublished)} sub="Live on site" />
          <Kpi icon={<FileText className="w-3.5 h-3.5" />} label="Drafts" value={fmtInt(content.blogDraft)} sub="Unpublished" />
          <Kpi icon={<Clock className="w-3.5 h-3.5" />} label="Scheduled" value={fmtInt(content.blogScheduled)} sub="Queued to publish" />
          <Kpi icon={<Network className="w-3.5 h-3.5" />} label="Network posts" value={fmtInt(content.networkPosts)} sub="Feed activity" />
          <Kpi icon={<Users className="w-3.5 h-3.5" />} label="Connections" value={fmtInt(content.networkConnections)} sub="Accepted" />
        </section>

        <p className="text-[11px] text-[var(--text-muted)] pt-2 pb-6">
          Read-only. Credit grants, refunds and status changes are not editable from this page.
        </p>
      </div>
    </div>
  );
}
