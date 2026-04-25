"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "chat-layout:sidebar-open";
const DESKTOP_BREAKPOINT_PX = 1024; // tailwind `lg`

export interface UseChatSidebarOptions {
  /** Initial open state used during SSR + first paint, before localStorage hydrates. */
  defaultOpen?: boolean;
  /** localStorage key — override per app surface to keep state independent. */
  storageKey?: string;
}

export interface UseChatSidebarResult {
  isOpen: boolean;
  /** True while the viewport is below the desktop breakpoint. */
  isMobile: boolean;
  /** True after the first client-side hydration tick. */
  hydrated: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Owns the open/closed state of the responsive chat sidebar.
 *
 * Behavior:
 * - Desktop (≥1024px): defaults to *open*, persisted to localStorage.
 * - Mobile/tablet (<1024px): defaults to *closed* on every mount — an overlay
 *   drawer should never be sticky between visits.
 * - Cmd/Ctrl+B toggles from anywhere.
 * - Esc closes the drawer on mobile only (desktop power users keep state).
 */
export function useChatSidebar(
  { defaultOpen = true, storageKey = STORAGE_KEY }: UseChatSidebarOptions = {}
): UseChatSidebarResult {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const [isMobile, setIsMobile] = useState(false);
  const hydratedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate desktop state from localStorage; mobile starts closed.
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${DESKTOP_BREAKPOINT_PX - 1}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);

    if (!mq.matches) {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw === "0" || raw === "1") setIsOpen(raw === "1");
      } catch {
        /* private mode or storage disabled — keep default */
      }
    } else {
      setIsOpen(false);
    }
    hydratedRef.current = true;
    setHydrated(true);

    return () => mq.removeEventListener("change", sync);
  }, [storageKey]);

  // Persist desktop changes; mobile transient state is intentionally not saved.
  useEffect(() => {
    if (!hydratedRef.current || isMobile) return;
    try {
      window.localStorage.setItem(storageKey, isOpen ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [isOpen, isMobile, storageKey]);

  // Cmd/Ctrl + B toggles globally.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Esc dismisses the mobile drawer.
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, isOpen]);

  return {
    isOpen,
    isMobile,
    hydrated,
    open: useCallback(() => setIsOpen(true), []),
    close: useCallback(() => setIsOpen(false), []),
    toggle: useCallback(() => setIsOpen((v) => !v), []),
  };
}
