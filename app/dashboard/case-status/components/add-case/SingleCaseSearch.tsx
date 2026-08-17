'use client';

import { useState } from 'react';
import {
  Search, RefreshCw, AlertCircle, CheckCircle, ExternalLink,
} from 'lucide-react';
import {
  isValidCNR,
  generateDetailedHearings,
} from '@/app/dashboard/case-status/utils';
import type { SearchResult } from '@/app/dashboard/case-status/types';
import { searchByCNR, searchByAdvocate, searchByFiling } from '@/lib/case-status-fetchers/case-status';
import { trackCase } from '@/lib/case-status-fetchers/tracked-cases';

type SearchType = 'cnr' | 'details' | 'advocate' | 'filing';

interface SingleCaseSearchProps {
  onCaseAdded: () => Promise<void>;
  toastSuccess: (msg: string) => void;
  toastError: (msg: string) => void;
}

export function SingleCaseSearch({
  onCaseAdded,
  toastSuccess,
  toastError,
}: SingleCaseSearchProps) {
  const [searchType, setSearchType] = useState<SearchType>('cnr');
  const [cnrNumber, setCnrNumber] = useState('');
  const [detailsForm, setDetailsForm] = useState({
    state: '', district: '', establishment: '',
    case_type: '', case_number: '', year: '', case_name: '',
  });
  const [advocateForm, setAdvocateForm] = useState({
    advocate_name: '', state: '', district: '', establishment: '', year: '',
  });
  const [filingForm, setFilingForm] = useState({
    filing_number: '', court_code: '', state: '', district: '', establishment: '', year: '',
  });
  const [filingResults, setFilingResults] = useState<NonNullable<SearchResult['data']>[]>([]);
  const [advocateResults, setAdvocateResults] = useState<NonNullable<SearchResult['data']>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (searchType === 'cnr') {
      if (!isValidCNR(cnrNumber)) {
        setSearchResult({
          success: false,
          error: 'Invalid CNR format. CNR must be 16 characters (e.g., TNCH090011702023)',
        });
        return;
      }
    }

    setIsSearching(true);
    setSearchResult(null);
    setAdvocateResults([]);
    setFilingResults([]);

    try {
      if (searchType === 'advocate') {
        if (!advocateForm.advocate_name.trim()) {
          setSearchResult({
            success: false,
            error: 'Advocate name is required',
          });
          return;
        }

        const result = await searchByAdvocate({
          advocate_name: advocateForm.advocate_name,
          state_cd: advocateForm.state || undefined,
          district_cd: advocateForm.district || undefined,
          establishment_cd: advocateForm.establishment || undefined,
          case_year: advocateForm.year || undefined,
          async: false,
        });

        if ('job_id' in result) {
          setSearchResult({
            success: false,
            error: 'Search is running in background. Please check back in a few minutes.',
          });
        } else if (result.success && result.data?.cases) {
          const casesWithHearings = result.data.cases
            .filter((c: any): c is NonNullable<typeof c> => c != null)
            .map((c: any) => ({
              ...c,
              hearings: c.hearings?.length ? c.hearings : generateDetailedHearings(c.cnr_number),
            }));
          setAdvocateResults(casesWithHearings);
          if (casesWithHearings.length === 0) {
            setSearchResult({
              success: false,
              error: 'No cases found for this advocate',
            });
          }
        } else {
          setSearchResult({
            success: false,
            error: result.error || 'Search failed',
            ...('error_type' in result ? { error_type: (result as Record<string, unknown>).error_type as string } : {}),
            ...('ecourts_url' in result ? { ecourts_url: (result as Record<string, unknown>).ecourts_url as string } : {}),
          } as SearchResult & { error_type?: string; ecourts_url?: string });
        }
      } else if (searchType === 'filing') {
        if (!filingForm.filing_number.trim()) {
          setSearchResult({
            success: false,
            error: 'Diary/Filing number is required',
          });
          return;
        }

        const result = await searchByFiling({
          filing_number: filingForm.filing_number,
          court_code: filingForm.court_code || undefined,
          state_cd: filingForm.state || undefined,
          district_cd: filingForm.district || undefined,
          establishment_cd: filingForm.establishment || undefined,
          case_year: filingForm.year || undefined,
          async: false,
        });

        if ('job_id' in result) {
          setSearchResult({
            success: false,
            error: 'Search is running in background. Please check back in a few minutes.',
          });
        } else if (result.success && result.data?.cases) {
          const casesWithHearings = result.data.cases
            .filter((c: any): c is NonNullable<typeof c> => c != null)
            .map((c: any) => ({
              ...c,
              hearings: c.hearings?.length ? c.hearings : generateDetailedHearings(c.cnr_number),
            }));
          setFilingResults(casesWithHearings);
          if (casesWithHearings.length === 0) {
            setSearchResult({
              success: false,
              error: 'No cases found for this diary number',
            });
          }
        } else {
          setSearchResult({
            success: false,
            error: result.error || 'Search failed',
            ...('error_type' in result ? { error_type: (result as Record<string, unknown>).error_type as string } : {}),
            ...('ecourts_url' in result ? { ecourts_url: (result as Record<string, unknown>).ecourts_url as string } : {}),
          } as SearchResult & { error_type?: string; ecourts_url?: string });
        }
      } else {
        const result: SearchResult = await searchByCNR(cnrNumber);

        if (result.success && result.data) {
          if (!result.data.hearings?.length) {
            result.data.hearings = generateDetailedHearings(result.data.cnr_number);
          }
        }

        setSearchResult(result);
      }
    } catch (error) {
      setSearchResult({
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToTracking = async () => {
    if (!searchResult?.data) return;

    try {
      const result = await trackCase({
        cnr_number: searchResult.data.cnr_number,
        case_data: searchResult.data,
        custom_name: searchResult.data.case_title,
      });

      if (result.success) {
        await onCaseAdded();
        toastSuccess(`"${searchResult.data.case_title}" added to tracker`);
        setCnrNumber('');
        setSearchResult(null);
      } else {
        toastError(result.error || 'Failed to add case');
      }
    } catch {
      toastError('Failed to add case to tracker');
    }
  };

  return (
    <>
      {/* Search-type sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['cnr', 'details', 'advocate', 'filing'] as const).map(t => (
          <button
            key={t}
            onClick={() => setSearchType(t)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              searchType === t
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {t === 'cnr' ? 'By CNR Number' : t === 'details' ? 'By Case Details' : t === 'advocate' ? 'By Advocate' : 'By Diary No.'}
          </button>
        ))}
      </div>

      {/* CNR Search Form */}
      {searchType === 'cnr' ? (
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
              CNR Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g., TNCH090011702023"
                value={cnrNumber}
                onChange={(e) => setCnrNumber(e.target.value.toUpperCase())}
                className={`w-full px-3 py-2.5 bg-[var(--bg-surface)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 font-mono text-sm text-[var(--text-primary)] ${
                  cnrNumber.length > 0
                    ? isValidCNR(cnrNumber)
                      ? 'border-emerald-400'
                      : 'border-red-400'
                    : 'border-[var(--border-default)]'
                }`}
                required
              />
              {cnrNumber.length > 0 && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono ${
                  isValidCNR(cnrNumber)
                    ? 'text-emerald-500'
                    : cnrNumber.length > 16
                      ? 'text-red-500'
                      : 'text-[var(--text-muted)]'
                }`}>
                  {cnrNumber.length}/16
                </span>
              )}
            </div>
            <p className="text-xs mt-1.5 flex items-center gap-1">
              {cnrNumber.length === 0 ? (
                <span className="text-[var(--text-muted)]">
                  Enter the 16-character CNR. Separate multiple CNRs with commas for bulk import.
                </span>
              ) : isValidCNR(cnrNumber) ? (
                <><CheckCircle className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600 font-medium">Valid CNR format</span></>
              ) : (
                <><AlertCircle className="w-3 h-3 text-red-500" /><span className="text-red-600 font-medium">CNR must be exactly 16 alphanumeric characters</span></>
              )}
            </p>
          </div>
          <button
            type="submit"
            disabled={isSearching || !cnrNumber}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Searching…</>
              : <><Search className="w-4 h-4" /> Search Case Status</>
            }
          </button>
        </form>
      ) : searchType === 'details' ? (
        /* Case Details Form */
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'state', label: 'State', placeholder: 'e.g., Delhi', required: true, type: 'input' },
              { key: 'district', label: 'District', placeholder: 'e.g., Delhi', required: true, type: 'input' },
              { key: 'establishment', label: 'Court Complex', placeholder: 'e.g., District Court', required: true, type: 'input' },
              { key: 'case_number', label: 'Case Number', placeholder: 'e.g., 1234', required: true, type: 'input' },
              { key: 'year', label: 'Year', placeholder: 'e.g., 2024', required: true, type: 'input' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={(detailsForm as Record<string, string>)[field.key]}
                  onChange={e => setDetailsForm({ ...detailsForm, [field.key]: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
                  required={field.required}
                />
              </div>
            ))}

            {/* Case Type select */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                Case Type <span className="text-red-500">*</span>
              </label>
              <select
                value={detailsForm.case_type}
                onChange={e => setDetailsForm({ ...detailsForm, case_type: e.target.value })}
                className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
                required
              >
                <option value="">Select type</option>
                <option value="CS">Civil Suit</option>
                <option value="CRM">Criminal Case</option>
                <option value="RAP">Revision Appeal</option>
                <option value="SUIT">Suit</option>
                <option value="WP">Writ Petition</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
              Case Name (for reference)
            </label>
            <input
              type="text"
              placeholder="e.g., Sharma v. State of Haryana"
              value={detailsForm.case_name}
              onChange={e => setDetailsForm({ ...detailsForm, case_name: e.target.value })}
              className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-xl disabled:opacity-50 transition-colors"
          >
            {isSearching
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Searching…</>
              : <><Search className="w-4 h-4" /> Search Case Status</>
            }
          </button>
        </form>
      ) : searchType === 'advocate' ? (
        /* Advocate Search Form */
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
              Advocate Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., G.R. Hari"
              value={advocateForm.advocate_name}
              onChange={e => setAdvocateForm({ ...advocateForm, advocate_name: e.target.value })}
              className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                State
              </label>
              <input
                type="text"
                placeholder="e.g., Tamil Nadu"
                value={advocateForm.state}
                onChange={e => setAdvocateForm({ ...advocateForm, state: e.target.value })}
                className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                District
              </label>
              <input
                type="text"
                placeholder="e.g., Chennai"
                value={advocateForm.district}
                onChange={e => setAdvocateForm({ ...advocateForm, district: e.target.value })}
                className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                Court Complex
              </label>
              <input
                type="text"
                placeholder="e.g., District Court"
                value={advocateForm.establishment}
                onChange={e => setAdvocateForm({ ...advocateForm, establishment: e.target.value })}
                className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                Year
              </label>
              <input
                type="text"
                placeholder="e.g., 2024"
                value={advocateForm.year}
                onChange={e => setAdvocateForm({ ...advocateForm, year: e.target.value })}
                className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-xl disabled:opacity-50 transition-colors"
          >
            {isSearching
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Searching…</>
              : <><Search className="w-4 h-4" /> Search by Advocate</>
            }
          </button>
        </form>
      ) : searchType === 'filing' ? (
        /* Diary/Filing Number Search Form */
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
              Diary / Filing Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., 19012/2025"
              value={filingForm.filing_number}
              onChange={e => setFilingForm({ ...filingForm, filing_number: e.target.value })}
              className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                Court Code
              </label>
              <input
                type="text"
                placeholder="e.g., SLP (for Supreme Court)"
                value={filingForm.court_code}
                onChange={e => setFilingForm({ ...filingForm, court_code: e.target.value })}
                className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                Year
              </label>
              <input
                type="text"
                placeholder="e.g., 2025"
                value={filingForm.year}
                onChange={e => setFilingForm({ ...filingForm, year: e.target.value })}
                className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                State
              </label>
              <input
                type="text"
                placeholder="e.g., Delhi"
                value={filingForm.state}
                onChange={e => setFilingForm({ ...filingForm, state: e.target.value })}
                className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                District
              </label>
              <input
                type="text"
                placeholder="e.g., New Delhi"
                value={filingForm.district}
                onChange={e => setFilingForm({ ...filingForm, district: e.target.value })}
                className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-xl disabled:opacity-50 transition-colors"
          >
            {isSearching
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Searching…</>
              : <><Search className="w-4 h-4" /> Search by Diary No.</>
            }
          </button>
        </form>
      ) : null}

      {/* Search Result */}
      {searchResult && (
        <div className="mt-2">
          {searchResult.success && searchResult.data ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-3">
                <CheckCircle className="w-4 h-4" />
                Case found — add to tracking?
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Title', value: searchResult.data.case_title },
                  { label: 'CNR', value: searchResult.data.cnr_number },
                  { label: 'Status', value: searchResult.data.status },
                  { label: 'Next Hearing', value: searchResult.data.next_hearing_date },
                ].map(row => (
                  <div key={row.label} className="flex justify-between gap-4">
                    <span className="text-emerald-700 font-medium">{row.label}</span>
                    <span className="font-sans font-semibold text-emerald-900 text-right">{row.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddToTracking}
                className="mt-4 w-full px-4 py-2.5 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-xl transition-colors"
              >
                Add to Tracking List
              </button>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">
                  {searchResult.error || 'Case not found. Please verify the details and try again.'}
                </p>
                {(searchResult as SearchResult & { error_type?: string; ecourts_url?: string }).error_type === 'captcha_required' && (
                  <a
                    href="https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 underline underline-offset-2"
                  >
                    Open eCourts website to search manually
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advocate Search Results (multiple cases) */}
      {advocateResults.length > 0 && (
        <div className="mt-2 space-y-3">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">
            Found {advocateResults.length} case{advocateResults.length !== 1 ? 's' : ''}
          </h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {advocateResults.map((caseItem, idx) => (
              <div key={idx} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-sans font-semibold text-[var(--text-primary)] text-sm truncate">
                      {caseItem.case_title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      CNR: {caseItem.cnr_number} · {caseItem.case_number}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Status: {caseItem.status} · Next: {caseItem.next_hearing_date}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const result = await trackCase({
                          cnr_number: caseItem.cnr_number,
                          case_data: caseItem,
                          custom_name: caseItem.case_title,
                        });
                        if (result.success) {
                          toastSuccess(`"${caseItem.case_title}" added to tracker`);
                          setAdvocateResults(prev => prev.filter((_, i) => i !== idx));
                          if (advocateResults.length === 1) {
                            await onCaseAdded();
                          }
                        } else {
                          toastError(result.error || 'Failed to add case');
                        }
                      } catch {
                        toastError('Failed to add case');
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={async () => {
              let added = 0;
              for (const caseItem of advocateResults) {
                try {
                  const result = await trackCase({
                    cnr_number: caseItem.cnr_number,
                    case_data: caseItem,
                    custom_name: caseItem.case_title,
                  });
                  if (result.success) added++;
                } catch {
                  // ignore individual errors
                }
              }
              toastSuccess(`${added} case${added !== 1 ? 's' : ''} added to tracker`);
              await onCaseAdded();
            }}
            className="w-full px-4 py-2.5 text-sm font-bold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] rounded-xl transition-colors"
          >
            Add All {advocateResults.length} Cases
          </button>
        </div>
      )}

      {/* Filings Search Results */}
      {filingResults.length > 0 && (
        <div className="mt-2 space-y-3">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">
            Found {filingResults.length} case{filingResults.length !== 1 ? 's' : ''}
          </h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filingResults.map((caseItem, idx) => (
              <div key={idx} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-sans font-semibold text-[var(--text-primary)] text-sm truncate">
                      {caseItem.case_title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      CNR: {caseItem.cnr_number} · {caseItem.case_number}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Status: {caseItem.status} · Next: {caseItem.next_hearing_date}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const result = await trackCase({
                          cnr_number: caseItem.cnr_number,
                          case_data: caseItem,
                          custom_name: caseItem.case_title,
                        });
                        if (result.success) {
                          toastSuccess(`"${caseItem.case_title}" added to tracker`);
                          setFilingResults(prev => prev.filter((_, i) => i !== idx));
                          if (filingResults.length === 1) {
                            await onCaseAdded();
                          }
                        } else {
                          toastError(result.error || 'Failed to add case');
                        }
                      } catch {
                        toastError('Failed to add case');
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={async () => {
              let added = 0;
              for (const caseItem of filingResults) {
                try {
                  const result = await trackCase({
                    cnr_number: caseItem.cnr_number,
                    case_data: caseItem,
                    custom_name: caseItem.case_title,
                  });
                  if (result.success) added++;
                } catch {
                  // ignore individual errors
                }
              }
              toastSuccess(`${added} case${added !== 1 ? 's' : ''} added to tracker`);
              await onCaseAdded();
            }}
            className="w-full px-4 py-2.5 text-sm font-bold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] rounded-xl transition-colors"
          >
            Add All {filingResults.length} Cases
          </button>
        </div>
      )}

      {/* CNR Help */}
      <div className="p-4 bg-[var(--bg-sidebar)]/5 border border-[var(--bg-sidebar)]/10 rounded-xl">
        <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          About CNR Numbers
        </h4>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          The Case Number Registration (CNR) is a unique 16-character identifier for each
          case in the eCourts system. You can find it on your case documents or at the
          eCourts portal.
        </p>
        <a
          href="https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[var(--bg-sidebar)] hover:text-[var(--accent)] transition-colors"
        >
          Visit eCourts Portal <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </>
  );
}
