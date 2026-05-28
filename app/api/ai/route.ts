/**
 * Server-side API proxy for Zhipu AI (z.ai) chat completions.
 * This endpoint handles all AI requests securely from the server side.
 * The API key is protected and never exposed to the client.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_API_URL = 'https://api.z.ai/api/paas/v4/chat/completions';

interface AIRequestBody {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  response_format?: { type: string };
  stream?: boolean;
}

export async function POST(request: NextRequest) {
  if (!ZHIPU_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
  }

  try {
    const body: AIRequestBody = await request.json();

    const model       = body.model       ?? 'glm-5';
    const temperature = body.temperature ?? 0.7;
    const stream      = body.stream      ?? false;

    const zhipuBody = {
      model,
      messages: body.messages,
      temperature,
      ...(body.response_format && { response_format: body.response_format }),
      ...(stream && { stream: true }),
    };

    const zhipuResponse = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify(zhipuBody),
    });

    if (zhipuResponse.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.', details: 'Too many requests to AI service' },
        { status: 429 }
      );
    }

    if (!zhipuResponse.ok) {
      const errorText = await zhipuResponse.text();
      const errorMessage = getStatusMessage(zhipuResponse.status);
      log('error', 'api', `AI API error (${zhipuResponse.status})`, { errorMessage, errorText });
      return NextResponse.json({ error: errorMessage, details: errorText }, { status: zhipuResponse.status });
    }

    if (stream && zhipuResponse.body) {
      const reader = zhipuResponse.body.getReader();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) { controller.close(); break; }
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });
      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const data = await zhipuResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    log('error', 'api', 'AI API route error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: number): string {
  switch (status) {
    case 401: return 'Unauthorized: Invalid API key';
    case 403: return 'Forbidden: Access denied to AI service';
    case 500: return 'Internal server error in AI service';
    default:  return `Zhipu API error (${status})`;
  }
}
