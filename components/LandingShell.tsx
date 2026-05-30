"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Mail, Phone, MapPin } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   LandingNav — dark-maroon bar (same brand palette as the
   landing page hero section).  Used on /blog and /dashboard/tsr
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

  const links = [
    { href: "/#research",     label: "Research" },
    { href: "/#drafting",     label: "Drafting" },
    { href: "/dashboard/tsr", label: "TSR" },
    { href: "/blog",          label: "Blog" },
    { href: "/#pricing",      label: "Pricing" },
    { href: "/#faq",          label: "FAQ" },
    { href: "/#contact",      label: "Contact" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#680318]/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(104,3,24,0.35)] border-b border-[#b94826]/20"
          : "bg-[#680318] border-b border-[#b94826]/15"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 h-20 flex items-center justify-between gap-3">

        {/* Brand */}
        <Link href="/" aria-label="Lexram" className="flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lexram-logo.png"
            alt="Lexram"
            width={140}
            height={48}
            className="h-11 sm:h-12 w-auto brightness-0 invert"
          />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-8 text-base">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-medium text-[#fff0df]/80 hover:text-[#fff0df] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 border border-[#fff0df]/30 text-[#fff0df]/90 px-4 lg:px-5 py-2.5 rounded-md text-base font-medium hover:border-[#fff0df]/70 hover:text-[#fff0df] transition"
          >
            Login
          </Link>
          <Link
            href="/sign-in?intent=signup"
            className="inline-flex items-center gap-2 bg-[#b94826] text-[#fff0df] px-4 lg:px-5 py-2.5 rounded-md text-base font-semibold hover:bg-[#8f3318] transition shadow-[0_4px_16px_rgba(185,72,38,0.45)]"
          >
            <span className="hidden md:inline">Free Trial</span>
            <span className="md:hidden">Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-[#fff0df]/25 text-[#fff0df] hover:border-[#b94826] hover:text-[#b94826] transition"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden overflow-hidden border-t border-[#fff0df]/10 bg-[#680318] transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <nav className="max-w-[1440px] mx-auto px-6 sm:px-10 py-4 flex flex-col">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3.5 text-lg font-semibold text-[#fff0df]/80 border-b border-[#fff0df]/10 last:border-b-0 hover:text-[#b94826] transition"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col sm:hidden gap-2 pb-2">
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 border border-[#fff0df]/30 text-[#fff0df] px-4 py-2.5 rounded-md text-sm font-medium"
            >
              Login
            </Link>
            <Link
              href="/sign-in?intent=signup"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 bg-[#b94826] text-[#fff0df] px-4 py-2.5 rounded-md text-sm font-semibold"
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
    { href: "https://linkedin.com/company/lexram", Icon: SocialIcons.LinkedIn,  label: "LinkedIn"  },
    { href: "https://youtube.com/@lexram",          Icon: SocialIcons.YouTube,   label: "YouTube"   },
    { href: "https://instagram.com/lexram.ai",      Icon: SocialIcons.Instagram, label: "Instagram" },
    { href: "https://facebook.com/lexram.ai",       Icon: SocialIcons.Facebook,  label: "Facebook"  },
  ];

  return (
    <footer className="bg-[#680318] text-[#fff0df]/75">
      {/* ── Main grid ── */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* ── Col 1: Brand + tagline + social ── */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lexram-logo.png"
              alt="Lexram"
              width={130}
              height={46}
              className="h-10 w-auto brightness-0 invert mb-4"
            />
            <p className="text-sm leading-relaxed text-[#fff0df]/65 mb-6 max-w-xs">
              &ldquo;You argue the case. We&apos;ll find the law.&rdquo;<br />
              Built exclusively on India&apos;s courts — statute to submission.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socials.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-md border border-[#fff0df]/15 grid place-items-center text-[#fff0df]/60 hover:border-[#b94826] hover:text-[#b94826] hover:bg-[#b94826]/10 transition-all"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* ── Col 2: Products ── */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#b94826] mb-5">Products</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/#research" className="text-[#fff0df]/75 hover:text-[#fff0df] transition-colors">
                  Research
                </Link>
              </li>
              <li>
                <Link href="/#drafting" className="text-[#fff0df]/75 hover:text-[#fff0df] transition-colors">
                  Drafting
                </Link>
              </li>
              <li>
                <Link href="/dashboard/tsr" className="text-[#fff0df]/75 hover:text-[#fff0df] transition-colors">
                  TSR
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Col 3: Information ── */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#b94826] mb-5">Information</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/blog" className="text-[#fff0df]/75 hover:text-[#fff0df] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-[#fff0df]/75 hover:text-[#fff0df] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-[#fff0df]/75 hover:text-[#fff0df] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Col 4: Contact ── */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#b94826] mb-5">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href="tel:+918754446066"
                  className="flex items-start gap-2.5 text-[#fff0df]/75 hover:text-[#fff0df] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#b94826] mt-0.5 shrink-0" />
                  <span>+91 87544 46066</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@lexram.ai"
                  className="flex items-start gap-2.5 text-[#fff0df]/75 hover:text-[#fff0df] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#b94826] mt-0.5 shrink-0" />
                  <span>hello@lexram.ai</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-[#fff0df]/65 leading-relaxed">
                <MapPin className="w-4 h-4 text-[#b94826] mt-0.5 shrink-0" />
                <address className="not-italic text-xs leading-[1.7]">
                  G1 (Ground Floor), Bhaskara Apartments,<br />
                  No. 28, Pycrofts Garden Road,<br />
                  Nungambakkam,<br />
                  Chennai — 600 006
                </address>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mt-12 border-t border-[#fff0df]/10" />

        {/* ── Bottom bar ── */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#fff0df]/40">
          <span>© {new Date().getFullYear()} Ramasubramanian AI Software Pvt. Ltd. — Built in India, for Indian advocates.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy"       className="hover:text-[#fff0df]/70 transition-colors">Privacy</Link>
            <Link href="/terms"         className="hover:text-[#fff0df]/70 transition-colors">Terms</Link>
            <Link href="/refund-policy" className="hover:text-[#fff0df]/70 transition-colors">Refund</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
