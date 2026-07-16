"use client";

import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2, ArrowRight, Quote, Plus, Minus,
  Mail, Phone, MapPin, Menu, X,
  Scale, Gavel, BookOpen,
  LayoutGrid, Search, FileText, MessageSquare, HelpCircle,
} from "lucide-react";
import { track } from "@/lib/landing-analytics";
import { PageSidebarNav } from "@/components/page-sidebar-nav";

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

    /* Two observers: one for individual elements (tight threshold for
       precise timing), one for full sections (looser so the whole section
       enters before children start staggering). */
    const ioEls = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            ioEls.unobserve(e.target); // fire once, stop watching
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => ioEls.observe(el));

    /* Failsafe: if the observer hasn't flipped an element to .in-view within
       2.5s of mount (e.g. the user scrolled past too fast, the section was
       already past viewport at first paint, the observer threshold never
       matched a short element), force visibility so content never stays at
       opacity: 0 indefinitely. */
    const failsafe = window.setTimeout(() => {
      document.querySelectorAll(selector).forEach((el) => el.classList.add("in-view"));
    }, 2500);

    return () => {
      ioEls.disconnect();
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
        className="h-full bg-gradient-to-r from-[#6b1e2d] via-[#d96944] to-[#6b1e2d] shadow-[0_0_12px_rgba(107, 30, 45,0.6)]"
        style={{ width: `${p * 100}%`, transition: "width 80ms linear" }}
      />
    </div>
  );
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setY(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);
  return y;
}

function useInViewOnce(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

function useCountUp(target: number, inView: boolean, delay = 0, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (target === 0) { setCount(0); return; }
    let timerId: ReturnType<typeof setTimeout>;
    timerId = setTimeout(() => {
      let cur = 0;
      const steps = 55;
      const inc = target / steps;
      const iv = setInterval(() => {
        cur = Math.min(cur + inc, target);
        setCount(Math.round(cur));
        if (cur >= target) clearInterval(iv);
      }, duration / steps);
    }, delay);
    return () => clearTimeout(timerId);
  }, [inView, target, delay, duration]);
  return count;
}

function useLandingTypewriter(lines: string[], active = true) {
  const [li, setLi] = useState(0);
  const [ci, setCi] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    if (!active) return;
    const cur = lines[li];
    const t = setTimeout(() => {
      if (!del) {
        if (ci < cur.length) { setText(cur.slice(0, ci + 1)); setCi(c => c + 1); }
        else setTimeout(() => setDel(true), 2200);
      } else {
        if (ci > 0) { setText(cur.slice(0, ci - 1)); setCi(c => c - 1); }
        else { setDel(false); setLi(i => (i + 1) % lines.length); }
      }
    }, del ? 28 : 58);
    return () => clearTimeout(t);
  }, [active, lines, li, ci, del]);
  return text;
}

/* ============================================================
   Nav
   ============================================================ */
