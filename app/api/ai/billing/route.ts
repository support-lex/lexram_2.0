/**
 * POST /api/ai/billing
 *
 * AI Billing Opportunity Finder for LexRam case management.
 * Analyses incoming case data and returns:
 *  - Billable events identified from hearings / orders / stage
 *  - Pending action items that need to be filed / done
 *  - Drafted email to client
 *  - Drafted WhatsApp / SMS message to client
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_API_URL = 'https://api.z.ai/api/paas/v4/chat/completions';

interface CaseContext {
  cnr?: string;
  caseType?: string;
  caseName?: string;
  court?: string;
  stage?: string;
  nextHearing?: string;
  petitioner?: string;
  respondent?: string;
  petitionerAdvocate?: string;
  act?: string;
  section?: string;
  judge?: string;
  hearingsCount?: number;
  lastHearings?: { date?: string; stage?: string; purpose?: string; judge?: string }[];
  ordersCount?: number;
  lastOrders?: { date?: string; text?: string; type?: string }[];
  documentsCount?: number;
}

export async function POST(request: NextRequest) {
  if (!ZHIPU_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const ctx: CaseContext = body.caseContext ?? {};

    const caseSnapshot = [
      `CNR: ${ctx.cnr ?? 'unknown'}`,
      `Court: ${ctx.court ?? 'unknown'}`,
      `Case Type: ${ctx.caseType ?? 'unknown'}`,
      ctx.caseName ? `Case Name: ${ctx.caseName}` : '',
      ctx.petitioner ? `Petitioner: ${ctx.petitioner}` : '',
      ctx.respondent ? `Respondent: ${ctx.respondent}` : '',
      ctx.petitionerAdvocate ? `Advocate on Record: ${ctx.petitionerAdvocate}` : '',
      ctx.act ? `Act: ${ctx.act}` : '',
      ctx.section ? `Section: ${ctx.section}` : '',
      ctx.judge ? `Current Judge: ${ctx.judge}` : '',
      `Current Stage: ${ctx.stage ?? 'unknown'}`,
      `Next Hearing: ${ctx.nextHearing ?? 'not scheduled'}`,
      `Total Hearings: ${ctx.hearingsCount ?? 0}`,
      `Total Orders: ${ctx.ordersCount ?? 0}`,
      `Documents Filed: ${ctx.documentsCount ?? 0}`,
    ].filter(Boolean).join('\n');

    const hearingHistory = (ctx.lastHearings ?? [])
      .map(h => `  - ${h.date ?? '?'}: ${h.purpose ?? h.stage ?? 'Hearing'} (Judge: ${h.judge ?? 'unknown'})`)
      .join('\n');

    const orderHistory = (ctx.lastOrders ?? [])
      .map(o => `  - ${o.date ?? '?'}: ${o.text ?? o.type ?? 'Order'}`)
      .join('\n');

    const systemPrompt = `You are a senior Indian litigation lawyer and legal practice management expert.
You help advocates identify billing opportunities, file management tasks, and craft clear client communication.
Always be practical, concise, and grounded in Indian court procedure.
Output strict JSON only — no markdown, no explanation outside the JSON object.`;

    const userPrompt = `Analyse this case and return a JSON object with exactly these four keys:

CASE DETAILS:
${caseSnapshot}

RECENT HEARINGS:
${hearingHistory || '  (none)'}

RECENT ORDERS:
${orderHistory || '  (none)'}

Return ONLY this JSON structure:
{
  "opportunities": [
    "string — one billable event per item (e.g. Appearance on 16-03-2026, Drafting written arguments, Filing counter-affidavit)"
  ],
  "tasks": [
    "string — one actionable to-do per item (e.g. File written submissions before next hearing, Update client on interim order dated XX-XX-XXXX, Obtain certified copy of order)"
  ],
  "emailDraft": "Full professional email text to the client. Subject line first, then body. Reference the case CNR, next hearing date, and key update.",
  "messageDraft": "Short WhatsApp / SMS message (under 200 words). Friendly but professional. Include next hearing date and one key action."
}

Rules:
- opportunities: 3–6 items, each clearly billable
- tasks: 3–5 items, each actionable within the next 2 weeks
- emailDraft: formal Indian legal letter style, 150–250 words
- messageDraft: casual but professional, 80–130 words
- If next hearing date is blank, say "date to be confirmed" in the drafts
- Do NOT include any text outside the JSON object`;

    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `AI API error: ${errText}` }, { status: 500 });
    }

    const aiData = await response.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? '{}';

    let parsed: {
      opportunities?: string[];
      tasks?: string[];
      emailDraft?: string;
      messageDraft?: string;
    };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {};
    }

    return NextResponse.json({
      opportunities: parsed.opportunities ?? [],
      tasks:         parsed.tasks         ?? [],
      emailDraft:    parsed.emailDraft    ?? '',
      messageDraft:  parsed.messageDraft  ?? '',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
