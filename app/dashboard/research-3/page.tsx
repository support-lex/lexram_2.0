"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { History, Briefcase, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { useMatterContext } from "@/lib/matter-context";
import { ResearchHistoryContext } from "@/lib/research-history-context";
import { getStoredData, setStoredData, STORAGE_KEYS } from "@/lib/storage";
import { useDashboardAuth } from "@/lib/dashboard-auth-context";

import { useResearchSessions } from "./hooks/use-research-sessions";
import { useResearchChat } from "./hooks/use-research-chat";
import { useResearchUI } from "./hooks/use-research-ui";

import HistorySidebar from "./components/HistorySidebar";
import CasesPanel from "./components/CasesPanel";
import EmptyState from "./components/EmptyState";
import ChatThread from "./components/ChatThread";
import ChatInput from "./components/ChatInput";
import AuthoritiesPanel from "./components/AuthoritiesPanel";
import ShortcutsModal from "./components/ShortcutsModal";
import DocumentDialog from "./components/DocumentDialog";
import SignupPromptModal from "@/components/SignupPromptModal";
import CaseSelector, { type Case as CaseItem } from "@/components/CaseSelector";
import api from "@/services/legal-api";
import PaywallModal from "@/components/PaywallModal";
import { useCredits } from "@/hooks/use-credits";
import type { BillingMode } from "@/lib/billing";
import { isPaywallEnabled } from "@/lib/billing";

const GUEST_MESSAGE_LIMIT =
  typeof window !== "undefined" && window.location.hostname === "lexram-2-0-ui.vercel.app"
    ? Infinity
    : 1;

