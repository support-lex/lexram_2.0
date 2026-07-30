"use client";

// Searchable / sortable user directory.
//
// The full user list is handed over from the server in one payload (a few
// hundred rows today) and filtered in the browser — no round-trip per keystroke.
// If the user count ever reaches the low thousands this should move to a
// server-side query with pagination.

import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import type { UserRow } from "../_lib/overview";
import { Badge, Table, UserCell, fmtInt, fmtDateTime, fmtRelative } from "./ui";

type SortKey = "joined" | "lastSeen" | "balance" | "spent";
type Segment = "all" | "active7d" | "new7d" | "paying" | "dormant" | "unverified";

const SEGMENTS: Array<{ key: Segment; label: string }> = [
  { key: "all", label: "All" },
  { key: "active7d", label: "Active 7d" },
  { key: "new7d", label: "New 7d" },
  { key: "paying", label: "Topped up" },
  { key: "dormant", label: "Never signed in" },
  { key: "unverified", label: "Unverified" },
];

const PAGE = 25;

export default function UsersPanel({ rows, sevenDaysAgo }: { rows: UserRow[]; sevenDaysAgo: string }) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [sort, setSort] = useState<SortKey>("joined");
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bySegment = rows.filter((u) => {
      switch (segment) {
        case "active7d":
          return Boolean(u.lastSeen && u.lastSeen >= sevenDaysAgo);
        case "new7d":
          return Boolean(u.joined && u.joined >= sevenDaysAgo);
        case "paying":
          // Credits bought, as opposed to the free signup grant everybody gets.
          return u.toppedUp > 50;
        case "dormant":
          return !u.lastSeen;
        case "unverified":
          return !u.verified;
        default:
          return true;
      }
    });

    const searched = q
      ? bySegment.filter((u) =>
          [u.name, u.email, u.phone, u.country, u.id].some((f) => f?.toLowerCase().includes(q))
        )
      : bySegment;

    return [...searched].sort((a, b) => {
      switch (sort) {
        case "balance":
          return (b.balance ?? -1) - (a.balance ?? -1);
        case "spent":
          return b.spent - a.spent;
        case "lastSeen":
          return (b.lastSeen ?? "").localeCompare(a.lastSeen ?? "");
        default:
          return (b.joined ?? "").localeCompare(a.joined ?? "");
      }
    });
  }, [rows, query, segment, sort, sevenDaysAgo]);

  const visible = filtered.slice(0, limit);

  return (
    <div>
      {/* Filters live in one row above the data, never interleaved with it. */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--border-light)]">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Search name, email, phone…"
            aria-label="Search users"
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-primary)]/20 pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setSegment(s.key);
                setLimit(PAGE);
              }}
              aria-pressed={segment === s.key}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide border transition-colors ${
                segment === s.key
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/[0.06]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          <ArrowUpDown className="w-3 h-3" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort users"
            className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-[11px] font-medium normal-case tracking-normal text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)]"
          >
            <option value="joined">Newest</option>
            <option value="lastSeen">Last seen</option>
            <option value="balance">Balance</option>
            <option value="spent">Credits spent</option>
          </select>
        </label>
      </div>

      <Table
        headers={["User", "Country", "Balance", "Spent", "Topped up", "Last seen", "Joined", "Status"]}
        align={["left", "left", "right", "right", "right", "left", "left", "left"]}
        rows={visible.map((u) => [
          <UserCell key="u" name={u.name} email={u.email} phone={u.phone} />,
          u.country || "—",
          u.balance == null ? <span className="text-[var(--text-muted)]">no wallet</span> : fmtInt(u.balance),
          u.spent ? fmtInt(u.spent) : "—",
          u.toppedUp ? fmtInt(u.toppedUp) : "—",
          <span key="ls" className={u.lastSeen ? "" : "text-[var(--text-muted)]"}>
            {fmtRelative(u.lastSeen)}
          </span>,
          fmtDateTime(u.joined),
          <span key="st" className="inline-flex gap-1">
            {u.superAdmin && <Badge tone="accent">super admin</Badge>}
            <Badge tone={u.verified ? "good" : "warning"}>{u.verified ? "verified" : "unverified"}</Badge>
          </span>,
        ])}
        empty="No users match this filter."
      />

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border-light)]">
        <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
          Showing {fmtInt(visible.length)} of {fmtInt(filtered.length)}
          {filtered.length !== rows.length && ` (${fmtInt(rows.length)} total)`}
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
