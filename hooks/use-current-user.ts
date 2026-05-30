'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { userFromSupabase, type StoredUser } from '@/modules/auth/storage/userStorage';

/**
 * Reads the currently signed-in user from Supabase Auth and stays in sync via
 * the `onAuthStateChange` event stream (works across tabs out of the box).
 */
export function useCurrentUser(): StoredUser | null {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const sb = supabase();
<<<<<<< HEAD
    // getSession() is cache-only — it does NOT acquire Supabase's auth-token
    // Web Lock. getUser() does, and on the dashboard subtree (where this
    // hook mounts via the topbar on every route) it raced other callers and
    // could stall siblings like useRoleContext for the full lock timeout.
    sb.auth.getSession().then(({ data }) => setUser(userFromSupabase(data.session?.user ?? null)));
=======
    sb.auth.getUser().then(({ data }) => setUser(userFromSupabase(data.user)));
>>>>>>> tsr

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(userFromSupabase(session?.user ?? null));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return user;
}

export function getDisplayName(user: StoredUser | null): string {
  if (!user) return 'Advocate';
  const full = `${user.first_name} ${user.last_name}`.trim();
  return full || user.email || 'Advocate';
}

export function getInitials(user: StoredUser | null): string {
  if (!user) return 'AD';
  const a = user.first_name?.[0] ?? '';
  const b = user.last_name?.[0] ?? '';
  const initials = (a + b).toUpperCase();
  return initials || (user.email?.[0]?.toUpperCase() ?? 'A');
}
