"use client";

import { motion } from "motion/react";
import { ButtonHTMLAttributes, ReactNode, useRef, useState } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost";
}

export function MagneticButton({ children, variant = "primary", className, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    setPos({ x: x * 0.25, y: y * 0.25 });
  };
  const reset = () => setPos({ x: 0, y: 0 });

  const base =
    "relative inline-flex items-center justify-center px-7 py-3.5 rounded-full text-sm tracking-wide font-medium transition-shadow duration-500 select-none";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-br from-[oklch(0.86_0.10_80)] via-[oklch(0.78_0.13_75)] to-[oklch(0.55_0.13_50)] text-[var(--charcoal)] shadow-[0_10px_40px_-10px_oklch(0.78_0.13_75/0.6)] hover:shadow-[0_18px_60px_-10px_oklch(0.78_0.13_75/0.8)]"
      : "border border-[oklch(0.78_0.13_75/0.4)] text-[var(--ivory)] hover:border-[oklch(0.78_0.13_75/0.9)] hover:bg-[oklch(0.78_0.13_75/0.06)]";

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.4 }}
      className={`${base} ${styles} ${className ?? ""}`}
      {...(rest as object)}
    >
      <span className="relative z-10">{children}</span>
      {variant === "primary" && (
        <span
          className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "radial-gradient(circle at 50% 0%, oklch(1 0 0 / 0.3), transparent 60%)",
          }}
        />
      )}
    </motion.button>
  );
}
