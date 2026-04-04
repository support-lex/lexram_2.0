import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCaseWithDetails } from '@/lib/db/database';
import CaseDetailClient from './CaseDetailClient';

interface PageProps {
  params: Promise<{ cnr: string }>;
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { cnr } = await params;
  const cnrUpper = cnr.toUpperCase();

  const caseData = await getCaseWithDetails(cnrUpper);
  if (!caseData) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
        <Link
          href="/dashboard/case-status"
          className="hover:text-[var(--text-primary)] transition-colors font-medium"
        >
          Cases
        </Link>
        <span className="text-[var(--text-muted)]">/</span>
        <span className="text-[var(--text-primary)] font-mono font-bold text-xs uppercase tracking-wider">
          {cnrUpper}
        </span>
      </nav>

      <CaseDetailClient caseData={caseData} />
    </div>
  );
}
