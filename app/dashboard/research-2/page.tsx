"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { History, Share, MoreHorizontal, Users, Pin, PinOff, Archive, Trash2, Check, Link2, Briefcase, Plus, Bookmark, BookmarkCheck, Share2, PenLine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  pinnedSessionRepository,
  archivedSessionRepository,
} from "@/modules/chat/repository/feedback.repository";
import { useMatterContext } from "@/lib/matter-context";
import { ResearchHistoryContext } from "@/lib/research-history-context";
import { getStoredData, setStoredData, STORAGE_KEYS } from "@/lib/storage";
import { useDashboardAuth } from "@/lib/dashboard-auth-context";
import { supabase } from "@/lib/supabase/client";

import { useResearchSessions } from "./hooks/use-research-sessions";
import { useResearchChat } from "./hooks/use-research-chat";
import { useResearchUI } from "./hooks/use-research-ui";
import { useUserRole } from "@/lib/auth-guard";
import { buildResearchSourceForBlog, BLOG_SOURCE_STORAGE_KEY } from "@/lib/blog/research-source";

import HistorySidebar from "./components/HistorySidebar";
import CasesPanel from "./components/CasesPanel";
import EmptyState from "./components/EmptyState";
import ApiProgressBar from "./components/ApiProgressBar";
import ChatThread from "./components/ChatThread";
import ChatInput from "./components/ChatInput";
import AuthoritiesPanel from "./components/AuthoritiesPanel";
import ShortcutsModal from "./components/ShortcutsModal";
import DocumentDialog from "./components/DocumentDialog";
import SuggestionsPopup from "./components/SuggestionsPopup";
import demoConversation from "./demo-conversation.json";
import type { Message } from "./types";
import CaseSelector, { type Case as CaseItem } from "@/components/CaseSelector";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";
import PaywallModal from "@/components/PaywallModal";
import api from "@/services/legal-api";
import { useCredits } from "@/hooks/use-credits";
import type { BillingMode } from "@/lib/billing";
import { isPaywallEnabled } from "@/lib/billing";

const PENDING_QUERY_KEY = "lexram_pending_query";
// After this many user messages, prompt for profile details (name + email)
// if the user_metadata is incomplete. The popup is one-shot per session —
// dismissing it stops nagging until the next page load.
const PROFILE_PROMPT_AFTER_USER_MESSAGES = 5;

