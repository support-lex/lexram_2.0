"use client";

import { useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Case, PaginatedResponse } from "@/types/law-firm";

interface CasesTableProps {
  data?: PaginatedResponse<Case>;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onSort?: (field: string) => void;
  compact?: boolean;
}

function Skeleton() {
  return <div className="h-4 w-full bg-[var(--surface-hover)] rounded animate-pulse" />;
}

export default function CasesTable({ data, isLoading, onPageChange, onSort, compact }: CasesTableProps) {
  const cases = data?.data ?? [];
  const columns = compact
    ? ["Case Number", "Client", "Court", "Next Hearing"]
    : ["Case Number", "Client", "Advocate", "Court", "Type", "Stage", "Next Hearing", "Last Purpose"];
  const fields = compact
    ? ["caseNumber", "client", "court", "nextHearing"] as const
    : ["caseNumber", "client", "advocate", "court", "type", "stage", "nextHearing", "lastPurpose"] as const;

  const isNearDate = (d: string | null) => {
    if (!d) return false;
    const diff = (new Date(d).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  };

  return (
    <div className="rounded-xl border border-[var(--border-default)] overflow-hidden bg-[var(--bg-surface)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-hover)]">
              {columns.map((col, i) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  <button onClick={() => onSort?.(fields[i])} className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors">
                    {col} <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-[var(--border-light)]">
                  {fields.map((_, j) => <td key={j} className="px-4 py-3"><Skeleton /></td>)}
                </tr>
              ))
            ) : cases.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--text-muted)]">No cases found.</td></tr>
            ) : (
              cases.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{c.caseNumber}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{c.client}</td>
                  {!compact && <td className="px-4 py-3 text-[var(--text-secondary)]">{c.advocate}</td>}
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{c.court}</td>
                  {!compact && <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-xs font-medium">{c.type}</span></td>}
                  {!compact && <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-medium">{c.stage}</span></td>}
                  <td className={`px-4 py-3 text-xs font-medium ${isNearDate(c.nextHearing) ? "text-red-600 font-bold" : "text-[var(--text-secondary)]"}`}>
                    {c.nextHearing ? new Date(c.nextHearing).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  {!compact && <td className="px-4 py-3 text-[var(--text-muted)] text-xs max-w-[160px] truncate">{c.lastPurpose || "—"}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-light)]">
          <span className="text-xs text-[var(--text-muted)]">Page {data.page} of {data.totalPages} ({data.total} cases)</span>
          <div className="flex items-center gap-1">
            <button disabled={data.page <= 1} onClick={() => onPageChange?.(data.page - 1)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={data.page >= data.totalPages} onClick={() => onPageChange?.(data.page + 1)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
