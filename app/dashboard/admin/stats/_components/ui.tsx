// Presentational primitives for the admin overview.
//
// Server components — no state, no effects. Everything is written against the
// dashboard's theme tokens (--bg-surface / --text-* / --border-* / --accent) so
// the page follows whichever theme is active instead of hardcoding cream+white
// and breaking under Midnight.
//
// Typography rule from the viz guidelines: numbers that must align vertically
// (table cells, axis ticks) get tabular-nums; large standalone figures keep
// proportional figures.

import type { ReactNode } from "react";

export function fmtInt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("en-IN");
}

/** Compact form for figures that would otherwise blow out a tile (tokens). */
export function fmtCompact(n: number | null | undefined): string {
  const v = n ?? 0;
  if (Math.abs(v) >= 1e7) return `${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `${(v / 1e5).toFixed(2)} L`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return fmtInt(v);
}

/** `payments.amount_inr` is whole rupees (schema: `int check > 0`), not paise. */
export function fmtINR(rupees: number | null | undefined): string {
  return `₹${(rupees ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

// ── Layout ──────────────────────────────────────────────────────────────────

export function SectionHeading({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 mt-2">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
          {icon && <span className="text-[var(--accent)]">{icon}</span>}
          {title}
        </h2>
        {hint && <p className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  title,
  hint,
  icon,
  action,
  padded = false,
  children,
}: {
  title?: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden">
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-light)]">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              {icon && <span className="text-[var(--accent)]">{icon}</span>}
              {title}
            </h3>
            {hint && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}

// ── Figures ─────────────────────────────────────────────────────────────────

/**
 * The one number the page leads with. Deliberately a hero figure rather than a
 * one-bar chart — a single current value is not a chart.
 */
export function Hero({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</div>
        <div className="text-5xl font-bold text-[var(--text-primary)] leading-none mt-2">{value}</div>
        {sub && <div className="text-sm text-[var(--text-secondary)] mt-2">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  icon,
  emphasis = false,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  emphasis?: boolean;
  /** Percent change vs. the preceding window; omit when there's nothing to compare. */
  delta?: number | null;
}) {
  return (
    <div
      className={`rounded-xl bg-[var(--bg-surface)] border shadow-[var(--shadow-card)] p-3.5 ${
        emphasis ? "border-[var(--accent)]/35" : "border-[var(--border-default)]"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {icon && <span className={emphasis ? "text-[var(--accent)]" : ""}>{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{value}</span>
        {delta != null && <Delta pct={delta} />}
      </div>
      {sub && <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

/**
 * Change vs. the preceding window. Direction is carried by the arrow glyph and the sign,
 * not by colour alone — the tint is a secondary cue only.
 */
export function Delta({ pct }: { pct: number }) {
  const flat = pct === 0;
  const up = pct > 0;
  const cls = flat
    ? "text-[var(--text-muted)]"
    : up
    ? "text-[#0a7a0a]"
    : "text-[#a82c2c]";
  return (
    <span className={`text-[11px] font-semibold tabular-nums ${cls}`}>
      {flat ? "±" : up ? "↑" : "↓"}
      {Math.abs(pct)}%
    </span>
  );
}

/** Segmented control. Used for the global date range and any in-tab toggle. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (key: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)]/25 p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors ${
            value === o.key
              ? "bg-[var(--accent)] text-[var(--accent-text)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--accent)]/[0.08]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Search box used above every table, so filtering looks the same everywhere. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-primary)]/20 pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)]"
      />
    </div>
  );
}

/** Pill row used for categorical filters (segments, statuses, plans). */
export function PillFilter<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ key: T; label: string; count?: number }>;
  value: T;
  onChange: (key: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap items-center gap-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide border transition-colors ${
            value === o.key
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
              : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/[0.06]"
          }`}
        >
          {o.label}
          {o.count != null && <span className="ml-1 opacity-60 tabular-nums">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** One row above the data: search on the left, filters and counts on the right. */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--border-light)]">
      {children}
    </div>
  );
}

/** Row count + "show more", so a truncated table never looks complete. */
export function TableFooter({
  shown,
  total,
  onMore,
}: {
  shown: number;
  total: number;
  onMore?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border-light)]">
      <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
        Showing {fmtInt(shown)} of {fmtInt(total)}
      </span>
      {onMore && shown < total && (
        <button
          type="button"
          onClick={onMore}
          className="rounded-md border border-[var(--border-default)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--accent)]/[0.06] transition-colors"
        >
          Show more
        </button>
      )}
    </div>
  );
}

export function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)]/25 px-3 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] truncate">
        {label}
      </div>
      <div className="text-base font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

