"use client";

// The admin dashboard shell: one date range, six tabs, one screen of content at a time.
//
// This replaces a single ~500-line scroll that stacked seven sections, forty-odd KPI tiles
// and five tables on top of each other. Three things were wrong with it: nothing could be
// filtered (every tile hard-coded its own today/7d/30d window, so no two numbers on the
// page described the same period), everything competed for attention at once, and the same
// figures appeared in several places.
//
// The fix: pick a range once at the top and let every number obey it; split the content
// into tabs so each view answers one question; and put each figure in exactly one place.
// All filtering is client-side over pre-aggregated daily series — the data is small, so
// switching range or tab is instant and never refetches.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Wallet,
  IndianRupee,
  Clock,
  TrendingDown,
  MessageSquare,
  Cpu,
  Building2,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Coins,
  Activity,
  LayoutGrid,
  ThumbsUp,
  Network,
} from "lucide-react";

import type { AdminOverview } from "../_lib/overview";
import TrendChart from "./TrendChart";
import UsersPanel from "./UsersPanel";
import TopUpsPanel from "./TopUpsPanel";
import OrgsPanel from "./OrgsPanel";
import SessionsPanel from "./SessionsPanel";
import { RANGES, type RangeKey, deltaPct, inRange, rangeLabel, sliceSeries, sum } from "./range";
import {
  Card,
  IconChip,
  Kpi,
  Meter,
  Mini,
  Segmented,
  Table,
  fmtCompact,
  fmtDateTime,
  fmtINR,
  fmtInt,
} from "./ui";

type TabKey = "overview" | "users" | "topups" | "credits" | "usage" | "orgs";

const TABS: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "overview", label: "Overview", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { key: "users", label: "Users", icon: <Users className="w-3.5 h-3.5" /> },
  { key: "topups", label: "Top-ups", icon: <Wallet className="w-3.5 h-3.5" /> },
  { key: "credits", label: "Credits", icon: <Coins className="w-3.5 h-3.5" /> },
  { key: "usage", label: "Usage", icon: <Cpu className="w-3.5 h-3.5" /> },
  { key: "orgs", label: "Organisations", icon: <Building2 className="w-3.5 h-3.5" /> },
];

