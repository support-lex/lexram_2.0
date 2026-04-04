export type CommandMode = "normal" | "counter" | "draft" | "timeline";
export type ArtifactTab = "workflow" | "authorities" | "editor";

export type Authority = {
  caseName: string;
  citation: string;
  court: string;
  year: string;
  proposition: string;
  treatment: "followed" | "distinguished" | "uncertain";
  linkHint?: string;
};

export type WorkflowStep = {
  title: string;
  detail?: string;
};

export type LegalAnswer = {
  thinkingText?: string;
  streamText?: string;
  shortAnswer: string;
  reasoning: string;
  authorityStrength: "Strong" | "Moderate" | "Limited";
  divergenceStatus: "Aligned" | "Split" | "Unsettled";
  authorities: Authority[];
  draftReady: string;
  nextQuestions: string[];
  workflowSteps: WorkflowStep[];
};

export type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  mode?: CommandMode;
  response?: LegalAnswer;
};

export type ResearchSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  matterId?: string;
};

export type AttachedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
};

export type PromptPreset = {
  id: string;
  label: string;
  instruction: string;
};

export type OutputFormat = "auto" | "memo" | "bullets" | "email" | "chronology";
export type AnalysisDepth = "fast" | "standard" | "deep";
export type WritingStyle = "neutral" | "assertive" | "client-ready";

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "case-assessment",
    label: "Case assessment",
    instruction: "Identify the strongest and weakest legal positions, core risks, and the next factual questions that would materially affect outcome.",
  },
  {
    id: "counter-strategy",
    label: "Counter strategy",
    instruction: "Prioritize counter-arguments, adverse authority, vulnerabilities in the other side's position, and practical rebuttal framing.",
  },
  {
    id: "timeline-review",
    label: "Timeline review",
    instruction: "Organize the analysis chronologically and highlight sequence-dependent issues such as notice, limitation, procedural delay, and causation.",
  },
  {
    id: "client-update",
    label: "Client update",
    instruction: "Write with a client-facing tone, emphasizing practical implications, business risk, and concise next steps.",
  },
];

export const OUTPUT_FORMAT_OPTIONS: OutputFormat[] = ["auto", "memo", "bullets", "email", "chronology"];
export const ANALYSIS_DEPTH_OPTIONS: AnalysisDepth[] = ["fast", "standard", "deep"];
export const WRITING_STYLE_OPTIONS: WritingStyle[] = ["neutral", "assertive", "client-ready"];

export const QUICK_START_QUERIES = [
  "Grounds for anticipatory bail under BNSS",
  "Limitation period for specific performance",
  "Mental cruelty in divorce - Supreme Court tests",
  "Force majeure in commercial contracts",
];

export type QuickStartChip = {
  label: string;
  query: string;
  action?: "upload";
};

export type QuickStartCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  chips: QuickStartChip[];
};

export const UNIFIED_QUICK_STARTS: QuickStartCategory[] = [
  {
    id: "research",
    title: "Research",
    subtitle: "Search case law & legal questions",
    icon: "Search",
    chips: [
      { label: "Anticipatory bail under BNSS", query: "Grounds for anticipatory bail under BNSS" },
      { label: "Specific performance limitation", query: "Limitation period for specific performance" },
      { label: "Force majeure in contracts", query: "Force majeure in commercial contracts" },
    ],
  },
  {
    id: "analyze",
    title: "Analyze",
    subtitle: "Upload & analyze legal documents",
    icon: "FileSearch",
    chips: [
      { label: "Upload a document", query: "", action: "upload" },
      { label: "Summarize document", query: "Summarize the attached document" },
      { label: "Find weaknesses", query: "Identify weaknesses in the attached document" },
    ],
  },
  {
    id: "draft",
    title: "Draft",
    subtitle: "Draft legal documents with AI",
    icon: "FileText",
    chips: [
      { label: "Bail Application", query: "Draft a Bail Application for " },
      { label: "Legal Notice", query: "Draft a Legal Notice for " },
      { label: "Writ Petition", query: "Draft a Writ Petition for " },
    ],
  },
];