/**
 * A single ratio against a limit — a meter, not a two-slice pie. Track and fill
 * come from the same hue so the fill reads as "how much of this".
 */
export function Meter({
  label,
  pct,
  caption,
}: {
  label: string;
  pct: number;
  caption?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{clamped}%</span>
      </div>
      <div
        className="mt-1.5 h-2 rounded-full bg-[var(--accent)]/12 overflow-hidden"
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${clamped}%` }} />
      </div>
      {caption && <div className="text-[11px] text-[var(--text-muted)] mt-1">{caption}</div>}
    </div>
  );
}

// ── Tables ──────────────────────────────────────────────────────────────────

export function Table({
  headers,
  rows,
  align = [],
  empty = "Nothing to show yet.",
}: {
  headers: string[];
  rows: ReactNode[][];
  /** Per-column alignment; numeric columns should be "right". */
  align?: Array<"left" | "right">;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-sm text-[var(--text-muted)] text-center">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--border-light)]">
            {headers.map((h, i) => (
              <th
                key={h}
                scope="col"
                className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] whitespace-nowrap ${
                  align[i] === "right" ? "text-right" : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--border-light)] last:border-b-0 hover:bg-[var(--accent)]/[0.04] transition-colors"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2.5 text-[var(--text-secondary)] align-middle ${
                    align[j] === "right" ? "text-right tabular-nums" : "text-left"
                  }`}
                >
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

/**
 * Status pill. Tone maps to the reserved status roles, and every pill carries
 * its own text label — the colour is never the only signal.
 */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "good" | "warning" | "critical" | "accent" | "neutral";
  children: ReactNode;
}) {
  const cls: Record<string, string> = {
    good: "bg-[#0ca30c]/12 text-[#0a7a0a] border-[#0ca30c]/35",
    warning: "bg-[#fab219]/16 text-[#8a5d00] border-[#fab219]/45",
    critical: "bg-[#d03b3b]/12 text-[#a82c2c] border-[#d03b3b]/35",
    accent: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30",
    neutral: "bg-[var(--text-muted)]/10 text-[var(--text-secondary)] border-[var(--border-default)]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${cls[tone]}`}
    >
      {children}
    </span>
  );
}

/** Payment / provisioning states → reserved status tones. */
export function statusTone(status: string): "good" | "warning" | "critical" | "neutral" {
  const s = status.toLowerCase();
  if (["paid", "success", "completed", "captured", "active", "provisioned", "published"].includes(s)) return "good";
  if (["pending", "invited", "scheduled", "processing", "draft"].includes(s)) return "warning";
  if (["failed", "cancelled", "canceled", "suspended", "refunded", "error"].includes(s)) return "critical";
  return "neutral";
}

/**
 * A user identity cell: the best available label on top, remaining contact
 * details below. Most accounts here are phone-only signups with no name and no
 * email, so the secondary line must exclude whatever was promoted to primary —
 * otherwise the same phone number renders twice.
 */
export function UserCell({ name, email, phone }: { name: string; email?: string; phone?: string }) {
  const hasName = Boolean(name && name !== "—");
  const primary = hasName ? name : email || phone || "—";
  const secondary = [email, phone].filter((v) => v && v !== primary).join(" · ");
  return (
    <div className="min-w-0">
      <div className="font-medium text-[var(--text-primary)] truncate">{primary}</div>
      {secondary && <div className="text-[11px] text-[var(--text-muted)] truncate">{secondary}</div>}
    </div>
  );
}
