"use client";

/**
 * Realtime can be unavailable for a bunch of reasons that aren't bugs:
 *  - Project has Realtime turned off in the Supabase dashboard
 *  - Tables aren't in the supabase_realtime publication
 *  - User's network blocks WebSockets (corporate proxy, captive portal)
 *
 * Without guard-rails the supabase-js Realtime client retries the WebSocket
 * forever, spamming the browser console with "WebSocket connection failed"
 * once per retry. This module gives every subscribe* helper a shared way to
 * mark the realtime layer as down (after the first observed failure), log
 * a single useful warning, and short-circuit any subsequent subscribe call
 * so the spam stops.
 *
 * If Realtime starts working again on a fresh page load the flag resets,
 * so this is non-sticky beyond the current tab.
 */

let realtimeUnavailable = false;
let warned = false;

export function isRealtimeUnavailable(): boolean {
  return realtimeUnavailable;
}

export function markRealtimeUnavailable(reason: string): void {
  realtimeUnavailable = true;
  if (!warned) {
    warned = true;
    console.warn(
      `[network] Realtime unavailable (${reason}) — falling back to REST. ` +
        `Live message + notification updates won't work until Supabase ` +
        `Realtime is reachable. Check Database → Replication in the ` +
        `Supabase dashboard.`,
    );
  }
}
