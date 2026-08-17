'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  askMoefccStream,
  clusterSearchMoefcc,
  type MoefccCluster,
  type MoefccSource,
} from '@/lib/rag-client';

export type MoefccMode = 'quick' | 'answer';

export type MoefccStage = 'idle' | 'retrieve' | 'generate' | 'done' | 'error';

export interface MoefccState {
  mode: MoefccMode;
  query: string;
  loading: boolean;
  stage: MoefccStage;
  /** Flat best-chunk-per-cluster list. Populated in both modes. */
  sources: MoefccSource[];
  /** Full cluster objects with multiple chunks per parent. */
  clusters: MoefccCluster[];
  answer: string;
  error: string | null;
  timing: { embed: number; search: number } | null;
}

const INITIAL: MoefccState = {
  mode: 'answer',
  query: '',
  loading: false,
  stage: 'idle',
  sources: [],
  clusters: [],
  answer: '',
  error: null,
  timing: null,
};

/** Convert a cluster to the flat MoefccSource shape consumed by existing UI. */
function clusterToSource(cl: MoefccCluster): MoefccSource {
  return {
    title: cl.raw_title ?? cl.theme,
    content: cl.best_chunk.content,
    parent_id: cl.parent_id,
    language: cl.language,
    source_type: cl.source_type,
    distance: cl.best_distance,
    theme: cl.theme,
  };
}

export function useMoefccRAG() {
  const [state, setState] = useState<MoefccState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  const run = useCallback(async (query: string, mode: MoefccMode = 'answer', k = 5) => {
    const clean = query.trim();
    if (clean.length < 3) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({
      ...INITIAL,
      mode,
      query: clean,
      loading: true,
      stage: 'retrieve',
    });

    // Quick mode → cluster search only (no LLM answer).
    if (mode === 'quick') {
      try {
        const res = await clusterSearchMoefcc(clean, {
          pool: 30,
          maxClusters: k,
          maxChunksPerCluster: 3,
          label: true,
          signal: ac.signal,
        });
        setState((s) => ({
          ...s,
          loading: false,
          stage: 'done',
          clusters: res.clusters,
          sources: res.clusters.map(clusterToSource),
          timing: { embed: res.timing_ms.embed, search: res.timing_ms.search },
        }));
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return;
        setState((s) => ({
          ...s,
          loading: false,
          stage: 'error',
          error: e instanceof Error ? e.message : 'search_failed',
        }));
      }
      return;
    }

    // Answer mode → streaming RAG (backend uses clustered context by default).
    // Kick off the cluster fetch in parallel so the UI has full chunk context
    // to render while the LLM answer streams in.
    const clusterPromise = clusterSearchMoefcc(clean, {
      pool: 30,
      maxClusters: k,
      maxChunksPerCluster: 3,
      label: true,
      signal: ac.signal,
    }).catch(() => null);

    await askMoefccStream(
      clean,
      k,
      {
        onMeta: (timing) =>
          setState((s) => ({ ...s, stage: 'retrieve', timing })),
        onSources: (sources) =>
          setState((s) => ({ ...s, stage: 'generate', sources })),
        onAnswerChunk: (text) =>
          setState((s) => ({ ...s, answer: s.answer + text })),
        onDone: () =>
          setState((s) => ({ ...s, loading: false, stage: 'done' })),
        onError: (msg) =>
          setState((s) => ({ ...s, loading: false, stage: 'error', error: msg })),
      },
      ac.signal,
    );

    // Merge in the full cluster objects (if the parallel call finished).
    const clusters = await clusterPromise;
    if (clusters && !ac.signal.aborted) {
      setState((s) => ({
        ...s,
        clusters: clusters.clusters,
        // Prefer cluster-derived sources if stream delivered fewer.
        sources: s.sources.length >= clusters.clusters.length
          ? s.sources
          : clusters.clusters.map(clusterToSource),
      }));
    }
  }, []);

  return { state, run, reset };
}
