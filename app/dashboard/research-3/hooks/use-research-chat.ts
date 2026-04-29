"use client";

import { useRef, useState, type DragEvent } from "react";
import { extractPdfText } from "@/lib/pdf-extract";
import { generateId } from "@/lib/utils";
import { setStoredData } from "@/lib/storage";
import { streamLexramQuery, type QueryMode } from "@/modules/legal/api/queryStream";
import { parseLexramSources } from "@/modules/legal/usecase/parseLexramSources";
import {
  PROMPT_PRESETS,
  type AnalysisDepth,
  type AttachedFile,
  type Authority,
  type CommandMode,
  type LegalAnswer,
  type Message,
  type OutputFormat,
  type UiBlock,
  type WritingStyle,
  type WorkflowStep,
} from "../types";

// Exported so StreamingIndicator can use it
export function parseStreamingField(raw: string, field: string): string {
  const key = `"${field}"`;
  const keyIndex = raw.indexOf(key);
  if (keyIndex === -1) return "";

  const colonIndex = raw.indexOf(":", keyIndex + key.length);
  if (colonIndex === -1) return "";

  const firstQuote = raw.indexOf('"', colonIndex + 1);
  if (firstQuote === -1) return "";

  let i = firstQuote + 1;
  let out = "";
  let escaped = false;

  while (i < raw.length) {
    const ch = raw[i];
    if (escaped) {
      if (ch === "n") out += "\n";
      else if (ch === "t") out += "\t";
      else out += ch;
      escaped = false;
    } else if (ch === "\\") {
      escaped = true;
    } else if (ch === '"') {
      break;
    } else {
      out += ch;
    }
    i += 1;
  }

  return out.trim();
}

function tryParseJsonObject(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue to recovery
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {
      // continue
    }
  }
  return null;
}

