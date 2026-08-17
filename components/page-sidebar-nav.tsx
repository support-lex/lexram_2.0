"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

export type SidebarItem = {
  id: string;
  icon: LucideIcon;
  label: string;
};

export function PageSidebarNav({ items }: { items: SidebarItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const [visible, setVisible] = useState(false);

  /* hide on Hero (first viewport), show once user scrolls past it */
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* active section tracking */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  };

  return (
    <aside
      className="hidden lg:block fixed left-0 z-40"
      style={{
        top: "50%",
        transform: "translateY(-50%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Rectangular card panel — no top/bottom padding, no gaps */}
      <div
        style={{
          background: "linear-gradient(180deg, #8b2a3c 0%, #6b1e2d 100%)",
          border: "1px solid rgba(139,42,60,0.5)",
          borderLeft: "none",
          borderRadius: "0 10px 10px 0",
          boxShadow: "4px 0 28px rgba(139,42,60,0.35), 0 4px 24px rgba(0,0,0,0.3)",
          overflow: "hidden",
          width: 80,
        }}
      >
        {items.map(({ id, icon: Icon, label }, idx) => {
          const isActive = activeId === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="w-full flex flex-col items-center justify-center gap-[6px] cursor-pointer border-0 transition-all duration-200"
              style={{
                height: "72px",
                background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                borderBottom:
                  idx < items.length - 1
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "none",
                boxShadow: isActive ? "inset 3px 0 0 #CC5500" : "none",
              }}
            >
              <Icon
                style={{
                  width: 19,
                  height: 19,
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.60)",
                  strokeWidth: isActive ? 2 : 1.5,
                  transition: "color 0.2s",
                }}
              />
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                  textAlign: "center",
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                  transition: "color 0.2s",
                  padding: "0 6px",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}