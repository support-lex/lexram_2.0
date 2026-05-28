"use client";

import { useState, useRef, useCallback } from "react";
import { aiService } from "@/services/ai.service";
import type { AIMessage } from "@/types/law-firm";

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;
    const session = await aiService.createSession();
    setSessionId(session.id);
    return session.id;
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: AIMessage = { id: generateId(), role: "user", content, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText("");

    try {
      const sid = await ensureSession();
      let full = "";
      const ctrl = aiService.streamQuery(sid, content, {
        onToken: (t) => { full += t; setStreamingText(full); },
        onDone: (text) => {
          const aiMsg: AIMessage = { id: generateId(), role: "assistant", content: text, timestamp: new Date().toISOString() };
          setMessages((prev) => [...prev, aiMsg]);
          setStreamingText("");
          setIsStreaming(false);
        },
        onError: (e) => {
          const errMsg: AIMessage = { id: generateId(), role: "assistant", content: `Error: ${e}`, timestamp: new Date().toISOString() };
          setMessages((prev) => [...prev, errMsg]);
          setStreamingText("");
          setIsStreaming(false);
        },
      });
      abortRef.current = ctrl;
    } catch (err: any) {
      // Fallback: non-streaming
      try {
        const sid = await ensureSession();
        const res = await aiService.query(sid, content);
        setMessages((prev) => [...prev, res]);
      } catch (e: any) {
        setMessages((prev) => [...prev, { id: generateId(), role: "assistant", content: `Error: ${e.message}`, timestamp: new Date().toISOString() }]);
      }
      setIsStreaming(false);
    }
  }, [ensureSession]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    if (streamingText) {
      setMessages((prev) => [...prev, { id: generateId(), role: "assistant", content: streamingText, timestamp: new Date().toISOString() }]);
      setStreamingText("");
    }
  }, [streamingText]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setStreamingText("");
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, streamingText, sendMessage, stopGeneration, clearChat, sessionId };
}
