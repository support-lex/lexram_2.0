// Client wrapper for the LexRam Acts FastAPI service.
// All calls go through /api/acts-fastapi/[...path] (Next.js proxy), which
// forwards to ACTS_FASTAPI_BASE (default http://148.113.10.104/acts-fastapi).

export const ACTS_FASTAPI_BASE = '/api/acts-fastapi';

type QueryParam = string | number | boolean | undefined | null;

export async function actsApiGet<T>(
  path: string,
  params?: Record<string, QueryParam>
): Promise<T> {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(
            ([, v]) => v !== undefined && v !== null && v !== ''
          )
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  const r = await fetch(
    `${ACTS_FASTAPI_BASE}/${path.replace(/^\//, '')}${qs}`,
    { headers: { accept: 'application/json' } }
  );
  if (!r.ok) {
    throw new Error(`acts-fastapi ${path} failed: ${r.status}`);
  }
  return (await r.json()) as T;
}

/* ── Shared shapes (mirror of FastAPI schema) ────────────────────────── */

export interface ActSummary {
  id: string;
  name: string;
  short_name?: string | null;
  year?: number | null;
  domain?: string | null;
  ministry?: string | null;
  department?: string | null;
  act_number?: string | null;
  act_type?: string | null;
  sync_status?: string | null;
  status?: string | null;
  description?: string | null;
  enforcement_status?: string | null;
  is_repealed?: boolean | null;
  jurisdiction?: string | null;
  jurisdiction_kind?: string | null;
  category?: string | null;
  state_code?: string | null;
  indiacode_url?: string | null;
  pdf_url?: string | null;
  commencement_date?: string | null;
  enactment_date?: string | null;
  gazette_date?: string | null;
  last_synced_at?: string | null;
  keywords?: string[] | null;
  tags?: string[] | null;
}

export interface SectionDetail {
  id?: string | number | null;
  section_number?: string | null;
  heading?: string | null;
  description?: string | null;
  content?: string | null;
  enforcement_status?: string | null;
  status?: string | null;
}

export interface ChapterDetail {
  id?: string | number | null;
  title?: string | null;
  name?: string | null;
  order?: number | null;
  section?: string | null;
  chapter_number?: string | null;
  chapter_title?: string | null;
  chapter_order?: number | null;
  section_count?: number | null;
  sections?: SectionDetail[] | null;
}

export interface ActDetail extends ActSummary {
  full_name?: string | null;
  preamble?: string | null;
  objectives?: string | null;
  abstract?: string | null;
  statement_of_objects?: string | null;
  introduction?: string | null;
  applicability?: string | null;
  territorial_extent?: string | null;
  long_title?: string | null;
  hindi_title?: string | null;
  gazette_number?: string | null;
  notification_number?: string | null;
  repealed_by?: string | null;
  pdf_page_count?: number | null;
  chapters?: ChapterDetail[] | null;
  total_sections?: number | null;
  total_chapters?: number | null;
}

export interface PaginatedActs {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: ActSummary[];
}

export interface ActStats {
  total_acts: number;
  synced: number;
  pending: number;
  syncing: number;
  error: number;
  domains: number;
  unique_ministries: number;
  repealed: number;
  with_pdf: number;
}

/** /domains, /ministries, /categories, /departments — all return [{name, count}] shape */
export interface NamedCount {
  name?: string | null;
  domain?: string | null;
  ministry?: string | null;
  category?: string | null;
  department?: string | null;
  count?: number | null;
}

/** /years returns [{year, count}] */
export interface YearCount {
  year: number;
  count: number;
}

/** /acts/{id}/instruments — instrument shape inferred (rules/circulars/notifications) */
export interface Instrument {
  id?: string | null;
  name?: string | null;
  title?: string | null;
  short_title?: string | null;
  instrument_type?: string | null;
  doc_type?: string | null;
  type?: string | null;
  number?: string | null;
  ministry?: string | null;
  issue_date?: string | null;
  effective_date?: string | null;
  enactment_date?: string | null;
  gazette_date?: string | null;
  pdf_url?: string | null;
  url?: string | null;
  [k: string]: unknown;
}

