// Service-role Supabase client. SERVER USE ONLY — never import from a "use
// client" component or expose this key to the browser.
//
// Requires SUPABASE_SERVICE_ROLE_KEY in env. Source it from
// supabase.com/dashboard/project/pwzarravsoahyihrdbit/settings/api
// → "service_role" → Reveal.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "supabaseAdmin: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set."
    );
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
