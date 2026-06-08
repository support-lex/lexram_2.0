# Research‑2 — "Broken on first load, fine after refresh" — Full Analysis

**Scope:** `app/dashboard/research-2` + every backend/data dependency it pulls from.
**Symptom reported:** "A lot of things don't work properly on first load, but work fine after a refresh."
**Date:** 2026‑06‑02

---

## 1. TL;DR — the one root cause behind almost all of it

> **There is no single source of auth truth.** At least **five** independent
> pieces of code each call Supabase (`getUser()` / `getSession()` /
> `onAuthStateChange`) on mount, and each one independently kicks off its own
> data fetch. On a *cold* page load these probes **race the Supabase browser
> client's session‑hydration**. Whichever probe wins *before* the JWT is ready
> sees "logged‑out / no token", **caches that empty result behind a one‑shot
> guard, and never retries.** A manual refresh re‑runs every probe against an
> already‑hydrated session, so everything works the second time.

That single architectural gap explains the role-gated buttons, the empty
history sidebar, the empty case dropdown, the "please sign in" flashes, and the
empty restored chat — all of which "fix themselves" on refresh.

### The five uncoordinated auth initialisations

| # | Location | Auth call | What it gates | Has `onAuthStateChange` retry? |
|---|----------|-----------|---------------|-------------------------------|
| 1 | [layout.tsx:49](../app/dashboard/layout.tsx#L49) | `getSession()` | `isAuthenticated` (whole page) | ✅ yes |
| 2 | [use-research-sessions.ts:189](../app/dashboard/research-2/hooks/use-research-sessions.ts#L189) | `getUser()` | session list, history sidebar | ✅ yes (but see §3.2) |
| 3 | [use-credits.ts:66](../hooks/use-credits.ts#L66) | `getUser()` | credit balance / paywall | ✅ yes |
| 4 | [auth-guard.tsx:18](../lib/auth-guard.tsx#L18) | `getUser()` | **`role`** → "Make blog" button | ❌ **NO listener — fire once, never retry** |
| 5 | [legal-api.ts:17](../services/legal-api.ts#L17) & [lexram.api.ts:21](../modules/legal/api/lexram.api.ts#L21) | `getSession()` per request | the Bearer token on **every** API call | n/a (per‑call) |

They don't share state, they don't share a single `getSession()` result, and
they each decide "am I logged in?" at a slightly different millisecond of the
hydration window. That is the whole bug class.

---

## 2. Why "refresh fixes it" — the timing, precisely

The `@supabase/ssr` browser client (`lib/supabase/client.ts`) is a singleton
that restores its session from cookies/localStorage **asynchronously** after
construction.

- **Hard refresh:** the browser client is constructed fresh, cookies are read,
  and by the time React effects fire the session is usually already resolvable
  → every probe sees the user → everything loads. ✅
- **Soft navigation / cold first paint:** effects fire while the session is
  still hydrating. Some probes resolve *before* the JWT lands. Those probes get
  `user = null` / `token = null`, run their "logged‑out" branch, and (because
  of one‑shot guards, see §3) **never re‑run** even when auth resolves a beat
  later. ❌

So the determinant isn't the data — it's *which millisecond your effect happened
to sample the auth state*. Refreshing just re‑rolls the dice with the session
already warm.

---

## 3. Ranked issues (each is independently a "needs refresh" bug)

### 3.1 🔴 `useUserRole` never retries → admin features missing until refresh
**File:** [lib/auth-guard.tsx:14‑30](../lib/auth-guard.tsx#L14)

```ts
useEffect(() => {
  (async () => {
    const { data } = await supabase().auth.getUser();
    if (!data.user) { setLoading(false); return; }   // ← gives up forever
    const r = (data.user.user_metadata?.role) || "advocate";
    setRole(r);
    setLoading(false);
  })();
}, []);   // ← no onAuthStateChange, runs exactly once
```

If that single `getUser()` resolves before hydration, `role` stays `null` for
the entire page load. In research‑2 that hides the **admin "Make blog"** button
([page.tsx:370‑371,677](../app/dashboard/research-2/page.tsx#L370)). Refresh →
role resolves → button appears. Classic.

**Fix:** subscribe to `onAuthStateChange` and re‑read role on `SIGNED_IN` /
`INITIAL_SESSION` / `TOKEN_REFRESHED`, exactly like `use-credits` does.

---

### 3.2 🔴 Session-list refresh dedupe caches an *empty* first load
**File:** [use-research-sessions.ts:95,181‑194](../app/dashboard/research-2/hooks/use-research-sessions.ts#L181)

```ts
const runRefreshForUser = async (userId: string) => {
  if (lastRefreshedForUserRef.current === userId) return;  // dedupe
  lastRefreshedForUserRef.current = userId;                // ← set BEFORE success
  await migrateTempSessionIfNeeded();
  hydratePinAndArchive();
  refresh();
};
```

The dedupe key is the **user id**, and it's marked *before* we know the refresh
succeeded. Sequence on a cold load:

1. `getUser()` resolves → `runRefreshForUser(uid)` → marks `uid` done → calls
   `refresh()`.
2. `refresh()` → `chatSessionRepository.list()` → `lexramRequest('/sessions')`.
   If the Bearer token isn't attached yet (§3.5) the backend 401s, the LexRam
   call throws, and we silently fall back to Supabase
   ([chatSession.repository.ts:92‑98](../modules/chat/repository/chatSession.repository.ts#L92)).
   That fallback can *also* come back empty.
3. Sidebar renders "No threads yet", `sessionsReady = true`.
4. The `INITIAL_SESSION` auth event fires moments later **with a valid token** —
   but `runRefreshForUser` is now a **no‑op** because `uid` is already marked.

→ History stays empty until a manual refresh. **The guard intended to prevent
duplicate fetches also prevents the *retry* that would fix an empty first load.**

**Fix:** only set `lastRefreshedForUserRef` after a *successful, authoritative*
list (LexRam path, not the silent fallback), or clear it on failure so the next
auth event retries.

---

### 3.3 🔴 `?session=` restore loads an empty thread when the list lost the race
**File:** [page.tsx:269‑279](../app/dashboard/research-2/page.tsx#L269) +
[use-research-sessions.ts:429‑439](../app/dashboard/research-2/hooks/use-research-sessions.ts#L429)

The URL‑restore effect is one‑shot on `sessionsReady`:

```ts
useEffect(() => {
  if (sessionFromUrl.current || !sessionsReady) return;
  sessionFromUrl.current = true;            // ← burns the one shot
  const sid = searchParams.get("session");
  if (sid) handleSelectSession(sid);
}, [sessionsReady]);
```

`handleSelectSession` reads messages from `sessionsRef.current`. If
`sessionsReady` flipped true off an **empty** list (§3.2), `cached` is
`undefined` → `setMessages([])` → the restored chat shows blank. The one‑shot
flag is already burned, so even when the real list arrives the thread is never
re‑selected. Refresh → list is populated first → restore works.

**Fix:** don't burn the one‑shot until the list is actually non‑empty (or the
session id is present in it); re‑run restore when sessions populate.

---

### 3.4 🟠 `fetchSharedCases` runs unauthenticated on mount → empty case dropdown
**File:** [page.tsx:118‑125](../app/dashboard/research-2/page.tsx#L118)

```ts
const fetchSharedCases = useCallback(async () => {
  try {
    const res = await api.get("/cases");
    ...
  } catch { /* silently ignore */ }       // ← 401 swallowed
}, []);
useEffect(() => { fetchSharedCases(); }, [fetchSharedCases]);  // ← fires before auth ready
```

This fires on mount with **no auth gating**. If the token isn't attached yet the
`/cases` call 401s, the error is swallowed, and `sharedCases` stays `[]`. The
case‑name caption in the header then shows "Unassigned" and the Case Hub
dropdown is empty — until refresh. There is **no retry on auth change.**

**Fix:** gate on `isAuthenticated`/`ready` and refetch when auth resolves.

---

### 3.5 🟠 Bearer token attached from a possibly-unhydrated session
**Files:** [legal-api.ts:10‑22](../services/legal-api.ts#L10),
[lexram.api.ts:21‑28,52‑58](../modules/legal/api/lexram.api.ts#L21),
[queryStream.ts:56‑61](../modules/legal/api/queryStream.ts#L56)

Every request reads the token with `supabase().auth.getSession()` and proceeds
**whether or not a token came back**:

```ts
const { data } = await supabase().auth.getSession();
const token = data.session?.access_token;
if (token) config.headers.Authorization = `Bearer ${token}`;  // silently omitted if null
```

`getSession()` returns from cache without waiting for hydration, so an early
call can return `null` and the request goes out anonymous → 401. This is the
*upstream* cause feeding 3.2 and 3.4. It is also why the **first query a user
sends** sometimes fails with "Please sign in" while a second attempt works.

**Fix:** centralise token retrieval through an auth provider that resolves the
session once and *awaits readiness* before the first authenticated request; or,
minimally, have `getAuthToken()` await an "auth ready" promise.

---

### 3.6 🟠 React Strict Mode double-invoke can consume one-shot guards
**File:** [next.config.ts:7](../next.config.ts#L7) (`reactStrictMode: true`)

In dev, mount effects fire twice. Combined with the one‑shot refs
(`pendingQueryHandled`, `sessionFromUrl`, `migrationDoneRef`,
`lastRefreshedForUserRef`, `profileAskedRef`) the *second* invoke can flip a
guard the first invoke depended on, or the cleanup of the first can unsubscribe
a listener the second relies on. This amplifies 3.1–3.4 specifically in dev and
makes the bug feel non‑deterministic. (Less impact in production, where effects
run once — but the underlying races in 3.1–3.5 remain.)

---

### 3.7 🟡 Two `onAuthStateChange` subscribers + Supabase web-lock contention
**Files:** layout, use-research-sessions, use-credits, useUserRole (if fixed)

The layout comment at [layout.tsx:38‑44](../app/dashboard/layout.tsx#L38)
already documents that `getUser()` acquires Supabase's auth Web Lock and can
*starve* other hooks mid‑load — that's why the layout was downgraded to
`getSession()`. But the other hooks (`use-research-sessions`, `use-credits`,
`useUserRole`) **still call `getUser()`**, each taking the lock in turn. On a
cold load these serialise, widening the window in which some consumers see a
not‑yet‑ready state. A single shared provider that calls `getUser()` **once**
removes the contention entirely.

---

### 3.8 🟡 Pinned/archived hydration is fire-and-forget via window events
**File:** [use-research-sessions.ts:163‑172](../app/dashboard/research-2/hooks/use-research-sessions.ts#L163)

`hydratePinAndArchive()` writes localStorage then dispatches
`lexram-pin-changed` / `lexram-archive-changed`. The sidebar only reflects pins
if it is mounted and listening when the event fires. If hydration loses the
auth race (§3.2 — it's called from the same `runRefreshForUser`), the events
fire against stale/empty state and pin status looks wrong until refresh.

---

## 4. Secondary / non-auth observations (not the refresh bug, but worth fixing)

- **Streaming title pickup is a polling hack.**
  [use-research-chat.ts:965‑968](../app/dashboard/research-2/hooks/use-research-chat.ts#L965)
  fires `refresh()` at 1.5s/3s/5s to catch the backend's async auto‑title. Each
  of those refreshes re‑enters the §3.2 race. Prefer a single refetch triggered
  by the `done` event carrying the title, or a backend field in the stream.
- **Silent catches hide the real failure.** `fetchSharedCases` (`catch {}`),
  `getAuthToken` (`catch { return null }`), and the repository fallbacks all
  swallow errors. During this investigation that's why the symptom looks like
  "random emptiness" rather than a 401 — there are no surfaced errors. Add at
  least `console.warn` with the status code on each.
- **Debounced auto-save vs. create race** is guarded by `creatingSessionRef`
  ([use-research-sessions.ts:274](../app/dashboard/research-2/hooks/use-research-sessions.ts#L274))
  — this one is handled correctly; noting it so it isn't "fixed" by accident.
- **`updateMessages` has no session-existence guard.** If the Supabase mirror
  row was never created (LexRam‑only create succeeded, mirror upsert failed at
  [chatSession.repository.ts:136](../modules/chat/repository/chatSession.repository.ts#L136)),
  the `.update().eq('id', …)` no‑ops silently and messages are never persisted
  → on next visit the thread is empty. Consider `upsert` instead of `update`.

---

## 5. Recommended solution — single `AuthProvider` (the "perfect" fix)

Replace the five independent probes with **one** provider mounted above the
dashboard. It is the only thing that talks to Supabase auth, and it exposes a
ready‑gated, reactive snapshot.

```tsx
// lib/auth-provider.tsx  (new)
type AuthState = {
  user: User | null;
  role: UserRole | null;
  accessToken: string | null;
  ready: boolean;                 // true only AFTER the first getUser resolves
};
// - calls supabase().auth.getUser() ONCE
// - subscribes to onAuthStateChange ONCE (SIGNED_IN / SIGNED_OUT /
//   INITIAL_SESSION / TOKEN_REFRESHED keep user+token+role fresh)
// - exposes getToken(): Promise<string|null> that AWAITS `ready`
```

Then:

1. **`useDashboardAuth`, `useResearchSessions`, `useCredits`, `useUserRole`** all
   read from this provider instead of calling Supabase themselves. Each data
   fetch gates on `ready` and re‑runs when `user?.id` changes.
2. **`legal-api` + `lexram.api` + `queryStream`** get their token from
   `auth.getToken()` (which awaits readiness) instead of a raw `getSession()`.
   No authenticated request can fire token‑less anymore → 3.2/3.4/3.5 vanish.
3. **Remove the one‑shot dedupe keyed on user id**; with a single ordered auth
   source you fetch once on `ready` and once per real `user.id` change — no
   races to dedupe.

This collapses issues **3.1, 3.2, 3.4, 3.5, 3.7, 3.8** into "solved by
construction" and makes 3.3/3.6 trivial (restore runs after a guaranteed‑hydrated
list; strict‑mode double‑invoke is idempotent because fetches are keyed on
`ready` + `user.id`, not on consumed refs).

### If a full refactor is too large right now — minimal targeted patches
These three, in order, kill the majority of the symptom with low blast radius:

1. **`useUserRole`**: add an `onAuthStateChange` listener (mirror `use-credits`). *(§3.1)*
2. **`runRefreshForUser`**: only mark the user "refreshed" after a successful,
   non‑fallback, non‑empty list; otherwise allow the next auth event to retry. *(§3.2)*
3. **`getAuthToken()`**: await an auth‑ready signal before returning, so the
   first request can't go out token‑less. *(§3.5 — also fixes 3.4 as a side effect)*

---

## 6. How to verify a fix (repro harness)

The bug is timing‑dependent, so verify deterministically:

1. **Throttle hydration:** in DevTools → Network, set "Slow 3G", then hard‑load
   `/dashboard/research-2` from a *logged‑in* session. Pre‑fix: empty
   sidebar / missing admin button / empty case dropdown. Post‑fix: all populate
   without a manual refresh.
2. **Cold soft‑nav:** from `/dashboard` click into research‑2 (not refresh).
   Confirm history, cases, role‑gated buttons, and `?session=` restore all work.
3. **Network tab:** confirm **zero** `401` on `/legal-api/sessions`,
   `/legal-api/cases`, and `/legal-api/.../query/stream` during the first load.
   (Today there are intermittent 401s that get swallowed.)
4. **Strict‑mode:** since `reactStrictMode` is on, the dev double‑invoke is a
   free fuzz test — a correct fix shows no difference between the two invokes.

---

## 7. File map (what to touch)

| Concern | File |
|---------|------|
| New single auth source | `lib/auth-provider.tsx` *(new)* |
| Mount the provider | [app/dashboard/layout.tsx](../app/dashboard/layout.tsx) |
| Role (reactive) | [lib/auth-guard.tsx](../lib/auth-guard.tsx) |
| Session list race | […/research-2/hooks/use-research-sessions.ts](../app/dashboard/research-2/hooks/use-research-sessions.ts) |
| URL restore one‑shot | […/research-2/page.tsx](../app/dashboard/research-2/page.tsx) |
| Shared cases gating | […/research-2/page.tsx](../app/dashboard/research-2/page.tsx) |
| Token attach (axios) | [services/legal-api.ts](../services/legal-api.ts) |
| Token attach (fetch) | [modules/legal/api/lexram.api.ts](../modules/legal/api/lexram.api.ts) |
| Token attach (SSE) | [modules/legal/api/queryStream.ts](../modules/legal/api/queryStream.ts) |
| Credits (reference impl) | [hooks/use-credits.ts](../hooks/use-credits.ts) |

---

## 8. Implementation status (2026‑06‑02) — full AuthProvider refactor DONE

The single‑source‑of‑truth refactor described in §5 has been implemented.

**New files**
- `lib/auth-store.ts` — framework‑agnostic singleton. One `getSession()` + one
  `onAuthStateChange`. Exposes a reactive `AuthSnapshot { user, role,
  accessToken, ready }`, `whenReady()`, and `getAccessToken()` which **awaits
  readiness** before returning a token. Preserves the "ignore transient
  null‑session events; only `SIGNED_OUT` logs out" guard.
- `lib/auth-provider.tsx` — `useAuth()` via `useSyncExternalStore` over the
  store (no Provider component / no mount‑order footgun).

**Rewired to the single source**
- `app/dashboard/layout.tsx` — auth + redirect + phone‑OTP gate now read from
  `useAuth()`; removed its private `getSession`/listener. *(§3.7)*
- `lib/auth-guard.tsx` `useUserRole` — now reactive; role survives a probe that
  resolves pre‑hydration. *(§3.1)*
- `hooks/use-credits.ts` — consumes `useAuth()`; no private auth probe. *(§3.7)*
- `…/research-2/hooks/use-research-sessions.ts` — auth‑gated load; `refresh()`
  returns a success flag; the dedupe ref is set **only on success** so a failed
  first load retries. *(§3.2)*
- `services/legal-api.ts`, `modules/legal/api/lexram.api.ts`,
  `modules/legal/api/queryStream.ts` (via `getAuthToken`) — all tokens now come
  from `getAccessToken()` (awaits readiness) → no token‑less first request.
  *(§3.5)*
- `…/research-2/page.tsx` — `fetchSharedCases` gated on `isAuthenticated`;
  `?session=` restore no longer burns its one‑shot until the session is present
  in the loaded list. *(§3.4, §3.3)*

**Verification:** `tsc --noEmit` passes (exit 0). Still to do by a human: run the
Slow‑3G repro from §6 against a live backend to confirm zero `401`s and no
empty‑then‑refresh flashes.

> Not yet addressed (tracked, lower priority): the streaming title‑pickup
> polling (§4), silent `catch {}` blocks (§4), and `updateMessages` using
> `update` instead of `upsert` (§4).
</content>
</invoke>
