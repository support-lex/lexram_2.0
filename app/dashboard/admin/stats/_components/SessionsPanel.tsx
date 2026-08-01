"use client";

// Recent research threads, searchable by title or user.
//
// This is a sample (the newest 40), not the full session log — 1,000+ sessions have no
// business crossing the wire for a "recent activity" card. The footer states the sample
// size explicitly so a filtered count is never mistaken for a platform total; the Usage
// tab's session KPI is the real count.
//
// Rows are clickable: opens a read-only transcript dialog for that session (fetched on
// demand — see SessionTranscriptDialog for why the messages aren't preloaded here).

import { useMemo, useState } from "react";
import type { SessionRow } from "../_lib/overview";
import { inRange, rangeLabel, type RangeKey } from "./range";
import { FilterBar, PillFilter, SearchInput, Table, fmtDateTime, fmtInt } from "./ui";
import SessionTranscriptDialog from "./SessionTranscriptDialog";

export default function SessionsPanel({ rows, range }: { rows: SessionRow[]; range: RangeKey }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"range" | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const label = rangeLabel(range).toLowerCase();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((s) => (scope === "all" ? true : inRange(s.lastActive, range)))
      .filter((s) => (q ? [s.title, s.userLabel].some((f) => f?.toLowerCase().includes(q)) : true));
  }, [rows, query, scope, range]);

  return (
    <div>
      <FilterBar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search title or user…"
          ariaLabel="Search sessions"
        />
        <PillFilter
          options={[
            { key: "all" as const, label: "Latest" },
            { key: "range" as const, label: label },
          ]}
          value={scope}
          onChange={setScope}
          ariaLabel="Session date scope"
        />
      </FilterBar>

      <Table
        headers={["Title", "User", "Last active"]}
        rows={filtered.map((s) => [
          <span key="t" className="font-medium text-[var(--text-primary)] truncate block max-w-[420px]">
            {s.title}
          </span>,
          s.userLabel,
          fmtDateTime(s.lastActive),
        ])}
        empty={`No sessions in the ${label}.`}
        onRowClick={(i) => setOpenId(filtered[i].id)}
      />

      <div className="px-4 py-3 border-t border-[var(--border-light)]">
        <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
          {fmtInt(filtered.length)} of the {fmtInt(rows.length)} most recent sessions — not the
          platform total. Click a row to view its transcript.
        </span>
      </div>

      <SessionTranscriptDialog sessionId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
