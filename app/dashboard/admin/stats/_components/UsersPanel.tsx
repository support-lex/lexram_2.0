"use client";

// Searchable / segmentable user directory.
//
// Verification is the PRIMARY split here — a dedicated two-way toggle (Verified /
// Unverified), not one more pill among many — because it's the first question an
// operator asks of this table ("who actually completed signup?"), and most accounts in
// this product are phone-only OTP signups where that line matters more than any other
// segment. The remaining filters (Joined/Active/Topped up/Never signed in) are scoped
// filters that apply WITHIN whichever side is selected, not across both.
//
// The GLOBAL range (from the page header) scopes the time-based segments — "joined" and
// "active" mean *within the selected window* — while "All" deliberately ignores it,
// because the directory is also how you look someone up, and a lookup shouldn't silently
// hide a user who joined before the window.
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
  Segmented,
  Table,
  TableFooter,
  fmtDateTime,
  fmtInt,
  fmtRelative,
} from "./ui";

type SortKey = "joined" | "lastSeen" | "balance" | "spent";
type Segment = "all" | "new" | "active" | "paying" | "dormant";
type VerifiedView = "verified" | "unverified";

const PAGE = 25;

export default function UsersPanel({ rows, range }: { rows: UserRow[]; range: RangeKey }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<VerifiedView>("verified");
  const [segment, setSegment] = useState<Segment>("all");
  const [sort, setSort] = useState<SortKey>("joined");
  const [limit, setLimit] = useState(PAGE);

  const label = rangeLabel(range).toLowerCase();

  const verifiedCount = useMemo(() => rows.filter((u) => u.verified).length, [rows]);
  const unverifiedCount = rows.length - verifiedCount;

  const inView = useMemo(
    () => rows.filter((u) => (view === "verified" ? u.verified : !u.verified)),
    [rows, view]
  );

  const segments = useMemo(() => {
    const count = (fn: (u: UserRow) => boolean) => inView.filter(fn).length;
    return [
      { key: "all" as const, label: "All", count: inView.length },
      { key: "new" as const, label: `Joined · ${label}`, count: count((u) => inRange(u.joined, range)) },
      { key: "active" as const, label: `Active · ${label}`, count: count((u) => inRange(u.lastSeen, range)) },
      // "Topped up" means bought credits — above the 50-credit free signup grant everyone gets.
      { key: "paying" as const, label: "Topped up", count: count((u) => u.toppedUp > 50) },
      { key: "dormant" as const, label: "Never signed in", count: count((u) => !u.lastSeen) },
    ];
  }, [inView, range, label]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bySegment = inView.filter((u) => {
      switch (segment) {
        case "new":
          return inRange(u.joined, range);
        case "active":
          return inRange(u.lastSeen, range);
        case "paying":
          return u.toppedUp > 50;
        case "dormant":
          return !u.lastSeen;
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
  }, [inView, query, segment, sort, range]);

  const visible = filtered.slice(0, limit);

  return (
    <div>
      {/* Primary split: Verified vs. Unverified. Switching resets the secondary
          segment back to "All" — a "Topped up" filter carried over from the other
          side would silently under-count here. */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/15">
        <Segmented
          options={[
            { key: "verified" as const, label: `Verified (${fmtInt(verifiedCount)})` },
            { key: "unverified" as const, label: `Unverified (${fmtInt(unverifiedCount)})` },
          ]}
          value={view}
          onChange={(v) => {
            setView(v);
            setSegment("all");
            setLimit(PAGE);
          }}
          ariaLabel="Verification status"
        />
      </div>

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
        headers={["Name", "Email", "Phone", "Country", "Balance", "Spent", "Topped up", "Last seen", "Joined", ""]}
        align={["left", "left", "left", "left", "right", "right", "right", "left", "left", "left"]}
        rows={visible.map((u) => [
          <span key="n" className={u.name && u.name !== "—" ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
            {u.name && u.name !== "—" ? u.name : "—"}
          </span>,
          <span key="e" className={u.email ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}>
            {u.email || "—"}
          </span>,
          <span key="p" className={u.phone ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}>
            {u.phone || "—"}
          </span>,
          u.country || "—",
          u.balance == null ? <span className="text-[var(--text-muted)]">no wallet</span> : fmtInt(u.balance),
          u.spent ? fmtInt(u.spent) : "—",
          u.toppedUp ? fmtInt(u.toppedUp) : "—",
          <span key="ls" className={u.lastSeen ? "" : "text-[var(--text-muted)]"}>
            {fmtRelative(u.lastSeen)}
          </span>,
          fmtDateTime(u.joined),
          u.superAdmin ? <Badge tone="accent">super admin</Badge> : "",
        ])}
        empty={`No ${view} users match this filter.`}
      />

      <TableFooter
        shown={visible.length}
        total={filtered.length}
        onMore={() => setLimit((l) => l + PAGE * 2)}
      />
    </div>
  );
}
