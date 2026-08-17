"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

interface Props { value: number; suffix?: string; label: string; }

export function Stat({ value, suffix = "", label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1800;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-5xl md:text-6xl text-gradient-gold tabular-nums">
        {n.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-xs uppercase tracking-[0.25em] text-[var(--landing-muted)]">{label}</div>
    </div>
  );
}
