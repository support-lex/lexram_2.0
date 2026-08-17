"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/**
 * Lightweight client-side check: does the signed-in user have
 * `app_metadata.role === "super_admin"`?
 *
 * Reads the current session from the supabase singleton (no network call —
 * the role is baked into the JWT at sign-in), then stays in sync via
 * onAuthStateChange. Server-side access control still relies on the API's
 * own 403 response — this hook only governs whether to *show* admin
 * affordances in the UI.
 */
export function useIsSuperAdmin(): boolean {
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    let mounted = true;
    const sb = supabase();

    const read = (user: { app_metadata?: Record<string, unknown> } | null | undefined) => {
      const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role;
      if (mounted) setIsSuper(role === "super_admin");
    };

    sb.auth.getSession().then(({ data }) => read(data.session?.user));

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        read(session?.user);
      }
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return isSuper;
}
