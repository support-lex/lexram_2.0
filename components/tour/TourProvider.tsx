"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";

import {
  hydrateFromSupabase,
  isTourSeen,
  markTourCompleted,
  markTourSkipped,
  resetTour,
  type TourId,
} from "@/lib/tour/tour-storage";
import { TOURS, toDriverSteps } from "@/lib/tour/tour-config";

// Lightweight analytics ping — won't break if window.dataLayer is missing.
function trackTour(event: "started" | "completed" | "skipped", tourId: string) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: `tour_${event}`, tour_id: tourId, ts: Date.now() });
  } catch {
    /* swallow */
  }
}

interface TourContextValue {
  /** Start a tour by id. Resets seen state so it always plays. */
  start: (tourId: TourId) => void;
  /** True while any tour is currently active. */
  isActive: boolean;
  /** Active tour id (or null). */
  activeTourId: TourId | null;
}

const TourContext = createContext<TourContextValue | null>(null);

/** Hook for components that need to launch a tour (e.g. profile menu item). */
export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside <TourProvider>");
  return ctx;
}

interface TourProviderProps {
  children: React.ReactNode;
  /** When true, skip first-time auto-start (e.g. for storybook/tests). */
  disableAutoStart?: boolean;
}

export function TourProvider({ children, disableAutoStart }: TourProviderProps) {
  const pathname = usePathname();
  const driverRef = useRef<Driver | null>(null);
  const [activeTourId, setActiveTourId] = useState<TourId | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const autoStartedRef = useRef(false);

  // Hydrate cross-device tour state once on mount.
  useEffect(() => {
    void hydrateFromSupabase().finally(() => setHydrated(true));
  }, []);

  // Reset the auto-start gate whenever the route changes so each page can
  // fire its own page-specific tour (dashboard → research, etc.). The
  // isTourSeen() check inside the auto-start effect still prevents replays.
  useEffect(() => {
    autoStartedRef.current = false;
  }, [pathname]);

  // Tear the active driver instance down on unmount.
  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, []);

  const start = useCallback(
    (tourId: TourId) => {
      const def = TOURS[tourId];
      if (!def) {
        console.warn(`[tour] no tour with id "${tourId}"`);
        return;
      }
      // Reset seen state so the tour plays even if the user already saw it
      // (the "Replay tour" path).
      resetTour(tourId);

      // Tear down any running tour first.
      driverRef.current?.destroy();
      driverRef.current = null;

      const d = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayColor: "rgba(15, 8, 10, 0.72)",
        stagePadding: 8,
        stageRadius: 12,
        progressText: "{{current}} of {{total}}",
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Finish ✨",
        showButtons: ["next", "previous", "close"],
        steps: toDriverSteps(def.steps),
        onCloseClick: () => {
          markTourSkipped(tourId);
          trackTour("skipped", tourId);
          d.destroy();
        },
        onDestroyStarted: () => {
          // Triggered when overlay is clicked or ESC pressed without
          // pressing "Done". Treat as a skip.
          if (!d.hasNextStep()) {
            // Tour finished naturally — mark complete.
            markTourCompleted(tourId);
            trackTour("completed", tourId);
          } else {
            markTourSkipped(tourId);
            trackTour("skipped", tourId);
          }
          d.destroy();
        },
        onDestroyed: () => {
          setActiveTourId(null);
          driverRef.current = null;
        },
      });

      driverRef.current = d;
      setActiveTourId(tourId);
      trackTour("started", tourId);
      d.drive();
    },
    [],
  );

  // ── Auto-start first-time tours on matching paths ──────────────────────
  useEffect(() => {
    if (disableAutoStart || !hydrated || autoStartedRef.current) return;
    if (typeof window === "undefined") return;

    // Build candidate list with the *longest* matching autoStartPath, then
    // pick the most-specific one the user hasn't seen yet. This means
    // /dashboard/research-2 prefers "research-walkthrough" over the broader
    // "dashboard-welcome" tour (which only fires on plain /dashboard).
    const candidates = Object.values(TOURS)
      .filter((t) => t.autoStart && !isTourSeen(t.id))
      .map((t) => {
        const matchLen = t.autoStartPaths
          ?.filter((p) => pathname.startsWith(p))
          .reduce((max, p) => Math.max(max, p.length), -1) ?? -1;
        return { tour: t, matchLen };
      })
      .filter((c) => c.matchLen >= 0)
      .sort((a, b) => b.matchLen - a.matchLen);

    const candidate = candidates[0]?.tour;
    if (!candidate) return;

    autoStartedRef.current = true;
    // Small delay so the page has settled, fonts loaded, layouts measured.
    const id = window.setTimeout(() => start(candidate.id), 800);
    return () => window.clearTimeout(id);
  }, [pathname, hydrated, disableAutoStart, start]);

  return (
    <TourContext.Provider value={{ start, isActive: !!activeTourId, activeTourId }}>
      {children}
    </TourContext.Provider>
  );
}