export default function Research2Page() {
  const { selectedMatterId } = useMatterContext();
  const { isAuthenticated } = useDashboardAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pendingQueryHandled = useRef(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Sticky one-shot flag: once the modal has been shown (whether dismissed
  // or saved) in this page load, don't re-trigger on every subsequent user
  // message. A new tab / refresh resets it so a still-incomplete profile
  // gets re-prompted the next time the user crosses the threshold.
  const profileAskedRef = useRef(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  useEffect(() => { setPaywallEnabled(isPaywallEnabled()); }, []);

  const { balance, ceiling, ready: creditsReady, deductForResponse } = useCredits();
  const wasSearchingRef = useRef(false);
  const [selectedSourceMessageId, setSelectedSourceMessageId] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showCasesPanel, setShowCasesPanel] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isCurrentPinned, setIsCurrentPinned] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close 3-dot menu on outside click
  useEffect(() => {
    if (!showHeaderMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowHeaderMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showHeaderMenu]);

  // Keep isCurrentPinned synced with the active session + the menu state.
  // We re-read on menu-open so the toggle label reflects pin changes that
  // happened in the sidebar without needing a global event bus.

  const [showShareDialog, setShowShareDialog] = useState(false);

  const {
    sessions, sessionsReady, messages, setMessages, currentSessionId,
    historySearch, setHistorySearch, filteredSessions, groupedSessions,
    relativeDateLabel, handleNewSession, handleSelectSession,
    handleDeleteSession, handleRenameSession, ensureSession, historyContextValue,
    pendingCaseId, setPendingCaseId, refreshSessions,
  } = useResearchSessions(selectedMatterId);

  // ── Per-session case selection ─────────────────────────────────────────
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentSessionId || currentSessionId.startsWith('temp_')) {
      // Mirror the pre-session case the user picked in the dialog (if any)
      // so the chat header + File Hub immediately reflect that case even
      // before the row is POSTed. Falls back to null on a vanilla new chat.
      setCurrentCaseId(pendingCaseId);
      return;
    }
    const map = getStoredData<Record<string, string>>(STORAGE_KEYS.SESSION_CASES, {});
    setCurrentCaseId(map[currentSessionId] ?? null);
  }, [currentSessionId, pendingCaseId]);

  // Shared cases list — fetched once, passed to CasesPanel + read by the
  // isolation guard in handleCaseChange. MUST be declared before
  // handleCaseChange uses it (TDZ would otherwise crash the render).
  const [sharedCases, setSharedCases] = useState<CaseItem[]>([]);
  const fetchSharedCases = useCallback(async () => {
    try {
      const res = await api.get<{ cases: CaseItem[] } | CaseItem[]>("/cases");
      const list = Array.isArray(res.data) ? res.data : res.data?.cases ?? [];
      setSharedCases(list);
    } catch { /* silently ignore — components fall back to their own fetch */ }
  }, []);
  useEffect(() => { fetchSharedCases(); }, [fetchSharedCases]);

  const handleCaseChange = useCallback((id: string | null) => {
    // Belt-and-suspenders isolation guard. Every "Unassigned" case is
    // private to ONE session — they exist purely to keep documents
    // scoped to that session. Picking one in the Case Hub dropdown is
    // therefore a DISPLAY-ONLY operation (it switches the Sessions /
    // Drafts tabs to the consolidated Unassigned view); it must NOT
    // overwrite the active session's real case_id (in pendingCaseId
    // for new chats, or in SESSION_CASES for existing chats) — that
    // would cross-contaminate documents between sessions.
    const pickedCase = id ? sharedCases.find((c) => c.id === id) : null;
    const isUnassignedPick = pickedCase?.title === "Unassigned";

    // Always update the UI state — the dropdown + chip + tab filters
    // all read from currentCaseId.
    setCurrentCaseId(id);

    if (!currentSessionId || currentSessionId.startsWith('temp_')) {
      // New chat: only NAMED cases propagate to pendingCaseId. An
      // Unassigned pick keeps pendingCaseId null so the backend
      // auto-creates a fresh private Unassigned on first message.
      setPendingCaseId(isUnassignedPick ? null : id);
      return;
    }

    // Existing session: Unassigned picks are view-only, never persisted.
    // Named picks update the SESSION_CASES quick-lookup cache (the real
    // PATCH /sessions/{id}/case lives in CasesPanel.handleSelectCase).
    if (isUnassignedPick) return;
    const map = getStoredData<Record<string, string>>(STORAGE_KEYS.SESSION_CASES, {});
    if (id) { map[currentSessionId] = id; } else { delete map[currentSessionId]; }
    setStoredData(STORAGE_KEYS.SESSION_CASES, map);
  }, [currentSessionId, setPendingCaseId, sharedCases]);

  // ── New chat ──────────────────────────────────────────────────────────
  // The case dropdown in the header defaults to "Unassigned" automatically,
  // so we just clear the thread state. (We used to fire a "Select a case"
  // toast that hung off the top bar with an upward-arrow icon — it was
  // visually noisy and redundant with the dropdown's built-in default.)
  const handleNewChatWithToast = handleNewSession;

  // (sharedCases hoisted above handleCaseChange — see top of component.)

  // Pre-session case defaulting — DELETED per the per-session-isolated-case
  // change: the backend now creates a private "Unassigned" case automatically
  // for every new session (at session-creation time). With multiple
  // "Unassigned" cases in /cases (one per existing session), picking the
  // first one would assign the new chat into a *different* session's private
  // bucket, defeating the isolation. Leaving `currentCaseId` null is the
  // correct pre-session state — the header falls back to "Unassigned" as a
  // visual hint, and the real private case_id is read off the session row
  // once it's created.

  // Keep `isCurrentPinned` synced — refreshed on session change AND on
  // menu-open so the label flips correctly after the user pins/unpins
  // somewhere else in the app (e.g. the history sidebar's pin button).
  useEffect(() => {
    setIsCurrentPinned(currentSessionId ? pinnedSessionRepository.isPinned(currentSessionId) : false);
  }, [currentSessionId, showHeaderMenu]);

  const handleTogglePin = () => {
    if (!currentSessionId) return;
    if (pinnedSessionRepository.isPinned(currentSessionId)) {
      pinnedSessionRepository.unpin(currentSessionId);
      setIsCurrentPinned(false);
      toast.success("Chat unpinned");
    } else {
      pinnedSessionRepository.pin(currentSessionId);
      setIsCurrentPinned(true);
      toast.success("Chat pinned");
    }
    setShowHeaderMenu(false);
  };

  const handleArchiveCurrent = () => {
    if (!currentSessionId) return;
    archivedSessionRepository.archive(currentSessionId);
    // Tell the sidebar to refresh its archived set without a full reload.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lexram-archive-changed"));
    }
    toast.success("Chat archived");
    setShowHeaderMenu(false);
    handleNewSession();
  };

  const {
    query, setQuery, mode, setMode, queryMode, setQueryMode,
    statusMessage, statusDetail, isSearching, error, streamingText,
    attachedFiles, removeFile, isDragActive, dropHandlers,
    fileInputRef, queryTextareaRef, handleSubmitRef, resizeTextarea,
    webSearchEnabled, setWebSearchEnabled, outputFormat, setOutputFormat,
    analysisDepth, setAnalysisDepth, writingStyle, setWritingStyle,
    selectedPromptPreset, setSelectedPromptPreset,
    liveEditorContent, activeRunMode, handleSubmit, stopGeneration,
    addFiles, attachCaseDocs, buildSessionDraft,
  } = useResearchChat(messages, setMessages, { ensureSession, refreshSessions });

  const lastAi = [...messages].reverse().find((m) => m.role === "ai");
  useEffect(() => { setSelectedSourceMessageId(null); }, [lastAi?.id]);
  const sourceMessage = selectedSourceMessageId
    ? messages.find((m) => m.id === selectedSourceMessageId) ?? lastAi
    : lastAi;

  const {
    showArtifacts, setShowArtifacts, artifactTab, setArtifactTab,
    showHistory, setShowHistory, showShortcuts, setShowShortcuts,
    mobilePane, setMobilePane, selectedAuthorityIndex, setSelectedAuthorityIndex,
    artifactsWidth, isDragging, containerRef, handleDragStart,
    expandedWorking, expandedThinkingTokens, toggleWorking, toggleThinkingTokens,
  } = useResearchUI({ lastAi, queryTextareaRef, handleSubmitRef });

  const shouldAutoSubmit = useRef(false);
  useEffect(() => {
    if (pendingQueryHandled.current) return;
    const pending = sessionStorage.getItem(PENDING_QUERY_KEY);
    if (!pending) return;
    setQuery(pending);
    if (isAuthenticated) {
      // Authed: consume the pending query and submit with a real Bearer token.
      pendingQueryHandled.current = true;
      sessionStorage.removeItem(PENDING_QUERY_KEY);
      shouldAutoSubmit.current = true;
    }
    // Guest: leave the query populated in the input and the key in
    // sessionStorage. The inline "Sign up to get 3 free queries" CTA in
    // ChatInput handles the conversion — no modal on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
  useEffect(() => {
    if (shouldAutoSubmit.current && query.trim()) {
      shouldAutoSubmit.current = false;
      handleSubmitRef.current?.();
    }
  }, [query, handleSubmitRef]);

  // ── Load session from ?session= URL param — fires once when sessions load ──
  const searchParams = useSearchParams();
  const sessionFromUrl = useRef(false);
  useEffect(() => {
    if (sessionFromUrl.current || !sessionsReady) return;
    sessionFromUrl.current = true;
    const sid = searchParams.get("session");
    if (sid) handleSelectSession(sid);
    // intentionally omit searchParams/handleSelectSession — one-shot on load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsReady]);

  // ── Keep URL in sync with active session so refresh restores the same chat ─
  useEffect(() => {
    if (!sessionsReady) return;
    const current = searchParams.get("session");
    if (!currentSessionId || currentSessionId.startsWith("temp_")) {
      if (current) router.replace(pathname, { scroll: false });
      return;
    }
    if (current !== currentSessionId) {
      router.replace(`${pathname}?session=${currentSessionId}`, { scroll: false });
    }
  }, [currentSessionId, sessionsReady, pathname, router, searchParams]);

  const goToSignUp = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed) sessionStorage.setItem(PENDING_QUERY_KEY, trimmed);
    const params = new URLSearchParams();
    if (pathname) params.set("redirect", pathname);
    params.set("intent", "signup");
    router.push(`/sign-in?${params.toString()}`);
  }, [query, router, pathname]);

  // ── Profile completion prompt ───────────────────────────────────────────
  // After the user has sent N messages, gently nudge them to fill in their
  // name + email if user_metadata is missing those fields. One-shot per page
  // load (profileAskedRef) so we don't pester them on every subsequent send.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (profileAskedRef.current) return;
    const userMsgCount = messages.filter((m) => m.role === "user").length;
    if (userMsgCount < PROFILE_PROMPT_AFTER_USER_MESSAGES) return;
    // Mark asked immediately so a rapid second message doesn't fire the
    // getUser() round-trip twice while the first is in flight.
    profileAskedRef.current = true;
    supabase().auth.getUser().then(({ data }) => {
      const m = (data.user?.user_metadata ?? {}) as Record<string, string>;
      const hasName = !!(m.first_name && m.last_name);
      const hasEmail = !!(data.user?.email || m.email);
      // If the profile is already complete, just stay marked-as-asked and
      // never bother them. If it's missing, open the modal.
      if (!hasName || !hasEmail) setShowProfileModal(true);
    });
  }, [messages, isAuthenticated]);

  // Deduct credits when a response finishes streaming, then show paywall if exhausted.
  useEffect(() => {
    if (wasSearchingRef.current && !isSearching) {
      if (paywallEnabled) {
        const lastAiMsg = [...messages].reverse().find((m) => m.role === "ai");
        const text = lastAiMsg?.response?.streamText ?? lastAiMsg?.content ?? "";
        if (text) {
          deductForResponse(mode as BillingMode, text).then((result) => {
            if (result?.exhausted) setShowPaywall(true);
          });
        }
      }
    }
    wasSearchingRef.current = isSearching;
  }, [isSearching]); // eslint-disable-line react-hooks/exhaustive-deps

  const gatedSubmit = useCallback(() => {
    if (!isAuthenticated) {
      goToSignUp();
      return;
    }
    if (paywallEnabled && balance <= 0) {
      setShowPaywall(true);
      return;
    }
    handleSubmit();
  }, [isAuthenticated, paywallEnabled, balance, handleSubmit, goToSignUp]);
  useEffect(() => { handleSubmitRef.current = gatedSubmit; }, [gatedSubmit, handleSubmitRef]);


  const hasThread = messages.length > 0;
  const hasAiAnswer = messages.some((m) => m.role === "ai");
  const lastAiResponse = sourceMessage?.response;
  const sourceMessageIndex = sourceMessage ? messages.findIndex((m) => m.id === sourceMessage.id) : -1;
  const lastUserMessage = sourceMessageIndex > 0
    ? [...messages.slice(0, sourceMessageIndex)].reverse().find((m) => m.role === "user")
    : [...messages].reverse().find((m) => m.role === "user");
  const userInitials = "U";
  const currentSessionTitle = sessions.find((s) => s.id === currentSessionId)?.title ?? "New Conversation";

  // ── "Make Blog" — pipe this research thread into the blog editor ──────
  // Admin-only, since the /api/ai/blog endpoint is admin-gated. Bundles the
  // user's questions, AI prose, authorities, mermaid diagrams, and any saved
  // drafts into sessionStorage, then navigates to /dashboard/blog/create
  // where the page auto-calls the AI to produce a polished post.
  const { role: userRole } = useUserRole();
  const isAdmin = userRole === "admin";
  const [makingBlog, setMakingBlog] = useState(false);
  const handleMakeBlog = useCallback(() => {
    if (!hasAiAnswer) {
      toast.error("Ask a question first — the blog needs research findings to work from.");
      return;
    }
    setMakingBlog(true);
    try {
      const src = buildResearchSourceForBlog(messages, currentSessionTitle);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          BLOG_SOURCE_STORAGE_KEY,
          JSON.stringify(src),
        );
      }
      router.push("/dashboard/blog/create?source=research");
    } finally {
      setMakingBlog(false);
    }
  }, [messages, currentSessionTitle, hasAiAnswer, router]);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/research-2?session=${currentSessionId ?? ""}`;
  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const handleOpenAuthorities = (index: number, messageId?: string) => {
    if (messageId) setSelectedSourceMessageId(messageId);
    setSelectedAuthorityIndex(index);
    setArtifactTab("authorities"); setShowArtifacts(true); setMobilePane("authorities");
  };
  const handleOpenEditor = () => { setArtifactTab("editor"); setShowArtifacts(true); setMobilePane("authorities"); };
  const handleOpenWorkflow = () => { setArtifactTab("workflow"); setShowArtifacts(true); setMobilePane("authorities"); };
  const handleQuerySelect = (q: string) => {
    // Special trigger: "__DEMO__" loads mock messages showcasing all UI blocks
    if (q === "__DEMO__") { loadDemoMessages(); return; }
    setQuery(q);
    setTimeout(() => queryTextareaRef.current?.focus(), 0);
  };

  // ─── Live-playback demo state ──────────────────────────────────────────────
  // The demo is a scripted conversation loaded from demo-conversation.json. It
  // alternates user → ai turns; AI messages with `suggestedAnswers` pause
  // playback until the user clicks a chip, which then resumes the script.
  const demoIndexRef = useRef(0);
  const [demoTyping, setDemoTyping] = useState(false);
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  type DemoMessage = {
    role: "user" | "ai";
    content?: string;
    response?: import("./types").LegalAnswer;
  };
  const demoScript = (demoConversation.messages as DemoMessage[]);

  const makeMessageFromScript = useCallback(
    (entry: DemoMessage, contentOverride?: string): Message => {
      const id = `demo-${entry.role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const timestamp = new Date().toISOString();
      if (entry.role === "user") {
        return {
          id,
          role: "user",
          content: contentOverride ?? entry.content ?? "",
          timestamp,
        };
      }
      return {
        id,
        role: "ai",
        content: "",
        timestamp,
        response: entry.response,
      };
    },
    [],
  );

  const clearDemoTimer = () => {
    if (demoTimerRef.current) {
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  };

  // Advance the demo script starting from `startIdx`. Appends each message
  // sequentially with typing delays. Pauses (returns) when it lands on an AI
  // message that has `suggestedAnswers` — the user must click a chip to
  // continue (handled by handleSuggestedAnswer).
  const advanceDemo = useCallback(
    (startIdx: number, lastUserChipText?: string) => {
      clearDemoTimer();
      if (startIdx >= demoScript.length) return;
      const entry = demoScript[startIdx];

      if (entry.role === "user") {
        const useChip = entry.content === "<<chip>>" && lastUserChipText !== undefined;
        const userMsg = makeMessageFromScript(entry, useChip ? lastUserChipText : undefined);
        setMessages((prev) => [...prev, userMsg]);
        demoIndexRef.current = startIdx + 1;
        demoTimerRef.current = setTimeout(() => {
          setDemoTyping(true);
          demoTimerRef.current = setTimeout(() => {
            setDemoTyping(false);
            advanceDemo(startIdx + 1);
          }, 1400);
        }, 600);
        return;
      }

      // AI turn — append the bubble.
      const aiMsg = makeMessageFromScript(entry);
      setMessages((prev) => [...prev, aiMsg]);
      demoIndexRef.current = startIdx + 1;
      // If the AI message has suggested answers, pause — wait for chip click.
      if (entry.response?.suggestedAnswers?.length) return;
      // Otherwise, continue after a short beat.
      demoTimerRef.current = setTimeout(() => {
        advanceDemo(startIdx + 1);
      }, 800);
    },
    [demoScript, makeMessageFromScript, setMessages],
  );

  const loadDemoMessages = () => {
    clearDemoTimer();
    setDemoTyping(false);
    setMessages([]);
    demoIndexRef.current = 0;
    // Kick off after a tick so React commits the empty state first.
    demoTimerRef.current = setTimeout(() => advanceDemo(0), 60);
  };

  // Clean up any pending demo timer on unmount.
  useEffect(() => () => clearDemoTimer(), []);

  // Clicking a suggested-answer chip:
  //  • In demo mode: substitutes the chip text into the next scripted user
  //    message and resumes playback.
  //  • Otherwise: submits the chip as the user's next real query.
  const handleSuggestedAnswer = (answer: string) => {
    const isDemoThread = messages.some((m) => m.id.startsWith("demo-"));
    if (isDemoThread && demoIndexRef.current < demoScript.length) {
      advanceDemo(demoIndexRef.current, answer);
      return;
    }
    setQuery(answer);
    setTimeout(() => handleSubmitRef.current?.(), 50);
  };

  // The last AI message — used to decide whether to render the floating
  // suggestions popup above the chat input.
  const lastAiMessage = [...messages].reverse().find((m) => m.role === "ai");
  const showSuggestionsPopup =
    !!lastAiMessage?.response?.suggestedAnswers?.length &&
    lastAiMessage.response.suggestedAnswersVariant === "popup";

  const chatInputProps = {
    query, setQuery, mode, setMode, queryMode, setQueryMode,
    onSubmit: gatedSubmit, onStop: stopGeneration, isGenerating: isSearching,
    attachedFiles, removeFile, isDragActive, dropHandlers, fileInputRef,
    queryTextareaRef, resizeTextarea, webSearchEnabled, setWebSearchEnabled,
    outputFormat, setOutputFormat, analysisDepth, setAnalysisDepth,
    writingStyle, setWritingStyle, selectedPromptPreset, setSelectedPromptPreset,
    onFileClick: () => setShowDocumentDialog(true),
    isAuthenticated,
    onSignUp: goToSignUp,
  };

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     RENDER — futuristic theme wrapper
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div data-theme="futuristic" className="flex-1 min-h-0 flex flex-col">
    <ResearchHistoryContext.Provider value={historyContextValue}>
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.doc,.docx" className="sr-only" onChange={(e) => addFiles(e.target.files)} />

      <div
        ref={containerRef}
        className="lex-research-shell flex flex-col h-full max-h-full min-h-0 flex-1 overflow-hidden relative px-2 pt-2 pb-0.5 md:px-4 md:pt-4 md:pb-1"
      >
      {/* Inner row holds the 3 column cards. The disclaimer below lives
          OUTSIDE this row so it sits beneath the chat card, on the cream
          gradient — not inside the rounded card itself. */}
      <div className="flex flex-1 min-h-0 gap-2 md:gap-4">
        {/* ── History Sidebar ────────────────────────────────────────── */}
        <HistorySidebar
          open={showHistory} onToggle={() => setShowHistory((v) => !v)}
          groupedSessions={groupedSessions} filteredSessions={filteredSessions}
          currentSessionId={currentSessionId} onSelectSession={handleSelectSession}
          onNewSession={handleNewChatWithToast} onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession} historySearch={historySearch}
          setHistorySearch={setHistorySearch} relativeDateLabel={relativeDateLabel}
          creditBalance={paywallEnabled ? balance : undefined} creditCeiling={ceiling}
          // Loading flags drive skeleton placeholders so users don't see a
          // "0 / 0" or "No threads yet" flash on every page mount.
          creditsLoading={paywallEnabled && !creditsReady}
          sessionsLoading={!sessionsReady}
          onUpgrade={paywallEnabled ? () => setShowPaywall(true) : undefined}
        />

        {/* ── Chat Area — rounded card matching the reference layout ── */}
        <div className="relative flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--lex-shadow-elevated)] lex-animate-fade-up">
          {/* Modern top-edge progress bar — slides while any API call is
              in flight (axios + lexramRequest fetch wrappers increment the
              global counter). Sits above the header border. */}
          <ApiProgressBar />
          {/* Header — three-zone layout matching the design spec.
              LEFT: "Threads" label + new chat (+) button (also toggles history sidebar)
              CENTER: small case name (italic gray) over bold serif chat title
              RIGHT: case-context chip, bookmark (pin), share, Case hub toggle */}
          {(() => {
            const activeCase = sharedCases.find((c) => c.id === currentCaseId) ?? null;
            const caseLabel = activeCase?.title ?? "Unassigned";
            return (
              <header className="flex items-stretch h-12 md:h-14 border-b border-[var(--border-light)] bg-[var(--lex-cream-soft)] backdrop-blur-sm z-20 relative">
                {/* ── LEFT: history toggle — cream-deep pill with Clock icon
                       matching the palette-professional reference. When the
                       sidebar is closed, hovering this column reveals a
                       floating "+" button so users can start a new chat
                       without opening the sidebar first. ──────────────── */}
                <div className="relative group/history flex">
                  <button
                    type="button"
                    data-tour="research-history"
                    onClick={() => setShowHistory((v) => !v)}
                    aria-label={showHistory ? "Hide threads" : "Show threads"}
                    aria-pressed={showHistory}
                    title={showHistory ? "Hide threads" : "Show threads"}
                    className={`flex items-center justify-center w-12 md:w-14 border-r border-[var(--border-light)] transition-colors ${
                      showHistory
                        ? "bg-[var(--lex-cream-deep)] text-[var(--lex-maroon)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--lex-cream-deep)] hover:text-[var(--lex-maroon)]"
                    }`}
                  >
                    <History className="w-5 h-5" strokeWidth={1.75} />
                  </button>
                  {!showHistory && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleNewChatWithToast(); }}
                      aria-label="New chat"
                      title="New chat"
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-0 grid place-items-center size-9 rounded-full bg-[var(--lex-maroon)] text-[var(--lex-cream)] shadow-[var(--lex-shadow-soft)] opacity-0 scale-50 group-hover/history:opacity-100 group-hover/history:scale-100 hover:opacity-100 hover:scale-100 hover:bg-[var(--lex-maroon)]/90 transition-all duration-200 ease-out z-30 focus-visible:opacity-100 focus-visible:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lex-maroon)]/40"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.25} />
                    </button>
                  )}
                </div>

                {/* ── CENTER: case name (clickable → opens Case Hub) + chat
                       title. The case-name caption replaces the filter chip
                       that used to live on the right; clicking it pops the
                       Case Hub panel so users still have a one-click path
                       to the case context. */}
                <div data-tour="research-title" className="flex-1 min-w-0 flex flex-col justify-center px-3 md:px-5">
                  <button
                    type="button"
                    onClick={() => setShowCasesPanel(true)}
                    aria-label={`Open Case Hub — current case: ${caseLabel}`}
                    title="Open Case Hub"
                    className="self-start text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--lex-maroon)] truncate leading-tight max-w-full transition-colors cursor-pointer"
                  >
                    {caseLabel}
                  </button>
                  <div className="text-[14px] md:text-[17px] font-bold font-serif text-[var(--text-primary)] truncate leading-tight">
                    {currentSessionTitle}
                  </div>
                </div>

                {/* ── RIGHT: bookmark, share, Make blog, Case hub ────
                       The old Filter case-context chip moved to the
                       clickable case-name caption above the session title. */}
                <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                  <button
                    type="button"
                    data-tour="research-bookmark"
                    onClick={handleTogglePin}
                    disabled={!currentSessionId}
                    aria-label={isCurrentPinned ? "Unpin chat" : "Pin chat"}
                    title={isCurrentPinned ? "Unpin chat" : "Pin chat"}
                    className="grid place-items-center size-9 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCurrentPinned ? (
                      <BookmarkCheck className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
                    ) : (
                      <Bookmark className="w-4 h-4" strokeWidth={2} />
                    )}
                  </button>

                  <button
                    type="button"
                    data-tour="research-share"
                    onClick={() => setShowShareDialog(true)}
                    disabled={!hasThread}
                    aria-label="Share chat"
                    title="Share chat"
                    className="grid place-items-center size-9 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Share2 className="w-4 h-4" strokeWidth={2} />
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      data-tour="research-make-blog"
                      onClick={handleMakeBlog}
                      disabled={!hasAiAnswer || makingBlog}
                      aria-label="Turn this research into a blog post"
                      title="Make blog from this research"
                      className="inline-flex items-center gap-1.5 px-2.5 md:px-4 h-9 rounded-full text-[13px] font-medium border border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--lex-rust)] hover:text-[var(--lex-rust)] hover:bg-[var(--lex-rust-soft)] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
                    >
                      {makingBlog ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PenLine className="w-3.5 h-3.5" strokeWidth={2} />
                      )}
                      <span className="hidden md:inline">Make blog</span>
                    </button>
                  )}

                  {/* Hidden 3-dot menu container kept for the menuRef closure */}
                  <div className="relative hidden" ref={menuRef}>
                    {showHeaderMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-[var(--shadow-lg)] border border-[var(--border-light)] py-1.5 z-50">
                        <button onClick={handleArchiveCurrent} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
                          <Archive className="w-4 h-4 text-[var(--text-muted)]" /> Archive
                        </button>
                        <button onClick={() => { if (currentSessionId) handleDeleteSession(currentSessionId); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHTMOST: Case hub button — cream-deep pill ──── */}
                <button
                  type="button"
                  data-tour="research-case-hub"
                  onClick={() => setShowCasesPanel((v) => !v)}
                  aria-label={showCasesPanel ? "Hide Case Hub" : "Show Case Hub"}
                  aria-pressed={showCasesPanel}
                  title="Case Hub"
                  className={`flex items-center gap-2 px-3 md:px-5 border-l border-[var(--border-light)] text-[14px] font-semibold transition-colors ${
                    showCasesPanel
                      ? "bg-[var(--lex-cream-deep)] text-[var(--lex-maroon)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--lex-cream-deep)] hover:text-[var(--lex-maroon)]"
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-[var(--lex-maroon)]" strokeWidth={2} />
                  <span className="hidden sm:inline">Case hub</span>
                </button>
              </header>
            );
          })()}

          {/* Gold streaming progress bar */}
          {isSearching && <div className="lexram-progress-bar flex-shrink-0" />}

          {/* Main content */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden relative" {...dropHandlers}>
              {hasThread ? (
                <ChatThread
                  messages={messages} isSearching={isSearching || demoTyping} streamingText={streamingText}
                  statusMessage={statusMessage} statusDetail={statusDetail} error={error} userInitials={userInitials}
                  expandedWorking={expandedWorking} expandedThinkingTokens={expandedThinkingTokens}
                  toggleWorking={toggleWorking} toggleThinkingTokens={toggleThinkingTokens}
                  onOpenAuthorities={handleOpenAuthorities} onOpenEditor={handleOpenEditor}
                  onOpenWorkflow={handleOpenWorkflow} onQuerySelect={handleQuerySelect}
                  onSuggestedAnswer={handleSuggestedAnswer}
                  onBuildSessionDraft={buildSessionDraft} mobilePane={mobilePane}
                  sessionId={currentSessionId}
                  onRegenerate={(userQuery) => { setQuery(userQuery); setTimeout(() => handleSubmitRef.current?.(), 50); }}
                  onShareSession={() => setShowShareDialog(true)}
                  onPinSession={() => { if (currentSessionId) pinnedSessionRepository.pin(currentSessionId); }}
                  onEditMessage={(content) => { setQuery(content); setTimeout(() => queryTextareaRef.current?.focus(), 0); }}
                  onProceedWithDraft={() => { setQuery("yes"); setTimeout(() => handleSubmitRef.current?.(), 50); }}
                />
              ) : (
                <EmptyState
                  onPickQuickStart={handleQuerySelect}
                  // "Upload a document" chip → open the in-app DocumentDialog
                  // (list + upload UI) instead of the OS file picker.
                  onUpload={() => setShowDocumentDialog(true)}
                  onPickDraft={(q) => {
                    setQueryMode("draft");
                    setQuery(q);
                    setTimeout(() => queryTextareaRef.current?.focus(), 0);
                  }}
                  onStartDraft={() => {
                    setQueryMode("draft");
                    setQuery("hi");
                    setTimeout(() => handleSubmitRef.current?.(), 50);
                  }}
                  // Hero input — same query state + submit handler as the
                  // bottom ChatInput. Bottom input is hidden in empty state
                  // so the hero is the only entry point.
                  query={query}
                  setQuery={setQuery}
                  onSubmit={gatedSubmit}
                  isGenerating={isSearching}
                  isAuthenticated={isAuthenticated}
                  onSignUp={goToSignUp}
                  isDraftMode={queryMode === "draft"}
                  onToggleDraftMode={() =>
                    setQueryMode(queryMode === "draft" ? "deep" : "draft")
                  }
                />
              )}

              {/* Floating suggestions popup (Claude/ChatGPT style) — appears
                  above the input when the last AI message uses the "popup"
                  variant for its suggested answers. */}
              {showSuggestionsPopup && lastAiMessage?.response && (
                <SuggestionsPopup
                  heading={lastAiMessage.response.suggestedAnswersHeading}
                  suggestions={lastAiMessage.response.suggestedAnswers!}
                  onPick={handleSuggestedAnswer}
                />
              )}

              {/* Bottom ChatInput — hidden in empty state since the hero
                  EmptyState renders its own large center input. Once a
                  thread is started, this returns as the persistent input.
                  The "Lexram can make mistakes" disclaimer now lives
                  OUTSIDE the rounded chat card (below the inner row). */}
              {hasThread && (
                <div className="px-3 md:px-6 pb-2">
                  <ChatInput {...chatInputProps} hasThread={hasThread} />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Case Hub — rightmost sibling of the chat area ─── */}
        <CasesPanel
          open={showCasesPanel}
          onToggle={() => setShowCasesPanel((v) => !v)}
          sessions={filteredSessions}
          currentSessionId={currentSessionId}
          currentCaseId={currentCaseId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewChatWithToast}
          relativeDateLabel={relativeDateLabel}
          onUploadDocument={() => setShowDocumentDialog(true)}
          onCaseChange={handleCaseChange}
          externalCases={sharedCases}
          onCasesChanged={fetchSharedCases}
          onAttachDocs={(docs) => {
            // attachCaseDocs expects { id, name, mime_type? } — map from CasesPanel's CaseDoc format
            attachCaseDocs(docs.map((d) => ({
              id: d.caseDocId ?? d.id,
              name: d.name,
              size: d.size,
              mime_type: d.type !== "document" ? d.type : undefined,
            })));
          }}
        />
      </div>

      {/* Disclaimer — lives on the cream gradient, BELOW the three column
          cards. Centered under the chat card; tight top/bottom padding so
          it doesn't open up dead space between the input pill and the
          bottom of the viewport. */}
      <div className="flex-shrink-0 text-center pt-1.5 pb-0 text-[10px] text-[var(--text-muted)] font-medium tracking-wide uppercase leading-none">
        Lexram can make mistakes. Verify legal data.
      </div>
      </div>

      {paywallEnabled && <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />}

      <ProfileCompletionModal
        open={showProfileModal}
        onSaved={() => setShowProfileModal(false)}
        onDismiss={() => setShowProfileModal(false)}
      />

      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <DocumentDialog
        open={showDocumentDialog}
        onOpenChange={setShowDocumentDialog}
        caseId={currentCaseId}
        // No case picked + no session yet → create the session on demand so
        // the backend auto-creates its private Unassigned case. Then read
        // case_id from the SESSION_CASES localStorage cache (chatSession
        // repository writes it synchronously after create, before this
        // promise resolves) so the dialog can proceed with the upload
        // immediately, even though React state hasn't re-rendered yet.
        ensureCaseId={async () => {
          if (currentCaseId) return currentCaseId;
          const sid = await ensureSession("New chat");
          if (!sid) return null;
          const map = getStoredData<Record<string, string>>(STORAGE_KEYS.SESSION_CASES, {});
          return map[sid] ?? null;
        }}
        onAttach={(docs) => {
          attachCaseDocs(docs);
          setShowDocumentDialog(false);
        }}
      />


      {/* ── Share Dialog ──────────────────────────────────────────────── */}
      {showShareDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowShareDialog(false)}>
          <div className="bg-white rounded-2xl shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] oracle-serif">Share this chat</h3>
              <button onClick={() => setShowShareDialog(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Anyone with the link can view this conversation.</p>
            {/* URL row */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1 bg-[var(--surface-hover)] rounded-lg px-3 py-2.5 text-xs text-[var(--text-primary)] font-mono truncate border border-[var(--border-light)]">
                {shareUrl}
              </div>
              <button
                onClick={handleCopyShareLink}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors flex-shrink-0"
              >
                {shareCopied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Link2 className="w-3.5 h-3.5" /> Copy link</>}
              </button>
            </div>
            {/* Sharing options */}
            <div className="border-t border-[var(--border-light)] pt-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-3">Share via</p>
              <div className="flex gap-3">
                <a href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366]/10 text-[#25D366] text-xs font-semibold hover:bg-[#25D366]/20 transition-colors">
                  WhatsApp
                </a>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0088cc]/10 text-[#0088cc] text-xs font-semibold hover:bg-[#0088cc]/20 transition-colors">
                  Telegram
                </a>
                <a href={`mailto:?subject=LexRam Chat&body=${encodeURIComponent(shareUrl)}`} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-hover)] text-[var(--text-secondary)] text-xs font-semibold hover:bg-[var(--border-light)] transition-colors">
                  Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </ResearchHistoryContext.Provider>
    </div>
  );
}
