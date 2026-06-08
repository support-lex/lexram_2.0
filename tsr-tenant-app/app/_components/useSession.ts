"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useOrg } from "./OrgProvider";

export type MemberRole = "admin" | "member";

export interface SessionState {
  loading: boolean;
  signedIn: boolean;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  isSuper: boolean;
  /** Active membership in THIS org (or null). Super admins get an implicit one. */
  membership: { role: MemberRole; status: string } | null;
  /** True when the user may use this org's workspace. */
  allowed: boolean;
}

const initial: SessionState = {
  loading: true, signedIn: false, userId: null, email: null, fullName: null,
  isSuper: false, membership: null, allowed: false,
};

/**
 * Resolves the signed-in user and whether they belong to THIS org.
 * Gate: an active organization_members row for the org, or super_admin.
 */
export function useSession(): SessionState & { signOut: () => Promise<void> } {
  const { org } = useOrg();
  const [state, setState] = useState<SessionState>(initial);

  useEffect(() => {
    const sb = supabase();
    let active = true;

    const resolve = async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!active) return;
      if (!user) { setState({ ...initial, loading: false }); return; }

      const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
      const isSuper = meta.role === "super_admin";
      const fullName = (user.user_metadata?.name as string | undefined)
        ?? (user.user_metadata?.full_name as string | undefined) ?? null;

      let membership: SessionState["membership"] = null;
      if (org?.id) {
        const { data } = await sb
          .from("organization_members")
          .select("role, status")
          .eq("user_id", user.id)
          .eq("org_id", org.id)
          .maybeSingle();
        if (data) membership = { role: data.role as MemberRole, status: data.status as string };
      }
      if (!active) return;

      const allowed = isSuper || (!!membership && membership.status === "active");
      setState({
        loading: false, signedIn: true,
        userId: user.id, email: user.email ?? null, fullName,
        isSuper, membership, allowed,
      });
    };

    resolve();
    const { data: sub } = sb.auth.onAuthStateChange(() => resolve());
    return () => { active = false; sub.subscription.unsubscribe(); };
    // Re-resolve once org id is known.
  }, [org?.id]);

  const signOut = async () => { await supabase().auth.signOut(); };
  return { ...state, signOut };
}
