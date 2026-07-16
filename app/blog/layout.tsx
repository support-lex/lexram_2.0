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
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 backdrop-blur-md border-b border-[#6b1e2d]/10 ${
        scrolled ? "bg-[#fff0df] shadow-[0_4px_24px_rgba(107,30,45,0.08)]" : "bg-[#fff0df]/80"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
        <Link href="/" aria-label="LexRam" className="flex items-center shrink-0">
          <Image src="/lexram-logo.png" alt="LexRam" width={140} height={48} className="h-11 sm:h-12 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-base text-[#6b1e2d]/80">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="font-medium hover:text-[#6b1e2d] transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 border border-[#6b1e2d]/25 text-[#6b1e2d] px-4 lg:px-5 py-2.5 rounded-md text-base font-medium hover:border-[#6b1e2d] hover:text-[#6b1e2d] transition"
          >
            Login
          </Link>
          <Link
            href="/sign-in?intent=signup"
            className="inline-flex items-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-4 lg:px-5 py-2.5 rounded-md text-base font-medium hover:bg-[#CC5500] transition shadow-soft"
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
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-[#6b1e2d]/20 text-[#6b1e2d] hover:border-[#6b1e2d] hover:text-[#6b1e2d] transition"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className={`lg:hidden overflow-hidden border-t border-[#6b1e2d]/10 bg-[#fff0df]/95 backdrop-blur-md transition-[max-height,opacity] duration-300 ease-out ${
        open ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3.5 text-lg font-semibold text-[#6b1e2d]/95 border-b border-[#6b1e2d]/10 last:border-b-0 hover:text-[#6b1e2d] transition"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col sm:hidden gap-2 pb-2">
            <Link href="/sign-in" onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 border border-[#6b1e2d]/25 text-[#6b1e2d] px-4 py-2.5 rounded-md text-sm font-medium">
              Login
            </Link>
            <Link href="/sign-in?intent=signup" onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-4 py-2.5 rounded-md text-sm font-medium">
              Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function BlogFooter() {
  const socials = [
    { href: "https://www.linkedin.com/company/lexram-ai-legal-analysis/", Icon: Linkedin },
    { href: "https://youtube.com/@lexramai?si=uyc3g0b8Ebde_eLN", Icon: Youtube },
    { href: "https://www.instagram.com/learn.with.lexram.ai?igsh=YW9hYjF2MjNyMThl", Icon: Instagram },
    { href: "https://www.facebook.com/profile.php?id=61588185590846", Icon: Facebook },
  ];

  return (
    <footer className="bg-[#6b1e2d] text-[#d8cdb8]/70 border-t border-[#d8cdb8]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-8 lg:gap-10">
          <div className="flex flex-col gap-4">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#d8cdb8] tracking-tight">LexRam</span>
            <p className="text-sm leading-relaxed text-[#d8cdb8]/90 max-w-xs">
              &ldquo;You argue the case. We&apos;ll find the law.&rdquo;<br />
              Built exclusively on India&apos;s courts — statute to submission.
            </p>
            <div className="space-y-2.5 text-sm">
              <a href="tel:+918754446066" className="flex items-center gap-2.5 text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">
                <Phone className="w-4 h-4 text-[#CC5500] shrink-0" />
                +91 87544 46066
              </a>
              <a href="mailto:hello@lexram.ai" className="flex items-center gap-2.5 text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">
                <Mail className="w-4 h-4 text-[#CC5500] shrink-0" />
                hello@lexram.ai
              </a>
              <div className="flex items-start gap-2.5 text-[#d8cdb8]/85">
                <MapPin className="w-4 h-4 text-[#CC5500] shrink-0 mt-0.5" />
                <address className="not-italic text-sm leading-[1.8]">
                  G1 (Ground Floor), Bhaskara Apartments,<br />
                  No.&nbsp;28, Pycrofts Garden Road,<br />
                  Nungambakkam, Chennai&nbsp;— 600&nbsp;006
                </address>
              </div>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              {socials.map(({ href, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={Icon.name}
                  className="w-8 h-8 rounded-md border border-[#d8cdb8]/15 grid place-items-center text-[#d8cdb8]/55 hover:border-[#CC5500] hover:text-[#CC5500] hover:bg-[#CC5500]/10 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#CC5500] mb-3">Products</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/#research"  className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Research</Link></li>
              <li><Link href="/#drafting"  className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Drafting</Link></li>
              <li><Link href="/dashboard/tsr" className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">TSR</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#CC5500] mb-3">Information</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/blog"    className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Blog</Link></li>
              <li><Link href="/#faq"    className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#CC5500] mb-3">Policy</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy"       className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Privacy</Link></li>
              <li><Link href="/terms"         className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[#d8cdb8]/10" />
        <p className="mt-4 text-sm text-[#d8cdb8]/60 text-center md:text-left">
          © 2026 Ramasubramanian AI Software Pvt. Ltd. — Built in India, for Indian advocates.
        </p>
      </div>
    </footer>
  );
}
