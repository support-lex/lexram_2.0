// Fetches one research session's full chat transcript for the admin overview's
// "Recent research sessions" viewer.
//
// Deliberately NOT bundled into the dashboard's initial payload: chat_sessions.messages
// is an unbounded JSON blob (a long research thread can carry megabytes of message
// history), and the overview only ever shows 40 recent sessions — loading transcripts
// for all of them up front would bloat every dashboard page load for the rare case an
// admin opens one. Fetched on demand, one session at a time, when a row is clicked.
//
// Gate is profiles.is_super_admin — the SAME flag /api/admin/access and the page itself
// check. This service reads other users' private research sessions, so it must not be
// reachable by the different app_metadata.role='super_admin' list used elsewhere in the
// app (lib/rbac.ts) — those are two separate lists in this database, and mixing them
// here would let someone with org-admin powers but no platform data-access grant read
// any user's chat history.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabaseAdmin()
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_super_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;

  const { data, error } = await supabaseAdmin()
    .from("chat_sessions")
    .select("id, title, messages, created_at, updated_at, last_active_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  return NextResponse.json({
    id: data.id,
    title: data.title || "Untitled",
    createdAt: data.created_at,
    lastActive: data.last_active_at ?? data.updated_at,
    messages: Array.isArray(data.messages) ? data.messages : [],
  });
}
