"use client";

// Tenant directory. Not range-filtered: an organisation is a standing entity, so hiding
// one because it was created outside the selected window would just make tenants vanish.
// Filters here are the ones an operator actually needs — plan, status, and whether the
// schema-per-tenant provisioning ever completed.

import { useMemo, useState } from "react";
import type { OrgRow } from "../_lib/overview";
import {
  Badge,
  FilterBar,
  PillFilter,
  SearchInput,
  Table,
  TableFooter,
  fmtDateTime,
  fmtInt,
  statusTone,
} from "./ui";

type View = "all" | "active" | "suspended" | "unprovisioned" | "empty";

const PAGE = 25;

export default function OrgsPanel({ rows }: { rows: OrgRow[] }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("all");
  const [limit, setLimit] = useState(PAGE);

  const views = useMemo(() => {
    const n = (fn: (o: OrgRow) => boolean) => rows.filter(fn).length;
    return [
      { key: "all" as const, label: "All", count: rows.length },
      { key: "active" as const, label: "Active", count: n((o) => o.status.toLowerCase() === "active") },
      { key: "suspended" as const, label: "Suspended", count: n((o) => o.status.toLowerCase() === "suspended") },
      {
        key: "unprovisioned" as const,
        label: "Not provisioned",
        count: n((o) => (o.provisionStatus ?? "") !== "provisioned"),
      },
      // Tenants that exist but nobody has joined — usually an invite that was never accepted.
      { key: "empty" as const, label: "No seats used", count: n((o) => o.seatsUsed === 0) },
    ];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((o) => {
      switch (view) {
        case "active":
          if (o.status.toLowerCase() !== "active") return false;
          break;
        case "suspended":
          if (o.status.toLowerCase() !== "suspended") return false;
          break;
        case "unprovisioned":
          if ((o.provisionStatus ?? "") === "provisioned") return false;
          break;
        case "empty":
          if (o.seatsUsed !== 0) return false;
          break;
        default:
          break;
      }
      if (!q) return true;
      return [o.name, o.slug, o.adminEmail, o.plan, o.accountType].some((f) =>
        f?.toLowerCase().includes(q)
      );
    });
  }, [rows, query, view]);

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
          placeholder="Search organisation, slug, admin email…"
          ariaLabel="Search organisations"
        />
        <PillFilter
          options={views}
          value={view}
          onChange={(k) => {
            setView(k);
            setLimit(PAGE);
          }}
          ariaLabel="Organisation view"
        />
      </FilterBar>

      <Table
        headers={["Organisation", "Plan", "Type", "Seats", "Provisioning", "Created", "Status"]}
        align={["left", "left", "left", "right", "left", "left", "left"]}
        rows={visible.map((o) => [
          <div key="n" className="min-w-0">
            <div className="font-medium text-[var(--text-primary)] truncate">{o.name}</div>
            <div className="text-[11px] text-[var(--text-muted)] truncate">{o.adminEmail ?? o.slug}</div>
          </div>,
          <span key="p" className="capitalize">{o.plan}</span>,
          <span key="t" className="capitalize">{o.accountType ?? "—"}</span>,
          `${fmtInt(o.seatsUsed)}${o.seatLimit ? ` / ${fmtInt(o.seatLimit)}` : ""}`,
          o.provisionStatus ? (
            <Badge key="pr" tone={statusTone(o.provisionStatus)}>{o.provisionStatus}</Badge>
          ) : (
            "—"
          ),
          fmtDateTime(o.createdAt),
          <Badge key="s" tone={statusTone(o.status)}>{o.status}</Badge>,
        ])}
        empty="No organisations match this filter."
      />

      <TableFooter shown={visible.length} total={filtered.length} onMore={() => setLimit((l) => l + PAGE * 2)} />
    </div>
  );
}
