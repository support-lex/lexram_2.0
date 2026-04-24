'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import {
  LexramAPI,
  unwrap,
  type Circular,
  type SubLegislation,
} from '@/lib/lexram/api';

interface GovDoc {
  id: string;
  title: string;
  ministry: string;
  type: 'Circular' | 'Sub-Legislation';
  subtype: string;
  date: string;
  source_url: string | null;
}

export default function GovDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [subLeg, setSubLeg] = useState<SubLegislation[]>([]);

  const [search, setSearch] = useState('');
  const [ministryFilter, setMinistryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      LexramAPI.circulars({ limit: 100 }),
      LexramAPI.subLegislation({ limit: 100 }),
    ])
      .then(([c, s]) => {
        if (cancelled) return;
        setCirculars(unwrap(c));
        setSubLeg(unwrap(s));
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const documents = useMemo<GovDoc[]>(() => {
    const fromCirc: GovDoc[] = circulars.map((c) => ({
      id: `circ-${c.id}`,
      title: c.subject || 'Untitled',
      ministry: c.ministry ?? c.issuing_authority ?? 'Unknown',
      type: 'Circular',
      subtype: c.circular_type ?? 'Circular',
      date: c.issue_date ?? c.effective_date ?? '',
      source_url: c.pdf_url,
    }));
    const fromSubLeg: GovDoc[] = subLeg.map((s) => ({
      id: `sl-${s.id}`,
      title: s.name || s.short_title || 'Untitled',
      ministry: s.ministry ?? s.department ?? 'Unknown',
      type: 'Sub-Legislation',
      subtype: s.doc_type ?? 'Rule',
      date: s.effective_date ?? s.enactment_date ?? '',
      source_url: null,
    }));
    return [...fromCirc, ...fromSubLeg];
  }, [circulars, subLeg]);

  const ministries = useMemo(
    () => [...new Set(documents.map((d) => d.ministry).filter((m) => m && m !== 'Unknown'))].sort(),
    [documents],
  );

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (ministryFilter && d.ministry !== ministryFilter) return false;
      if (typeFilter && d.type !== typeFilter) return false;
      if (q && !d.title.toLowerCase().includes(q) && !d.subtype.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [documents, search, ministryFilter, typeFilter]);

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-semibold text-charcoal-900">
              Government Documents
            </h1>
            <p className="text-sm text-charcoal-500 mt-1">
              {loading ? 'Loading...' : `${filteredDocs.length} of ${documents.length} documents`}
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center min-h-[64px] py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          )}

          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="text-xs px-3 py-1.5 bg-white border border-rose-300 rounded-md hover:bg-rose-100 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-charcoal-200">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <select
                    value={ministryFilter}
                    onChange={(e) => setMinistryFilter(e.target.value)}
                    className="px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">All Ministries</option>
                    {ministries.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">All Types</option>
                    <option value="Circular">Circular</option>
                    <option value="Sub-Legislation">Sub-Legislation</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-charcoal-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-charcoal-50 border-b border-charcoal-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal-600">
                        Title
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal-600">
                        Ministry
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal-600">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal-600">
                        Subtype
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal-600">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.slice(0, 200).map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b border-charcoal-100 hover:bg-charcoal-50"
                      >
                        <td className="px-4 py-3">
                          {doc.source_url ? (
                            <a
                              href={doc.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-600 hover:underline flex items-center gap-2"
                            >
                              {doc.title} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-charcoal-800">{doc.title}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">{doc.ministry}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              doc.type === 'Circular'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-violet-100 text-violet-700'
                            }`}
                          >
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal-500">{doc.subtype}</td>
                        <td className="px-4 py-3 text-sm text-charcoal-500">{doc.date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDocs.length === 0 && (
                  <div className="p-8 text-center text-charcoal-500">No documents found</div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
