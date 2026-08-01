// Presentational primitives for the admin overview.
//
// Server components — no state, no effects. Everything is written against the
// dashboard's theme tokens (--bg-surface / --text-* / --border-*) so the page
// follows whichever theme is active instead of hardcoding cream+white and
// breaking under Midnight.
//
// DO NOT use `var(--accent)` for anything that needs to be visibly coloured.
// app/globals.css defines TWO unrelated things under that name: the brand's
// `:root { --accent: #6b1e2d }` (Classic theme, section 2), and a later,
// higher-source-order `:root { --accent: oklch(0.97 0 0) }` from an appended
// shadcn/ui token block (section 15) — same selector, same specificity, later
// wins, so `--accent` resolves to a near-white everywhere in this app, not the
// brand maroon. Confirmed live via getComputedStyle. This file uses
// `--lex-maroon` instead, which the shadcn block never touches. `--accent-text`
// and `--ring-accent` are unaffected (no shadcn equivalent shadows them) and are
// still safe to use as-is.
//
// Typography rule from the viz guidelines: numbers that must align vertically
// (table cells, axis ticks) get tabular-nums; large standalone figures keep
// proportional figures.
//
// Contrast rule: this brand's page background (--bg-primary) and card surface
// (--bg-surface) sit close in lightness, and the shared --shadow-card token is
// nearly invisible (1-4% alpha) — fine for the rest of the app, but a dashboard
// lives or dies on being scannable at a glance. Every primitive below compensates
// deliberately: --shadow-md (not --shadow-card) for real elevation, solid icon
// chips instead of bare small glyphs, filled pill badges instead of plain
// colour-only text, and a meter thick enough that its fill reads as a fill and
// not a hairline.

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
          {icon && <span className="text-[var(--lex-maroon)]">{icon}</span>}
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
    // --shadow-card is a 1-4% alpha token — real elsewhere, invisible here.
    // --shadow-md is the same scale's next step up and reads as actual elevation.
    <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-md)] overflow-hidden">
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-[var(--border-default)]">
          <div className="min-w-0 flex items-center gap-2.5">
            {icon && <IconChip icon={icon} size="sm" />}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{title}</h3>
              {hint && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-4 sm:p-5" : ""}>{children}</div>
    </section>
  );
}

/**
 * A solid colour chip behind an icon — the icon alone, at 14-16px in a single
 * muted or accent stroke colour, reads as an indistinct mark rather than a
 * symbol (this is what made every KPI tile's icon illegible). A filled chip
 * gives the eye a shape to land on first, then the glyph inside it.
 */
export function IconChip({
  icon,
  tone = "accent",
  size = "md",
}: {
  icon: ReactNode;
  tone?: "accent" | "solid" | "muted";
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "lg" ? "w-11 h-11" : size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const iconSize = size === "lg" ? "[&>svg]:w-5 [&>svg]:h-5" : size === "sm" ? "[&>svg]:w-3.5 [&>svg]:h-3.5" : "[&>svg]:w-4 [&>svg]:h-4";
  const cls =
    tone === "solid"
      ? "bg-[var(--lex-maroon)] text-[var(--accent-text)]"
      : tone === "muted"
      ? "bg-[var(--text-muted)]/12 text-[var(--text-secondary)]"
      : "bg-[var(--lex-maroon)]/12 text-[var(--lex-maroon)]";
  return (
    <span className={`inline-flex items-center justify-center shrink-0 rounded-xl ${dims} ${iconSize} ${cls}`}>
      {icon}
    </span>
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
      className={`relative rounded-2xl border shadow-[var(--shadow-md)] p-4 overflow-hidden ${
        emphasis
          ? "bg-[color-mix(in_srgb,var(--lex-maroon)_5%,var(--bg-surface))] border-[var(--lex-maroon)]/25"
          : "bg-[var(--bg-surface)] border-[var(--border-default)]"
      }`}
    >
      {/* Emphasis is a full-width top rule, not a border-colour swap that only
          shows up on close inspection — this is meant to be seen from across
          the grid, not deduced. */}
      {emphasis && <span className="absolute inset-x-0 top-0 h-[3px] bg-[var(--lex-maroon)]" aria-hidden />}
      <div className="flex items-start justify-between gap-2">
        {icon && <IconChip icon={icon} tone={emphasis ? "solid" : "accent"} size="sm" />}
        {delta != null && <Delta pct={delta} />}
      </div>
      <div className="mt-3 text-[26px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
        {value}
      </div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] truncate">
        {label}
      </div>
      {sub && <div className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">{sub}</div>}
    </div>
  );
}

/**
 * Change vs. the preceding window, as a filled pill (not plain coloured text) —
 * a solid background reads at a glance even under heavy compression; a tint of
 * text colour on a similarly-toned card does not. Uses the same reserved
 * good/critical hues as status badges, since direction is itself a status signal.
 */
export function Delta({ pct }: { pct: number }) {
  const flat = pct === 0;
  const up = pct > 0;
  const cls = flat
    ? "bg-[var(--text-muted)]/14 text-[var(--text-secondary)]"
    : up
    ? "bg-[#0ca30c]/16 text-[#0a7a0a]"
    : "bg-[#d03b3b]/14 text-[#a82c2c]";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${cls}`}>
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
      className="inline-flex items-center gap-0.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 shadow-[var(--shadow-sm)]"
    >
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
            value === o.key
              ? "bg-[var(--lex-maroon)] text-[var(--accent-text)] shadow-[var(--shadow-sm)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--text-muted)]/10"
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
        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)]/35 pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:border-[var(--lex-maroon)]/40"
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
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border transition-colors ${
            value === o.key
              ? "border-[var(--lex-maroon)] bg-[var(--lex-maroon)] text-[var(--accent-text)] shadow-[var(--shadow-sm)]"
              : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--text-muted)]/10"
          }`}
        >
          {o.label}
          {o.count != null && (
            <span className={`ml-1 tabular-nums ${value === o.key ? "opacity-80" : "opacity-55"}`}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** One row above the data: search on the left, filters and counts on the right. */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/15">
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
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-[var(--border-default)] bg-[var(--bg-primary)]/15">
      <span className="text-[11px] font-semibold text-[var(--text-muted)] tabular-nums">
        Showing {fmtInt(shown)} of {fmtInt(total)}
      </span>
      {onMore && shown < total && (
        <button
          type="button"
          onClick={onMore}
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--lex-maroon)]/10 hover:text-[var(--lex-maroon)] transition-colors"
        >
          Show more
        </button>
      )}
    </div>
  );
}

