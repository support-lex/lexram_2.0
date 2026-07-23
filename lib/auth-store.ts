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

// Wake-refresh gate. When the tab returns from a long absence (> 5 min) the
// Supabase auto-refresh timer will have been paused and the access token may be
// expired. We force an explicit refreshSession() and hold any outgoing request
// (via getAccessToken) behind this promise until the fresh token is stored.
// This prevents the "Working... forever" hang caused by stale tokens slipping
// through immediately after a tab wake.
let wakeRefreshPromise: Promise<void> | null = null;
let hiddenAt: number | null = null;
const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes idle = force refresh on wake
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

  // After laptop sleep / tab wake, Supabase's background refresh timer will
  // have been paused and the access token may be expired. Track how long the
  // tab was hidden; if > STALE_AFTER_MS, force an explicit refreshSession()
  // and gate getAccessToken() on it — so no request goes out with a stale token.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now();
      return;
    }
    // Tab is visible again
    const absenceMs = hiddenAt ? Date.now() - hiddenAt : 0;
    hiddenAt = null;

    if (absenceMs > STALE_AFTER_MS) {
      // Long absence — token likely expired. Force a refresh and gate any
      // outgoing request on the result via wakeRefreshPromise.
      wakeRefreshPromise = sb.auth
        .refreshSession()
        .then(({ data }) => {
          if (data.session) {
            applySession(data.session.user, data.session.access_token, true);
          }
        })
        .catch(() => {
          // Refresh failed (e.g. refresh token also expired) — fall back to
          // getSession() so onAuthStateChange can redirect to sign-in if needed.
          return sb.auth.getSession().catch(() => {});
        })
        .finally(() => {
          wakeRefreshPromise = null;
        });
    } else {
      // Short absence — proactive getSession() is enough; no need to gate.
      sb.auth.getSession().catch(() => {});
    }
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
/**
 * Explicitly exchange the refresh token for a new access token.
 * Call this after a 401 to silently recover the session before retrying.
 */
export async function refreshAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { data, error } = await supabase().auth.refreshSession();
    if (error || !data.session) return null;
    // applySession fires via onAuthStateChange (TOKEN_REFRESHED), but also
    // update the snapshot immediately so the next getAccessToken() call reads
    // the new token without waiting for the event loop.
    applySession(data.session.user, data.session.access_token, true);
    return data.session.access_token;
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  init();
  await readyPromise;
  // If the tab just woke from a long sleep, wait for the forced refresh to
  // complete before returning a token — prevents stale tokens causing the
  // "Working... forever" hang on the first post-idle query.
  if (wakeRefreshPromise) await wakeRefreshPromise;
  // Prefer the freshest token; getSession() auto-refreshes if near expiry.
  //
  // BUT getSession() serialises behind Supabase's cross-tab navigator Web Lock
  // (see lib/supabase/client.ts). With many tabs open, a background-throttled
  // tab can hold that lock and the 2.5s steal timer can itself be throttled, so
  // getSession() may HANG rather than throw. The old code only fell back to the
  // cached token on a throw — a hang left this awaiting forever, and every
  // authenticated request that awaits getAccessToken() (incl. the SSE query
  // stream) was never issued: the chat sat on "Working…" with no network call.
  // Race getSession() against a short timeout and fall back to the last good
  // cached token, which is fresh enough to authenticate the request.
  const GET_SESSION_TIMEOUT_MS = 2500;
  try {
    const data = await Promise.race([
      supabase()
        .auth.getSession()
        .then((r) => r.data),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), GET_SESSION_TIMEOUT_MS),
      ),
    ]);
    return data?.session?.access_token ?? snapshot.accessToken ?? null;
  } catch {
    return snapshot.accessToken ?? null;
  }
}
