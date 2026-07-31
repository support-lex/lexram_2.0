// Admin overview — the platform's operational snapshot.
//
// Replaces the previous version of this page, which queried columns that do not
// exist in this database (profiles.full_name / profiles.role / payments.amount /
// blog_posts.view_count) and gated on user_metadata.role, a field nothing sets.
// It rendered plausible-looking zeros. Every figure here comes from the real
// schema, and every query is wrapped so a failure surfaces as a warning banner
// instead of a silent zero.
//
// Read-only by design: no credit granting, no status edits. The service-role key
// is used for reads only.

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadAdminOverview } from "./_lib/overview";
import DashboardShell from "./_components/DashboardShell";

export const metadata = { title: "Admin overview | LexRam" };

// Never cache: an admin opening this page is asking "what is true right now".
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminStatsPage() {
  // ── Gate: profiles.is_super_admin ────────────────────────────────────────
  // That column is the flag this database actually populates. The session's
  // user_metadata carries no role at all, so checking it (as the old page did)
  // could only ever fail closed for everyone — or, if inverted, fail open.
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/dashboard/admin/stats");

  const { data: me } = await supabaseAdmin()
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_super_admin) redirect("/dashboard");

  // The whole snapshot is loaded once here and filtered in the browser: the datasets are
  // small (hundreds of rows, pre-aggregated into daily series), so range and tab switching
  // is instant and never refetches.
  const data = await loadAdminOverview();

  return <DashboardShell data={data} />;
}