export function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] px-3.5 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] truncate">
        {label}
      </div>
      <div className="text-lg font-extrabold text-[var(--text-primary)] mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

/**
 * A single ratio against a limit — a meter, not a two-slice pie. Track and fill share
 * the accent hue so the fill reads as "how much of this", but at 8px tall on a warm
 * near-neutral palette a plain tint-vs-solid contrast washes out completely (this is
 * what made every meter look like a flat line). Fixed by: a visibly darker track (not
 * a 12%-alpha accent wash), a taller bar, a defining ring, and the percentage as its
 * own filled badge rather than plain text floating beside it.
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
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
        <span className="inline-flex items-center rounded-full bg-[var(--lex-maroon)]/14 px-2 py-0.5 text-xs font-extrabold text-[var(--lex-maroon)] tabular-nums">
          {clamped}%
        </span>
      </div>
      <div
        className="mt-2 h-3 rounded-full bg-[var(--text-muted)]/16 ring-1 ring-[var(--border-default)] overflow-hidden"
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-[var(--lex-maroon)] transition-[width] duration-300"
          style={{ width: `${Math.max(clamped, clamped > 0 ? 3 : 0)}%` }}
        />
      </div>
      {caption && <div className="text-[11px] text-[var(--text-muted)] mt-1.5">{caption}</div>}
    </div>
  );
}

// ── Tables ──────────────────────────────────────────────────────────────────

export function Table({
  headers,
  rows,
  align = [],
  empty = "Nothing to show yet.",
  onRowClick,
}: {
  headers: string[];
  rows: ReactNode[][];
  /** Per-column alignment; numeric columns should be "right". */
  align?: Array<"left" | "right">;
  empty?: string;
  /** When set, every row becomes a button — clickable and keyboard-activatable. */
  onRowClick?: (index: number) => void;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-sm text-[var(--text-muted)] text-center">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[var(--bg-primary)]/25 border-b border-[var(--border-default)]">
            {headers.map((h, i) => (
              <th
                key={h}
                scope="col"
                className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] whitespace-nowrap ${
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
              onClick={onRowClick ? () => onRowClick(i) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(i);
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "button" : undefined}
              className={`border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--lex-maroon)]/[0.05] transition-colors ${
                onRowClick ? "cursor-pointer focus:outline-none focus:bg-[var(--lex-maroon)]/[0.08]" : ""
              }`}
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
    good: "bg-[#0ca30c]/16 text-[#0a7a0a] border-[#0ca30c]/35",
    warning: "bg-[#fab219]/20 text-[#8a5d00] border-[#fab219]/45",
    critical: "bg-[#d03b3b]/16 text-[#a82c2c] border-[#d03b3b]/35",
    accent: "bg-[var(--lex-maroon)]/14 text-[var(--lex-maroon)] border-[var(--lex-maroon)]/30",
    neutral: "bg-[var(--text-muted)]/14 text-[var(--text-secondary)] border-[var(--border-default)]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${cls[tone]}`}
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
