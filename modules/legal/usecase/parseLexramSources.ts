// Parses the LexRam backend's inline citation + source-block format into
// structured authorities the rest of the UI already knows how to render.
//
// The format looks like:
//
//   ... per Section 480(1), BNSS, 2023 <cite>1</cite> — courts shall NOT ...
//   ... courts must consider <cite>2,3,4,5</cite> the gravity ...
//
//   <source>
//     [1]||Bharatiya Nagarik Suraksha Sanhita, 2023 — Sections 479, 480, 483||2023||
//     [2]||Sudha Verma v. State of UP & Anr, (2007)||24-08-2007||https://api.sci.gov.in/...pdf
//     [3]||Chaman Lal v. State of UP & Anr, (2004) 7 SCC 525||16-08-2004||https://...pdf
//   </source>
//
// We extract every `[N]||title||date||url` row, leave the inline `<cite>` tags
// in place (MessageBubble renders them via rehype-raw), and strip the
// `<source>...</source>` block from the displayed text.

import type { Authority } from "@/app/dashboard/research-3/types";

export interface ParsedLexramAnswer {
  /** The original answer with `<source>...</source>` removed but `<cite>` tags kept inline. */
  cleanText: string;
  /** Structured sources, indexed 1-based to match the inline `[N]` markers. */
  authorities: Authority[];
}

const SOURCE_BLOCK_RE = /<source>([\s\S]*?)<\/source>/i;
// Each row: `[N]||title||date||url` — fields separated by `||`. URL is optional.
const SOURCE_ROW_RE = /\[(\d+)\]\s*\|\|\s*([^|]*?)\s*\|\|\s*([^|]*?)\s*\|\|\s*([^[]*?)(?=\s*\[\d+\]|\s*$)/g;

function deriveCourt(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("supreme court")) return "Supreme Court of India";
  if (t.includes("high court")) {
    const m = title.match(/([A-Za-z]+) High Court/i);
    return m ? `${m[1]} High Court` : "High Court";
  }
  if (t.includes("nclt")) return "NCLT";
  if (t.includes("tribunal")) return "Tribunal";
  return "";
}

function extractYear(date: string, fallbackTitle: string): string {
  const dateYear = date.match(/(19|20)\d{2}/)?.[0];
  if (dateYear) return dateYear;
  const titleYear = fallbackTitle.match(/(19|20)\d{2}/)?.[0];
  return titleYear ?? "—";
}

function looksLikeStatute(title: string): boolean {
  return /\b(Act|Sanhita|Code|Constitution|Rules?|Regulations?|Notification|Ordinance)\b/i.test(title);
}

export function parseLexramSources(raw: string): ParsedLexramAnswer {
  if (!raw) return { cleanText: "", authorities: [] };

  const sourceMatch = raw.match(SOURCE_BLOCK_RE);
  if (!sourceMatch) {
    return { cleanText: raw, authorities: [] };
  }

  const block = sourceMatch[1];
  const authorities: Authority[] = [];

  // Reset regex state for this invocation.
  SOURCE_ROW_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SOURCE_ROW_RE.exec(block)) !== null) {
    const title = (m[2] || "").trim();
    const date = (m[3] || "").trim();
    const url = (m[4] || "").trim();
    if (!title) continue;

    const isStatute = looksLikeStatute(title);
    authorities.push({
      caseName: title,
      citation: title,
      court: isStatute ? "Statute" : deriveCourt(title) || "—",
      year: extractYear(date, title),
      proposition: title,
      treatment: "uncertain",
      // Keep linkHint as-is (Indian Kanoon URL validation in normalizeAnswer
      // would otherwise drop sci.gov.in / official-gazette URLs).
      linkHint: url || undefined,
    });
  }

  // Strip the source block from the rendered text. Trim trailing whitespace.
  const cleanText = raw.replace(SOURCE_BLOCK_RE, "").replace(/\n{3,}/g, "\n\n").trim();

  return { cleanText, authorities };
}
