// Bundles a LexRam research thread into the payload the /api/ai/blog endpoint
// expects when the post is being authored from research findings.
//
// We use sessionStorage (not URL params) for transport because a thread with
// authorities, mermaids, and full AI prose blows past the URL length cap on
// most browsers. The create page reads + clears the key once consumed.

import type { Authority, Message } from "@/app/dashboard/research-2/types";

export const BLOG_SOURCE_STORAGE_KEY = "lexram_blog_research_source";
// Stores the AI's generated output so the create page can restore the form
// when the user navigates away (back to research) and forward again, instead
// of re-firing the AI or showing an empty editor.
export const BLOG_GENERATED_STORAGE_KEY = "lexram_blog_research_generated";

export interface BlogGeneratedDraft {
  title: string;
  subtitle: string;
  category: string | null;
  tags: string[];
  meta_title: string;
  meta_description: string;
  html: string;
}

export interface BlogResearchAuthority {
  caseName?: string;
  citation?: string;
  court?: string;
  year?: string;
  proposition?: string;
}

export interface BlogResearchSource {
  topic: string;
  questions: string[];
  answers: string[];
  authorities: BlogResearchAuthority[];
  mermaids: string[];
  drafts: string[];
  /** Title hint for the blog editor — defaults to the session title. */
  titleHint?: string;
}

export function buildResearchSourceForBlog(
  messages: Message[],
  sessionTitle: string,
): BlogResearchSource {
  const userMessages = messages.filter((m) => m.role === "user");
  const aiMessages = messages.filter((m) => m.role === "ai");

  const questions = userMessages.map((m) => m.content).filter(Boolean);

  // Prefer the model's prose `streamText`; fall back to shortAnswer or raw
  // content so guest mode (where streamText is missing) still produces a brief.
  const answers = aiMessages
    .map((m) => m.response?.streamText ?? m.response?.shortAnswer ?? m.content)
    .filter((s): s is string => !!s && s.trim().length > 0);

  // Authorities can live in two shapes on the message:
  //   - `m.response.authorities` (legacy top-level field)
  //   - `m.response.uiBlocks[].data` where the block's `type === "authorities"`
  // Modern AI responses prefer the uiBlocks path (see use-research-chat.ts:
  // when `explicitBlocks.length > 0` it skips the legacy synthesis), so the
  // top-level field is usually undefined. Read from both and dedupe by
  // case-name+citation so we don't double-list when an answer emits both.
  const authoritySeen = new Set<string>();
  const authorities: BlogResearchAuthority[] = [];
  const collectAuthority = (a: Authority | undefined | null) => {
    if (!a) return;
    const key = `${a.caseName ?? ""}|${a.citation ?? ""}`.toLowerCase();
    if (key === "|" || authoritySeen.has(key)) return;
    authoritySeen.add(key);
    authorities.push({
      caseName: a.caseName,
      citation: a.citation,
      court: a.court,
      year: a.year,
      proposition: a.proposition,
    });
  };
  aiMessages.forEach((m) => {
    (m.response?.authorities ?? []).forEach(collectAuthority);
    (m.response?.uiBlocks ?? []).forEach((b) => {
      if (b.type === "authorities" && Array.isArray(b.data)) {
        b.data.forEach(collectAuthority);
      }
    });
  });

  const mermaids: string[] = aiMessages.flatMap((m) =>
    (m.response?.uiBlocks ?? [])
      .filter((b): b is { type: "mindmap"; data: string } => b.type === "mindmap")
      .map((b) => b.data)
      .filter((s) => typeof s === "string" && s.trim().length > 0),
  );

  // Drafts can land in two places: the dedicated `draftReady` field, or as
  // a `draft` uiBlock. Dedupe identical strings so a draft shown both ways
  // doesn't get embedded twice in the blog.
  const draftSet = new Set<string>();
  aiMessages.forEach((m) => {
    if (m.response?.draftReady) draftSet.add(m.response.draftReady);
    (m.response?.uiBlocks ?? []).forEach((b) => {
      if (b.type === "draft" && typeof b.data === "string" && b.data.trim()) {
        draftSet.add(b.data);
      }
    });
  });

  return {
    topic: questions[0] || sessionTitle || "Legal research",
    questions,
    answers,
    authorities,
    mermaids,
    drafts: Array.from(draftSet),
    titleHint: sessionTitle && sessionTitle !== "New Conversation" ? sessionTitle : undefined,
  };
}

export function storeBlogSource(src: BlogResearchSource): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BLOG_SOURCE_STORAGE_KEY, JSON.stringify(src));
  } catch {
    /* quota / privacy mode — silent */
  }
}

export function consumeBlogSource(): BlogResearchSource | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BLOG_SOURCE_STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(BLOG_SOURCE_STORAGE_KEY);
    return JSON.parse(raw) as BlogResearchSource;
  } catch {
    return null;
  }
}

// Generated-draft persistence. We cache the AI's output so navigating away
// from /dashboard/blog/create and back doesn't lose the user's draft, and so
// we don't have to re-call the AI (which costs a request and ~5–10 seconds)
// just because the user clicked the back button.

export function storeGeneratedDraft(draft: BlogGeneratedDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BLOG_GENERATED_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* quota — silent */
  }
}

export function readGeneratedDraft(): BlogGeneratedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BLOG_GENERATED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BlogGeneratedDraft) : null;
  } catch {
    return null;
  }
}

export function clearGeneratedDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BLOG_GENERATED_STORAGE_KEY);
  } catch {
    /* noop */
  }
}
