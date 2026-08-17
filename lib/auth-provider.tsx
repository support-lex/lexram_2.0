"use client";

// Reactive view over the single auth source (lib/auth-store.ts). No Context /
// Provider component is needed — useSyncExternalStore subscribes directly to
// the module singleton, so every consumer sees the same snapshot and there's
// no provider-ordering footgun. Mount nothing; just call useAuth().

import { useSyncExternalStore } from "react";
import { authStore, type AuthSnapshot } from "@/lib/auth-store";

export type { AuthSnapshot } from "@/lib/auth-store";

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getServerSnapshot,
  );
}
