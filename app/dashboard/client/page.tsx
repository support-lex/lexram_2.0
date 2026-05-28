"use client";

import CasesTable from "@/components/tables/CasesTable";
import DeadlinesCard from "@/components/cards/DeadlinesCard";
import { MOCK_CLIENT_CASES, MOCK_CLIENT_HEARINGS } from "@/lib/mock-data";

export default function ClientDashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-[var(--text-primary)]">My Cases</h1>
          <p className="text-xs text-[var(--text-muted)]">Track your ongoing cases and upcoming hearings</p>
        </div>

        {/* Upcoming Hearings */}
        <div className="mb-6">
          <DeadlinesCard deadlines={MOCK_CLIENT_HEARINGS} />
        </div>

        {/* Cases */}
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Your Cases</h3>
        <CasesTable
          data={{ data: MOCK_CLIENT_CASES, total: MOCK_CLIENT_CASES.length, page: 1, pageSize: MOCK_CLIENT_CASES.length, totalPages: 1 }}
          compact
        />
      </div>
    </div>
  );
}
