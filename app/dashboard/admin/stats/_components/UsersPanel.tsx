"use client";

// Searchable / segmentable user directory.
//
// Two filters compose here and it matters which does what: the GLOBAL range (from the page
// header) scopes the time-based segments — "joined" and "active" mean *within the selected
// window* — while "All" deliberately ignores it, because the directory is also how you look
// someone up, and a lookup shouldn't silently hide a user who joined before the window.
//
// The full list is handed over in one server payload (a few hundred rows) and filtered in
// the browser, so typing is instant. Past a few thousand users this should move to a
// server-side query with pagination.

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import type { UserRow } from "../_lib/overview";
import { inRange, rangeLabel, type RangeKey } from "./range";
import {
  Badge,
  FilterBar,
  PillFilter,
  SearchInput,
  Table,
  TableFooter,
  UserCell,
  fmtDateTime,
  fmtInt,
  fmtRelative,
} from "./ui";

type SortKey = "joined" | "lastSeen" | "balance" | "spent";
type Segment = "all" | "new" | "active" | "paying" | "dormant" | "unverified";

const PAGE = 25;

export default function UsersPanel({ rows, range }: { rows: UserRow[]; range: RangeKey }) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [sort, setSort] = useState<SortKey>("joined");
  const [limit, setLimit] = useState(PAGE);

  const label = rangeLabel(range).toLowerCase();

  const segments = useMemo(() => {
    const count = (fn: (u: UserRow) => boolean) => rows.filter(fn).length;
    return [
      { key: "all" as const, label: "All", count: rows.length },
      { key: "new" as const, label: `Joined · ${label}`, count: count((u) => inRange(u.joined, range)) },
      { key: "active" as const, label: `Active · ${label}`, count: count((u) => inRange(u.lastSeen, range)) },
      // "Topped up" means bought credits — above the 50-credit free signup grant everyone gets.
      { key: "paying" as const, label: "Topped up", count: count((u) => u.toppedUp > 50) },
      { key: "dormant" as const, label: "Never signed in", count: count((u) => !u.lastSeen) },
      { key: "unverified" as const, label: "Unverified", count: count((u) => !u.verified) },
    ];
  }, [rows, range, label]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bySegment = rows.filter((u) => {
      switch (segment) {
        case "new":
          return inRange(u.joined, range);
        case "active":
          return inRange(u.lastSeen, range);
        case "paying":
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
  }, [rows, query, segment, sort, range]);

  const visible = filtered.slice(0, limit);

  return (
    <div>
      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setLimit(PAGE);
          }}
          placeholder="Search name, email, phone…"
          ariaLabel="Search users"
        />
        <PillFilter
          options={segments}
          value={segment}
          onChange={(k) => {
            setSegment(k);
            setLimit(PAGE);
          }}
          ariaLabel="User segment"
        />
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
      </FilterBar>

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

      <TableFooter
        shown={visible.length}
        total={filtered.length}
        onMore={() => setLimit((l) => l + PAGE * 2)}
      />
    </div>
  );
}
