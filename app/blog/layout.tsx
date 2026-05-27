"use client";

import { useState, useEffect } from "react";
import { Scale, ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-landing-v2 className="min-h-screen">
      <BlogNav />
      <main className="pt-16">{children}</main>
      <BlogFooter />
    </div>
  );
}

function BlogNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onHash = () => setOpen(false);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [open]);

  const links = [
    { href: "/#research", label: "Research" },
    { href: "/#drafting", label: "Drafting" },
    { href: "/blog", label: "Blog" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#faq", label: "FAQ" },
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
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 border border-[#680318]/25 text-[#680318] px-3.5 lg:px-4 py-2 rounded-md text-sm font-medium hover:border-[#b94826] hover:text-[#b94826] transition"
          >
            Login
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 bg-[#680318] text-[#fff0df] px-3.5 lg:px-4 py-2 rounded-md text-sm font-medium hover:bg-[#b94826] transition shadow-soft"
          >
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
            <Link
              onClick={() => setOpen(false)}
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 border border-[#680318]/25 text-[#680318] px-4 py-2.5 rounded-md text-sm font-medium"
            >
              Login
            </Link>
            <Link
              onClick={() => setOpen(false)}
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 bg-[#680318] text-[#fff0df] px-4 py-2.5 rounded-md text-sm font-medium"
            >
              Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function BlogFooter() {
  return (
    <footer className="bg-[#680318] text-[#fff0df]/70 py-16 border-t border-[#b94826]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-gradient-warm grid place-items-center">
                <Scale className="w-4 h-4 text-[#fff0df]" />
              </div>
              <span className="font-serif text-xl font-bold text-[#fff0df]">
                LexRam<span className="text-[#b94826]">.</span>ai
              </span>
            </div>
            <p className="text-sm max-w-sm leading-relaxed">
              &ldquo;You argue the case. We&apos;ll find the law.&rdquo; From statute to submission — built on India&apos;s courts alone.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-[#fff0df] font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/research-2" className="hover:text-[#b94826]">Research</Link></li>
              <li><Link href="/#drafting" className="hover:text-[#b94826]">Drafting</Link></li>
              <li><Link href="/#pricing" className="hover:text-[#b94826] transition">Pricing</Link></li>
              <li><Link href="/#faq" className="hover:text-[#b94826]">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-[#fff0df] font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-[#b94826]">About</Link></li>
              <li><Link href="/blog" className="hover:text-[#b94826]">Blog</Link></li>
              <li><Link href="/privacy" className="hover:text-[#b94826]">Privacy (DPDP)</Link></li>
              <li><Link href="/contact" className="hover:text-[#b94826]">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[#fff0df]/10 flex flex-col md:flex-row justify-between gap-4 text-xs text-[#fff0df]/50">
          <div>© {new Date().getFullYear()} LexRam AI. Built for Indian advocates.</div>
          <div>Made with reverence for the rule of law.</div>
        </div>
      </div>
    </footer>
  );
}
