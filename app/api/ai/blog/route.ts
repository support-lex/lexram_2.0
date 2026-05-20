// AI blog generator. Wraps Zhipu (z.ai) with a system prompt tuned for
// LexRam's legal-tech blog. Returns clean HTML that drops straight into
// the TipTap editor.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { BLOG_CATEGORIES } from '@/types/blog';

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_API_URL = 'https://api.z.ai/api/paas/v4/chat/completions';

const SYSTEM_PROMPT_REPLACE = `You write blog posts for LexRam, a legal-AI platform serving Indian advocates.

Output ONLY a JSON object. No preamble, no markdown, no code fences.

Schema:
{
  "title": string,             // 50-80 chars, compelling, no clickbait
  "subtitle": string,          // 80-160 chars, clarifies the angle
  "category": string,          // MUST be one of: ${BLOG_CATEGORIES.join(', ')}
  "tags": string[],            // 4-8 lowercase tags, hyphen-separated for multi-word (e.g. "data-privacy")
  "meta_title": string,        // <= 60 chars, SEO-friendly
  "meta_description": string,  // <= 160 chars, SEO-friendly
  "html": string               // body HTML — start with <h2>, do NOT include <h1> (the title field is separate)
}

For "html":
- Allowed tags only: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>, <code>, <pre>, <a href>.
- Do NOT use <html>, <body>, <head>, <div>, <span>, <br>, inline styles, classes, or scripts.
- 600 to 1100 words.
- Confident, plainspoken, professional. No filler ("In today's world", "It is important to note").
- Indian legal context where relevant — name acts, sections, recent landmark judgments by year.
- Concrete examples over abstract claims.
- Optionally one <blockquote> for a key takeaway.

If the user's prompt is vague, pick a specific angle and write the post. Do not ask clarifying questions.`;

const SYSTEM_PROMPT_CONTINUE = `You continue an in-progress LexRam blog post.

Output ONLY a JSON object. No preamble, no markdown, no code fences.

Schema:
{ "html": string }

For "html":
- Allowed tags only: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>, <code>, <pre>, <a href>.
- Continue in the same voice and tone as the existing content.
- 200-500 words.
- Do NOT repeat anything already written.
- Do NOT include <h1> (or restart the title).`;

// Structured source pulled from a LexRam research thread. When this is present
// we bypass the 2000-char prompt cap (researchSource is curated, not free text)
// and we mechanically append the authorities, mermaid diagrams, and drafts to
// the AI's narrative so the blog reliably contains every artifact the lawyer
// already produced in the research session.
interface ResearchAuthority {
  caseName?: string;
  citation?: string;
  court?: string;
  year?: string;
  proposition?: string;
}
interface ResearchSourcePayload {
  topic?: string;
  questions?: string[];
  answers?: string[];
  authorities?: ResearchAuthority[];
  mermaids?: string[];
  drafts?: string[];
}

interface BlogAIRequest {
  prompt: string;
  title?: string;
  mode?: 'replace' | 'continue';
  existingHtml?: string;
  researchSource?: ResearchSourcePayload;
}

interface ReplaceResult {
  title: string;
  subtitle: string;
  category: string | null;
  tags: string[];
  meta_title: string;
  meta_description: string;
  html: string;
}

