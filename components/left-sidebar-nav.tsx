"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, FileText, Shield, BookOpen } from "lucide-react";

const NAV_ITEMS = [
  { href: "/",               icon: House,    label: "Home"      },
  { href: "/research",       icon: Search,   label: "Research"  },
  { href: "/drafting",       icon: FileText, label: "Drafting"  },
  { href: "/sign-in",        icon: Shield,   label: "Scrutiny"  },
  { href: "/blog",           icon: BookOpen, label: "Blog"      },
];

export function LeftSidebarNav() {
  const pathname = usePathname();

  /* hide on dashboard routes — they have their own app shell */
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/sign-in")) return null;

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 h-screen w-[82px] z-40 flex-col items-center pt-5 pb-6 gap-0"
      style={{
        background: "linear-gradient(180deg, #8b2a3c 0%, #6b1e2d 100%)",
        borderRight: "1px solid rgba(139,42,60,0.5)",
        boxShadow: "4px 0 24px rgba(139,42,60,0.35)",
      }}
    >
      {/* Logo mark */}
      <Link href="/" className="mb-7 shrink-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lexram-logo-light.png"
          alt="LexRam"
          className="w-11 h-auto object-contain"
          style={{ filter: "brightness(1.1)" }}
        />
      </Link>

      {/* Divider */}
      <div className="w-8 h-px mb-5" style={{ background: "rgba(247,241,230,0.1)" }} />

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 w-full px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1.5 w-full py-3 rounded-xl transition-all duration-200 group"
              style={{
                background: isActive
                  ? "rgba(255,255,255,0.18)"
                  : "transparent",
                color: isActive ? "#f7f1e6" : "rgba(247,241,230,0.55)",
              }}
            >
              <Icon
                className="w-[18px] h-[18px] transition-colors duration-200 group-hover:!text-[#f7f1e6]"
                style={{ color: "inherit" }}
              />
              <span
                className="text-[9px] font-bold tracking-[0.06em] uppercase leading-none transition-colors duration-200 group-hover:!text-[#f7f1e6]"
                style={{ color: "inherit" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom glow accent */}
      <div
        className="mt-auto w-6 h-6 rounded-full"
        style={{
          background: "rgba(204,85,0,0.55)",
          filter: "blur(14px)",
        }}
      />
    </aside>
  );
}