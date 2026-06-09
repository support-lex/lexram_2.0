// Browser Supabase client. Use in client components ('use client').
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Supabase serialises every auth operation (getSession, token refresh,
  // INITIAL_SESSION emission) behind a cross-tab navigator Web Lock. The default
  // acquire timeout is 5s, so with several lexram tabs open (or a suspended tab
  // still holding the lock) getSession() can stall up to 5s before the orphaned
  // lock is stolen. That stall was long enough for our readiness failsafe to
  // fire and report `user: null`, so a logged-in user briefly looked like a
  // guest after a refresh ("please sign up"). A shorter 2.5s timeout makes the
  // lock self-heal quickly so auth state resolves fast and with the CORRECT
  // user. Steal recovery is built in and safe (auth-js does not steal back).
  //
  // `lockAcquireTimeout` is a real GoTrueClient option read at runtime by
  // @supabase/ssr → supabase-js, but the SSR wrapper's `auth` type omits it —
  // hence the cast.
  const options = {
    auth: { lockAcquireTimeout: 2500 },
  } as unknown as Parameters<typeof createBrowserClient>[2];
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options,
  );
}

// Singleton — safe to reuse a single browser client across the app.
let _client: ReturnType<typeof createClient> | null = null;
export function supabase() {
  if (!_client) _client = createClient();
  return _client;
}
