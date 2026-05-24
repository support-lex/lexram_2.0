"use client";

import type * as React from "react";
import { useEffect, useState } from "react";
import {
  Search, FileText, Scale, Shield, Sparkles, BookOpen, Gavel,
  CheckCircle2, ArrowRight, Quote, Plus, Minus, Star, Zap,
  Library, PenTool, Users, Download, Bookmark,
  Calendar, TrendingUp, FileSearch, Layers,
  Mail, Phone, Clock, Send, MessageSquare,
} from "lucide-react";
import { track } from "@/lib/landing-analytics";

/* Asset paths — copied into /public/landing/ */
const researchImg   = "/landing/research-img.jpg";
const draftingImg   = "/landing/drafting-img.jpg";
const parallaxCourt = "/landing/parallax-court.jpg";

/* Route helpers — keep CTAs honest about where they lead */
const SIGNUP = "/sign-in?intent=signup";
const RESEARCH = "/dashboard/research-2";
const RESOURCES = "/dashboard/search";
const BLOG = "/blog";
const CONTACT = "/contact";

const go = (href: string) => {
  if (typeof window !== "undefined") window.location.href = href;
};

/* ============================================================
   Helpers — reveal-on-scroll + parallax scrollY
   ============================================================ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(
      '[data-landing-v2] .fade-up, [data-landing-v2] .reveal-up, [data-landing-v2] .reveal-down, [data-landing-v2] .reveal-left, [data-landing-v2] .reveal-right, [data-landing-v2] .reveal-zoom, [data-landing-v2] .reveal-blur, [data-landing-v2] .reveal-tilt, [data-landing-v2] .reveal-rise, [data-landing-v2] .zig-row, [data-landing-v2] .paper-lift',
    );
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add("in-view"));
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
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
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#fff0df]/70 border-b border-[#680318]/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-warm grid place-items-center shadow-soft">
            <Scale className="w-4 h-4 text-[#fff0df]" />
          </div>
          <span className="font-serif text-xl font-bold text-[#680318]">
            LexRam<span className="text-[#b94826]">.</span>ai
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#680318]/80">
          <a href="#research"  className="hover:text-[#680318] transition">Research</a>
          <a href="#drafting"  className="hover:text-[#680318] transition">Drafting</a>
          <a href="#resources" className="hover:text-[#680318] transition">Resources</a>
          <a href="#blog"      className="hover:text-[#680318] transition">Blog</a>
          <a href="#pricing"   className="hover:text-[#680318] transition">Pricing</a>
          <a href="#faq"       className="hover:text-[#680318] transition">FAQ</a>
          <a href="#contact"   className="hover:text-[#680318] transition">Contact</a>
        </nav>
        <button
          onClick={() => {
            track("cta_start_trial_click", { location: "nav" });
            go(SIGNUP);
          }}
          className="inline-flex items-center gap-2 bg-[#680318] text-[#fff0df] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#b94826] transition shadow-soft"
        >
          Free Trial <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

/* ============================================================
   Hero
   ============================================================ */
