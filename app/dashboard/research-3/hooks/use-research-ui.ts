"use client";

import { useEffect, useRef, useState } from "react";
import type { ArtifactTab, Message } from "../types";

export function useResearchUI({
  lastAi,
  queryTextareaRef,
  handleSubmitRef,
}: {
  lastAi?: Message;
  queryTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleSubmitRef: React.RefObject<() => void>;
}) {
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [artifactTab, setArtifactTab] = useState<ArtifactTab>("workflow");
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobilePane, setMobilePane] = useState<"chat" | "authorities">("chat");
  const [selectedAuthorityIndex, setSelectedAuthorityIndex] = useState<number | null>(null);
  const [artifactsWidth, setArtifactsWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedWorking, setExpandedWorking] = useState<Record<string, boolean>>({});
  const [expandedThinkingTokens, setExpandedThinkingTokens] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(50);
  const lastAutoArtifactResponseIdRef = useRef<string | null>(null);

  // Show chat history by default on desktop, keep it closed on mobile.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setShowHistory(window.innerWidth >= 1024);
  }, []);

  // Auto-open the right-side authorities rail whenever a new AI response
  // arrives with parsed sources. The LexRam backend ships inline citations
  // (<cite>N</cite>) plus a structured authorities list — clicking a citation
  // pill in the prose scrolls the matching card into view in this panel.
  useEffect(() => {
    if (!lastAi?.id || !lastAi.response) return;
    if (lastAi.id === lastAutoArtifactResponseIdRef.current) return;

    const auths = lastAi.response.authorities ?? [];
    if (auths.length > 0) {
      lastAutoArtifactResponseIdRef.current = lastAi.id;
      setShowArtifacts(true);
      setArtifactTab("authorities");
    }
  }, [lastAi]);

  // CustomEvent listeners from the global dashboard header
  useEffect(() => {
    const onToggleHistory = () => setShowHistory((prev) => !prev);
    const onToggleArtifacts = () => setShowArtifacts((prev) => !prev);
    window.addEventListener("toggle-history", onToggleHistory);
    window.addEventListener("toggle-artifacts", onToggleArtifacts);
    return () => {
      window.removeEventListener("toggle-history", onToggleHistory);
      window.removeEventListener("toggle-artifacts", onToggleArtifacts);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) {
        if (event.key === "Escape") setShowHistory(false);
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "enter") {
        event.preventDefault();
        handleSubmitRef.current();
      } else if (key === "k") {
        event.preventDefault();
        queryTextareaRef.current?.focus();
      } else if (key === "h") {
        event.preventDefault();
        setShowHistory((prev) => !prev);
      } else if (key === ".") {
        event.preventDefault();
        setShowArtifacts((prev) => !prev);
      } else if (key === "/") {
        event.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSubmitRef, queryTextareaRef]);

  // Drag-resize panel
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = artifactsWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = dragStartXRef.current - e.clientX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(30, Math.min(70, dragStartWidthRef.current + deltaPercent));
      setArtifactsWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const toggleWorking = (messageId: string) =>
    setExpandedWorking((prev) => ({ ...prev, [messageId]: !prev[messageId] }));

  const toggleThinkingTokens = (messageId: string) =>
    setExpandedThinkingTokens((prev) => ({ ...prev, [messageId]: !prev[messageId] }));

  return {
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
  };
}
