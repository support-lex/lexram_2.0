// TSR-only browser Supabase client.
//
// The TSR (Title Scrutiny Report) module connects to a DIFFERENT Supabase
// project than the rest of the app — the same one the Lex-Doc-Analyzer
// FastAPI backend (lex-doc-analyzer.onrender.com) writes to. Without this
// the frontend would create cases in the main lexram supabase while the
// backend writes scrutiny reports to a different DB, and the two would
// never meet.
//
// Anything outside /app/dashboard/tsr should use @/lib/supabase/client
// (the main lexram supabase project) for auth and everything else.

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_TSR_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_TSR_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseKey)
