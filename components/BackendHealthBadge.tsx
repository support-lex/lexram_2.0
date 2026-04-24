"use client";

import { useEffect, useState } from "react";
import { healthRepository } from "@/modules/legal/repository/health.repository";

const POLL_INTERVAL_MS = 60_000; // 60s

type Status = "checking" | "online" | "offline";

/**
 * Tiny status pill showing whether the LexRam backend is reachable.
 * Polls /legal-api/health every 60s. Shows nothing while the first probe is
 * in flight, then a colored dot + label.
 *
 * Mount it anywhere — it's positioned absolutely / inline based on the
 * `floating` prop.
 */
export default function BackendHealthBadge({
  floating = true,
}: {
  floating?: boolean;
}) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      const ok = await healthRepository.isHealthy();
      if (cancelled) return;
      setStatus(ok ? "online" : "offline");
    };

    probe();
    const t = setInterval(probe, POLL_INTERVAL_MS);

    // Re-probe when the tab gets focus so users see fresh status after a
    // suspend / network change without waiting up to 60s.
    const onFocus = () => probe();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (status === "checking") return null;

  const dotCls =
    status === "online"
      ? "bg-emerald-500 animate-pulse"
      : "bg-red-500";
  const label = status === "online" ? "Backend online" : "Backend offline";
  const textCls =
    status === "online"
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-red-700 dark:text-red-400";

  const wrapperCls = floating
    ? "hidden md:inline-flex fixed bottom-3 right-3 z-30 bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm"
    : "inline-flex border border-[var(--border-default)]";

  return (
    <div
      className={`${wrapperCls} rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 text-[11px] font-medium ${textCls}`}
      title={label}
      role="status"
      aria-live="polite"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
      <span>{label}</span>
    </div>
  );
}
