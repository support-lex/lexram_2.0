"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import type { SearchFilters } from "@/types/law-firm";

interface CaseSearchProps {
  onSearch: (filters: SearchFilters) => void;
  placeholder?: string;
}

export default function CaseSearch({ onSearch, placeholder = "Search by CNR, case number, or keyword..." }: CaseSearchProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"cnr" | "advanced">("cnr");
  const [type, setType] = useState("");
  const [number, setNumber] = useState("");
  const [year, setYear] = useState("");

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "cnr") {
      onSearch({ cnr: query.trim() || undefined, query: query.trim() || undefined });
    } else {
      onSearch({ type: type || undefined, number: number || undefined, year: year || undefined } as SearchFilters);
    }
  }, [mode, query, type, number, year, onSearch]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={() => setMode("cnr")} className={`text-xs px-3 py-1 rounded-full transition-colors ${mode === "cnr" ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-hover)] text-[var(--text-secondary)]"}`}>CNR / Keyword</button>
        <button type="button" onClick={() => setMode("advanced")} className={`text-xs px-3 py-1 rounded-full transition-colors ${mode === "advanced" ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-hover)] text-[var(--text-secondary)]"}`}>Type + Number + Year</button>
      </div>

      {mode === "cnr" ? (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/60 transition-colors" />
        </div>
      ) : (
        <div className="flex gap-2">
          <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (e.g. Civil)" className="flex-1 px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm outline-none focus:border-[var(--accent)]/60" />
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Number" className="w-28 px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm outline-none focus:border-[var(--accent)]/60" />
          <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" className="w-24 px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm outline-none focus:border-[var(--accent)]/60" />
        </div>
      )}
      <button type="submit" className="mt-2 w-full py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors">Search</button>
    </form>
  );
}
