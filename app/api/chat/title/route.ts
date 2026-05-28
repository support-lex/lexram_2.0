// Generates a short, descriptive title for a chat session based on the first
// user message. Uses the same Zhipu/z.ai backend as the rest of the app.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_API_URL = 'https://api.z.ai/api/paas/v4/chat/completions';

const SYSTEM_PROMPT = `You generate concise titles for legal-research chat sessions.
Rules:
- Output ONLY the title, no quotes, no preamble, no trailing punctuation.
- 3-6 words maximum.
- Use title case.
- Capture the legal topic, not the question phrasing.
Examples:
  Input:  "What are the grounds for anticipatory bail under BNSS?"
  Output: Anticipatory Bail Under BNSS
  Input:  "Limitation period for specific performance of contract"
  Output: Specific Performance Limitation
  Input:  "Mental cruelty in divorce - Supreme Court tests"
  Output: Mental Cruelty Divorce Tests`;

export async function POST(request: NextRequest) {
  try {
    const { message } = (await request.json()) as { message?: string };
    const trimmed = (message ?? '').trim();
    if (!trimmed) {
      return NextResponse.json({ title: 'New Conversation' });
    }

    // Fallback title (used if the AI call fails or key is missing).
    const fallback = trimmed.slice(0, 60).replace(/\s+/g, ' ').trim() || 'New Conversation';

    if (!ZHIPU_API_KEY) {
      return NextResponse.json({ title: fallback });
    }

    const res = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ZHIPU_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: trimmed.slice(0, 600) },
        ],
      }),
      // Don't let title generation block the user — give up after 8s.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ title: fallback });
    }

    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? '';
    const cleaned = raw
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^title:\s*/i, '')
      .split('\n')[0]
      .trim()
      .slice(0, 80);

    return NextResponse.json({ title: cleaned || fallback });
  } catch (err) {
    console.error('[api/chat/title] error', err);
    return NextResponse.json({ title: 'New Conversation' });
  }
}
