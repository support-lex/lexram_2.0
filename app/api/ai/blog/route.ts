// Proxy to the LexRam backend's AI blog generator.
//
// Browsers call /api/ai/blog with the request body; this route forwards to
// the upstream at LEXRAM_API_URL (default https://api.lexram.ai) and attaches
// the user's Supabase JWT so the upstream can enforce admin access. The
// local admin gate below is a fail-fast — the upstream gates the same way.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

const UPSTREAM_BASE = process.env.LEXRAM_API_URL ?? 'https://api.lexram.ai';
const UPSTREAM_URL = `${UPSTREAM_BASE.replace(/\/$/, '')}/api/ai/blog`;

// The upstream advertises a 120s timeout for AI generation; give it a
// touch more so its own 504 surfaces instead of being masked by ours.
const TIMEOUT_MS = 125_000;

export async function POST(request: NextRequest) {
  const sb = await createSupabaseServerClient();
  const { data: sessionData } = await sb.auth.getSession();
  const session = sessionData.session;
  const token = session?.access_token;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user.user_metadata as { role?: string } | null)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.text();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
      signal: ctrl.signal,
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch (err) {
    if ((err as { name?: string } | null)?.name === 'AbortError') {
      return NextResponse.json({ error: 'AI timed out (>120s)' }, { status: 504 });
    }
    log('error', 'api', 'AI blog proxy unreachable', {
      url: UPSTREAM_URL,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'AI backend unreachable' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
