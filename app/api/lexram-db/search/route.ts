import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Supabase Studio pg-meta admin endpoint. Creds stay server-side.
const STUDIO_BASE = process.env.SUPABASE_STUDIO_BASE || 'http://139.59.74.49:8000';
const ADMIN_USER = process.env.SUPABASE_ADMIN_USER || 'supabase';
const ADMIN_PASSWORD = process.env.SUPABASE_ADMIN_PASSWORD || '';

function clean(s: string): string {
  // Allow letters/digits/space/dash/dot/underscore/& — strip everything else
  // so we can safely interpolate into SQL string literals.
  return s
    .replace(/[^a-zA-Z0-9 \-._&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

async function runSql<T>(sql: string, timeoutMs = 8000): Promise<T> {
  const basic = Buffer.from(`${ADMIN_USER}:${ADMIN_PASSWORD}`).toString('base64');
  const ac = AbortSignal.timeout(timeoutMs);
  const r = await fetch(`${STUDIO_BASE}/api/platform/pg-meta/default/query`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${basic}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ query: sql }),
    signal: ac,
    cache: 'no-store',
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`pg-meta ${r.status}: ${body.slice(0, 300)}`);
  }
  return (await r.json()) as T;
}

interface ActRow {
  id: string;
  name: string;
  year: number | null;
  domain: string | null;
  ministry: string | null;
}

interface CircularRow {
  id: number | string;
  subject: string;
  ministry: string | null;
  issue_date: string | null;
  circular_type: string | null;
}

interface SubLegRow {
  id: number | string;
  name: string;
  doc_type: string | null;
  year: number | null;
  ministry: string | null;
}

interface SectionRow {
  id: number | string;
  section_number: string | null;
  heading: string | null;
  category_id: number | null;
}

interface AmendmentRow {
  id: number;
  amendment_act_name: string | null;
  amendment_year: number | null;
  act_id: string | null;
  status: string | null;
}

interface SearchResponse {
  q: string;
  acts: ActRow[];
  circulars: CircularRow[];
  sub_legislation: SubLegRow[];
  sections: SectionRow[];
  amendments: AmendmentRow[];
  elapsedMs: number;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('q') ?? '';
  const q = clean(raw);
  if (!q) {
    return NextResponse.json({ error: 'missing q' }, { status: 400 });
  }

  const start = Date.now();

  const safeQ = q.replace(/\$/g, '');
  const tokens = safeQ.split(/\s+/).filter((t) => t.length >= 2).slice(0, 6);
  const fullPattern = `%${safeQ}%`;
  const ftsPattern = safeQ;

  // For each (tokens x candidate columns), build AND-of-OR ILIKE clauses so
  // multi-word queries like "digital lending" match even when the literal
  // substring doesn't appear in a single field.
  const buildTokenWhere = (columns: string[]): string => {
    const cols = columns.map((c) => `COALESCE(${c}, '')`);
    if (tokens.length === 0) {
      return cols.map((c) => `${c} ILIKE $q$${fullPattern}$q$`).join(' OR ');
    }
    return tokens
      .map((tok) => {
        const like = `%${tok}%`;
        return '(' + cols.map((c) => `${c} ILIKE $q$${like}$q$`).join(' OR ') + ')';
      })
      .join(' AND ');
  };

  // Keep the searched columns to short fields only — text-heavy columns
  // (preamble, description, section body) cause seq-scan timeouts with no
  // pg_trgm/GIN indexes in place.
  const actsWhere = buildTokenWhere(['name', 'short_name', 'full_name']);
  const subLegWhere = buildTokenWhere(['name', 'short_title']);
  const sectionsWhere = buildTokenWhere(['heading']);
  const amendmentsWhere = buildTokenWhere(['amendment_act_name']);

  const queries = {
    acts: `SELECT id, name, year, domain, ministry FROM acts WHERE ${actsWhere} ORDER BY CASE WHEN name ILIKE $q$${fullPattern}$q$ THEN 0 ELSE 1 END, year DESC NULLS LAST LIMIT 15`,
    circulars: `SELECT id, subject, ministry, issue_date, circular_type FROM circulars WHERE search_vector @@ plainto_tsquery('english', $q$${ftsPattern}$q$) ORDER BY issue_date DESC NULLS LAST LIMIT 15`,
    sub_legislation: `SELECT id, name, doc_type, year, ministry FROM subordinate_legislation WHERE ${subLegWhere} ORDER BY year DESC NULLS LAST LIMIT 15`,
    sections: `SELECT id, section_number, heading, category_id FROM sections WHERE ${sectionsWhere} LIMIT 15`,
    amendments: `SELECT id, amendment_act_name, amendment_year, act_id, status FROM amendments WHERE ${amendmentsWhere} ORDER BY amendment_year DESC NULLS LAST LIMIT 10`,
  };

  try {
    const [acts, circulars, sub_legislation, sections, amendments] = await Promise.all([
      runSql<ActRow[]>(queries.acts, 15000).catch(() => []),
      runSql<CircularRow[]>(queries.circulars, 15000).catch(() => []),
      runSql<SubLegRow[]>(queries.sub_legislation, 15000).catch(() => []),
      runSql<SectionRow[]>(queries.sections, 15000).catch(() => []),
      runSql<AmendmentRow[]>(queries.amendments, 10000).catch(() => []),
    ]);

    const payload: SearchResponse = {
      q,
      acts,
      circulars,
      sub_legislation,
      sections,
      amendments,
      elapsedMs: Date.now() - start,
    };
    return NextResponse.json(payload, {
      headers: { 'cache-control': 'private, max-age=30' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'search_failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