/* ── Query parameter shapes ──────────────────────────────────────────── */

export interface ActsListParams {
  page?: number;
  limit?: number;
  domain?: string;
  ministry?: string;
  department?: string;
  year?: number;
  year_from?: number;
  year_to?: number;
  act_type?: string;
  state_code?: string;
  jurisdiction_kind?: 'central' | 'state' | 'ut' | string;
  jurisdiction?: string;
  category?: string;
  enforcement_status?: 'in_force' | 'repealed' | 'unknown' | string;
  is_repealed?: boolean;
  has_pdf?: boolean;
  keyword?: string;
  tag?: string;
  commencement_from?: string;
  commencement_to?: string;
  sync_status?: 'synced' | 'pending' | 'syncing' | 'error' | string;
  sort_by?:
    | 'name'
    | 'year'
    | 'domain'
    | 'ministry'
    | 'sync_status'
    | 'enforcement_status'
    | 'commencement_date'
    | string;
  sort_order?: 'asc' | 'desc';
}

export interface ActsSearchParams {
  q: string;
  page?: number;
  limit?: number;
  domain?: string;
  jurisdiction_kind?: string;
  category?: string;
  enforcement_status?: string;
  is_repealed?: boolean;
  has_pdf?: boolean;
  year_from?: number;
  year_to?: number;
}

/* ── Strongly-typed fetchers ─────────────────────────────────────────── */

export const ActsAPI = {
  health: () => actsApiGet<{ status: string }>('health'),

  acts: (params?: ActsListParams) =>
    actsApiGet<PaginatedActs>('acts', params as Record<string, QueryParam>),

  search: (params: ActsSearchParams) =>
    actsApiGet<PaginatedActs>(
      'acts/search',
      params as unknown as Record<string, QueryParam>
    ),

  act: (id: string) => actsApiGet<ActDetail>(`acts/${encodeURIComponent(id)}`),

  chapters: (id: string) =>
    actsApiGet<ChapterDetail[] | { data: ChapterDetail[] } | string>(
      `acts/${encodeURIComponent(id)}/chapters`
    ),

  instruments: (id: string, limit = 100) =>
    actsApiGet<Instrument[] | { data: Instrument[] }>(
      `acts/${encodeURIComponent(id)}/instruments`,
      { limit }
    ),

  byDomain: (
    domain: string,
    params?: { page?: number; limit?: number; sort_by?: string; sort_order?: 'asc' | 'desc' }
  ) =>
    actsApiGet<PaginatedActs>(
      `domains/${encodeURIComponent(domain)}/acts`,
      params as Record<string, QueryParam>
    ),

  byMinistry: (
    ministry: string,
    params?: { page?: number; limit?: number }
  ) =>
    actsApiGet<PaginatedActs>(
      `ministries/${encodeURIComponent(ministry)}/acts`,
      params as Record<string, QueryParam>
    ),

  stats: () => actsApiGet<ActStats>('stats'),

  domains: (sort_by: 'name' | 'count' = 'count') =>
    actsApiGet<unknown>('domains', { sort_by }).then((r) =>
      normaliseCounts(r, 'domain')
    ),

  ministries: (limit = 50) =>
    actsApiGet<unknown>('ministries', { limit }).then((r) =>
      normaliseCounts(r, 'ministry')
    ),

  categories: (sort_by: 'name' | 'count' = 'count') =>
    actsApiGet<unknown>('categories', { sort_by }).then((r) =>
      normaliseCounts(r, 'category')
    ),

  departments: (limit = 100, sort_by: 'name' | 'count' = 'count') =>
    actsApiGet<unknown>('departments', { limit, sort_by }).then((r) =>
      normaliseCounts(r, 'department')
    ),

  years: () =>
    actsApiGet<unknown>('years').then((r) => normaliseYears(r)),
};

