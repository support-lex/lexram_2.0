"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { usePerf } from "@/hooks/use-perf";

interface Props {
  src: string;
  /** 0..1 darkness of overlay */
  overlay?: number;
  /** color tint overlay */
  tint?: string;
  className?: string;
  /** optional MP4 ambient video (desktop / capable devices only) */
  videoSrc?: string;
}

/**
 * Cinematic background — animated still with ken-burns + scroll-driven parallax.
 * On capable devices an optional MP4 ambient layer mounts on top of the still.
 */
export function CinematicBg({ src, overlay = 0.65, tint, className, videoSrc }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { cinematic, reduceMotion } = usePerf();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const range = cinematic ? 8 : 3;
  const y = useTransform(scrollYProgress, [0, 1], [`-${range}%`, `${range}%`]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, cinematic ? 1.3 : 1.18]);

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ""}`}>
      <motion.div
        style={
          reduceMotion
            ? { backgroundImage: `url(${src})` }
            : { y, scale, backgroundImage: `url(${src})` }
        }
        className={`absolute inset-[-10%] bg-cover bg-center will-change-transform ${reduceMotion ? "" : "anim-ken-burns"}`}
      />
      {videoSrc && cinematic && (
        <video
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-[-10%] w-[120%] h-[120%] object-cover opacity-55 mix-blend-screen will-change-transform"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, oklch(0.10 0.012 40 / ${overlay}) 0%, oklch(0.10 0.012 40 / ${overlay * 0.7}) 50%, oklch(0.10 0.012 40 / ${Math.min(overlay + 0.1, 0.95)}) 100%)`,
        }}
      />
      {tint && <div className="absolute inset-0" style={{ background: tint, mixBlendMode: "overlay" }} />}
      <div className="absolute inset-0 cinematic-vignette" />
    </div>
  );
}
