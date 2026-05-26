import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SessionCtx {
  user_id:  string;
  email:    string | null;
  is_super: boolean;
}

export async function getSessionCtx(): Promise<SessionCtx | null> {
  const sb = await createSupabaseServerClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  return {
    user_id:  user.id,
    email:    user.email ?? null,
    is_super: meta.role === "super_admin",
  };
}
