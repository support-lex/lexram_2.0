"use client";

import { motion, useScroll, useTransform, MotionValue } from "motion/react";
import { useRef, ReactNode } from "react";
import { usePerf } from "@/hooks/use-perf";

interface Props {
  children: ReactNode;
  speed?: number; // negative = moves up faster
  className?: string;
}

export function ParallaxLayer({ children, speed = -80, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { cinematic, reduceMotion } = usePerf();
  const effective = reduceMotion ? 0 : cinematic ? speed : speed * 0.35;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [effective, -effective]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

export function useParallax(scrollYProgress: MotionValue<number>, distance: number) {
  return useTransform(scrollYProgress, [0, 1], [-distance, distance]);
}
