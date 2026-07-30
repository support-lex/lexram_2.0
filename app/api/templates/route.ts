import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionCtx } from "@/lib/auth-helpers";

// GET /api/templates — list the authenticated user's saved templates
export async function GET() {
  const ctx = await getSessionCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("draft_templates")
    .select("id, name, doc_type, structure, created_at")
    .eq("user_id", ctx.user_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}

// POST /api/templates — save a new template
export async function POST(req: NextRequest) {
  const ctx = await getSessionCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, structure, raw_text, doc_type } = body;

  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!structure) return NextResponse.json({ error: "structure is required" }, { status: 400 });

  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("draft_templates")
    .insert({ user_id: ctx.user_id, name: name.trim(), structure, raw_text: raw_text ?? null, doc_type: doc_type ?? null })
    .select("id, name, doc_type, structure, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}
