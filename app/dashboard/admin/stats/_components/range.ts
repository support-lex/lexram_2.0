"use client";

// Date-range vocabulary shared by every tab.
//
// One range is chosen once, at the top of the page, and every tile, chart and table reads
// it. That is the difference between a filter and decoration: previously each tile hard-
// coded its own window (today / 7d / 30d), so nothing on the page agreed with anything
// else and no question like "how did last quarter go" could be asked at all.

import type { DailyPoint } from "../_lib/overview";

export type RangeKey = "today" | "7d" | "30d" | "90d" | "12m" | "all";

export const RANGES: Array<{ key: RangeKey; label: string; days: number | null }> = [
  // days: 1 → rangeStartKey subtracts (1-1)=0 days, landing exactly on today's IST date.
  // The delta then compares today against yesterday, which is the plain-language reading
  // of "today" a non-technical viewer expects — not "today vs the same weekday last week".
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "12m", label: "12 months", days: 365 },
  { key: "all", label: "All time", days: null },
];

export function rangeDays(key: RangeKey): number | null {
  return RANGES.find((r) => r.key === key)?.days ?? null;
}

export function rangeLabel(key: RangeKey): string {
  return RANGES.find((r) => r.key === key)?.label ?? key;
}

/**
 * A ready-to-use adverbial clause for sentence contexts — "captured
 * ${rangeAdverbial(range)}" — as opposed to rangeLabel(), which is a bare noun phrase
 * for compact chips ("Per day · 30 days"). Every sentence template on this dashboard
 * used to wrap the label in its own "in the"/"within the"/"the last" prefix, which
 * reads fine as "in the 7 days" but breaks as "in the today" — this returns the whole
 * clause, prefix included, so no caller adds its own.
 */
export function rangeAdverbial(key: RangeKey): string {
  if (key === "today") return "today";
  if (key === "all") return "across all time";
  const days = rangeDays(key);
  return `in the last ${days === 365 ? "12 months" : `${days} days`}`;
}

/** The oldest "YYYY-MM-DD" (IST) still inside the range; "" for all-time. */
export function rangeStartKey(key: RangeKey): string {
  const days = rangeDays(key);
  if (days == null) return "";
  const d = new Date(Date.now() + 5.5 * 3600 * 1000);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

/** Slice a full-history series down to the selected range. */
export function sliceSeries(series: DailyPoint[], key: RangeKey): DailyPoint[] {
  const from = rangeStartKey(key);
  if (!from) return series;
  return series.filter((p) => p.date >= from);
}

/**
 * The immediately preceding window of equal length — what a delta is measured against.
 * All-time has no "before", so it yields null and the UI shows no delta rather than a
 * meaningless one.
 */
export function slicePrevious(series: DailyPoint[], key: RangeKey): DailyPoint[] | null {
  const days = rangeDays(key);
  if (days == null) return null;
  const from = rangeStartKey(key);
  const prevStart = new Date(`${from}T00:00:00Z`);
  prevStart.setUTCDate(prevStart.getUTCDate() - days);
  const prevFrom = prevStart.toISOString().slice(0, 10);
  return series.filter((p) => p.date >= prevFrom && p.date < from);
}

export function sum(series: DailyPoint[]): number {
  return series.reduce((s, p) => s + p.value, 0);
}

/** Percent change vs. the preceding window; null when there's no basis to compare. */
export function deltaPct(series: DailyPoint[], key: RangeKey): number | null {
  const prev = slicePrevious(series, key);
  if (!prev || prev.length === 0) return null;
  const before = sum(prev);
  if (before === 0) return null;          // "up from zero" is not a percentage
  return Math.round(((sum(sliceSeries(series, key)) - before) / before) * 100);
}

/** True when the ISO timestamp falls inside the selected range (IST day boundaries). */
export function inRange(iso: string | null | undefined, key: RangeKey): boolean {
  if (!iso) return false;
  const from = rangeStartKey(key);
  if (!from) return true;
  return new Date(new Date(iso).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10) >= from;
}