function Nav() {
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

  const navLinks = [
    { href: "/research",      label: "Research" },
    { href: "/drafting",      label: "Drafting" },
    { href: "#faq",            label: "FAQ" },
    { href: "/pricing",       label: "Pricing" },
    { href: "#contact",        label: "Contact" },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#d8cdb8]/95 backdrop-blur-md border-b border-[#6b1e2d]/10 shadow-[0_4px_24px_rgba(107, 30, 45,0.08)]" : "bg-transparent border-b border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
        {/* Brand */}
        <a href="#" aria-label="Lexram" className="flex items-center shrink-0">
          <img src="/lexram-logo.png" alt="Lexram" width={140} height={48} className={`h-11 sm:h-12 w-auto transition-all duration-300 ${scrolled ? "" : "brightness-0 invert"}`} />
        </a>

        {/* Desktop nav */}
        <nav className={`hidden lg:flex items-center gap-7 text-base transition-colors duration-300 ${scrolled ? "text-[#6b1e2d]/93" : "text-white/90"}`}>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className={`font-medium transition ${scrolled ? "hover:text-[#6b1e2d]" : "hover:text-white"}`}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => { track("cta_login_click", { location: "nav" }); go(LOGIN); }}
            className={`inline-flex items-center gap-2 border px-4 lg:px-5 py-2.5 rounded-md text-base font-medium transition ${scrolled ? "border-[#6b1e2d]/25 text-[#6b1e2d] hover:border-[#6b1e2d] hover:text-[#6b1e2d]" : "border-white/40 text-white hover:border-white hover:text-white"}`}
          >
            Login
          </button>
          <button
            onClick={() => { track("cta_start_trial_click", { location: "nav" }); go(SIGNUP); }}
            className="inline-flex items-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-4 lg:px-5 py-2.5 rounded-md text-base font-medium hover:bg-[#CC5500] transition shadow-soft"
          >
            <span className="hidden md:inline">Free Trial</span>
            <span className="md:hidden">Trial</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile menu toggle */}
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

      {/* Mobile drawer */}
      <div className={`lg:hidden overflow-hidden border-t border-[#6b1e2d]/10 bg-[#d8cdb8]/95 backdrop-blur-md transition-[max-height,opacity] duration-300 ease-out ${
        open ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3.5 text-lg font-semibold text-[#6b1e2d]/95 border-b border-[#6b1e2d]/10 last:border-b-0 hover:text-[#6b1e2d] transition"
            >
              {l.label}
            </a>
          ))}

          <div className="mt-4 flex flex-col sm:hidden gap-2">
            <button
              onClick={() => { setOpen(false); track("cta_login_click", { location: "nav_mobile" }); go(LOGIN); }}
              className="inline-flex items-center justify-center gap-2 border border-[#6b1e2d]/25 text-[#6b1e2d] px-4 py-2.5 rounded-md text-sm font-medium"
            >
              Login
            </button>
            <button
              onClick={() => { setOpen(false); track("cta_start_trial_click", { location: "nav_mobile" }); go(SIGNUP); }}
              className="inline-flex items-center justify-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-4 py-2.5 rounded-md text-sm font-medium"
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
  const heroType = useLandingTypewriter([
    "anticipatory bail applications",
    "Supreme Court precedents",
    "title scrutiny reports",
    "writ petitions under Art. 226",
    "legal notices & opinions",
    "High Court drafting",
  ]);

  const BG = (
    <>
      {/* Video background */}
      <video
        aria-hidden
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: `translate3d(0, ${y * 0.08}px, 0) scale(1.04)` }}
      >
        <source src="/landing/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0509]/85 via-[#6b1e2d]/70 to-[#2a0a10]/82" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(42,26,28,0.40)_100%)]" />
    </>
  );

  return (
    <section className="relative h-screen overflow-hidden flex flex-col justify-center">
      {BG}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24 flex flex-col justify-center h-full">

        {/* ── Kicker ─────────────────────────────────────────────────── */}
        <div className="reveal-up mb-5" style={{ transitionDelay: "40ms" }}>
          <span className="inline-block text-[11px] tracking-[0.35em] uppercase font-bold text-[#CC5500]"
            style={{ textShadow: '0 0 18px rgba(204,85,0,0.7), 0 0 40px rgba(204,85,0,0.4)' }}>
            Indian AI Law Assistant
          </span>
        </div>

        {/* ── Editorial headline ─────────────────────────────────────── */}
        <div className="reveal-up" style={{ transitionDelay: "80ms" }}>
          <h1
            className="font-serif font-bold text-[#d8cdb8] leading-[0.90] tracking-tight text-[2.8rem] sm:text-[4rem] md:text-[5.2rem] lg:text-[6.8rem] xl:text-[8.5rem]"
            style={{ textShadow: '0 4px 40px rgba(0,0,0,0.5)' }}
          >
            &ldquo;From statute to submission<br />
            <em className="italic text-[#e8c8a8]">without leaving LexRam&rdquo;</em>
          </h1>
        </div>

        {/* ── Description ────────────────────────────────────────────── */}
        <div className="reveal-up mt-8 max-w-2xl" style={{ transitionDelay: "180ms" }}>
          <p
            className="font-serif text-lg sm:text-xl md:text-2xl text-[#d8cdb8]/90 leading-relaxed"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
          >
            Research legal questions, draft pleadings, manage matters, trace titles, and grow your network — one platform, built on India&apos;s courts{" "}
            <span className="italic text-[#e8c8a8] font-semibold">alone.</span>
          </p>
        </div>

        {/* ── Typewriter practice-area hint ─────────────────────────── */}
        <div className="reveal-up mt-6 flex items-center gap-2.5" style={{ transitionDelay: "240ms" }}>
          <span
            className="text-[12px] font-medium uppercase tracking-[0.18em]"
            style={{ color: "rgba(216,205,184,0.5)" }}
          >
            Try:
          </span>
          <span
            className="font-mono text-[#CC5500] text-base font-semibold"
            style={{ textShadow: "0 0 14px rgba(204,85,0,0.5)" }}
          >
            {heroType}
            <span
              className="inline-block w-[2px] h-[1em] bg-[#CC5500] ml-[2px] align-middle"
              style={{ animation: "blink 1s step-end infinite" }}
            />
          </span>
        </div>

        {/* ── CTAs ───────────────────────────────────────────────────── */}
        <div className="reveal-blur mt-8 flex flex-col sm:flex-row gap-4" style={{ transitionDelay: "280ms" }}>
          <button
            type="button"
            onClick={() => {
              track("cta_start_trial_click", { location: "hero" });
              go(SIGNUP);
            }}
            className="inline-flex items-center justify-center gap-2.5 bg-[#CC5500] text-[#d8cdb8] px-8 py-4 rounded-xl text-base font-semibold hover:bg-[#CC5500] hover:-translate-y-[2px] active:translate-y-0 transition-all duration-200 shadow-[0_12px_36px_-8px_rgba(204,85,0,0.55)] hover:shadow-[0_18px_40px_-8px_rgba(204,85,0,0.7)]"
          >
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </button>
          <a
            href="#research"
            className="inline-flex items-center justify-center gap-2.5 border border-[#d8cdb8]/30 text-[#d8cdb8] px-8 py-4 rounded-xl text-base font-medium hover:border-[#d8cdb8]/60 hover:bg-[#d8cdb8]/8 hover:-translate-y-[2px] active:translate-y-0 transition-all duration-200"
          >
            Explore
          </a>
        </div>

      </div>
    </section>
  );
}

/* ============================================================
   Product Cards (Research · Drafting · Title Scrutiny)
   ============================================================ */
function ProductCards() {
  const [activeIndex, setActiveIndex] = useState(0);
  const lastInteraction = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastInteraction.current < 2500) return;
      setActiveIndex((n) => (n + 1) % 3);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const cards = [
    {
      title: "Research.",
      subtitle: "Statute-first. Precedent-backed.",
      desc: "AI legal research built on Supreme Court judgements and statutes — every citation is real, openable and verifiable. Zero hallucinations.",
      bullets: ["Supreme Court judgements since 1950", "Filters per incuriam judgments", "No fake citations, no AI guesswork", "Verified citations only"],
      href: "/research",
    },
    {
      title: "Drafting.",
      subtitle: "From your documents to court.",
      desc: "Upload your case file. LexRam reads, structures and drafts the pleading — formatted to what your court or tribunal expects, every time.",
      bullets: ["Multi-document upload & scan to draft", "Editable at 2 stages before finalising", "Verified Supreme Court citations only", "Export-ready .docx in court format"],
      href: "/drafting",
    },
    {
      title: "Title Scrutiny.",
      subtitle: "Bank-ready reports.",
      desc: "Upload the property file. LexRam maps the ownership chain, flags encumbrances and delivers a report lenders can act on — nothing assumed, everything verifiable.",
      bullets: ["Full ownership chain mapping", "Encumbrance & lien detection", "Bank-ready title scrutiny report", "Nothing assumed, everything verifiable"],
      href: "/dashboard/tsr",
    },
  ];

  const getCardAnim = (i: number) => {
    const d = i - activeIndex;
    const abs = Math.abs(d);
    if (d === 0)   return { x: 0,               rotateY: 0,              scale: 1,    opacity: 1,    zIndex: 10 };
    if (abs === 1) return { x: d * 230,          rotateY: d < 0 ? 35 : -35,  scale: 0.85, opacity: 0.70, zIndex: 5  };
    return           { x: d > 0 ? 430 : -430, rotateY: d < 0 ? 50 : -50, scale: 0.65, opacity: 0.35, zIndex: 1  };
  };

  const prev = () => { lastInteraction.current = Date.now(); setActiveIndex((n) => Math.max(0, n - 1)); };
  const next = () => { lastInteraction.current = Date.now(); setActiveIndex((n) => Math.min(cards.length - 1, n + 1)); };

  return (
    <section id="products" className="py-6 md:py-8 bg-[#d8cdb8] overflow-hidden">
      {/* Section label */}
      <div className="reveal-up text-center mb-0">
        <div className="lex-kicker--bright mb-2">OUR PRODUCTS — LEGAL AI SUITE</div>
        <h2 className="font-serif font-light tracking-tight text-3xl sm:text-4xl md:text-5xl text-[#6b1e2d] leading-tight">
          Three tools. One legal workflow.
        </h2>
      </div>

      {/* 3D Coverflow stage */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ perspective: "1400px", perspectiveOrigin: "50% 50%", height: "460px" }}
      >
        <div
          className="relative w-full flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {cards.map((card, i) => {
            const anim = getCardAnim(i);
            const isActive = i === activeIndex;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  zIndex: anim.zIndex,
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                  cursor: isActive ? "default" : "pointer",
                  width: "340px",
                  transform: `translateX(${anim.x}px) rotateY(${anim.rotateY}deg) scale(${anim.scale})`,
                  opacity: anim.opacity,
                  transition: "transform 520ms cubic-bezier(0.34,1.3,0.64,1), opacity 400ms cubic-bezier(0.4,0,0.2,1)",
                }}
                className="sm:!w-[390px]"
                onClick={() => { if (!isActive) { lastInteraction.current = Date.now(); setActiveIndex(i); } }}
              >
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: "#ffffff",
                    border: isActive ? "1px solid rgba(107, 30, 45,0.18)" : "1px solid rgba(107, 30, 45,0.07)",
                    boxShadow: isActive
                      ? "0 40px 100px -20px rgba(107, 30, 45,0.24), 0 12px 32px -8px rgba(0,0,0,0.14)"
                      : "0 8px 32px -8px rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="font-mono text-[10px] tracking-[0.3em] text-[#6b1e2d]/50 mb-3">
                    {String(i + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}
                  </div>
                  <h3 className="font-serif font-bold italic text-[#6b1e2d] leading-none tracking-tight text-4xl sm:text-5xl">
                    {card.title}
                  </h3>
                  <p className="mt-1 font-serif italic text-xl text-[#6b1e2d]">{card.subtitle}</p>
                  <div className="h-px bg-[#6b1e2d]/15 my-2" />
                  <p className="text-lg text-[#6b1e2d] leading-relaxed">{card.desc}</p>
                  <div className="h-px bg-[#6b1e2d]/15 my-2" />
                  <ul className="space-y-1.5 mb-3">
                    {card.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-lg text-[#3a0d18] font-medium">
                        <span className="shrink-0 text-[#6b1e2d] font-bold mt-0.5">›</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={card.href}
                    className="flex items-center justify-center gap-2 w-full bg-[#CC5500] text-[#d8cdb8] font-semibold py-3 rounded-xl text-lg hover:bg-[#AA4400] transition-colors"
                  >
                    Explore <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-5 mt-3 pb-4">
        <button
          onClick={prev}
          disabled={activeIndex === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 disabled:opacity-30"
          style={{ borderColor: "rgba(107, 30, 45,0.3)", color: "#6b1e2d" }}
        >
          ← Prev
        </button>
        <div className="flex items-center gap-2">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => { lastInteraction.current = Date.now(); setActiveIndex(i); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: activeIndex === i ? "24px" : "6px",
                height: "6px",
                background: activeIndex === i ? "#6b1e2d" : "rgba(107, 30, 45,0.22)",
              }}
            />
          ))}
        </div>
        <button
          onClick={next}
          disabled={activeIndex === cards.length - 1}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 disabled:opacity-30"
          style={{ borderColor: "rgba(107, 30, 45,0.3)", color: "#6b1e2d" }}
        >
          Next →
        </button>
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
    <section className="py-10 md:py-12 bg-[#d8cdb8] overflow-hidden border-y border-[#6b1e2d]/10">
      <div className="reveal-down text-center mb-8">
        <div className="lex-kicker--bright mb-4">SPECIAL TOOLS WITH ADVANCED UNIQUE FEATURES</div>
      </div>
      <div className="relative">
        <div className="flex marquee whitespace-nowrap">
          {[...items, ...items].map((t, i) => (
            <div key={i} className="mx-12 flex items-center gap-12">
              <span className="marquee-word font-serif text-xl md:text-2xl tracking-wider">{t}</span>
              <span className="marquee-diamond text-lg">◆</span>
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
    <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
      {features.map((f, i) => {
        const isOpen = open === i;
        return (
          <button
            key={i}
            onClick={() => setOpen(isOpen ? null : i)}
            className={`fade-up text-left p-7 rounded-xl border transition-all group cursor-pointer ${
              dark
                ? `bg-[#d8cdb8]/5 border-[#d8cdb8]/15 backdrop-blur-sm hover:bg-[#d8cdb8]/10 ${
                    isOpen ? "bg-[#d8cdb8]/15 border-[#6b1e2d]/60" : ""
                  }`
                : `bg-[#d8cdb8] border-[#6b1e2d]/10 hover:border-[#6b1e2d]/40 shadow-soft hover:shadow-elegant ${
                    isOpen ? "border-[#6b1e2d]/60 shadow-elegant" : ""
                  }`
            }`}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-lg grid place-items-center ${
                  dark ? "bg-[#6b1e2d]/20" : "bg-[#6b1e2d]/10"
                }`}
              >
                <f.icon className={`w-5 h-5 ${dark ? "text-[#6b1e2d]" : "text-[#6b1e2d]"}`} />
              </div>
              <Plus
                className={`w-4 h-4 transition-transform ${isOpen ? "rotate-45" : ""} ${
                  dark ? "text-[#d8cdb8]/60" : "text-[#6b1e2d]/82"
                }`}
              />
            </div>
            <h4
              className={`font-serif text-lg font-bold mb-2 ${
                dark ? "text-[#d8cdb8]" : "text-[#6b1e2d]"
              }`}
            >
              {f.t}
            </h4>
            <p
              className={`text-sm leading-relaxed ${
                dark ? "text-[#d8cdb8]/70" : "text-[#6b1e2d]/88"
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
                      ? "border-[#d8cdb8]/15 text-[#d8cdb8]/80"
                      : "border-[#6b1e2d]/10 text-[#6b1e2d]/92"
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
  label, tone = "light", primaryHref = SIGNUP, eventName = "cta_start_trial_click", location, hidePricing = false,
}: {
  label: string;
  tone?: "light" | "dark";
  primaryHref?: string;
  eventName?: CTAEvent;
  location: string;
  hidePricing?: boolean;
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
        className={`lex-btn lex-btn--pricing group ${dark ? "lex-btn--dark" : ""}`}
      >
        {label} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
      </button>
      <a
        href="#contact"
        onClick={() => track("cta_book_demo_click", { location })}
        className={`lex-btn lex-btn--pricing ${dark ? "lex-btn--dark" : ""}`}
      >
        Book a demo
      </a>
      {!hidePricing && (
        <a
          href="/pricing"
          onClick={() => track("cta_see_pricing_click", { location })}
          className={`lex-btn lex-btn--pricing ${dark ? "lex-btn--dark" : ""}`}
        >
          See Pricing
        </a>
      )}
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
    ? "bg-[#6b1e2d] opacity-30"
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
    <section id="research" className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-10 md:py-12 bg-[#d8cdb8] relative overflow-hidden">
      <div aria-hidden className="lex-orb w-[500px] h-[500px] bg-[#6b1e2d]/[0.055] blur-[100px] -top-32 -right-24" />
      <div aria-hidden className="lex-orb-alt w-[350px] h-[350px] bg-[#CC5500]/[0.035] blur-[80px] bottom-0 left-1/4" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-8 lg:gap-14 items-center">

          {/* Left: image */}
          <div className="reveal-right relative rounded-2xl overflow-hidden h-[320px] lg:h-[380px]" style={{ transitionDelay: "80ms" }}>
            <img
              src={researchImg}
              alt="Legal research platform"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Right: heading + description */}
          <div className="flex flex-col justify-center py-6 lg:py-4">
            <div className="reveal-up lex-kicker--bright mb-5">RESEARCH — AI LEGAL RESEARCH ASSISTANT</div>
            <h2 className="reveal-up font-serif font-bold tracking-tight text-[#3a0d18] leading-[1.05] text-4xl sm:text-5xl lg:text-6xl mb-5" style={{ transitionDelay: "80ms" }}>
              Find the right legal answer —<br />verified, not hallucinated
            </h2>
            <p className="reveal-up text-[#3a0d18] text-lg md:text-xl leading-relaxed font-medium" style={{ transitionDelay: "160ms" }}>
              India&rsquo;s AI legal research platform — LexRam searches the largest curated database of Supreme Court judgements and statutes, you can open, read, and rely on in court.
            </p>
            <div className="reveal-up mt-6 flex flex-wrap gap-3" style={{ transitionDelay: "240ms" }}>
              <a
                href="/research"
                onClick={() => track("cta_start_research_click", { location: "landing_research" })}
                className="inline-flex items-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-6 py-3.5 rounded-xl font-semibold hover:opacity-90 transition shadow-[0_4px_22px_rgba(204,85,0,0.45)]"
              >
                Start Research <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}


/* ============================================================
   Drafting
   ============================================================ */
function Drafting() {
  useReveal();
  return (
    <section id="drafting" className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-10 md:py-12 bg-[#d8cdb8] relative overflow-hidden">
      <div aria-hidden className="lex-orb-alt w-[480px] h-[480px] bg-[#6b1e2d]/[0.05] blur-[110px] -top-20 -left-24" />
      <div aria-hidden className="lex-orb w-[300px] h-[300px] bg-[#CC5500]/[0.03] blur-[70px] bottom-12 right-1/3" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-[2fr_3fr] gap-8 lg:gap-14 items-center">

          {/* Left: heading + description */}
          <div className="flex flex-col justify-center py-6 lg:py-4">
            <div className="reveal-up lex-kicker--bright mb-5">LEXDRAFT — AI LEGAL DRAFTING ASSISTANT</div>
            <h2 className="reveal-up font-serif font-bold tracking-tight text-[#3a0d18] leading-[1.05] text-4xl sm:text-5xl lg:text-6xl mb-5" style={{ transitionDelay: "80ms" }}>
              The first draft is &ldquo;already&rdquo; done
            </h2>
            <p className="reveal-up text-[#3a0d18] text-lg md:text-xl leading-relaxed font-medium" style={{ transitionDelay: "160ms" }}>
              Upload your documents. Tell LexRam what petition you need — anticipatory bail, writ under Article&nbsp;226, legal notice, etc. Every draft is backed by real Supreme Court judgements and statutes.
            </p>
            <div className="reveal-up mt-6 flex flex-wrap gap-3" style={{ transitionDelay: "240ms" }}>
              <a
                href="/drafting"
                onClick={() => track("cta_start_drafting_click", { location: "landing_drafting" })}
                className="inline-flex items-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-6 py-3.5 rounded-xl font-semibold hover:opacity-90 transition shadow-[0_4px_22px_rgba(204,85,0,0.45)]"
              >
                Start Drafting <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right: image */}
          <div className="reveal-right relative rounded-2xl overflow-hidden h-[320px] lg:h-[380px]" style={{ transitionDelay: "80ms" }}>
            <img
              src={draftingImg}
              alt="AI legal drafting platform"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

        </div>
      </div>
    </section>
  );
}


/* ============================================================
   Stats
   ============================================================ */
function AnimatedStatItem({
  icon: Icon, raw, suffix, label, delay, inView, borderRight,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  raw: number; suffix: string; label: string;
  delay: number; inView: boolean; borderRight: boolean;
}) {
  const count = useCountUp(raw, inView, delay);
  const display = raw >= 1000
    ? count.toLocaleString("en-IN")
    : String(count);
  return (
    <div
      className="reveal-up flex flex-col items-center text-center px-6 py-4"
      style={{
        borderRight: borderRight ? "1px solid rgba(255,255,255,0.10)" : "none",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        className="w-14 h-14 rounded-full grid place-items-center mb-5"
        style={{ background: "#CC5500" }}
      >
        <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
      </div>
      <span className="block font-bold text-white text-2xl sm:text-3xl mb-1 tabular-nums">
        {raw === 0 ? "0" : display}{suffix}
      </span>
      <span className="text-base font-medium leading-snug" style={{ color: "rgba(255,255,255,0.90)" }}>
        {label}
      </span>
    </div>
  );
}

function Stats() {
  const y = useScrollY();
  const secRef = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(secRef);

  const stats: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    raw: number; suffix: string; label: string; delay: number;
  }[] = [
    { icon: Gavel,        raw: 75,    suffix: "+", label: "Years of SC Judgements Covered",      delay: 0   },
    { icon: CheckCircle2, raw: 0,     suffix: "",  label: "Hallucinated Citations — Guaranteed", delay: 100 },
    { icon: BookOpen,     raw: 50000, suffix: "+", label: "Verified SC Judgements Indexed",       delay: 200 },
    { icon: Scale,        raw: 3,     suffix: "",  label: "Specialised Legal Products",           delay: 300 },
  ];

  return (
    <section
      className="relative py-10 md:py-12 parallax-bg overflow-hidden"
      style={{
        backgroundImage: `url(${parallaxCourt})`,
        backgroundPositionY: `${y * 0.1}px`,
      }}
    >
      <div className="absolute inset-0 bg-[#6b1e2d]/85" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6" ref={secRef}>
        <div
          className="rounded-2xl px-8 py-10"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 stagger-children">
            {stats.map((s, i) => (
              <AnimatedStatItem
                key={i}
                icon={s.icon}
                raw={s.raw}
                suffix={s.suffix}
                label={s.label}
                delay={s.delay}
                inView={inView}
                borderRight={i < stats.length - 1}
              />
            ))}
          </div>
        </div>
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
    { topic: "Research", q: "I am practising at Madras High Court as a Litigant and the one constant frustration has been missing a judgement that opposing counsel finds. LexRam's conflicting judgement detector and bench strength indicator have completely changed how I prepare. I walk into court knowing I haven't missed anything.", a: "Shree Harini H N", r: "MS. 4036/2025 · Research Law Assistant, Madras High Court, Madurai Bench" },
    { topic: "Research", q: "What struck me first was that every result LexRam returned was a real judgement I could open and verify. After years of being burned by AI tools that fabricate citations, that alone made me a convert.", a: "Shyam M", r: "MS. 8227/2024 · Practising at District Court, Trichy, Tamil Nadu" },
    /* Drafting */
    { topic: "Drafting", q: "The draft plan step is what separates LexRam from everything else I've tried. I approve the structure before a single clause is written, so the final draft reflects my strategy, not the AI's interpretation of it.",                                                                                               a: "Johnson S A",          r: "MS. 1958/2023 · Practising at Madras High Court" },
    { topic: "Drafting", q: "The curated questions are remarkably precise. When I asked for an anticipatory bail application, it asked exactly what I would have to ask my senior for grounds, date of arrest, prior bail history, nature of offence. Nothing generic. Nothing wasted.",                                                        a: "Priyanka C",           r: "MS. 1423/2024 · Practising at Madras High Court" },
    { topic: "Drafting", q: "Being able to pull a judgement from Research directly into my draft without switching tabs or reformatting the citation has saved me more time than I can calculate. Research and drafting being one workflow is not a feature, it is the correct way to work.",                                                   a: "Pravin Kumar T",       r: "MS. 2649/2021 · Practising at Madras High Court" },
    { topic: "Drafting", q: "I uploaded a scanned charge sheet and LexRam read it, extracted the relevant facts, and had a bail application draft plan ready. I genuinely did not expect it to work that well.",                                                                                                                                  a: "Sam Dinakaran Manuel", r: "MS. 4232/2025 · Practising at Madras High Court" },
  ];

  const tabs: Topic[] = ["Research", "Drafting"];
  const [tab, setTab] = useState<Topic>("Research");
  const lastInteraction = useRef(0);

  /* Auto-rotate tabs every 9 s — pause for 18 s after manual click. */
  useEffect(() => {
    const iv = setInterval(() => {
      if (Date.now() - lastInteraction.current < 18_000) return;
      setTab(t => t === "Research" ? "Drafting" : "Research");
    }, 9_000);
    return () => clearInterval(iv);
  }, []);

  function pickTab(t: Topic) {
    lastInteraction.current = Date.now();
    setTab(t);
  }

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
    <section id="testimonials" className="min-h-screen py-6 md:py-8 bg-[#d8cdb8] relative overflow-hidden">
      <div aria-hidden className="lex-orb w-[600px] h-[600px] bg-[#6b1e2d]/[0.04] blur-[120px] -top-40 right-0 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="reveal-down lex-kicker--bright mb-2">TESTIMONIALS — FROM ADVOCATES</div>
          <h2 className="reveal-blur font-serif text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#6b1e2d] text-balance" style={{ transitionDelay: "120ms" }}>
            From the advocates who <span className="italic">use it every day</span>.
          </h2>
          <p className="reveal-up mt-2 text-[#6b1e2d]/88 max-w-xl mx-auto" style={{ transitionDelay: "240ms" }}>
            Filter by what they speak about — research, drafting, or our editorial.
          </p>
        </div>

        {/* Tab filter */}
        <div className="reveal-up mb-3 flex justify-center" style={{ transitionDelay: "320ms" }}>
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full border border-[#6b1e2d]/15 bg-[#6b1e2d]/[0.04]">
            {tabs.map((t) => {
              const active = tab === t;
              const count = quotes.filter((q) => q.topic === t).length;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pickTab(t)}
                  className={`topic-tab inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] tracking-[0.15em] uppercase font-medium ${
                    active
                      ? "bg-[#CC5500] text-[#d8cdb8] shadow-soft"
                      : "text-[#6b1e2d]/88 hover:text-[#6b1e2d] hover:bg-[#6b1e2d]/[0.05]"
                  }`}
                >
                  {t}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    active ? "bg-[#6b1e2d]/40 text-[#d8cdb8]" : "bg-[#6b1e2d]/10 text-[#6b1e2d]/82"
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
            className="quote-roll flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 [scrollbar-color:rgba(107, 30, 45,0.3)_transparent] [scrollbar-width:thin]"
          >
            {filtered.map((q, i) => {
              const topicTone = {
                Research: { bar: "bg-[#6b1e2d]", chip: "border-[#6b1e2d]/30 text-[#6b1e2d]" },
                Drafting: { bar: "bg-[#6b1e2d]", chip: "border-[#6b1e2d]/40 text-[#6b1e2d]" },
                Blog:     { bar: "bg-[#6b1e2d]/70", chip: "border-[#6b1e2d]/30 text-[#6b1e2d]" },
              }[q.topic];
              return (
                <figure
                  key={`${tab}-${i}`}
                  className="group relative shrink-0 snap-start w-[280px] sm:w-[340px] lg:w-[400px] rounded-2xl bg-[#d8cdb8] border border-[#6b1e2d]/12 shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all overflow-hidden p-5 sm:p-7"
                >
                  {/* Top accent bar */}
                  <span aria-hidden className={`absolute left-0 top-0 h-[3px] w-16 ${topicTone.bar} group-hover:w-full transition-all duration-500`} />

                  {/* Topic chip */}
                  <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border text-[9.5px] tracking-[0.25em] uppercase ${topicTone.chip}`}>
                    {q.topic}
                  </div>

                  {/* Quote */}
                  <Quote className="w-7 h-7 text-[#6b1e2d] mt-4 opacity-80" />
                  <blockquote className="mt-3 font-serif text-xl md:text-xl italic text-[#3a0d18] leading-relaxed">
                    {q.q}
                  </blockquote>

                  {/* Byline */}
                  <figcaption className="mt-6 pt-5 border-t border-[#6b1e2d]/15 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full grid place-items-center bg-[#6b1e2d]/15 border border-[#6b1e2d]/40 text-[#3a0d18] font-serif text-sm font-bold shrink-0">
                      {initials(q.a)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-serif font-bold text-lg text-[#3a0d18] leading-tight">{q.a}</div>
                      <div className="text-sm text-[#3a0d18]/85 mt-1 leading-snug">{q.r}</div>
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
          {/* fade hint on the right edge */}
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#d8cdb8] to-transparent" />
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
          <CheckCircle2 className="w-5 h-5" />
          {m === "yes (beta)" ? <span className="text-xs">beta</span> : null}
        </span>
      );
    }
    if (m === "no") {
      return <span className="text-[#6b1e2d]/70 font-semibold">—</span>;
    }
    return <span className="text-sm text-[#3a0d18] font-medium italic">{m}</span>;
  };

  return (
    <section id="compare" className="min-h-[calc(100vh-80px)] py-4 md:py-5 bg-[#d8cdb8] flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="reveal-down max-w-3xl mb-3 text-center mx-auto">
          <div className="lex-kicker--bright mb-2">COMPARE — WHERE LEXRAM SITS IN THE MARKET</div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#6b1e2d] leading-tight">
            Compared, plainly.
          </h2>
          <p className="mt-2 text-lg text-[#6b1e2d]/88 leading-relaxed">
            Eleven Indian legal-AI platforms. One axis they don&rsquo;t compete on.
          </p>
        </div>

        <div className="reveal-up overflow-x-auto rounded-xl border border-[#6b1e2d]/10 bg-[#d8cdb8] shadow-soft">
          <table className="w-full text-base border-collapse">
            <thead>
              <tr className="bg-[#CC5500] text-[#d8cdb8]">
                <th scope="col" className="text-left py-1 px-2 font-sans font-semibold min-w-[220px]">
                  Capability
                </th>
                {competitors.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className={`py-1 px-2 font-sans font-semibold text-sm uppercase tracking-wider min-w-[80px] ${
                      c === "LexRam" ? "text-[#3a0d18]" : "text-[#d8cdb8]"
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
                  className={i % 2 === 0 ? "bg-[#d8cdb8] reveal-up" : "bg-[#d8cdb8] reveal-up"}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <th
                    scope="row"
                    className="text-left py-1 px-2 font-semibold text-[#3a0d18] align-top"
                  >
                    {row.feature}
                  </th>
                  {row.cells.map((cell, j) => (
                    <td
                      key={j}
                      className={`py-1 px-2 text-center align-top border-l border-[#6b1e2d]/10 ${
                        j === 0 ? "bg-[#6b1e2d]/10" : ""
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

        <p className="reveal-up mt-3 text-sm text-[#3a0d18]/85 italic max-w-3xl">
          Comparison reflects publicly available product information as of May 2026. Competitor capabilities change frequently.
          We update this table quarterly. To suggest a correction, email{" "}
          <a href="mailto:support@lexram.ai" className="underline hover:text-[#6b1e2d]">
            support@lexram.ai
          </a>
          .
        </p>
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
        { q: "What is LexRam AI — and how is it different from other legal research tools in India?", a: "LexRam is an AI-powered legal platform built exclusively for Indian lawyers. The Indian AI legal Assistant, LexRam uses Supreme Court Judgements and Central statutes as its legal sources and not any open internet sources." },
        { q: "How is LexRam different from ChatGPT or generic AI tools for legal research?",          a: "Generic AI tools generate answers from the internet — and hallucinate. LexRam is trained exclusively on verified Indian legal sources. Every answer traces back to a real SUPREME COURT judgements and central statutes. Nothing is fabricated." },
        { q: "Is LexRam built specifically for Indian law and Indian courts?",                         a: "Yes. Entirely. Not trained on the internet, not an open source legal software. Trained on India's courts — the Supreme Court of India and Indian legislation." },
        { q: "Does LexRam offer a free trial?",                                                        a: "Yes — 50 credits, no payment required. Start your free trial at India's AI legal research platform — LexRam today." },
      ],
    },
    {
      topic: "Research",
      items: [
        { q: "Does LexRam have the latest Supreme Court judgements — how current is the database?",   a: "LexRam covers every Supreme Court judgement since 1950 and updates daily with new Supreme Court of India decisions." },
        { q: "Does LexRam generate fake citations or fabricated case names?",                          a: "No. LexRam only surfaces citations from its verified database i.e Supreme Court Judgements. It does not generate, infer, or fabricate case names or citations — ever. Hence no hallucinated citations or fabricated judges' analysis." },
        { q: "What if two Supreme Court benches have taken opposite views on the same legal point?",   a: "LexRam's per incuriam checker filters out compromised judgements at the source — what reaches you is only the law that holds." },
        { q: "How do I know if the Supreme Court judgement I am relying on is still good law?",        a: "Every judgement in LexRam is marked — affirmed, distinguished, or overruled — so you never argue from a precedent that no longer stands." },
      ],
    },
    {
      topic: "Drafting",
      items: [
        { q: "What documents can I upload for AI legal drafting on LexRam?",                          a: "Any scanned documents including handwritten documents in Indian languages can be uploaded on LexRam. LexRam can read the uploaded documents without any hallucinations." },
        { q: "Do I need to know how to prompt an AI to use LexRam's drafting tool?",                  a: "No. Upload the documents to the designated case in the Case Hub and attach them. Just type the petition you need in plain language by clicking on the draft button in the Search bar. LexRam reads your documents, asks the right questions, and builds the draft." },
        { q: "Will LexRam ask the same questions for every petition type?",                           a: "No. Questions are curated to every petition you request LexRam to draft. A bail application gets anticipatory bail related questions such as \"Does the accused have any prior convictions or pending cases?\". Nothing irrelevant. Nothing missed." },
        { q: "How to draft a bail application using LexRam?",                                         a: "Upload the relevant documents i.e FIR and click on the Draft button in the search bar. Type \"Draft a bail application\" and press enter. LexRam reads your documents, asks the right questions, and builds the draft." },
        { q: "Are the judgements cited in my AI-drafted petition real and verifiable?",               a: "Every judgement cited in your draft traces back to a real, verifiable Indian legal sources which includes Supreme Court judgements and Central Statutes in LexRam's database. The draft reflects your uploaded facts and real SUPREME COURT judgements — not AI guesswork." },
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
    <section id="faq" className="min-h-screen py-6 md:py-8 bg-[#d8cdb8] relative overflow-hidden">
      <div aria-hidden className="lex-orb-alt w-[500px] h-[500px] bg-[#6b1e2d]/[0.04] blur-[100px] top-20 -left-32 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-2">
          <div className="reveal-down lex-kicker--bright mb-2">FAQ — FREQUENTLY ASKED</div>
          <h2 className="reveal-blur font-serif text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#6b1e2d] whitespace-nowrap" style={{ transitionDelay: "120ms" }}>Questions, <span className="italic">answered</span>.</h2>
          <p className="reveal-up mt-2 text-[#6b1e2d]/88 max-w-xl mx-auto" style={{ transitionDelay: "240ms" }}>
            Browse by topic — or scroll the full list below.
          </p>
        </div>

        {/* Topic filter */}
        <div className="reveal-up mb-3 flex justify-center" style={{ transitionDelay: "320ms" }}>
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full border border-[#6b1e2d]/15 bg-[#6b1e2d]/[0.04]">
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
                      ? "bg-[#CC5500] text-[#d8cdb8] shadow-soft"
                      : "text-[#6b1e2d]/88 hover:text-[#6b1e2d] hover:bg-[#6b1e2d]/[0.05]"
                  }`}
                >
                  {t}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    active ? "bg-[#6b1e2d]/40 text-[#d8cdb8]" : "bg-[#6b1e2d]/10 text-[#6b1e2d]/82"
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
              <div className="flex items-center gap-4 mb-2">
                <div className="text-[10px] tracking-[0.3em] uppercase text-[#6b1e2d] font-medium">
                  {group.topic}
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#6b1e2d]/25 to-transparent" />
                <div className="text-[10px] tracking-[0.2em] uppercase text-[#6b1e2d]/78">
                  {group.items.length} {group.items.length === 1 ? "question" : "questions"}
                </div>
              </div>

              <div className="space-y-1.5">
                {group.items.map((f, i) => {
                  const key = `${group.topic}-${i}`;
                  const isOpen = open === key;
                  return (
                    <div
                      key={key}
                      className={`relative rounded-xl border bg-[#d8cdb8] overflow-hidden transition-all ${
                        isOpen
                          ? "border-[#6b1e2d]/45 shadow-elegant"
                          : "border-[#6b1e2d]/12 hover:border-[#6b1e2d]/25 hover:shadow-soft"
                      }`}
                    >
                      {/* Left accent stripe — appears when open */}
                      <span
                        aria-hidden
                        className={`absolute left-0 top-0 bottom-0 w-[3px] bg-[#6b1e2d] transition-transform origin-top duration-300 ${
                          isOpen ? "scale-y-100" : "scale-y-0"
                        }`}
                      />
                      <button
                        onClick={() => {
                          const next = isOpen ? null : key;
                          setOpen(next);
                          track("faq_toggle", { question: f.q, opened: next !== null });
                        }}
                        className="w-full flex items-start justify-between gap-4 px-6 py-3 text-left"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <span className={`mt-1 font-mono text-[11px] tracking-wider shrink-0 ${
                            isOpen ? "text-[#6b1e2d]" : "text-[#6b1e2d]/65"
                          }`}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="font-serif text-xl md:text-2xl font-bold text-[#3a0d18] leading-snug">
                            {f.q}
                          </span>
                        </div>
                        <span className={`grid place-items-center w-7 h-7 rounded-full border shrink-0 transition-all ${
                          isOpen
                            ? "bg-[#6b1e2d] border-[#6b1e2d] text-[#d8cdb8] rotate-180"
                            : "border-[#6b1e2d]/25 text-[#6b1e2d]"
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
                          <div className="px-6 pb-3 pl-[68px] md:pl-[72px]">
                            <p className="text-xl text-[#3a0d18] font-medium leading-relaxed">{f.a}</p>
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


function GetInTouch() {
  const [demo, setDemo] = useState({ name: "", email: "", phone: "", firm: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const onDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track("cta_book_demo_click", { location: "contact_section" });
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative py-10 md:py-12 bg-[#d8cdb8] overflow-hidden" style={{ scrollMarginTop: "80px" }}>
      <div aria-hidden className="lex-orb absolute top-0 right-0 w-[600px] h-[600px] bg-[#6b1e2d]/6 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div aria-hidden className="lex-orb-alt absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#6b1e2d]/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-16 items-start">

          {/* Left: content */}
          <div className="lg:pt-2">
            <div className="lex-kicker--bright mb-4">CONTACT — GET IN TOUCH</div>
            <h2 className="font-serif font-light tracking-tight text-[#6b1e2d] leading-tight text-3xl sm:text-4xl md:text-5xl">
              Have a<br />question?<br /><em className="italic text-[#6b1e2d]">We&apos;re here.</em>
            </h2>
            <p className="mt-6 text-base md:text-lg text-[#6b1e2d]/85 leading-relaxed">
              Whether you want a chambers walkthrough, are exploring a firm-wide rollout, or just have a question about how Lexram works — write to us. We reply within one working day.
            </p>
          </div>

          {/* Right: Book a Demo card */}
          <div className="relative">
            {submitted ? (
              <div className="rounded-2xl bg-[#6b1e2d] border border-[#6b1e2d]/20 shadow-elegant p-10 flex flex-col items-center justify-center text-center min-h-[480px] gap-5">
                <div className="w-16 h-16 rounded-full bg-[#6b1e2d]/20 border border-[#6b1e2d]/30 grid place-items-center">
                  <CheckCircle2 className="w-8 h-8 text-[#6b1e2d]" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#d8cdb8]">Demo booked!</h3>
                <p className="text-base text-[#d8cdb8]/70 max-w-xs leading-relaxed">
                  We&apos;ve received your request. Our team will reach out within one working day to confirm the time.
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[#d8cdb8]/40 tracking-widest uppercase">
                  <div className="h-px w-6 bg-[#6b1e2d]" />
                  LexRam Team
                  <div className="h-px w-6 bg-[#6b1e2d]" />
                </div>
              </div>
            ) : (
              <form
                onSubmit={onDemoSubmit}
                className="relative rounded-2xl bg-[#6b1e2d] border border-[#6b1e2d]/20 shadow-elegant overflow-hidden"
              >
                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-[#6b1e2d] via-[#e06040] to-[#6b1e2d]" />

                <div className="p-8 md:p-10">
                  {/* Header */}
                  <div className="mb-7">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#CC5500]">Contact</span>
                      <span className="h-px w-8 bg-[#CC5500]/40" />
                    </div>
                    <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                      Book a Demo
                    </h3>
                    <p className="mt-2 text-sm text-[#d8cdb8]/75 leading-relaxed">
                      See LexRam in action — tailored to your practice. Our team will walk you through Research, Drafting, and TSR live.
                    </p>
                  </div>

                  {/* Fields */}
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#d8cdb8]/85 mb-1.5">Full Name <span className="text-[#6b1e2d]">*</span></span>
                        <input
                          type="text" required
                          value={demo.name}
                          onChange={(e) => setDemo((d) => ({ ...d, name: e.target.value }))}
                          placeholder="Adv. A. Mehta"
                          className="w-full px-4 py-3 rounded-lg bg-[#d8cdb8]/8 border border-[#d8cdb8]/15 text-[#d8cdb8] placeholder:text-[#d8cdb8]/30 focus:outline-none focus:border-[#6b1e2d] focus:bg-[#d8cdb8]/12 transition text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#d8cdb8]/85 mb-1.5">Email <span className="text-[#6b1e2d]">*</span></span>
                        <input
                          type="email" required
                          value={demo.email}
                          onChange={(e) => setDemo((d) => ({ ...d, email: e.target.value }))}
                          placeholder="you@chambers.in"
                          className="w-full px-4 py-3 rounded-lg bg-[#d8cdb8]/8 border border-[#d8cdb8]/15 text-[#d8cdb8] placeholder:text-[#d8cdb8]/30 focus:outline-none focus:border-[#6b1e2d] focus:bg-[#d8cdb8]/12 transition text-sm"
                        />
                      </label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#d8cdb8]/85 mb-1.5">Phone</span>
                        <input
                          type="tel"
                          value={demo.phone}
                          onChange={(e) => setDemo((d) => ({ ...d, phone: e.target.value }))}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-3 rounded-lg bg-[#d8cdb8]/8 border border-[#d8cdb8]/15 text-[#d8cdb8] placeholder:text-[#d8cdb8]/30 focus:outline-none focus:border-[#6b1e2d] focus:bg-[#d8cdb8]/12 transition text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#d8cdb8]/85 mb-1.5">Firm / Chambers</span>
                        <input
                          type="text"
                          value={demo.firm}
                          onChange={(e) => setDemo((d) => ({ ...d, firm: e.target.value }))}
                          placeholder="Optional"
                          className="w-full px-4 py-3 rounded-lg bg-[#d8cdb8]/8 border border-[#d8cdb8]/15 text-[#d8cdb8] placeholder:text-[#d8cdb8]/30 focus:outline-none focus:border-[#6b1e2d] focus:bg-[#d8cdb8]/12 transition text-sm"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#d8cdb8]/85 mb-1.5">What would you like to see?</span>
                      <textarea
                        rows={3}
                        value={demo.message}
                        onChange={(e) => setDemo((d) => ({ ...d, message: e.target.value }))}
                        placeholder="Research, Drafting, TSR — or all three…"
                        className="w-full px-4 py-3 rounded-lg bg-[#d8cdb8]/8 border border-[#d8cdb8]/15 text-[#d8cdb8] placeholder:text-[#d8cdb8]/30 focus:outline-none focus:border-[#6b1e2d] focus:bg-[#d8cdb8]/12 transition text-sm resize-none"
                      />
                    </label>
                  </div>

                  {/* Submit */}
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <p className="text-[11px] text-[#d8cdb8]/35 leading-relaxed max-w-[200px]">
                      We reply within one working day.
                    </p>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 bg-[#6b1e2d] hover:bg-[#CC5500] text-[#d8cdb8] px-6 py-3 rounded-lg font-semibold text-sm transition-colors shadow-[0_8px_24px_-8px_rgba(107, 30, 45,0.5)]"
                    >
                      Book Demo <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

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
    <footer className="bg-[#6b1e2d] text-[#d8cdb8]/70 border-t border-[#d8cdb8]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">

        {/* ── Main grid: brand+contact left, nav columns right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 lg:gap-10 stagger-children">

          {/* Col 1: Brand + contact + social */}
          <div className="flex flex-col gap-4">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#d8cdb8] tracking-tight" style={{ textShadow: "0 2px 24px rgba(107, 30, 45,0.65), 0 1px 8px rgba(0,0,0,0.55)" }}>LexRam</span>
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
            {/* Social icons */}
            <div className="flex items-center gap-2.5 pt-1 stagger-children">
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
              <li><a href="#research"       className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Research</a></li>
              <li><a href="#drafting"       className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Drafting</a></li>
              <li><a href="/sign-in"  className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">TSR</a></li>
            </ul>
          </div>

          {/* Col 3: Information */}
          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#CC5500] mb-3">Information</p>
            <ul className="space-y-3 text-sm">
              <li><a href="/blog" className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Blog</a></li>
              <li><a href="#faq"  className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Col 4: Policy */}
          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#CC5500] mb-3">Policy</p>
            <ul className="space-y-3 text-sm">
              <li><a href="/privacy"       className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Privacy</a></li>
              <li><a href="/terms"         className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Terms</a></li>
              <li><a href="/refund-policy" className="text-[#d8cdb8]/90 hover:text-[#d8cdb8] transition-colors">Refund</a></li>
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
/* ============================================================
   Page
   ============================================================ */
export default function LandingPage() {
  useReveal();
  useLenis();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div>
      <Nav />
      <ScrollProgress />
      <PageSidebarNav items={[
        { id: "products",     icon: LayoutGrid,    label: "Products"   },
        { id: "research",     icon: Search,        label: "Research"   },
        { id: "drafting",     icon: FileText,      label: "Drafting"   },
        { id: "compare",      icon: Scale,         label: "Compare"    },
        { id: "testimonials", icon: MessageSquare, label: "Reviews"    },
        { id: "faq",          icon: HelpCircle,    label: "FAQ"        },
        { id: "contact",      icon: Mail,          label: "Contact"    },
      ]} />
      <main data-landing-v2 className={`bg-[#d8cdb8] overflow-x-hidden ${mounted ? "lex-page-enter" : "opacity-0"}`}>
        <Hero />
        <TrustStrip />
        <ProductCards />
        <Research />
        <Drafting />
        {/* <Resources /> — temporarily hidden; re-enable when section is finalised */}
        <MarketComparison />
        <Stats />
        <Stories />
        <FAQ />
        <GetInTouch />
        {/* <CTA /> — removed; final closing message lives in the maroon GetInTouch section */}
        <Footer />
      </main>
    </div>
  );
}

