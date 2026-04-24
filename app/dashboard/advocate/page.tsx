"use client";

import { useState, useCallback, useMemo } from "react";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import CaseSearch from "@/components/search/CaseSearch";
import CasesTable from "@/components/tables/CasesTable";
import OverviewCard from "@/components/cards/OverviewCard";
import DeadlinesCard from "@/components/cards/DeadlinesCard";
import { MOCK_CASES, MOCK_DEADLINES, MOCK_OVERVIEW } from "@/lib/mock-data";
import type { SearchFilters, PaginatedResponse, Case } from "@/types/law-firm";

const PAGE_SIZE = 8;

export default function AdvocateDashboard() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("nextHearing");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [searchEnabled, setSearchEnabled] = useState(false);

  // Sort + paginate mock data
  const sortedCases = useMemo(() => {
    const sorted = [...MOCK_CASES].sort((a, b) => {
      const aVal = (a as any)[sort] ?? "";
      const bVal = (b as any)[sort] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return order === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [sort, order]);

  const paginatedCases: PaginatedResponse<Case> = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return {
      data: sortedCases.slice(start, start + PAGE_SIZE),
      total: sortedCases.length,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(sortedCases.length / PAGE_SIZE),
    };
  }, [sortedCases, page]);

  // Search
  const searchResults = useMemo(() => {
    if (!searchEnabled) return [];
    const q = (searchFilters.cnr || searchFilters.query || "").toLowerCase();
    const t = searchFilters.type?.toLowerCase();
    return MOCK_CASES.filter((c) => {
      if (q && !c.cnr.toLowerCase().includes(q) && !c.caseNumber.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q) && !c.client.toLowerCase().includes(q)) return false;
      if (t && !c.type.toLowerCase().includes(t)) return false;
      if (searchFilters.year && !c.filingDate.includes(searchFilters.year)) return false;
      return true;
    });
  }, [searchEnabled, searchFilters]);

  const handleSearch = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
    setSearchEnabled(true);
  }, []);

  const handleSort = useCallback((field: string) => {
    setOrder((prev) => (sort === field && prev === "asc" ? "desc" : "asc"));
    setSort(field);
  }, [sort]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Advocate Dashboard</h1>
            <p className="text-xs text-[var(--text-muted)]">Case management & legal intelligence</p>
          </div>
          <Link href="/dashboard/research-2" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors">
            <MessageSquare className="w-4 h-4" /> AI Assistant
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <CaseSearch onSearch={handleSearch} />
        </div>

        {/* Search results */}
        {searchEnabled && (
          <div className="mb-6 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Search Results ({searchResults.length})</h3>
            <CasesTable data={{ data: searchResults, total: searchResults.length, page: 1, pageSize: searchResults.length, totalPages: 1 }} />
            <button onClick={() => setSearchEnabled(false)} className="mt-2 text-xs text-[var(--accent)] font-medium hover:underline">Clear search</button>
          </div>
        )}

        {/* Three-column: Deadlines + Overview + AI Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <DeadlinesCard deadlines={MOCK_DEADLINES} />
          <OverviewCard stats={MOCK_OVERVIEW} />
          <Link href="/dashboard/research-2" className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--accent)]/30 transition-all group flex flex-col">
            <MessageSquare className="w-8 h-8 text-[var(--accent)] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">AI Legal Assistant</h3>
            <p className="text-xs text-[var(--text-muted)] flex-1">Research case law, draft notices, analyze documents with AI.</p>
            <span className="mt-3 text-xs font-semibold text-[var(--accent)]">Open Research &rarr;</span>
          </Link>
        </div>

        {/* Cases Table */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">All Cases</h3>
          <CasesTable data={paginatedCases} onPageChange={setPage} onSort={handleSort} />
        </div>
      </div>
    </div>
  );
}
