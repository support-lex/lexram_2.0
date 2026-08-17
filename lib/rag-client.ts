// Typed client for the LexMatrix RAG endpoint, routed through
// the same-origin /api/rag proxy so browsers don't hit the self-signed cert.

// Pulls the friendly message out of a normalized proxy error body. Our proxy
// routes return `{ error, message, retry_after_seconds? }` for upstream
// failures (see lib/upstream-error.ts), so prefer that over a generic "HTTP
// 503" string. Falls back to a sensible default if the body isn't JSON.
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json = (await res.clone().json()) as {
      message?: unknown;
      error?: unknown;
      detail?: unknown;
    };
    if (typeof json.message === "string" && json.message.trim()) return json.message;
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail;
  } catch {
    /* not JSON — fall through */
  }
  return fallback;
}

export interface RagSource {
  id: number;
  section: string;
  heading: string;
  content: string;
  act_id: string;
  rerank_score?: number;
}

export interface RagTiming {
  retrieve: number;
  rerank: number;
  generate: number;
  total: number;
}

export interface RagResponse {
  query: string;
  answer: string | null;
  sources: RagSource[];
  timing_ms: RagTiming;
}

export interface RagQueryOptions {
  query: string;
  act_id?: string;
  k?: number;
  rerank?: boolean;
  generate?: boolean;
  signal?: AbortSignal;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; result: RagResponse }>();

function cacheKey(opts: RagQueryOptions): string {
  return JSON.stringify({
    q: opts.query.trim().toLowerCase(),
    a: opts.act_id ?? '',
    k: opts.k ?? 3,
    r: opts.rerank ?? true,
    g: opts.generate ?? true,
  });
}

export async function ragQuery(opts: RagQueryOptions): Promise<RagResponse> {
  const key = cacheKey(opts);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.result;
  }

  const body = {
    query: opts.query.trim(),
    act_id: opts.act_id,
    k: opts.k ?? 3,
    rerank: opts.rerank ?? true,
    generate: opts.generate ?? true,
  };

  const res = await fetch('/api/rag', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (res.status === 400) {
    throw new RagError('Please enter at least 3 characters.', 400);
  }
  if (!res.ok) {
    throw new RagError(
      await readErrorMessage(res, `Search failed (${res.status})`),
      res.status,
    );
  }

  // Backend returns MoEFCC shape { title, content, parent_id, language, source_type, distance }.
  // Normalise to legacy RagResponse shape the existing cards expect.
  const raw = (await res.json()) as {
    query: string;
    answer?: string | null;
    sources?: Array<{
      title?: string;
      content?: string;
      parent_id?: string;
      language?: string;
      source_type?: string;
      distance?: number;
    }>;
    timing_ms?: {
      embed?: number;
      search?: number;
      generate?: number;
      total?: number;
    };
  };

  const sources: RagSource[] = (raw.sources ?? []).map((s, idx) => ({
    id: idx,
    section: s.source_type ?? '',
    heading: s.title ?? '',
    content: s.content ?? '',
    act_id: s.parent_id ?? '',
    rerank_score:
      typeof s.distance === 'number' ? 1 - s.distance : undefined,
  }));

  const normalised: RagResponse = {
    query: raw.query,
    answer: raw.answer ?? null,
    sources,
    timing_ms: {
      retrieve: raw.timing_ms?.search ?? 0,
      rerank: raw.timing_ms?.embed ?? 0,
      generate: raw.timing_ms?.generate ?? 0,
      total: raw.timing_ms?.total ?? 0,
    },
  };

  cache.set(key, { at: Date.now(), result: normalised });
  return normalised;
}

export class RagError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

// Arbitration corpus was retired — all /api/rag calls now flow into the
// MoEFCC pipeline (BGE-M3 + Weaviate). The "All" option keeps the same
// catch-all behaviour without exposing the dead arbitration filter.
export const ACT_FILTERS: Array<{ id?: string; label: string }> = [
  { label: 'All indexed corpora' },
  { id: 'moefcc', label: 'Environmental Law (MoEFCC)' },
];

export const MOEFCC_FILTER_ID = 'moefcc';

// ──────────────────────────────────────────────────────────────────────────
// MoEFCC corpus (environmental law: EIA, forest clearance, pollution rules).
// Separate index/endpoints from the arbitration RAG above.
// ──────────────────────────────────────────────────────────────────────────

export type MoefccSource = {
  title: string;
  content: string;
  parent_id: string;
  language?: 'english' | 'hindi' | 'mixed';
  source_type?: string;
  distance?: number;
  theme?: string;                       // LLM-generated 5-word label
};

// ─── Cluster types ────────────────────────────────────────────────────────
export type MoefccClusterChunk = {
  content: string;
  distance: number;
  length: number;
};

export type MoefccCluster = {
  cluster_id: string;
  parent_id: string;
  theme: string;                         // LLM 5-word label
  raw_title?: string;                    // original document title
  chunk_count: number;
  best_distance: number;
  mean_distance: number;
  source_type?: string;
  language?: 'english' | 'hindi' | 'mixed';
  best_chunk: { content: string; length: number };
  chunks: MoefccClusterChunk[];
};

export type MoefccClusterResponse = {
  query: string;
  clusters: MoefccCluster[];
  total_chunks: number;
  total_clusters: number;
  timing_ms: {
    embed: number;
    search: number;
    cluster: number;
    label: number;
    total: number;
  };
};

