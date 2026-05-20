"use client";

// Top-of-card progress bar that activates whenever any LexRam or Supabase
// API request is in flight (subscribes to lib/api-activity counter that
// both the axios and fetch wrappers increment around their calls).
//
// Design: 2px tall, full-width strip glued to the top edge of the chat
// card. Indeterminate "shimmer" — a maroon→rust gradient slides left-to-
// right while at least one request is open. Fades in instantly on the
// first request, fades out 200ms after the last one finishes (avoids a
// flicker when several short requests fire back-to-back).
//
// Skips rendering the bar at all if no activity has happened in this
// mount window — keeps the chat header visually quiet at rest.

import { useEffect, useState } from "react";
import { getCount, subscribe } from "@/lib/api-activity";

export default function ApiProgressBar() {
  const [count, setCount] = useState(() => getCount());
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribe(setCount), []);

  useEffect(() => {
    if (count > 0) {
      setVisible(true);
      return;
    }
    // Tail-off: small delay before hiding so a stream of short requests
    // doesn't make the bar blink. If a new request starts during the
    // window, the effect re-runs and the timer is cleared.
    const t = setTimeout(() => setVisible(false), 200);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <>
      <div
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-30 transition-opacity duration-150 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Static track tint for contrast on the cream-soft header */}
        <div className="absolute inset-0 bg-[var(--lex-rust-soft)]" />
        {/* Moving gradient strip — keyframes defined below */}
        <div
          className="absolute inset-y-0 w-1/3 rounded-full lex-api-progress-strip"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--lex-maroon) 30%, var(--lex-rust) 60%, transparent 100%)",
            boxShadow: "0 0 8px rgba(185, 72, 38, 0.45)",
          }}
        />
      </div>
      <style jsx global>{`
        @keyframes lex-api-progress-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .lex-api-progress-strip {
          animation: lex-api-progress-slide 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
}
