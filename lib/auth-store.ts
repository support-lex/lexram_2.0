// ─────────────────────────────────────────────────────────────────────────────
// Single source of auth truth.
//
// Before this existed, ~5 places each called Supabase (getUser/getSession/
// onAuthStateChange) on mount and each kicked off its own data fetch. On a cold
// load those probes raced the Supabase browser client's async session
// hydration; whichever sampled auth before the JWT landed saw "logged-out / no
// token", cached that behind a one-shot guard, and never retried — which is why
// the app was broken on first load but fine after a refresh.
//
// This module talks to Supabase auth EXACTLY ONCE (one getSession + one
// onAuthStateChange) and exposes a ready-gated, reactive snapshot plus a
// getAccessToken() that AWAITS readiness. Both React (via useSyncExternalStore
// in auth-provider.tsx) and non-React code (axios/fetch/SSE token layers) read
// from here, so no authenticated request can ever fire token-less again.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types/law-firm";

export interface AuthSnapshot {
  user: User | null;
  role: UserRole | null;
  /** Latest access token from the most recent auth event. May be refreshed. */
  accessToken: string | null;
  /** True once the FIRST getSession() has resolved (signed-in OR signed-out). */
  ready: boolean;
}

// Stable constant for SSR / the first client render before init resolves.
const SERVER_SNAPSHOT: AuthSnapshot = {
  user: null,
  role: null,
  accessToken: null,
  ready: false,
};

let snapshot: AuthSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

let initialized = false;
let readyResolved = false;
let resolveReady!: () => void;
const readyPromise = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

function emit() {
  for (const l of listeners) l();
}

function deriveRole(user: User | null): UserRole | null {
  if (!user) return null;
  // Role is stored in user_metadata.role (set at signup or by an admin).
  return ((user.user_metadata?.role as UserRole) || "advocate") as UserRole;
}

function applySession(
  user: User | null,
  accessToken: string | null,
  ready: boolean,
) {
  // Always allocate a new object so useSyncExternalStore detects the change.
  snapshot = { user, role: deriveRole(user), accessToken, ready };
  if (ready && !readyResolved) {
    readyResolved = true;
    resolveReady();
  }
  emit();
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const sb = supabase();

  // Authoritative first read. getSession() resolves AFTER the client has
  // hydrated its session from cookies/localStorage and returns the access
  // token directly — that's exactly the value the token layers need. We trust
  // the cached JWT here (not server-verified getUser) on purpose: the
  // server-side middleware already verifies via getUser() on every request, so
  // this avoids taking Supabase's auth Web Lock and starving other consumers.
  // Pure backstop against a truly pathological hang. The Supabase client is
  // configured with lockAcquireTimeout: 2500 (see lib/supabase/client.ts), so
  // getSession() self-heals and resolves with the CORRECT user within ~2.5s
  // even under cross-tab lock contention — well before this 4s timer. Thus this
  // almost never fires; when it does (genuine hang) we flip `ready` so the app
  // doesn't freeze, and onAuthStateChange still corrects the snapshot later.
  setTimeout(() => {
    if (!readyResolved) applySession(snapshot.user, snapshot.accessToken, true);
  }, 4000);

  sb.auth
    .getSession()
    .then(({ data }) => {
      const session = data.session;
      applySession(session?.user ?? null, session?.access_token ?? null, true);
    })
    .catch(() => {
      // Even on failure we must flip `ready` so awaiters unblock; treat as
      // signed-out and let the next request's server check redirect if needed.
      applySession(null, null, true);
    });

  // Keep the snapshot live for the rest of the session. INITIAL_SESSION fires
  // on mount, TOKEN_REFRESHED hourly, SIGNED_IN/SIGNED_OUT on auth changes.
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      applySession(null, null, true);
      return;
    }
    // Only an explicit SIGNED_OUT downgrades us to logged-out. Supabase can
    // transiently emit a non-SIGNED_OUT event with a null session during the
    // JWT refresh window; treating that as "logged out" would briefly wipe the
    // history sidebar / credits / role mid-session. Ignore the null and keep
    // the last good user until a real token (or a real SIGNED_OUT) arrives.
    if (!session?.user) {
      if (!readyResolved) applySession(null, null, true); // initial guest load
      return;
    }
    applySession(session.user, session.access_token ?? null, true);
  });
}

export const authStore = {
  subscribe(listener: () => void): () => void {
    init();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): AuthSnapshot {
    return snapshot;
  },
  getServerSnapshot(): AuthSnapshot {
    return SERVER_SNAPSHOT;
  },
  /** Resolves once the first getSession() has settled. */
  whenReady(): Promise<void> {
    init();
    return readyPromise;
  },
};

/**
 * The one token accessor for ALL authenticated requests (axios interceptor,
 * the lexram fetch wrapper, the SSE query stream). It first AWAITS auth
 * readiness so a request can never go out before the JWT is hydrated, then
 * reads a fresh token via getSession() (which transparently refreshes an
 * expiring token). Returns null on the server or when signed out.
 */
export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  init();
  await readyPromise;
  // Prefer the freshest token; getSession() auto-refreshes if near expiry.
  try {
    const { data } = await supabase().auth.getSession();
    return data.session?.access_token ?? snapshot.accessToken ?? null;
  } catch {
    return snapshot.accessToken ?? null;
  }
}
