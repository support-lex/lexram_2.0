import type { BlogPost } from "@/types/blog";

/**
 * Static seed posts rendered by /blog when Supabase returns no rows
 * (e.g. before migrations are applied, or on a fresh local DB).
 * Shape matches `BlogPost` so they drop into `BlogExplorer` unchanged.
 */
export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: "seed-001",
    slug: "bns-2023-cheat-sheet-for-advocates",
    title: "BNS 2023 — a working cheat-sheet for the practising advocate",
    subtitle:
      "Mapping the new Bharatiya Nyaya Sanhita onto the IPC sections you've practised for a decade.",
    cover_image_url: "/landing/lawbook.jpg",
    content_html:
      "<p>The BNS replaces the IPC for substantive criminal law. This piece maps the most-used sections in everyday practice — 302/304B, 306, 498A, 376, 392, 420 — onto their BNS equivalents, flags the changes in punishment tiers, and notes the procedural flow-on effects under BNSS.</p><p>We focus on the sections you'll actually see in your cause-list this fortnight, not the entire 358-section statute.</p>",
    category: "Practice",
    tags: ["BNS", "IPC", "Criminal Law", "Cheat Sheet"],
    status: "published",
    scheduled_for: null,
    reading_time: 7,
    meta_title: "BNS 2023 cheat-sheet for advocates | LexRam Blog",
    meta_description:
      "A practical mapping of BNS 2023 onto the IPC sections Indian advocates use every week.",
    author_id: null,
    author_name: "LexRam Editorial",
    published_at: "2026-07-08T09:00:00+05:30",
    view_count: 0,
    created_at: "2026-07-08T09:00:00+05:30",
    updated_at: "2026-07-08T09:00:00+05:30",
  },
  {
    id: "seed-002",
    slug: "from-manual-research-to-ai-assisted-research",
    title: "From manual cite-checking to AI-assisted research: a senior counsel's first 30 days",
    subtitle:
      "What changed, what didn't, and the one workflow rewrite that mattered most.",
    cover_image_url: "/landing/research-img.jpg",
    content_html:
      "<p>We followed three senior advocates through their first 30 days with an AI research tool. This is the unvarnished log — what saved time, what was friction, and which parts of the old workflow they ended up keeping.</p><p>The short version: source-linked citations turned out to matter more than model speed.</p>",
    category: "Technology",
    tags: ["AI Research", "Workflow", "Advocates"],
    status: "published",
    scheduled_for: null,
    reading_time: 9,
    meta_title: "AI-assisted legal research — a 30-day field log | LexRam Blog",
    meta_description:
      "Senior advocates share what changes — and what doesn't — when AI enters the research workflow.",
    author_id: null,
    author_name: "LexRam Editorial",
    published_at: "2026-07-03T10:30:00+05:30",
    view_count: 0,
    created_at: "2026-07-03T10:30:00+05:30",
    updated_at: "2026-07-03T10:30:00+05:30",
  },
  {
    id: "seed-003",
    slug: "drafting-bail-applications-with-llms",
    title: "Drafting a bail application with an LLM — the parts you still review",
    subtitle:
      "The output looks finished. It is not. Here is your line-by-line review checklist.",
    cover_image_url: "/landing/drafting-img.jpg",
    content_html:
      "<p>An LLM drafts a section 437 BNSS bail application in fifteen seconds. You will spend twenty minutes on review. Here is what deserves those twenty minutes — facts the model cannot verify, citations it cannot trace, and reliefs that must match the case diary.</p>",
    category: "Practice",
    tags: ["Drafting", "Bail", "LLM", "Review"],
    status: "published",
    scheduled_for: null,
    reading_time: 6,
    meta_title: "AI-drafted bail applications — the review checklist | LexRam Blog",
    meta_description:
      "Which parts of an LLM-drafted bail application need an advocate's eyes before filing.",
    author_id: null,
    author_name: "LexRam Editorial",
    published_at: "2026-06-28T08:00:00+05:30",
    view_count: 0,
    created_at: "2026-06-28T08:00:00+05:30",
    updated_at: "2026-06-28T08:00:00+05:30",
  },
  {
    id: "seed-004",
    slug: "data-protection-act-2023-and-chambers",
    title: "The DPDP Act 2023 and what chambers actually have to do",
    subtitle:
      "Six obligations you'll face; one you'll almost certainly forget.",
    cover_image_url: "/landing/chamber.jpg",
    content_html:
      "<p>The Digital Personal Data Protection Act 2023 turned most chambers into 'Data Fiduciaries' the moment they process client files. Here are the six obligations that fall on you, what triggers each, and the one that's consistently overlooked — the Grievance Redressal officer.</p>",
    category: "Compliance",
    tags: ["DPDP", "Compliance", "Data Protection", "Chambers"],
    status: "published",
    scheduled_for: null,
    reading_time: 8,
    meta_title: "DPDP Act 2023 obligations on law chambers | LexRam Blog",
    meta_description:
      "Six concrete obligations the DPDP Act 2023 places on advocates and law chambers — and the one most firms miss.",
    author_id: null,
    author_name: "LexRam Editorial",
    published_at: "2026-06-22T11:15:00+05:30",
    view_count: 0,
    created_at: "2026-06-22T11:15:00+05:30",
    updated_at: "2026-06-22T11:15:00+05:30",
  },
  {
    id: "seed-005",
    slug: "reading-supreme-court-judgments-faster",
    title: "Reading a Supreme Court judgment faster — without losing the ratio",
    subtitle:
      "Five highlighter moves that turn a 40-page judgment into a five-minute understanding.",
    cover_image_url: "/landing/courthouse.jpg",
    content_html:
      "<p>Most judgments bury the ratio under facts and obiter. These five moves — which paragraphs you read first, what you skip, what you flag — get you the law without the 40-page grind. Includes an example with Arnesh Kumar (2014) and what makes it a faster read than its length suggests.</p>",
    category: "Analysis",
    tags: ["Judgment Reading", "Supreme Court", "Ratio"],
    status: "published",
    scheduled_for: null,
    reading_time: 5,
    meta_title: "Read Supreme Court judgments faster | LexRam Blog",
    meta_description:
      "Five techniques for extracting the ratio from a Supreme Court judgment in under five minutes.",
    author_id: null,
    author_name: "LexRam Editorial",
    published_at: "2026-06-15T09:30:00+05:30",
    view_count: 0,
    created_at: "2026-06-15T09:30:00+05:30",
    updated_at: "2026-06-15T09:30:00+05:30",
  },
  {
    id: "seed-006",
    slug: "hallucinated-citations-and-how-to-stop-them",
    title: "Hallucinated citations, and how to spot them in 30 seconds",
    subtitle:
      "An LLM will swear a citation is real. Here is your 30-second verification protocol.",
    cover_image_url: "/landing/justice.jpg",
    content_html:
      "<p>Indian courts have flagged hallucinated citations in filed affidavits. This is the protocol we run on every citation an AI produces — three checks, each under ten seconds — before it goes into a draft or a memo.</p>",
    category: "Opinion",
    tags: ["AI Safety", "Citations", "Hallucination", "Verification"],
    status: "published",
    scheduled_for: null,
    reading_time: 4,
    meta_title: "How to spot a hallucinated legal citation | LexRam Blog",
    meta_description:
      "A 30-second protocol to verify that an AI-generated legal citation actually exists.",
    author_id: null,
    author_name: "LexRam Editorial",
    published_at: "2026-06-09T07:45:00+05:30",
    view_count: 0,
    created_at: "2026-06-09T07:45:00+05:30",
    updated_at: "2026-06-09T07:45:00+05:30",
  },
];
