import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_URL = 'https://api.z.ai/api/paas/v4/chat/completions';

interface DbSearchResult {
  q: string;
  acts: Array<{ id: string; name: string; year: number | null; domain: string | null; ministry: string | null }>;
  circulars: Array<{ id: string | number; subject: string; ministry: string | null; issue_date: string | null; circular_type: string | null }>;
  sub_legislation: Array<{ id: string | number; name: string; doc_type: string | null; year: number | null; ministry: string | null }>;
  sections: Array<{ id: string | number; section_number: string | null; heading: string | null; category_id: number | null }>;
  amendments: Array<{ id: number; amendment_act_name: string | null; amendment_year: number | null; act_id: string | null; status: string | null }>;
  elapsedMs: number;
}

function buildContext(results: DbSearchResult): string {
  const parts: string[] = [];
  if (results.acts.length) {
    parts.push('## Acts');
    results.acts.slice(0, 8).forEach((a) => {
      parts.push(`- [act:${a.id}] ${a.name}${a.year ? ` (${a.year})` : ''}${a.ministry ? ` — ${a.ministry}` : ''}`);
    });
  }
  if (results.circulars.length) {
    parts.push('## Circulars');
    results.circulars.slice(0, 8).forEach((c) => {
      const d = c.issue_date ? ` (${c.issue_date.slice(0, 10)})` : '';
      parts.push(`- [circular:${c.id}] ${c.subject}${d}${c.ministry ? ` — ${c.ministry}` : ''}`);
    });
  }
  if (results.sub_legislation.length) {
    parts.push('## Subordinate Legislation');
    results.sub_legislation.slice(0, 6).forEach((s) => {
      parts.push(`- [sub-leg:${s.id}] ${s.name}${s.year ? ` (${s.year})` : ''}${s.doc_type ? ` [${s.doc_type}]` : ''}`);
    });
  }
  if (results.amendments.length) {
    parts.push('## Amendments');
    results.amendments.slice(0, 6).forEach((a) => {
      parts.push(`- [amendment:${a.id}] ${a.amendment_act_name ?? 'Amendment'}${a.amendment_year ? ` (${a.amendment_year})` : ''}${a.status ? ` — ${a.status}` : ''}`);
    });
  }
  if (results.sections.length) {
    parts.push('## Sections');
    results.sections.slice(0, 6).forEach((s) => {
      parts.push(`- [section:${s.id}] §${s.section_number ?? '?'} ${s.heading ?? ''}`);
    });
  }
  return parts.join('\n');
}

export async function POST(req: NextRequest) {
  if (!ZHIPU_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500 });
  }

  let q = '';
  try {
    const body = await req.json();
    q = (body?.q ?? '').toString().trim();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid body' }), { status: 400 });
  }
  if (!q) {
    return new Response(JSON.stringify({ error: 'missing q' }), { status: 400 });
  }

  // 1) Run DB search via the internal proxy (same origin).
  const origin = new URL(req.url).origin;
  let results: DbSearchResult;
  try {
    const dbRes = await fetch(`${origin}/api/lexram-db/search?q=${encodeURIComponent(q)}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!dbRes.ok) throw new Error(`db search ${dbRes.status}`);
    results = (await dbRes.json()) as DbSearchResult;
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'db_search_failed', message: e instanceof Error ? e.message : 'unknown' }),
      { status: 502 },
    );
  }

  // 2) Stream grounded AI answer from Zhipu.
  const context = buildContext(results);
  const systemPrompt = `You are LexRam's legal research assistant for Indian law. Answer concisely using ONLY the retrieved context. When you cite a source, use the marker format [act:ID], [circular:ID], [sub-leg:ID], [amendment:ID], or [section:ID] inline. If the context is empty or doesn't answer the question, say so and suggest refining the query. Keep the answer under 180 words. Never invent IDs or titles.`;

  const userPrompt = `Question: ${q}\n\nRetrieved context:\n${context || '(no results)'}\n\nAnswer with citations.`;

  const upstream = await fetch(ZHIPU_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-5',
      stream: true,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return new Response(
      JSON.stringify({ error: 'ai_upstream_failed', status: upstream.status, detail: text.slice(0, 300) }),
      { status: 502 },
    );
  }

  // Forward the SSE stream with a custom preamble that ships the raw
  // results as a JSON event before the answer tokens arrive.
  const preamble = `event: results\ndata: ${JSON.stringify(results)}\n\n`;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      await writer.write(encoder.encode(preamble));
      const reader = upstream.body!.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
    } catch {
      /* swallow */
    } finally {
      try {
        await writer.close();
      } catch {
        /* already closed */
      }
    }
  })();

  return new Response(readable, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}
