// Client-side API wrapper. All calls go through the /api/lexram/[...path]
// Next.js proxy route which forwards to the backend at https://139.59.74.49
// (self-signed TLS, IP-only — browser cannot call it directly).

export const LEXRAM_API_BASE = '/api/lexram';

export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  const r = await fetch(`${LEXRAM_API_BASE}/${path.replace(/^\//, '')}${qs}`, {
    headers: { accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`API ${path} failed: ${r.status}`);
  return (await r.json()) as T;
}

// ----- Response shapes (pruned to what the UI uses) -----

export interface DashboardStats {
  acts: number;
  sections: number;
  subordinate_legislation: number;
  circulars: number;
  amendments: number;
  schedules: number;
}

export interface PulseEvent {
  type: 'circular' | 'amendment' | 'act';
  id: string | number;
  title: string;
  subtype?: string;
  event_date: string;
  ministry?: string | null;
}

export interface RecentCircular {
  id: string;
  circular_number: string | null;
  circular_type: string | null;
  subject: string;
  ministry: string | null;
  issue_date: string | null;
  effective_date: string | null;
  pdf_url: string | null;
}

export interface RecentAmendment {
  id: number;
  act_id: string | null;
  amendment_act_name: string | null;
  amendment_year: number | null;
  amendment_date: string | null;
  status: string | null;
}

export interface DashboardRecent {
  circulars: RecentCircular[];
  amendments: RecentAmendment[];
}

export interface DashboardDomain {
  domain: string;
  act_count: string | number;
  circular_count: string | number;
  subleg_count: string | number;
  sample_acts?: string[];
}

export interface DashboardMinistry {
  ministry: string;
  count: string | number;
}

export interface Act {
  id: string;
  name: string;
  year: number | null;
  domain: string | null;
  act_number: string | null;
  ministry: string | null;
  status: string | null;
  short_name?: string | null;
  full_name?: string | null;
  preamble?: string | null;
  indiacode_id?: string | null;
  indiacode_act_id?: string | null;
  category?: string | null;
  act?: string | null;
  applicability?: string | null;
  introduction?: string | null;
  procedural_note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ActFull extends Act {
  chapters?: ActChapter[];
  sections?: ActSection[];
}

export interface ActChapter {
  id: string | number;
  name?: string;
  title?: string;
  order?: number;
  sections?: ActSection[];
}

export interface ActSection {
  id: number | string;
  number: string;
  heading: string;
  content?: string;
  ai_summary?: string | null;
  chapter_title?: string;
}

export interface Paginated<T> {
  data: T[];
  pagination?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
  total?: number;
}

export interface Circular {
  id: string;
  circular_number: string | null;
  circular_type: string | null;
  subject: string;
  issuing_authority: string | null;
  ministry: string | null;
  gazette_number: string | null;
  gazette_date: string | null;
  issue_date: string | null;
  effective_date: string | null;
  has_content: boolean;
  pdf_url: string | null;
  hindi_pdf_url: string | null;
  act_id: string | null;
  sub_leg_id: string | null;
}

export interface SubLegislation {
  id: string;
  name: string;
  short_title?: string | null;
  doc_type: string;
  year: number | null;
  ministry: string | null;
  department?: string | null;
  enforcement_status: string | null;
  effective_date: string | null;
  enactment_date: string | null;
  act_id?: string | null;
  summary?: string | null;
}

export interface Amendment {
  id: number;
  act_id: string | null;
  amendment_act_id: string | null;
  amendment_act_name: string | null;
  amendment_year: number | null;
  amendment_date: string | null;
  amendment_type: string | null;
  description: string | null;
  sections_affected: number[] | null;
  is_consolidated: boolean;
  status: string | null;
  notification_no: string | null;
  notification_date: string | null;
  gazette_ref: string | null;
  effective_date: string | null;
}

export interface Schedule {
  id: string;
  act_id: string | null;
  sub_leg_id: string | null;
  indiacode_aid?: string | null;
  indiacode_rid?: string | null;
  schedule_number: string;
  title: string;
  content?: string;
}

export interface SearchResults {
  acts?: Act[];
  sections?: ActSection[];
  circulars?: Circular[];
}

export interface Industry {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  icon: string | null;
  color: string | null;
  level: number;
  parent_code: string | null;
  persona_tags?: string[];
  related_industries?: string[];
  sort_order?: number;
  entity_count: number;
}

export interface BurdenIndustry {
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  acts: number;
  sections: number;
  circulars: number;
  sub_legislation: number;
  judgments: number;
  total: number;
  burden_score: string | number;
}

export interface IndustryRelation {
  source_code: string;
  source_name: string;
  target_code: string;
  target_name: string;
  shared_entities: number;
}

export interface IndustryImpact {
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  relevance: number;
  is_primary: boolean;
  tag_source: string;
}

export interface AmendmentChainNode {
  id: number;
  act_id: string | null;
  amendment_act_id: string | null;
  amendment_act_name: string | null;
  amendment_year: number | null;
  amendment_date: string | null;
  amendment_type: string | null;
  status: string | null;
  depth: number;
}

export interface Court {
  id: string;
  name: string;
  short_name: string;
  court_type: string;
  jurisdiction: string;
  established_year: number | null;
  state: string | null;
  is_appellate: boolean;
  is_active: boolean;
}

export interface Judgment {
  id: string | number;
  title: string;
  court?: string;
  court_id?: string;
  date?: string;
  citation?: string;
  act_id?: string;
  summary?: string;
  [k: string]: unknown;
}

// ----- Strongly-typed fetchers -----

export const LexramAPI = {
  dashboardStats: () => apiGet<DashboardStats>('dashboard/stats'),
  dashboardPulse: () => apiGet<PulseEvent[]>('dashboard/pulse'),
  dashboardRecent: () => apiGet<DashboardRecent>('dashboard/recent'),
  dashboardDomains: () => apiGet<DashboardDomain[]>('dashboard/domains'),
  dashboardMinistries: () => apiGet<DashboardMinistry[]>('dashboard/ministries'),

  acts: (params?: { limit?: number; offset?: number; domain?: string; ministry?: string; search?: string }) =>
    apiGet<Act[]>('acts', params),
  act: (id: string) => apiGet<ActFull>(`acts/${id}`),
  actVersions: (id: string) => apiGet<unknown>(`acts/${id}/versions`),
  actEcosystem: (id: string) => apiGet<unknown>(`acts/${id}/ecosystem`),
  actLinked: (id: string) => apiGet<unknown>(`acts/${id}/linked`),

  circulars: (params?: { limit?: number; offset?: number; ministry?: string; type?: string; search?: string }) =>
    apiGet<Paginated<Circular>>('circulars', params),
  circular: (id: string | number) => apiGet<Circular>(`circulars/${id}`),
  circularStats: () => apiGet<Array<{ circular_type: string; count: string }>>('circulars/stats'),
  circularMinistries: () => apiGet<Array<{ ministry: string; count: string }>>('circulars/ministries'),

  subLegislation: (params?: { limit?: number; offset?: number; doc_type?: string; ministry?: string; search?: string }) =>
    apiGet<Paginated<SubLegislation>>('sub-legislation', params),
  subLegislationItem: (id: string | number) => apiGet<SubLegislation>(`sub-legislation/${id}`),
  subLegislationStats: () => apiGet<unknown>('sub-legislation/stats'),

  amendments: (params?: { limit?: number; offset?: number; act_id?: string }) =>
    apiGet<Paginated<Amendment>>('amendments', params),
  amendment: (id: string | number) => apiGet<Amendment>(`amendments/${id}`),
  amendmentChain: (id: string | number) => apiGet<{ chain: AmendmentChainNode[] }>(`amendments/${id}/chain`),

  schedules: (params?: { limit?: number; offset?: number; act_id?: string }) =>
    apiGet<Paginated<Schedule>>('schedules', params),

  search: (q: string) => apiGet<SearchResults>('search', { q }),

  industries: () => apiGet<Industry[]>('industries'),
  industry: (code: string) => apiGet<Industry & { children?: Industry[] }>(`industries/${code}`),
  burdenIndex: () => apiGet<BurdenIndustry[]>('industries/burden-index'),
  industryRelations: () => apiGet<IndustryRelation[]>('industries/relations'),
  industryRelationsFor: (code: string) => apiGet<IndustryRelation[]>(`industries/relations/${code}`),
  circularImpact: (id: string | number) => apiGet<IndustryImpact[]>(`industries/circular/${id}/impact`),
  amendmentImpact: (id: string | number) => apiGet<IndustryImpact[]>(`industries/amendment/${id}/impact`),

  judgments: (params?: { limit?: number; offset?: number; court_id?: string; act_id?: string; q?: string }) =>
    apiGet<Paginated<Judgment> | Judgment[]>('judgments', params),
  judgment: (id: string | number) => apiGet<Judgment>(`judgments/${id}`),
  judgmentCitations: (id: string | number) => apiGet<unknown>(`judgments/${id}/citations`),
  judgmentsByAct: (actId: string) => apiGet<Paginated<Judgment> | Judgment[]>(`judgments/by-act/${actId}`),
  courts: () => apiGet<Court[]>('courts'),

  stats: () => apiGet<unknown>('stats'),
};

// Helper: many list endpoints return `{data: [...]}`; others return arrays.
export function unwrap<T>(res: Paginated<T> | T[]): T[] {
  if (Array.isArray(res)) return res;
  return res?.data ?? [];
}
