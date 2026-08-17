// Daily Vercel Cron entry point. Runs `publish_due_blogs()` to flip any
// scheduled post whose time has come into `published`. Configured in vercel.json.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically when
  // CRON_SECRET is set in the project's env vars.
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb.rpc('publish_due_blogs');
    if (error) {
      log('error', 'cron', 'publish_due_blogs RPC failed', { message: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const published = typeof data === 'number' ? data : 0;
    log('info', 'cron', 'Published due blogs', { count: published });
    return NextResponse.json({ ok: true, published, ranAt: new Date().toISOString() });
  } catch (e) {
    log('error', 'cron', 'publish-scheduled cron crashed', {
      error: e instanceof Error ? e.message : 'unknown',
    });
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
