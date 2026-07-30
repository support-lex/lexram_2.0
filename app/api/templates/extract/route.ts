import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { getSessionCtx } from "@/lib/auth-helpers";

const BACKEND_BASE = process.env.LEGAL_API_INTERNAL_URL || "http://157.245.106.223:8124";

export async function POST(req: NextRequest) {
  const ctx = await getSessionCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["docx", "doc"].includes(ext)) {
      return NextResponse.json(
        { error: "Only .docx files are supported. PDF support coming soon." },
        { status: 400 }
      );
    }

    // Extract text from DOCX using mammoth (server-side)
    const buffer = Buffer.from(await file.arrayBuffer());
    const { value: rawText } = await mammoth.extractRawText({ buffer });

    if (!rawText.trim()) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 422 });
    }

    // Forward text to FastAPI backend — it calls Vercel AI Gateway (google/gemini-2.0-flash-lite)
    const token = req.headers.get("authorization");
    const backendRes = await fetch(`${BACKEND_BASE}/templates/extract-structure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({ text: rawText }),
    });

    if (!backendRes.ok) {
      const err = await backendRes.text();
      return NextResponse.json({ error: err || "Structure extraction failed" }, { status: backendRes.status });
    }

    const { structure, doc_type } = await backendRes.json();

    return NextResponse.json({
      structure,
      raw_text: rawText.slice(0, 8000),
      doc_type: doc_type ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    console.error("[templates/extract]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
