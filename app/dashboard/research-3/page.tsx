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
import PaywallModal from "@/components/PaywallModal";
import SignupPromptModal from "@/components/SignupPromptModal";

const GUEST_MESSAGE_LIMIT = 1;
const FREE_MESSAGE_LIMIT = 3;

export default function Research3Page() {
  const { selectedMatterId } = useMatterContext();
  const { isAuthenticated, markAuthenticated } = useDashboardAuth();
  const pendingQueryHandled = useRef(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

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
    historyContextValue,
  } = useResearchSessions(selectedMatterId);

  const {
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
    buildSessionDraft,
  } = useResearchChat(messages, setMessages);

  const lastAi = [...messages].reverse().find((m) => m.role === "ai");

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

  const gatedSubmit = useCallback(() => {
    // Guest: 1 message allowed, then show signup
    if (!isAuthenticated && userMessageCount >= GUEST_MESSAGE_LIMIT) {
      setShowSignupPrompt(true);
      return;
    }
    // Authenticated free user: 3 messages allowed, then show paywall
    if (isAuthenticated && userMessageCount >= FREE_MESSAGE_LIMIT) {
      setShowPaywall(true);
      return;
    }
    handleSubmit();
  }, [isAuthenticated, userMessageCount, handleSubmit]);

  // Keep handleSubmitRef in sync with gated version for auto-submit
  useEffect(() => {
    handleSubmitRef.current = gatedSubmit;
  }, [gatedSubmit, handleSubmitRef]);

  // ── Derived values ─────────────────────────────────────────────────────
  const hasThread = messages.length > 0;
  const lastAiResponse = lastAi?.response;
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  const userInitials = "U";
  const currentSessionTitle =
    sessions.find((s) => s.id === currentSessionId)?.title ?? "New Conversation";

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleOpenAuthorities = (index: number) => {
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
    onFileClick: () => fileInputRef.current?.click(),
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
        className="flex h-full overflow-hidden bg-[var(--bg-primary)] relative"
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
          historySearch={historySearch}
          setHistorySearch={setHistorySearch}
          relativeDateLabel={relativeDateLabel}
        />

        {/* ── Center: Chat area ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/80 backdrop-blur-sm">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              title="Toggle chat history"
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
            <div className="max-w-[60%] truncate text-xs font-medium text-[var(--text-muted)]">
              {currentSessionTitle}
            </div>
          </div>

          {/* Mobile pane switcher */}
          {hasThread && (
            <div className="flex lg:hidden border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex-shrink-0">
              <button
                onClick={() => setMobilePane("chat")}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  mobilePane === "chat"
                    ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setMobilePane("authorities")}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  mobilePane === "authorities"
                    ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                Artifacts
              </button>
            </div>
          )}

          {/* Main content */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Chat panel */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              {hasThread ? (
                <>
                  <ChatThread
                    messages={messages}
                    isSearching={isSearching}
                    streamingText={streamingText}
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
                  <ChatInput {...chatInputProps} hasThread={true} />
                </>
              ) : (
                <EmptyState {...chatInputProps} />
              )}
            </div>

            {/* Drag resize handle */}
            {showArtifacts && (
              <div
                onMouseDown={handleDragStart}
                className={`hidden lg:flex w-1 cursor-col-resize flex-shrink-0 items-center justify-center bg-[var(--border-default)] hover:bg-[var(--accent)]/40 transition-colors ${isDragging ? "bg-[var(--accent)]/40" : ""}`}
              />
            )}

            {/* Artifacts panel */}
            {showArtifacts && (
              <div
                className="hidden lg:flex lg:flex-col flex-shrink-0 overflow-hidden border-l border-[var(--border-default)]"
                style={{ width: `${artifactsWidth}%` }}
              >
                <AuthoritiesPanel
                  showArtifacts={showArtifacts}
                  mobilePane={mobilePane}
                  artifactTab={artifactTab}
                  setArtifactTab={setArtifactTab}
                  lastResponse={lastAiResponse}
                  currentQuestion={lastUserMessage?.content}
                  workflowCount={lastAiResponse?.workflowSteps?.length ?? 0}
                  authorityCount={lastAiResponse?.authorities?.length ?? 0}
                  selectedAuthorityIndex={selectedAuthorityIndex}
                  onSelectAuthority={setSelectedAuthorityIndex}
                  liveEditorContent={liveEditorContent}
                  isDraftArtifactStreaming={isSearching && activeRunMode === "draft"}
                  sessionId={currentSessionId}
                  width={artifactsWidth}
                />
              </div>
            )}

            {/* Mobile artifacts pane */}
            {mobilePane === "authorities" && (
              <div className="lg:hidden flex-1 flex flex-col overflow-hidden border-l border-[var(--border-default)]">
                <AuthoritiesPanel
                  showArtifacts={true}
                  mobilePane={mobilePane}
                  artifactTab={artifactTab}
                  setArtifactTab={setArtifactTab}
                  lastResponse={lastAiResponse}
                  currentQuestion={lastUserMessage?.content}
                  workflowCount={lastAiResponse?.workflowSteps?.length ?? 0}
                  authorityCount={lastAiResponse?.authorities?.length ?? 0}
                  selectedAuthorityIndex={selectedAuthorityIndex}
                  onSelectAuthority={setSelectedAuthorityIndex}
                  liveEditorContent={liveEditorContent}
                  isDraftArtifactStreaming={isSearching && activeRunMode === "draft"}
                  sessionId={currentSessionId}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signup prompt — shown after 1 msg for unauthenticated users (non-closable) */}
      <SignupPromptModal
        open={showSignupPrompt}
        onAuthenticated={() => {
          setShowSignupPrompt(false);
          markAuthenticated();
        }}
      />

      {/* Paywall modal — shown after 3 msgs for authenticated free users */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
      />

      {/* Shortcuts modal */}
      <ShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </ResearchHistoryContext.Provider>
  );
}
