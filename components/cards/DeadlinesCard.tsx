"use client";

import { CalendarDays } from "lucide-react";
import type { Deadline } from "@/types/law-firm";

interface DeadlinesCardProps {
  deadlines?: Deadline[];
  isLoading?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  hearing: "bg-blue-500/10 text-blue-600",
  filing: "bg-amber-500/10 text-amber-600",
  limitation: "bg-red-500/10 text-red-600",
  meeting: "bg-emerald-500/10 text-emerald-600",
};

export default function DeadlinesCard({ deadlines, isLoading }: DeadlinesCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <div className="h-5 w-24 bg-[var(--surface-hover)] rounded animate-pulse mb-4" />
        {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-[var(--surface-hover)] rounded-lg animate-pulse mb-2" />)}
      </div>
    );
  }

  const sorted = [...(deadlines || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const isNear = (d: string) => { const diff = (new Date(d).getTime() - Date.now()) / 86400000; return diff >= 0 && diff <= 3; };

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-[var(--accent)]" /> Upcoming Deadlines
      </h3>
      {sorted.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] text-center py-6">No upcoming deadlines.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((d) => (
            <div key={d.id} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${isNear(d.date) ? "bg-red-50 ring-1 ring-red-200" : "bg-[var(--surface-hover)]"}`}>
              <div className="flex-shrink-0 mt-0.5">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${TYPE_COLORS[d.type] || "bg-gray-100 text-gray-500"}`}>{d.type}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{d.title}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  {new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  {d.court && <> &middot; {d.court}</>}
                  {d.caseNumber && <> &middot; {d.caseNumber}</>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
