"use client";

import { useEffect, useState } from "react";

/**
 * Performance/capability detector for cinematic landing-page effects.
 * Heavy parallax, particles, cursor glow and ambient video downgrade
 * automatically on mobile, low-DPR devices, or with prefers-reduced-motion.
 */
export function usePerf() {
  const [state, setState] = useState({
    isMobile: false,
    reduceMotion: false,
    /** Safe to enable heavy parallax / cursor glow / video bg.
     *  Starts false so SSR matches the most-conservative client render
     *  and we avoid hydration mismatches when the client downgrades. */
    cinematic: false,
  });

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 820px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const update = () => {
      const isMobile = mqMobile.matches || coarse;
      const reduceMotion = mqReduce.matches;
      const cinematic = !isMobile && !reduceMotion && !lowCores;
      setState({ isMobile, reduceMotion, cinematic });
    };
    update();
    mqMobile.addEventListener("change", update);
    mqReduce.addEventListener("change", update);
    return () => {
      mqMobile.removeEventListener("change", update);
      mqReduce.removeEventListener("change", update);
    };
  }, []);

  return state;
}
