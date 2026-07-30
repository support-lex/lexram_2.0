"use client";

// Top-up (credit purchase) history — read-only.
//
// Rows come from public.payments, which is the Cashfree order ledger: a row is
// created at "create order" time with status 'pending' and only flips to 'paid'
// on the webhook. That means a pending row is an *abandoned or in-flight*
// checkout, not a debt — hence the status filter defaulting to all, and the
// separate pending-value tile on the page rather than folding it into revenue.

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { TopUpRow } from "../_lib/overview";
import { Badge, Table, fmtINR, fmtInt, fmtDateTime, statusTone } from "./ui";

const PAGE = 20;

export default function TopUpsPanel({ rows }: { rows: TopUpRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [limit, setLimit] = useState(PAGE);

  const statuses = useMemo(() => ["all", ...new Set(rows.map((r) => r.status))], [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return [r.orderId, r.userLabel, r.invoiceNumber, r.method].some((f) => f?.toLowerCase().includes(q));
    });
  }, [rows, query, status]);

  const visible = filtered.slice(0, limit);
  const filteredValue = filtered.reduce((s, r) => s + r.amountInr, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--border-light)]">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Search order, customer, invoice…"
            aria-label="Search top-ups"
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-primary)]/20 pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatus(s);
                setLimit(PAGE);
              }}
              aria-pressed={status === s}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide border transition-colors ${
                status === s
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/[0.06]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{fmtINR(filteredValue)} in view</span>
      </div>

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
        empty="No top-ups match this filter."
      />

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border-light)]">
        <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
          Showing {fmtInt(visible.length)} of {fmtInt(filtered.length)}
        </span>
        {visible.length < filtered.length && (
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE * 2)}
            className="rounded-md border border-[var(--border-default)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--accent)]/[0.06] transition-colors"
          >
            Show more
          </button>
        )}
      </div>
    </div>
  );
}
