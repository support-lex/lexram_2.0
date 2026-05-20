/**
 * Tour step definitions. Add new tours here — the rest of the system
 * (TourProvider, replay button, persistence) picks them up automatically.
 *
 * Each step targets a CSS selector in the live DOM. Mark elements with
 * `data-tour="<step-id>"` so selectors stay decoupled from styling classes.
 *
 * Roles: pass `roles: ["admin"]` to hide a tour from non-admin users.
 * Default = visible to everyone.
 */

import type { DriveStep } from "driver.js";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

export type TourRole = "user" | "admin" | "guest";

export interface TourStep {
  /** CSS selector OR null for a centered welcome/finish popup */
  element: string | null;
  title: string;
  body: string;
  /** Tooltip placement relative to the highlighted element */
  side?: Side;
  align?: Align;
  /** Optional path to navigate to before showing this step */
  href?: string;
  /** Custom action label (default: "Next" / "Finish") */
  nextLabel?: string;
}

export interface TourDefinition {
  id: string;
  title: string;
  description: string;
  /** Roles allowed to see this tour. Empty/undefined = everyone. */
  roles?: TourRole[];
  /** When true, the tour auto-fires on first matching page visit. */
  autoStart?: boolean;
  /** Pages where the tour is allowed to auto-start (Next pathname prefix match). */
  autoStartPaths?: string[];
  steps: TourStep[];
}

export const TOURS: Record<string, TourDefinition> = {
  "dashboard-welcome": {
    id: "dashboard-welcome",
    title: "Welcome tour",
    description: "Quick walkthrough of LexRam — takes about 60 seconds.",
    autoStart: true,
    autoStartPaths: ["/dashboard"],
    steps: [
      {
        element: null,
        title: "Welcome to LexRam ✨",
        body:
          "Let's take a 60-second tour of your new legal AI workspace. " +
          "You can skip anytime — and replay this from your profile menu later.",
        nextLabel: "Show me around",
      },
      {
        element: '[data-tour="topbar-nav"]',
        title: "Your top navigation",
        body:
          "Jump between Dashboard, Research, Case Library, and Matters. " +
          "The active section glows maroon.",
        side: "bottom",
        align: "center",
      },
      {
        element: '[data-tour="topbar-research"]',
        title: "Research — your daily driver",
        body:
          "This is where you ask legal questions in plain English. LexRam " +
          "returns citation-grade answers across the Supreme Court and every " +
          "High Court.",
        side: "bottom",
        align: "center",
      },
      {
        element: '[data-tour="topbar-settings"]',
        title: "Quick settings",
        body: "One-click access to your workspace preferences.",
        side: "bottom",
        align: "end",
      },
      {
        element: '[data-tour="topbar-help"]',
        title: "Need help?",
        body:
          "Find shortcuts, FAQs, and contact support from here. " +
          "You can also restart this tour anytime.",
        side: "bottom",
        align: "end",
      },
      {
        element: '[data-tour="topbar-user"]',
        title: "Your profile",
        body:
          "Click your avatar to access Profile, Notifications, Logout — and " +
          "Replay this tour whenever you want.",
        side: "bottom",
        align: "end",
      },
      {
        element: null,
        title: "You're all set 🎉",
        body:
          "That's the quick tour. Head to Research and ask your first " +
          "question — or upload a case file to get started.",
        nextLabel: "Start using LexRam",
      },
    ],
  },

  /* ─── Research-page walkthrough ────────────────────────────────────── */
  "research-walkthrough": {
    id: "research-walkthrough",
    title: "Research tour",
    description: "Walk through every Research feature — about 90 seconds.",
    autoStart: true,
    autoStartPaths: ["/dashboard/research-2"],
    steps: [
      {
        element: null,
        title: "Welcome to Research 🔍",
        body:
          "This is where you'll spend most of your time — asking questions, " +
          "reading citations, and drafting documents. Let's tour the controls.",
        nextLabel: "Show me",
      },
      {
        element: '[data-tour="research-history"]',
        title: "Threads — your conversation history",
        body:
          "Click this icon to open the Threads rail. Every conversation is " +
          "saved here, searchable, pinnable, and archivable.",
        side: "bottom",
        align: "start",
      },
      {
        element: '[data-tour="research-title"]',
        title: "Current conversation",
        body:
          "The case context (small italic) sits above the chat title. " +
          "Untitled chats get an auto-generated title from your first question.",
        side: "bottom",
        align: "center",
      },
      {
        element: '[data-tour="research-case-chip"]',
        title: "Case context chip",
        body:
          "Every chat lives inside a case. Click here to switch the case " +
          "or assign documents — uploaded files become context the AI can cite.",
        side: "bottom",
        align: "center",
      },
      {
        element: '[data-tour="research-bookmark"]',
        title: "Bookmark important chats",
        body:
          "Pin a chat to keep it at the top of your Threads rail. Great for " +
          "your active matters or reference conversations.",
        side: "bottom",
        align: "end",
      },
      {
        element: '[data-tour="research-share"]',
        title: "Share with your team",
        body:
          "Send a chat to a colleague over a link — works with WhatsApp, " +
          "Telegram or email. The link opens the conversation read-only.",
        side: "bottom",
        align: "end",
      },
      {
        element: '[data-tour="research-case-hub"]',
        title: "Case Hub",
        body:
          "Opens the right-side rail with every case, all its documents, " +
          "drafts, and linked sessions. The mission control for a matter.",
        side: "bottom",
        align: "end",
      },
      {
        element: '[data-tour="research-hero-input"]',
        title: "Ask your first question",
        body:
          "Type any legal question in plain English. Hit ↵ to send. " +
          "LexRam will retrieve citations across the Supreme Court and " +
          "every High Court, then draft an answer.",
        side: "top",
        align: "center",
      },
      {
        element: '[data-tour="research-attach"]',
        title: "Attach documents",
        body:
          "Drop in PDFs, briefs, or judgments. The AI reads them and " +
          "uses them as context — perfect for case-specific questions.",
        side: "top",
        align: "start",
      },
      {
        element: '[data-tour="research-quick-chips"]',
        title: "Try one of these",
        body:
          "Pre-built prompts for the most common research patterns. " +
          "Click any chip to drop it into the input — edit before sending if you like.",
        side: "top",
        align: "center",
      },
      {
        element: null,
        title: "You're a power user now ⚡",
        body:
          "That's the full Research tour. Replay it anytime from the ✨ " +
          "icon in the top bar or the Replay tour item in your profile menu.",
        nextLabel: "Start researching",
      },
    ],
  },
};

/**
 * Convert our TourStep shape into driver.js DriveStep shape. Kept here so
 * the rest of the codebase doesn't import driver.js types directly.
 */
export function toDriverSteps(steps: TourStep[]): DriveStep[] {
  return steps.map((s) => {
    // Steps with no anchor element are centered modals (welcome / finish) —
    // mark them so CSS can render them larger and more decorative than the
    // inline tooltips.
    const isModal = !s.element;
    return {
      element: s.element ?? undefined,
      popover: {
        title: s.title,
        description: s.body,
        side: s.side,
        align: s.align,
        nextBtnText: s.nextLabel,
        popoverClass: isModal ? "lexram-tour-modal" : "lexram-tour-tooltip",
      },
    };
  });
}