/* ── Helpers ─────────────────────────────────────────────────────────── */

/** Endpoints in the spec mark their list responses with `Schema: "string"` but
 * actually return arrays. Some legacy callers may also wrap in `{data: []}`.
 * Use this to normalise. */
export function unwrapList<T>(
  res: T[] | { data: T[] } | string | unknown
): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && 'data' in (res as object)) {
    const d = (res as { data: unknown }).data;
    if (Array.isArray(d)) return d as T[];
  }
  if (typeof res === 'string') {
    try {
      const parsed = JSON.parse(res);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Best-effort name extractor for NamedCount records — backend sometimes uses
 *  the column name as the key (domain/ministry/category/department) rather
 *  than a generic `name`. Also tolerates raw strings (when the API returns
 *  just an array of names instead of {name,count} objects). */
export function bucketName(b: NamedCount | string | null | undefined): string {
  if (b == null) return '';
  if (typeof b === 'string') return b;
  if (typeof b !== 'object') return String(b);
  return (
    b.name ??
    b.domain ??
    b.ministry ??
    b.category ??
    b.department ??
    ''
  );
}

/** Coerce the various shapes /domains, /ministries, /categories, /departments
 *  may return into a clean NamedCount[]. Tolerates:
 *    - a bare array of objects     [{domain:'X',count:5}, ...]
 *    - a bare array of strings     ['X', 'Y', ...]
 *    - a wrapped object            {data: [...]}
 *    - a dict map                  {'X': 5, 'Y': 3}
 *    - a JSON-encoded string of any of the above. */
export function normaliseCounts(
  res: unknown,
  field: 'domain' | 'ministry' | 'category' | 'department'
): NamedCount[] {
  if (typeof res === 'string') {
    try {
      return normaliseCounts(JSON.parse(res), field);
    } catch {
      return [];
    }
  }
  if (Array.isArray(res)) {
    return res
      .map((item): NamedCount | null => {
        if (item == null) return null;
        if (typeof item === 'string')
          return { [field]: item, count: null } as NamedCount;
        if (typeof item === 'object')
          return item as NamedCount;
        return null;
      })
      .filter((x): x is NamedCount => x !== null);
  }
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.data)) return normaliseCounts(obj.data, field);
    return Object.entries(obj)
      .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
      .map(([k, v]) => ({
        [field]: k,
        count: typeof v === 'number' ? v : Number(v) || null,
      })) as NamedCount[];
  }
  return [];
}

/** /years normaliser — accepts array of {year,count}, dict {year: count},
 *  or wrapped {data:[...]}. */
export function normaliseYears(res: unknown): YearCount[] {
  if (typeof res === 'string') {
    try {
      return normaliseYears(JSON.parse(res));
    } catch {
      return [];
    }
  }
  if (Array.isArray(res)) {
    return res
      .map((item): YearCount | null => {
        if (!item || typeof item !== 'object') return null;
        const obj = item as Record<string, unknown>;
        const y = Number(obj.year);
        const c = Number(obj.count);
        if (!Number.isFinite(y)) return null;
        return { year: y, count: Number.isFinite(c) ? c : 0 };
      })
      .filter((x): x is YearCount => x !== null);
  }
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.data)) return normaliseYears(obj.data);
    return Object.entries(obj)
      .map(([k, v]) => ({ year: Number(k), count: Number(v) || 0 }))
      .filter((x) => Number.isFinite(x.year));
  }
  return [];
}

/** Best-effort title for instruments. */
export function instrumentTitle(i: Instrument): string {
  return (
    (i.title as string) ??
    (i.name as string) ??
    (i.short_title as string) ??
    (i.number as string) ??
    'Instrument'
  );
}

export function instrumentKind(i: Instrument): string {
  return (
    (i.instrument_type as string) ??
    (i.doc_type as string) ??
    (i.type as string) ??
    'rule'
  );
}
