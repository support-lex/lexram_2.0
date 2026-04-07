// User profile shape used across the app. With Supabase Auth this is sourced
// from the authenticated user's `user_metadata` (set at signup time) and the
// session is managed by @supabase/ssr cookies — no manual JWT handling.

import type { User } from '@supabase/supabase-js';

export interface StoredUser {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country?: string;
}

export function userFromSupabase(u: User | null | undefined): StoredUser | null {
  if (!u) return null;
  const m = (u.user_metadata ?? {}) as Record<string, string>;
  return {
    first_name: m.first_name ?? '',
    last_name: m.last_name ?? '',
    // For phone-auth users, Supabase's `u.email` will be empty — fall back to
    // the email we stored in user_metadata at signup time.
    email: u.email ?? m.email ?? '',
    phone: u.phone ?? m.phone ?? '',
    country: m.country ?? '',
  };
}
