"use client";

import { useMemo } from "react";
import { usePerf } from "@/hooks/use-perf";

interface Props {
  count?: number;
  className?: string;
}

export function GoldenParticles({ count = 28, className }: Props) {
  const { cinematic, reduceMotion } = usePerf();
  const effectiveCount = cinematic ? count : Math.min(8, Math.ceil(count / 3));
  const dots = useMemo(
    () =>
      Array.from({ length: effectiveCount }, (_, i) => ({
        id: i,
        // deterministic positions so SSR + client match (no hydration warning)
        left: ((i * 73) % 100),
        top: ((i * 47 + 13) % 100),
        size: 1 + ((i * 7) % 4),
        delay: (i * 0.7) % 6,
        duration: 6 + ((i * 3) % 8),
        opacity: 0.3 + ((i * 11) % 60) / 100,
      })),
    [effectiveCount],
  );
  if (reduceMotion) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ""}`}>
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full anim-float anim-pulse-glow"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: "radial-gradient(circle, oklch(0.86 0.12 80) 0%, transparent 70%)",
            boxShadow: "0 0 12px oklch(0.78 0.13 75 / 0.6)",
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            opacity: d.opacity,
          }}
        />
      ))}
    </div>
  );
}
