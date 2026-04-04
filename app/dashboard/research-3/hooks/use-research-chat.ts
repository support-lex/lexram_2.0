"use client";

import { useRef, useState, type DragEvent } from "react";
import { generateContent } from "@/lib/ai";
import { extractPdfText } from "@/lib/pdf-extract";
import { generateId } from "@/lib/utils";
import { setStoredData } from "@/lib/storage";
import {
  PROMPT_PRESETS,
  type AnalysisDepth,
  type AttachedFile,
  type CommandMode,
  type LegalAnswer,
  type Message,
  type OutputFormat,
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

function normalizeAnswer(raw: any): LegalAnswer {
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
    authorities: Array.isArray(raw?.authorities)
      ? raw.authorities.slice(0, 8).map((a: any) => ({
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
        }))
      : [],
    draftReady: rawDraftReady,
    nextQuestions: Array.isArray(raw?.nextQuestions)
      ? raw.nextQuestions.slice(0, 4).map((q: any) => String(q))
      : [],
    workflowSteps: deriveMindMapSteps(
      raw,
      finalStreamText || fallbackBody,
      rawReasoning,
      finalShortAnswer
    ),
  };
}

export function useResearchChat(
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<CommandMode>("normal");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
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

Return only JSON in this exact shape:
{
  "thinkingText": "Detailed internal reasoning trace in plain text.",
  "streamText": "Primary narrative answer in clean prose.",
  "shortAnswer": "string",
  "reasoning": "string",
  "authorityStrength": "Strong|Moderate|Limited",
  "divergenceStatus": "Aligned|Split|Unsettled",
  "authorities": [
    {
      "caseName": "string",
      "citation": "string",
      "court": "string",
      "year": "string",
      "proposition": "string",
      "treatment": "followed|distinguished|uncertain",
      "linkHint": "MUST be an Indian Kanoon doc URL like https://indiankanoon.org/doc/123456/ — provide the exact indiankanoon.org/doc/ URL if known, otherwise omit."
    }
  ],
  "workflowSteps": [
    { "title": "short answer-theme label", "detail": "user-facing legal proposition tied to the answer" }
  ],
  "draftReady": "string",
  "nextQuestions": ["string"]
}`;
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
    modelPrompt?: string
  ) => {
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
    streamRef.current = "";
    setActiveRunMode(effectiveMode);
    setLiveEditorContent("");

    const draftRun = isDraftIntent(prompt, effectiveMode);

    abortRef.current = new AbortController();

    try {
      const response = await generateContent({
        prompt: answerPrompt(modelPrompt || prompt, effectiveMode),
        jsonMode: true,
        stream: true,
        signal: abortRef.current.signal,
        onChunk: (chunk) => {
          streamRef.current += chunk;
          setStreamingText(streamRef.current);
          if (draftRun) {
            const liveDraft =
              parseStreamingField(streamRef.current, "draftReady") ||
              parseStreamingField(streamRef.current, "streamText") ||
              parseStreamingField(streamRef.current, "reasoning");
            if (liveDraft) setLiveEditorContent(liveDraft);
          }
        },
      });

      const aiMessage: Message = {
        id: generateId(),
        role: "ai",
        content: "",
        timestamp: new Date().toISOString(),
        response: parseAnswerPayload(response.text || streamRef.current),
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (draftRun && (aiMessage.response?.draftReady || aiMessage.response?.streamText)) {
        setLiveEditorContent(
          aiMessage.response.draftReady || aiMessage.response.streamText || ""
        );
      }
    } catch (err: any) {
      const fallback: Message = {
        id: generateId(),
        role: "ai",
        content: "",
        timestamp: new Date().toISOString(),
        response: buildAnswerFromStream(streamRef.current),
      };
      setMessages((prev) => [...prev, fallback]);
      setError(err?.message || "Research failed.");
    } finally {
      setIsSearching(false);
      setStreamingText("");
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
    const effectiveMode: CommandMode =
      mode === "normal" && isDraftIntent(trimmed, mode) ? "draft" : mode;
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
      positionOfLaw: `${response.streamText || response.shortAnswer}\n\n${response.reasoning}\n\n${response.draftReady}`,
      selectedPrecedents: response.authorities.map((a) => ({
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
      m.response!.authorities.map((a) => ({
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
    resizeTextarea,
    addToDraft,
    buildSessionDraft,
  };
}
