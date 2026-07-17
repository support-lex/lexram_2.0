"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArtifactTab, Message } from "../types";

export function useResearchUI({
  lastAi,
  queryTextareaRef,
  handleSubmitRef,
  streamingSourcesCount = 0,
  isSearching = false,
}: {
  lastAi?: Message;
  queryTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleSubmitRef: React.RefObject<() => void>;
  streamingSourcesCount?: number;
  isSearching?: boolean;
}) {
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [artifactTab, _setArtifactTab] = useState<ArtifactTab>("workflow");

  // Tracks whether the user manually picked a tab in the current query.
  // Prevents auto-switches (sources open, authorities open) from yanking them
  // off a tab they deliberately chose. Reset at the start of each new query.
  const userPickedTabRef = useRef(false);
  const setArtifactTab = useCallback((tab: ArtifactTab) => {
    userPickedTabRef.current = true;
    _setArtifactTab(tab);
  }, []);

  // Detect new query start (isSearching false → true) and reset both guards so
  // the auto-open logic fires fresh for the upcoming query.
  const prevIsSearchingRef = useRef(false);
  useEffect(() => {
    if (isSearching && !prevIsSearchingRef.current) {
      userPickedTabRef.current = false;
      sourcesOpenedRef.current = false;
    }
    prevIsSearchingRef.current = isSearching;
  }, [isSearching]);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobilePane, setMobilePane] = useState<"chat" | "authorities">("chat");
  const [selectedAuthorityIndex, setSelectedAuthorityIndex] = useState<number | null>(null);
  const [artifactsWidth, setArtifactsWidth] = useState(35);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedWorking, setExpandedWorking] = useState<Record<string, boolean>>({});
  const [expandedThinkingTokens, setExpandedThinkingTokens] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(50);
  const lastAutoArtifactResponseIdRef = useRef<string | null>(null);

  // (Removed) the threads sidebar used to auto-open on desktop. Per product
  // request the sidebar now stays closed on every mount — the user opens it
  // manually with the history toggle (or `Cmd/Ctrl+H`). Keeps the chat card
  // at full width by default and avoids fighting for screen real estate on
  // smaller laptops.

  // Auto-open the sources panel as soon as the first chunk arrives.
  // Only switches tab if the user hasn't manually picked one this query.
  const sourcesOpenedRef = useRef(false);
  useEffect(() => {
    if (streamingSourcesCount > 0 && !sourcesOpenedRef.current) {
      sourcesOpenedRef.current = true;
      setShowArtifacts(true);
      if (!userPickedTabRef.current) {
        _setArtifactTab("sources");
        // Lock the tab so the authorities auto-switch (firing when onDone
        // arrives) doesn't yank the user off the sources they're reading.
        userPickedTabRef.current = true;
      }
    }
  }, [streamingSourcesCount]);

  // Auto-open the right-side authorities rail when a new AI response arrives
  // with parsed sources. Only switches tab if the user hasn't manually picked
  // one during this query — avoids yanking them off Sources mid-read.
  useEffect(() => {
    if (!lastAi?.id || !lastAi.response) return;
    if (lastAi.id === lastAutoArtifactResponseIdRef.current) return;

    const auths = lastAi.response.authorities ?? [];
    if (auths.length > 0) {
      lastAutoArtifactResponseIdRef.current = lastAi.id;
      setShowArtifacts(true);
      if (!userPickedTabRef.current) _setArtifactTab("authorities");
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
