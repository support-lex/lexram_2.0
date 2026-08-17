'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const PROFILE_UPDATED_EVENT = 'lexram:profile-updated';

/**
 * Reads the signed-in user's avatar URL from public.network_profiles.
 * Returns null until the row is loaded or if the user is signed out.
 *
 * Listens for the `lexram:profile-updated` window event so the UI updates
 * the moment another part of the app (Network tab, Settings page) finishes
 * an avatar upload — no full reload needed.
 */
export function useNetworkAvatar(): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const sb = supabase();
      const { data: auth } = await sb.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        if (!cancelled) setUrl(null);
        return;
      }
      const { data } = await sb
        .from('network_profiles')
        .select('avatar_url')
        .eq('id', userId)
        .maybeSingle();
      if (!cancelled) setUrl((data?.avatar_url as string | null) ?? null);
    }

    load();

    const onUpdate = () => load();
    window.addEventListener(PROFILE_UPDATED_EVENT, onUpdate);

    const { data: sub } = supabase().auth.onAuthStateChange(() => load());

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_UPDATED_EVENT, onUpdate);
      sub.subscription.unsubscribe();
    };
  }, []);

  return url;
}

/** Notify all useNetworkAvatar() consumers in the current tab that the
 *  signed-in user's profile (typically the avatar) just changed. */
export function notifyProfileUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}
