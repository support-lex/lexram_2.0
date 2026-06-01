"use client";

import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Search, FileText, Scale, Shield, Sparkles, BookOpen, Gavel,
  CheckCircle2, ArrowRight, Quote, Plus, Minus, Star,
  Library, PenTool, Users, Download, Bookmark,
  Calendar, TrendingUp, FileSearch, Layers, Mic,
  Mail, Phone, MapPin, Clock, Send, MessageSquare,
  Menu, X,
} from "lucide-react";
import { track } from "@/lib/landing-analytics";

/* Asset paths — copied into /public/landing/ */
const researchImg   = "/landing/research-img.jpg";
const draftingImg   = "/landing/drafting-img.jpg";
const parallaxCourt = "/landing/parallax-court.jpg";

/* Route helpers — keep CTAs honest about where they lead */
const SIGNUP = "/sign-in?intent=signup";
const LOGIN = "/sign-in";
const RESEARCH = "/dashboard/research-2";
const RESOURCES = "/dashboard/search";
const CONTACT = "/contact";

const go = (href: string) => {
  if (typeof window !== "undefined") window.location.href = href;
};

/* ============================================================
   Helpers — reveal-on-scroll + parallax scrollY
   ============================================================ */
function useReveal() {
  useEffect(() => {
    const selector =
      '[data-landing-v2] .fade-up, [data-landing-v2] .reveal-up, [data-landing-v2] .reveal-down, [data-landing-v2] .reveal-left, [data-landing-v2] .reveal-right, [data-landing-v2] .reveal-zoom, [data-landing-v2] .reveal-blur, [data-landing-v2] .reveal-tilt, [data-landing-v2] .reveal-rise, [data-landing-v2] .zig-row, [data-landing-v2] .paper-lift, [data-landing-v2] [data-reveal-section]';

    /* Auto-tag every <section> that's a direct child of the landing wrapper
       (and the <footer>) so they get the section-level fade-up. Skip the
       first section (Hero) — it already manages its own intro animation
       and we don't want to delay the page's first paint. */
    const sections = document.querySelectorAll('[data-landing-v2] > section, [data-landing-v2] > footer');
    sections.forEach((sec, i) => {
      if (i === 0) return; // Hero stays as-is
      sec.setAttribute('data-reveal-section', '');
    });

    const els = document.querySelectorAll(selector);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add("in-view"));
      },
      { threshold: 0.05, rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));

    /* Failsafe: if the observer hasn't flipped an element to .in-view within
       2.5s of mount (e.g. the user scrolled past too fast, the section was
       already past viewport at first paint, the observer threshold never
       matched a short element), force visibility so content never stays at
       opacity: 0 indefinitely. */
    const failsafe = window.setTimeout(() => {
      document.querySelectorAll(selector).forEach((el) => el.classList.add("in-view"));
    }, 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);
}

function useLenis() {
  useEffect(() => {
    let raf = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let mounted = true;
    (async () => {
      const Lenis = (await import("lenis")).default;
      if (!mounted) return;
      lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      });
      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);
}

/* Page-wide scroll progress (0 → 1). Used by ScrollProgress and any
   parallax-driven element. Throttled via rAF to avoid layout thrash. */
function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const next = Math.min(1, Math.max(0, window.scrollY / max));
      setP(next);
      raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return p;
}

/* Scroll-linked Y offset for an element. Reports the document-relative
   amount the element has been scrolled past its center, so callers can
   apply `translateY(offset * factor)` for parallax without it feeling
   stuck once the section leaves the viewport. */
function useElementScrollOffset(ref: React.RefObject<HTMLElement | null>) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        setOffset((window.innerHeight / 2 - center));
      }
      raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
  return offset;
}

/* Thin progress bar pinned to the top of the viewport. Width grows as the
   user scrolls down the document. */
function ScrollProgress() {
  const p = useScrollProgress();
  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-[#b94826] via-[#d96944] to-[#b94826] shadow-[0_0_12px_rgba(185,72,38,0.6)]"
        style={{ width: `${p * 100}%`, transition: "width 80ms linear" }}
      />
    </div>
  );
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return y;
}

/* ============================================================
   Nav
   ============================================================ */
