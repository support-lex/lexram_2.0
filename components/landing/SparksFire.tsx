"use client";

import { useMemo } from "react";
import { usePerf } from "@/hooks/use-perf";

interface Props {
  /** Spark count on full-cinematic devices. Lower-power devices get ~1/3. */
  count?: number;
  className?: string;
}

/**
 * SparksFire — golden ember/spark particles drifting upward like embers
 * lifting from a fire. Pure CSS keyframes (no JS animation loop) so it
 * stays cheap. Hides on prefers-reduced-motion. Particle positions are
 * deterministic (seeded by index) so SSR + first client paint match.
 */
export function SparksFire({ count = 60, className }: Props) {
  const { cinematic, reduceMotion } = usePerf();
  const effectiveCount = cinematic ? count : Math.min(20, Math.ceil(count / 3));

  const sparks = useMemo(
    () =>
      Array.from({ length: effectiveCount }, (_, i) => {
        // Pseudo-random but deterministic — keeps SSR/CSR identical.
        const seed = (i * 9301 + 49297) % 233280;
        const r = (n: number) => ((seed * (n + 1)) % 1000) / 1000;
        const startLeft = r(1) * 100;
        const drift = (r(2) - 0.5) * 30; // -15% to +15% horizontal drift
        const size = 1 + r(3) * 3; // 1 to 4 px
        const delay = r(4) * 6; // 0 to 6 s
        const duration = 4 + r(5) * 6; // 4 to 10 s rise time
        const hue = 60 + r(6) * 30; // 60–90 = warm yellow → amber
        const lightness = 0.7 + r(7) * 0.2; // bright sparks
        const opacity = 0.5 + r(8) * 0.5;
        return { id: i, startLeft, drift, size, delay, duration, hue, lightness, opacity };
      }),
    [effectiveCount],
  );

  if (reduceMotion) return null;

  return (
    <div
      aria-hidden
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ""}`}
    >
      {sparks.map((s) => (
        <span
          key={s.id}
          className="spark-ember"
          style={
            {
              left: `${s.startLeft}%`,
              ["--drift" as string]: `${s.drift}%`,
              width: s.size,
              height: s.size,
              background: `radial-gradient(circle, oklch(${s.lightness} 0.18 ${s.hue}) 0%, oklch(${s.lightness * 0.85} 0.16 ${s.hue} / 0.7) 50%, transparent 80%)`,
              boxShadow: `0 0 ${4 + s.size * 2}px oklch(0.82 0.16 ${s.hue} / 0.85), 0 0 ${10 + s.size * 4}px oklch(0.78 0.14 ${s.hue} / 0.55)`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              opacity: s.opacity,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Subtle ember glow at the bottom — origin of the sparks */}
      {cinematic && (
        <div
          className="absolute bottom-0 inset-x-0 h-40 spark-ember-glow"
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 50% 100%, oklch(0.62 0.18 55 / 0.25) 0%, oklch(0.45 0.14 35 / 0.10) 40%, transparent 70%)",
          }}
        />
      )}
    </div>
  );
}
