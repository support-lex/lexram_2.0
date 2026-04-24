"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square, Trash2, Copy, Check, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAIChat } from "@/hooks/useAIChat";
import type { AICitation } from "@/types/law-firm";

function MessageBubble({ role, content, citations }: { role: "user" | "assistant"; content: string; citations?: AICitation[] }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  if (role === "user") {
    return (
      <div className="flex justify-end mb-6 lexram-msg-enter">
        <div className="max-w-[80%] bg-[var(--surface-hover)] rounded-2xl rounded-br-sm px-5 py-3 text-sm leading-relaxed text-[var(--text-primary)]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 lexram-msg-enter">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[10px] font-bold">AI</div>
        <span className="text-sm font-semibold text-[var(--text-primary)]">LexRam AI</span>
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-[var(--bg-surface)] border border-[var(--border-light)] shadow-sm px-5 py-4 text-[15px] leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
      {/* Citations */}
      {citations && citations.length > 0 && (
        <div className="mt-3 rounded-xl border border-[var(--border-light)] bg-[var(--surface-hover)]/50 p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Sources</h4>
          <div className="space-y-2">
            {citations.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-[var(--accent)] mt-0.5">[{i + 1}]</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-[var(--text-primary)]">{c.title}</div>
                  {c.snippet && <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{c.snippet}</p>}
                </div>
                {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] flex-shrink-0"><ExternalLink className="w-3 h-3" /></a>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 mt-2">
        <button onClick={handleCopy} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

const DEMO_MESSAGES: import("@/types/law-firm").AIMessage[] = [
  { id: "demo-1", role: "user", content: "What are the grounds for anticipatory bail under BNSS?", timestamp: "2026-04-11T09:00:00Z" },
  { id: "demo-2", role: "assistant", content: `## Anticipatory Bail under BNSS (Section 482)

**Section 482 of the Bharatiya Nagarik Suraksha Sanhita, 2023** (formerly Section 438 CrPC) governs anticipatory bail in India. It allows a person who apprehends arrest in a non-bailable offence to apply for pre-arrest bail.

### Key Grounds

1. **Reasonable belief of arrest** — The applicant must demonstrate a genuine and reasonable belief of imminent arrest, not mere apprehension.

2. **Non-bailable offence** — The provision applies only to non-bailable offences. For bailable offences, bail is a matter of right.

3. **No prima facie case** — If the allegations do not disclose a prima facie case, the court may grant anticipatory bail.

4. **Likelihood of absconding** — The court considers whether the applicant is likely to abscond or tamper with evidence.

5. **Nature of accusation** — Gravity of the offence, severity of punishment, and role of the accused are weighed.

### Important Precedents

- **Gurbaksh Singh Sibbia v. State of Punjab (1980) 2 SCC 565** — Landmark case establishing the scope of anticipatory bail
- **Sushila Aggarwal v. State of NCT Delhi (2020) 5 SCC 1** — No blanket time limit on anticipatory bail
- **Siddharam Satlingappa v. State of Maharashtra (2011) 1 SCC 694** — Listed factors for consideration

### Conditions the Court May Impose
- Cooperation with investigation
- Not leaving India without permission
- Surrendering passport
- Regular appearance at police station`, timestamp: "2026-04-11T09:00:05Z",
    citations: [
      { title: "Bharatiya Nagarik Suraksha Sanhita, 2023 — Section 482", url: "https://indiankanoon.org/doc/171398/" },
      { title: "Gurbaksh Singh Sibbia v. State of Punjab (1980) 2 SCC 565", url: "https://indiankanoon.org/doc/1248423/", snippet: "Established the broad scope of anticipatory bail under the former CrPC." },
      { title: "Sushila Aggarwal v. State (2020) 5 SCC 1", url: "https://indiankanoon.org/doc/47685041/", snippet: "No blanket time limit can be imposed on anticipatory bail orders." },
    ],
  },
  { id: "demo-3", role: "user", content: "Can the High Court grant anticipatory bail in cases involving Section 302 IPC (murder)?", timestamp: "2026-04-11T09:01:00Z" },
  { id: "demo-4", role: "assistant", content: `## Anticipatory Bail in Murder Cases

Yes, the High Court **can** grant anticipatory bail even in cases involving **Section 302 IPC** (now Section 101 of BNS, 2023), though courts exercise **extreme caution**.

### Legal Position

There is **no absolute bar** on granting anticipatory bail in murder cases. The Supreme Court has clarified:

> *"The gravity of the offence is a factor, but by itself does not constitute a reason for denial of anticipatory bail."* — **Siddharam Satlingappa v. State of Maharashtra**

### Factors Courts Consider

| Factor | Weight |
|--------|--------|
| Severity of allegations | High |
| Evidence strength | High |
| Risk of flight | Medium |
| Prior criminal record | Medium |
| Social standing | Low |

### When Courts Typically Refuse
- **Direct eyewitness testimony** identifying the accused
- **Strong forensic evidence** linking accused to the crime
- **Risk of threatening witnesses** or tampering with evidence
- **Accused is the prime suspect** with motive established

### When Courts May Grant
- Allegations appear **politically motivated** or based on rivalry
- **No direct evidence** connecting accused to the crime
- Accused has **deep roots in the community** and is unlikely to abscond
- **Long delay** between the alleged offence and FIR`, timestamp: "2026-04-11T09:01:10Z",
    citations: [
      { title: "Siddharam Satlingappa v. State of Maharashtra (2011) 1 SCC 694", url: "https://indiankanoon.org/doc/1123043/" },
      { title: "Bharatiya Nyaya Sanhita, 2023 — Section 101", snippet: "Punishment for murder — death or imprisonment for life." },
    ],
  },
];

export default function AIAssistantPage() {
  const { messages: liveMessages, isStreaming, streamingText, sendMessage, stopGeneration, clearChat } = useAIChat();
  // Show demo messages until user starts chatting
  const messages = liveMessages.length > 0 ? liveMessages : DEMO_MESSAGES;
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[100svh] max-h-[100svh] bg-[var(--bg-primary)]">
      {/* Minimal top bar — title + clear */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/80 backdrop-blur-xl flex-shrink-0">
        <span className="text-sm font-semibold text-[var(--text-primary)]">AI Assistant</span>
        <button onClick={clearChat} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* Streaming progress */}
      {isStreaming && <div className="lexram-progress-bar flex-shrink-0" />}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-4">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-sm font-bold">AI</div>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">LexRam AI Assistant</h2>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">Ask legal questions, research case law, draft notices, analyze documents, or get strategic advice.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Explain Section 482 BNSS", "Draft a legal notice for breach of contract", "What are grounds for anticipatory bail?", "Analyze IP transfer clauses in mergers"].map((q) => (
                  <button key={q} onClick={() => { setInput(q); }} className="px-3 py-1.5 rounded-full border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)] transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role} content={msg.content} citations={msg.citations} />
          ))}

          {isStreaming && streamingText && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[10px] font-bold">AI</div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">LexRam AI</span>
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-[var(--bg-surface)] border border-[var(--border-light)] shadow-sm px-5 py-4 text-[15px] leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText + "▌"}</ReactMarkdown>
              </div>
            </div>
          )}

          {isStreaming && !streamingText && (
            <div className="flex items-center gap-2 mb-8">
              <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[10px] font-bold">AI</div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/60 animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/30 animate-pulse [animation-delay:300ms]" />
                <span className="text-xs text-[var(--text-muted)] ml-1">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 focus-within:border-[var(--accent)]/60 transition-colors shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder="Ask a legal question..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none max-h-32 overflow-y-auto leading-6"
            />
            {isStreaming ? (
              <button type="button" onClick={stopGeneration} className="w-9 h-9 rounded-lg bg-red-500 text-white flex items-center justify-center flex-shrink-0 hover:bg-red-600 transition-colors">
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()} className="w-9 h-9 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center flex-shrink-0 hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-[var(--text-muted)] mt-2">AI can make mistakes. Verify legal data independently.</p>
        </form>
      </div>
    </div>
  );
}