export async function clusterSearchMoefcc(
  q: string,
  opts: {
    pool?: number;
    maxClusters?: number;
    maxChunksPerCluster?: number;
    maxDistance?: number;
    label?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<MoefccClusterResponse> {
  const qs = new URLSearchParams({ q });
  if (opts.pool !== undefined) qs.set('pool', String(opts.pool));
  if (opts.maxClusters !== undefined) qs.set('max_clusters', String(opts.maxClusters));
  if (opts.maxChunksPerCluster !== undefined)
    qs.set('max_chunks_per_cluster', String(opts.maxChunksPerCluster));
  if (opts.maxDistance !== undefined) qs.set('max_distance', String(opts.maxDistance));
  if (opts.label !== undefined) qs.set('label', String(opts.label));

  const res = await fetch(`/api/rag/moefcc/clusters?${qs.toString()}`, {
    signal: opts.signal,
    headers: { accept: 'application/json' },
  });
  if (res.status === 400) throw new RagError('Please enter at least 3 characters.', 400);
  if (!res.ok) {
    throw new RagError(
      await readErrorMessage(res, `Cluster search failed (${res.status})`),
      res.status,
    );
  }
  return (await res.json()) as MoefccClusterResponse;
}

export type MoefccRAGResponse = {
  query: string;
  answer: string;
  sources: MoefccSource[];
  timing_ms: { embed: number; search: number; generate: number; total: number };
  cached: boolean;
};

export type MoefccSearchResponse = {
  query: string;
  sources: MoefccSource[];
  timing_ms: { embed: number; search: number; total: number };
};

export type StreamHandlers = {
  onMeta?: (timing: { embed: number; search: number }) => void;
  onSources?: (sources: MoefccSource[]) => void;
  onAnswerChunk?: (text: string) => void;
  onDone?: () => void;
  onError?: (msg: string) => void;
};

const moefccCache = new Map<string, { at: number; result: MoefccRAGResponse | MoefccSearchResponse }>();

function moefccKey(kind: 'ask' | 'search', q: string, k: number): string {
  return `${kind}:${k}:${q.trim().toLowerCase()}`;
}

export async function searchMoefcc(
  q: string,
  k = 5,
  signal?: AbortSignal,
): Promise<MoefccSearchResponse> {
  const key = moefccKey('search', q, k);
  const cached = moefccCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.result as MoefccSearchResponse;
  }
  const res = await fetch(`/api/rag/moefcc/search?q=${encodeURIComponent(q)}&k=${k}`, {
    signal,
    headers: { accept: 'application/json' },
  });
  if (res.status === 400) throw new RagError('Please enter at least 3 characters.', 400);
  if (!res.ok) {
    throw new RagError(
      await readErrorMessage(res, `Search failed (${res.status})`),
      res.status,
    );
  }
  const json = (await res.json()) as MoefccSearchResponse;
  moefccCache.set(key, { at: Date.now(), result: json });
  return json;
}

export async function askMoefcc(
  q: string,
  k = 5,
  signal?: AbortSignal,
): Promise<MoefccRAGResponse> {
  const key = moefccKey('ask', q, k);
  const cached = moefccCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.result as MoefccRAGResponse;
  }
  const res = await fetch(`/api/rag/moefcc?q=${encodeURIComponent(q)}&k=${k}`, {
    signal,
    headers: { accept: 'application/json' },
  });
  if (res.status === 400) throw new RagError('Please enter at least 3 characters.', 400);
  if (!res.ok) {
    throw new RagError(
      await readErrorMessage(res, `Search failed (${res.status})`),
      res.status,
    );
  }
  const json = (await res.json()) as MoefccRAGResponse;
  moefccCache.set(key, { at: Date.now(), result: json });
  return json;
}

// Starter snippet (per spec), adapted to pass an AbortSignal through so
// callers can cancel mid-stream on re-query or unmount.
export async function askMoefccStream(
  q: string,
  k = 3,
  h: StreamHandlers = {},
  signal?: AbortSignal,
): Promise<void> {
  let r: Response;
  try {
    r = await fetch(`/api/rag/moefcc/stream?q=${encodeURIComponent(q)}&k=${k}`, {
      headers: { Accept: 'text/event-stream' },
      signal,
    });
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return;
    h.onError?.(e instanceof Error ? e.message : 'fetch_failed');
    return;
  }
  if (!r.ok || !r.body) {
    h.onError?.(`HTTP ${r.status}`);
    return;
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const blocks = buf.split('\n\n');
      buf = blocks.pop() ?? '';
      for (const block of blocks) {
        const line = block.trim();
        if (!line.startsWith('data:')) continue;
        try {
          const ev = JSON.parse(line.slice(5).trim()) as {
            event: string;
            timing_ms?: { embed: number; search: number };
            sources?: MoefccSource[];
            text?: string;
            detail?: string;
          };
          if (ev.event === 'meta') h.onMeta?.(ev.timing_ms ?? { embed: 0, search: 0 });
          else if (ev.event === 'sources') h.onSources?.(ev.sources ?? []);
          else if (ev.event === 'answer_chunk') h.onAnswerChunk?.(ev.text ?? '');
          else if (ev.event === 'done') {
            h.onDone?.();
            return;
          } else if (ev.event === 'error') h.onError?.(ev.detail ?? 'error');
        } catch {
          // Ignore parse errors on partial frames.
        }
      }
    }
    h.onDone?.();
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return;
    h.onError?.(e instanceof Error ? e.message : 'stream_failed');
  }
}
