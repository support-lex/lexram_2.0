"use client";

// Voice typing hook backed by the browser's SpeechRecognition (Web Speech API).
// Chrome / Edge / Safari support this natively; Firefox returns
// `supported = false` so callers can hide the mic button.
//
// Both ChatInput (when a thread exists) and EmptyState (new-thread hero
// input) consume this so the mic UX stays identical across screens.

import { useEffect, useRef, useState } from "react";

interface UseVoiceTypingArgs {
  /** Current value of the input — used as the base when the mic starts. */
  query: string;
  /** Setter that the recognizer pipes interim + final transcripts into. */
  setQuery: (next: string) => void;
  /** Optional ref to refocus when listening starts. */
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  /** ms of silence with no new transcript before we auto-stop. */
  silenceMs?: number;
  /** BCP-47 language tag passed to the recognizer. */
  lang?: string;
}

export function useVoiceTyping({
  query,
  setQuery,
  textareaRef,
  silenceMs = 10000,
  lang = "en-IN",
}: UseVoiceTypingArgs) {
  const recognitionRef = useRef<any>(null);
  const baseQueryRef = useRef<string>("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks user intent: stays true between toggle-on and toggle-off so we can
  // auto-restart when Chrome's SpeechRecognition ends a session on its own
  // (it does this on short pauses even with `continuous: true`).
  const shouldListenRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang;

    const armSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // Genuine abandonment: drop intent so the onend handler doesn't restart.
        shouldListenRef.current = false;
        try {
          r.stop();
        } catch {
          /* noop */
        }
      }, silenceMs);
    };

    r.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interim += t;
      }
      const merged = `${baseQueryRef.current}${baseQueryRef.current && (finalText || interim) ? " " : ""}${finalText}${interim}`;
      setQuery(merged.replace(/\s+/g, " ").trimStart());
      if (finalText) {
        baseQueryRef.current = `${baseQueryRef.current}${baseQueryRef.current ? " " : ""}${finalText.trim()}`.trim();
      }
      armSilenceTimer();
    };
    r.onstart = () => armSilenceTimer();
    r.onspeechstart = () => armSilenceTimer();
    r.onend = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      // Chrome ends sessions on brief pauses; restart if the user still wants
      // to dictate so a breath doesn't kill the mic.
      if (shouldListenRef.current) {
        try {
          r.start();
          return;
        } catch {
          shouldListenRef.current = false;
        }
      }
      setIsListening(false);
    };
    r.onerror = (event: any) => {
      // `no-speech` and `aborted` are transient — onend will fire next and
      // handle the restart. Treat the rest as fatal.
      const transient = event?.error === "no-speech" || event?.error === "aborted";
      if (!transient) {
        shouldListenRef.current = false;
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        setIsListening(false);
      }
    };
    recognitionRef.current = r;
    return () => {
      shouldListenRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        r.stop();
      } catch {
        /* noop */
      }
    };
    // setQuery is stable enough — re-binding on every keystroke would
    // recreate the recognizer mid-utterance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, silenceMs]);

  const toggle = () => {
    const r = recognitionRef.current;
    if (!r) return;
    if (isListening) {
      shouldListenRef.current = false;
      try {
        r.stop();
      } catch {
        /* noop */
      }
      setIsListening(false);
      return;
    }
    baseQueryRef.current = query.trim();
    shouldListenRef.current = true;
    try {
      r.start();
      setIsListening(true);
      textareaRef?.current?.focus();
    } catch {
      shouldListenRef.current = false;
      setIsListening(false);
    }
  };

  return { isListening, supported, toggle };
}
