// Super-admin inbox: list org-join requests.
import { NextRequest, NextResponse } from "next/server";
import { getSessionCtx } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const ctx = await getSessionCtx();
  if (!ctx?.is_super) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const sb = supabaseAdmin();

  let q = sb.from("tsr_org_requests").select("*").order("created_at", { ascending: false });
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    q = q.eq("status", status);
  }
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
