// End-to-end verification that the three operator steps worked.

// ───────── 1. GCS bucket CORS ─────────
{
  const res = await fetch('https://storage.googleapis.com/lexram-enterprise-docs/cors-probe', {
    method: 'OPTIONS',
    headers: {
      origin: 'https://lexram-2-0-ui.vercel.app',
      'access-control-request-method': 'PUT',
      'access-control-request-headers': 'content-type',
    },
  });
  const allow = res.headers.get('access-control-allow-origin');
  const ok = allow === 'https://lexram-2-0-ui.vercel.app' || allow === '*';
  console.log(`[${ok ? '✓' : '✗'}] GCS CORS: allow-origin=${allow}`);
}

// ───────── 2. Lexram supabase has cases / documents tables ─────────
{
  const SUPABASE_URL = 'https://pwzarravsoahyihrdbit.supabase.co';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3emFycmF2c29haHlpaHJkYml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjY2OTIsImV4cCI6MjA5MDYwMjY5Mn0.2RQDL1ZezawmbgBMGrjppuh1R1rilngd2MsI_h9fY9k';
  for (const table of ['cases', 'documents']) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    });
    // Without a session, RLS will return [] for protected tables that exist;
    // 404 / "relation does not exist" means the migration wasn't applied.
    const body = await res.text();
    const exists = res.status === 200 || (res.status === 401 && body.includes('JWT'));
    const notFound = body.includes('does not exist') || body.includes('PGRST205') || res.status === 404;
    console.log(`[${exists && !notFound ? '✓' : '✗'}] lexram.${table}: status=${res.status} body=${body.slice(0, 100)}`);
  }
}

// ───────── 3. Render backend still happy on CORS, still reachable ─────────
{
  const res = await fetch('https://lex-doc-analyzer.onrender.com/health');
  console.log(`[${res.status === 200 ? '✓' : '✗'}] Backend /health: ${res.status}`);
}
