// Compatibility shim — TSR now lives on the main lexram supabase project
// (same one /sign-in authenticates against). Re-exports the lexram client
// instance so existing imports (`import { supabase } from '@/utils/supabase/client'`)
// keep working without touching every TSR file.
//
// Auth, cases, documents — everything is on one project. RLS policies on
// public.cases / public.documents enforce auth.uid() = user_id so every
// signed-up lexram user automatically gets isolated TSR data.

import { supabase as lexramSupabase } from '@/lib/supabase/client'

export const supabase = lexramSupabase()
