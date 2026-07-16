"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Facebook, Instagram, Linkedin, Mail, MapPin, Menu, Phone, X, Youtube } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-landing-v2 className="min-h-screen bg-[#fff0df]">
      <BlogNav />
      <main className="pt-16">{children}</main>
      <BlogFooter />
    </div>
  );
}

function BlogNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onHash = () => setOpen(false);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/#research", label: "Research" },
    { href: "/#drafting", label: "Drafting" },
    { href: "/blog", label: "Blog" },
    { href: "/#faq", label: "FAQ" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 backdrop-blur-md bg-[#fff0df]/90 border-b border-[#680318]/10 ${scrolled ? "shadow-sm" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link href="/" aria-label="LexRam" className="flex items-center shrink-0">
          <Image
            src="/lexram-logo.png"
            alt="LexRam"
            width={120}
            height={42}
            priority
            className="h-9 sm:h-10 w-auto"
          />
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
  const socialLinks = [
    { href: "https://linkedin.com/company/lexram", icon: Linkedin, label: "LinkedIn" },
    { href: "https://youtube.com/@lexram", icon: Youtube, label: "YouTube" },
    { href: "https://instagram.com/lexram.ai", icon: Instagram, label: "Instagram" },
    { href: "https://facebook.com/lexram.ai", icon: Facebook, label: "Facebook" },
  ];

  return (
    <footer className="bg-[#680318] text-[#fff0df]/70 py-16 border-t border-[#b94826]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-14">

          {/* Brand + contact */}
          <div>
            <img src="/lexram-logo-light.png" alt="LexRam" className="h-10 w-auto mb-5" />
            <p className="text-sm leading-relaxed mb-6">
              &ldquo;You argue the case. We&apos;ll find the law.&rdquo;<br />
              Built exclusively on India&apos;s courts — statute to submission.
            </p>
            <ul className="space-y-3 text-sm mb-6">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-[#b94826] shrink-0 mt-0.5" />
                <span>+91 87544 46066</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-[#b94826] shrink-0 mt-0.5" />
                <span>hello@lexram.ai</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#b94826] shrink-0 mt-0.5" />
                <span>
                  G1 (Ground Floor), Bhaskara Apartments,<br />
                  No. 28, Pycrofts Garden Road,<br />
                  Nungambakkam, Chennai — 600 006
                </span>
              </li>
            </ul>
            <div className="flex items-center gap-2.5">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#fff0df]/15 text-[#fff0df]/60 hover:text-[#fff0df] hover:border-[#fff0df]/35 transition"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b94826] mb-4">Products</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/research" className="hover:text-[#fff0df] transition">Research</Link></li>
              <li><Link href="/drafting" className="hover:text-[#fff0df] transition">Drafting</Link></li>
              <li><Link href="/sign-in" className="hover:text-[#fff0df] transition">TSR</Link></li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b94826] mb-4">Information</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/blog" className="hover:text-[#fff0df] transition">Blog</Link></li>
              <li><Link href="/#faq" className="hover:text-[#fff0df] transition">FAQ</Link></li>
            </ul>
          </div>

          {/* Policy */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b94826] mb-4">Policy</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-[#fff0df] transition">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-[#fff0df] transition">Terms</Link></li>
              <li><Link href="/refund" className="hover:text-[#fff0df] transition">Refund</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#fff0df]/10 text-xs text-[#fff0df]/45">
          © 2026 Ramasubramanian AI Software Pvt. Ltd. — Built in India, for Indian advocates.
        </div>
      </div>
    </footer>
  );
}
