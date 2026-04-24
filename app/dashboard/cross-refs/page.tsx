'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Network, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { LexramAPI, type Act } from '@/lib/lexram/api';

interface GraphShape {
  nodes: Array<{ id?: string | number; label?: string; type?: string; [k: string]: unknown }>;
  edges: Array<{ from?: string | number; to?: string | number; source?: string | number; target?: string | number; [k: string]: unknown }>;
}

function hasGraphShape(v: unknown): v is GraphShape {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return Array.isArray(o.nodes) && Array.isArray(o.edges);
}

const NODE_COLORS: Record<string, string> = {
  act: '#C2A35F',
  circular: '#0284c7',
  rule: '#7c3aed',
  sub_legislation: '#7c3aed',
  subleg: '#7c3aed',
  amendment: '#e11d48',
  schedule: '#0d9488',
  section: '#6366f1',
};

function nodeColor(type?: string): string {
  if (!type) return '#94A3B8';
  return NODE_COLORS[type.toLowerCase()] ?? '#94A3B8';
}

export default function CrossRefsPage() {
  const router = useRouter();
  const [act, setAct] = useState<Act | null>(null);
  const [ecosystem, setEcosystem] = useState<unknown>(null);
  const [linked, setLinked] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const acts = await LexramAPI.acts({ limit: 1 });
        const first = Array.isArray(acts) ? acts[0] : null;
        if (!first) throw new Error('No acts available');
        if (cancelled) return;
        setAct(first);
        const [eco, lnk] = await Promise.all([
          LexramAPI.actEcosystem(first.id).catch(() => null),
          LexramAPI.actLinked(first.id).catch(() => null),
        ]);
        if (cancelled) return;
        setEcosystem(eco);
        setLinked(lnk);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message || 'Failed to load ecosystem');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const ecosystemGraph = hasGraphShape(ecosystem) ? ecosystem : null;
  const linkedGraph = hasGraphShape(linked) ? linked : null;

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <button
            onClick={() => router.push('/dashboard/acts')}
            className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Acts
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-gold-700" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-charcoal-900">Legislative Ecosystem</h1>
              <p className="text-sm text-charcoal-500">
                {act ? act.name : 'Exploring example act'}
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}

          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-rose-700 mb-3">{error}</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {!loading && !error && act && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl border border-charcoal-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-charcoal-700 mb-3">Ecosystem</h2>
                {ecosystemGraph ? (
                  <EcosystemGraph graph={ecosystemGraph} />
                ) : ecosystem != null ? (
                  <pre className="text-xs font-mono text-charcoal-700 bg-charcoal-50 rounded-lg p-4 overflow-auto max-h-96">
                    {JSON.stringify(ecosystem, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-charcoal-500">No ecosystem data</p>
                )}
              </section>

              <section className="bg-white rounded-xl border border-charcoal-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-charcoal-700 mb-3">Linked Entities</h2>
                {linkedGraph ? (
                  <EcosystemGraph graph={linkedGraph} />
                ) : linked != null ? (
                  <pre className="text-xs font-mono text-charcoal-700 bg-charcoal-50 rounded-lg p-4 overflow-auto max-h-96">
                    {JSON.stringify(linked, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-charcoal-500">No linked data</p>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function EcosystemGraph({ graph }: { graph: GraphShape }) {
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-charcoal-400 mb-2">
            Nodes ({nodes.length})
          </p>
          <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-2">
            {nodes.map((n, i) => {
              const label =
                (typeof n.label === 'string' && n.label) ||
                (typeof (n as { name?: unknown }).name === 'string' && (n as { name?: string }).name) ||
                String(n.id ?? i);
              const type = typeof n.type === 'string' ? n.type : undefined;
              return (
                <li key={`${n.id ?? i}`} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: nodeColor(type) }}
                  />
                  <span className="truncate text-charcoal-700">{label}</span>
                  {type && <span className="text-xs text-charcoal-400 shrink-0">{type}</span>}
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-charcoal-400 mb-2">
            Edges ({edges.length})
          </p>
          <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-2">
            {edges.map((e, i) => {
              const from = e.from ?? e.source ?? '—';
              const to = e.to ?? e.target ?? '—';
              return (
                <li key={i} className="text-xs font-mono text-charcoal-600">
                  {String(from)} → {String(to)}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-charcoal-500 hover:text-charcoal-800">View raw</summary>
        <pre className="mt-2 font-mono text-charcoal-700 bg-charcoal-50 rounded-lg p-3 overflow-auto max-h-80">
          {JSON.stringify(graph, null, 2)}
        </pre>
      </details>
    </div>
  );
}
