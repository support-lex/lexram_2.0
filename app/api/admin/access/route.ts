// "Can the signed-in user open /dashboard/admin/stats?"
//
// The topbar needs to answer this to decide whether to show the Admin link, but
// it cannot read the answer itself: the gate is profiles.is_super_admin, and RLS
// on public.profiles blocks the browser from reading the column. The existing
// useIsSuperAdmin() hook reads app_metadata.role from the JWT instead — a
// *different* list of people (the two have already drifted apart), so using it
// here would show the link to users the page then bounces.
//
// This route is the single source of truth for that one boolean, evaluated with
// exactly the same query the page uses. It returns no other profile data.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ isSuperAdmin: false });

  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({ isSuperAdmin: Boolean(data?.is_super_admin) });
}