function extractShortAnswer(content: string): string {
  const cleaned = content
    .replace(/^#{1,6}\s+/gm, "")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean)[0];
  if (!cleaned) return "";
  const firstSentence = cleaned.split(/(?<=[.?!])\s+/)[0]?.trim() || cleaned;
  return firstSentence.length > 280 ? `${firstSentence.slice(0, 277).trim()}...` : firstSentence;
}

function deriveMindMapSteps(
  raw: any,
  streamText: string,
  reasoning: string,
  shortAnswer: string
): WorkflowStep[] {
  const processPattern =
    /(assessing query|refining query|planning|requesting response|searching uploaded documents|researching complaint details|evaluating defenses|statutory analysis|precedent review|grounds classification|risk assessment|position analysis|optimizing prompt|query|response)/i;

  const rawSteps: WorkflowStep[] = Array.isArray(raw?.workflowSteps)
    ? raw.workflowSteps
        .slice(0, 8)
        .map((s: any) => ({
          title: String(s?.title || "Step").trim(),
          detail: s?.detail ? String(s.detail).trim() : undefined,
        }))
    : [];

  const substantive = rawSteps.filter(
    (s) => !processPattern.test(`${s.title} ${s.detail || ""}`)
  );
  if (substantive.length > 0) return substantive;

  const blocks = `${shortAnswer}\n\n${reasoning || streamText}`
    .split(/\n\s*\n/)
    .map((b) => b.replace(/^#+\s*/gm, "").trim())
    .filter(Boolean)
    .filter((b) => !processPattern.test(b));

  return blocks.slice(0, 6).map((block, index) => {
    const first = block.split(/(?<=[.?!])\s+/)[0]?.trim() || block;
    const title = first
      .replace(/^[-*\d.\s]+/, "")
      .split(/\s+/)
      .slice(0, 5)
      .join(" ");
    return { title: title || `Point ${index + 1}`, detail: block };
  });
}

// Map a backend `done.sources[]` item (new wire format — flat keys, any URL
// host) into our internal Authority shape. Kept separate from
// normalizeAuthority because that one filters linkHint to indiankanoon.org
// only, which would drop sci.gov.in / egazette / high-court URLs the LexRam
// backend now ships verbatim.
function mapBackendSource(s: any): Authority {
  const title = String(
    s?.title ?? s?.name ?? s?.case_name ?? s?.caseName ?? s?.citation ?? "Untitled source"
  );
  const rawUrl = String(s?.url ?? s?.link ?? s?.linkHint ?? "").trim();
  const linkHint = /^https?:\/\//i.test(rawUrl) ? rawUrl : undefined;
  const date = String(s?.date ?? s?.decided_on ?? "");
  const yearFromDate = date.match(/(19|20)\d{2}/)?.[0];
  const yearFromTitle = title.match(/(19|20)\d{2}/)?.[0];
  const courtRaw = String(s?.court ?? "").trim();
  const isStatute = /\b(Act|Sanhita|Code|Constitution|Rules?|Regulations?|Notification|Ordinance)\b/i.test(title);
  const court = courtRaw || (isStatute ? "Statute" : "—");
  return {
    caseName: title,
    citation: String(s?.citation ?? title),
    court,
    year: String(s?.year ?? yearFromDate ?? yearFromTitle ?? "—"),
    proposition: String(s?.proposition ?? s?.summary ?? s?.snippet ?? title),
    treatment:
      s?.treatment === "followed" || s?.treatment === "distinguished"
        ? s.treatment
        : "uncertain",
    linkHint,
  };
}

function normalizeAuthority(a: any): Authority {
  return {
    caseName: String(a?.caseName || "Untitled authority"),
    citation: String(a?.citation || "Citation unavailable"),
    court: String(a?.court || "Court unavailable"),
    year: String(a?.year || "-"),
    proposition: String(a?.proposition || "No proposition given"),
    treatment:
      a?.treatment === "followed" || a?.treatment === "distinguished"
        ? a.treatment
        : "uncertain",
    linkHint:
      a?.linkHint &&
      /^https?:\/\/(www\.)?indiankanoon\.org\/doc\/\d+/i.test(String(a.linkHint))
        ? String(a.linkHint)
        : undefined,
  };
}

// Sanitize a label for use inside a Mermaid node — no quotes, brackets or
// pipes (Mermaid syntax characters), plus length cap.
function mermaidLabel(text: string, max = 48): string {
  return text
    .replace(/[\[\]"|`<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

// Convert a workflowSteps[] array into a Mermaid `graph TD` source string so
// legacy responses still render under the new mindmap renderer.
function workflowStepsToMermaid(steps: WorkflowStep[], rootLabel = "Query"): string {
  if (!steps || steps.length === 0) return "";
  const lines = ["graph TD"];
  lines.push(`  Q["${mermaidLabel(rootLabel)}"]`);
  steps.forEach((s, i) => {
    const id = `S${i}`;
    const label = mermaidLabel(s.title || `Step ${i + 1}`);
    lines.push(`  ${id}["${label}"]`);
    if (i === 0) lines.push(`  Q --> ${id}`);
    else lines.push(`  S${i - 1} --> ${id}`);
  });
  return lines.join("\n");
}

// Validate / coerce a single uiBlock from raw model output.
function normalizeUiBlock(raw: any): UiBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const type = String(raw.type || "").toLowerCase();
  if (type === "mindmap") {
    const data = typeof raw.data === "string" ? raw.data.trim() : "";
    return data ? { type: "mindmap", data } : null;
  }
  if (type === "authorities") {
    const list = Array.isArray(raw.data) ? raw.data : [];
    if (list.length === 0) return null;
    return { type: "authorities", data: list.slice(0, 8).map(normalizeAuthority) };
  }
  if (type === "draft") {
    const data = typeof raw.data === "string" ? raw.data.trim() : "";
    return data ? { type: "draft", data } : null;
  }
  if (type === "plan") {
    const data = typeof raw.data === "string" ? raw.data.trim() : "";
    return data ? { type: "plan", data } : null;
  }
  return null;
}

function normalizeAnswer(raw: any, rootQuery = "Query"): LegalAnswer {
  const rawStreamText = raw?.streamText ? String(raw.streamText).trim() : "";
  const rawReasoning = raw?.reasoning ? String(raw.reasoning).trim() : "";
  const rawDraftReady = raw?.draftReady ? String(raw.draftReady).trim() : "";
  const rawShortAnswer = raw?.shortAnswer ? String(raw.shortAnswer).trim() : "";
  const fallbackBody = [rawStreamText, rawReasoning, rawDraftReady].find(Boolean) || "";
  const finalStreamText =
    rawStreamText ||
    [rawShortAnswer, rawReasoning].filter(Boolean).join("\n\n").trim() ||
    undefined;
  const finalShortAnswer =
    rawShortAnswer ||
    extractShortAnswer(rawStreamText) ||
    extractShortAnswer(rawReasoning) ||
    extractShortAnswer(rawDraftReady) ||
    "Answer generated.";

  // ── Authorities (now optional) ────────────────────────────────────────────
  const authorities: Authority[] | undefined = Array.isArray(raw?.authorities)
    ? raw.authorities.slice(0, 8).map(normalizeAuthority)
    : undefined;
  const hasAuthorities = !!(authorities && authorities.length > 0);

  // ── Workflow steps (now optional, only derived if model provided substantive ones) ──
  const rawSteps: WorkflowStep[] = Array.isArray(raw?.workflowSteps)
    ? deriveMindMapSteps(raw, finalStreamText || fallbackBody, rawReasoning, finalShortAnswer)
    : [];
  const workflowSteps = rawSteps.length > 0 ? rawSteps : undefined;
  const draftReady = rawDraftReady || undefined;

  // ── uiBlocks: prefer model-emitted; otherwise synthesize from legacy fields ──
  const explicitBlocks: UiBlock[] = Array.isArray(raw?.uiBlocks)
    ? raw.uiBlocks.map(normalizeUiBlock).filter((b: UiBlock | null): b is UiBlock => !!b)
    : [];

  const uiBlocks: UiBlock[] = [];
  if (explicitBlocks.length > 0) {
    uiBlocks.push(...explicitBlocks);
  } else {
    // Backward-compat: derive blocks from legacy fields when present.
    if (workflowSteps && workflowSteps.length > 0) {
      const mermaid = workflowStepsToMermaid(workflowSteps, rootQuery);
      if (mermaid) uiBlocks.push({ type: "mindmap", data: mermaid });
    }
    if (hasAuthorities) {
      uiBlocks.push({ type: "authorities", data: authorities! });
    }
    if (draftReady) {
      uiBlocks.push({ type: "draft", data: draftReady });
    }
  }

  return {
    thinkingText: raw?.thinkingText ? String(raw.thinkingText) : undefined,
    streamText: finalStreamText,
    shortAnswer: finalShortAnswer,
    reasoning:
      rawReasoning ||
      (finalStreamText && finalStreamText !== rawStreamText ? finalStreamText : ""),
    authorityStrength:
      raw?.authorityStrength === "Strong" || raw?.authorityStrength === "Limited"
        ? raw.authorityStrength
        : "Moderate",
    divergenceStatus:
      raw?.divergenceStatus === "Aligned" || raw?.divergenceStatus === "Unsettled"
        ? raw.divergenceStatus
        : "Split",
    authorities,
    draftReady,
    nextQuestions: Array.isArray(raw?.nextQuestions)
      ? raw.nextQuestions.slice(0, 4).map((q: any) => String(q))
      : undefined,
    workflowSteps,
    uiBlocks: uiBlocks.length > 0 ? uiBlocks : undefined,
  };
}

export interface UseResearchChatOptions {
  /** Ensure a LexRam session exists, creating one on demand. Returns the session id. */
  ensureSession: (titleHint: string) => Promise<string | null>;
}

export function useResearchChat(
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  options: UseResearchChatOptions
) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<CommandMode>("normal");
  const [queryMode, setQueryMode] = useState<QueryMode>("instant");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [selectedPromptPreset, setSelectedPromptPreset] = useState<string | null>(
    PROMPT_PRESETS[0]?.id ?? null
  );
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("auto");
  const [analysisDepth, setAnalysisDepth] = useState<AnalysisDepth>("standard");
  const [writingStyle, setWritingStyle] = useState<WritingStyle>("neutral");
  const [liveEditorContent, setLiveEditorContent] = useState("");
  const [activeRunMode, setActiveRunMode] = useState<CommandMode | null>(null);

  const ensureSessionRef = useRef(options.ensureSession);
  ensureSessionRef.current = options.ensureSession;

  const streamRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const handleSubmitRef = useRef<() => void>(() => {});

  const activePromptPreset = selectedPromptPreset
    ? PROMPT_PRESETS.find((p) => p.id === selectedPromptPreset) || null
    : null;

  const withFileContext = (prompt: string) => {
    if (attachedFiles.length === 0) return prompt;
    const fileContext = attachedFiles
      .map((f) => {
        let ctx = `- ${f.name} (${f.type || "file"}, ${Math.max(1, Math.round(f.size / 1024))} KB)`;
        if (f.content) ctx += `\n\nContent of ${f.name}:\n\`\`\`\n${f.content}\n\`\`\``;
        return ctx;
      })
      .join("\n\n");
    return `${prompt}\n\nUser attached files:\n${fileContext}`;
  };

  const buildPromptEnhancements = () => {
    const lines = [
      `Use web search: ${webSearchEnabled ? "enabled" : "disabled"}.`,
      `Output format: ${outputFormat === "auto" ? "auto-select best structure" : outputFormat}.`,
      `Analysis depth: ${analysisDepth}.`,
      `Writing style: ${writingStyle}.`,
    ];
    if (activePromptPreset) {
      lines.push(`Preset: ${activePromptPreset.label}. ${activePromptPreset.instruction}`);
    }
    return lines.join("\n");
  };

  const buildModelPrompt = (prompt: string) =>
    withFileContext(`${prompt}\n\nUser research preferences:\n${buildPromptEnhancements()}`);

  const isDraftIntent = (prompt: string, m: CommandMode) =>
    m === "draft" ||
    /\b(draft|write|prepare|compose|redraft|revise)\b.*\b(email|notice|reply|application|petition|affidavit|submission|agreement|contract|letter|memo|written statement|plaint)\b/i.test(
      prompt
    );

  const answerPrompt = (prompt: string, m: CommandMode) => {
    const history = messages
      .slice(-6)
      .map((msg) => {
        if (msg.role === "user") return `User: ${msg.content}`;
        if (msg.response)
          return `Assistant: ${msg.response.streamText || msg.response.shortAnswer || msg.response.reasoning}`;
        return "Assistant: prior answer";
      })
      .join("\n\n");

    const modeHint =
      m === "counter"
        ? "Give strongest counter-position and adverse authority."
        : m === "draft"
          ? "Generate a full draft-ready document in draftReady. streamText may summarize, but draftReady must contain the actual document body the user can edit immediately."
          : m === "timeline"
            ? "Present chronology-based legal analysis."
            : "Provide standard legal analysis.";

    return `You are an expert Indian legal research assistant.

Conversation:
${history || "No prior context"}

New query: "${prompt}"
Mode: ${m}
Instruction: ${modeHint}
Jurisdiction: India
Court scope: Supreme Court + High Courts
Web search: ${webSearchEnabled ? "Use public web and legal web sources where relevant." : "Do not rely on web search; stay within provided context and existing knowledge."}
Output format: ${outputFormat}
Analysis depth: ${analysisDepth}
Writing style: ${writingStyle}
Prompt preset: ${activePromptPreset ? `${activePromptPreset.label} - ${activePromptPreset.instruction}` : "none"}

CRITICAL FORMATTING RULES:
- The default response is plain prose in streamText. Do NOT force structured artifacts.
- ONLY include "draftReady" if the user explicitly asked you to draft an email, notice, petition, agreement, application, affidavit, contract, letter, or similar document.
- ONLY include "uiBlocks" when a structured UI representation genuinely helps the answer. Do NOT pad with empty blocks.
- ONLY include a "mindmap" block when the answer benefits from a step-by-step or branching diagram (multi-stage workflow, doctrinal tree, comparison of grounds). Skip it for direct factual answers.
- ONLY include an "authorities" block when you can cite real Indian case law that supports the answer. Skip it if no relevant authority exists.
- ONLY include a "draft" block when the user asked for a draftable document.
- Return uiBlocks ONLY when a UI representation is useful. Do NOT force all sections.

Return JSON in this shape (omit any field that doesn't apply):
{
  "thinkingText": "Internal reasoning trace, plain text.",
  "streamText": "Primary narrative answer in clean prose.",
  "shortAnswer": "1-sentence headline",
  "reasoning": "Extended analysis",
  "authorityStrength": "Strong|Moderate|Limited",
  "divergenceStatus": "Aligned|Split|Unsettled",
  "nextQuestions": ["string", "string"],
  "uiBlocks": [
    // Mermaid graph TD source — only when a diagram clarifies the answer
    { "type": "mindmap", "data": "graph TD\\n  A[Query] --> B[Test 1]\\n  B --> C[Test 2]" },

    // Real Indian case authorities — only when applicable
    {
      "type": "authorities",
      "data": [
        {
          "caseName": "string",
          "citation": "string",
          "court": "string",
          "year": "string",
          "proposition": "string",
          "treatment": "followed|distinguished|uncertain",
          "linkHint": "https://indiankanoon.org/doc/123456/  (omit if unknown)"
        }
      ]
    },

    // Full draftable document body — only when the user asked to draft something
    { "type": "draft", "data": "Full document body the user can copy/edit immediately." }
  ]
}

If your answer needs no diagram, no authorities, and no draft, just return the prose fields and omit "uiBlocks" entirely.`;
  };

  const buildAnswerFromStream = (raw: string) => {
    const streamText = parseStreamingField(raw, "streamText");
    const reasoning = parseStreamingField(raw, "reasoning");
    const shortAnswer = parseStreamingField(raw, "shortAnswer");
    const thinkingText = parseStreamingField(raw, "thinkingText");
    const draftReady = parseStreamingField(raw, "draftReady");
    return normalizeAnswer({
      streamText: streamText || reasoning || shortAnswer || "Could not parse full answer, but partial output was recovered.",
      reasoning,
      shortAnswer,
      thinkingText,
      draftReady,
    });
  };

  const parseAnswerPayload = (raw: string) => {
    const parsed = tryParseJsonObject(raw);
    if (parsed) return normalizeAnswer(parsed);
    return buildAnswerFromStream(raw);
  };

  const startResearch = async (
    prompt: string,
    effectiveMode: CommandMode,
    _modelPrompt?: string
  ) => {
    void _modelPrompt; // legacy param — LexRam doesn't need a pre-built prompt

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
      mode: effectiveMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setError(null);
    setIsSearching(true);
    setStreamingText("");
    setStatusMessage("");
    streamRef.current = "";
    setActiveRunMode(effectiveMode);
    setLiveEditorContent("");

    abortRef.current = new AbortController();

    // Make sure we have a LexRam session id before opening the SSE stream.
    let sessionId: string | null = null;
    try {
      sessionId = await ensureSessionRef.current(prompt);
    } catch (err: any) {
      setError(err?.message || "Could not create session.");
      setIsSearching(false);
      return;
    }
    if (!sessionId) {
      setError("Could not create a chat session.");
      setIsSearching(false);
      return;
    }

    const doneEventRef: { current: any } = { current: null };

    // Strip the <source>...</source> block from the live preview so users
    // don't see the raw source markup scrolling past while it's being parsed.
    // Handles in-flight (open tag, no close yet) and complete blocks.
    const stripSourceForDisplay = (raw: string): string =>
      raw.replace(/<source>[\s\S]*?(?:<\/source>|$)/i, "").replace(/<follow_up>[\s\S]*?(?:<\/follow_up>|$)/i, "").trimEnd();

    try {
      await streamLexramQuery(
        sessionId,
        prompt,
        queryMode,
        {
          onStatus: (message) => setStatusMessage(message),
          onToken: (content) => {
            streamRef.current += content;
            setStreamingText(stripSourceForDisplay(streamRef.current));
          },
          onDone: (event) => {
            doneEventRef.current = event;
          },
          onError: (message) => {
            setError(message);
          },
        },
        { signal: abortRef.current.signal }
      );

      // Build the final answer. Token order of preference:
      //   1. concatenated streaming tokens (the normal happy path)
      //   2. `done.final_answer` — the backend ships this when it skipped
      //      token streaming entirely (e.g. clarification responses, cached
      //      answers, classifier-handled small talk)
      //   3. friendly fallbacks tied to query_type
      const finalText = streamRef.current.trim();
      const done = doneEventRef.current as
        | {
            judgments_output?: string;
            acts_output?: string;
            query_type?: string;
            final_answer?: string;
            answer?: string;
            response?: string;
            sources?: any[];
            // Ravi Bala's spec: backend now ships follow-up questions and a
            // mindmap in the `done` event, siblings of `sources`. Wire accepts
            // multiple casings (camelCase and snake_case) since the backend
            // team is still firming up field names.
            follow_ups?: any;
            follow_up_questions?: any;
            followUps?: any;
            next_questions?: any;
            nextQuestions?: any;
            mindmap?: any;
            mind_map?: any;
            mermaid?: any;
          }
        | null;

      const doneFinalAnswer =
        (done?.final_answer || done?.answer || done?.response || "").trim();
      // New wire format: backend ships authorities as a structured array on
      // the `done` event instead of an inline <source>...</source> block.
      // parseLexramSources can't see them, so merge them in directly here.
      const doneSources: Authority[] = Array.isArray(done?.sources)
        ? done!.sources!.map(mapBackendSource).slice(0, 8)
        : [];

      // Follow-up questions — accept strings, or objects like {question, q, text}
      const rawFollowUps: any[] = Array.isArray(done?.follow_ups)
        ? done!.follow_ups
        : Array.isArray(done?.follow_up_questions)
        ? done!.follow_up_questions
        : Array.isArray(done?.followUps)
        ? done!.followUps
        : Array.isArray(done?.next_questions)
        ? done!.next_questions
        : Array.isArray(done?.nextQuestions)
        ? done!.nextQuestions
        : [];
      const doneFollowUps: string[] = rawFollowUps
        .map((q) => {
          if (typeof q === "string") return q.trim();
          if (q && typeof q === "object") {
            return String(q.question ?? q.text ?? q.q ?? q.title ?? "").trim();
          }
          return "";
        })
        .filter((q) => q.length > 0)
        .slice(0, 6);

      // Mindmap — accept a mermaid string directly, or {data|mermaid|source}
      const mindmapField = done?.mindmap ?? done?.mind_map ?? done?.mermaid;
      const doneMindmap: string =
        typeof mindmapField === "string"
          ? mindmapField.trim()
          : mindmapField && typeof mindmapField === "object"
          ? String(
              mindmapField.data ??
                mindmapField.mermaid ??
                mindmapField.source ??
                mindmapField.content ??
                "",
            ).trim()
          : "";

      let answer: ReturnType<typeof normalizeAnswer>;
      // Parse LexRam-style inline citations + <source> block from whichever
      // text we end up using. The parser strips the source block and returns
      // structured authorities; the inline <cite>N</cite> markers stay in
      // place and are rendered later by MessageBubble via rehype-raw.
      const applySources = (text: string) => {
        // Extract <follow_up>...</follow_up> block and parse questions from it.
        // The backend ships lines like:
        //   <follow_up> Related Questions:\n- Question 1?\n- Question 2? </follow_up>
        const followUpRe = /<follow_up>([\s\S]*?)<\/follow_up>/gi;
        let followUpQuestions: string[] = [];
        let cleanedText = text;
        let fMatch: RegExpExecArray | null;
        while ((fMatch = followUpRe.exec(text)) !== null) {
          const block = fMatch[1];
          // Extract lines that look like questions (start with -, *, number, or contain ?)
          const lines = block.split(/\n/).map((l) => l.replace(/^[\s\-\*\d.]+/, "").trim()).filter((l) => l.length > 10);
          followUpQuestions.push(...lines);
        }
        // Strip the <follow_up> block from the displayed text
        cleanedText = cleanedText.replace(/<follow_up>[\s\S]*?<\/follow_up>/gi, "").replace(/\n{3,}/g, "\n\n").trim();

        const parsed = parseLexramSources(cleanedText);
        const a = normalizeAnswer({ streamText: parsed.cleanText });
        if (parsed.authorities.length > 0) {
          a.authorities = parsed.authorities;
          a.uiBlocks = a.uiBlocks?.filter((b) => b.type !== "authorities");
          if (a.uiBlocks && a.uiBlocks.length === 0) a.uiBlocks = undefined;
        }
        // Attach extracted follow-up questions so MessageBubble renders them as chips
        if (followUpQuestions.length > 0) {
          a.nextQuestions = followUpQuestions;
        }
        return a;
      };

      // Simulate token-by-token streaming when the backend skipped real tokens
      // and dropped the entire answer in `done.final_answer`. This matches the
      // ChatGPT/Perplexity feel even when the backend short-circuits the LLM.
      const simulateStreaming = async (text: string) => {
        if (!text) return;
        const parsed = parseLexramSources(text);
        const display = parsed.cleanText;
        if (!display) return;

        // Reset live state and stream the cleaned text out in small chunks.
        streamRef.current = "";
        setStreamingText("");
        setStatusMessage("Synthesizing answer…");

        // Roughly 4 chars per chunk, ~12ms apart → ~330 chars/sec which feels
        // like a fast LLM. Tunable.
        const CHUNK_SIZE = 4;
        const DELAY_MS  = 12;
        const signal = abortRef.current?.signal;

        for (let i = 0; i < display.length; i += CHUNK_SIZE) {
          if (signal?.aborted) return;
          const chunk = display.slice(i, i + CHUNK_SIZE);
          streamRef.current += chunk;
          setStreamingText(streamRef.current);
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }
      };

      if (finalText) {
        // Normal streaming path — real tokens already painted live.
        answer = applySources(finalText);
      } else if (doneFinalAnswer) {
        // Backend dropped the whole answer in done.final_answer — animate it
        // into the live UI before committing the message.
        await simulateStreaming(doneFinalAnswer);
        answer = applySources(doneFinalAnswer);
      } else if (done?.query_type === "CLARIFICATION_NEEDED") {
        // No tokens AND no final_answer — show a friendly clarification.
        answer = normalizeAnswer({
          streamText:
            "I'm here to help with **Indian legal research**. Could you ask a more specific legal question?",
        });
      } else {
        // Generic empty-state hint.
        answer = normalizeAnswer({
          streamText:
            "_(The model returned no output for this query. Try rephrasing or switching to **Deep** mode.)_",
        });
      }

      // Merge structured `done.sources` from the backend. Prefer them over
      // anything parseLexramSources may have salvaged from inline tags — the
      // structured array is the authoritative list in the new wire format.
      if (doneSources.length > 0) {
        answer.authorities = doneSources;
        answer.uiBlocks = answer.uiBlocks?.filter((b) => b.type !== "authorities");
        if (answer.uiBlocks && answer.uiBlocks.length === 0) answer.uiBlocks = undefined;
      }

      // Merge structured follow-up questions from `done`. These take precedence
      // over anything pulled out of a <follow_up>...</follow_up> inline block
      // because the backend team said they're now structured siblings of sources.
      if (doneFollowUps.length > 0) {
        answer.nextQuestions = doneFollowUps;
      }

      // Merge structured mindmap (mermaid source) from `done`. Same rule: if
      // the backend shipped one, prefer it over anything derived from workflow
      // steps, and inject it as a mindmap UiBlock so MessageBubble → InlineBlock
      // → MermaidDiagram renders it.
      if (doneMindmap) {
        const otherBlocks = (answer.uiBlocks ?? []).filter((b) => b.type !== "mindmap");
        answer.uiBlocks = [
          { type: "mindmap", data: doneMindmap },
          ...otherBlocks,
        ];
      }

      // Draft-mode safety net: when the user explicitly picked the Draft pill
      // AND the backend actually produced something that *looks* like a
      // petition / memo / notice, promote it into a Draft UiBlock so
      // InlineDraftEditor renders it. The earlier version of this block
      // promoted *any* streamText, which masked a backend bug where mode=draft
      // silently falls back to the research pipeline — users ended up with a
      // research briefing (Summary / Statutory Provisions / Case Law …)
      // dressed up as a "Draft", which is not the real deliverable.
      //
      // Heuristic: the backend's research output always leads with the
      // "Summary"/"Statutory Provisions"/"Case Law" headings, whereas a real
      // draft has court/petition markers. Match the latter, refuse the former.
      const looksLikeRealDraft = (text: string): boolean => {
        if (!text) return false;
        return /\b(IN THE (HON(')?BLE )?(COURT|HIGH COURT|SESSIONS|TRIBUNAL|FORUM)|BEFORE THE (HON(')?BLE )?(COURT|JUDGE|MAGISTRATE|HIGH COURT)|RESPECTFULLY SHOWETH|MOST RESPECTFULLY SHOWETH|PRAYER\b.*\bGRANTED|APPLICATION UNDER SECTION|PETITION UNDER|LEGAL NOTICE|MEMORANDUM OF|TO,\s*The (Hon(')?ble|Presiding))\b/i.test(
          text,
        );
      };
      const looksLikePlan = (text: string): boolean => {
        if (!text) return false;
        return /^[\s*#]*(?:Drafting Plan|Draft Plan|Drafting plan)\b/i.test(text);
      };
      if (effectiveMode === "draft") {
        const hasDraftBlock = answer.uiBlocks?.some((b) => b.type === "draft");
        const hasPlanBlock  = answer.uiBlocks?.some((b) => b.type === "plan");
        const explicitDraft = (answer.draftReady || "").trim();
        const streamAsDraft = (answer.streamText || "").trim();

        if (!hasDraftBlock && !hasPlanBlock) {
          if (looksLikePlan(streamAsDraft)) {
            const otherBlocks = (answer.uiBlocks ?? []).filter((b) => b.type !== "draft" && b.type !== "plan");
            answer.uiBlocks = [...otherBlocks, { type: "plan", data: streamAsDraft }];
          } else {
            const promoteText = explicitDraft || (looksLikeRealDraft(streamAsDraft) ? streamAsDraft : "");
            if (promoteText) {
              answer.draftReady = promoteText;
              const otherBlocks = (answer.uiBlocks ?? []).filter((b) => b.type !== "draft");
              answer.uiBlocks = [...otherBlocks, { type: "draft", data: promoteText }];
            }
          }
        }
      }

      // Surface judgments + acts metadata as appended sections so users can
      // still see what the backend retrieved without losing the prose answer.
      let extras = "";
      if (done?.judgments_output) extras += `\n\n**Judgments cited:**\n${done.judgments_output}`;
      if (done?.acts_output)      extras += `\n\n**Statutes / Acts:**\n${done.acts_output}`;
      if (extras && answer.streamText) {
        answer.streamText = `${answer.streamText}${extras}`;
      } else if (extras) {
        answer.streamText = extras.trim();
      }

      const aiMessage: Message = {
        id: generateId(),
        role: "ai",
        content: "",
        timestamp: new Date().toISOString(),
        response: answer,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      // Whatever tokens we DID receive are still useful — surface them.
      const partial = streamRef.current.trim();
      if (partial) {
        const fallback: Message = {
          id: generateId(),
          role: "ai",
          content: "",
          timestamp: new Date().toISOString(),
          response: normalizeAnswer({ streamText: partial }),
        };
        setMessages((prev) => [...prev, fallback]);
      }
      if (err?.name !== "AbortError") {
        setError(err?.message || "Research failed.");
      }
    } finally {
      setIsSearching(false);
      setStreamingText("");
      setStatusMessage("");
      streamRef.current = "";
      setActiveRunMode(null);
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    // Mode resolution: the Draft pill in the API-mode toggle is an explicit
    // user declaration — it should dominate the client-side CommandMode so
    // the bubble renders draftReady / InlineDraftEditor even when the prompt
    // text doesn't look draft-shaped to the isDraftIntent regex. For Instant
    // and Deep, keep the auto-detect behaviour so a normal prompt like
    // "draft a bail application" still gets promoted to draft.
    const effectiveMode: CommandMode =
      queryMode === "draft"
        ? "draft"
        : mode === "normal" && isDraftIntent(trimmed, mode)
        ? "draft"
        : mode;
    startResearch(trimmed, effectiveMode, buildModelPrompt(trimmed));
  };
  handleSubmitRef.current = handleSubmit;

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filePromises = Array.from(fileList).map(async (file) => {
      const id = generateId();
      let content: string | undefined;
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isText =
        file.type.startsWith("text/") ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md");
      if (isPdf) {
        try {
          content = await extractPdfText(file);
        } catch {
          content = undefined;
        }
      } else if (isText) {
        try {
          content = await file.text();
          if (content.length > 50000)
            content = content.substring(0, 50000) + "\n\n[File truncated due to length...]";
        } catch {
          content = undefined;
        }
      }
      return { id, name: file.name, size: file.size, type: file.type || "application/octet-stream", content };
    });
    const files = await Promise.all(filePromises);
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (id: string) =>
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));

  // Attach docs that already live on the backend (case library). We don't
  // re-download their content: the backend injects case docs as context via
  // the session's case_id. The pill just shows the user which files are in
  // scope for their next question.
  const attachCaseDocs = (
    docs: { id: string; name: string; size?: number; mime_type?: string }[],
  ) => {
    if (!docs.length) return;
    setAttachedFiles((prev) => {
      const existing = new Set(prev.map((f) => f.caseDocId).filter(Boolean));
      const toAdd = docs
        .filter((d) => d.id && !existing.has(d.id))
        .map((d) => ({
          id: generateId(),
          caseDocId: d.id,
          name: d.name,
          size: d.size ?? 0,
          type: d.mime_type ?? "application/octet-stream",
          source: "case" as const,
        }));
      return [...prev, ...toAdd];
    });
  };

  const resizeTextarea = (element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  };

  const dropHandlers = {
    onDragOver: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(true);
    },
    onDragLeave: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
    },
    onDrop: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      addFiles(e.dataTransfer.files);
    },
  };

  const addToDraft = (response: LegalAnswer, sourceQuery: string) => {
    const importData = {
      positionOfLaw: [
        response.streamText || response.shortAnswer,
        response.reasoning,
        response.draftReady,
      ]
        .filter(Boolean)
        .join("\n\n"),
      selectedPrecedents: (response.authorities ?? []).map((a) => ({
        caseName: a.caseName,
        citation: a.citation,
        court: a.court,
        year: a.year,
        summary: a.proposition,
        confidence:
          a.treatment === "followed" ? "High" : a.treatment === "distinguished" ? "Medium" : "Low",
      })),
      sourceQuery,
      timestamp: new Date().toISOString(),
    };
    setStoredData("lexram_draft_import", importData);
  };

  const buildSessionDraft = () => {
    const responses = messages.filter((m) => m.role === "ai" && m.response);
    if (responses.length === 0) return;
    const combinedPosition = responses
      .map((m) => {
        const r = m.response!;
        return [r.streamText || r.shortAnswer, r.reasoning, r.draftReady]
          .filter(Boolean)
          .join("\n\n");
      })
      .join("\n\n---\n\n");
    const combinedPrecedents = responses.flatMap((m) =>
      (m.response!.authorities ?? []).map((a) => ({
        caseName: a.caseName,
        citation: a.citation,
        court: a.court,
        year: a.year,
        summary: a.proposition,
        confidence:
          a.treatment === "followed" ? "High" : a.treatment === "distinguished" ? "Medium" : "Low",
      }))
    );
    setStoredData("lexram_draft_import", {
      positionOfLaw: combinedPosition,
      selectedPrecedents: combinedPrecedents,
      sourceQuery: messages.find((m) => m.role === "user")?.content || "Research Session",
      timestamp: new Date().toISOString(),
    });
  };

  return {
    query,
    setQuery,
    mode,
    setMode,
    queryMode,
    setQueryMode,
    statusMessage,
    isSearching,
    error,
    streamingText,
    attachedFiles,
    removeFile,
    isDragActive,
    dropHandlers,
    fileInputRef,
    queryTextareaRef,
    handleSubmitRef,
    webSearchEnabled,
    setWebSearchEnabled,
    selectedPromptPreset,
    setSelectedPromptPreset,
    outputFormat,
    setOutputFormat,
    analysisDepth,
    setAnalysisDepth,
    writingStyle,
    setWritingStyle,
    liveEditorContent,
    activeRunMode,
    handleSubmit,
    stopGeneration,
    addFiles,
    attachCaseDocs,
    resizeTextarea,
    addToDraft,
    buildSessionDraft,
  };
}