export async function POST(request: NextRequest) {
  if (!ZHIPU_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
  }

  // Admin-only — same gate as the create page.
  const sb = await createSupabaseServerClient();
  const { data: userData } = await sb.auth.getUser();
  const role = (userData.user?.user_metadata as { role?: string } | null)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: BlogAIRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const prompt = (body.prompt ?? '').trim();
  const hasResearchSource = !!body.researchSource;
  if (!prompt && !hasResearchSource) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }
  // Cap only the free-text prompt; researchSource is structured, internally
  // generated, and can be much larger than 2000 chars.
  if (prompt.length > 2000 && !hasResearchSource) {
    return NextResponse.json({ error: 'Prompt too long (max 2000 chars)' }, { status: 400 });
  }

  const mode = body.mode === 'continue' ? 'continue' : 'replace';
  const userMessage = buildUserMessage({
    prompt,
    title: body.title,
    mode,
    existingHtml: body.existingHtml,
    researchSource: body.researchSource,
  });
  const systemPrompt = mode === 'continue' ? SYSTEM_PROMPT_CONTINUE : SYSTEM_PROMPT_REPLACE;

  try {
    const upstream = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-5',
        temperature: 0.75,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      log('error', 'api', `AI blog upstream error (${upstream.status})`, { errorText });
      const message = upstream.status === 429
        ? 'AI is rate-limited right now. Try again in a minute.'
        : 'AI generation failed.';
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    const data = await upstream.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== 'string' || !raw.trim()) {
      return NextResponse.json({ error: 'AI returned no content' }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripCodeFences(raw));
    } catch (e) {
      log('error', 'api', 'AI blog JSON parse failed', { raw: raw.slice(0, 500), error: (e as Error).message });
      return NextResponse.json({ error: 'AI returned malformed JSON' }, { status: 502 });
    }

    if (mode === 'continue') {
      const html = extractString(parsed, 'html');
      if (!html) return NextResponse.json({ error: 'AI returned empty html' }, { status: 502 });
      return NextResponse.json({ html: stripCodeFences(html) });
    }

    const result = normalizeReplaceResult(parsed);
    if (!result.html) {
      return NextResponse.json({ error: 'AI returned empty html' }, { status: 502 });
    }
    // When the request came from a research thread, append the research's
    // own artifacts to the AI's narrative so they always make it into the
    // blog — even if the model fails to weave them in. Mermaid blocks use
    // the `lexram-mermaid` marker that the blog viewer hydrates client-side.
    if (hasResearchSource && body.researchSource) {
      result.html += renderResearchAppendix(body.researchSource);
    }
    return NextResponse.json(result);
  } catch (error) {
    log('error', 'api', 'AI blog route error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}

function buildUserMessage(opts: {
  prompt: string;
  title?: string;
  mode: 'replace' | 'continue';
  existingHtml?: string;
  researchSource?: ResearchSourcePayload;
}): string {
  const parts: string[] = [];
  if (opts.title?.trim()) {
    parts.push(`The author has already drafted this working title: "${opts.title.trim()}". You may refine it slightly or keep it.`);
  }
  if (opts.researchSource) {
    parts.push(buildResearchBrief(opts.researchSource));
  } else if (opts.prompt) {
    parts.push(`User brief: ${opts.prompt}`);
  }
  if (opts.mode === 'continue' && opts.existingHtml?.trim()) {
    parts.push(
      'Continue the post below. Output ONLY new HTML to append:',
      '---',
      opts.existingHtml.trim(),
      '---',
    );
  } else {
    parts.push('Write the complete post and return the JSON object now.');
  }
  return parts.join('\n\n');
}

// Build a structured brief from a research session for the AI to write around.
// Keep this compact — the AI just needs the topic + the substance of the
// answers + the case names. The verbatim authorities, mermaid, and draft
// payloads are appended to the rendered HTML after generation, not asked of
// the model (which would otherwise hallucinate citations or paraphrase the
// user's careful diagram).
function buildResearchBrief(src: ResearchSourcePayload): string {
  const lines: string[] = [];
  lines.push('This blog must be written from the lawyer\'s own LexRam research thread.');
  if (src.topic) lines.push(`Topic / first question: ${src.topic}`);
  const questions = (src.questions ?? []).filter(Boolean);
  if (questions.length > 1) {
    lines.push('Follow-up questions in the thread:');
    questions.slice(1, 10).forEach((q) => lines.push(`- ${q}`));
  }
  const answers = (src.answers ?? []).filter(Boolean);
  if (answers.length > 0) {
    lines.push('Key findings from the AI legal analysis (use these as the substance — do NOT contradict them):');
    answers.slice(0, 5).forEach((a, i) => {
      const trimmed = a.length > 1200 ? `${a.slice(0, 1200)}…` : a;
      lines.push(`[${i + 1}] ${trimmed}`);
    });
  }
  const auths = (src.authorities ?? []).filter(Boolean);
  if (auths.length > 0) {
    lines.push('Authorities the lawyer relied on (mention them by name; do NOT invent new ones):');
    auths.slice(0, 10).forEach((a) => {
      const bits = [a.caseName, a.citation, a.court, a.year].filter(Boolean).join(' — ');
      if (bits) lines.push(`- ${bits}${a.proposition ? `: ${a.proposition}` : ''}`);
    });
  }
  lines.push(
    'Write a polished blog post that weaves these findings into a coherent narrative.',
    'Do not include a citations list or diagrams in the HTML — those will be appended separately.',
    'Pick a sharp working title, subtitle, category, tags, and SEO meta. 800-1100 words.',
  );
  return lines.join('\n');
}

// Render the appendix that always gets stitched onto the AI's HTML: a clean
// "Authorities" list, mermaid diagrams (with the `lexram-mermaid` marker the
// viewer hydrates), and the lawyer's saved drafts. Sections are skipped when
// their data is empty so a research thread without authorities doesn't ship
// an empty "Authorities cited" header.
function renderResearchAppendix(src: ResearchSourcePayload): string {
  const parts: string[] = [];
  const auths = (src.authorities ?? []).filter(Boolean);
  if (auths.length > 0) {
    parts.push('<h2>Authorities cited</h2>');
    parts.push('<ul>');
    auths.forEach((a) => {
      const head = [a.caseName, a.citation, a.court, a.year].filter(Boolean).join(' — ');
      const prop = a.proposition ? `: ${escapeHtml(a.proposition)}` : '';
      if (head) parts.push(`<li><strong>${escapeHtml(head)}</strong>${prop}</li>`);
    });
    parts.push('</ul>');
  }
  const mermaids = (src.mermaids ?? []).filter((m) => typeof m === 'string' && m.trim());
  if (mermaids.length > 0) {
    parts.push('<h2>Diagrams</h2>');
    mermaids.forEach((m) => {
      // Plain <pre><code> — TipTap's StarterKit codeBlock overrides custom
      // class names (it ships everything as class="blog-code-block"), so we
      // can't rely on a marker class surviving the editor round-trip. Instead
      // the BlogContent client wrapper detects mermaid by its content prefix
      // (graph/flowchart/sequenceDiagram/…), which is preserved verbatim.
      parts.push(`<pre><code>${escapeHtml(m.trim())}</code></pre>`);
    });
  }
  const drafts = (src.drafts ?? []).filter((d) => typeof d === 'string' && d.trim());
  if (drafts.length > 0) {
    parts.push('<h2>Drafts from the research thread</h2>');
    drafts.forEach((d) => {
      // Preserve the lawyer's whitespace; <pre> is allowed by the editor.
      parts.push(`<pre><code>${escapeHtml(d.trim())}</code></pre>`);
    });
  }
  return parts.length ? `\n${parts.join('\n')}\n` : '';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractString(o: unknown, key: string): string | null {
  if (o && typeof o === 'object' && key in o) {
    const v = (o as Record<string, unknown>)[key];
    if (typeof v === 'string') return v;
  }
  return null;
}

function normalizeReplaceResult(parsed: unknown): ReplaceResult {
  const o = (parsed && typeof parsed === 'object') ? (parsed as Record<string, unknown>) : {};

  const title = clamp(stringOf(o.title), 1, 120);
  const subtitle = clamp(stringOf(o.subtitle), 0, 240);
  const meta_title = clamp(stringOf(o.meta_title), 0, 60);
  const meta_description = clamp(stringOf(o.meta_description), 0, 160);
  const html = stripCodeFences(stringOf(o.html));

  // Category must match one of the allowed values; otherwise null.
  const rawCategory = stringOf(o.category).trim();
  const category = (BLOG_CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory : null;

  // Tags: take an array, lowercase, slugify spaces, dedupe, cap at 8.
  let tags: string[] = [];
  if (Array.isArray(o.tags)) {
    tags = o.tags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
      .filter(Boolean);
    tags = Array.from(new Set(tags)).slice(0, 8);
  }

  return { title, subtitle, category, tags, meta_title, meta_description, html };
}

function stringOf(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function clamp(s: string, min: number, max: number): string {
  const t = s.trim();
  if (t.length < min) return t;
  return t.length > max ? t.slice(0, max) : t;
}

// Strip ```html ... ``` or ```json ... ``` wrappers if the model adds them despite instructions.
function stripCodeFences(html: string): string {
  let out = html.trim();
  out = out.replace(/^```(?:html|json)?\s*\n?/i, '');
  out = out.replace(/\n?```\s*$/, '');
  return out.trim();
}
