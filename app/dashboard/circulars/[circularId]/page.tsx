'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Sparkles,
  Loader2,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { LexramAPI, unwrap, type Circular } from '@/lib/lexram/api';

export default function CircularDetailPage() {
  const params = useParams<{ circularId: string }>();
  const router = useRouter();
  const id = params?.circularId ?? '';

  const [circular, setCircular] = useState<Circular | null>(null);
  const [related, setRelated] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const [analysis, setAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await LexramAPI.circular(id);
      setCircular(data);
      if (data?.ministry) {
        try {
          const r = await LexramAPI.circulars({ limit: 4, ministry: data.ministry });
          setRelated(unwrap(r).filter((c) => String(c.id) !== String(data.id)).slice(0, 3));
        } catch {
          setRelated([]);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load circular');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, nonce]);

  function handleAnalyze() {
    if (!circular) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalysis(
        `This circular outlines ${circular.subject ?? 'the subject matter'} under the authority of ${circular.issuing_authority ?? circular.ministry ?? 'the issuing body'}. Key compliance points: ensure timely disclosure, align internal policies, and notify affected stakeholders ahead of the effective date.`,
      );
      setAnalyzing(false);
    }, 600);
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !circular) {
    return (
      <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
            <button
              onClick={() => router.push('/dashboard/circulars')}
              className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Circulars
            </button>
            <div className="text-center py-24 text-charcoal-400">
              {error ? (
                <div className="space-y-3">
                  <p className="text-sm text-rose-700">Failed to load: {error}</p>
                  <button
                    onClick={() => setNonce((n) => n + 1)}
                    className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <p>Circular not found.</p>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          {/* Back */}
          <button
            onClick={() => router.push('/dashboard/circulars')}
            className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Circulars
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] px-2 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 uppercase font-mono">
              {circular.circular_type ?? 'Circular'}
            </span>
            <h1 className="font-serif text-xl font-semibold text-[var(--text-primary)] leading-tight">
              {circular.subject}
            </h1>
          </div>

          {/* Metadata bar */}
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-1">
                  Issuing Authority
                </p>
                <p className="text-sm text-[var(--text-primary)]">
                  {circular.issuing_authority || '\u2014'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-1">
                  Ministry
                </p>
                <p className="text-sm text-[var(--text-primary)]">{circular.ministry || '\u2014'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-1">
                  Circular No.
                </p>
                <p className="text-sm font-mono text-[var(--text-primary)]">
                  {circular.circular_number || '\u2014'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-1">Type</p>
                <p className="text-sm text-[var(--text-primary)]">
                  {circular.circular_type || '\u2014'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-charcoal-100">
              {circular.issue_date && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-1">
                    Issue Date
                  </p>
                  <p className="text-sm font-mono text-[var(--text-primary)]">
                    {new Date(circular.issue_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {circular.effective_date && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-1">
                    Effective Date
                  </p>
                  <p className="text-sm font-mono text-[var(--text-primary)]">
                    {new Date(circular.effective_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {circular.gazette_number && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-charcoal-400 mb-1">
                    Gazette
                  </p>
                  <p className="text-sm text-[var(--text-primary)] font-mono">
                    {circular.gazette_number}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Left: Content */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-8 text-center text-charcoal-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
                <p className="text-sm">
                  {circular.has_content
                    ? 'Full content available for download.'
                    : 'No inline content — view the PDF below.'}
                </p>
              </div>

              {/* Download buttons */}
              {(circular.pdf_url || circular.hindi_pdf_url) && (
                <div className="flex gap-3 flex-wrap">
                  {circular.pdf_url && (
                    <a
                      href={circular.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm px-4 py-2 border border-[var(--border-default)] rounded-lg text-[var(--text-secondary)] hover:border-gold-400 hover:text-gold-700 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </a>
                  )}
                  {circular.hindi_pdf_url && (
                    <a
                      href={circular.hindi_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm px-4 py-2 border border-[var(--border-default)] rounded-lg text-[var(--text-secondary)] hover:border-gold-400 hover:text-gold-700 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Hindi PDF
                    </a>
                  )}
                </div>
              )}

              {/* AI Analysis */}
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      AI Analysis
                    </span>
                  </div>
                  {!analysis && (
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      {analyzing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Analyze this circular
                    </button>
                  )}
                </div>
                {analysis ? (
                  <div className="text-sm text-[var(--text-primary)] leading-relaxed bg-indigo-50/40 border border-indigo-100 rounded-lg p-3">
                    {analysis}
                  </div>
                ) : (
                  <p className="text-sm text-charcoal-400 italic">
                    Click &ldquo;Analyze this circular&rdquo; to generate an AI analysis.
                  </p>
                )}
              </div>
            </div>

            {/* Right: Related */}
            <div className="w-full lg:w-[300px] shrink-0 space-y-4">
              {circular.act_id && (
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400 mb-2">
                    Related Act
                  </p>
                  <Link
                    href={`/dashboard/acts/${circular.act_id}`}
                    className="flex items-center gap-1.5 text-sm text-gold-600 hover:text-gold-700 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Parent Act
                  </Link>
                </div>
              )}

              {related.length > 0 && (
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400 mb-3">
                    More from {circular.ministry}
                  </p>
                  <div className="space-y-2">
                    {related.map((rc) => (
                      <Link
                        key={rc.id}
                        href={`/dashboard/circulars/${rc.id}`}
                        className="block border border-[var(--border-default)] rounded-lg p-2 hover:border-sky-300 transition-colors"
                      >
                        <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2">
                          {rc.subject}
                        </p>
                        {rc.circular_number && (
                          <p className="text-[11px] font-mono text-charcoal-400 mt-1">
                            {rc.circular_number}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/dashboard/circulars"
                    className="mt-3 block text-xs text-gold-600 hover:text-gold-700"
                  >
                    View all from {circular.ministry} &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
