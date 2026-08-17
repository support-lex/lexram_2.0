"use client";

// 30-day daily column chart — one series per chart, on purpose.
//
// Why single-series everywhere: the brand offers exactly one accent hue, and
// maroon vs rust fails the normal-vision separation floor (ΔE 14.5, floor 15),
// so a two-series chart in brand colours would be unreadable for everyone, not
// just colourblind readers. Each metric therefore gets its own card and its own
// axis. There is no dual-axis chart on this page and there must not be one.
//
// A single series needs no legend — the card title names it. Identity is never
// carried by colour alone here, and the table view below is the non-visual
// equivalent of the plot.

import { useId, useMemo, useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { fmtCompact, fmtINR, fmtInt } from "./ui";

export interface TrendPoint {
  date: string;
  value: number;
}

/**
 * Value formatting is declared, not injected. A formatter *function* cannot
 * cross the server/client boundary — React refuses to serialise it — so the
 * caller names a format and the unit noun instead.
 */
export type TrendFormat = "int" | "inr" | "compact";

export default function TrendChart({
  points,
  format,
  unit,
  valueLabel,
  emptyHint = "No activity in this window.",
}: {
  points: TrendPoint[];
  format: TrendFormat;
  /** Singular noun appended to the figure, e.g. "signup" → "13 signups". */
  unit?: string;
  /** Column header for the table view, e.g. "Signups". */
  valueLabel: string;
  emptyHint?: string;
}) {
  const formatValue = (n: number): string => {
    if (format === "inr") return fmtINR(n);
    const num = format === "compact" ? fmtCompact(n) : fmtInt(n);
    if (!unit) return num;
    return `${num} ${unit}${n === 1 ? "" : "s"}`;
  };

  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const tableId = useId();

  // A year of daily columns inside a card is ~0.2px per bar — unreadable. Past a quarter,
  // roll days up into weeks so the mark keeps a usable width and the trend stays legible.
  // The label says which, so nobody reads a weekly total as a daily one.
  const { points: plotted, bucket } = useMemo(() => {
    if (points.length <= 92) return { points, bucket: "day" as const };
    const weeks: TrendPoint[] = [];
    for (let i = 0; i < points.length; i += 7) {
      const chunk = points.slice(i, i + 7);
      weeks.push({
        date: chunk[0].date,
        value: chunk.reduce((s, p) => s + p.value, 0),
      });
    }
    return { points: weeks, bucket: "week" as const };
  }, [points]);

  const { max, total, allZero } = useMemo(() => {
    let max = 0;
    let total = 0;
    plotted.forEach((p) => {
      total += p.value;
      if (p.value > max) max = p.value;
    });
    return { max, total, allZero: max === 0 };
  }, [plotted]);

  const active = hover != null ? plotted[hover] : null;
  const spanLabel = `${plotted.length} ${bucket}${plotted.length === 1 ? "" : "s"}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <div className="text-xs text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatValue(total)}</span>{" "}
          <span className="text-[var(--text-muted)]">over {spanLabel}</span>
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-expanded={asTable}
          aria-controls={tableId}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] hover:bg-[var(--lex-maroon)]/[0.06] transition-colors"
        >
          {asTable ? <BarChart3 className="w-3 h-3" /> : <Table2 className="w-3 h-3" />}
          {asTable ? "Chart" : "Table"}
        </button>
      </div>

      {asTable ? (
        <div id={tableId} className="max-h-64 overflow-y-auto px-4 pb-4 pt-2">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--bg-surface)]">
              <tr className="border-b border-[var(--border-default)]">
                <th scope="col" className="text-left py-1.5 font-bold text-[var(--text-muted)] uppercase tracking-wide text-[10px]">
                  Day
                </th>
                <th scope="col" className="text-right py-1.5 font-bold text-[var(--text-muted)] uppercase tracking-wide text-[10px]">
                  {valueLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.date} className="border-b border-[var(--border-light)] last:border-0">
                  <td className="py-1.5 text-[var(--text-secondary)]">{longDay(p.date)}</td>
                  <td className="py-1.5 text-right tabular-nums text-[var(--text-primary)]">{formatValue(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative px-4 pb-3 pt-4">
          {/* Recessive gridlines PLUS the max value as a real number at the top-left —
              blank space above a short bar needs to read as "the scale goes up to
              here", not "the chart is empty or broken". */}
          {!allZero && (
            <>
              <div className="absolute inset-x-4 top-4 bottom-9 pointer-events-none" aria-hidden>
                {[0, 0.5, 1].map((f) => (
                  <div
                    key={f}
                    className="absolute inset-x-0 border-t border-[var(--border-default)]"
                    style={{ top: `${f * 100}%` }}
                  />
                ))}
              </div>
              <span className="absolute left-4 top-2.5 text-[9px] font-bold text-[var(--text-muted)] tabular-nums pointer-events-none">
                {formatValue(max)}
              </span>
            </>
          )}

          {/* Tooltip. Pinned above the plot rather than following the cursor so
              it never covers the column being read. */}
          <div className="absolute left-4 right-4 -top-1 h-0 pointer-events-none z-10">
            {active && (
              <div
                className="absolute -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 shadow-[var(--shadow-lg)] whitespace-nowrap"
                style={{ left: `${((hover! + 0.5) / plotted.length) * 100}%` }}
              >
                <div className="text-[10px] text-[var(--text-muted)]">
                  {bucket === "week" ? `Week of ${longDay(active.date)}` : longDay(active.date)}
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                  {formatValue(active.value)}
                </div>
              </div>
            )}
          </div>

          {/* Columns. Each wrapper is a full-height hit target — much larger
              than the mark itself, so short columns are still easy to hover.
              No floating "peak" label here — the max-value scale readout above
              and the hover tooltip already cover that, and a label pinned to
              whichever bar happens to be tallest risks colliding with the
              scale readout when the peak sits near either edge. */}
          <div className="relative flex items-end gap-[3px] h-36 mt-4" onMouseLeave={() => setHover(null)}>
            {plotted.map((p, i) => {
              // Sequential shading by magnitude (one hue, more-is-darker) instead of a
              // flat fill — the shortest non-zero bar and the peak bar are now visibly
              // different, which also gives every bar real colour weight instead of a
              // uniform 78%-alpha wash that read as pale on this palette.
              const pct = max === 0 ? 0 : (p.value / max) * 100;
              const intensity = max === 0 ? 100 : 55 + (p.value / max) * 45;
              const isHover = hover === i;
              return (
                <div
                  key={p.date}
                  className="group relative flex-1 h-full flex items-end cursor-default"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  role="img"
                  aria-label={`${longDay(p.date)}: ${formatValue(p.value)}`}
                >
                  {/* Zero days keep a visibly-toned baseline stub — "nothing happened"
                      must read as a real day on the axis, not a rendering glitch, so
                      this can't be the same near-invisible hairline as the border. */}
                  <div
                    className="w-full min-w-[3px] rounded-t-[5px] transition-[height,box-shadow] duration-150"
                    style={{
                      height: p.value === 0 ? 6 : `max(4px, ${pct}%)`,
                      background:
                        p.value === 0
                          ? "color-mix(in srgb, var(--text-muted) 30%, transparent)"
                          : `color-mix(in srgb, var(--lex-maroon) ${Math.round(intensity)}%, var(--bg-surface))`,
                      boxShadow: isHover && p.value > 0 ? "0 0 0 2px var(--ring-accent)" : "none",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Axis: three ticks, not thirty — except a single-day chart (the "Today"
              range), where first/middle/"Today" would all repeat the same date. One
              centered label reads as "this one day", not as a redundant range. */}
          <div className="mt-2 flex justify-between text-[10px] font-semibold text-[var(--text-muted)] tabular-nums">
            {plotted.length <= 1 ? (
              <span className="w-full text-center">{plotted[0] ? longDay(plotted[0].date) : ""}</span>
            ) : (
              <>
                <span>{shortDay(plotted[0]?.date)}</span>
                <span>{shortDay(plotted[Math.floor(plotted.length / 2)]?.date)}</span>
                <span>Today</span>
              </>
            )}
          </div>

          {allZero && (
            <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs text-[var(--text-muted)]">
              {emptyHint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function shortDay(key: string | undefined): string {
  if (!key) return "";
  const [, m, d] = key.split("-");
  return `${d} ${MONTHS[Number(m) - 1] ?? ""}`;
}

function longDay(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d} ${MONTHS[Number(m) - 1] ?? ""} ${y}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
