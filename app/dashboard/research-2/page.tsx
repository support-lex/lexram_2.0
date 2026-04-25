"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { History, Share, MoreHorizontal, Users, Pin, Archive, Trash2, Check, Link2 } from "lucide-react";
import { pinnedSessionRepository } from "@/modules/chat/repository/feedback.repository";
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
import PaywallModal from "@/components/PaywallModal";
import SignupPromptModal from "@/components/SignupPromptModal";
import CaseSelector from "@/components/CaseSelector";

const GUEST_MESSAGE_LIMIT = 1;
const FREE_MESSAGE_LIMIT = 3;

export default function Research2Page() {
  const { selectedMatterId } = useMatterContext();
  const { isAuthenticated, markAuthenticated } = useDashboardAuth();
  const pendingQueryHandled = useRef(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [selectedSourceMessageId, setSelectedSourceMessageId] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
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

  const [showShareDialog, setShowShareDialog] = useState(false);

  const {
    sessions, messages, setMessages, currentSessionId,
    historySearch, setHistorySearch, filteredSessions, groupedSessions,
    relativeDateLabel, handleNewSession, handleSelectSession,
    handleDeleteSession, handleRenameSession, ensureSession, historyContextValue,
  } = useResearchSessions(selectedMatterId);

  const {
    query, setQuery, mode, setMode, queryMode, setQueryMode,
    statusMessage, isSearching, error, streamingText,
    attachedFiles, removeFile, isDragActive, dropHandlers,
    fileInputRef, queryTextareaRef, handleSubmitRef, resizeTextarea,
    webSearchEnabled, setWebSearchEnabled, outputFormat, setOutputFormat,
    analysisDepth, setAnalysisDepth, writingStyle, setWritingStyle,
    selectedPromptPreset, setSelectedPromptPreset,
    liveEditorContent, activeRunMode, handleSubmit, stopGeneration,
    addFiles, attachCaseDocs, buildSessionDraft,
  } = useResearchChat(messages, setMessages, { ensureSession });

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
    const pending = sessionStorage.getItem("lexram_pending_query");
    if (!pending) return;
    pendingQueryHandled.current = true;
    sessionStorage.removeItem("lexram_pending_query");
    setQuery(pending);
    shouldAutoSubmit.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (shouldAutoSubmit.current && query.trim()) {
      shouldAutoSubmit.current = false;
      handleSubmitRef.current?.();
    }
  }, [query, handleSubmitRef]);

  // ── Load session from ?session= URL param (shared links) ───────────────
  const searchParams = useSearchParams();
  const sessionFromUrl = useRef(false);
  useEffect(() => {
    if (sessionFromUrl.current) return;
    const sid = searchParams.get("session");
    if (sid && sessions.length > 0) {
      sessionFromUrl.current = true;
      handleSelectSession(sid);
    }
  }, [searchParams, sessions, handleSelectSession]);

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const gatedSubmit = useCallback(() => {
    if (!isAuthenticated && userMessageCount >= GUEST_MESSAGE_LIMIT) { setShowSignupPrompt(true); return; }
    if (isAuthenticated && userMessageCount >= FREE_MESSAGE_LIMIT) { setShowPaywall(true); return; }
    handleSubmit();
  }, [isAuthenticated, userMessageCount, handleSubmit]);
  useEffect(() => { handleSubmitRef.current = gatedSubmit; }, [gatedSubmit, handleSubmitRef]);

  const hasThread = messages.length > 0;
  const lastAiResponse = sourceMessage?.response;
  const sourceMessageIndex = sourceMessage ? messages.findIndex((m) => m.id === sourceMessage.id) : -1;
  const lastUserMessage = sourceMessageIndex > 0
    ? [...messages.slice(0, sourceMessageIndex)].reverse().find((m) => m.role === "user")
    : [...messages].reverse().find((m) => m.role === "user");
  const userInitials = "U";
  const currentSessionTitle = sessions.find((s) => s.id === currentSessionId)?.title ?? "New Conversation";

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

  const loadDemoMessages = () => {
    const now = new Date().toISOString();
    const demoMessages: import("./types").Message[] = [
      {
        id: "demo-user-1",
        role: "user",
        content: "Draft a legal notice for breach of contract and show the litigation timeline with relevant authorities.",
        timestamp: now,
      },
      {
        id: "demo-ai-1",
        role: "ai",
        content: "",
        timestamp: new Date(Date.now() + 1000).toISOString(),
        response: {
          streamText: `## Breach of Contract — Legal Notice & Litigation Overview

Under Indian contract law, a breach of contract occurs when a party fails to perform their obligations under a valid agreement without lawful excuse. The Indian Contract Act, 1872 <cite>1</cite> provides the foundational framework, while recent Supreme Court rulings <cite>2</cite> have refined the standards for establishing material breach.

### Key Elements to Establish
1. **Existence of a valid contract** — offer, acceptance, consideration, and lawful object
2. **Performance obligation** — the defaulting party had a clear, enforceable duty
3. **Breach** — failure to perform, defective performance, or anticipatory repudiation
4. **Damages** — quantifiable loss flowing from the breach <cite>3</cite>

The notice below demands compliance within 15 days, failing which civil proceedings will be initiated under **Order VII Rule 1 of the CPC** <cite>4</cite>.`,
          shortAnswer: "Legal notice for breach of contract with litigation timeline",
          reasoning: "",
          authorityStrength: "Strong",
          divergenceStatus: "Aligned",
          authorities: [
            { caseName: "Indian Contract Act, 1872", citation: "Sections 73, 74, 75", court: "Statute", year: "1872", proposition: "Foundational statute governing breach and damages in India.", treatment: "followed" as const, linkHint: "https://indiankanoon.org/doc/171398/" },
            { caseName: "M/s Hind Construction v. State of Maharashtra", citation: "(1979) 2 SCC 70", court: "Supreme Court of India", year: "1979", proposition: "Established that time is not of the essence unless expressly stipulated in the contract.", treatment: "followed" as const, linkHint: "https://indiankanoon.org/doc/1248423/" },
            { caseName: "Kailash Nath Associates v. DDA", citation: "(2015) 4 SCC 136", court: "Supreme Court of India", year: "2015", proposition: "Clarified the scope of Section 74 — reasonable compensation for breach, not penalty.", treatment: "followed" as const, linkHint: "https://indiankanoon.org/doc/47685041/" },
            { caseName: "Code of Civil Procedure, 1908", citation: "Order VII Rule 1", court: "Statute", year: "1908", proposition: "Prescribes the requirements for filing a civil suit — plaint format, jurisdiction, and cause of action.", treatment: "uncertain" as const },
          ],
          workflowSteps: [
            { title: "Legal Notice Issued", detail: "Day 0: Notice dispatched via registered post / courier with acknowledgment." },
            { title: "Compliance Period", detail: "Day 1–15: Recipient has 15 days to cure the breach or respond with justification." },
            { title: "Filing of Civil Suit", detail: "Day 16: If no response, file suit under Order VII Rule 1, CPC in appropriate court." },
            { title: "Written Statement", detail: "Day 46: Defendant files written statement within 30 days of summons (extendable to 90)." },
            { title: "Framing of Issues", detail: "Day 60–90: Court frames issues for trial based on pleadings." },
            { title: "Trial & Arguments", detail: "Day 120+: Evidence, cross-examination, and final arguments." },
          ],
          nextQuestions: [
            "What are the grounds for claiming liquidated damages under Section 74?",
            "How to calculate damages for anticipatory breach?",
            "Draft the plaint for this case",
          ],
          draftReady: `# LEGAL NOTICE

**TO:**
M/s XYZ Enterprises Pvt. Ltd.
123 Commercial Avenue, Sector 18
Gurugram, Haryana – 122015

**FROM:**
Office of [Your Name], Advocate
[Your Address]

**DATE:** ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}

**SUBJECT:** Notice for Breach of Contract dated [Date of Contract]

---

Dear Sir/Madam,

Under instructions from and on behalf of my client, **M/s ABC Industries Ltd.** (hereinafter "my Client"), I address this notice as follows:

## FACTS

1. My Client and your company entered into a **Supply Agreement** dated [Date] for the supply of [goods/services], with a total contract value of ₹[Amount].

2. As per Clause [X] of the Agreement, you were obligated to deliver [specific obligation] by [Due Date].

3. Despite repeated reminders dated [dates], you have **failed to perform** your contractual obligations, constituting a **material breach** of the Agreement.

## LEGAL POSITION

4. Under **Section 73 of the Indian Contract Act, 1872**, my Client is entitled to compensation for any loss or damage caused by the breach.

5. The Hon'ble Supreme Court in **Kailash Nath Associates v. DDA (2015) 4 SCC 136** has held that reasonable compensation is awardable even in the absence of a liquidated damages clause.

## DEMAND

6. You are hereby called upon to:
   - **(a)** Fulfill your pending obligations under the Agreement within **15 (fifteen) days** from receipt of this notice; **OR**
   - **(b)** Pay compensation amounting to **₹[Amount]** towards damages suffered by my Client.

7. Failure to comply within the stipulated period will leave my Client with no alternative but to initiate **civil proceedings** before the competent court, at your risk and cost.

This notice is issued without prejudice to any other rights and remedies available to my Client under law.

**[Your Name]**
Advocate, Bar Council of [State]
Enrolment No.: [Number]`,
          uiBlocks: [
            {
              type: "mindmap" as const,
              data: `graph TD
  A["Breach of Contract"] --> B["Legal Notice\\nDay 0"]
  A --> C["Key Statutes"]
  B --> D["15-Day Compliance\\nPeriod"]
  D --> E["File Civil Suit\\nDay 16"]
  E --> F["Written Statement\\nDay 46"]
  F --> G["Framing Issues\\nDay 60-90"]
  G --> H["Trial & Judgment\\nDay 120+"]
  C --> I["Indian Contract Act\\nSections 73, 74, 75"]
  C --> J["CPC Order VII\\nRule 1"]
  C --> K["Limitation Act\\nArticle 55 — 3 years"]`,
            },
            {
              type: "draft" as const,
              data: "See the full legal notice above.",
            },
          ],
        },
      },
    ];
    setMessages(demoMessages);
  };

  const chatInputProps = {
    query, setQuery, mode, setMode, queryMode, setQueryMode,
    onSubmit: gatedSubmit, onStop: stopGeneration, isGenerating: isSearching,
    attachedFiles, removeFile, isDragActive, dropHandlers, fileInputRef,
    queryTextareaRef, resizeTextarea, webSearchEnabled, setWebSearchEnabled,
    outputFormat, setOutputFormat, analysisDepth, setAnalysisDepth,
    writingStyle, setWritingStyle, selectedPromptPreset, setSelectedPromptPreset,
    onFileClick: () => setShowDocumentDialog(true),
  };

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     RENDER — futuristic theme wrapper
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div data-theme="futuristic">
    <ResearchHistoryContext.Provider value={historyContextValue}>
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.doc,.docx" className="sr-only" onChange={(e) => addFiles(e.target.files)} />

      <div
        ref={containerRef}
        className="flex h-[100svh] max-h-[100svh] overflow-hidden bg-[var(--bg-primary)] lexram-grid-bg relative"
      >
        {/* ── History Sidebar ────────────────────────────────────────── */}
        <HistorySidebar
          open={showHistory} onToggle={() => setShowHistory((v) => !v)}
          groupedSessions={groupedSessions} filteredSessions={filteredSessions}
          currentSessionId={currentSessionId} onSelectSession={handleSelectSession}
          onNewSession={handleNewSession} onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession} historySearch={historySearch}
          setHistorySearch={setHistorySearch} relativeDateLabel={relativeDateLabel}
        />

        {/* ── Chat Area ─────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          {/* Header — clean title only when no chat; Share + ··· when thread active */}
          <header className="flex items-center justify-between px-6 h-14 border-b border-[var(--oracle-outline-variant,#d0c5b6)]/10 bg-white/80 backdrop-blur-xl z-20 relative">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                aria-label={showHistory ? "Hide history" : "Show history"}
                aria-pressed={showHistory}
                title={showHistory ? "Hide history" : "Show history"}
                className={`p-2 rounded-lg transition-colors ${
                  showHistory
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <History className="w-4 h-4" />
              </button>
              <span className="text-base oracle-serif italic text-[var(--text-primary)]">LexRam</span>
              {currentSessionId && (
                <CaseSelector
                  sessionId={currentSessionId}
                  value={currentCaseId}
                  onChange={(id) => setCurrentCaseId(id)}
                  className="w-56"
                />
              )}
            </div>

            {/* Right controls — only visible when a chat thread exists */}
            {hasThread && (
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => setShowShareDialog(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <Share className="w-4 h-4" /> Share
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowHeaderMenu((v) => !v)}
                    className="p-2 rounded-full hover:bg-[var(--surface-hover)] transition-colors"
                    title="More options"
                  >
                    <MoreHorizontal className="w-5 h-5 text-[var(--text-primary)]" />
                  </button>

                  {showHeaderMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-[var(--shadow-lg)] border border-[var(--border-light)] py-1.5 z-50">
                      <button onClick={() => setShowHeaderMenu(false)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
                        <Users className="w-4 h-4 text-[var(--text-muted)]" /> Start a group chat
                      </button>
                      <button onClick={() => { if (currentSessionId) pinnedSessionRepository.pin(currentSessionId); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
                        <Pin className="w-4 h-4 text-[var(--text-muted)]" /> Pin chat
                      </button>
                      <button onClick={() => { setShowHistory(true); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
                        <Archive className="w-4 h-4 text-[var(--text-muted)]" /> Archive
                      </button>
                      <div className="h-px bg-[var(--border-light)] my-1" />
                      <button onClick={() => { if (currentSessionId) handleDeleteSession(currentSessionId); setShowHeaderMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* Gold streaming progress bar */}
          {isSearching && <div className="lexram-progress-bar flex-shrink-0" />}

          {/* Main content */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden relative" {...dropHandlers}>
              {hasThread ? (
                <ChatThread
                  messages={messages} isSearching={isSearching} streamingText={streamingText}
                  statusMessage={statusMessage} error={error} userInitials={userInitials}
                  expandedWorking={expandedWorking} expandedThinkingTokens={expandedThinkingTokens}
                  toggleWorking={toggleWorking} toggleThinkingTokens={toggleThinkingTokens}
                  onOpenAuthorities={handleOpenAuthorities} onOpenEditor={handleOpenEditor}
                  onOpenWorkflow={handleOpenWorkflow} onQuerySelect={handleQuerySelect}
                  onBuildSessionDraft={buildSessionDraft} mobilePane={mobilePane}
                  sessionId={currentSessionId}
                  onRegenerate={(userQuery) => { setQuery(userQuery); setTimeout(() => handleSubmitRef.current?.(), 50); }}
                  onShareSession={() => setShowShareDialog(true)}
                  onPinSession={() => { if (currentSessionId) pinnedSessionRepository.pin(currentSessionId); }}
                  onEditMessage={(content) => { setQuery(content); setTimeout(() => queryTextareaRef.current?.focus(), 0); }}
                />
              ) : (
                <EmptyState onPickQuickStart={handleQuerySelect} onUpload={() => fileInputRef.current?.click()} />
              )}

              {/* Oracle input — no wrapper card, ChatInput itself is the pill */}
              <div className="px-8 pb-3">
                <ChatInput {...chatInputProps} hasThread={hasThread} />
              </div>
              <div className="flex-shrink-0 text-center py-1.5 text-[10px] text-[var(--text-muted)] font-medium tracking-wide uppercase">
                The Oracle can make mistakes. Verify legal data.
              </div>
            </div>
          </div>
        </div>
      </div>

      <SignupPromptModal open={showSignupPrompt} onAuthenticated={() => { setShowSignupPrompt(false); markAuthenticated(); }} />
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <DocumentDialog
        open={showDocumentDialog}
        onOpenChange={setShowDocumentDialog}
        caseId={currentCaseId}
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
