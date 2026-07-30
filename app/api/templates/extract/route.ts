import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { getSessionCtx } from "@/lib/auth-helpers";

const GEMINI_MODEL = "gemini-2.0-flash-lite";
const MAX_TEXT_CHARS = 12000;

const EXTRACTION_PROMPT = `You are a legal document structure analyst. Analyze the following Indian legal document text and extract its structure as a compact JSON object.

Return ONLY a valid JSON object with these fields (omit any field that isn't present):
{
  "doc_type": "type of document e.g. Writ Petition, Legal Notice, Bail Application, Affidavit",
  "court_header": "exact court/forum header format",
  "party_labels": ["Petitioner", "Respondent"],
  "sections": [
    { "heading": "FACTS", "numbering": "1., 2., 3." },
    { "heading": "GROUNDS", "numbering": "A., B., C." }
  ],
  "boilerplate": ["RESPECTFULLY SHOWETH", "WHEREFORE it is humbly prayed"],
  "clause_style": "description of how clauses/sub-clauses are numbered",
  "formatting": "key formatting conventions — uppercase headings, bold party names, etc.",
  "notes": "any other important structural conventions to preserve"
}

Be concise. The JSON will be used to instruct an AI to reproduce this exact document format.

DOCUMENT TEXT:
`;

async function callGemini(text: string): Promise<object> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: EXTRACTION_PROMPT + text.slice(0, MAX_TEXT_CHARS) }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty response from Gemini");

  return JSON.parse(raw);
}

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const { value: rawText } = await mammoth.extractRawText({ buffer });

    if (!rawText.trim()) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 422 });
    }

    const structure = await callGemini(rawText);

    return NextResponse.json({
      structure,
      raw_text: rawText.slice(0, 8000),
      doc_type: (structure as { doc_type?: string }).doc_type ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    console.error("[templates/extract]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
