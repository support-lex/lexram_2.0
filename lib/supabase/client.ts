// Browser Supabase client. Use in client components ('use client').
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton — safe to reuse a single browser client across the app.
let _client: ReturnType<typeof createClient> | null = null;
export function supabase() {
  if (!_client) _client = createClient();
  return _client;
}
