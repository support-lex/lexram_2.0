"use client";

import type { OverviewStats } from "@/types/law-firm";

interface OverviewCardProps {
  stats?: OverviewStats;
  isLoading?: boolean;
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-[var(--surface-hover)]">
      <span className={`text-2xl font-bold ${accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-0.5">{label}</span>
    </div>
  );
}

export default function OverviewCard({ stats, isLoading }: OverviewCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <div className="h-5 w-24 bg-[var(--surface-hover)] rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-[var(--surface-hover)] rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }
  if (!stats) return null;

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Overview</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatTile label="Total" value={stats.totalCases} accent />
        <StatTile label="Active" value={stats.activeCases} />
        <StatTile label="Pending" value={stats.pendingCases} />
        <StatTile label="Closed" value={stats.closedCases} />
      </div>
      {stats.byType && Object.keys(stats.byType).length > 0 && (
        <>
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">By Type</h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.byType).filter(([, v]) => v > 0).map(([k, v]) => (
              <span key={k} className="px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-xs text-[var(--text-secondary)]">{k}: {v}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