function Nav() {
  const [open, setOpen] = useState(false);

  /* Close the mobile sheet whenever the user navigates via a link or
     the route hash changes, otherwise the overlay traps focus on the
     destination section. */
  useEffect(() => {
    if (!open) return;
    const onHash = () => setOpen(false);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [open]);

  const links = [
    { href: "#research", label: "Research" },
    { href: "#drafting", label: "Drafting" },
    { href: "/dashboard/tsr", label: "TSR" },
    { href: "/dashboard/blog", label: "Blog" },
    { href: "#pricing",  label: "Pricing" },
    { href: "#faq",      label: "FAQ" },
    { href: "#contact",  label: "Contact" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#fff0df]/80 border-b border-[#680318]/10">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 h-20 flex items-center justify-between gap-3">
        {/* Brand */}
        <a href="#" aria-label="Lexram" className="flex items-center shrink-0">
          <img
            src="/lexram-logo.png"
            alt="Lexram"
            width={140}
            height={48}
            className="h-11 sm:h-12 w-auto"
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8 text-base text-[#680318]/80">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="font-medium hover:text-[#680318] transition">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => {
              track("cta_login_click", { location: "nav" });
              go(LOGIN);
            }}
            className="inline-flex items-center gap-2 border border-[#680318]/25 text-[#680318] px-4 lg:px-5 py-2.5 rounded-md text-base font-medium hover:border-[#b94826] hover:text-[#b94826] transition"
          >
            Login
          </button>
          <button
            onClick={() => {
              track("cta_start_trial_click", { location: "nav" });
              go(SIGNUP);
            }}
            className="inline-flex items-center gap-2 bg-[#680318] text-[#fff0df] px-4 lg:px-5 py-2.5 rounded-md text-base font-medium hover:bg-[#b94826] transition shadow-soft"
          >
            <span className="hidden md:inline">Free Trial</span>
            <span className="md:hidden">Trial</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile menu toggle (visible <sm and on md when desktop links hidden <lg) */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-[#680318]/20 text-[#680318] hover:border-[#b94826] hover:text-[#b94826] transition"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden overflow-hidden border-t border-[#680318]/10 bg-[#fff0df]/95 backdrop-blur-md transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <nav className="max-w-[1440px] mx-auto px-6 sm:px-10 py-4 flex flex-col">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3.5 text-lg font-semibold text-[#680318]/85 border-b border-[#680318]/10 last:border-b-0 hover:text-[#b94826] transition"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col sm:hidden gap-2">
            <button
              onClick={() => { setOpen(false); track("cta_login_click", { location: "nav_mobile" }); go(LOGIN); }}
              className="inline-flex items-center justify-center gap-2 border border-[#680318]/25 text-[#680318] px-4 py-2.5 rounded-md text-sm font-medium"
            >
              Login
            </button>
            <button
              onClick={() => { setOpen(false); track("cta_start_trial_click", { location: "nav_mobile" }); go(SIGNUP); }}
              className="inline-flex items-center justify-center gap-2 bg-[#680318] text-[#fff0df] px-4 py-2.5 rounded-md text-sm font-medium"
            >
              Free Trial <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

/* ============================================================
   Hero
   ============================================================ */
function Hero() {
  const y = useScrollY();
  const tabs = ["Research", "Drafting", "Title Scrutiny"];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((p) => (p + 1) % tabs.length), 4000);
    return () => clearInterval(t);
  }, [paused]);


  const handleTab = (i: number) => {
    setActive(i);
    setPaused(true);
    setTimeout(() => setPaused(false), 8000);
  };

  const content = [
    {
      badge: "RESEARCH",
      title: "Deep Legal Research",
      accent: "Statute-first.",
      accent2: "Precedent-backed.",
      tagline: "\u201CYou argue the case. We'll find the law.\u201D",
      desc: "AI legal research platform built on Supreme Court judgements and statutes — so every judgment you cite is one you can stand behind in court.",
      bullets: ["Central statutes", "Supreme Court judgements backed", "Supreme Court precedent search", "Filters per incuriam judgments", "No fake citations", "Zero hallucinations Legal AI", "Verified citations"],
      cta: "Start Research",
      cta2: "Explore",
      ctaHref: "#research",
    },
    {
      badge: "DRAFTING",
      title: "AI-Assisted Drafting",
      accent: "From your documents",
      accent2: "to a court-ready draft.",
      tagline: "\u201CFrom your documents to a court-ready draft.\u201D",
      desc: "Upload your case file. Lexram reads it, structures the pleading, and pulls your research in — formatted to what your court or tribunal expects, every time.",
      bullets: ["AI legal drafting India", "Court-formatted output", "Verified citations only", "Editable at 2 stages", "Hassle-Free drafting", "Documents to draft"],
      cta: "Start Drafting",
      cta2: "Explore",
      ctaHref: "#drafting",
    },
    {
      badge: "NEW",
      title: "Title Scrutiny Reports",
      accent: "Bank-ready title scrutiny.",
      accent2: "Built from your documents.",
      tagline: "Upload. Verify. Lend.",
      desc: "Upload the property file. Lexram maps the ownership chain, flags encumbrances, and delivers a report lenders can act on — nothing assumed, everything verifiable.",
      bullets: ["Title scrutiny report India", "Bank-ready property report", "Encumbrance check"],
      cta: "Start a Report",
      cta2: "Explore",
      ctaHref: "/dashboard/tsr",
    },
  ];

  const c = content[active];

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* Background layers */}
      <div
        aria-hidden
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${parallaxCourt})`,
          transform: `translate3d(0, ${y * 0.3}px, 0) scale(1.1)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#680318]/92 via-[#680318]/78 to-[#680318]/92" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(42,26,28,0.5)_100%)]" />

      <div
        className="relative w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-10 pt-28 sm:pt-32 md:pt-36 pb-0"
        style={{ transform: `translateY(${y * -0.1}px)` }}
      >
        {/* ── Top: Hero heading + CTAs — fades on scroll ─────────── */}
        <div
          className="text-center w-full mx-auto"
          style={{ opacity: Math.max(0, 1 - y / 500) }}
        >
          <h1 className="reveal-up font-serif text-[2.4rem] leading-none sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-[#fff0df] text-center w-full">
            Indian AI <span className="text-[#b94826] italic">Law Assistant</span>
          </h1>

          <p className="reveal-up mt-6 sm:mt-8 text-lg sm:text-xl md:text-2xl text-[#fff0df]/75 max-w-2xl mx-auto font-light leading-relaxed" style={{ transitionDelay: "120ms", textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
            Research legal questions, draft pleadings, manage matters, trace titles, and grow your network — one platform, built on India&apos;s courts alone.
          </p>

          <div className="reveal-blur mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 justify-center" style={{ transitionDelay: "240ms" }}>
            <button
              type="button"
              onClick={() => {
                track("cta_start_trial_click", { location: "hero" });
                go(SIGNUP);
              }}
              className="inline-flex items-center justify-center gap-2 bg-[#b94826] text-[#fff0df] px-8 py-4 rounded-xl text-base font-semibold hover:bg-[#8f3318] transition-colors shadow-[0_10px_30px_-10px_rgba(185,72,38,0.5)]"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#research"
              className="inline-flex items-center justify-center gap-2 border border-[#fff0df]/25 text-[#fff0df] px-8 py-4 rounded-xl text-base font-medium hover:border-[#fff0df]/50 hover:bg-white/5 transition-all"
            >
              Explore
            </a>
          </div>
        </div>

        {/* ── Below: Feature tabs card ───────────────────────────── */}
        <div className="reveal-up w-full max-w-[1200px] mx-auto mt-12 sm:mt-16" style={{ transitionDelay: "160ms" }}>
          <div className="rounded-2xl border border-[#fff0df]/30 bg-[#fff0df]/[0.18] backdrop-blur-2xl overflow-hidden shadow-[0_24px_70px_-20px_rgba(0,0,0,0.65),0_0_40px_rgba(104,3,24,0.22)]">
            {/* Tab bar */}
            <div className="flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 border-b border-[#fff0df]/8">
              {tabs.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleTab(i)}
                  className={`relative flex-1 inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all duration-300 ${
                    i === active
                      ? "bg-[#b94826] text-[#680318] shadow-[0_4px_16px_rgba(185,72,38,0.45)]"
                      : "text-[#fff0df]/60 hover:text-[#fff0df]/90 hover:bg-white/8"
                  }`}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label === "Title Scrutiny" ? "TSR" : label}</span>
                  {label === "Title Scrutiny" && (
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-full leading-none bg-[#fff0df] text-[#680318]">
                      NEW
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div
              key={active}
              className="p-5 sm:p-7 md:p-8 flex flex-col gap-4 h-[580px] sm:h-[590px] animate-in fade-in slide-in-from-bottom-2 duration-400"
            >
              {/* Badge */}
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-md bg-[#e8c8a8] text-[#680318] self-start">
                {c.badge}
              </span>

              {/* Tagline — quote */}
              {c.tagline && (
                <p className="font-serif text-base sm:text-lg italic text-[#fff0df] leading-snug border-l-2 border-[#b94826] pl-3" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}>
                  {c.tagline}
                </p>
              )}

              {/* Heading */}
              <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#fff0df] leading-tight text-balance" style={{ textShadow: '0 2px 18px rgba(255,240,223,0.25), 0 1px 4px rgba(0,0,0,0.4)' }}>
                <span className="text-[#e8c8a8]">{c.accent}</span>{" "}
                <span className="text-[#b94826]">{c.accent2}</span>
              </h3>

              {/* Description */}
              <p className="text-sm md:text-base text-[#fff0df]/85 leading-relaxed" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                {c.desc}
              </p>

              {/* Bullets */}
              <ul className="space-y-2.5">
                {c.bullets.map((b, bi) => (
                  <li key={bi} className="flex items-start gap-2.5 text-sm sm:text-base text-[#fff0df]/90" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#e8c8a8] mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Explore — always last */}
              <div className="mt-4">
                <a
                  href={c.ctaHref || "#research"}
                  className="inline-flex items-center gap-1.5 text-base font-semibold px-4 py-1.5 rounded-lg bg-[#e8c8a8] text-[#680318] hover:bg-[#fff0df] transition-colors"
                >
                  {c.cta2} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
          </div>
        </div>
      </div>
    </div>
    </section>
  );
}

/* ============================================================
   Trust strip
   ============================================================ */
function TrustStrip() {
  const items = [
    "AI Legal Drafting India", "AI Legal Research Platform India",
    "Supreme Court Judgements India Online", "Zero Hallucination Legal AI",
    "Legal Research Tool for Advocates", "Title Scrutiny Report India",
    "Legal Opinion", "Legal AI India", "AI For Lawyers India",
    "Online Legal Research India", "No Open Source Legal Software",
    "AI Legal Assistant India",
  ];
  return (
    <section className="py-14 md:py-16 bg-[#680318] text-[#fff0df]/80 overflow-hidden border-y border-[#b94826]/30">
      <div
        className="reveal-down text-center text-sm tracking-[0.3em] mb-8 font-bold text-[#fff0df]"
        style={{ textShadow: '0 0 18px rgba(185,72,38,1), 0 0 36px rgba(185,72,38,0.7), 0 0 60px rgba(185,72,38,0.4), 0 2px 6px rgba(0,0,0,0.8)' }}
      >
        Special tools with advanced Unique Features
      </div>
      <div className="relative">
        <div className="flex marquee whitespace-nowrap">
          {[...items, ...items].map((t, i) => (
            <div key={i} className="mx-12 flex items-center gap-12">
              <span
                className="font-serif text-xl md:text-2xl tracking-wider text-[#fff0df]"
                style={{ textShadow: '0 0 16px rgba(185,72,38,0.95), 0 0 32px rgba(185,72,38,0.65), 0 0 52px rgba(185,72,38,0.35), 0 2px 4px rgba(0,0,0,0.7)' }}
              >{t}</span>
              <span
                className="text-[#b94826] text-lg"
                style={{ textShadow: '0 0 10px rgba(185,72,38,1), 0 0 22px rgba(185,72,38,0.8)' }}
              >◆</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Feature grid (expandable cards)
   ============================================================ */
type Feature = {
  icon: React.ComponentType<{ className?: string }>;
  t: string;
  d: string;
  detail: string;
};

function FeatureGrid({
  features, tone = "light",
}: { features: Feature[]; tone?: "light" | "dark" }) {
  const [open, setOpen] = useState<number | null>(null);
  const dark = tone === "dark";
  return (
    <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {features.map((f, i) => {
        const isOpen = open === i;
        return (
          <button
            key={i}
            onClick={() => setOpen(isOpen ? null : i)}
            className={`fade-up text-left p-7 rounded-xl border transition-all group cursor-pointer ${
              dark
                ? `bg-[#fff0df]/5 border-[#fff0df]/15 backdrop-blur-sm hover:bg-[#fff0df]/10 ${
                    isOpen ? "bg-[#fff0df]/15 border-[#b94826]/60" : ""
                  }`
                : `bg-[#fff0df] border-[#680318]/10 hover:border-[#b94826]/40 shadow-soft hover:shadow-elegant ${
                    isOpen ? "border-[#b94826]/60 shadow-elegant" : ""
                  }`
            }`}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-lg grid place-items-center ${
                  dark ? "bg-[#b94826]/20" : "bg-[#680318]/10"
                }`}
              >
                <f.icon className={`w-5 h-5 ${dark ? "text-[#b94826]" : "text-[#680318]"}`} />
              </div>
              <Plus
                className={`w-4 h-4 transition-transform ${isOpen ? "rotate-45" : ""} ${
                  dark ? "text-[#fff0df]/60" : "text-[#680318]/60"
                }`}
              />
            </div>
            <h4
              className={`font-serif text-lg font-bold mb-2 ${
                dark ? "text-[#fff0df]" : "text-[#680318]"
              }`}
            >
              {f.t}
            </h4>
            <p
              className={`text-sm leading-relaxed ${
                dark ? "text-[#fff0df]/70" : "text-[#680318]/70"
              }`}
            >
              {f.d}
            </p>
            <div
              className={`grid transition-all duration-300 ${
                isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`pt-4 border-t text-sm leading-relaxed ${
                    dark
                      ? "border-[#fff0df]/15 text-[#fff0df]/80"
                      : "border-[#680318]/10 text-[#680318]/75"
                  }`}
                >
                  {f.detail}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   Section CTA pair
   ============================================================ */
type CTAEvent =
  | "cta_start_trial_click"
  | "cta_start_research_click"
  | "cta_book_demo_click"
  | "cta_talk_sales_click"
  | "cta_see_pricing_click";

function SectionCTA({
  label, tone = "light", primaryHref = SIGNUP, eventName = "cta_start_trial_click", location,
}: {
  label: string;
  tone?: "light" | "dark";
  primaryHref?: string;
  eventName?: CTAEvent;
  location: string;
}) {
  const dark = tone === "dark";
  return (
    <div className="fade-up mt-10 flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={() => {
          track(eventName, { location });
          go(primaryHref);
        }}
        className={`lex-btn lex-btn--primary group ${dark ? "lex-btn--dark" : ""}`}
      >
        {label} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
      </button>
      <a
        href="#contact"
        onClick={() => track("cta_book_demo_click", { location })}
        className={`lex-btn lex-btn--secondary ${dark ? "lex-btn--dark" : ""}`}
      >
        Book a demo
      </a>
      <a
        href="#pricing"
        onClick={() => track("cta_see_pricing_click", { location })}
        className={`lex-btn lex-btn--pricing ${dark ? "lex-btn--dark" : ""}`}
      >
        See Pricing
      </a>
    </div>
  );
}

/* ============================================================
   ParallaxHeroImage — shared hero-image slot for Research / Drafting.
   Floats with scroll (translate Y) + slight rotate for an alive feel,
   and the warm glow behind it breathes independently.
   ============================================================ */
function ParallaxHeroImage({
  src, alt, tone = "light",
}: { src: string; alt: string; tone?: "light" | "dark" }) {
  const ref = useRef<HTMLDivElement>(null);
  const off = useElementScrollOffset(ref);
  const factor = 0.08;       // how much the image drifts vs scroll
  const rotate = -off * 0.01; // tiny tilt that follows the drift

  const glowClass = tone === "dark"
    ? "bg-[#b94826] opacity-30"
    : "bg-gradient-warm opacity-25";

  return (
    <div ref={ref} className="reveal-right relative" style={{ transitionDelay: "200ms" }}>
      <div aria-hidden className={`lex-breathe absolute -inset-6 ${glowClass} blur-3xl rounded-full pointer-events-none`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={1280}
        height={896}
        className="relative rounded-2xl shadow-elegant w-full aspect-[4/3] object-cover will-change-transform"
        style={{
          transform: `translate3d(0, ${off * factor}px, 0) rotate(${rotate}deg)`,
          transition: "transform 60ms linear",
        }}
      />
    </div>
  );
}

/* ============================================================
   Research
   ============================================================ */
function Research() {
  useReveal();
  return (
    <section id="research" className="py-10 md:py-12 bg-[#fff0df] relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="lex-kicker--bright text-xs tracking-[0.3em] text-[#b94826] mb-4">RESEARCH — AI LEGAL RESEARCH ASSISTANT</div>
            <h2 className="reveal-up font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#680318] leading-tight" style={{ transitionDelay: "120ms" }}>
              Find the right legal answer —<br /><span className="italic">verified</span>, not hallucinated.
            </h2>
            <p className="reveal-up mt-6 text-lg text-[#680318]/70 leading-relaxed" style={{ transitionDelay: "240ms" }}>
              India&apos;s AI legal research platform — Lexram searches the largest curated database of Supreme Court judgements and statutes, you can open, read, and rely on in court.
            </p>
            <div className="mt-8">
              <div className="reveal-down flex items-center gap-3 mb-4" style={{ transitionDelay: "360ms" }}>
                <div className="text-xs font-bold tracking-[0.3em] uppercase text-[#680318]/90" style={{ textShadow: '0 1px 6px rgba(104,3,24,0.35)' }}>
                  Database
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#680318]/20 to-transparent" />
                <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#b94826]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b94826] animate-pulse" />
                  Updated daily
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { t: "SUPREME COURT judgements", s: "Since 1950", icon: Gavel },
                  { t: "Central Statutes", s: "Since 1830", icon: Scale },
                ].map((d, i) => (
                  <div
                    key={d.t}
                    className="reveal-zoom group relative rounded-xl border border-[#680318]/15 bg-[#fff0df] p-5 hover:border-[#b94826]/50 hover:-translate-y-0.5 hover:shadow-elegant overflow-hidden"
                    style={{ transitionDelay: `${440 + i * 120}ms` }}
                  >
                    <div aria-hidden className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-[#b94826]/0 group-hover:bg-[#b94826]/10 blur-2xl transition-all duration-500" />
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#680318]/10 mb-3 group-hover:bg-[#b94826]/15 transition-colors">
                        <d.icon className="w-5 h-5 text-[#680318] group-hover:text-[#b94826] transition-colors" />
                      </div>
                      <div className="font-serif text-base font-bold text-[#680318] leading-tight">{d.t}</div>
                      <div className="text-xs text-[#680318]/65 mt-1">{d.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal-blur" style={{ transitionDelay: "880ms" }}>
              <SectionCTA
                label="Start Research"
                primaryHref={RESEARCH}
                eventName="cta_start_research_click"
                location="research_section"
              />
            </div>
            <div className="reveal-up mt-5 flex flex-col gap-y-3" style={{ transitionDelay: "1000ms" }}>
              <button
                type="button"
                onClick={() => {
                  track("cta_start_research_click", { location: "research_to_testimonials" });
                  history.replaceState(null, "", "#testimonials-research");
                  window.dispatchEvent(new HashChangeEvent("hashchange"));
                  document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="group inline-flex items-center gap-2 text-sm font-medium text-[#680318] hover:text-[#b94826] transition-colors"
              >
                <Quote className="w-4 h-4 text-[#b94826]" />
                Read research testimonials
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
              <button
                type="button"
                onClick={() => {
                  track("faq_toggle", { question: "research_faq_deeplink", opened: true });
                  history.replaceState(null, "", "#faq-research");
                  window.dispatchEvent(new HashChangeEvent("hashchange"));
                  document.getElementById("faq")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="group inline-flex items-center gap-2 text-sm font-medium text-[#680318] hover:text-[#b94826] transition-colors"
              >
                <Plus className="w-4 h-4 text-[#b94826]" />
                Research FAQs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>
          <ParallaxHeroImage src={researchImg} alt="Legal research" />
        </div>

        <ResearchFeatures />
      </div>
    </section>
  );
}

/* ============================================================
   Research features — interactive index + preview
   ============================================================ */
function ResearchFeatures() {
  const [active, setActive] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpand = (i: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const items = [
    {
      n: "01",
      icon: Layers,
      t: "Case Hub",
      d: "All your matters in one organised workspace.",
      dd: "Case Hub is your central command for every matter you handle. Research threads, documents uploaded, and pleadings drafted are all pinned to their respective case — so nothing gets lost, nothing gets mixed up, and every matter stays exactly where you expect it.",
      visual: (
        <div className="space-y-2">
          {[
            { name: "Sharma v. State of Tamil Nadu", meta: "3 threads · 12 authorities", status: "Active" },
            { name: "Lakshmi Estate — title trace",  meta: "1 thread · 4 authorities",   status: "Active" },
            { name: "ABC Ltd. v. Banking Ombudsman", meta: "5 threads · 19 authorities", status: "Closed" },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg border border-[#680318]/10 bg-[#fff0df]/40">
              <div className="w-8 h-8 rounded-md grid place-items-center bg-[#680318]/10">
                <Layers className="w-4 h-4 text-[#680318]" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="font-serif text-sm font-bold text-[#680318] truncate">{m.name}</div>
                <div className="text-[11px] text-[#680318]/55 mt-0.5">{m.meta}</div>
              </div>
              <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                m.status === "Active"
                  ? "border-[#b94826]/30 bg-[#b94826]/10 text-[#b94826]"
                  : "border-[#680318]/20 bg-[#680318]/5 text-[#680318]/60"
              }`}>{m.status}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      n: "02",
      icon: Search,
      t: "Multiple Research Sessions",
      d: "All research threads for a case pinned together — hassle-free legal research, always in context.",
      dd: "Every research thread you open for a matter is automatically pinned to that case. No hunting across sessions or retracing your steps — all threads for one case live together, so your research stays coherent from the first query to the last.",
      visual: (
        <div className="space-y-4">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#680318]/55">Case · Sharma v. State of Tamil Nadu</div>
          <div className="space-y-2">
            {[
              { q: "section 302 IPC culpable homicide",       n: "14 results" },
              { q: "circumstantial evidence last seen theory", n: "8 results"  },
              { q: "discovery under section 27 Evidence Act",  n: "6 results"  },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md border border-[#680318]/10 bg-[#fff0df]/30">
                <span className="text-xs text-[#680318]/70 flex-1 truncate">{s.q}</span>
                <span className="text-[10px] text-[#680318]/55">{s.n}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      n: "03",
      icon: PenTool,
      t: "Drafting Integrated",
      d: "Move from legal research to pleading draft in one platform — no tool switching, no lost context.",
      dd: "Drafting is built into the same workspace as your research. When you are ready to move from finding the law to filing the argument, the transition is a single step — no exports, no copy-paste, no switching between platforms.",
      visual: (
        <div className="space-y-4">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#680318]/55">Draft · Bail application ¶ 4</div>
          <div className="rounded-lg border border-[#680318]/10 bg-[#fff0df]/40 p-5 font-serif text-[15px] leading-relaxed text-[#680318]/90">
            …the applicant places reliance on the principle laid down in{" "}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#b94826]/15 border border-[#b94826]/30 text-[#b94826] not-italic text-[12px] font-sans">
              <Bookmark className="w-3 h-3" /> Arnesh Kumar v. State of Bihar, (2014) 8 SCC 273, ¶ 7
            </span>{" "}
            wherein the Hon&apos;ble Court held that arrest is not mandatory…
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#680318]/60">
            <span className="inline-flex items-center gap-1.5"><PenTool className="w-3 h-3" /> One-click insert from research</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-[#b94826]" /> Citation formatted</span>
          </div>
        </div>
      ),
    },
    {
      n: "04",
      icon: Bookmark,
      t: "Research History in Case Hub",
      d: "Your complete legal research history — preserved, organised, and searchable across every matter.",
      dd: "Your entire research history across all matters is preserved inside Lexram and remains fully searchable. Return to any case, any thread, or any prior research session at any point — nothing is lost when a matter goes dormant or resumes.",
      visual: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#680318]/15 bg-[#fff0df]/40 min-w-0">
            <Search className="w-4 h-4 text-[#680318]/60 shrink-0" />
            <span className="flex-1 min-w-0 text-sm text-[#680318]/80 font-light truncate">section 138 NI Act bounce defence</span>
            <span className="shrink-0 text-[10px] tracking-wider uppercase text-[#680318]/45">history</span>
          </div>
          <div className="space-y-3">
            {[
              { day: "Today",     items: [{ time: "14:32", q: "section 138 NI Act bounce defence", n: "12 results" }] },
              { day: "Yesterday", items: [
                { time: "18:01", q: "Kesavananda basic structure ratio",      n: "8 results" },
                { time: "09:45", q: "specific performance limitation period", n: "4 results" },
              ]},
            ].map((g) => (
              <div key={g.day}>
                <div className="text-[10px] tracking-[0.25em] uppercase text-[#b94826] mb-2">{g.day}</div>
                <div className="space-y-1.5">
                  {g.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md border border-[#680318]/10 bg-[#fff0df]/30 hover:border-[#b94826]/40 transition-colors">
                      <span className="text-[11px] font-mono text-[#680318]/55 w-10">{it.time}</span>
                      <span className="flex-1 text-sm text-[#680318]/80 truncate">{it.q}</span>
                      <span className="text-[10px] text-[#680318]/55">{it.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      n: "05",
      icon: Mic,
      t: "Speech to Text",
      d: "Voice-powered legal research — speak your query, Lexram transcribes and returns relevant answers instantly.",
      dd: "Speak your research query directly into the search bar — Lexram listens, transcribes it accurately, and returns relevant legal answers immediately. No typing required, no reformulation needed — your question is heard and acted on exactly as you asked it.",
      visual: (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#680318]/10 bg-[#fff0df]/40 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#b94826]/15 grid place-items-center mx-auto mb-3 animate-pulse">
              <Mic className="w-6 h-6 text-[#b94826]" />
            </div>
            <div className="text-sm font-medium text-[#680318]">Listening…</div>
            <div className="mt-3 text-sm text-[#680318]/80 font-serif italic">
              &ldquo;section 138 NI Act bounce defence limitation period&rdquo;
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#680318]/55">
              <CheckCircle2 className="w-3 h-3 text-[#b94826]" />
              Voice transcribed — searching now
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-10 overflow-hidden">
      <div className="mb-10">
        <div className="reveal-down flex items-center gap-3 mb-3">
          <div className="text-xs font-bold tracking-[0.3em] uppercase text-[#680318]/90" style={{ textShadow: '0 1px 6px rgba(104,3,24,0.35)' }}>Features</div>
          <div className="h-px flex-1 bg-gradient-to-r from-[#680318]/20 to-transparent" />
          <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#b94826]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b94826] animate-pulse" />
            5 capabilities
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.25fr] gap-10 lg:gap-16 items-stretch w-full min-w-0">
        {/* Left: numbered index */}
        <div className="lg:sticky lg:top-24 min-w-0 overflow-hidden w-full">
          {items.map((item, i) => {
            const isActive = active === i;
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`reveal-left group relative w-full max-w-full min-w-0 text-left flex items-start gap-3 py-5 border-b border-[#680318]/10 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-[#680318]/[0.04] shadow-[0_6px_24px_-4px_rgba(185,72,38,0.18),0_2px_8px_rgba(104,3,24,0.08)] -translate-y-0.5 px-3"
                    : "hover:bg-[#680318]/[0.025] hover:shadow-[0_4px_18px_-4px_rgba(104,3,24,0.14),0_1px_4px_rgba(104,3,24,0.05)] hover:-translate-y-0.5 hover:px-3"
                }`}
                style={{ transitionDelay: `${200 + i * 110}ms` }}
              >
                <span
                  aria-hidden
                  key={`mark-${i}-${isActive}`}
                  className={`absolute left-0 top-7 h-7 w-[3px] rounded-r transition-all ${
                    isActive ? "bg-[#b94826] cap-mark" : "bg-transparent"
                  }`}
                />
                <div className={`w-10 h-10 rounded-lg grid place-items-center border shrink-0 transition-colors ${
                  isActive
                    ? "bg-[#b94826]/15 border-[#b94826]/40"
                    : "bg-[#680318]/10 border-[#680318]/15"
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-[#b94826]" : "text-[#680318]"}`} />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className={`font-serif text-lg sm:text-xl md:text-2xl font-bold transition-colors break-words ${isActive ? "text-[#b94826]" : "text-[#680318]"}`}>
                    {item.t}
                  </div>
                  <div className="text-sm leading-relaxed text-[#680318]/70 mt-2 break-words">
                    {item.d}
                  </div>
                  {expandedItems.has(i) && (
                    <div className="mt-3 text-sm leading-relaxed text-[#680318]/55 animate-in fade-in slide-in-from-top-1 duration-300 break-words">
                      {item.dd}
                    </div>
                  )}
                  <div
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); toggleExpand(i); }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#b94826] hover:text-[#680318] transition-colors cursor-pointer"
                  >
                    {expandedItems.has(i) ? (
                      <>Show less <Minus className="w-3 h-3" /></>
                    ) : (
                      <>More <Plus className="w-3 h-3" /></>
                    )}
                  </div>
                </div>
                <ArrowRight
                  className={`w-4 h-4 mt-2 text-[#b94826] transition-all shrink-0 ${
                    isActive ? "translate-x-1 opacity-100" : "opacity-40"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Right: live preview — stretches to match the feature list height */}
        <div className="reveal-up relative flex flex-col min-w-0 w-full" style={{ transitionDelay: "260ms" }}>
          <div aria-hidden className="absolute inset-0 bg-gradient-warm opacity-20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative flex flex-col flex-1 rounded-2xl border border-[#680318]/15 bg-[#fff0df] shadow-elegant overflow-hidden min-h-[440px] w-full">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#680318]/10 bg-[#680318]/[0.03] shrink-0 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#b94826]/60 shrink-0" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#680318]/15 shrink-0" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#680318]/15 shrink-0" />
              <div key={`label-${active}`} className="swap-label ml-auto text-[10px] tracking-[0.2em] text-[#680318]/55 uppercase truncate min-w-0">
                {items[active].n} · {items[active].t}
              </div>
            </div>
            <div key={active} className="swap-in p-4 sm:p-6 md:p-8 flex-1 overflow-hidden min-w-0">
              {items[active].visual}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Lexram Edge — left-side numbered feature list + right-side
   image that swaps when the user clicks a feature.
   ============================================================ */
type EdgeFeature = {
  n: string;
  t: string;
  d: string;
  dd: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
};

function LexramEdge() {
  const [expandedEdge, setExpandedEdge] = useState<Set<number>>(new Set());
  const toggleEdgeExpand = (i: number) => {
    setExpandedEdge((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const features: EdgeFeature[] = [
    { n: "01", t: "Statute to Precedent",      d: "Research Indian law the way courts reason — statute first, precedent second.",                                         dd: "Lexram anchors every research query in the governing statute before surfacing precedents. You understand why a ruling exists, not just what was decided — giving you the interpretive context advocates actually need.",                                                                                                                                         icon: BookOpen,    image: "/landing/library.jpg"    },
    { n: "02", t: "Per Incuriam Test",          d: "Cite only good law — Lexram screens out overruled and per incuriam judgments automatically.",                          dd: "Before a precedent reaches you, Lexram applies a per incuriam test to eliminate decisions that courts ignored as binding authority. Every result you see is law you can stand behind.",                                                                                                                                                                            icon: Shield,      image: "/landing/papers.jpg"     },
    { n: "03", t: "Precedent History",          d: "The full Supreme Court precedent trail — followed, distinguished, and shaped — in a single view.",                    dd: "Advocates get a complete, chronological view of how Supreme Court rulings have followed, distinguished, or evolved a legal position. No more piecing together a case history across multiple searches — Lexram delivers the entire trail at once.",                                                                                                                          icon: TrendingUp,  image: "/landing/courthouse.jpg" },
    { n: "04", t: "Zero Hallucination Legal AI", d: "Every answer is anchored to a real document you can open and verify. No fake citations, no hallucinations.",         dd: "No fake citations, no AI guesswork — every Lexram result links to a verifiable source i.e. statutes and SUPREME COURT judgements. Every answer Lexram generates is tied to an actual document you can open and read. All citations are real, all references are verifiable — so you can rely on your research output with full professional confidence.",                                                                                                                                                                                                                                                                                         icon: CheckCircle2, image: "/landing/lawbook.jpg"   },
    { n: "05", t: "Trained on India's Courts",  d: "AI legal research built exclusively on verified Indian legal sources — not the open web.",                            dd: "Lexram's database is built entirely from verified Indian legal sources — not the internet at large. Every answer is grounded in the actual law of Indian courts, filtered free of noise, so your research reflects India's legal reality, not generic AI output.",                                                                                                               icon: Sparkles,    image: "/landing/pen.jpg"        },
    { n: "06", t: "Free Trial Available",       d: "Start with a free trial — no credit card required.",                                                                  dd: "Get full access to Lexram research capabilities with a free trial. Explore Supreme Court judgements, statutes, and AI-assisted research before committing to a plan.",                                                                                                                                                                                                    icon: Star,        image: "/landing/chamber.jpg"    },
  ];

  const [active, setActive] = useState(0);

  return (
    <section id="lexram-edge" className="relative py-10 md:py-12 overflow-hidden bg-[#fff0df]">
      <div aria-hidden className="absolute top-1/4 -left-32 w-[520px] h-[520px] bg-[#b94826] opacity-10 blur-[160px] rounded-full pointer-events-none lex-float" />
      <div aria-hidden className="absolute bottom-0 -right-32 w-[520px] h-[520px] bg-[#b94826] opacity-[0.08] blur-[180px] rounded-full pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-6 sm:px-10 text-[#680318]">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold tracking-[0.3em] uppercase text-[#680318]/90" style={{ textShadow: '0 1px 6px rgba(104,3,24,0.35)' }}>Lexram Edge</div>
            <div className="h-px flex-1 bg-gradient-to-r from-[#680318]/20 to-transparent" />
            <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#b94826]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b94826] animate-pulse" />
              6 features
            </div>
          </div>
        </div>

        {/* Left: clickable feature list — Right: image that swaps */}
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-stretch w-full">
          {/* Feature list */}
          <div>
            {features.map((f, i) => {
              const isActive = active === i;
              const Icon = f.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  className={`relative w-full max-w-full text-left flex items-start gap-4 px-3 py-5 border-b border-[#680318]/10 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-[#680318]/[0.04] shadow-[0_6px_24px_-4px_rgba(185,72,38,0.18),0_2px_8px_rgba(104,3,24,0.08)] -translate-y-0.5"
                      : "opacity-80 hover:opacity-100 hover:bg-[#680318]/[0.025] hover:shadow-[0_4px_18px_-4px_rgba(104,3,24,0.14),0_1px_4px_rgba(104,3,24,0.05)] hover:-translate-y-0.5"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute left-0 top-6 h-7 w-[3px] rounded-r transition-all ${
                      isActive ? "bg-[#b94826]" : "bg-transparent"
                    }`}
                  />
                  <div className={`w-10 h-10 rounded-lg grid place-items-center border shrink-0 transition-colors ${
                    isActive
                      ? "bg-[#b94826]/15 border-[#b94826]/40"
                      : "bg-[#680318]/10 border-[#680318]/15"
                  }`}>
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-[#b94826]" : "text-[#680318]"}`} />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className={`font-serif text-xl md:text-2xl font-bold leading-tight transition-colors ${
                      isActive ? "text-[#b94826]" : "text-[#680318]"
                    }`}>
                      {f.t}
                    </div>
                    <div className="text-sm leading-relaxed text-[#680318]/70 mt-2">
                      {f.d}
                    </div>
                    {expandedEdge.has(i) && (
                      <div className="mt-3 text-sm leading-relaxed text-[#680318]/55 animate-in fade-in slide-in-from-top-1 duration-300">
                        {f.dd}
                      </div>
                    )}
                    <div
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => { e.stopPropagation(); toggleEdgeExpand(i); }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#b94826] hover:text-[#680318] transition-colors cursor-pointer"
                    >
                      {expandedEdge.has(i) ? (
                        <>Show less <Minus className="w-3 h-3" /></>
                      ) : (
                        <>More <Plus className="w-3 h-3" /></>
                      )}
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 mt-2 text-[#b94826] transition-all shrink-0 ${
                      isActive ? "translate-x-1 opacity-100" : "opacity-30"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right column — image fills full column height */}
          <div className="relative flex flex-col gap-5">
            <div className="relative flex flex-col flex-1">
              <div aria-hidden className="absolute -inset-6 bg-gradient-warm opacity-25 blur-3xl rounded-full pointer-events-none" />
              <div className="relative flex-1 rounded-2xl overflow-hidden shadow-elegant bg-[#680318]/10 min-h-[320px]">
                {features.map((f, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={f.image}
                    src={f.image}
                    alt={f.t}
                    loading={i === 0 ? "eager" : "lazy"}
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-out ${
                      i === active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                {/* caption strip overlay on the image */}
                <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-[#680318]/85 via-[#680318]/45 to-transparent px-6 py-5 text-[#fff0df]">
                  <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-[#b94826]">
                    <span className="font-mono">{features[active].n}</span>
                    <span className="w-px h-3 bg-[#fff0df]/30" />
                    <span>Lexram Edge</span>
                  </div>
                  <div className="font-serif text-xl md:text-2xl font-bold mt-1">
                    {features[active].t}
                  </div>
                </div>
              </div>
            </div>

            {/* Position indicator + dot progress + nav arrows */}
            <div className="relative flex items-center gap-4 rounded-2xl border border-[#680318]/12 bg-[#fff0df] shadow-soft p-4">
              <button
                type="button"
                aria-label="Previous feature"
                onClick={() => setActive((i) => (i - 1 + features.length) % features.length)}
                className="w-9 h-9 rounded-lg border border-[#680318]/15 grid place-items-center text-[#680318] hover:border-[#b94826] hover:text-[#b94826] transition"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  {features.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to feature ${i + 1}`}
                      onClick={() => setActive(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === active ? "w-8 bg-[#b94826]" : "w-2 bg-[#680318]/20 hover:bg-[#680318]/40"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-2 text-[10px] tracking-[0.25em] uppercase text-[#680318]/60">
                  Feature {features[active].n} of {String(features.length).padStart(2, "0")}
                </div>
              </div>
              <button
                type="button"
                aria-label="Next feature"
                onClick={() => setActive((i) => (i + 1) % features.length)}
                className="w-9 h-9 rounded-lg border border-[#680318]/15 grid place-items-center text-[#680318] hover:border-[#b94826] hover:text-[#b94826] transition"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Drafting — mirrors the Research section design (light bg, 2-col
   hero + database grid + SectionCTA + DraftingCapabilities below).
   ============================================================ */
function Drafting() {
  useReveal();
  return (
    <section id="drafting" className="py-10 md:py-12 bg-[#680318] text-[#fff0df] relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(185,72,38,0.25),transparent_60%)]" />
      <div className="relative max-w-[1440px] mx-auto px-6 sm:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="lex-kicker--bright text-xs tracking-[0.3em] text-[#b94826] mb-4">LEXDRAFT — AI LEGAL DRAFTING ASSISTANT</div>
            <h2 className="reveal-up font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#fff0df] leading-tight" style={{ transitionDelay: "120ms" }}>
              The first draft is <span className="italic text-[#b94826]">&ldquo;already&rdquo;</span> done.
            </h2>
            <p className="reveal-up mt-6 text-lg text-[#fff0df]/80 leading-relaxed" style={{ transitionDelay: "240ms" }}>
              Upload your documents. Tell Lexram what petition you need — anticipatory bail, writ under Article 226, legal notice, etc. Every draft is backed by a real Supreme Court Judgements and statutes.
            </p>
            <div className="mt-8">
              <div className="reveal-down flex items-center gap-3 mb-4" style={{ transitionDelay: "360ms" }}>
                <div className="text-xs font-bold tracking-[0.3em] uppercase text-[#fff0df]/95" style={{ textShadow: '0 1px 6px rgba(255,240,223,0.4)' }}>
                  Database
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#fff0df]/30 to-transparent" />
                <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#b94826]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b94826] animate-pulse" />
                  Verified sources
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { t: "SC Judgements",   s: "Since 1950 · refreshed daily",        icon: Gavel },
                  { t: "Central Statutes", s: "BNS / IPC · BNSS / CrPC · BSA / IEA", icon: Scale },
                ].map((d, i) => (
                  <div
                    key={d.t}
                    className="reveal-zoom group relative rounded-xl border border-[#fff0df]/12 bg-[#fff0df]/[0.05] backdrop-blur-sm p-5 hover:border-[#b94826]/60 hover:-translate-y-0.5 overflow-hidden"
                    style={{ transitionDelay: `${440 + i * 120}ms` }}
                  >
                    <div aria-hidden className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-[#b94826]/0 group-hover:bg-[#b94826]/20 blur-2xl transition-all duration-500" />
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#b94826]/20 border border-[#b94826]/30 mb-3 group-hover:bg-[#b94826]/30 transition-colors">
                        <d.icon className="w-5 h-5 text-[#b94826]" />
                      </div>
                      <div className="font-serif text-base font-bold text-[#fff0df] leading-tight">{d.t}</div>
                      <div className="text-xs text-[#fff0df]/65 mt-1">{d.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal-blur" style={{ transitionDelay: "880ms" }}>
              <SectionCTA
                label="Start Drafting"
                tone="dark"
                primaryHref={`${RESEARCH}?mode=draft`}
                eventName="cta_start_research_click"
                location="drafting_section"
              />
            </div>
            <div className="reveal-up mt-5 flex flex-col gap-y-3" style={{ transitionDelay: "1000ms" }}>
              <button
                type="button"
                onClick={() => {
                  track("cta_start_research_click", { location: "drafting_to_testimonials" });
                  history.replaceState(null, "", "#testimonials-drafting");
                  window.dispatchEvent(new HashChangeEvent("hashchange"));
                  document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="group inline-flex items-center gap-2 text-sm font-medium text-[#fff0df] hover:text-[#b94826] transition-colors"
              >
                <Quote className="w-4 h-4 text-[#b94826]" />
                Read drafting testimonials
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
              <button
                type="button"
                onClick={() => {
                  track("faq_toggle", { question: "drafting_faq_deeplink", opened: true });
                  history.replaceState(null, "", "#faq-drafting");
                  window.dispatchEvent(new HashChangeEvent("hashchange"));
                  document.getElementById("faq")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="group inline-flex items-center gap-2 text-sm font-medium text-[#fff0df] hover:text-[#b94826] transition-colors"
              >
                <Plus className="w-4 h-4 text-[#b94826]" />
                Drafting FAQs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>
          <ParallaxHeroImage src={draftingImg} alt="Legal drafting" tone="dark" />
        </div>

        <DraftingCapabilities />
      </div>
    </section>
  );
}

/* ============================================================
   Drafting capabilities — same interactive index + preview shell
   as ResearchCapabilities, but with drafting-specific items.
   ============================================================ */
function DraftingCapabilities() {
  const [active, setActive] = useState(0);
  const [expandedDraft, setExpandedDraft] = useState<Set<number>>(new Set());
  const toggleDraftExpand = (i: number) => {
    setExpandedDraft((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const items = [
    {
      n: "01",
      icon: FileText,
      t: "Multi-document Upload",
      d: "Upload multiple legal documents — Lexram reads across all of them and drafts one coherent response.",
      dd: "Upload your entire document set at once. Lexram reads across every file simultaneously and builds a single, coherent response that draws from the full bundle — not just the document you opened last. No manual collation, no missed context.",
      visual: (
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-[#680318]/25 bg-[#fff0df]/30 p-6 text-center">
            <FileText className="w-6 h-6 text-[#680318]/60 mx-auto" />
            <div className="text-sm font-medium text-[#680318] mt-2">Drop the entire case file</div>
            <div className="text-[11px] text-[#680318]/55 mt-1">PDFs · scans · charge sheets · prior orders</div>
          </div>
          <div className="space-y-2">
            {[
              { name: "complaint_bundle.pdf", meta: "84 pages",  state: "Indexed",  pct: 100 },
              { name: "annexures.zip",        meta: "7 files",    state: "Indexing", pct: 62 },
              { name: "fir_chennai.jpg",      meta: "Scan · OCR", state: "OCR'd",    pct: 100 },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md border border-[#680318]/10 bg-[#fff0df]/40">
                <FileText className="w-4 h-4 text-[#680318]/70 shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-[13px] text-[#680318] font-medium truncate">{f.name}</div>
                  <div className="text-[10px] text-[#680318]/55">{f.meta}</div>
                </div>
                {f.pct < 100 ? (
                  <div className="w-20 h-1.5 rounded-full bg-[#680318]/10 overflow-hidden">
                    <div className="h-full bg-[#b94826]" style={{ width: `${f.pct}%` }} />
                  </div>
                ) : (
                  <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#b94826]/15 text-[#b94826] border border-[#b94826]/30">{f.state}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      n: "02",
      icon: FileSearch,
      t: "Scan to Draft",
      d: "Lexram indexes it and maps Who, What, When, and Which from it — scan physical legal documents and drafts a structured response instantly.",
      dd: "Scan a physical document and Lexram takes it from there. It maps every key element: parties, sections, citations, and events. The extracted facts are structured exactly as the responding court or forum expects them, so your draft is organised correctly from the ground up, every time.",
      visual: (
        <div className="space-y-4">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#680318]/55">Scanned input → indexed → draft</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#680318]/15 bg-[#fff0df]/50 p-4">
              <div className="w-9 h-9 rounded-md bg-[#680318]/10 grid place-items-center mb-2">
                <FileSearch className="w-4 h-4 text-[#680318]" />
              </div>
              <div className="text-[11px] font-bold text-[#680318]">Scanned</div>
              <div className="text-[10px] text-[#680318]/55">PDF · JPG · TIFF</div>
            </div>
            <div className="rounded-lg border border-[#680318]/15 bg-[#fff0df]/50 p-4">
              <div className="w-9 h-9 rounded-md bg-[#b94826]/15 grid place-items-center mb-2">
                <FileSearch className="w-4 h-4 text-[#b94826]" />
              </div>
              <div className="text-[11px] font-bold text-[#680318]">OCR + Indexed</div>
              <div className="text-[10px] text-[#680318]/55">Searchable text</div>
            </div>
            <div className="rounded-lg border border-[#b94826]/40 bg-[#b94826]/10 p-4">
              <div className="w-9 h-9 rounded-md bg-[#b94826] grid place-items-center mb-2">
                <PenTool className="w-4 h-4 text-[#fff0df]" />
              </div>
              <div className="text-[11px] font-bold text-[#680318]">Draft built</div>
              <div className="text-[10px] text-[#680318]/55">Ready to edit</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      n: "03",
      icon: Layers,
      t: "Draft Management",
      d: "Find every pleading draft under its case — no searching through individual research threads.",
      dd: "All pleadings and drafts created for a matter are collected directly inside that case, not scattered across individual research threads. When you need to retrieve or review a draft, you go to the case — and it is there.",
      visual: (
        <div className="space-y-3">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#680318]/55">Case · Sharma v. State of Tamil Nadu · Drafts</div>
          {[
            { name: "bail_application_v2.docx", date: "Jun 15, 2024", label: "Latest" },
            { name: "anticipatory_bail_v1.docx", date: "Jun 12, 2024", label: "Filed" },
            { name: "discharge_petition_v3.docx", date: "Jun 08, 2024", label: "Draft" },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md border border-[#680318]/10 bg-[#fff0df]/30">
              <FileText className="w-4 h-4 text-[#680318]/60 shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-[13px] text-[#680318] font-medium truncate">{d.name}</div>
                <div className="text-[10px] text-[#680318]/55">{d.date}</div>
              </div>
              <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#b94826]/10 text-[#b94826] border border-[#b94826]/20">{d.label}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      n: "04",
      icon: Download,
      t: "Response Document Builder",
      d: "AI legal response drafting structured to the format of the responding Indian court or forum.",
      dd: "Every response document Lexram builds follows the structure the specific court or forum requires. Format, sequence, and presentation are aligned to what the tribunal expects — so you are not reformatting after drafting, you are filing from it.",
      visual: (
        <div className="space-y-4">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#680318]/55">Draft plan · Anticipatory bail u/s 482 BNSS</div>
          <ol className="space-y-2">
            {[
              "Title, parties and jurisdiction",
              "Statement of facts (8 paragraphs)",
              "Grounds for anticipatory bail",
              "Reliance on Arnesh Kumar v. State of Bihar",
              "Prior history & undertaking",
              "Prayer & verification",
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-[#680318]/10 bg-[#fff0df]/40">
                <span className="w-6 h-6 rounded-md grid place-items-center bg-[#b94826]/15 text-[11px] font-mono text-[#b94826] shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm text-[#680318]">{step}</span>
                <CheckCircle2 className="w-4 h-4 text-[#b94826]" />
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    {
      n: "05",
      icon: PenTool,
      t: "Edit at 2 Stages",
      d: "Edit the draft plan before writing begins and the final draft after — full advocate control at every stage.",
      dd: "Lexram gives you two distinct points of control — the draft plan before any clause is written, and the final draft once it is generated. Both are fully editable, so you can shape the argument at the structural level and refine it at the language level.",
      visual: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { stage: "Stage 1 · Plan",  body: "Outline + headings + cited authorities. Approve the structure first.",  pct: 100 },
              { stage: "Stage 2 · Draft", body: "Full prose, formatted, citations linked. Final edits before export.", pct: 70 },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border border-[#680318]/15 bg-[#fff0df]/50 p-4">
                <div className="text-[10px] tracking-[0.22em] uppercase text-[#b94826] mb-2">{s.stage}</div>
                <div className="text-sm text-[#680318]/85 leading-snug">{s.body}</div>
                <div className="mt-3 h-1.5 rounded-full bg-[#680318]/10 overflow-hidden">
                  <div className="h-full bg-[#b94826]" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#680318]/60">
            <span className="inline-flex items-center gap-1.5"><PenTool className="w-3 h-3" /> Inline editor at both stages</span>
            <span className="inline-flex items-center gap-1.5"><Download className="w-3 h-3 text-[#b94826]" /> Export as .docx</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-10">
      <div className="mb-8">
        <div className="reveal-down flex items-center gap-3 mb-3">
          <div className="text-xs font-bold tracking-[0.3em] uppercase text-[#fff0df]/95" style={{ textShadow: '0 1px 6px rgba(255,240,223,0.4)' }}>Features</div>
          <div className="h-px flex-1 bg-gradient-to-r from-[#fff0df]/20 to-transparent" />
          <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#b94826]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b94826] animate-pulse" />
            5 capabilities
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.25fr] gap-10 lg:gap-16 items-stretch w-full">
        {/* Left: numbered index */}
        <div className="lg:sticky lg:top-24 min-w-0 overflow-hidden">
          {items.map((item, i) => {
            const isActive = active === i;
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`reveal-left group relative w-full max-w-full text-left flex items-start gap-4 py-6 border-b border-[#fff0df]/12 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-[#fff0df]/[0.06] shadow-[0_6px_24px_-4px_rgba(185,72,38,0.25),0_2px_8px_rgba(0,0,0,0.15)] -translate-y-0.5 px-3"
                    : "hover:bg-[#fff0df]/[0.04] hover:shadow-[0_4px_18px_-4px_rgba(185,72,38,0.18),0_1px_4px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 hover:px-3"
                }`}
                style={{ transitionDelay: `${200 + i * 110}ms` }}
              >
                <span
                  aria-hidden
                  key={`mark-${i}-${isActive}`}
                  className={`absolute left-0 top-7 h-7 w-[3px] rounded-r transition-all ${
                    isActive ? "bg-[#b94826] cap-mark" : "bg-transparent"
                  }`}
                />
                <div className={`w-10 h-10 rounded-lg grid place-items-center border shrink-0 transition-colors ${
                  isActive
                    ? "bg-[#b94826]/25 border-[#b94826]/50"
                    : "bg-[#fff0df]/[0.06] border-[#fff0df]/15"
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-[#b94826]" : "text-[#fff0df]"}`} />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className={`font-serif text-lg sm:text-xl md:text-2xl font-bold transition-colors break-words ${isActive ? "text-[#b94826]" : "text-[#fff0df]"}`}>
                    {item.t}
                  </div>
                  <div className="text-sm leading-relaxed text-[#fff0df]/70 mt-2 break-words">
                    {item.d}
                  </div>
                  {expandedDraft.has(i) && (
                    <div className="mt-3 text-sm leading-relaxed text-[#fff0df]/50 animate-in fade-in slide-in-from-top-1 duration-300 break-words">
                      {item.dd}
                    </div>
                  )}
                  <div
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); toggleDraftExpand(i); }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#b94826] hover:text-[#fff0df] transition-colors cursor-pointer"
                  >
                    {expandedDraft.has(i) ? (
                      <>Show less <Minus className="w-3 h-3" /></>
                    ) : (
                      <>More <Plus className="w-3 h-3" /></>
                    )}
                  </div>
                </div>
                <ArrowRight
                  className={`w-4 h-4 mt-2 text-[#b94826] transition-all shrink-0 ${
                    isActive ? "translate-x-1 opacity-100" : "opacity-40"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Right: live preview — stretches to match feature list height */}
        <div className="reveal-tilt relative flex flex-col" style={{ transitionDelay: "260ms" }}>
          <div aria-hidden className="absolute -inset-8 bg-[#b94826] opacity-25 blur-3xl rounded-full pointer-events-none" />
          <div className="relative flex flex-col flex-1 rounded-2xl border border-[#fff0df]/15 bg-[#fff0df] shadow-elegant overflow-hidden min-h-[440px]">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#680318]/10 bg-[#680318]/[0.03] shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#b94826]/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#680318]/15" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#680318]/15" />
              <div key={`label-${active}`} className="swap-label ml-auto text-[10px] tracking-[0.2em] text-[#680318]/55 uppercase">
                {items[active].n} · {items[active].t}
              </div>
            </div>
            <div key={active} className="swap-in p-6 md:p-8 flex-1">
              {items[active].visual}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LexDraft Edge — zigzag split rows on a deep backdrop
   ============================================================ */
type DraftEdge = {
  n: string;
  t: string;
  d: string;
  dd: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
};

function LexDraftEdge() {
  const [expandedLD, setExpandedLD] = useState<Set<number>>(new Set());
  const toggleLDExpand = (i: number) => {
    setExpandedLD((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const features: DraftEdge[] = [
    { n: "01", t: "Research and Drafting in One Platform", d: "From legal research to courtroom draft — no copy-paste, no context lost, no platform switch.", dd: "Lexram connects research and drafting in a single, unbroken workflow. What you find during research flows directly into what you file — so there is no gap between the law you identify and the argument you make.", icon: Layers, image: "/landing/research-img.jpg" },
    { n: "02", t: "Zero Assumptions", d: "AI legal drafting built only from your uploaded documents — no assumptions, nothing invented.", dd: "Lexram drafts exclusively from the documents you upload. It does not fill gaps with guesses or infer facts you have not provided. Every line of the draft traces back to something you gave it — nothing assumed, nothing invented.", icon: Shield, image: "/landing/lawbook.jpg" },
    { n: "03", t: "Structures Before It Writes", d: "Review and approve the full draft structure before a single clause is written.", dd: "Before any clause is drafted, Lexram presents the complete structural plan for your document. You can review, edit, and approve the outline — so you stay in control of the argument architecture before drafting begins.", icon: FileText, image: "/landing/papers.jpg" },
    { n: "04", t: "Upload Your Entire Case File", d: "Upload your full case bundle — Lexram reads every document and drafts the complete picture.", dd: "Lexram does not skim. It reads across your entire uploaded case bundle — every FIR, chargesheet, order, and exhibit — and builds a draft that addresses the full factual and legal picture, not just the document you happened to open last.", icon: Download, image: "/landing/library.jpg" },
    { n: "05", t: "No Fake Citations. No Invented Sections. Every Source Verifiable.", d: "Every judgement and section in your draft traces back to a real, openable source — no hallucinations, no fabrications, no inventions.", dd: "Every case citation and section in your draft is real, openable, and verifiable Supreme Court judgements and Central statutes. Every judgment and section cited in your draft links back to Supreme Court judgements and Central statutes. No hallucinated case names, no fabricated section references – zero hallucinated Supreme Court judgements and sections.", icon: CheckCircle2, image: "/landing/courthouse.jpg" },
    { n: "06", t: "Free Trial Available", d: "Try AI legal drafting with a free trial — no credit card required.", dd: "Get full access to Lexram drafting capabilities with a free trial. Generate your first court-ready draft from your documents before committing to a plan.", icon: Star, image: "/landing/chamber.jpg" },
  ];

  const [active, setActive] = useState(0);

  return (
    <section id="lexdraft-edge" className="relative py-10 md:py-12 overflow-hidden bg-[#680318] text-[#fff0df]">
      <div aria-hidden className="absolute top-1/4 -left-32 w-[520px] h-[520px] bg-[#b94826] opacity-20 blur-[160px] rounded-full pointer-events-none lex-float" />
      <div aria-hidden className="absolute bottom-0 -right-32 w-[520px] h-[520px] bg-[#b94826] opacity-[0.12] blur-[180px] rounded-full pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-6 sm:px-10">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold tracking-[0.3em] uppercase text-[#fff0df]/95" style={{ textShadow: '0 1px 6px rgba(255,240,223,0.4)' }}>Lexram Edge</div>
            <div className="h-px flex-1 bg-gradient-to-r from-[#fff0df]/20 to-transparent" />
            <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#b94826]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b94826] animate-pulse" />
              6 features
            </div>
          </div>
        </div>

        {/* Left: clickable feature list — Right: image that swaps */}
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-stretch w-full">
          {/* Feature list */}
          <div>
            {features.map((f, i) => {
              const isActive = active === i;
              const Icon = f.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  className={`relative w-full max-w-full text-left flex items-start gap-4 px-3 py-5 border-b border-[#fff0df]/12 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-[#fff0df]/[0.06] shadow-[0_6px_24px_-4px_rgba(185,72,38,0.25),0_2px_8px_rgba(0,0,0,0.15)] -translate-y-0.5"
                      : "opacity-80 hover:opacity-100 hover:bg-[#fff0df]/[0.04] hover:shadow-[0_4px_18px_-4px_rgba(185,72,38,0.18),0_1px_4px_rgba(0,0,0,0.10)] hover:-translate-y-0.5"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute left-0 top-6 h-7 w-[3px] rounded-r transition-all ${
                      isActive ? "bg-[#b94826]" : "bg-transparent"
                    }`}
                  />
                  <div className={`w-10 h-10 rounded-lg grid place-items-center border shrink-0 transition-colors ${
                    isActive
                      ? "bg-[#b94826]/25 border-[#b94826]/50"
                      : "bg-[#fff0df]/[0.08] border-[#fff0df]/15"
                  }`}>
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-[#b94826]" : "text-[#fff0df]"}`} />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className={`font-serif text-xl md:text-2xl font-bold leading-tight transition-colors ${
                      isActive ? "text-[#b94826]" : "text-[#fff0df]"
                    }`}>
                      {f.t}
                    </div>
                    <div className="text-sm leading-relaxed text-[#fff0df]/70 mt-2">
                      {f.d}
                    </div>
                    {expandedLD.has(i) && (
                      <div className="mt-3 text-sm leading-relaxed text-[#fff0df]/55 animate-in fade-in slide-in-from-top-1 duration-300">
                        {f.dd}
                      </div>
                    )}
                    <div
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => { e.stopPropagation(); toggleLDExpand(i); }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#b94826] hover:text-[#fff0df] transition-colors cursor-pointer"
                    >
                      {expandedLD.has(i) ? (
                        <>Show less <Minus className="w-3 h-3" /></>
                      ) : (
                        <>More <Plus className="w-3 h-3" /></>
                      )}
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 mt-2 text-[#b94826] transition-all shrink-0 ${
                      isActive ? "translate-x-1 opacity-100" : "opacity-40"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right column — image fills full column height */}
          <div className="relative flex flex-col gap-5">
            <div className="relative flex flex-col flex-1">
              <div aria-hidden className="absolute -inset-6 bg-[#b94826] opacity-20 blur-3xl rounded-full pointer-events-none" />
              <div className="relative flex-1 rounded-2xl overflow-hidden shadow-elegant bg-[#fff0df]/10 min-h-[320px]">
                {features.map((f, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={f.image}
                    src={f.image}
                    alt={f.t}
                    loading={i === 0 ? "eager" : "lazy"}
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-out ${
                      i === active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                {/* caption strip overlay on the image */}
                <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-[#680318]/85 via-[#680318]/45 to-transparent px-6 py-5 text-[#fff0df]">
                  <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-[#b94826]">
                    <span className="font-mono">{features[active].n}</span>
                    <span className="w-px h-3 bg-[#fff0df]/30" />
                    <span>Lexram Edge</span>
                  </div>
                  <div className="font-serif text-xl md:text-2xl font-bold mt-1">
                    {features[active].t}
                  </div>
                </div>
              </div>
            </div>

            {/* Position indicator + dot progress + nav arrows */}
            <div className="relative flex items-center gap-4 rounded-2xl border border-[#fff0df]/15 bg-[#fff0df]/[0.06] shadow-soft p-4">
              <button
                type="button"
                aria-label="Previous edge"
                onClick={() => setActive((i) => (i - 1 + features.length) % features.length)}
                className="w-9 h-9 rounded-lg border border-[#fff0df]/20 grid place-items-center text-[#fff0df] hover:border-[#b94826] hover:text-[#b94826] transition"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  {features.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to edge ${i + 1}`}
                      onClick={() => setActive(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === active ? "w-8 bg-[#b94826]" : "w-2 bg-[#fff0df]/20 hover:bg-[#fff0df]/40"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-2 text-[10px] tracking-[0.25em] uppercase text-[#fff0df]/60">
                  Edge {features[active].n} of {String(features.length).padStart(2, "0")}
                </div>
              </div>
              <button
                type="button"
                aria-label="Next edge"
                onClick={() => setActive((i) => (i + 1) % features.length)}
                className="w-9 h-9 rounded-lg border border-[#fff0df]/20 grid place-items-center text-[#fff0df] hover:border-[#b94826] hover:text-[#b94826] transition"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Resources
   ============================================================ */
function Resources() {
  useReveal();
  const features: Feature[] = [
    { icon: Library,   t: "Statute library",          d: "Every central statute, indexed and cross-referenced with case law.", detail: "Browse bare acts with section-level commentary, amendments timeline, and linked judicial interpretations." },
    { icon: BookOpen,  t: "Editorial commentary",     d: "Section-by-section notes by practising senior advocates.",            detail: "Concise, practitioner-written commentary — focused on how courts actually apply the section, not academic theory." },
    { icon: Download,  t: "Templates & checklists",   d: "Pleading templates, vakalatnamas, affidavits — all forum-ready.",     detail: "Download editable templates for every common filing across SC, HCs and district courts. Updated for current rules." },
    { icon: Bookmark,  t: "Saved authorities",        d: "Build your personal library of go-to judgements.",                    detail: "Pin, tag, and annotate judgements. Share collections privately with your chamber or juniors." },
    { icon: Users,     t: "Practitioner network",     d: "Connect with advocates in other forums and jurisdictions.",           detail: "Verified bar council profiles. Refer matters, exchange opinions, and find local counsel across India." },
    { icon: Calendar,  t: "Cause list tracker",       d: "Daily court cause lists, filtered to your matters.",                  detail: "Auto-pulled from court websites. Get notified the moment your matter is listed or rescheduled." },
  ];
  return (
    <section id="resources" className="py-10 md:py-12 bg-[#fff0df] relative">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
        <div className="max-w-3xl">
          <div className="reveal-left text-xs tracking-[0.3em] text-[#b94826] mb-4">RESOURCES</div>
          <h2 className="reveal-up font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#680318] leading-tight" style={{ transitionDelay: "120ms" }}>
            A working library, not a <span className="italic">reference shelf</span>.
          </h2>
          <p className="reveal-up mt-6 text-lg text-[#680318]/70 leading-relaxed" style={{ transitionDelay: "240ms" }}>
            Statutes, commentary, templates and a network of practitioners — all curated for daily use, not for browsing.
          </p>
          <div className="reveal-blur" style={{ transitionDelay: "380ms" }}>
            <SectionCTA
              label="Open Resources"
              primaryHref={RESOURCES}
              eventName="cta_start_research_click"
              location="resources_section"
            />
          </div>
        </div>

        <FeatureGrid features={features} />
      </div>
    </section>
  );
}

/* ============================================================
   Stats
   ============================================================ */
function Stats() {
  const y = useScrollY();
  const stats = [
    { n: "75+", l: "Years of SC judgements" },
    { n: "0",   l: "Hallucinated citations" },
    { n: "2",   l: "Editable draft stages" },
    { n: "1",   l: "Unified workflow" },
  ];
  return (
    <section
      className="relative py-10 md:py-12 parallax-bg text-[#fff0df]"
      style={{
        backgroundImage: `url(${parallaxCourt})`,
        backgroundPositionY: `${y * 0.1}px`,
      }}
    >
      <div className="absolute inset-0 bg-[#680318]/85" />
      <div className="relative max-w-[1440px] mx-auto px-6 sm:px-10 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
        {stats.map((s, i) => (
          <div key={i} className="reveal-zoom" style={{ transitionDelay: `${i * 120}ms` }}>
            <div className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold text-[#b94826]">{s.n}</div>
            <div className="mt-3 text-sm tracking-[0.2em] uppercase text-[#fff0df]/80">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   Stories
   ============================================================ */
function Stories() {
  useReveal();

  type Topic = "Research" | "Drafting";
  type Quote = { q: string; a: string; r: string; topic: Topic };

  const quotes: Quote[] = [
    /* Research */
    { topic: "Research", q: "I am practising at Madras High Court as a Litigant and the one constant frustration has been missing a judgement that opposing counsel finds. Lexram's conflicting judgement detector and bench strength indicator have completely changed how I prepare. I walk into court knowing I haven't missed anything.", a: "Shree Harini H N", r: "MS. 4036/2025 · Research Law Assistant, Madras High Court, Madurai Bench" },
    { topic: "Research", q: "What struck me first was that every result Lexram returned was a real judgement I could open and verify. After years of being burned by AI tools that fabricate citations, that alone made me a convert.", a: "Shyam M", r: "MS. 8227/2024 · Practising at District Court, Trichy, Tamil Nadu" },
    /* Drafting */
    { topic: "Drafting", q: "The draft plan step is what separates Lexram from everything else I've tried. I approve the structure before a single clause is written, so the final draft reflects my strategy, not the AI's interpretation of it.",                                                                                              a: "Johnson S A",          r: "MS. 1958/2023 · Madras High Court" },
    { topic: "Drafting", q: "The curated questions are remarkably precise. When I asked for an anticipatory bail application, it asked exactly what I would have to ask my senior for — grounds, date of arrest, prior bail history, nature of offence. Nothing generic. Nothing wasted.",                                                       a: "Priyanka C",           r: "MS. 1423/2024 · Madras High Court" },
    { topic: "Drafting", q: "Being able to pull a judgement from research directly into my draft without switching tabs or reformatting the citation has saved me more time than I can calculate. Research and drafting being one workflow is not a feature — it is the correct way to work.",                                                  a: "Pravin Kumar T",       r: "MS. 2649/2021 · Madras High Court" },
    { topic: "Drafting", q: "I uploaded a scanned charge sheet and Lexram read it, extracted the relevant facts, and had a bail application draft plan ready. I genuinely did not expect it to work that well.",                                                                                                                                 a: "Sam Dinakaran Manuel", r: "MS. 4232/2025 · Madras High Court" },
  ];

  const tabs: Topic[] = ["Research", "Drafting"];
  const [tab, setTab] = useState<Topic>("Research");

  /* Deep-link: ?#testimonials-research / -drafting / -blog selects the tab.
     Read on mount + on hashchange so cross-section buttons can deep-link in. */
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.toLowerCase();
      if (h.includes("testimonials-research"))      setTab("Research");
      else if (h.includes("testimonials-drafting")) setTab("Drafting");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  const filtered = quotes.filter((q) => q.topic === tab);
  const initials = (name: string) =>
    name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <section id="testimonials" className="py-10 md:py-12 bg-[#fff0df]">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="reveal-down lex-kicker--bright text-xs tracking-[0.3em] text-[#b94826] mb-4">TESTIMONIALS — FROM ADVOCATES</div>
          <h2 className="reveal-blur font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#680318] text-balance" style={{ transitionDelay: "120ms" }}>
            From the advocates who <span className="italic">use it every day</span>.
          </h2>
          <p className="reveal-up mt-5 text-[#680318]/70 max-w-xl mx-auto" style={{ transitionDelay: "240ms" }}>
            Filter by what they speak about — research, drafting, or our editorial.
          </p>
        </div>

        {/* Tab filter */}
        <div className="reveal-up mb-10 flex justify-center" style={{ transitionDelay: "320ms" }}>
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full border border-[#680318]/15 bg-[#680318]/[0.04]">
            {tabs.map((t) => {
              const active = tab === t;
              const count = quotes.filter((q) => q.topic === t).length;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTab(t)}
                  className={`topic-tab inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] tracking-[0.15em] uppercase font-medium ${
                    active
                      ? "bg-[#680318] text-[#fff0df] shadow-soft"
                      : "text-[#680318]/70 hover:text-[#680318] hover:bg-[#680318]/[0.05]"
                  }`}
                >
                  {t}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    active ? "bg-[#b94826]/40 text-[#fff0df]" : "bg-[#680318]/10 text-[#680318]/60"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontally-scrolling rail of testimonial cards.
            Mobile: snap-scroll with finger. Desktop: same rail + hint chevron + visible scrollbar. */}
        <div className="relative -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div
            key={tab}
            className="quote-roll flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 [scrollbar-color:rgba(104,3,24,0.3)_transparent] [scrollbar-width:thin]"
          >
            {filtered.map((q, i) => {
              const topicTone = {
                Research: { bar: "bg-[#680318]", chip: "border-[#680318]/30 text-[#680318]" },
                Drafting: { bar: "bg-[#b94826]", chip: "border-[#b94826]/40 text-[#b94826]" },
                Blog:     { bar: "bg-[#680318]/70", chip: "border-[#680318]/30 text-[#680318]" },
              }[q.topic];
              return (
                <figure
                  key={`${tab}-${i}`}
                  className="group relative shrink-0 snap-start w-[280px] sm:w-[340px] lg:w-[400px] rounded-2xl bg-[#fff0df] border border-[#680318]/12 shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all overflow-hidden p-5 sm:p-7"
                >
                  {/* Top accent bar */}
                  <span aria-hidden className={`absolute left-0 top-0 h-[3px] w-16 ${topicTone.bar} group-hover:w-full transition-all duration-500`} />

                  {/* Topic chip */}
                  <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border text-[9.5px] tracking-[0.25em] uppercase ${topicTone.chip}`}>
                    {q.topic}
                  </div>

                  {/* Quote */}
                  <Quote className="w-7 h-7 text-[#b94826] mt-4 opacity-70" />
                  <blockquote className="mt-3 font-serif text-[15.5px] md:text-base italic text-[#680318]/85 leading-relaxed">
                    {q.q}
                  </blockquote>

                  {/* Byline */}
                  <figcaption className="mt-6 pt-5 border-t border-[#680318]/10 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full grid place-items-center bg-[#b94826]/15 border border-[#b94826]/35 text-[#b94826] font-serif text-sm font-bold shrink-0">
                      {initials(q.a)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-serif font-bold text-[#680318] leading-tight">{q.a}</div>
                      <div className="text-[11px] text-[#680318]/60 mt-1 leading-snug">{q.r}</div>
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
          {/* fade hint on the right edge */}
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#fff0df] to-transparent" />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Market Comparison — where LexRam sits vs 10 other platforms
   ============================================================ */
function MarketComparison() {
  useReveal();
  const competitors = [
    "LexRam", "BharatLaw.AI", "CaseMine", "SCC Online AI", "Manupatra AI",
    "Indian Kanoon", "VIDUR", "Draft Bot Pro", "JuniorLawyer", "Jhana", "Dharmabot",
  ];
  type Mark = "yes" | "no" | "partial" | string;
  const rows: { feature: string; cells: Mark[] }[] = [
    {
      feature: "Point-of-law decomposition (per-proposition precedent chains)",
      cells: ["yes", "no", "case-level only", "no", "no", "no", "no", "no", "no", "no", "no"],
    },
    {
      feature: "Direct in-line links to actual SC paragraphs",
      cells: ["yes", "summaries", "summaries", "yes", "yes", "case-level", "no", "no", "no", "no", "no"],
    },
    {
      feature: "Drafting grounded in retrieved SC precedents end-to-end",
      cells: ["yes", "separate workflow", "separate workflow", "no", "no", "no", "template-based", "template-based", "template-based", "partial", "template-based"],
    },
    {
      feature: "BNSS / BNS / BSA native (not retro-CrPC)",
      cells: ["yes", "yes", "partial", "yes", "partial", "partial", "partial", "yes", "yes", "partial", "partial"],
    },
    {
      feature: "Free tier for individual advocates",
      cells: ["yes (beta)", "yes", "no", "no", "no", "yes", "partial", "yes", "yes", "partial", "partial"],
    },
    {
      feature: "Indian-first (vs global tool with India bolt-on)",
      cells: ["yes", "yes", "dual (India+US+UK)", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes"],
    },
  ];
  const renderCell = (m: Mark) => {
    if (m === "yes" || m === "yes (beta)") {
      return (
        <span className="inline-flex items-center gap-1 text-[#2a6f2a]">
          <CheckCircle2 className="w-4 h-4" />
          {m === "yes (beta)" ? <span className="text-xs">beta</span> : null}
        </span>
      );
    }
    if (m === "no") {
      return <span className="text-[#680318]/30">—</span>;
    }
    return <span className="text-xs text-[#680318]/70 italic">{m}</span>;
  };

  return (
    <section id="compare" className="py-10 md:py-12 bg-[#fff0df]">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
        <div className="reveal-down max-w-3xl mb-10">
          <div className="lex-kicker--bright text-xs tracking-[0.3em] text-[#b94826] mb-4">
            COMPARE — WHERE LEXRAM SITS IN THE MARKET
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#680318] leading-tight">
            Compared, plainly.
          </h2>
          <p className="mt-4 text-lg text-[#680318]/70 leading-relaxed">
            Eleven Indian legal-AI platforms. One axis they don&rsquo;t compete on.
          </p>
        </div>

        <div className="reveal-up overflow-x-auto rounded-xl border border-[#680318]/10 bg-[#fff0df] shadow-soft">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#680318] text-[#fff0df]">
                <th scope="col" className="text-left p-4 font-sans font-semibold min-w-[260px]">
                  Capability
                </th>
                {competitors.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className={`p-4 font-sans font-semibold text-xs uppercase tracking-wider min-w-[100px] ${
                      c === "LexRam" ? "text-[#b94826]" : "text-[#fff0df]/80"
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i % 2 === 0 ? "bg-[#fff0df]" : "bg-[#F9E4C9]"}
                >
                  <th
                    scope="row"
                    className="text-left p-4 font-medium text-[#680318] align-top"
                  >
                    {row.feature}
                  </th>
                  {row.cells.map((cell, j) => (
                    <td
                      key={j}
                      className={`p-4 text-center align-top border-l border-[#680318]/10 ${
                        j === 0 ? "bg-[#b94826]/10" : ""
                      }`}
                    >
                      {renderCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="reveal-up mt-4 text-xs text-[#680318]/50 italic max-w-3xl">
          Comparison reflects publicly available product information as of May 2026. Competitor capabilities change frequently.
          We update this table quarterly. To suggest a correction, email{" "}
          <a href="mailto:support@lexram.ai" className="underline hover:text-[#b94826]">
            support@lexram.ai
          </a>
          .
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   Pricing
   ============================================================ */
function Pricing() {
  useReveal();
  const plans = [
    { name: "Free Trial", price: "₹0",     note: "50 credits",    features: ["Research access", "Verified citations", "Draft plan preview"],                                           cta: "Start free",   featured: false, href: SIGNUP },
    { name: "Pay As You Go", price: "₹500", note: "min recharge", features: ["Unlimited research", "Full drafting suite", "Case hub", "Email support"],                                      cta: "Start now",    featured: true,  href: SIGNUP },
    { name: "Firm",       price: "Custom", note: "bulk pricing",  features: ["All Pay As You Go features", "Shared workspaces", "Firm-wide history", "Priority support", "Volume discounts"], cta: "Talk to us",   featured: false, href: CONTACT },
  ];
  return (
    <section id="pricing" className="py-10 md:py-12 bg-[#fff0df]">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
        <div className="text-center mb-8">
          <div className="reveal-down lex-kicker--bright text-xs tracking-[0.3em] text-[#b94826] mb-4">PRICING — PLANS &amp; TIERS</div>
          <h2 className="reveal-blur font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#680318]" style={{ transitionDelay: "120ms" }}>
            Pay as you go.
          </h2>
          <p className="reveal-up mt-4 text-lg text-[#680318]/60 max-w-xl mx-auto" style={{ transitionDelay: "200ms" }}>
            Pay for what you use — not a penny more. No subscriptions. No overheads. Recharge starting at ₹500 for world-class legal research, analysis and professional drafting.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <div
              key={i}
              onMouseEnter={() => track("pricing_plan_hover", { plan: p.name })}
              className={`${p.featured ? "reveal-rise" : "reveal-up"} relative p-10 rounded-2xl border ${
                p.featured
                  ? "bg-[#680318] text-[#fff0df] border-[#b94826] shadow-elegant scale-105"
                  : "bg-[#fff0df] border-[#680318]/10 shadow-soft"
              }`}
              style={{ transitionDelay: `${i * 130}ms` }}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#b94826] text-[#fff0df] text-xs px-3 py-1 rounded-full tracking-wider">
                  MOST POPULAR
                </div>
              )}
              <h3
                className={`font-serif text-2xl font-bold ${
                  p.featured ? "text-[#fff0df]" : "text-[#680318]"
                }`}
              >
                {p.name}
              </h3>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-5xl font-bold">{p.price}</span>
                <span
                  className={`text-sm ${
                    p.featured ? "text-[#fff0df]/70" : "text-[#680318]/60"
                  }`}
                >
                  {p.note}
                </span>
              </div>
              <ul className="mt-8 space-y-3">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-none text-[#b94826]" />
                    <span
                      className={p.featured ? "text-[#fff0df]/90" : "text-[#680318]/80"}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  track("pricing_plan_click", { plan: p.name });
                  go(p.href);
                }}
                className={`mt-10 w-full py-3 rounded-md font-medium transition ${
                  p.featured
                    ? "bg-[#fff0df] text-[#680318] hover:bg-[#b94826] hover:text-[#fff0df]"
                    : "bg-[#680318] text-[#fff0df] hover:bg-[#b94826]"
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ
   ============================================================ */
function FAQ() {
  useReveal();

  type Group = { topic: "General" | "Research" | "Drafting"; items: { q: string; a: string }[] };
  const groups: Group[] = [
    {
      topic: "General",
      items: [
        { q: "What is Lexram AI — and how is it different from other legal research tools in India?", a: "Lexram is an AI-powered legal platform built exclusively for Indian lawyers. The Indian AI legal Assistant, LexRam uses Supreme Court Judgements and Central statutes as its legal sources and not any open internet sources." },
        { q: "How is Lexram different from ChatGPT or generic AI tools for legal research?",          a: "Generic AI tools generate answers from the internet — and hallucinate. Lexram is trained exclusively on verified Indian legal sources. Every answer traces back to real SUPREME COURT judgements and central statutes. Nothing is fabricated." },
        { q: "Is Lexram built specifically for Indian law and Indian courts?",                         a: "Yes. Entirely. Not trained on the internet, not an open source legal software. Trained on India's courts — the Supreme Court of India and Indian legislation." },
        { q: "Does Lexram offer a free trial?",                                                        a: "Yes — 50 credits, no payment required. Start your free trial at India's AI legal research platform — LexRam today." },
      ],
    },
    {
      topic: "Research",
      items: [
        { q: "Does Lexram have the latest Supreme Court judgements — how current is the database?",   a: "Lexram covers every Supreme Court judgement since 1950 and updates daily with new Supreme Court of India decisions." },
        { q: "Does Lexram generate fake citations or fabricated case names?",                           a: "No. Lexram only surfaces citations from its verified database i.e Supreme Court Judgements. It does not generate, infer, or fabricate case names or citations — ever. Hence no hallucinated citations or fabricated judges' analysis." },
        { q: "What if two Supreme Court benches have taken opposite views on the same legal point?",   a: "Lexram's per incuriam checker filters out compromised judgements at the source — what reaches you is only the law that holds." },
        { q: "How do I know if the Supreme Court judgement I am relying on is still good law?",        a: "Every judgement in Lexram is marked — affirmed, distinguished, or overruled — so you never argue from a precedent that no longer stands." },
      ],
    },
    {
      topic: "Drafting",
      items: [
        { q: "What documents can I upload for AI legal drafting on Lexram?",                           a: "Any scanned documents including handwritten documents in Indian languages can be uploaded on LexRam. LexRam can read the uploaded documents without any hallucinations." },
        { q: "Do I need to know how to prompt an AI to use Lexram's drafting tool?",                   a: "No. Upload the documents to the designated case in the Case Hub and attach them. Just type the petition you need in plain language by clicking on the draft button in the search bar. Lexram reads your documents, asks the right questions, and builds the draft." },
        { q: "Will Lexram ask the same questions for every petition type?",                            a: "No. Questions are curated to every petition you request LexRam to draft. A bail application gets anticipatory bail related questions such as \"Does the accused have any prior convictions or pending cases?\". Nothing irrelevant. Nothing missed." },
        { q: "How to draft a bail application using LexRam?",                                          a: "Upload the relevant documents i.e FIR and click on the Draft button in the search bar. Type 'Draft a bail application' and press enter. Lexram reads your documents, asks the right questions, and builds the draft." },
        { q: "Are the judgements cited in my AI-drafted petition real and verifiable?",                a: "Every judgement cited in your draft traces back to a real, verifiable Indian legal sources which includes Supreme Court judgements and Central Statutes in Lexram's database. The draft reflects your uploaded facts and real SUPREME COURT judgements — not AI guesswork." },
      ],
    },
  ];

  // Each item has a globally unique key built from topic + index.
  const [open, setOpen] = useState<string | null>("General-0");
  const [tab, setTab] = useState<Group["topic"]>("General");
  const visibleGroups = groups.filter((g) => g.topic === tab);

  /* Deep-link: #faq-general / -research / -drafting selects the tab.
     Read on mount + on hashchange so cross-section buttons can deep-link in. */
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.toLowerCase();
      if (h.includes("faq-general"))       setTab("General");
      else if (h.includes("faq-research")) setTab("Research");
      else if (h.includes("faq-drafting")) setTab("Drafting");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return (
    <section id="faq" className="py-10 md:py-12 bg-[#fff0df]">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
        <div className="text-center mb-8">
          <div className="reveal-down lex-kicker--bright text-xs tracking-[0.3em] text-[#b94826] mb-4">FAQ — FREQUENTLY ASKED</div>
          <h2 className="reveal-blur font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#680318]" style={{ transitionDelay: "120ms" }}>
            Questions, <span className="italic">answered</span>.
          </h2>
          <p className="reveal-up mt-5 text-[#680318]/70 max-w-xl mx-auto" style={{ transitionDelay: "240ms" }}>
            Browse by topic — or scroll the full list below.
          </p>
        </div>

        {/* Topic filter */}
        <div className="reveal-up mb-10 flex justify-center" style={{ transitionDelay: "320ms" }}>
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full border border-[#680318]/15 bg-[#680318]/[0.04]">
            {(["General", "Research", "Drafting"] as const).map((t) => {
              const active = tab === t;
              const count = groups.find((g) => g.topic === t)?.items.length ?? 0;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTab(t)}
                  className={`topic-tab inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] tracking-[0.15em] uppercase font-medium ${
                    active
                      ? "bg-[#680318] text-[#fff0df] shadow-soft"
                      : "text-[#680318]/70 hover:text-[#680318] hover:bg-[#680318]/[0.05]"
                  }`}
                >
                  {t}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    active ? "bg-[#b94826]/40 text-[#fff0df]" : "bg-[#680318]/10 text-[#680318]/60"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grouped accordion */}
        <div key={tab} className="quote-roll space-y-12">
          {visibleGroups.map((group) => (
            <div key={group.topic}>
              {/* Section header */}
              <div className="flex items-center gap-4 mb-5">
                <div className="text-[10px] tracking-[0.3em] uppercase text-[#b94826] font-medium">
                  {group.topic}
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#680318]/25 to-transparent" />
                <div className="text-[10px] tracking-[0.2em] uppercase text-[#680318]/55">
                  {group.items.length} {group.items.length === 1 ? "question" : "questions"}
                </div>
              </div>

              <div className="space-y-2.5">
                {group.items.map((f, i) => {
                  const key = `${group.topic}-${i}`;
                  const isOpen = open === key;
                  return (
                    <div
                      key={key}
                      className={`relative rounded-xl border bg-[#fff0df] overflow-hidden transition-all ${
                        isOpen
                          ? "border-[#b94826]/45 shadow-elegant"
                          : "border-[#680318]/12 hover:border-[#680318]/25 hover:shadow-soft"
                      }`}
                    >
                      {/* Left accent stripe — appears when open */}
                      <span
                        aria-hidden
                        className={`absolute left-0 top-0 bottom-0 w-[3px] bg-[#b94826] transition-transform origin-top duration-300 ${
                          isOpen ? "scale-y-100" : "scale-y-0"
                        }`}
                      />
                      <button
                        onClick={() => {
                          const next = isOpen ? null : key;
                          setOpen(next);
                          track("faq_toggle", { question: f.q, opened: next !== null });
                        }}
                        className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <span className={`mt-1 font-mono text-[11px] tracking-wider shrink-0 ${
                            isOpen ? "text-[#b94826]" : "text-[#680318]/40"
                          }`}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="font-serif text-base md:text-lg font-semibold text-[#680318] leading-snug">
                            {f.q}
                          </span>
                        </div>
                        <span className={`grid place-items-center w-7 h-7 rounded-full border shrink-0 transition-all ${
                          isOpen
                            ? "bg-[#b94826] border-[#b94826] text-[#fff0df] rotate-180"
                            : "border-[#680318]/25 text-[#b94826]"
                        }`}>
                          {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                      <div
                        className={`grid transition-all duration-400 ${
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-6 pb-6 pl-[68px] md:pl-[72px]">
                            <p className="text-[#680318]/80 leading-relaxed">{f.a}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Get in touch — referenced from LexisNexis Plus contact section
   ============================================================ */
function ContactRow({
  icon: Icon, label, value, href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-4 group">
      <div className="w-11 h-11 rounded-lg bg-[#fff0df]/[0.08] border border-[#fff0df]/15 grid place-items-center shrink-0 group-hover:bg-[#b94826] group-hover:border-[#b94826] transition">
        <Icon className="w-5 h-5 text-[#b94826] group-hover:text-[#fff0df] transition" />
      </div>
      <div>
        <div className="text-[10px] tracking-[0.25em] uppercase text-[#b94826] mb-1">{label}</div>
        <div className="font-mono text-xl text-[#fff0df] font-bold leading-snug tracking-wide">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block">{inner}</a>
  ) : inner;
}

function GetInTouchField({
  label, name, type = "text", value, onChange, required, placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium tracking-wide text-[#680318]/70 mb-1.5 uppercase">
        {label}{required && <span className="text-[#b94826]"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-md bg-[#F9E4C9] border border-[#680318]/15 text-[#680318] placeholder:text-[#680318]/35 focus:outline-none focus:border-[#b94826] focus:bg-[#F9E4C9] transition"
      />
    </label>
  );
}

function GetInTouch() {
  useReveal();
  const [form, setForm] = useState({ name: "", email: "", firm: "", phone: "", topic: "Sales", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    track("contact_form_submit", {
      location: "get_in_touch",
      topic: form.topic,
      has_firm: form.firm.length > 0,
      has_phone: form.phone.length > 0,
    });
    setSubmitted(true);
  };

  const topics = ["Sales", "Demo", "Support", "Partnership"];

  return (
    <section id="contact" className="relative py-10 md:py-12 bg-[#680318] text-[#fff0df] overflow-hidden">
      {/* Rust glow accents on dark backdrop */}
      <div aria-hidden className="absolute top-1/4 -left-32 w-[520px] h-[520px] bg-[#b94826] opacity-15 blur-[160px] rounded-full pointer-events-none lex-float-x" />
      <div aria-hidden className="absolute bottom-0 -right-32 w-[520px] h-[520px] bg-[#b94826] opacity-10 blur-[180px] rounded-full pointer-events-none lex-float" />

      <div className="relative max-w-[1440px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="lex-kicker--bright text-xs tracking-[0.3em] text-[#b94826] mb-4">CONTACT — GET IN TOUCH</div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-[#fff0df] leading-[1.05] text-balance">
            Have a question?
            <br />
            <span className="italic text-[#b94826]">We&apos;d love to hear from you.</span>
          </h2>
          <p className="mt-6 text-lg text-[#fff0df]/75 leading-relaxed">
            Whether you want a chambers walkthrough, are exploring a firm-wide rollout,
            or just have a question about how Lexram works — write to us. We reply within one working day.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-14 items-start">
          {/* Left: contact channels + reassurance */}
          <div className="space-y-7">
            <ContactRow icon={Mail}  label="Email us"        value="support@lexram.ai" href="mailto:support@lexram.ai" />
            <ContactRow icon={Phone} label="Talk to sales"   value="+91 80 4567 8900" href="tel:+918045678900" />
            <ContactRow icon={Clock} label="Working hours"   value="Mon – Sat · 10:00 – 19:00 IST" />

            <div className="mt-2 p-6 bg-[#fff0df]/[0.05] backdrop-blur-sm rounded-xl border border-[#fff0df]/12">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#b94826]/20 border border-[#b94826]/30 grid place-items-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#b94826]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#fff0df] mb-1">Looking for a firm-wide demo?</h3>
                  <p className="text-sm text-[#fff0df]/70 leading-relaxed">
                    We host tailored walkthroughs for chambers and litigation teams. Pick &ldquo;Demo&rdquo; below and we&apos;ll set up a session matched to your bench size.
                  </p>
                </div>
              </div>
            </div>

            {/* Reassurance row */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#fff0df]/60">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#b94826]" /> Replies within 1 working day</span>
              <span className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#b94826]" /> DPDP-compliant intake</span>
              <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#b94826]" /> Routed to a real human</span>
            </div>
          </div>

          {/* Right: form card — translucent glass on the maroon section */}
          <form
            onSubmit={onSubmit}
            className="relative bg-[#fff0df] rounded-2xl border border-[#680318]/15 p-7 md:p-10 shadow-elegant"
          >
            {/* rust accent stripe */}
            <div className="absolute left-7 right-7 top-0 h-1 bg-[#b94826] rounded-b-full" />

            <div className="mb-6">
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#680318]">Send us a note</h3>
              <p className="mt-1 text-sm text-[#680318]/60">All fields with <span className="text-[#b94826]">*</span> are required.</p>
            </div>

            {/* Topic picker (segmented) */}
            <div className="mb-6">
              <span className="block text-[11px] font-medium tracking-wide text-[#680318]/70 mb-2 uppercase">What&apos;s this about?</span>
              <div className="inline-flex flex-wrap gap-1.5 p-1 bg-[#680318]/[0.04] border border-[#680318]/15 rounded-lg">
                {topics.map((t) => {
                  const active = form.topic === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, topic: t }))}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
                        active
                          ? "bg-[#680318] text-[#fff0df] shadow-soft"
                          : "text-[#680318]/60 hover:text-[#680318] hover:bg-[#680318]/[0.08]"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <GetInTouchField label="Your name"      name="name"  value={form.name}  onChange={(v) => setForm((f) => ({ ...f, name: v }))}  required placeholder="Adv. A. Mehta" />
              <GetInTouchField label="Email address"  name="email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required placeholder="you@chambers.in" />
              <GetInTouchField label="Firm / chambers" name="firm"  value={form.firm}  onChange={(v) => setForm((f) => ({ ...f, firm: v }))}  placeholder="Optional" />
              <GetInTouchField label="Phone"          name="phone" type="tel"   value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="Optional" />
            </div>

            <div className="mt-4">
              <label className="block">
                <span className="block text-[11px] font-medium tracking-wide text-[#680318]/70 mb-1.5 uppercase">
                  How can we help? <span className="text-[#b94826]">*</span>
                </span>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us about your practice and what you'd like to see from Lexram…"
                  className="w-full px-4 py-3 rounded-md bg-[#F9E4C9] border border-[#680318]/15 text-[#680318] placeholder:text-[#680318]/35 focus:outline-none focus:border-[#b94826] focus:bg-[#F9E4C9] transition resize-none"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-[11px] text-[#680318]/55 max-w-xs leading-relaxed">
                By submitting, you agree to be contacted by the Lexram team. We never share your details.
              </p>
              <button
                type="submit"
                disabled={submitted}
                className="group inline-flex items-center gap-2 bg-[#680318] text-[#fff0df] px-6 py-3 rounded-md font-semibold hover:bg-[#b94826] transition shadow-soft disabled:opacity-70 disabled:cursor-default"
              >
                {submitted ? (
                  <>Sent — thank you <CheckCircle2 className="w-4 h-4" /></>
                ) : (
                  <>Send message <Send className="w-4 h-4 group-hover:translate-x-1 transition" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Final CTA — email-capture form, redirects to signup
   ============================================================ */
function CTA() {
  const [email, setEmail] = useState("");
  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    track("cta_start_trial_click", { location: "final_cta" });
    const qs = email ? `&email=${encodeURIComponent(email)}` : "";
    go(`${SIGNUP}${qs}`);
  };
  return (
    <section id="cta" className="relative py-10 md:py-12 overflow-hidden bg-[#680318]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(185,72,38,0.4),transparent_70%)]" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center text-[#fff0df]">
        <Scale className="reveal-zoom w-12 h-12 mx-auto text-[#b94826] mb-6" />
        <h2 className="reveal-blur font-serif text-4xl md:text-6xl font-bold leading-tight text-balance" style={{ transitionDelay: "140ms" }}>
          You argue the case.
          <br />
          <span className="italic text-[#b94826]">We'll find the law.</span>
        </h2>
        <p className="reveal-up mt-6 text-lg text-[#fff0df]/80 max-w-2xl mx-auto" style={{ transitionDelay: "280ms" }}>
          50 free credits. No card required. Built on India's courts — not the internet.
        </p>
        <form
          onSubmit={onSubmit}
          className="reveal-rise mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          style={{ transitionDelay: "400ms" }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@chambers.in"
            className="flex-1 px-5 py-4 rounded-md bg-[#fff0df]/10 border border-[#fff0df]/20 text-[#fff0df] placeholder:text-[#fff0df]/50 focus:outline-none focus:border-[#b94826]"
          />
          <button type="submit" className="lex-btn lex-btn--primary lex-btn--dark">
            Start Free
          </button>
        </form>
        <div className="mt-8 flex items-center justify-center gap-2 text-[#fff0df]/60 text-sm">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-4 h-4 fill-[#b94826] text-[#b94826]" />
          ))}
          <span className="ml-2">Trusted by advocates across India</span>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Footer
   ============================================================ */
function Footer() {
  const socials = [
    { href: "https://www.linkedin.com/company/lexram-ai-legal-analysis/", svgPath: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z", label: "LinkedIn"  },
    { href: "https://youtube.com/@lexramai?si=uyc3g0b8Ebde_eLN",          svgPath: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z", label: "YouTube"   },
    { href: "https://www.instagram.com/learn.with.lexram.ai?igsh=YW9hYjF2MjNyMThl",      svgPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z", label: "Instagram" },
    { href: "https://www.facebook.com/profile.php?id=61588185590846",       svgPath: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", label: "Facebook"  },
  ];

  return (
    <footer className="bg-[#680318] text-[#fff0df]/70 border-t border-[#b94826]/20">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 pt-14 pb-10">

        {/* ── Main grid: brand+contact left, nav columns right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-12 lg:gap-16">

          {/* Col 1: Brand + contact + social */}
          <div className="flex flex-col gap-6">
            <span className="font-serif text-5xl sm:text-6xl font-bold text-[#fff0df] tracking-tight" style={{ textShadow: "0 2px 24px rgba(185,72,38,0.65), 0 1px 8px rgba(0,0,0,0.55)" }}>LexRam</span>
            <p className="text-base leading-relaxed text-[#fff0df]/90 max-w-xs">
              &ldquo;You argue the case. We&apos;ll find the law.&rdquo;<br />
              Built exclusively on India&apos;s courts — statute to submission.
            </p>
            <div className="space-y-4 text-base">
              <a href="tel:+918754446066" className="flex items-center gap-2.5 text-[#fff0df]/90 hover:text-[#fff0df] transition-colors">
                <Phone className="w-4 h-4 text-[#b94826] shrink-0" />
                +91 87544 46066
              </a>
              <a href="mailto:hello@lexram.ai" className="flex items-center gap-2.5 text-[#fff0df]/90 hover:text-[#fff0df] transition-colors">
                <Mail className="w-4 h-4 text-[#b94826] shrink-0" />
                hello@lexram.ai
              </a>
              <div className="flex items-start gap-2.5 text-[#fff0df]/85">
                <MapPin className="w-4 h-4 text-[#b94826] shrink-0 mt-0.5" />
                <address className="not-italic text-sm leading-[1.8]">
                  G1 (Ground Floor), Bhaskara Apartments,<br />
                  No.&nbsp;28, Pycrofts Garden Road,<br />
                  Nungambakkam, Chennai&nbsp;— 600&nbsp;006
                </address>
              </div>
            </div>
            {/* Social icons */}
            <div className="flex items-center gap-2.5 pt-1">
              {socials.map(({ href, svgPath, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-md border border-[#fff0df]/15 grid place-items-center text-[#fff0df]/55 hover:border-[#b94826] hover:text-[#b94826] hover:bg-[#b94826]/10 transition-all"
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
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#b94826] mb-6">Products</p>
            <ul className="space-y-5 text-base">
              <li><a href="#research"       className="text-[#fff0df]/90 hover:text-[#fff0df] transition-colors">Research</a></li>
              <li><a href="#drafting"       className="text-[#fff0df]/90 hover:text-[#fff0df] transition-colors">Drafting</a></li>
              <li><a href="/dashboard/tsr"  className="text-[#fff0df]/90 hover:text-[#fff0df] transition-colors">TSR</a></li>
            </ul>
          </div>

          {/* Col 3: Information */}
          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#b94826] mb-6">Information</p>
            <ul className="space-y-5 text-base">
              <li><a href="/blog"    className="text-[#fff0df]/90 hover:text-[#fff0df] transition-colors">Blog</a></li>
              <li><a href="#pricing" className="text-[#fff0df]/90 hover:text-[#fff0df] transition-colors">Pricing</a></li>
              <li><a href="#faq"     className="text-[#fff0df]/90 hover:text-[#fff0df] transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-[#fff0df]/10" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-[#fff0df]/70">
          <span>© {new Date().getFullYear()} Ramasubramanian AI Software Pvt. Ltd. — Built in India, for Indian advocates.</span>
          <div className="flex items-center gap-4">
            <a href="/privacy"       className="hover:text-[#fff0df] transition-colors">Privacy</a>
            <a href="/terms"         className="hover:text-[#fff0df] transition-colors">Terms</a>
            <a href="/refund-policy" className="hover:text-[#fff0df] transition-colors">Refund</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
/* ============================================================
   Page
   ============================================================ */
export default function LandingPage() {
  useLenis();
  useReveal();
  return (
    <main data-landing-v2 className="bg-[#fff0df] overflow-x-hidden">
      <ScrollProgress />
      <Nav />
      <Hero />
      <TrustStrip />
      <Research />
      <LexramEdge />
      <Drafting />
      <LexDraftEdge />
      {/* <Resources /> — temporarily hidden; re-enable when section is finalised */}
      <MarketComparison />
      <Stats />
      <Stories />
      <Pricing />
      <FAQ />
      <GetInTouch />
      {/* <CTA /> — removed; final closing message lives in the maroon GetInTouch section */}
      <Footer />
    </main>
  );
}
