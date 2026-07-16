"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Mail, Phone, MapPin } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   LandingNav — dark-maroon bar (same brand palette as the
   landing page hero section).  Used on /blog and /sign-in
   onboarding pages so the nav is visually distinct from the
   cream page body.
───────────────────────────────────────────────────────────────*/
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onHash = () => setOpen(false);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [open]);

const navLinks = [
    { href: "/",              label: "Home" },
    { href: "/research",      label: "Research" },
    { href: "/drafting",      label: "Drafting" },
    { href: "/#faq",          label: "FAQ" },
    { href: "/pricing",       label: "Pricing" },
    { href: "/#contact",      label: "Contact" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 backdrop-blur-md border-b border-[#6b1e2d]/10 ${
        scrolled
          ? "bg-[#d8cdb8] shadow-[0_4px_24px_rgba(107,30,45,0.08)]"
          : "bg-[#d8cdb8]/80"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">

        {/* Brand */}
        <Link href="/" aria-label="LexRam" className="flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lexram-logo.png" alt="LexRam" width={140} height={48} className="h-11 sm:h-12 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7 text-base text-[#6b1e2d]/80">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="font-medium hover:text-[#6b1e2d] transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/sign-in" className="inline-flex items-center gap-2 border border-[#6b1e2d]/25 text-[#6b1e2d] px-4 lg:px-5 py-2.5 rounded-md text-base font-medium hover:border-[#6b1e2d] hover:text-[#6b1e2d] transition">
            Login
          </Link>
          <Link href="/#contact" className="inline-flex items-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-4 lg:px-5 py-2.5 rounded-md text-base font-semibold hover:bg-[#AA4400] transition shadow-[0_4px_16px_rgba(204,85,0,0.35)]">
            <span className="hidden md:inline">Free Trial</span>
            <span className="md:hidden">Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button type="button" onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-[#6b1e2d]/20 text-[#6b1e2d] hover:border-[#6b1e2d] hover:text-[#6b1e2d] transition"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`lg:hidden overflow-hidden border-t border-[#6b1e2d]/10 bg-[#d8cdb8]/95 backdrop-blur-md transition-[max-height,opacity] duration-300 ease-out ${
        open ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="py-3.5 text-lg font-semibold text-[#6b1e2d]/85 border-b border-[#6b1e2d]/10 last:border-b-0 hover:text-[#6b1e2d] transition"
            >
              {l.label}
            </Link>
          ))}

          <div className="mt-4 flex flex-col sm:hidden gap-2 pb-2">
            <Link href="/sign-in" onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 border border-[#6b1e2d]/25 text-[#6b1e2d] px-4 py-2.5 rounded-md text-sm font-medium"
            >
              Login
            </Link>
            <Link href="/#contact" onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-4 py-2.5 rounded-md text-sm font-semibold"
            >
              Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────
   LandingFooter — professional footer with contact, products,
   information columns and social links.
───────────────────────────────────────────────────────────────*/
const SocialIcons = {
  LinkedIn: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  YouTube: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
};

export function LandingFooter() {
  const socials = [
    { href: "https://www.linkedin.com/company/lexram-ai-legal-analysis/", svgPath: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z", label: "LinkedIn"  },
    { href: "https://youtube.com/@lexramai?si=uyc3g0b8Ebde_eLN",          svgPath: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z", label: "YouTube"   },
    { href: "https://www.instagram.com/learn.with.lexram.ai?igsh=YW9hYjF2MjNyMThl",      svgPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z", label: "Instagram" },
    { href: "https://www.facebook.com/profile.php?id=61588185590846",       svgPath: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", label: "Facebook"  },
  ];

  return (
    <footer className="bg-[#6b1e2d] text-[#d8cdb8]/70 border-t border-[#d8cdb8]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-8 lg:gap-10">

          {/* Col 1: Brand + contact + social */}
          <div className="flex flex-col gap-4">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#d8cdb8] tracking-tight" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.45), 0 1px 8px rgba(0,0,0,0.55)" }}>LexRam</span>
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
              {socials.map(({ href, svgPath, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-md border border-[#d8cdb8]/15 grid place-items-center text-[#d8cdb8]/55 hover:border-[#CC5500] hover:text-[#CC5500] hover:bg-[#CC5500]/10 transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d={svgPath} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Products */}
          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#CC5500] mb-3">Products</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/#research"       className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Research</Link></li>
              <li><Link href="/#drafting"       className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Drafting</Link></li>
              <li><Link href="/dashboard/tsr" className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">TSR</Link></li>
            </ul>
          </div>

          {/* Col 3: Information */}
          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#CC5500] mb-3">Information</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/blog"    className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Blog</Link></li>
              <li><Link href="/#faq"    className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Col 4: Policy */}
          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#CC5500] mb-3">Policy</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy"       className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Privacy</Link></li>
              <li><Link href="/terms"         className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Terms</Link></li>
              <li><Link href="/refund-policy" className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Refund</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 border-t border-[#d8cdb8]/10" />

        {/* Bottom bar */}
        <div className="mt-4 text-sm text-[#d8cdb8]/70">
          <span>© {new Date().getFullYear()} Ramasubramanian AI Software Pvt. Ltd. — Built in India, for Indian advocates.</span>
        </div>
      </div>
    </footer>
  );
}


