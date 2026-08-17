"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/**
 * Does the signed-in user pass the /dashboard/admin/stats gate
 * (profiles.is_super_admin)?
 *
 * Distinct from useIsSuperAdmin(), which reads app_metadata.role out of the JWT.
 * Those are two different lists in this database, so a link shown by one and
 * gated by the other would bounce people. This asks the server for the same
 * verdict the page itself computes.
 *
 * Re-checks on SIGNED_IN/SIGNED_OUT/USER_UPDATED, mirroring useIsSuperAdmin(). An
 * earlier version cached the result forever at module scope on the theory that
 * "the answer cannot change within a session without a re-login" — true, but it
 * never listened for that re-login: if the very first check ran before the
 * session was fully established (a real super-admin account landing on the page
 * right after sign-in) and cached `false`, the nav link stayed hidden for that
 * tab until a hard refresh, no matter how the account was actually provisioned.
 */
export function useAdminAccess(): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const sb = supabase();

    async function check() {
      try {
        const r = await fetch("/api/admin/access", { cache: "no-store" });
        const d = r.ok ? await r.json() : { isSuperAdmin: false };
        if (mounted) setAllowed(Boolean(d.isSuperAdmin));
      } catch {
        if (mounted) setAllowed(false);
      }
    }

    check();

    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        check();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return allowed;
}
