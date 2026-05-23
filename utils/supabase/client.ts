// TSR-only browser Supabase client.
//
// The TSR (Title Scrutiny Report) module connects to a DIFFERENT Supabase
// project than the rest of the app — the same one the Lex-Doc-Analyzer
// FastAPI backend (lex-doc-analyzer.onrender.com) writes to. Without this
// the frontend would create cases in the main lexram supabase while the
// backend writes scrutiny reports to a different DB, and the two would
// never meet.
//
// We use `createClient` from `@supabase/supabase-js` directly (NOT
// `createBrowserClient` from `@supabase/ssr`). `createBrowserClient`
// keeps a module-level cachedBrowserClient that is shared across every
// call in the browser — once @/lib/supabase/client instantiates the
// lexram client, every later `createBrowserClient(...)` invocation
// returns that cached lexram client and silently ignores the URL/key
// we pass. Using `createClient` directly gives us a fresh, isolated
// client pointed at the TSR project.
//
// Anything outside /app/dashboard/tsr should use @/lib/supabase/client
// (the main lexram supabase project) for auth and everything else.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_TSR_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_TSR_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // No session needed — we read the user from the lexram client and
    // pass user_id explicitly to every query. A separate localStorage
    // key keeps the SDK from clobbering the lexram session token.
    persistSession: false,
    autoRefreshToken: false,
    storageKey: 'lexram-tsr-supabase',
  },
})
