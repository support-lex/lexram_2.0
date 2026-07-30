"use client";

import { useEffect, useState } from "react";

/**
 * Does the signed-in user pass the /dashboard/admin/stats gate
 * (profiles.is_super_admin)?
 *
 * Distinct from useIsSuperAdmin(), which reads app_metadata.role out of the JWT.
 * Those are two different lists in this database, so a link shown by one and
 * gated by the other would bounce people. This asks the server for the same
 * verdict the page itself computes.
 *
 * Cached per page load at module scope: the topbar mounts on every dashboard
 * route and the answer cannot change within a session without a re-login.
 */
let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;

function fetchAccess(): Promise<boolean> {
  if (cached !== null) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetch("/api/admin/access", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { isSuperAdmin: false }))
      .then((d: { isSuperAdmin?: boolean }) => {
        cached = Boolean(d.isSuperAdmin);
        return cached;
      })
      .catch(() => false)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useAdminAccess(): boolean {
  const [allowed, setAllowed] = useState(cached ?? false);

  useEffect(() => {
    let mounted = true;
    fetchAccess().then((v) => {
      if (mounted) setAllowed(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return allowed;
}
