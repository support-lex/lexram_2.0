"use client";

// Top-up (credit purchase) history — read-only.
//
// Rows come from public.payments, the Cashfree order ledger: a row is created at
// "create order" time with status 'pending' and only flips to 'paid' on the webhook. A
// pending row is therefore an abandoned or in-flight checkout, not money owed — which is
// why pending value is reported separately from revenue and never folded into it.
//
// Date filtering follows the page's global range and uses the same rule as the revenue
// chart: paid orders are dated by CAPTURE (paid_at), everything else by creation. An order
// raised Monday and captured Wednesday belongs to Wednesday.

import { useMemo, useState } from "react";
import type { TopUpRow } from "../_lib/overview";
import { inRange, rangeAdverbial, rangeLabel, type RangeKey } from "./range";
import {
  Badge,
  FilterBar,
  PillFilter,
  SearchInput,
  Table,
  TableFooter,
  fmtDateTime,
  fmtINR,
  fmtInt,
  statusTone,
} from "./ui";

const PAGE = 20;
const PAID = new Set(["paid", "success", "completed", "captured"]);

function effectiveDate(r: TopUpRow): string | null {
  return PAID.has(r.status) ? r.paidAt ?? r.createdAt : r.createdAt;
}

export default function TopUpsPanel({ rows, range }: { rows: TopUpRow[]; range: RangeKey }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [scope, setScope] = useState<"range" | "all">("range");
  const [limit, setLimit] = useState(PAGE);

  const label = rangeLabel(range).toLowerCase();
  const adv = rangeAdverbial(range);

  const dated = useMemo(
    () => (scope === "all" ? rows : rows.filter((r) => inRange(effectiveDate(r), range))),
    [rows, range, scope]
  );

  const statuses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of dated) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
    return [
      { key: "all", label: "All", count: dated.length },
      ...[...counts].sort((a, b) => b[1] - a[1]).map(([k, c]) => ({ key: k, label: k, count: c })),
    ];
  }, [dated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dated.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return [r.orderId, r.userLabel, r.invoiceNumber, r.method].some((f) =>
        f?.toLowerCase().includes(q)
      );
    });
  }, [dated, query, status]);

  const visible = filtered.slice(0, limit);
  const filteredValue = filtered.reduce((s, r) => s + r.amountInr, 0);

  return (
    <div>
      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setLimit(PAGE);
          }}
          placeholder="Search order, customer, invoice…"
          ariaLabel="Search top-ups"
        />
        <PillFilter
          options={statuses}
          value={status}
          onChange={(k) => {
            setStatus(k);
            setLimit(PAGE);
          }}
          ariaLabel="Payment status"
        />
        <PillFilter
          options={[
            { key: "range" as const, label: label },
            { key: "all" as const, label: "All time" },
          ]}
          value={scope}
          onChange={(k) => {
            setScope(k);
            setLimit(PAGE);
          }}
          ariaLabel="Date scope"
        />
        <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
          {fmtINR(filteredValue)} in view
        </span>
      </FilterBar>

      <Table
        headers={["Order", "Customer", "Amount", "Credits", "Method", "Created", "Paid", "Status"]}
        align={["left", "left", "right", "right", "left", "left", "left", "left"]}
        rows={visible.map((r) => [
          <span key="o" className="font-mono text-[11px] text-[var(--text-secondary)]">
            {r.orderId}
            {r.invoiceNumber && (
              <span className="block text-[10px] text-[var(--text-muted)]">{r.invoiceNumber}</span>
            )}
          </span>,
          <span key="c" className="text-[var(--text-primary)] truncate block max-w-[220px]">
            {r.userLabel}
          </span>,
          <span key="a" className="font-semibold text-[var(--text-primary)]">
            {fmtINR(r.amountInr)}
          </span>,
          r.creditsGranted == null ? "—" : fmtInt(r.creditsGranted),
          r.method ?? "—",
          fmtDateTime(r.createdAt),
          r.paidAt ? fmtDateTime(r.paidAt) : <span className="text-[var(--text-muted)]">—</span>,
          <Badge key="s" tone={statusTone(r.status)}>
            {r.status}
          </Badge>,
        ])}
        empty={`No top-ups ${adv}. Switch to All time to see the full ledger.`}
      />

      <TableFooter
        shown={visible.length}
        total={filtered.length}
        onMore={() => setLimit((l) => l + PAGE * 2)}
      />
    </div>
  );
}
