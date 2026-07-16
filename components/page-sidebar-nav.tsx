"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Search,
  FileText,
  IndianRupee,
  Scale,
  MessageSquare,
  HelpCircle,
  Mail,
  Layers,
  GitCompare,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons resolvable by name. Pass `icon="products"` from a Server Component
 * instead of passing a Lucide component reference — components/functions
 * can't be serialized across the RSC boundary.
 */
const ICONS: Record<string, LucideIcon> = {
  products: LayoutGrid,
  research: Search,
  drafting: FileText,
  pricing: IndianRupee,
  compare: Scale,
  testimonials: MessageSquare,
  faq: HelpCircle,
  contact: Mail,
  layers: Layers,
  "credit-card": CreditCard,
  "git-compare": GitCompare,
};

export type SidebarItem = {
  id: string;
  /** Key into {@link ICONS} — e.g. "products", "research". */
  icon: string;
  label: string;
  /** When set, the item renders as a link to this route instead of an in-page scroll target. */
  href?: string;
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

  /* active section tracking — only for items without an external href */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    items.forEach(({ id, href }) => {
      if (href) return;
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
        {items.map(({ id, icon: iconKey, label, href }, idx) => {
          const Icon = ICONS[iconKey];
          const isActive = !href && activeId === id;
          const inner = (
            <>
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
            </>
          );
          const baseStyle = {
            height: "72px",
            background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
            borderBottom:
              idx < items.length - 1
                ? "1px solid rgba(255,255,255,0.12)"
                : "none",
            boxShadow: isActive ? "inset 3px 0 0 #CC5500" : "none",
          } as const;
          const className =
            "w-full flex flex-col items-center justify-center gap-[6px] cursor-pointer border-0 transition-all duration-200";
          return href ? (
            <Link
              key={id}
              href={href}
              className={className}
              style={baseStyle}
              aria-label={label}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={className}
              style={baseStyle}
              aria-label={label}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </aside>
  );
}