export default function DashboardShell({ data }: { data: AdminOverview }) {
  const [range, setRange] = useState<RangeKey>("30d");
  const [tab, setTab] = useState<TabKey>("overview");

  const { series, users, money, credits, usage, orgs, content } = data;

  // Every headline figure for the chosen window, derived once and shared by the tabs.
  const m = useMemo(() => {
    const cut = (k: keyof typeof series) => sliceSeries(series[k], range);
    return {
      signups: cut("signups"),
      revenue: cut("revenue"),
      orders: cut("orders"),
      paidOrders: cut("paidOrders"),
      creditsGranted: cut("creditsGranted"),
      creditsSpent: cut("creditsSpent"),
      sessions: cut("sessions"),
      tokens: cut("tokens"),
    };
  }, [series, range]);

  const label = rangeLabel(range).toLowerCase();
  const inWindow = (iso: string | null | undefined) => inRange(iso, range);

  const newUsers = sum(m.signups);
  const activeUsers = users.rows.filter((u) => inWindow(u.lastSeen)).length;
  const revenue = sum(m.revenue);
  const paidCount = sum(m.paidOrders);
  const orderCount = sum(m.orders);
  const spent = sum(m.creditsSpent);
  const granted = sum(m.creditsGranted);
  const sessionCount = sum(m.sessions);
  const tokenCount = sum(m.tokens);
  const conversion = orderCount ? Math.round((paidCount / orderCount) * 100) : 0;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        backgroundColor: "var(--bg-primary)",
        // A flat --bg-primary is why the page read as one shade of cream front to
        // back — this radial wash is the same treatment the marketing pages use
        // for depth. Defined with an explicit fallback: the token only exists in
        // the Classic theme, so other themes just keep the flat colour above.
        backgroundImage: "var(--lex-gradient-hero, none)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Header: title, range, tabs. Everything below obeys this range. ── */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconChip icon={<LayoutGrid className="w-5 h-5" />} tone="solid" size="lg" />
            <div>
              <Link
                href="/dashboard"
                className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] hover:text-[var(--lex-maroon)] transition-colors"
              >
                ← Dashboard
              </Link>
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
                Admin overview
              </h1>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Segmented
              options={RANGES.map((r) => ({ key: r.key, label: r.label }))}
              value={range}
              onChange={setRange}
              ariaLabel="Date range"
            />
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--text-muted)] tabular-nums">
              <Clock className="w-3 h-3" />
              As of {fmtDateTime(data.generatedAt)} IST
            </span>
          </div>
        </header>

        {data.warnings.length > 0 && (
          <div className="rounded-2xl border border-[#fab219]/45 bg-[#fab219]/12 px-4 py-3 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8a5d00]">
              <AlertTriangle className="w-3.5 h-3.5" />
              {data.warnings.length} source{data.warnings.length > 1 ? "s" : ""} could not be read — figures
              below exclude {data.warnings.length > 1 ? "them" : "it"}
            </div>
            <ul className="mt-1 space-y-0.5 text-[11px] font-mono text-[#8a5d00]/90">
              {data.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Tab bar: a filled pill nav, not an underline — the underline version
            reduced to a thin coloured rule that barely registered against the
            rest of the page at a glance. ────────────────────────────────────── */}
        <nav
          className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 shadow-[var(--shadow-md)]"
          aria-label="Dashboard sections"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                tab === t.key
                  ? "bg-[var(--lex-maroon)] text-[var(--accent-text)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--text-muted)]/10 hover:text-[var(--text-primary)]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* ── Overview: the six numbers that matter, and two trends ───────── */}
        {tab === "overview" && (
          <div className="space-y-4">
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <Kpi
                icon={<UserPlus className="w-3.5 h-3.5" />}
                label="New signups"
                value={fmtInt(newUsers)}
                sub={`${fmtInt(users.total)} registered in total`}
                delta={deltaPct(series.signups, range)}
                emphasis
              />
              {/* No delta here on purpose. auth.users keeps only the LAST sign-in, so a
                  past window retains only users who never came back — a period-over-period
                  comparison would show a decline every single time regardless of reality.
                  The count is still a valid floor; the trend is not. */}
              <Kpi
                icon={<Activity className="w-3.5 h-3.5" />}
                label="Active users"
                value={fmtInt(activeUsers)}
                sub={`last sign-in within the ${label}`}
              />
              <Kpi
                icon={<IndianRupee className="w-3.5 h-3.5" />}
                label="Revenue"
                value={fmtINR(revenue)}
                sub={`${fmtInt(paidCount)} paid order${paidCount === 1 ? "" : "s"}`}
                delta={deltaPct(series.revenue, range)}
                emphasis
              />
              <Kpi
                icon={<Coins className="w-3.5 h-3.5" />}
                label="Credits spent"
                value={fmtInt(spent)}
                sub={`${fmtInt(granted)} granted`}
                delta={deltaPct(series.creditsSpent, range)}
              />
              <Kpi
                icon={<MessageSquare className="w-3.5 h-3.5" />}
                label="Research sessions"
                value={fmtInt(sessionCount)}
                sub={`${fmtInt(usage.sessionsTotal)} lifetime`}
                delta={deltaPct(series.sessions, range)}
              />
              <Kpi
                icon={<Cpu className="w-3.5 h-3.5" />}
                label="Tokens"
                value={fmtCompact(tokenCount)}
                sub={`${fmtCompact(usage.tokensTotal)} lifetime`}
                delta={deltaPct(series.tokens, range)}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="Signups" hint={`Per day · ${label}`} icon={<UserPlus className="w-4 h-4" />}>
                <TrendChart
                  points={m.signups}
                  format="int"
                  unit="signup"
                  valueLabel="Signups"
                  emptyHint={`No signups in the last ${label}.`}
                />
              </Card>
              <Card title="Revenue" hint={`Per day · ${label}`} icon={<IndianRupee className="w-4 h-4" />}>
                <TrendChart
                  points={m.revenue}
                  format="inr"
                  valueLabel="Revenue"
                  emptyHint={`No payments captured in the last ${label}.`}
                />
              </Card>
            </div>

            {/* Health strip: the three ratios worth watching, and nothing else. */}
            <Card
              title="Health"
              hint={`Conversion follows the ${label}; the account ratios are lifetime`}
              icon={<ShieldCheck className="w-4 h-4" />}
              padded
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Meter
                  label="Checkout conversion"
                  pct={conversion}
                  caption={`${fmtInt(paidCount)} of ${fmtInt(orderCount)} orders paid in the ${label}`}
                />
                <Meter
                  label="Phone verified"
                  pct={users.total ? (users.verified / users.total) * 100 : 0}
                  caption={`${fmtInt(users.verified)} of ${fmtInt(users.total)} accounts`}
                />
                <Meter
                  label="Ever signed in"
                  pct={users.total ? ((users.total - users.neverSignedIn) / users.total) * 100 : 0}
                  caption={`${fmtInt(users.neverSignedIn)} never signed in`}
                />
              </div>
            </Card>

            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <Mini label="Credits outstanding" value={fmtInt(credits.outstanding)} />
              <Mini label="Pending checkouts" value={fmtINR(money.pendingValueInr)} />
              <Mini label="Organisations" value={fmtInt(orgs.total)} />
              <Mini label="TSR cases" value={fmtInt(orgs.tsrCases)} />
              <Mini label="Org requests" value={fmtInt(orgs.pendingRequests)} />
              <Mini label="Blog posts live" value={fmtInt(content.blogPublished)} />
            </section>
          </div>
        )}

        {/* ── Users ───────────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="space-y-4">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi
                icon={<UserPlus className="w-3.5 h-3.5" />}
                label="New signups"
                value={fmtInt(newUsers)}
                sub={`in the ${label}`}
                delta={deltaPct(series.signups, range)}
                emphasis
              />
              <Kpi
                icon={<Activity className="w-3.5 h-3.5" />}
                label="Active users"
                value={fmtInt(activeUsers)}
                sub={`last sign-in within the ${label}`}
              />
              <Kpi icon={<Users className="w-3.5 h-3.5" />} label="Total registered" value={fmtInt(users.total)} sub={`${fmtInt(users.verified)} verified`} />
              <Kpi icon={<Clock className="w-3.5 h-3.5" />} label="Never signed in" value={fmtInt(users.neverSignedIn)} sub="Registered but dormant" />
            </section>

            <Card title="Signups" hint={`Per day · ${label}`} icon={<UserPlus className="w-4 h-4" />}>
              <TrendChart
                points={m.signups}
                format="int"
                unit="signup"
                valueLabel="Signups"
                emptyHint={`No signups in the last ${label}.`}
              />
            </Card>

            <Card title="User directory" hint="Merged from auth.users and public.profiles" icon={<Users className="w-4 h-4" />}>
              <UsersPanel rows={users.rows} range={range} />
            </Card>
          </div>
        )}

        {/* ── Top-ups ─────────────────────────────────────────────────────── */}
        {tab === "topups" && (
          <div className="space-y-4">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi
                icon={<IndianRupee className="w-3.5 h-3.5" />}
                label="Revenue"
                value={fmtINR(revenue)}
                sub={`in the ${label}`}
                delta={deltaPct(series.revenue, range)}
                emphasis
              />
              <Kpi icon={<Wallet className="w-3.5 h-3.5" />} label="Paid orders" value={fmtInt(paidCount)} sub={`of ${fmtInt(orderCount)} raised`} delta={deltaPct(series.paidOrders, range)} />
              <Kpi icon={<TrendingDown className="w-3.5 h-3.5" />} label="Conversion" value={`${conversion}%`} sub="Orders that completed payment" />
              <Kpi icon={<Clock className="w-3.5 h-3.5" />} label="Pending value" value={fmtINR(money.pendingValueInr)} sub={`${fmtInt(money.pendingOrders)} abandoned (lifetime)`} />
            </section>

            <Card title="Revenue" hint={`Per day, dated by payment capture · ${label}`} icon={<IndianRupee className="w-4 h-4" />}>
              <TrendChart
                points={m.revenue}
                format="inr"
                valueLabel="Revenue"
                emptyHint={`No payments captured in the last ${label}.`}
              />
            </Card>

            <Card
              title="Top-up history"
              hint="public.payments is the Cashfree order ledger — a pending row is an abandoned checkout, not a debt"
              icon={<Wallet className="w-4 h-4" />}
            >
              <TopUpsPanel rows={money.topUps} range={range} />
            </Card>
          </div>
        )}

        {/* ── Credits ─────────────────────────────────────────────────────── */}
        {tab === "credits" && (
          <div className="space-y-4">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi icon={<Coins className="w-3.5 h-3.5" />} label="Credits spent" value={fmtInt(spent)} sub={`in the ${label}`} delta={deltaPct(series.creditsSpent, range)} emphasis />
              <Kpi icon={<Coins className="w-3.5 h-3.5" />} label="Credits granted" value={fmtInt(granted)} sub={`in the ${label}`} delta={deltaPct(series.creditsGranted, range)} />
              <Kpi icon={<Wallet className="w-3.5 h-3.5" />} label="Outstanding" value={fmtInt(credits.outstanding)} sub={`across ${fmtInt(credits.walletCount)} wallets`} />
              <Kpi icon={<Activity className="w-3.5 h-3.5" />} label="Net this period" value={fmtInt(granted - spent)} sub={granted >= spent ? "Balance growing" : "Balance drawing down"} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="Credits consumed" hint={`Per day · ${label}`} icon={<TrendingDown className="w-4 h-4" />}>
                <TrendChart points={m.creditsSpent} format="int" unit="credit" valueLabel="Spent" emptyHint={`No credits consumed in the last ${label}.`} />
              </Card>
              <Card title="Credits granted" hint={`Per day · ${label}`} icon={<Coins className="w-4 h-4" />}>
                <TrendChart points={m.creditsGranted} format="int" unit="credit" valueLabel="Granted" emptyHint={`No credits granted in the last ${label}.`} />
              </Card>
            </div>

            <Card title="Where credits come from and go" hint="Lifetime, every row in public.credit_transactions" icon={<Activity className="w-4 h-4" />}>
              <Table
                headers={["Reason", "Events", "Net credits"]}
                align={["left", "right", "right"]}
                rows={credits.byReason.map((r) => [
                  <span key="r" className="font-mono text-[11px]">{r.reason}</span>,
                  fmtInt(r.count),
                  <span key="c" className={r.credits < 0 ? "text-[var(--text-secondary)]" : "font-semibold text-[var(--text-primary)]"}>
                    {r.credits > 0 ? `+${fmtInt(r.credits)}` : fmtInt(r.credits)}
                  </span>,
                ])}
                empty="No credit activity recorded."
              />
            </Card>
          </div>
        )}

        {/* ── Usage ───────────────────────────────────────────────────────── */}
        {tab === "usage" && (
          <div className="space-y-4">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi icon={<MessageSquare className="w-3.5 h-3.5" />} label="Sessions" value={fmtInt(sessionCount)} sub={`in the ${label}`} delta={deltaPct(series.sessions, range)} emphasis />
              <Kpi icon={<Cpu className="w-3.5 h-3.5" />} label="Tokens" value={fmtCompact(tokenCount)} sub={`in the ${label}`} delta={deltaPct(series.tokens, range)} />
              <Kpi
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                label="Eval pass rate"
                value={`${usage.evalTotal ? Math.round((usage.evalPassed / usage.evalTotal) * 100) : 0}%`}
                sub={`${fmtInt(usage.evalPassed)} of ${fmtInt(usage.evalTotal)} runs`}
              />
              <Kpi icon={<FileText className="w-3.5 h-3.5" />} label="Documents" value={fmtInt(usage.documentsTotal)} sub={`${fmtInt(usage.casesTotal)} matters`} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card title="Tokens consumed" hint={`Per day · ${label}`} icon={<Cpu className="w-4 h-4" />}>
                  <TrendChart points={m.tokens} format="compact" unit="token" valueLabel="Tokens" emptyHint={`No model calls in the last ${label}.`} />
                </Card>
              </div>
              <div className="space-y-4">
                <Card title="By research mode" hint="Lifetime" icon={<Activity className="w-4 h-4" />}>
                  <Table
                    headers={["Mode", "Calls", "Tokens"]}
                    align={["left", "right", "right"]}
                    rows={usage.tokensByMode.map((x) => [
                      <span key="m" className="font-medium text-[var(--text-primary)] capitalize">{x.mode}</span>,
                      fmtInt(x.calls),
                      fmtCompact(x.tokens),
                    ])}
                    empty="No token usage recorded."
                  />
                </Card>
                <Card title="Answer feedback" icon={<ThumbsUp className="w-4 h-4" />} padded>
                  <Meter
                    label="Positive"
                    pct={usage.feedbackUp + usage.feedbackDown ? (usage.feedbackUp / (usage.feedbackUp + usage.feedbackDown)) * 100 : 0}
                    caption={`${fmtInt(usage.feedbackUp)} up · ${fmtInt(usage.feedbackDown)} down`}
                  />
                </Card>
              </div>
            </div>

            <Card title="Recent research sessions" icon={<MessageSquare className="w-4 h-4" />}>
              <SessionsPanel rows={usage.recentSessions} range={range} />
            </Card>
          </div>
        )}

        {/* ── Organisations ───────────────────────────────────────────────── */}
        {tab === "orgs" && (
          <div className="space-y-4">
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <Kpi icon={<Building2 className="w-3.5 h-3.5" />} label="Organisations" value={fmtInt(orgs.total)} sub={`${fmtInt(orgs.active)} active`} emphasis />
              <Kpi icon={<Users className="w-3.5 h-3.5" />} label="Seats used" value={fmtInt(orgs.members)} sub="Active memberships" />
              <Kpi icon={<Clock className="w-3.5 h-3.5" />} label="Pending requests" value={fmtInt(orgs.pendingRequests)} sub="Awaiting review" emphasis={orgs.pendingRequests > 0} />
              <Kpi icon={<FileText className="w-3.5 h-3.5" />} label="TSR cases" value={fmtInt(orgs.tsrCases)} sub={`${fmtInt(orgs.tsrDocuments)} documents`} />
              <Kpi icon={<FileText className="w-3.5 h-3.5" />} label="LOD cases" value={fmtInt(orgs.lodCases)} sub="List of documents" />
              <Kpi icon={<Network className="w-3.5 h-3.5" />} label="Network profiles" value={fmtInt(content.networkProfiles)} sub={`${fmtInt(content.networkConnections)} connections`} />
            </section>

            <Card title="Organisations" hint="Search and filter every tenant" icon={<Building2 className="w-4 h-4" />}>
              <OrgsPanel rows={orgs.rows} />
            </Card>
          </div>
        )}

        <p className="text-[11px] text-[var(--text-muted)] pt-1 pb-6">
          Read-only. Credit grants, refunds and status changes are not editable from this page.
          Daily buckets use IST.
        </p>
      </div>
    </div>
  );
}