function Hero() {
  const y = useScrollY();
  return (
    <section className="relative min-h-screen overflow-hidden flex items-center pt-16">
      <div
        aria-hidden
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${parallaxCourt})`,
          transform: `translate3d(0, ${y * 0.3}px, 0) scale(1.1)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#680318]/85 via-[#680318]/70 to-[#680318]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(42,26,28,0.6)_100%)]" />

      <div
        className="relative max-w-6xl mx-auto px-6 py-32 text-[#fff0df]"
        style={{
          transform: `translateY(${y * -0.15}px)`,
          opacity: Math.max(0, 1 - y / 600),
        }}
      >
        <h1 className="reveal-up font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.02] text-balance">
          You argue the case.
          <br />
          <span className="italic text-[#fff0df]/90">We'll find</span>{" "}
          <span className="text-[#b94826]">the law.</span>
        </h1>
        <p className="reveal-up mt-8 text-lg md:text-2xl text-[#fff0df]/80 max-w-2xl font-light leading-relaxed" style={{ transitionDelay: "180ms" }}>
          From statute to submission — without leaving Lexram. Research judgements, draft pleadings, manage matters, trace titles, and grow your network — one platform, built on India's courts alone.
        </p>
        <div className="reveal-blur mt-12 flex flex-wrap gap-4" style={{ transitionDelay: "360ms" }}>
          <button
            onClick={() => {
              track("cta_start_trial_click", { location: "hero" });
              go(SIGNUP);
            }}
            className="group inline-flex items-center gap-3 bg-[#fff0df] text-[#680318] px-7 py-4 rounded-md font-semibold hover:bg-[#b94826] hover:text-[#fff0df] transition-all shadow-elegant"
          >
            Start Free Trial{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
          <a
            href="#research"
            className="inline-flex items-center gap-3 border border-[#fff0df]/40 text-[#fff0df] px-7 py-4 rounded-md font-medium hover:bg-[#fff0df]/10 transition"
          >
            See how it works
          </a>
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
    "SUPREME COURT OF INDIA", "MADRAS HIGH COURT", "DELHI HIGH COURT",
    "BOMBAY HIGH COURT", "DPDP ACT COMPLIANT", "DISTRICT COURTS",
    "CENTRAL STATUTES", "VERIFIED CITATIONS",
  ];
  return (
    <section className="py-10 bg-[#680318] text-[#fff0df]/80 overflow-hidden border-y border-[#b94826]/30">
      <div className="reveal-down text-center text-xs tracking-[0.3em] mb-6 text-[#fff0df]/60">
        AI POWERED LEGAL TOOLS FOR
      </div>
      <div className="relative">
        <div className="flex marquee whitespace-nowrap">
          {[...items, ...items].map((t, i) => (
            <div key={i} className="mx-10 flex items-center gap-10">
              <span className="font-serif text-lg tracking-wider">{t}</span>
              <span className="text-[#b94826]">◆</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Parallax band
   ============================================================ */
function ParallaxBand({
  image, title, kicker,
}: { image: string; title: string; kicker: string }) {
  return (
    <section
      className="relative h-[60vh] parallax-bg flex items-center"
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#680318]/90 via-[#680318]/60 to-transparent" />
      <div className="relative max-w-6xl mx-auto px-6 text-[#fff0df]">
        <div className="text-xs tracking-[0.3em] text-[#b94826] mb-4">{kicker}</div>
        <h2 className="font-serif text-4xl md:text-6xl font-bold max-w-3xl text-balance leading-tight">
          {title}
        </h2>
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
    <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
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
  | "cta_talk_sales_click";

function SectionCTA({
  label, tone = "light", primaryHref = SIGNUP, secondaryHref = SIGNUP, eventName = "cta_start_trial_click", location,
}: {
  label: string;
  tone?: "light" | "dark";
  primaryHref?: string;
  secondaryHref?: string;
  eventName?: CTAEvent;
  location: string;
}) {
  const dark = tone === "dark";
  return (
    <div className="fade-up mt-14 flex flex-wrap items-center gap-4">
      <button
        onClick={() => {
          track(eventName, { location });
          go(primaryHref);
        }}
        className={`group inline-flex items-center gap-3 px-7 py-4 rounded-md font-semibold transition shadow-elegant ${
          dark
            ? "bg-[#fff0df] text-[#680318] hover:bg-[#b94826] hover:text-[#fff0df]"
            : "bg-[#680318] text-[#fff0df] hover:bg-[#b94826]"
        }`}
      >
        {label} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
      </button>
      <button
        onClick={() => {
          track("cta_book_demo_click", { location });
          go(secondaryHref);
        }}
        className={`inline-flex items-center gap-2 px-5 py-4 rounded-md font-medium border transition ${
          dark
            ? "border-[#fff0df]/30 text-[#fff0df] hover:bg-[#fff0df]/10"
            : "border-[#680318]/30 text-[#680318] hover:bg-[#680318]/5"
        }`}
      >
        Book a demo
      </button>
    </div>
  );
}

/* ============================================================
   Research
   ============================================================ */
function Research() {
  useReveal();
  return (
    <section id="research" className="py-32 bg-[#fff0df] relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="reveal-left text-xs tracking-[0.3em] text-[#b94826] mb-4">01 — RESEARCH</div>
            <h2 className="reveal-up font-serif text-4xl md:text-5xl font-bold text-[#680318] leading-tight" style={{ transitionDelay: "120ms" }}>
              Find the right legal answer — <span className="italic">verified</span>, not hallucinated.
            </h2>
            <p className="reveal-up mt-6 text-lg text-[#680318]/70 leading-relaxed" style={{ transitionDelay: "240ms" }}>
              Lexram searches India's largest curated legal database and returns answers anchored to real documents you can open, read, and rely on in court.
            </p>
            <div className="mt-8">
              <div className="reveal-down flex items-center gap-3 mb-4" style={{ transitionDelay: "360ms" }}>
                <div className="text-[10px] tracking-[0.3em] uppercase text-[#680318]/60">
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
                  { t: "SC Judgements",   s: "Since 1950",                       icon: Gavel },
                  { t: "Central Statutes", s: "BNS / IPC · BNSS / CrPC · BSA / IEA", icon: Scale },
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
            <div className="reveal-up mt-5 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ transitionDelay: "1000ms" }}>
              <button
                type="button"
                onClick={() => {
                  track("cta_start_research_click", { location: "research_to_testimonials" });
                  /* Set hash so Stories switches to the Research tab, then
                     smooth-scroll the target into view. */
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
          <div className="reveal-right relative" style={{ transitionDelay: "200ms" }}>
            <div className="absolute -inset-6 bg-gradient-warm opacity-20 blur-3xl rounded-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={researchImg}
              alt="Legal research"
              loading="lazy"
              width={1280}
              height={896}
              className="relative rounded-2xl shadow-elegant w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>

        <ResearchCapabilities />
      </div>
    </section>
  );
}

/* ============================================================
   Research capabilities — interactive index + preview
   ============================================================ */
function ResearchCapabilities() {
  const [active, setActive] = useState(0);

  const items = [
    {
      n: "01",
      t: "Case hub",
      d: "All your matters, research threads, and saved judgements in one organised workspace.",
      visual: (
        <div className="space-y-2">
          {[
            { name: "Sharma v. State of Tamil Nadu", meta: "3 threads · 12 authorities", status: "Active" },
            { name: "Lakshmi Estate — title trace",  meta: "1 thread · 4 authorities",   status: "Active" },
            { name: "ABC Ltd. v. Banking Ombudsman", meta: "5 threads · 19 authorities", status: "Closed" },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg border border-[#680318]/10 bg-[#fff0df]/40">
              <div className="w-8 h-8 rounded-md grid place-items-center bg-[#680318]/10">
                <FileSearch className="w-4 h-4 text-[#680318]" />
              </div>
              <div className="flex-1 min-w-0">
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
      t: "Drafting integrated",
      d: "Move from research to pleading without switching tools.",
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
      n: "03",
      t: "Upload files, any volume",
      d: "Lexram reads, indexes, and makes them searchable instantly.",
      visual: (
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-[#680318]/25 bg-[#fff0df]/30 p-6 text-center">
            <Layers className="w-6 h-6 text-[#680318]/60 mx-auto" />
            <div className="text-sm font-medium text-[#680318] mt-2">Drop files, any volume</div>
            <div className="text-[11px] text-[#680318]/55 mt-1">PDFs · scans · charge sheets · prior orders</div>
          </div>
          <div className="space-y-2">
            {[
              { name: "charge_sheet_2024.pdf", meta: "142 pages",   state: "Indexed",     pct: 100 },
              { name: "prior_orders.zip",       meta: "11 files",    state: "Indexing",    pct: 47 },
              { name: "fir_madurai.jpg",        meta: "Scan · OCR",  state: "OCR'd",       pct: 100 },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md border border-[#680318]/10 bg-[#fff0df]/40">
                <FileText className="w-4 h-4 text-[#680318]/70 shrink-0" />
                <div className="flex-1 min-w-0">
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
      n: "04",
      t: "Navigate cases anytime",
      d: "Your entire research history is preserved and searchable.",
      visual: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#680318]/15 bg-[#fff0df]/40">
            <Search className="w-4 h-4 text-[#680318]/60" />
            <span className="text-sm text-[#680318]/80 font-light">section 138 NI Act bounce defence</span>
            <span className="ml-auto text-[10px] tracking-wider uppercase text-[#680318]/45">history</span>
          </div>
          <div className="space-y-3">
            {[
              { day: "Today",       items: [{ time: "14:32", q: "section 138 NI Act bounce defence", n: "12 results" }] },
              { day: "Yesterday",   items: [
                { time: "18:01", q: "Kesavananda basic structure ratio",        n: "8 results" },
                { time: "09:45", q: "specific performance limitation period",   n: "4 results" },
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
  ];

  return (
    <div className="mt-24">
      <div className="mb-10">
        <div className="reveal-down text-xs tracking-[0.3em] text-[#b94826] mb-3">CAPABILITIES</div>
        <h3 className="reveal-blur font-serif text-3xl md:text-4xl font-bold text-[#680318] leading-tight max-w-2xl" style={{ transitionDelay: "120ms" }}>
          Built like a workspace — not a search box.
        </h3>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.25fr] gap-10 lg:gap-16 items-start">
        {/* Left: numbered index */}
        <div className="lg:sticky lg:top-24">
          {items.map((item, i) => {
            const isActive = active === i;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="reveal-left group relative w-full text-left flex items-start gap-5 py-6 border-b border-[#680318]/10 transition-all"
                style={{ transitionDelay: `${200 + i * 110}ms` }}
              >
                {/* Hover popup */}
                <div className="cap-popup absolute z-30 left-12 -top-3 md:left-auto md:right-2 md:-top-4 w-max max-w-[240px]">
                  <div className="relative rounded-lg border border-[#680318]/15 bg-[#fff0df] shadow-elegant px-3.5 py-2.5">
                    <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase">
                      <span className="font-mono text-[#b94826]">{item.n}</span>
                      <span className="w-px h-3 bg-[#680318]/20" />
                      <span className="text-[#680318]/70">Click to preview</span>
                      <ArrowRight className="w-3 h-3 text-[#b94826]" />
                    </div>
                    <span aria-hidden className="absolute -bottom-1 left-6 md:left-auto md:right-6 w-2 h-2 rotate-45 bg-[#fff0df] border-r border-b border-[#680318]/15" />
                  </div>
                </div>
                <div className="relative pl-3">
                  <span
                    key={`mark-${i}-${isActive}`}
                    className={`absolute left-0 top-1.5 h-6 w-[2px] rounded-r transition-all ${
                      isActive ? "bg-[#b94826] cap-mark" : "bg-transparent"
                    }`}
                  />
                  <span className={`text-xs font-mono pt-1 transition-colors ${isActive ? "text-[#b94826]" : "text-[#680318]/50"}`}>
                    {item.n}
                  </span>
                </div>
                <div className="flex-1">
                  <div className={`font-serif text-xl md:text-2xl font-bold transition-colors ${isActive ? "text-[#b94826]" : "text-[#680318]"}`}>
                    {item.t}
                  </div>
                  <div className="text-sm leading-relaxed text-[#680318]/70 mt-2">
                    {item.d}
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

        {/* Right: live preview */}
        <div className="reveal-tilt relative" style={{ transitionDelay: "260ms" }}>
          <div aria-hidden className="absolute -inset-8 bg-gradient-warm opacity-25 blur-3xl rounded-full pointer-events-none" />
          <div className="relative rounded-2xl border border-[#680318]/15 bg-[#fff0df] shadow-elegant overflow-hidden min-h-[440px]">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#680318]/10 bg-[#680318]/[0.03]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#b94826]/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#680318]/15" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#680318]/15" />
              <div key={`label-${active}`} className="swap-label ml-auto text-[10px] tracking-[0.2em] text-[#680318]/55 uppercase">
                {items[active].n} · {items[active].t}
              </div>
            </div>
            <div key={active} className="swap-in p-6 md:p-8">
              {items[active].visual}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Lexram Edge — bento grid on dark backdrop
   ============================================================ */
type EdgeFeature = {
  n: string;
  t: string;
  d: string;
  icon: React.ComponentType<{ className?: string }>;
};

function LexramEdge() {
  useReveal();
  const features: EdgeFeature[] = [
    { n: "01", t: "Verification",              d: "Every answer is anchored to a real document you can open and verify. Lexram surfaces existing citations — it never generates one.", icon: Shield },
    { n: "02", t: "Ratio decidendi extractor", d: "Isolates only the binding legal ratio from a judgement. You get the law, not the noise.",                                           icon: Scale },
    { n: "03", t: "Per incuriam test",         d: "Flagged instantly — so you're never blindsided by a precedent you didn't know existed.",                                          icon: Sparkles },
    { n: "04", t: "Precedent map",             d: "The precedent history tells you why the law is what it is.",                                                                       icon: TrendingUp },
    { n: "05", t: "Tested & curated",          d: "Not trained on the internet. Trained on India's courts.",                                                                          icon: BookOpen },
  ];

  return (
    <section id="lexram-edge" className="relative py-32 overflow-hidden bg-[#fff0df]">
      <div aria-hidden className="absolute top-1/4 -left-32 w-[520px] h-[520px] bg-[#b94826] opacity-10 blur-[160px] rounded-full pointer-events-none" />
      <div aria-hidden className="absolute bottom-0 -right-32 w-[520px] h-[520px] bg-[#b94826] opacity-[0.08] blur-[180px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 text-[#680318]">
        <div className="fade-up max-w-3xl">
          <div className="text-xs tracking-[0.3em] text-[#b94826] mb-4">LEXRAM EDGE</div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
            Every citation is real. <span className="italic text-[#b94826]">Every source is open.</span>
          </h2>
          <p className="mt-6 text-lg text-[#680318]/70 leading-relaxed max-w-2xl">
            Five reasons litigators trust Lexram with court-bound research.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-6 gap-4 md:auto-rows-[180px]">
          <BentoCard f={features[0]} className="md:col-span-4 md:row-span-2 reveal-rise" hero />
          <BentoCard f={features[1]} className="md:col-span-2 reveal-zoom" delayMs={120} />
          <BentoCard f={features[2]} className="md:col-span-2 reveal-zoom" delayMs={240} />
          <BentoCard f={features[3]} className="md:col-span-3 reveal-left" delayMs={360} />
          <BentoCard f={features[4]} className="md:col-span-3 reveal-right" delayMs={480} />
        </div>

        <div className="mt-14 fade-up flex flex-wrap items-center gap-4">
          <button
            onClick={() => {
              track("cta_start_trial_click", { location: "lexram_edge" });
              go(SIGNUP);
            }}
            className="group inline-flex items-center gap-3 bg-[#680318] text-[#fff0df] px-7 py-4 rounded-md font-semibold hover:bg-[#b94826] transition-all shadow-elegant"
          >
            Start Free Trial <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
          <a
            href="#pricing"
            className="inline-flex items-center gap-3 border border-[#680318]/30 text-[#680318] px-6 py-4 rounded-md font-medium hover:bg-[#680318]/5 transition"
          >
            See pricing
          </a>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  f, className = "", hero = false, delayMs = 0,
}: { f: EdgeFeature; className?: string; hero?: boolean; delayMs?: number }) {
  return (
    <div
      className={`group relative rounded-2xl border border-[#680318]/12 bg-[#fff0df] shadow-soft p-6 md:p-7 overflow-hidden hover:border-[#b94826]/50 hover:shadow-elegant hover:-translate-y-0.5 transition-all ${className}`}
      style={{ transitionDelay: delayMs ? `${delayMs}ms` : undefined }}
    >
      <div aria-hidden className="absolute -top-20 -right-20 w-52 h-52 bg-[#b94826] opacity-0 group-hover:opacity-15 blur-3xl transition-opacity duration-500 rounded-full pointer-events-none" />
      {hero && (
        <div aria-hidden className="absolute -bottom-24 -left-16 w-72 h-72 bg-[#b94826] opacity-10 blur-3xl rounded-full pointer-events-none" />
      )}

      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#680318]/10 border border-[#680318]/15 group-hover:bg-[#b94826]/15 group-hover:border-[#b94826]/40 transition-colors">
            <f.icon className="w-5 h-5 text-[#680318] group-hover:text-[#b94826] transition-colors" />
          </div>
          <span className="text-[10px] font-mono tracking-wider text-[#680318]/45">{f.n}</span>
        </div>
        <div className={`font-serif font-bold leading-tight text-[#680318] ${hero ? "text-3xl md:text-4xl" : "text-xl"}`}>
          {f.t}
        </div>
        <p className={`mt-3 leading-relaxed text-[#680318]/70 ${hero ? "text-base md:text-lg max-w-xl" : "text-sm"}`}>
          {f.d}
        </p>
        {hero && (
          <div className="mt-auto pt-6 flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase text-[#680318]/60">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-[#b94826]" /> Anchored</span>
            <span className="w-1 h-1 rounded-full bg-[#680318]/30" />
            <span>Zero hallucinations</span>
            <span className="w-1 h-1 rounded-full bg-[#680318]/30" />
            <span>Court-ready</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Drafting
   ============================================================ */
function Drafting() {
  useReveal();
  const manuscript = [
    { t: "Multi-document upload",      d: "Lexram reads across all of them and builds one coherent draft." },
    { t: "Scan to draft",              d: "Lexram indexes the scan and builds the response straight from it." },
    { t: "Fact extraction engine",     d: "Lexram doesn't just read the document — it maps who, what, when, and which section, parties, citations, and events." },
    { t: "Response document builder",  d: "Structured exactly as the responding court or forum expects — every time." },
    { t: "Edit at 2 stages",           d: "Draft plan and final draft are fully editable before export." },
    { t: "Research integration",       d: "Pull research into your draft with one click. No fake citations." },
  ];
  return (
    <section id="drafting" className="py-32 bg-[#680318] text-[#fff0df] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(185,72,38,0.3),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="reveal-left order-2 lg:order-1 relative">
            <div className="absolute -inset-6 bg-[#b94826] opacity-30 blur-3xl rounded-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draftingImg}
              alt="Drafting"
              loading="lazy"
              width={1280}
              height={896}
              className="relative rounded-2xl shadow-elegant w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="order-1 lg:order-2">
            <div className="reveal-right text-xs tracking-[0.3em] text-[#b94826] mb-4">LEXDRAFT — AI LEGAL DRAFTING ASSISTANT</div>
            <h2 className="reveal-up font-serif text-4xl md:text-5xl font-bold leading-tight" style={{ transitionDelay: "120ms" }}>
              The first draft is <span className="italic text-[#b94826]">&ldquo;already&rdquo;</span> done.
            </h2>
            <p className="reveal-up mt-6 text-lg text-[#fff0df]/80 leading-relaxed" style={{ transitionDelay: "240ms" }}>
              Upload your documents. Tell Lexram what petition you need — anticipatory bail, writ under Article 226, legal notice, reply to charge sheet. Every argument is backed by a real Supreme Court judgement. Done.
            </p>
            <div className="reveal-blur" style={{ transitionDelay: "380ms" }}>
              <SectionCTA
                label="Start Drafting"
                tone="dark"
                primaryHref={RESEARCH}
                eventName="cta_start_research_click"
                location="drafting_section"
              />
            </div>
            <div className="reveal-up mt-5 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ transitionDelay: "500ms" }}>
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
        </div>

        {/* Database — ledger-row pattern (unique to LexDraft) */}
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="reveal-down flex items-center gap-4 mb-8">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#fff0df]/55">Database</div>
            <div className="h-px flex-1 bg-gradient-to-r from-[#fff0df]/30 to-transparent" />
            <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#b94826]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b94826] animate-pulse" />
              Verified sources
            </div>
          </div>

          <div className="space-y-3">
            {[
              { n: "01", t: "SC Judgements",    s: "Since 1950 · refreshed daily",         icon: Gavel },
              { n: "02", t: "Central Statutes", s: "BNS / IPC · BNSS / CrPC · BSA / IEA",  icon: Scale },
            ].map((r, i) => (
              <div
                key={r.t}
                className="ledger-row reveal-left group relative flex items-center gap-5 md:gap-6 py-6 px-5 md:px-7 rounded-lg border border-[#fff0df]/10 bg-[#fff0df]/[0.03] backdrop-blur-sm hover:border-[#b94826]/40 hover:bg-[#fff0df]/[0.06] overflow-hidden"
                style={
                  {
                    transitionDelay: `${i * 180}ms`,
                    "--ud": `${i * 180 + 360}ms`,
                  } as React.CSSProperties
                }
              >
                {/* left-edge sweeping marker */}
                <span aria-hidden className="ledger-mark absolute left-0 top-3 bottom-3 w-[2px] bg-[#b94826]" />

                <span className="text-xs font-mono text-[#b94826]/80 w-7 shrink-0">{r.n}</span>

                <div className="w-11 h-11 rounded-lg grid place-items-center bg-[#b94826]/20 border border-[#b94826]/30 shrink-0">
                  <r.icon className="w-5 h-5 text-[#b94826]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-serif text-xl md:text-2xl font-bold text-[#fff0df] leading-tight">{r.t}</div>
                  <div className="text-sm text-[#fff0df]/65 mt-1">{r.s}</div>
                </div>

                <ArrowRight className="w-5 h-5 text-[#b94826] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all shrink-0" />

                {/* drawing underline */}
                <span aria-hidden className="ledger-ink absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#b94826]/60 to-transparent" />
              </div>
            ))}
          </div>
        </div>

        {/* Features — concertina expand-on-hover panels (unique to LexDraft) */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="reveal-down flex items-center gap-4 mb-10">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#fff0df]/55">Features</div>
            <div className="h-px flex-1 bg-gradient-to-r from-[#fff0df]/30 to-transparent" />
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#b94826]">
              Hover to expand
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:min-h-[380px]">
            {manuscript.map((f, i) => {
              const tinted = i % 2 === 0;
              return (
                <div
                  key={i}
                  className={`reveal-up group relative flex-1 md:hover:flex-[2.6] transition-[flex] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden rounded-2xl border p-5 md:p-6 cursor-default ${
                    tinted
                      ? "bg-[#680318]/45 border-[#fff0df]/12 hover:border-[#b94826]/55"
                      : "bg-transparent border-[#fff0df]/22 hover:border-[#b94826]/55"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  {/* corner glow on hover */}
                  <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 bg-[#b94826] opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500 rounded-full" />

                  <div className="relative flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#b94826]/20 border border-[#b94826]/30 group-hover:bg-[#b94826]/30 transition-colors">
                        <span className="font-mono text-xs text-[#b94826]">{String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <span className="text-[10px] font-mono tracking-wider text-[#fff0df]/40">
                        {String(i + 1).padStart(2, "0")} / 06
                      </span>
                    </div>

                    <h4 className="font-serif text-lg md:text-xl font-bold text-[#fff0df] leading-snug mt-auto">
                      {f.t}
                    </h4>

                    {/* Description: always visible on mobile; reveals on hover on desktop */}
                    <p className="mt-3 text-[13.5px] text-[#fff0df]/70 leading-relaxed md:max-h-0 md:opacity-0 md:group-hover:max-h-48 md:group-hover:opacity-100 transition-all duration-500 md:delay-150 overflow-hidden">
                      {f.d}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-[#b94826] md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 md:delay-300">
                      <span className="w-6 h-px bg-[#b94826]" />
                      Built into LexDraft
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   LexDraft Edge — zigzag split rows on a deep backdrop
   ============================================================ */
function LexDraftEdge() {
  useReveal();
  /* Six edges, each rendered with a different box treatment.
     Variants stay strictly on the 3-color palette (maroon / rust / cream)
     — the variety comes from fill, border, accent placement, not new hues. */
  const items: { t: string; d: string; v: "solid-maroon" | "outline-cream" | "solid-rust" | "stripe-top" | "outline-rust" | "corner-mark" }[] = [
    { v: "solid-maroon",  t: "Research + drafting, one platform", d: "One switch, no gaps. What you find in research goes straight into what you file." },
    { v: "outline-cream", t: "Zero assumptions",                  d: "Lexram builds the draft from what you uploaded — never from what it guesses." },
    { v: "solid-rust",    t: "Structures before it writes",       d: "See the full draft plan before a single clause is written. Edit, approve, then draft." },
    { v: "outline-rust",  t: "Reads your whole case file",        d: "Upload the entire bundle — Lexram reads it all and drafts to the complete picture." },
    { v: "stripe-top",    t: "No fake citations. No invented sections.", d: "Every judgement traces back to a real, openable source. No hallucinations." },
    { v: "corner-mark",   t: "Grounded in judgements",            d: "Every argument is backed by a real SC judgement and your uploaded documents." },
  ];

  const variant = (v: string) => {
    switch (v) {
      case "solid-maroon":
        return { wrap: "bg-[#680318] border border-[#b94826]/40", title: "text-[#fff0df]", body: "text-[#fff0df]/70", num: "text-[#b94826]" };
      case "outline-cream":
        return { wrap: "bg-transparent border border-[#fff0df]/25", title: "text-[#fff0df]", body: "text-[#fff0df]/65", num: "text-[#fff0df]/45" };
      case "solid-rust":
        return { wrap: "bg-[#b94826] border border-[#b94826]", title: "text-[#fff0df]", body: "text-[#fff0df]/85", num: "text-[#fff0df]/70" };
      case "outline-rust":
        return { wrap: "bg-transparent border border-[#b94826]/55", title: "text-[#fff0df]", body: "text-[#fff0df]/70", num: "text-[#b94826]" };
      case "stripe-top":
        return { wrap: "bg-[#fff0df]/[0.05] border border-[#fff0df]/15", title: "text-[#fff0df]", body: "text-[#fff0df]/70", num: "text-[#b94826]" };
      case "corner-mark":
        return { wrap: "bg-[#680318] border border-[#fff0df]/15", title: "text-[#fff0df]", body: "text-[#fff0df]/70", num: "text-[#b94826]" };
    }
    return { wrap: "", title: "", body: "", num: "" };
  };

  return (
    <section id="lexdraft-edge" className="relative py-20 md:py-24 overflow-hidden bg-[#680318] text-[#fff0df]">
      <div aria-hidden className="absolute top-1/3 -left-32 w-[420px] h-[420px] bg-[#b94826] opacity-15 blur-[160px] rounded-full pointer-events-none" />
      <div aria-hidden className="absolute bottom-0 -right-32 w-[420px] h-[420px] bg-[#b94826] opacity-10 blur-[180px] rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Compact header — one row */}
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <div className="reveal-down text-[10px] tracking-[0.3em] text-[#b94826]">LEXRAM EDGE</div>
            <h2 className="reveal-up font-serif text-2xl md:text-3xl font-bold leading-tight mt-2" style={{ transitionDelay: "120ms" }}>
              The edge that makes a draft <span className="italic text-[#b94826]">filable</span>.
            </h2>
          </div>
          <a
            href="#pricing"
            className="hidden md:inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#fff0df]/65 hover:text-[#b94826] transition"
          >
            Pricing <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mixed-style box grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, i) => {
            const s = variant(it.v);
            return (
              <div
                key={i}
                className={`reveal-zoom group relative rounded-xl p-5 md:p-6 overflow-hidden transition-all hover:-translate-y-0.5 ${s.wrap}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {/* Per-variant decoration */}
                {it.v === "stripe-top" && (
                  <span aria-hidden className="absolute left-0 right-0 top-0 h-[3px] bg-[#b94826]" />
                )}
                {it.v === "corner-mark" && (
                  <span aria-hidden className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-[#b94826]/25 blur-xl" />
                )}
                {it.v === "outline-rust" && (
                  <span aria-hidden className="absolute left-5 top-0 w-10 h-[2px] bg-[#b94826]" />
                )}

                <div className="relative flex items-start justify-between gap-3 mb-3">
                  <span className={`text-[10px] font-mono tracking-[0.2em] ${s.num}`}>
                    EDGE / {String(i + 1).padStart(2, "0")}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#b94826] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className={`relative font-serif text-lg md:text-xl font-bold leading-snug ${s.title}`}>
                  {it.t}
                </h3>
                <p className={`relative mt-2 text-[13.5px] leading-relaxed ${s.body}`}>
                  {it.d}
                </p>
              </div>
            );
          })}
        </div>

        {/* Compact CTA */}
        <div className="mt-10 reveal-blur flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              track("cta_start_trial_click", { location: "lexdraft_edge" });
              go(SIGNUP);
            }}
            className="group inline-flex items-center gap-2 bg-[#fff0df] text-[#680318] px-5 py-2.5 rounded-md font-semibold hover:bg-[#b94826] hover:text-[#fff0df] transition-all shadow-elegant text-sm"
          >
            Start Free Trial <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 border border-[#fff0df]/30 text-[#fff0df] px-5 py-2.5 rounded-md font-medium hover:bg-[#fff0df]/10 transition text-sm"
          >
            See pricing
          </a>
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
    <section id="resources" className="py-32 bg-[#fff0df] relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <div className="reveal-left text-xs tracking-[0.3em] text-[#b94826] mb-4">03 — RESOURCES</div>
          <h2 className="reveal-up font-serif text-4xl md:text-5xl font-bold text-[#680318] leading-tight" style={{ transitionDelay: "120ms" }}>
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
   Blog
   ============================================================ */
function Blog() {
  useReveal();
  return (
    <section id="blog" className="py-32 bg-[#680318] text-[#fff0df] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(185,72,38,0.3),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <div className="reveal-right text-xs tracking-[0.3em] text-[#b94826] mb-4">LEGAL BLOGS</div>
          <h2 className="reveal-up font-serif text-4xl md:text-5xl font-bold leading-tight" style={{ transitionDelay: "120ms" }}>
            We don&apos;t report Indian law. <span className="italic text-[#b94826]">We practise it.</span>
          </h2>
          <p className="reveal-up mt-6 text-lg text-[#fff0df]/80 leading-relaxed" style={{ transitionDelay: "240ms" }}>
            Legal opinions written by Indian advocates — not journalists.
          </p>
          <div className="reveal-blur" style={{ transitionDelay: "380ms" }}>
            <SectionCTA
              label="Read the Blog"
              tone="dark"
              primaryHref={BLOG}
              eventName="cta_start_research_click"
              location="blog_section"
            />
          </div>
          <div className="reveal-up mt-5" style={{ transitionDelay: "500ms" }}>
            <button
              type="button"
              onClick={() => {
                track("cta_start_research_click", { location: "blog_to_testimonials" });
                history.replaceState(null, "", "#testimonials-blog");
                window.dispatchEvent(new HashChangeEvent("hashchange"));
                document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group inline-flex items-center gap-2 text-sm font-medium text-[#fff0df] hover:text-[#b94826] transition-colors"
            >
              <Quote className="w-4 h-4 text-[#b94826]" />
              Read editorial testimonials
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>

        {/* Opinion & editorial — magazine layout (unique to Blog) */}
        <div className="mt-20">
          <div className="reveal-down flex items-center gap-4 mb-8">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#fff0df]/55">Opinion &amp; Editorial</div>
            <div className="h-px flex-1 bg-gradient-to-r from-[#fff0df]/30 to-transparent" />
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#b94826]">Written by advocates</div>
          </div>

          <div className="grid md:grid-cols-12 gap-5">
            {/* Featured cover article */}
            <article
              className="paper-lift md:col-span-7 group relative rounded-2xl bg-[#fff0df] text-[#680318] p-8 md:p-12 overflow-hidden shadow-elegant"
            >
              <div className="absolute top-0 right-0 px-3 py-1 bg-[#b94826] text-[#fff0df] text-[10px] tracking-[0.3em] uppercase rounded-bl-lg">
                Featured
              </div>
              <div aria-hidden className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#b94826]/10 blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[#b94826]">
                  <span>OPINION</span>
                  <span className="w-1 h-1 rounded-full bg-[#b94826]/60" />
                  <span className="text-[#680318]/55">Sourced editorial</span>
                </div>
                <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] mt-5 text-balance">
                  Every piece traces back to the full Supreme Court judgement.
                </h3>
                <div className="my-7 h-px w-20 bg-[#680318]/30" />
                <p className="text-base md:text-lg text-[#680318]/75 leading-relaxed max-w-xl">
                  One click, no searching. When we cite a judgement, we link the judgement — para number and all.
                </p>
                <div className="mt-10 flex items-center justify-between">
                  <div className="text-[11px] tracking-[0.2em] uppercase text-[#680318]/55">
                    By the Bench Desk
                  </div>
                  <a
                    href={BLOG}
                    onClick={() => track("cta_start_research_click", { location: "blog_featured" })}
                    className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-[#680318] hover:text-[#b94826] transition-colors"
                  >
                    Read <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </article>

            {/* Right column — 2 stacked supporting articles */}
            <div className="md:col-span-5 flex flex-col gap-5">
              <article
                className="paper-lift group relative flex-1 rounded-2xl border border-[#fff0df]/22 bg-transparent text-[#fff0df] p-6 md:p-7 overflow-hidden"
                style={{ transitionDelay: "180ms" }}
              >
                <div aria-hidden className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#b94826]/0 group-hover:bg-[#b94826]/15 blur-2xl transition-all duration-500" />
                <div className="relative">
                  <div className="text-[10px] tracking-[0.3em] text-[#b94826] mb-3">ANALYSIS</div>
                  <h4 className="font-serif text-xl md:text-2xl font-bold leading-tight">
                    SC judgement analysis
                  </h4>
                  <div className="my-4 h-px w-12 bg-[#b94826]/55" />
                  <p className="text-sm text-[#fff0df]/75 leading-relaxed">
                    Sharp enough for a senior advocate. Clear enough for a first-year.
                  </p>
                  <div className="mt-6 flex items-center justify-between text-[10px] tracking-[0.2em] uppercase">
                    <span className="text-[#fff0df]/55">By practising advocates</span>
                    <ArrowRight className="w-3 h-3 text-[#b94826] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </article>

              <article
                className="paper-lift group relative flex-1 rounded-2xl bg-[#b94826]/15 border border-[#b94826]/45 text-[#fff0df] p-6 md:p-7 overflow-hidden"
                style={{ transitionDelay: "320ms" }}
              >
                <div aria-hidden className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#b94826]/15 blur-2xl pointer-events-none" />
                <div className="relative">
                  <div className="text-[10px] tracking-[0.3em] text-[#fff0df]/75 mb-3">RULING IMPACT</div>
                  <h4 className="font-serif text-xl md:text-2xl font-bold leading-tight">
                    SC ruling — what it means for practice
                  </h4>
                  <div className="my-4 h-px w-12 bg-[#fff0df]/55" />
                  <p className="text-sm text-[#fff0df]/85 leading-relaxed">
                    What changes in Indian law — and what it means for an advocate&apos;s daily practice.
                  </p>
                  <div className="mt-6 flex items-center justify-between text-[10px] tracking-[0.2em] uppercase">
                    <span className="text-[#fff0df]/75">By the Bench Desk</span>
                    <ArrowRight className="w-3 h-3 text-[#fff0df] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
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
      className="relative py-32 parallax-bg text-[#fff0df]"
      style={{
        backgroundImage: `url(${parallaxCourt})`,
        backgroundPositionY: `${y * 0.1}px`,
      }}
    >
      <div className="absolute inset-0 bg-[#680318]/85" />
      <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
        {stats.map((s, i) => (
          <div key={i} className="reveal-zoom" style={{ transitionDelay: `${i * 120}ms` }}>
            <div className="font-serif text-6xl md:text-7xl font-bold text-[#b94826]">{s.n}</div>
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

  type Topic = "Research" | "Drafting" | "Blog";
  type Quote = { q: string; a: string; r: string; topic: Topic };

  const quotes: Quote[] = [
    /* Research */
    { topic: "Research", q: "I have been practising for over two decades and the one constant frustration has been missing a judgement that opposing counsel finds. Lexram's conflicting judgement detector and bench strength indicator have completely changed how I prepare. I walk into court knowing I haven't missed anything.", a: "Shree Harini H N",     r: "MS. 4036/2025 · Research Law Assistant, Madras HC, Madurai Bench" },
    { topic: "Research", q: "What struck me first was that every result Lexram returned was a real judgement I could open and verify. After years of being burned by AI tools that fabricate citations, that alone made me a convert.",                                                                                                          a: "Shyam M",              r: "MS. 8227/2024 · District Court, Trichy, Tamil Nadu" },
    /* Drafting */
    { topic: "Drafting", q: "The draft plan step is what separates Lexram from everything else I've tried. I approve the structure before a single clause is written, so the final draft reflects my strategy, not the AI's interpretation of it.",                                                                                              a: "Johnson S A",          r: "MS. 1958/2023 · Madras High Court" },
    { topic: "Drafting", q: "The curated questions are remarkably precise. When I asked for an anticipatory bail application, it asked exactly what I would have to ask my senior for — grounds, date of arrest, prior bail history, nature of offence. Nothing generic. Nothing wasted.",                                                       a: "Priyanka C",           r: "MS. 1423/2024 · Madras High Court" },
    { topic: "Drafting", q: "Being able to pull a judgement from research directly into my draft without switching tabs or reformatting the citation has saved me more time than I can calculate. Research and drafting being one workflow is not a feature — it is the correct way to work.",                                                  a: "Pravin Kumar T",       r: "MS. 2649/2021 · Madras High Court" },
    { topic: "Drafting", q: "I uploaded a scanned charge sheet and Lexram read it, extracted the relevant facts, and had a bail application draft plan ready. I genuinely did not expect it to work that well.",                                                                                                                                 a: "Sam Dinakaran Manuel", r: "MS. 4232/2025 · Madras High Court" },
    /* Blog */
    { topic: "Blog",     q: "The analysis is written by people who have clearly read the full judgement — not summarised a summary. The depth of engagement with the reasoning, not just the outcome, is what keeps me coming back.",                                                                                                            a: "Keerthana",            r: "MS. 7511/2023 · Madras High Court" },
    { topic: "Blog",     q: "What I appreciate most is that every piece links directly to the full judgement in Lexram's database. I read the analysis, I read the order, in one place. No searching, no hunting for the source.",                                                                                                              a: "Sachin A D",           r: "MS. 7423/2025 · Madras High Court" },
  ];

  const tabs: Array<"All" | Topic> = ["All", "Research", "Drafting", "Blog"];
  const [tab, setTab] = useState<"All" | Topic>("All");

  /* Deep-link: ?#testimonials-research / -drafting / -blog selects the tab.
     Read on mount + on hashchange so cross-section buttons can deep-link in. */
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.toLowerCase();
      if (h.includes("testimonials-research"))      setTab("Research");
      else if (h.includes("testimonials-drafting")) setTab("Drafting");
      else if (h.includes("testimonials-blog"))     setTab("Blog");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  const filtered = tab === "All" ? quotes : quotes.filter((q) => q.topic === tab);
  const initials = (name: string) =>
    name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <section id="testimonials" className="py-32 bg-[#fff0df]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="reveal-down text-xs tracking-[0.3em] text-[#b94826] mb-4">TESTIMONIALS</div>
          <h2 className="reveal-blur font-serif text-4xl md:text-5xl font-bold text-[#680318] text-balance" style={{ transitionDelay: "120ms" }}>
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
              const count = t === "All" ? quotes.length : quotes.filter((q) => q.topic === t).length;
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

        {/* Quote grid — re-mounts on tab change, plays quote-roll cascade */}
        <div
          key={tab}
          className="quote-roll grid md:grid-cols-2 lg:grid-cols-3 gap-5"
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
                className="group relative rounded-2xl bg-[#fff0df] border border-[#680318]/12 shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all overflow-hidden p-7"
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
    { name: "Free Trial", price: "₹0",     note: "50 credits",   features: ["Research access", "Verified citations", "Draft plan preview"],                                  cta: "Start free",  featured: false, href: SIGNUP },
    { name: "Advocate",   price: "₹2,499", note: "/month",       features: ["Unlimited research", "Full drafting suite", "Case hub", "Email support"],                       cta: "Start trial", featured: true,  href: SIGNUP },
    { name: "Firm",       price: "Custom", note: "Team pricing", features: ["All Advocate features", "Shared workspaces", "Firm-wide history", "Priority support"],         cta: "Talk to us",  featured: false, href: CONTACT },
  ];
  return (
    <section id="pricing" className="py-32 bg-[#fff0df]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="reveal-down text-xs tracking-[0.3em] text-[#b94826] mb-4">PRICING</div>
          <h2 className="reveal-blur font-serif text-4xl md:text-5xl font-bold text-[#680318]" style={{ transitionDelay: "120ms" }}>
            Built for solo practice. Priced for it too.
          </h2>
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
        { q: "What is Lexram AI — and how is it different from other legal research tools in India?", a: "Lexram is an AI-powered legal platform built exclusively for Indian lawyers — combining research and drafting in one place." },
        { q: "How is Lexram different from ChatGPT or generic AI tools for legal research?",          a: "Generic AI tools generate answers from the internet — and hallucinate. Lexram is trained exclusively on verified Indian legal sources. Every answer traces back to real SC judgements and central statutes. Nothing is fabricated." },
        { q: "Is Lexram built specifically for Indian law and Indian courts?",                         a: "Yes. Entirely. Not trained on the internet. Trained on India's courts — the Supreme Court of India and Indian legislation." },
        { q: "Is my data and client information safe on Lexram?",                                      a: "Yes. Everything you upload and draft on Lexram is encrypted and never used to train our models. Fully compliant with India's Digital Personal Data Protection Act, 2023." },
        { q: "Does Lexram offer a free trial?",                                                        a: "Yes — 50 credits, no payment required. Start your free trial at India's AI legal research platform — Lexram today." },
      ],
    },
    {
      topic: "Research",
      items: [
        { q: "Does Lexram have the latest Supreme Court judgements — how current is the database?",   a: "Lexram covers every Supreme Court judgement since 1950 and updates daily with new Supreme Court of India decisions." },
        { q: "Does Lexram generate fake citations or fabricated case names?",                           a: "No. Lexram only surfaces citations from its verified database. It does not generate, infer, or fabricate case names or citations — ever. Hence no hallucinated citations or fabricated judges' analysis." },
        { q: "What if two Supreme Court benches have taken opposite views on the same legal point?",   a: "Lexram's per incuriam checker filters out compromised judgements at the source — what reaches you is only the law that holds." },
        { q: "How do I know if the Supreme Court judgement I am relying on is still good law?",        a: "Every judgement in Lexram is marked — affirmed, distinguished, or overruled — so you never argue from a precedent that no longer stands." },
      ],
    },
    {
      topic: "Drafting",
      items: [
        { q: "What documents can I upload for AI legal drafting on Lexram?",                           a: "Any PDF — charge sheets, prior court orders, and scanned physical documents." },
        { q: "Do I need to know how to prompt an AI to use Lexram's drafting tool?",                   a: "No. Upload the documents to the designated case in the Case Hub and attach them. Just type the petition you need in plain language by clicking on the draft button in the search bar. Lexram reads your documents, asks the right questions, and builds the draft." },
        { q: "Will Lexram ask the same questions for every petition type?",                            a: "No. Questions are curated to every petition you request Lexram to draft. A bail application gets anticipatory-bail-related questions such as \"Does the accused have any prior convictions or pending cases?\". Nothing irrelevant. Nothing missed." },
        { q: "Can I edit the AI-generated legal draft before it is finalised?",                        a: "Yes — at two stages. You review and edit the draft plan before drafting begins, and the final draft is fully editable before export." },
        { q: "Are the judgements cited in my AI-drafted petition real and verifiable?",                a: "Every judgement cited in your draft traces back to a real, verifiable Indian legal source in Lexram's database. The draft reflects your uploaded facts and real SC judgements — not AI guesswork." },
      ],
    },
  ];

  // Each item has a globally unique key built from topic + index.
  const [open, setOpen] = useState<string | null>("General-0");
  const [tab, setTab] = useState<"All" | Group["topic"]>("All");
  const visibleGroups = tab === "All" ? groups : groups.filter((g) => g.topic === tab);

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
    <section id="faq" className="py-32 bg-[#fff0df]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="reveal-down text-xs tracking-[0.3em] text-[#b94826] mb-4">FAQ</div>
          <h2 className="reveal-blur font-serif text-4xl md:text-5xl font-bold text-[#680318]" style={{ transitionDelay: "120ms" }}>
            Questions, <span className="italic">answered</span>.
          </h2>
          <p className="reveal-up mt-5 text-[#680318]/70 max-w-xl mx-auto" style={{ transitionDelay: "240ms" }}>
            Browse by topic — or scroll the full list below.
          </p>
        </div>

        {/* Topic filter */}
        <div className="reveal-up mb-10 flex justify-center" style={{ transitionDelay: "320ms" }}>
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full border border-[#680318]/15 bg-[#680318]/[0.04]">
            {(["All", "General", "Research", "Drafting"] as const).map((t) => {
              const active = tab === t;
              const count = t === "All"
                ? groups.reduce((n, g) => n + g.items.length, 0)
                : groups.find((g) => g.topic === t)?.items.length ?? 0;
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
      <div className="w-11 h-11 rounded-lg bg-[#680318]/10 grid place-items-center shrink-0 group-hover:bg-[#680318] transition">
        <Icon className="w-5 h-5 text-[#680318] group-hover:text-[#fff0df] transition" />
      </div>
      <div>
        <div className="text-[10px] tracking-[0.25em] uppercase text-[#b94826] mb-1">{label}</div>
        <div className="font-serif text-lg text-[#680318] font-semibold leading-snug">{value}</div>
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
        className="w-full px-4 py-3 rounded-md bg-[#fff0df]/50 border border-[#680318]/15 text-[#680318] placeholder:text-[#680318]/40 focus:outline-none focus:border-[#680318]/60 focus:bg-white transition"
      />
    </label>
  );
}

function GetInTouch() {
  useReveal();
  const [form, setForm] = useState({ name: "", email: "", firm: "", phone: "", topic: "Sales", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
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
    <section id="contact" className="relative py-28 md:py-32 bg-[#fff0df] overflow-hidden">
      {/* subtle warm radial accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(185,72,38,0.10),transparent_55%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="reveal-down text-xs tracking-[0.3em] text-[#b94826] mb-4">GET IN TOUCH</div>
          <h2 className="reveal-blur font-serif text-4xl md:text-6xl font-bold text-[#680318] leading-[1.05] text-balance" style={{ transitionDelay: "120ms" }}>
            Have a question?
            <br />
            <span className="italic">We&apos;d love to hear from you.</span>
          </h2>
          <p className="reveal-up mt-6 text-lg text-[#680318]/70 leading-relaxed" style={{ transitionDelay: "260ms" }}>
            Whether you want a chambers walkthrough, are exploring a firm-wide rollout,
            or just have a question about how Lexram works — write to us. We reply within one working day.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-14 items-start">
          {/* Left: contact channels + reassurance */}
          <div className="reveal-left space-y-7">
            <ContactRow icon={Mail}  label="Email us"        value="support@lexram.ai" href="mailto:support@lexram.ai" />
            <ContactRow icon={Phone} label="Talk to sales"   value="+91 80 4567 8900" href="tel:+918045678900" />
            <ContactRow icon={Clock} label="Working hours"   value="Mon – Sat · 10:00 – 19:00 IST" />

            <div className="mt-2 p-6 bg-[#fff0df] rounded-xl border border-[#680318]/10 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#b94826]/15 grid place-items-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#b94826]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#680318] mb-1">Looking for a firm-wide demo?</h3>
                  <p className="text-sm text-[#680318]/70 leading-relaxed">
                    We host tailored walkthroughs for chambers and litigation teams. Pick &ldquo;Demo&rdquo; below and we&apos;ll set up a session matched to your bench size.
                  </p>
                </div>
              </div>
            </div>

            {/* Reassurance row */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#680318]/60">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#680318]" /> Replies within 1 working day</span>
              <span className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#680318]" /> DPDP-compliant intake</span>
              <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#680318]" /> Routed to a real human</span>
            </div>
          </div>

          {/* Right: form card */}
          <form
            onSubmit={onSubmit}
            className="reveal-right relative bg-[#fff0df] rounded-2xl border border-[#680318]/10 shadow-elegant p-7 md:p-10"
            style={{ transitionDelay: "200ms" }}
          >
            {/* gold accent stripe */}
            <div className="absolute left-7 right-7 top-0 h-1 bg-gradient-warm rounded-b-full" />

            <div className="mb-6">
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#680318]">Send us a note</h3>
              <p className="mt-1 text-sm text-[#680318]/70">All fields with <span className="text-[#b94826]">*</span> are required.</p>
            </div>

            {/* Topic picker (segmented) */}
            <div className="mb-6">
              <span className="block text-[11px] font-medium tracking-wide text-[#680318]/70 mb-2 uppercase">What&apos;s this about?</span>
              <div className="inline-flex flex-wrap gap-1.5 p-1 bg-[#fff0df]/60 border border-[#680318]/15 rounded-lg">
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
                          : "text-[#680318]/70 hover:text-[#680318] hover:bg-[#fff0df]"
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
                  className="w-full px-4 py-3 rounded-md bg-[#fff0df]/50 border border-[#680318]/15 text-[#680318] placeholder:text-[#680318]/40 focus:outline-none focus:border-[#680318]/60 focus:bg-white transition resize-none"
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
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track("cta_start_trial_click", { location: "final_cta" });
    const qs = email ? `&email=${encodeURIComponent(email)}` : "";
    go(`${SIGNUP}${qs}`);
  };
  return (
    <section id="cta" className="relative py-32 overflow-hidden bg-[#680318]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(185,72,38,0.4),transparent_70%)]" />
      <div className="relative max-w-4xl mx-auto px-6 text-center text-[#fff0df]">
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
          <button
            type="submit"
            className="px-6 py-4 rounded-md bg-[#fff0df] text-[#680318] font-semibold hover:bg-[#b94826] hover:text-[#fff0df] transition shadow-elegant"
          >
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
  return (
    <footer className="bg-[#680318] text-[#fff0df]/70 py-16 border-t border-[#b94826]/20">
      <div className="max-w-7xl mx-auto px-6">
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
              &ldquo;You argue the case. We'll find the law.&rdquo; From statute to submission — built on India's courts alone.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-[#fff0df] font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#research" className="hover:text-[#b94826]">Research</a></li>
              <li><a href="#drafting" className="hover:text-[#b94826]">Drafting</a></li>
              <li><a href="#pricing"  className="hover:text-[#b94826]">Pricing</a></li>
              <li><a href="#faq"      className="hover:text-[#b94826]">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-[#fff0df] font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about"    className="hover:text-[#b94826]">About</a></li>
              <li><a href="/blog"     className="hover:text-[#b94826]">Blog</a></li>
              <li><a href="/privacy"  className="hover:text-[#b94826]">Privacy (DPDP)</a></li>
              <li><a href="/contact"  className="hover:text-[#b94826]">Contact</a></li>
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

/* ============================================================
   Page
   ============================================================ */
export default function LandingPage() {
  useLenis();
  useReveal();
  return (
    <main data-landing-v2 className="bg-[#fff0df]">
      <Nav />
      <Hero />
      <TrustStrip />
      <Research />
      <LexramEdge />
      <Drafting />
      <LexDraftEdge />
      <Resources />
      <Blog />
      <Stats />
      <Stories />
      <Pricing />
      <FAQ />
      <GetInTouch />
      <CTA />
      <Footer />
    </main>
  );
}
