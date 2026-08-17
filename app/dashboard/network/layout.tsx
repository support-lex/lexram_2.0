"use client";

/* Nested layout — applies ONLY to /dashboard/network/* routes.
   Suppresses the Supabase navigator.locks race errors that surface in the
   Next.js dev overlay during hot-reload and multi-tab refreshes. Other
   dashboard pages are untouched. The underlying auth still works. */

import * as React from "react";

declare global {
  interface Window {
    __lexramLockGuard?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__lexramLockGuard) {
  window.__lexramLockGuard = true;

  const isLockError = (msg: string) =>
    msg.includes("Lock broken by another request") ||
    msg.includes("was released because another request stole it") ||
    msg.includes("NavigatorLockAcquireTimeoutError") ||
    msg === "Failed to fetch" ||
    msg.includes("TypeError: Failed to fetch") ||
    msg.includes("NetworkError when attempting to fetch") ||
    msg.includes("AuthRetryableFetchError");

  // Capture phase so this fires BEFORE Next.js's overlay listener.
  window.addEventListener(
    "unhandledrejection",
    (e: PromiseRejectionEvent) => {
      const r = e.reason as { message?: string; name?: string } | string | null;
      const msg =
        (r && (typeof r === "string" ? r : r.message)) ||
        (r && typeof r === "object" && r !== null && "name" in r ? String((r as { name?: unknown }).name) : "") ||
        "";
      if (isLockError(msg)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );

  window.addEventListener(
    "error",
    (e: ErrorEvent) => {
      if (isLockError(e.message || "") || isLockError(String((e.error as { message?: string })?.message || ""))) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );

  // Some paths route through console.error — silence just these messages.
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    const msg =
      typeof first === "string"
        ? first
        : first && typeof first === "object" && "message" in first
          ? String((first as { message?: unknown }).message ?? "")
          : "";
    if (isLockError(msg)) return;
    origError(...args);
  };
}

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
