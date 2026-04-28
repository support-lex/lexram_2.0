"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { History } from "lucide-react";
import { useMatterContext } from "@/lib/matter-context";
import { ResearchHistoryContext } from "@/lib/research-history-context";
import { useDashboardAuth } from "@/lib/dashboard-auth-context";

import { useResearchSessions } from "./hooks/use-research-sessions";
import { useResearchChat } from "./hooks/use-research-chat";
import { useResearchUI } from "./hooks/use-research-ui";

import HistorySidebar from "./components/HistorySidebar";
import EmptyState from "./components/EmptyState";
import ChatThread from "./components/ChatThread";
import ChatInput from "./components/ChatInput";
import AuthoritiesPanel from "./components/AuthoritiesPanel";
import ShortcutsModal from "./components/ShortcutsModal";
import DocumentDialog from "./components/DocumentDialog";
import SignupPromptModal from "@/components/SignupPromptModal";
import CaseSelector from "@/components/CaseSelector";
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
  const pendingQueryHandled = useRef(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  useEffect(() => { setPaywallEnabled(isPaywallEnabled()); }, []);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const { balance, ceiling, deductForResponse } = useCredits();
  const wasSearchingRef = useRef(false);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  // Which AI message's authorities are pinned in the side panel. null = follow
  // the latest AI message (default). Set when the user clicks a <cite> in an
  // older bubble — without this, the panel always snaps to the latest message
  // and earlier-question sources disappear after a follow-up.
  const [selectedSourceMessageId, setSelectedSourceMessageId] = useState<string | null>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────
  const {
    sessions,
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
  } = useResearchSessions(selectedMatterId);

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

  // ── Free-tier gate ─────────────────────────────────────────────────────
  const userMessageCount = messages.filter(m => m.role === "user").length;

  // Deduct credits when a response finishes streaming, then show paywall if exhausted.
  useEffect(() => {
    if (wasSearchingRef.current && !isSearching) {
      if (paywallEnabled) {
        const lastAiMsg = [...messages].reverse().find((m) => m.role === "ai");
        const text = lastAiMsg?.response?.streamText ?? lastAiMsg?.content ?? "";
        if (text) {
          const result = deductForResponse(mode as BillingMode, text);
          if (result?.exhausted) setShowPaywall(true);
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
          onNewSession={handleNewSession}
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
              {currentSessionId && (
                <CaseSelector
                  sessionId={currentSessionId}
                  value={currentCaseId}
                  onChange={(id) => setCurrentCaseId(id)}
                  className="w-56"
                />
              )}
            </div>
            <div className="max-w-[40%] truncate text-xs font-medium text-[var(--text-muted)]">
              {currentSessionTitle}
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
                  onBuildSessionDraft={buildSessionDraft}
                  mobilePane={mobilePane}
                />
              ) : (
                <EmptyState
                  onPickQuickStart={handleQuerySelect}
                  onUpload={() => fileInputRef.current?.click()}
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