export default function Research3Page() {
  const { selectedMatterId } = useMatterContext();
  const { isAuthenticated, markAuthenticated } = useDashboardAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingQueryHandled = useRef(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  useEffect(() => { setPaywallEnabled(isPaywallEnabled()); }, []);

  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const { balance, ceiling, deductForResponse } = useCredits();
  const wasSearchingRef = useRef(false);
  // Which AI message's authorities are pinned in the side panel. null = follow
  // the latest AI message (default). Set when the user clicks a <cite> in an
  // older bubble — without this, the panel always snaps to the latest message
  // and earlier-question sources disappear after a follow-up.
  const [selectedSourceMessageId, setSelectedSourceMessageId] = useState<string | null>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────
  const {
    sessions,
    sessionsReady,
    messages,
    setMessages,
    currentSessionId,
    historySearch,
    setHistorySearch,
    filteredSessions,
    groupedSessions,
    relativeDateLabel,
    handleNewSession,
    handleSelectSession,
    handleDeleteSession,
    handleRenameSession,
    ensureSession,
    historyContextValue,
    pendingCaseId,
    setPendingCaseId,
  } = useResearchSessions(selectedMatterId);

  // ── Per-session case selection ─────────────────────────────────────────
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [showCasesPanel, setShowCasesPanel] = useState(false);

  useEffect(() => {
    if (!currentSessionId || currentSessionId.startsWith('temp_')) {
      // Mirror the pre-session case picked in the dialog so the chat header +
      // File Hub immediately reflect that case even before the row is POSTed.
      setCurrentCaseId(pendingCaseId);
      return;
    }
    const map = getStoredData<Record<string, string>>(STORAGE_KEYS.SESSION_CASES, {});
    setCurrentCaseId(map[currentSessionId] ?? null);
  }, [currentSessionId, pendingCaseId]);

  // Shared cases list
  const [sharedCases, setSharedCases] = useState<CaseItem[]>([]);
  const fetchSharedCases = useCallback(async () => {
    try {
      const res = await api.get<{ cases: CaseItem[] } | CaseItem[]>("/cases");
      setSharedCases(Array.isArray(res.data) ? res.data : res.data?.cases ?? []);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { fetchSharedCases(); }, [fetchSharedCases]);

  const handleCaseChange = useCallback((id: string | null) => {
    setCurrentCaseId(id);
    if (!currentSessionId || currentSessionId.startsWith('temp_')) {
      // No session yet → stash the pick in pendingCaseId so the upcoming
      // POST /sessions includes it as case_id.
      setPendingCaseId(id);
      return;
    }
    const map = getStoredData<Record<string, string>>(STORAGE_KEYS.SESSION_CASES, {});
    if (id) { map[currentSessionId] = id; } else { delete map[currentSessionId]; }
    setStoredData(STORAGE_KEYS.SESSION_CASES, map);
  }, [currentSessionId, setPendingCaseId]);

  // ── New chat → toast nudging the user to pick a case ──────────────────
  // The case dropdown in the header stays visible so the user can pick (or
  // leave it as Unassigned, which is the default pre-selection set by the
  // effect below once /cases has loaded).
  const handleNewChatWithToast = useCallback(() => {
    handleNewSession();
    toast.message("Select a case for this chat", {
      icon: <ArrowUp className="w-4 h-4 text-[var(--accent)]" />,
      description: "Use the case dropdown above. Defaults to Unassigned.",
      duration: 5000,
      // top-center keeps the toast from overlapping the collapsed left rail
      // icons (which `top-left` was covering) while staying close enough to
      // the case dropdown that the ArrowUp icon still reads as "look above".
      position: "top-center",
    });
  }, [handleNewSession]);

  // ── Default the pre-session case to "Unassigned" ──────────────────────
  // Seed both currentCaseId (UI display) and pendingCaseId (POST /sessions
  // payload) with the Unassigned row's id once /cases has loaded. Skips
  // when a session row already exists or the user has already picked.
  useEffect(() => {
    if (sharedCases.length === 0) return;
    if (currentSessionId && !currentSessionId.startsWith('temp_')) return;
    if (currentCaseId) return;
    const unassigned = sharedCases.find((c) => c.title === 'Unassigned');
    if (!unassigned) return;
    setCurrentCaseId(unassigned.id);
    setPendingCaseId(unassigned.id);
  }, [sharedCases, currentSessionId, currentCaseId, setPendingCaseId]);

  const {
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
    resizeTextarea,
    webSearchEnabled,
    setWebSearchEnabled,
    outputFormat,
    setOutputFormat,
    analysisDepth,
    setAnalysisDepth,
    writingStyle,
    setWritingStyle,
    selectedPromptPreset,
    setSelectedPromptPreset,
    liveEditorContent,
    activeRunMode,
    handleSubmit,
    stopGeneration,
    addFiles,
    attachCaseDocs,
    buildSessionDraft,
  } = useResearchChat(messages, setMessages, { ensureSession });

  const lastAi = [...messages].reverse().find((m) => m.role === "ai");
  // Reset the per-message override whenever a new AI message arrives so the
  // panel resumes following the latest answer for the next turn.
  useEffect(() => {
    setSelectedSourceMessageId(null);
  }, [lastAi?.id]);
  const sourceMessage = selectedSourceMessageId
    ? messages.find((m) => m.id === selectedSourceMessageId) ?? lastAi
    : lastAi;

  const {
    showArtifacts,
    setShowArtifacts,
    artifactTab,
    setArtifactTab,
    showHistory,
    setShowHistory,
    showShortcuts,
    setShowShortcuts,
    mobilePane,
    setMobilePane,
    selectedAuthorityIndex,
    setSelectedAuthorityIndex,
    artifactsWidth,
    isDragging,
    containerRef,
    handleDragStart,
    expandedWorking,
    expandedThinkingTokens,
    toggleWorking,
    toggleThinkingTokens,
  } = useResearchUI({ lastAi, queryTextareaRef, handleSubmitRef });

  // ── Auto-load pending query from home page ─────────────────────────────
  const shouldAutoSubmit = useRef(false);

  useEffect(() => {
    if (pendingQueryHandled.current) return;
    const pending = sessionStorage.getItem('lexram_pending_query');
    if (!pending) return;

    pendingQueryHandled.current = true;
    sessionStorage.removeItem('lexram_pending_query');

    // Set query - auto-submit will fire in the next effect when query updates
    setQuery(pending);
    shouldAutoSubmit.current = true;
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire auto-submit once query state is updated
  useEffect(() => {
    if (shouldAutoSubmit.current && query.trim()) {
      shouldAutoSubmit.current = false;
      handleSubmitRef.current?.();
    }
  }, [query, handleSubmitRef]);

  // ── Session URL restore: load session from ?session= param — fires once ──
  const sessionFromUrl = useRef(false);
  useEffect(() => {
    if (sessionFromUrl.current || !sessionsReady) return;
    sessionFromUrl.current = true;
    const sid = searchParams.get("session");
    if (sid) handleSelectSession(sid);
    // intentionally omit searchParams/handleSelectSession — one-shot on load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsReady]);

  // ── Keep URL in sync with active session so refresh restores the same chat
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

  // ── Free-tier gate ─────────────────────────────────────────────────────
  const userMessageCount = messages.filter(m => m.role === "user").length;

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
    // Guest: 1 message allowed, then show signup
    if (!isAuthenticated && userMessageCount >= GUEST_MESSAGE_LIMIT) {
      setShowSignupPrompt(true);
      return;
    }
    // Authenticated but out of credits
    if (paywallEnabled && isAuthenticated && balance <= 0) {
      setShowPaywall(true);
      return;
    }
    handleSubmit();
  }, [isAuthenticated, userMessageCount, paywallEnabled, balance, handleSubmit]);

  // Keep handleSubmitRef in sync with gated version for auto-submit
  useEffect(() => {
    handleSubmitRef.current = gatedSubmit;
  }, [gatedSubmit, handleSubmitRef]);

  // ── Derived values ─────────────────────────────────────────────────────
  const hasThread = messages.length > 0;
  const lastAiResponse = sourceMessage?.response;
  // The user question that produced the currently-displayed sources, not just
  // the most recent question — keeps the panel header in sync with the panel
  // body when the user pins an older message's authorities.
  const sourceMessageIndex = sourceMessage
    ? messages.findIndex((m) => m.id === sourceMessage.id)
    : -1;
  const lastUserMessage =
    sourceMessageIndex > 0
      ? [...messages.slice(0, sourceMessageIndex)].reverse().find((m) => m.role === "user")
      : [...messages].reverse().find((m) => m.role === "user");

  const userInitials = "U";
  const currentSessionTitle =
    sessions.find((s) => s.id === currentSessionId)?.title ?? "New Conversation";

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleOpenAuthorities = (index: number, messageId?: string) => {
    // Pin the panel to the message the citation came from. Without this the
    // panel always shows the latest AI answer, so clicking [1] inside Q1 after
    // Q2 has been asked would show Q2's sources instead of Q1's.
    if (messageId) setSelectedSourceMessageId(messageId);
    setSelectedAuthorityIndex(index);
    setArtifactTab("authorities");
    setShowArtifacts(true);
    setMobilePane("authorities");
  };

  const handleOpenEditor = () => {
    setArtifactTab("editor");
    setShowArtifacts(true);
    setMobilePane("authorities");
  };

  const handleOpenWorkflow = () => {
    setArtifactTab("workflow");
    setShowArtifacts(true);
    setMobilePane("authorities");
  };

  const handleQuerySelect = (q: string) => {
    setQuery(q);
    setTimeout(() => queryTextareaRef.current?.focus(), 0);
  };

  // Submit a bundled answer to a multi-question prompt from the assistant
  // (the inline numbered-questions form). Pushes the formatted "1. … 2. …"
  // string into the chat input and fires the same submit path a manual
  // send would, so the AI sees an ordered, ready-to-parse response.
  const handleSuggestedAnswer = (answer: string) => {
    setQuery(answer);
    setTimeout(() => handleSubmitRef.current?.(), 50);
  };

  const chatInputProps = {
    query,
    setQuery,
    mode,
    setMode,
    queryMode,
    setQueryMode,
    onSubmit: gatedSubmit,
    onStop: stopGeneration,
    isGenerating: isSearching,
    attachedFiles,
    removeFile,
    isDragActive,
    dropHandlers,
    fileInputRef,
    queryTextareaRef,
    resizeTextarea,
    webSearchEnabled,
    setWebSearchEnabled,
    outputFormat,
    setOutputFormat,
    analysisDepth,
    setAnalysisDepth,
    writingStyle,
    setWritingStyle,
    selectedPromptPreset,
    setSelectedPromptPreset,
    // Click the paperclip → open the documents dialog (list + upload).
    // The hidden OS file input is still wired for drag-drop into the chat area.
    onFileClick: () => setShowDocumentDialog(true),
  };

  return (
    <ResearchHistoryContext.Provider value={historyContextValue}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,.doc,.docx"
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
      />

      <div
        ref={containerRef}
        // Bind explicitly to viewport height (svh accounts for mobile chrome).
        // Using h-full is unsafe here because the dashboard SidebarInset only
        // sets `minHeight`, so % heights cascade through an undefined parent
        // and the row collapses to content height — which means the History
        // rail's tall content pushes the chat panel down, dragging the input
        // bar out of view. Hard-binding to 100svh + max-h locks the bounds.
        className="flex h-[100svh] max-h-[100svh] overflow-hidden bg-[var(--bg-primary)] relative"
      >
        {/* ── Left: History Sidebar ───────────────────────────────────── */}
        <HistorySidebar
          open={showHistory}
          onToggle={() => setShowHistory((v) => !v)}
          groupedSessions={groupedSessions}
          filteredSessions={filteredSessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewChatWithToast}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          historySearch={historySearch}
          setHistorySearch={setHistorySearch}
          relativeDateLabel={relativeDateLabel}
        />

        {/* ── Center: Chat area ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                title="Toggle chat history"
              >
                <History className="w-3.5 h-3.5" />
                History
              </button>
              {/* Case dropdown is always visible. Pre-session, CaseSelector
                  skips its PATCH and the pick lands in pendingCaseId via
                  handleCaseChange, ready for POST /sessions on first message. */}
              <CaseSelector
                sessionId={currentSessionId}
                value={currentCaseId}
                onChange={(id, c) => { handleCaseChange(id); if (c) fetchSharedCases(); }}
                externalCases={sharedCases}
                onCasesChanged={fetchSharedCases}
                className="w-56"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="max-w-[160px] truncate text-xs font-medium text-[var(--text-muted)]">
                {currentSessionTitle}
              </div>
              <button
                type="button"
                onClick={() => setShowCasesPanel((v) => !v)}
                aria-label={showCasesPanel ? "Hide Case Hub" : "Show Case Hub"}
                title="Case Hub"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors
                  ${showCasesPanel
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/5 text-[var(--accent)]"
                    : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Cases
              </button>
            </div>
          </div>

          {/* Gold streaming progress bar — indeterminate shimmer at top */}
          {isSearching && <div className="lexram-progress-bar flex-shrink-0" />}

          {/* Main content */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Chat panel — flexbox column with single, fixed-position ChatInput.
                `min-h-0` on the column is essential: without it, ChatThread's
                growing content can push the column past its parent's height
                and the input would drift downward. With it, ChatThread takes
                the remaining space (flex-1) and scrolls internally; ChatInput
                stays anchored to the bottom of the column. */}
            <div
              className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden relative"
              {...dropHandlers}
            >
              {hasThread ? (
                <ChatThread
                  messages={messages}
                  isSearching={isSearching}
                  streamingText={streamingText}
                  statusMessage={statusMessage}
                  error={error}
                  userInitials={userInitials}
                  expandedWorking={expandedWorking}
                  expandedThinkingTokens={expandedThinkingTokens}
                  toggleWorking={toggleWorking}
                  toggleThinkingTokens={toggleThinkingTokens}
                  onOpenAuthorities={handleOpenAuthorities}
                  onOpenEditor={handleOpenEditor}
                  onOpenWorkflow={handleOpenWorkflow}
                  onQuerySelect={handleQuerySelect}
                  onSuggestedAnswer={handleSuggestedAnswer}
                  onBuildSessionDraft={buildSessionDraft}
                  mobilePane={mobilePane}
                  onProceedWithDraft={() => { setQuery("yes"); setTimeout(() => handleSubmitRef.current?.(), 50); }}
                />
              ) : (
                <EmptyState
                  onPickQuickStart={handleQuerySelect}
                  // "Upload a document" chip → open the in-app DocumentDialog
                  // instead of the OS file picker.
                  onUpload={() => setShowDocumentDialog(true)}
                  onPickDraft={(q) => {
                    setQueryMode("draft");
                    setQuery(q);
                    setTimeout(() => queryTextareaRef.current?.focus(), 0);
                  }}
                  // Click the Draft card body → seed "hi" in draft mode and
                  // auto-submit so the session is born already in draft mode.
                  onStartDraft={() => {
                    setQueryMode("draft");
                    setQuery("hi");
                    setTimeout(() => handleSubmitRef.current?.(), 50);
                  }}
                />
              )}

              {/* The chat input is always rendered here, as the last child of
                  the flex column. It does NOT participate in flex-grow, so it
                  always sits at the bottom of the column at a stable height,
                  regardless of how tall the chat thread or empty state grows. */}
              <ChatInput {...chatInputProps} hasThread={hasThread} />
              <div className="flex-shrink-0 text-center py-1.5 text-[10px] text-[var(--text-muted)] tracking-wide">
                Verified with LexRam Sovereignty Engine &middot; AI can hallucinate legal citations.
              </div>
            </div>

            {/* Citations are rendered next to each AI message bubble inside
                the chat scroll (see MessageBubble) — no separate side rail. */}
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
            attachCaseDocs(docs.map((d) => ({
              id: d.caseDocId ?? d.id,
              name: d.name,
              size: d.size,
              mime_type: d.type !== "document" ? d.type : undefined,
            })));
          }}
        />
      </div>

      {paywallEnabled && <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />}

      {/* Signup prompt — shown after 1 msg for unauthenticated users (non-closable) */}
      <SignupPromptModal
        open={showSignupPrompt}
        onAuthenticated={() => {
          setShowSignupPrompt(false);
          markAuthenticated();
        }}
      />


      {/* Shortcuts modal */}
      <ShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Document dialog — list + upload session documents */}
      <DocumentDialog
        open={showDocumentDialog}
        onOpenChange={setShowDocumentDialog}
        caseId={currentCaseId}
        onAttach={(docs) => {
          attachCaseDocs(docs);
          setShowDocumentDialog(false);
        }}
      />

    </ResearchHistoryContext.Provider>
  );
}
