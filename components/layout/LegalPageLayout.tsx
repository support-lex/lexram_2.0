"use client";

import { useState, useEffect } from "react";
import { Scale, ArrowRight, Menu, X, Shield, FileText, RefreshCcw, Cookie, Briefcase } from "lucide-react";
import Link from "next/link";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  FileText,
  RefreshCcw,
  Cookie,
  Briefcase,
};

export default function LegalPageLayout({
  children,
  title,
  icon,
}: {
  children: React.ReactNode;
  title?: string;
  icon?: string;
}) {
  const IconComp = icon ? ICONS[icon] : null;

  return (
    <div className="min-h-screen bg-[#fff0df]">
      <LegalNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {title && (
          <div className={IconComp ? "flex items-center gap-4 mb-8" : "mb-8"}>
            {IconComp && <IconComp className="w-8 h-8 text-[#b94826]" />}
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#680318]">
              {title}
            </h1>
          </div>
        )}
        <div className="text-[#680318]/70 leading-relaxed">
          {children}
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}

function LegalNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onHash = () => setOpen(false);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [open]);

  const links = [
{ href: "/", label: "Home" },
    { href: "/#research", label: "Research" },
    { href: "/#drafting", label: "Drafting" },
    { href: "/#faq", label: "FAQ" },
    { href: "/pricing", label: "Pricing" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#fff0df]/80 border-b border-[#680318]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-md bg-gradient-warm grid place-items-center shadow-soft">
            <Scale className="w-4 h-4 text-[#fff0df]" />
          </div>
          <span className="font-serif text-lg sm:text-xl font-bold text-[#680318]">
            LexRam<span className="text-[#b94826]">.</span>ai
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm text-[#680318]/80">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[#680318] transition">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2">
          <Link href="/sign-in" className="inline-flex items-center gap-2 border border-[#680318]/25 text-[#680318] px-3.5 lg:px-4 py-2 rounded-md text-sm font-medium hover:border-[#b94826] hover:text-[#b94826] transition">
            Login
          </Link>
          <Link href="/sign-in" className="inline-flex items-center gap-2 bg-[#680318] text-[#fff0df] px-3.5 lg:px-4 py-2 rounded-md text-sm font-medium hover:bg-[#b94826] transition shadow-soft">
            <span className="hidden md:inline">Free Trial</span>
            <span className="md:hidden">Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-[#680318]/20 text-[#680318] hover:border-[#b94826] hover:text-[#b94826] transition"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div
        className={`lg:hidden overflow-hidden border-t border-[#680318]/10 bg-[#fff0df]/95 backdrop-blur-md transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 text-base font-medium text-[#680318]/85 border-b border-[#680318]/10 last:border-b-0 hover:text-[#b94826] transition"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col sm:hidden gap-2">
            <Link onClick={() => setOpen(false)} href="/sign-in" className="inline-flex items-center justify-center gap-2 border border-[#680318]/25 text-[#680318] px-4 py-2.5 rounded-md text-sm font-medium">
              Login
            </Link>
            <Link onClick={() => setOpen(false)} href="/sign-in" className="inline-flex items-center justify-center gap-2 bg-[#680318] text-[#fff0df] px-4 py-2.5 rounded-md text-sm font-medium">
              Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function LegalFooter() {
  return (
    <footer className="bg-[#680318] text-[#fff0df]/70 py-12 border-t border-[#b94826]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <span>© {new Date().getFullYear()} Ramasubramanian AI Software Pvt. Ltd.</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-[#b94826] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#b94826] transition-colors">Terms</Link>
            <Link href="/refund-policy" className="hover:text-[#b94826] transition-colors">Refund</Link>
            <Link href="/cookies" className="hover:text-[#b94826] transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
