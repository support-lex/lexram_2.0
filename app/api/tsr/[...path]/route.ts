import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TSR_BACKEND =
  process.env.NEXT_PUBLIC_TSR_API_URL ??
  "https://lex-doc-analyzer.onrender.com";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

async function proxy(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join("/");
  const url = `${TSR_BACKEND}/${path}`;

  const sb = await createSupabaseServerClient();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const body = req.method === "GET" ? undefined : await req.text();
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const text = await res.text();
    let json: unknown;
    try { json = JSON.parse(text); } catch { json = { message: text }; }

    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "TSR backend is unreachable — it may be cold-starting on Render. Try again in 30 seconds." },
      { status: 502 }
    );
  }
}
