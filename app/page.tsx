"use client";

import type * as React from "react";
import { useEffect, useState } from "react";
import {
  Search, FileText, Scale, Shield, Sparkles, BookOpen, Gavel,
  CheckCircle2, ArrowRight, Quote, Plus, Minus, Star, Zap,
  Library, PenTool, Users, Download,
  Calendar, TrendingUp, FileSearch, Layers,
  Upload, MessagesSquare, Pencil, Send, Menu, X,
} from "lucide-react";
import Image from "next/image";
import { track } from "@/lib/landing-analytics";

/* SC building illustration — used as the unified visual throughout */
const SC_IMG = "/landing/sc-illustration.webp";

/* Route helpers — keep CTAs honest about where they lead */
const SIGNUP = "/sign-in?intent=signup";
const LOGIN = "/sign-in";
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
    const els = document.querySelectorAll("[data-landing-v2] .fade-up");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          // Add the class for backward compatibility, AND set a data attribute
          // that survives React re-renders. Interactive cards (like FeatureGrid)
          // re-render on click; React would otherwise reconcile className back
          // to the JSX value and strip "in-view", making the card disappear.
          el.classList.add("in-view");
          el.dataset.revealed = "true";
          io.unobserve(el);
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
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
const HOME_NAV = [
  { href: "#sc-precedent-research", label: "Research",  Icon: Search     },
  { href: "#petition-drafting",     label: "Drafting",  Icon: PenTool    },
  { href: "/dashboard/tsr",         label: "TSR",       Icon: FileSearch },
  { href: "/acts",                  label: "Resources", Icon: Library    },
  { href: "/blog",                  label: "Blog",      Icon: BookOpen   },
  { href: "#pricing",               label: "Pricing",   Icon: Layers     },
];

function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-maroon border-b border-cream/10">
      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center">

        {/* Logo — left */}
        <a href="/" className="shrink-0 flex items-center">
          <Image
            src="/landing/lexram-wordmark.png"
            alt="LexRam"
            width={964}
            height={205}
            className="h-[38px] w-auto"
            style={{ filter: "brightness(0) invert(1) sepia(0.08)" }}
            priority
          />
        </a>

        {/* Nav — absolutely centred */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-0.5">
          {HOME_NAV.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-cream/60 hover:text-rust hover:bg-rust/8 transition-all duration-150"
            >
              <Icon className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity duration-150" />
              {label}
            </a>
          ))}
        </nav>

        {/* CTAs — right */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => { track("cta_login_click", { location: "nav" }); go(LOGIN); }}
            className="hidden lg:block text-sm font-medium text-cream/55 hover:text-cream transition-colors duration-150"
          >
            Sign in
          </button>
          <button
            onClick={() => { track("cta_start_trial_click", { location: "nav" }); go(SIGNUP); }}
            className="hidden lg:block text-sm font-semibold text-cream bg-rust px-4 py-1.5 rounded hover:opacity-90 transition-opacity duration-150"
          >
            Free Trial
          </button>
          <button
            className="lg:hidden p-2 text-cream/60 hover:text-cream"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden bg-maroon border-t border-cream/10 px-4 py-4 space-y-0.5">
          {HOME_NAV.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-cream/65 hover:text-cream hover:bg-cream/5 rounded transition-colors duration-150"
              onClick={() => setOpen(false)}
            >
              <Icon className="w-4 h-4 shrink-0 opacity-60" />
              {label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-cream/10 mt-2">
            <button
              onClick={() => { track("cta_login_click", { location: "nav_mobile" }); go(LOGIN); setOpen(false); }}
              className="w-full text-center py-3 text-sm font-medium text-cream border border-cream/20 rounded hover:bg-cream/8 transition-colors duration-150"
            >
              Sign in
            </button>
            <button
              onClick={() => { track("cta_start_trial_click", { location: "nav_mobile" }); go(SIGNUP); setOpen(false); }}
              className="w-full text-center py-3 text-sm font-semibold text-cream bg-rust rounded hover:opacity-90 transition-opacity duration-150"
            >
              Free Trial
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ============================================================
   Hero — tabbed: TSR (default) / Research / Drafting
   ============================================================ */

const HERO_TABS = [
  {
    id: "tsr",
    label: "Title Scrutiny",
    badge: "NEW",
    kicker: "TITLE SCRUTINY REPORT · PROPERTY DUE DILIGENCE · AI-POWERED",
    description:
      "AI-powered title scrutiny grounded in real High Court and Supreme Court judgements. Defects flagged, encumbrances identified, citations verified. Done in minutes — not days.",
    primaryLabel: "Upload Property Documents",
    primaryHref: "/dashboard/tsr",
    secondaryLabel: "See a sample report",
    secondaryHref: "/title-scrutiny-report",
  },
  {
    id: "research",
    label: "Research",
    badge: null as string | null,
    kicker: "SC PRECEDENT RESEARCH · 1.8M JUDGEMENTS · POINT-OF-LAW ANALYSIS",
    description:
      "India’s legal AI for SC precedent research. Decompose any judgement into discrete points of law, retrieve the precedent chain, and pull every supporting and conflicting authority. Every citation is a live paragraph link — never a paraphrase.",
    primaryLabel: "Start Free Trial",
    primaryHref: SIGNUP,
    secondaryLabel: "See how it works",
    secondaryHref: "#sc-precedent-research",
  },
  {
    id: "drafting",
    label: "Drafting",
    badge: null as string | null,
    kicker: "AI LEGAL DRAFTING · BAIL APPLICATIONS · WRIT PETITIONS · LEGAL NOTICES",
    description:
      "LexRam drafts from your facts. BNS / BNSS / BSA sections auto-populated, SC paragraphs embedded as live citations. Nothing assumed. Nothing invented. Every citation traceable.",
    primaryLabel: "Start Free Trial",
    primaryHref: SIGNUP,
    secondaryLabel: "See a sample draft",
    secondaryHref: "#petition-drafting",
  },
];

const HERO_ADVANCE_MS = 5000;

function HeroWindowChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8 bg-black/30">
      <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
      <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
      <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
      <span className="ml-3 text-xs text-white/30 font-mono">{title}</span>
    </div>
  );
}

function HeroPreviewTSR() {
  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1210] overflow-hidden shadow-[0_24px_56px_-12px_rgba(0,0,0,0.6)]">
      <HeroWindowChrome title="lexram.ai · Title Scrutiny Report" />
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3 bg-black/20">
        <Upload className="w-3.5 h-3.5 text-rust shrink-0" />
        <span className="text-xs text-white/50 font-mono">Sale deed, EC, patta · 3 documents</span>
        <span className="ml-auto text-[10px] text-emerald-400 font-mono font-bold tracking-wider">DONE</span>
      </div>
      {[
        { tag: "CLEAR",   color: "text-emerald-400", label: "Chain of title",        note: "Unbroken from 1964 to present. 4 registered instruments verified." },
        { tag: "FLAG",    color: "text-amber-400",   label: "Encumbrance",            note: "Equitable mortgage in EC (2019–2022). Discharge deed not on record." },
        { tag: "CLEAR",   color: "text-emerald-400", label: "Patta / revenue record", note: "Patta in seller’s name. No government acquisition proceedings." },
        { tag: "MISSING", color: "text-red-400",     label: "Missing document",       note: "Release deed (1998 partition) not produced. Obtain before registration." },
      ].map((r, i) => (
        <div key={i} className="px-4 py-3 border-b border-white/6 hover:bg-white/3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold tracking-wider font-mono ${r.color}`}>{r.tag}</span>
            <span className="text-xs text-white/55 font-medium">{r.label}</span>
          </div>
          <div className="text-xs text-white/40 leading-snug">{r.note}</div>
        </div>
      ))}
      <div className="px-4 py-2.5 text-[10px] text-white/25 font-mono">4 findings · 2 flags · 0 hallucinated citations</div>
    </div>
  );
}

function HeroPreviewResearch() {
  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1210] overflow-hidden shadow-[0_24px_56px_-12px_rgba(0,0,0,0.6)]">
      <HeroWindowChrome title="lexram.ai · Point of law decomposition" />
      <div className="px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-3 bg-black/20 rounded px-3 py-2">
          <Search className="w-3.5 h-3.5 text-rust" />
          <span className="text-sm text-white/50 font-mono">Bail under S.480 BNSS where investigation is complete</span>
        </div>
      </div>
      {[
        { tag: "SUPPORTING",  color: "text-emerald-400", cite: "Sanjay Chandra v. CBI (2012) 1 SCC 40",          para: "¶ 21", text: "Bail is not to be withheld as punishment. Object is to secure appearance at trial." },
        { tag: "SUPPORTING",  color: "text-emerald-400", cite: "Satender Kumar Antil v. CBI (2022) 10 SCC 51",   para: "¶ 73", text: "Courts shall keep bail guidelines in mind especially where accused cooperated." },
        { tag: "CONFLICTING", color: "text-amber-400",   cite: "State of Bihar v. Amit Kumar (2017) 13 SCC 751", para: "¶ 9",  text: "Economic offences with huge public loss must be viewed seriously at bail stage." },
      ].map((r, i) => (
        <div key={i} className="px-4 py-3 border-b border-white/6 hover:bg-white/3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold tracking-wider font-mono ${r.color}`}>{r.tag}</span>
            <span className="text-[10px] text-white/30 font-mono">{r.para}</span>
          </div>
          <div className="text-xs text-white/70 font-mono mb-0.5">{r.cite}</div>
          <div className="text-xs text-white/45 leading-snug">{r.text}</div>
        </div>
      ))}
      <div className="px-4 py-2.5 text-[10px] text-white/25 font-mono">3 authorities retrieved · 0 hallucinated</div>
    </div>
  );
}

function HeroPreviewDrafting() {
  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1210] overflow-hidden shadow-[0_24px_56px_-12px_rgba(0,0,0,0.6)]">
      <HeroWindowChrome title="lexram.ai · Bail Application · S.480 BNSS" />
      <div className="px-4 py-5 space-y-3">
        <div className="text-[10px] text-white/30 font-mono uppercase tracking-widest">IN THE COURT OF THE SESSIONS JUDGE</div>
        <p className="text-xs text-white/65 leading-relaxed">
          The petitioner was arrested on 12.05.2025 under FIR No.&nbsp;142/2025.
          Investigation is complete and charge-sheet has been filed.
        </p>
        <p className="text-xs text-white/65 leading-relaxed">
          As held in{" "}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rust/25 text-rust text-[10px] font-mono">
            Sanjay Chandra ¶21
          </span>
          {" "}bail shall not be withheld as punishment. The accused cooperated fully per{" "}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rust/25 text-rust text-[10px] font-mono">
            Satender Antil ¶73
          </span>.
        </p>
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/8">
          <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-[10px] font-mono">S.480 BNSS ✓</span>
          <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-[10px] font-mono">2 live citations</span>
          <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-[10px] font-mono">0 hallucinated</span>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  const tab = HERO_TABS[activeIdx];

  const goToIdx = (idx: number) => {
    if (idx === activeIdx) return;
    setVisible(false);
    setTimeout(() => {
      setActiveIdx(idx);
      setVisible(true);
    }, 220);
  };

  useEffect(() => {
    setProgress(0);
    const t0 = Date.now();
    const progTimer = setInterval(() => {
      setProgress(Math.min((Date.now() - t0) / HERO_ADVANCE_MS, 1));
    }, 80);
    const advanceTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % HERO_TABS.length);
        setVisible(true);
      }, 220);
    }, HERO_ADVANCE_MS);
    return () => {
      clearInterval(progTimer);
      clearTimeout(advanceTimer);
    };
  }, [activeIdx]);

  return (
    <section
      className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0D0A09 0%, #120C0B 50%, #1A0F0D 100%)" }}
    >
      {/* SC building illustration — tiled horizontally, masked to fade up */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        aria-hidden
        style={{
          height: "68%",
          backgroundImage: "url('/landing/sc-illustration.webp')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "center bottom",
          maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 22%, rgba(0,0,0,0.55) 52%, black 82%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 22%, rgba(0,0,0,0.55) 52%, black 82%)",
          opacity: 0.4,
        }}
      />
      {/* Warm rust glow to tie illustration into brand palette */}
      <div className="absolute top-0 right-0 w-[500px] h-[350px] rounded-full bg-rust/7 blur-[110px] pointer-events-none" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-6 w-full py-20">

        {/* Mode tab pills — centred, segmented-control style */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/7 border border-white/10">
            {HERO_TABS.map((t, i) => {
              const isActive = i === activeIdx;
              return (
                <button
                  key={t.id}
                  onClick={() => goToIdx(i)}
                  className={`relative inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-rust text-cream shadow-[0_2px_14px_rgba(185,72,38,0.45)]"
                      : "text-cream/70 hover:text-cream hover:bg-white/8"
                  }`}
                >
                  {t.label}
                  {t.badge && (
                    <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full leading-none ${
                      isActive ? "bg-cream text-maroon" : "bg-cream/25 text-cream/90"
                    }`}>
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress dots below tabs */}
        <div className="flex justify-center gap-2 -mt-8 mb-10">
          {HERO_TABS.map((t, i) => (
            <div key={t.id} className="h-[2px] w-14 rounded-full bg-cream/10 overflow-hidden">
              {i === activeIdx && (
                <div
                  className="h-full bg-rust/55 rounded-full"
                  style={{ width: `${progress * 100}%`, transition: "width 80ms linear" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content grid — fades on tab switch */}
        <div
          className="grid lg:grid-cols-2 gap-14 items-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0px)" : "translateY(10px)",
            transition: "opacity 210ms ease, transform 210ms ease",
          }}
        >
          {/* LEFT: text */}
          <div>
            <div className="text-xs tracking-[0.28em] text-rust/80 uppercase mb-5 font-medium">
              {tab.kicker}
            </div>

            {activeIdx === 0 && (
              <h1 className="font-serif text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.06] text-cream text-balance">
                Upload documents.<br />
                <span className="italic text-cream/80">Get a bank-ready</span>{" "}
                <span className="text-rust">Title Scrutiny Report.</span>
              </h1>
            )}
            {activeIdx === 1 && (
              <h1 className="font-serif text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.06] text-cream text-balance">
                You argue the case.<br />
                <span className="italic text-cream/80">We&rsquo;ll find</span>{" "}
                <span className="text-rust">the law.</span>
              </h1>
            )}
            {activeIdx === 2 && (
              <h1 className="font-serif text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.06] text-cream text-balance">
                Bail application, writ,<br />
                legal notice &mdash;<br />
                <span className="text-rust">first draft done.</span>
              </h1>
            )}

            <p className="mt-6 text-lg text-cream/60 leading-relaxed max-w-lg">
              {tab.description}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => {
                  if (tab.id === "tsr") {
                    go(tab.primaryHref);
                  } else {
                    track("cta_start_trial_click", { location: `hero_${tab.id}` });
                    go(tab.primaryHref);
                  }
                }}
                className="inline-flex items-center gap-2 bg-rust text-cream px-7 py-3.5 rounded font-semibold hover:opacity-90 transition shadow-[0_4px_20px_rgba(185,72,38,0.3)]"
              >
                {tab.id === "tsr" ? <Upload className="w-4 h-4" /> : null}
                {tab.primaryLabel}
                {tab.id !== "tsr" && <ArrowRight className="w-4 h-4" />}
              </button>
              <a
                href={tab.secondaryHref}
                className="inline-flex items-center gap-2 border border-cream/15 text-cream/75 px-7 py-3.5 rounded hover:bg-cream/6 hover:text-cream hover:border-cream/25 transition"
              >
                {tab.secondaryLabel}
              </a>
            </div>
          </div>

          {/* RIGHT: product preview */}
          <div className="relative hidden lg:block">
            {activeIdx === 0 && <HeroPreviewTSR />}
            {activeIdx === 1 && <HeroPreviewResearch />}
            {activeIdx === 2 && <HeroPreviewDrafting />}
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
    "AI LEGAL RESEARCH", "AI LEGAL DRAFTING", "CASE LAW SEARCH",
    "SUPREME COURT JUDGMENTS", "LEGAL NOTICE FORMAT", "BAIL APPLICATION FORMAT",
    "WRIT PETITION FORMAT (ART. 226)", "ANTICIPATORY BAIL FORMAT",
    "CASE MANAGEMENT FOR ADVOCATES", "BARE ACTS LIBRARY", "FREE LEGAL TEMPLATES",
  ];
  return (
    <section className="py-10 bg-maroon text-cream/80 overflow-hidden border-y border-rust/30">
      <div className="text-center text-xs tracking-[0.3em] mb-6 text-cream/60">
        SPECIFIC TOOLS THAT INDIAN LAWYERS RELY ON FOR
      </div>
      <div className="relative">
        <div className="flex marquee whitespace-nowrap">
          {items.map((t, i) => (
            <div key={i} className="mx-10 flex items-center gap-10">
              <span className="font-serif text-lg tracking-wider">{t}</span>
              <span className="text-rust">◆</span>
            </div>
          ))}
          <div aria-hidden="true" className="flex">
            {items.map((t, i) => (
              <div key={i} className="mx-10 flex items-center gap-10">
                <span className="font-serif text-lg tracking-wider">{t}</span>
                <span className="text-rust">◆</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Problem
   ============================================================ */
function Problem() {
  useReveal();
  return (
    <section className="relative py-32 section-dark">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="fade-up">
          <div className="text-xs tracking-[0.3em] text-rust mb-6">THE RISK WITH UNVERIFIED AI LEGAL RESEARCH</div>
          <h2 className="lean-heading text-4xl md:text-6xl font-bold text-cream text-balance leading-tight">
            Most AI tools invent the law.
            <br />
            <span className="italic font-serif text-cream/80">Indian courts will not forgive it.</span>
          </h2>
          <p className="mt-8 text-lg md:text-xl text-cream/70 max-w-3xl mx-auto leading-relaxed">
            General-purpose AI produces confident, detailed answers — with section numbers that don't exist, party
            names that are wrong, and cases that were never decided. It reads like good legal research.
            Until you check it in SCC or Indian Kanoon.
          </p>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield,   title: "Every citation opens",              text: "Each result links to the exact paragraph in the original SC judgement. If LexRam cites it, you can open it, read it, and hand it to the judge." },
            { icon: BookOpen, title: "SC corpus — 1950 to present",       text: "Not trained on the internet or legal blogs. Built on Supreme Court judgements since 1950 and all central statutes — BNS, BNSS, BSA, and more." },
            { icon: Zap,      title: "Ratio extracted, not summarised",   text: "LexRam surfaces the operative ratio from each judgement — the binding holding that governs — not the surrounding observation or obiter." },
          ].map((b, i) => (
            <div
              key={i}
              className="fade-up lean-card-dark p-8"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded bg-cream/10 grid place-items-center mb-5 mx-auto">
                <b.icon className="w-6 h-6 text-rust" />
              </div>
              <h3 className="lean-heading text-xl font-bold text-cream mb-2">{b.title}</h3>
              <p className="text-cream/70">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Parallax band — Treatment 2: warm rust/sepia duotone, centred
   The image is tinted to match the brand palette via layered
   blend-mode overlays so it reads as "LexRam maroon" not neutral.
   ============================================================ */
function ParallaxBand({
  image, title, kicker,
}: { image: string; title: string; kicker: string }) {
  return (
    <section className="relative h-[55vh] overflow-hidden flex items-center">
      {/* Base image — desaturated, slightly dimmed */}
      <div
        className="absolute inset-0 parallax-bg"
        style={{
          backgroundImage: `url(${image})`,
          backgroundPosition: "center 40%",
          filter: "grayscale(0.45) brightness(0.55) contrast(1.1)",
        }}
      />
      {/* Warm rust duotone layer — multiply blend makes darks maroon, lights rust */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(104,3,24,0.75) 0%, rgba(185,72,38,0.45) 60%, rgba(104,3,24,0.6) 100%)",
          mixBlendMode: "multiply",
        }}
      />
      {/* Radial glow at centre for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(185,72,38,0.18),transparent_70%)]" />
      {/* Left-to-right fade so text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-maroon/80 via-maroon/35 to-transparent" />

      <div className="relative max-w-6xl mx-auto px-6 text-cream w-full text-center md:text-left">
        <div className="text-xs tracking-[0.3em] text-rust/90 mb-4">{kicker}</div>
        <h2 className="lean-heading text-4xl md:text-6xl font-bold max-w-3xl text-balance leading-tight text-cream">
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
    <div className="fade-up mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {features.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`p-7 text-center transition-all ${
              dark
                ? `lean-card-dark ${isOpen ? "border-rust/60" : ""}`
                : `lean-card ${isOpen ? "border-rust/60" : ""}`
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {/* Icon centered */}
              <div
                className={`w-12 h-12 rounded grid place-items-center mb-4 mx-auto ${
                  dark ? "bg-rust/20" : "bg-maroon/10"
                }`}
              >
                <f.icon className={`w-6 h-6 ${dark ? "text-rust" : "text-maroon"}`} />
              </div>
              {/* Title */}
              <h3
                className={`lean-heading text-lg font-bold mb-2 text-center ${
                  dark ? "text-cream" : "text-maroon"
                }`}
              >
                {f.t}
              </h3>
              {/* Description */}
              <p
                className={`text-sm leading-relaxed text-center ${
                  dark ? "text-cream/70" : "text-ink/70"
                }`}
              >
                {f.d}
              </p>
              {/* Expandable detail — small centered toggle */}
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className={`mt-3 text-xs flex items-center gap-1 cursor-pointer ${
                  dark ? "text-cream/50 hover:text-cream" : "text-maroon/50 hover:text-maroon"
                }`}
              >
                {isOpen ? "Less" : "More"} <Plus className={`w-3 h-3 transition-transform ${isOpen ? "rotate-45" : ""}`} />
              </button>
              {/* Expanding detail */}
              <div
                className={`grid transition-all duration-300 w-full ${
                  isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden text-center">
                  <div
                    className={`pt-3 border-t text-sm leading-relaxed text-center ${
                      dark
                        ? "border-cream/15 text-cream/80"
                        : "border-maroon/10 text-ink/75"
                    }`}
                  >
                    {f.detail}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    <div className="fade-up mt-14 flex flex-wrap items-center gap-4">
      <button
        onClick={() => {
          track(eventName, { location });
          go(primaryHref);
        }}
        className={`group inline-flex items-center gap-3 px-7 py-4 rounded font-semibold transition shadow-elegant ${
          dark
            ? "bg-cream text-maroon hover:bg-rust hover:text-cream"
            : "bg-maroon text-cream hover:bg-rust"
        }`}
      >
        {label} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
      </button>
    </div>
  );
}

/* ============================================================
   Research
   ============================================================ */
function Research() {
  useReveal();
  const features: Feature[] = [
    { icon: Search,        t: "Search SC judgments by section, act, or party", d: "Query by section of BNS, BNSS, BSA, or any central statute. Every result resolves to a real paragraph in a real judgement.", detail: "Parameter search across petitioner, respondent, judge, act, section, citation, and date — the same surface advocates expect from SCC Case Finder or Indian Kanoon, with a paragraph-level anchor on every hit." },
    { icon: Shield,        t: "Overruled & per incuriam alerts",                d: "Cited a case that's no longer good law? You'll know before you file.",                                                          detail: "Every authority is cross-checked against later overruling judgements, statutory amendments, and constitution-bench reversals. The warning sits inline, on the same line as the citation." },
    { icon: TrendingUp,    t: "Find similar cases & citation chains",           d: "For any proposition you're arguing, see the SC paragraphs that support it and the ones that cut against it.",                detail: "LexRam returns the precedent chain for each point of law — judgements that followed, distinguished, doubted, or overruled — not just a list of cases with similar names." },
    { icon: CheckCircle2,  t: "Verified headnotes & paragraph anchors",         d: "Every headnote, every summary, links straight to the paragraph it came from.",                                                detail: "LexRam-generated summaries never stand alone. Each one carries the Supreme Court paragraph reference it was drawn from — click and read the original. No paraphrase, no inference, no fabrication." },
    { icon: Calendar,      t: "Case diary & matter tracking",                   d: "Hearings, research threads, and saved authorities — one workspace, organised by matter.",                                     detail: "Track every case the way Case Bench, Advocate Diary, or Provakil does, with research threads and pinned authorities saved against the matter — not lost in a separate tab." },
    { icon: BookOpen,      t: "BNS / BNSS / BSA bare-act lookup",               d: "Bare acts with the Supreme Court paragraphs that interpret each section, side by side.",                                      detail: "Open Section 480 BNSS and see the SC paragraphs that govern bail under it. Open Section 103 BNS and see the homicide jurisprudence. The bare act and its precedent, in one screen." },
  ];
  return (
    <section id="sc-precedent-research" className="py-32 bg-cream relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="fade-up">
            <div className="text-xs tracking-[0.3em] text-rust mb-4">RESEARCH &amp; ANALYSIS · POINT-OF-LAW PRECEDENT MAPPING</div>
            <h2 className="lean-heading text-4xl md:text-5xl font-bold text-maroon leading-tight">
              Find the right legal answer — <span className="italic font-serif">verified</span>, not hallucinated.
            </h2>
            <p className="mt-6 text-lg text-ink/80 leading-relaxed">
              Ask a legal question. LexRam decomposes it into discrete <strong>points of law</strong>, and for each point returns
              the <em>supporting</em> and <em>conflicting</em> Supreme Court authorities — each one a live link to the actual
              paragraph in the judgement.
            </p>
            <p className="mt-4 text-base text-ink/70 leading-relaxed">
              No paraphrase. No summary. No inferred citation. If a paragraph does not exist, LexRam will not cite it.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["SC Judgements (since 1950)", "Central Statutes", "Paragraph-level anchors", "Daily ingest"].map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-full bg-maroon/10 text-maroon text-sm"
                >
                  {c}
                </span>
              ))}
            </div>
            <SectionCTA
              label="Start Research"
              primaryHref={RESEARCH}
              eventName="cta_start_research_click"
              location="research_section"
            />
          </div>
          {/* Treatment 3: archival portrait frame — dome crop, inner border, cream mat */}
          <div className="fade-up relative hidden lg:flex justify-center">
            {/* Outer mat — cream background like a print mount */}
            <div className="relative bg-cream p-4 shadow-[0_20px_60px_-10px_rgba(104,3,24,0.35)]" style={{ maxWidth: "380px", width: "100%" }}>
              {/* Inner ruled border — archival print convention */}
              <div className="absolute inset-[10px] border border-maroon/20 pointer-events-none z-10" />
              {/* Image — cropped to dome, slight cool tint */}
              <div
                className="w-full aspect-[3/4] overflow-hidden"
                style={{
                  backgroundImage: "url('/landing/sc-illustration.webp')",
                  backgroundSize: "200%",
                  backgroundPosition: "center 8%",
                  filter: "brightness(0.88) contrast(1.05) saturate(0.85)",
                }}
              />
              {/* Caption strip — archival label */}
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-[10px] font-mono text-maroon/50 tracking-[0.2em] uppercase">Supreme Court of India</span>
                <span className="text-[10px] font-mono text-maroon/35 tracking-[0.15em]">Est. 1950</span>
              </div>
            </div>
          </div>
        </div>

        {/* Worked demo: one proposition, its supporting + conflicting SC paragraphs */}
        <div className="fade-up mt-20">
          <div className="text-xs tracking-[0.3em] text-rust mb-3 uppercase">A real point of law, decomposed</div>
          <h3 className="lean-heading text-2xl md:text-3xl font-bold text-maroon leading-tight">
            Watch one proposition split into its precedent chain.
          </h3>
          <p className="mt-3 text-base text-ink/70 max-w-3xl">
            This is what LexRam returns when you ask about bail in a non-grievous economic offence — not a paragraph of prose,
            but a proposition mapped to the SC paragraphs that support it and the ones that cut against it.
          </p>

          <div className="mt-8 rounded-lg border border-maroon/15 bg-white overflow-hidden">
            <div className="p-6 md:p-8 bg-maroon text-cream">
              <div className="text-[11px] tracking-[0.25em] uppercase text-cream/60 mb-2">Point of law</div>
              <p className="font-serif text-lg md:text-xl leading-snug">
                &ldquo;Bail under Section 480 BNSS is the rule, not the exception, where the investigation is complete and
                the offence is not grievous.&rdquo;
              </p>
            </div>

            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-maroon/10">
              {[
                {
                  tag: "Supporting",
                  tone: "support",
                  cite: "Sanjay Chandra v. CBI, (2012) 1 SCC 40",
                  para: "¶ 21",
                  quote: "The object of bail is to secure the appearance of the accused at trial. Bail is not to be withheld as a punishment.",
                },
                {
                  tag: "Supporting",
                  tone: "support",
                  cite: "Satender Kumar Antil v. CBI, (2022) 10 SCC 51",
                  para: "¶ 73",
                  quote: "Trial courts and High Courts shall keep in mind the guidelines on bail, especially in cases where the accused has cooperated with investigation.",
                },
                {
                  tag: "Conflicting",
                  tone: "conflict",
                  cite: "State of Bihar v. Amit Kumar, (2017) 13 SCC 751",
                  para: "¶ 9",
                  quote: "Economic offences with deep-rooted conspiracies and huge loss to public funds must be viewed seriously at the stage of bail.",
                },
              ].map((c, i) => (
                <div key={i} className="p-6 md:p-7">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={
                        c.tone === "support"
                          ? "px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold tracking-wide uppercase"
                          : "px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold tracking-wide uppercase"
                      }
                    >
                      {c.tag}
                    </span>
                    <span className="text-[11px] tracking-wider uppercase text-ink/50">SC India</span>
                  </div>
                  <div className="font-serif text-[15px] font-semibold text-maroon leading-snug">{c.cite}</div>
                  <div className="text-[11px] text-rust mt-1 mb-3 font-mono">{c.para} · paragraph anchor</div>
                  <p className="text-sm text-ink/80 italic leading-relaxed">&ldquo;{c.quote}&rdquo;</p>
                </div>
              ))}
            </div>

            <div className="px-6 md:px-8 py-4 bg-cream/60 border-t border-maroon/10 text-[12px] text-ink/60">
              Every citation above is a real Supreme Court of India authority. In the product, each paragraph reference
              opens the actual paragraph in the official judgement — not a summary, not a paraphrase.
            </div>
          </div>
        </div>

        <FeatureGrid features={features} />

        {/* Long-form SEO copy — targets ratio decidendi / per incuriam / precedent mapping long-tail */}
        <div className="fade-up mt-20 grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="text-xs tracking-[0.3em] text-rust mb-3 uppercase">How LexRam reads a judgement</div>
            <h3 className="lean-heading text-2xl md:text-3xl font-bold text-maroon leading-tight">
              Research is retrieval. Analysis is structure.
            </h3>
            <div className="mt-6 space-y-5 text-ink/80 leading-relaxed">
              <p>
                Most AI legal research tools in India return a paragraph of prose with footnote-style citations bolted on.
                LexRam was built the opposite way. We start with the <strong>ratio decidendi</strong> — the binding legal
                principle — and treat everything else as context. An obiter observation does not become a citation. A
                paragraph that was later overruled does not stand alone without its <strong>per incuriam</strong> flag.
              </p>
              <p>
                Every Supreme Court judgement in the LexRam corpus is parsed into discrete propositions of law. Each
                proposition is mapped to the earlier authorities it relies on and the later judgements that follow,
                distinguish, doubt, or overrule it. The result is a <strong>precedent map</strong> — not a list of similar
                cases, but a structural view of how a doctrine has actually travelled through Indian jurisprudence.
              </p>
              <p>
                When an advocate asks a question, LexRam does not summarise. It returns the points of law that are in play,
                the SC paragraphs that support each one, and the paragraphs that cut against it. Verified citations are
                non-negotiable: every reference resolves to an actual paragraph on the official record. If a paragraph
                cannot be opened and read, it does not appear in a LexRam output.
              </p>
            </div>
          </div>

          <aside className="lg:col-span-1 p-6 rounded-md bg-white border border-maroon/15 self-start">
            <div className="text-[11px] tracking-[0.25em] uppercase text-rust mb-3">What this means for you</div>
            <ul className="space-y-3 text-sm text-ink/80">
              <li className="flex gap-3"><span className="text-maroon font-bold">·</span> No more reading 80 paragraphs to find the one that binds.</li>
              <li className="flex gap-3"><span className="text-maroon font-bold">·</span> No more discovering an overruling judgement the night before a hearing.</li>
              <li className="flex gap-3"><span className="text-maroon font-bold">·</span> No more citing a paragraph you have not actually opened.</li>
              <li className="flex gap-3"><span className="text-maroon font-bold">·</span> No more building an argument on prose that the model invented.</li>
            </ul>
          </aside>
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
  const steps: { icon: React.ElementType; n: string; t: string; d: string; detail: string }[] = [
    { icon: Upload,         n: "01", t: "Upload case file",            d: "FIR, charge-sheet, court orders, notices, statements — drop them in as PDFs, scans, or phone photos.",                  detail: "OCR is tuned for Indian court stamps, faded carbons, handwritten endorsements, and the multilingual records police stations actually produce. Files stay in your workspace." },
    { icon: FileSearch,     n: "02", t: "Auto-research grounds",        d: "LexRam extracts the points of law in your matter and pulls the Supreme Court paragraphs that support each ground.", detail: "Parties, sections of BNS / BNSS / BSA, dates, and chronology are mapped automatically. For every legal proposition, the supporting and conflicting SC paragraphs are retrieved from the corpus — not generated." },
    { icon: MessagesSquare, n: "03", t: "Discuss & confirm plan",       d: "Review the draft plan — grounds, prayers, annexures, authorities — and chat with LexRam to refine it.",              detail: "Add facts. Drop weak grounds. Re-order prayers. Swap one authority for another. Nothing is written until you sign off on the plan." },
    { icon: PenTool,        n: "04", t: "Generate court-ready draft",   d: "Bail application, writ petition, SLP, anticipatory bail, legal notice — drafted in the forum's required format.",  detail: "Bail under S.480 / S.482 / S.483 BNSS, writ under Article 226, SLP, appeals, replies, affidavits. Every ground cites a real SC paragraph as a live link. No paraphrase. No invented citation." },
    { icon: Pencil,         n: "05", t: "Review & edit inline",         d: "Inline edit any clause. Swap a citation, tighten a ground, add a prayer — LexRam keeps the rest consistent.",       detail: "Track changes, version history, comments with your junior. Replace a cited paragraph and the dependent grounds auto-update. Citation verification flags any authority that has since been overruled." },
    { icon: Download,       n: "06", t: "Download & file",              d: "Export as court-ready PDF or DOCX — paragraph numbering, margins, and indexed annexures handled.",                  detail: "Output matches Supreme Court, High Court, sessions, and tribunal filing rules. Ready for the filing counter, or one click into eCourts e-filing." },
  ];
  return (
    <section id="petition-drafting" className="py-32 section-dark-deep text-cream relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(185,72,38,0.3),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Treatment 4: diagonal clip-path, lower crop (steps/statue), rust tint overlay */}
          <div className="fade-up order-2 lg:order-1 relative hidden lg:block">
            {/* Outer wrapper provides the angled bottom edge */}
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "4/3",
                clipPath: "polygon(0 0, 100% 0, 100% 82%, 0 100%)",
              }}
            >
              {/* Image — cropped to steps/entrance area */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url('/landing/sc-illustration.webp')",
                  backgroundSize: "170%",
                  backgroundPosition: "center 72%",
                  filter: "brightness(0.65) contrast(1.1)",
                }}
              />
              {/* Rust warm tint — multiply blend turns blue-white into rust-cream */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, rgba(185,72,38,0.35) 0%, rgba(104,3,24,0.65) 100%)",
                  mixBlendMode: "multiply",
                }}
              />
              {/* Bottom-to-top fade anchors to text below */}
              <div className="absolute inset-0 bg-gradient-to-t from-maroon/80 via-transparent to-transparent" />
            </div>
            {/* Horizontal rule accent — aligns with clip edge visually */}
            <div className="h-[2px] bg-gradient-to-r from-rust/50 via-rust/20 to-transparent mt-1 w-3/4" />
          </div>
          <div className="fade-up order-1 lg:order-2">
            <div className="text-xs tracking-[0.3em] text-rust mb-4">AI LEGAL DRAFTING · BAIL APPLICATIONS · WRIT PETITIONS · LEGAL NOTICES · INDIA</div>
            <h2 className="lean-heading text-4xl md:text-5xl font-bold leading-tight text-cream">
              Bail application, writ petition, legal notice —{" "}
              <span className="italic font-serif text-rust">first draft done</span>.
            </h2>
            <p className="mt-6 text-lg text-cream/80 leading-relaxed">
              Upload your FIR, charge-sheet, or court order. LexRam identifies every
              legal ground, retrieves the Supreme Court paragraphs that support each one
              under BNS, BNSS, and BSA, and generates a court-ready petition — bail
              under S.480&nbsp;/&nbsp;S.482&nbsp;/&nbsp;S.483 BNSS, writ petition under
              Article 226, or SLP. Every citation is a live link to the original SC
              paragraph. No paraphrase. No invented authority.
            </p>
            <SectionCTA
              label="Start Drafting"
              tone="dark"
              primaryHref={RESEARCH}
              eventName="cta_start_research_click"
              location="drafting_section"
            />
          </div>
        </div>

        <div className="fade-up mt-16">
          <p className="text-sm md:text-base text-cream/70 mb-5 italic">
            AI-drafted for Indian courts — SC, High Courts, Sessions Courts. Every petition ground cites a verified Supreme Court paragraph with a live link to the original judgement.
          </p>
          <ul
            aria-label="Document types LexRam can draft from real SC precedents"
            className="flex flex-wrap gap-2"
          >
            {[
              { label: "Bail Application (S.480 BNSS)", href: "/drafting/bail-s480-bnss" },
              { label: "Anticipatory Bail (S.482 BNSS)", href: "/drafting/anticipatory-bail-s482-bnss" },
              { label: "Sessions Bail (S.483 BNSS)", href: "/drafting/sessions-bail-s483-bnss" },
              { label: "Writ Petition (Art. 226)", href: "/drafting/writ-petition-article-226" },
              { label: "Legal Notice", href: "/drafting/legal-notice" },
              { label: "Reply to Legal Notice", href: "/drafting/reply-to-legal-notice" },
              { label: "Affidavit", href: "/drafting/affidavit" },
              { label: "Plaint", href: "/drafting/plaint" },
              { label: "Vakalatnama", href: "/drafting/vakalatnama" },
              { label: "Charge-Sheet Response", href: "/drafting/charge-sheet-response" },
            ].map((chip) => (
              <li key={chip.label}>
                <a
                  href={chip.href}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-cream/10 border border-cream/20 text-cream/85 text-sm hover:bg-cream/20 hover:border-rust/60 transition"
                >
                  {chip.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <DraftingWorkflow steps={steps} />
      </div>
    </section>
  );
}

function DraftingWorkflow({ steps }: { steps: { icon: React.ElementType; n: string; t: string; d: string; detail: string }[] }) {
  return (
    <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {steps.map((step, i) => (
        <div key={i} className="lean-card-dark p-5 text-center rounded-lg flex flex-col items-center">
          <div className="text-rust font-mono text-[10px] tracking-[0.2em] uppercase mb-3">{step.n}</div>
          <div className="w-10 h-10 rounded grid place-items-center mb-3 bg-cream/8">
            <step.icon className="w-5 h-5 text-cream/70" />
          </div>
          <h3 className="lean-heading text-sm font-bold text-cream mb-2 leading-snug">{step.t}</h3>
          <p className="text-xs text-cream/50 leading-relaxed">{step.d}</p>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Practice Areas — top-of-funnel surface for practice-area searches
   ============================================================ */
function PracticeAreas() {
  useReveal();
  const areas = [
    { icon: Gavel,    title: "Criminal Law",     text: "BNS / BNSS / BSA native. Bail applications, charge-sheet responses, anticipatory bail." },
    { icon: FileText, title: "Corporate Law",    text: "Companies Act, SEBI rulings, NCLT precedent chains for transactional and disputes work." },
    { icon: Scale,    title: "Civil Litigation", text: "CPC pleadings, written statements, replies — drafted from SC precedent on every ground." },
    { icon: Users,    title: "Family Law",       text: "Matrimonial, custody, maintenance and succession — with verified SC authority per proposition." },
    { icon: Sparkles, title: "Arbitration",      text: "A&C Act 1996 jurisprudence, Section 11 and 34 petitions, with retrieved precedent." },
    { icon: Library,  title: "Property Law",     text: "Title tracing, specific performance, partition — research and drafting in one workflow." },
  ];
  return (
    <section id="practice-areas" className="py-32 bg-cream">
      <div className="max-w-6xl mx-auto px-6">
        <div className="fade-up text-center mb-16">
          <div className="text-xs tracking-[0.3em] text-rust mb-4">PRACTICE AREAS</div>
          <h2 className="lean-heading text-4xl md:text-5xl font-bold text-maroon text-balance">
            Built for every kind of Indian advocate.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((a, i) => (
            <a
              key={a.title}
              href={`/practice/${a.title.toLowerCase().replace(/\s+/g, "-")}`}
              className="fade-up lean-card p-8 hover:border-rust/40 transition group text-center flex flex-col items-center"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="w-12 h-12 rounded bg-maroon/10 grid place-items-center mb-5">
                <a.icon className="w-6 h-6 text-maroon" />
              </div>
              <h3 className="lean-heading text-xl font-bold text-maroon mb-2">{a.title}</h3>
              <p className="text-sm text-ink/70 leading-relaxed mb-4">{a.text}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-rust group-hover:gap-2 transition-all mx-auto">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Market Comparison — where LexRam sits vs 10 other India-native legal AI tools
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
      return <span className="text-ink/30">—</span>;
    }
    return <span className="text-xs text-ink/70 italic">{m}</span>;
  };
  return (
    <section id="compare" className="py-32 bg-cream-card">
      <div className="max-w-7xl mx-auto px-6">
        <div className="fade-up max-w-3xl mb-12">
          <div className="text-xs tracking-[0.3em] text-rust mb-4">
            WHERE LEXRAM SITS IN THE MARKET
          </div>
          <h2 className="lean-heading text-4xl md:text-5xl font-bold text-maroon leading-tight">
            Compared, plainly.
          </h2>
          <p className="mt-4 text-lg text-ink/70 leading-relaxed">
            Eleven Indian legal-AI platforms. One axis they don&rsquo;t compete on.
          </p>
        </div>

        <div className="fade-up overflow-x-auto rounded-lg border border-maroon/10 bg-cream">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-maroon text-cream">
                <th scope="col" className="text-left p-4 font-sans font-semibold min-w-[260px] sticky left-0 bg-maroon">
                  Capability
                </th>
                {competitors.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className={`p-4 font-sans font-semibold text-xs uppercase tracking-wider min-w-[100px] ${
                      c === "LexRam" ? "text-rust" : "text-cream/80"
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
                  className={i % 2 === 0 ? "bg-cream-card" : "bg-cream"}
                >
                  <th
                    scope="row"
                    className="text-left p-4 font-medium text-maroon align-top sticky left-0 bg-inherit"
                  >
                    {row.feature}
                  </th>
                  {row.cells.map((cell, j) => (
                    <td
                      key={j}
                      className={`p-4 text-center align-top border-l border-maroon/10 ${
                        j === 0 ? "bg-rust/10" : ""
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

        <p className="fade-up mt-4 text-xs text-ink/60 italic max-w-3xl">
          Comparison reflects publicly available product information as of May 2026. Competitor capabilities change frequently.
          We update this table quarterly. To suggest a correction, email{" "}
          <a href="mailto:support@lexram.ai" className="underline hover:text-rust">
            support@lexram.ai
          </a>
          .
        </p>

        <div className="fade-up mt-8">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 text-maroon font-semibold hover:text-rust transition"
          >
            See pricing plans
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Stats
   ============================================================ */
function Stats() {
  const stats = [
    { n: "75+", l: "Years of SC judgements" },
    { n: "0",   l: "Hallucinated citations" },
    { n: "2",   l: "Editable draft stages" },
    { n: "1",   l: "Unified workflow" },
  ];
  return (
    <section className="py-20 bg-maroon border-y border-cream/8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-cream/10">
          {stats.map((s, i) => (
            <div key={i} className="text-center px-8 py-6">
              <div className="lean-heading text-5xl md:text-6xl font-bold text-rust mb-2">{s.n}</div>
              <div className="text-xs tracking-[0.15em] uppercase text-cream/50">{s.l}</div>
            </div>
          ))}
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
  const quotes = [
    { q: "The ratio decidendi extractor alone is worth everything. I used to spend hours reading full judgements to find the one principle I needed. Lexram pulls it out in seconds — accurately, every time.", a: "Prashanth V I",       r: "MS.2330/2019, Madras High Court, Madurai" },
    { q: "What struck me first was that every result Lexram returned was a real judgement I could open and verify. After years of being burned by AI tools that fabricate citations, that alone made me a convert.", a: "Shyam M",             r: "MS.8227/2024, District Court, Trichy" },
    { q: "The draft plan step is what separates Lexram from everything else I've tried. I approve the structure before a single clause is written — so the final draft reflects my strategy, not the AI's interpretation of it.", a: "Johnson S A",         r: "MS. 1958/2023, Madras High Court" },
    { q: "I uploaded a scanned charge sheet — stamped and all — and Lexram read it, extracted the relevant facts, and had a bail application draft plan ready. I genuinely did not expect it to work that well.", a: "Sam Dinakaran Manuel", r: "MS. 4232/2025, Madras High Court" },
    { q: "Lexram's conflicting judgement detector and bench strength indicator have completely changed how I prepare. I walk into court knowing I haven't missed anything.", a: "Shree Harini H N",    r: "MS. 4036/2025, Madras HC, Madurai" },
    { q: "Research and drafting being one workflow is not a feature — it is the correct way to work.", a: "Pravin Kumar T",      r: "MS. 2649/2021, Madras High Court" },
  ];
  return (
    <section className="py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="fade-up text-center mb-16">
          <div className="text-xs tracking-[0.3em] text-rust mb-4">USER STORIES</div>
          <h2 className="lean-heading text-4xl md:text-5xl font-bold text-maroon text-balance">
            From the advocates who use it every day.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <figure
              key={i}
              className="fade-up lean-card p-8 hover:border-maroon/28 transition group"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <Quote className="w-8 h-8 text-rust mb-4 opacity-60" />
              <blockquote className="text-ink/80 leading-relaxed text-[15px]">
                &ldquo;{q.q}&rdquo;
              </blockquote>
              <figcaption className="mt-6 pt-6 border-t border-maroon/10">
                <div className="font-serif font-bold text-maroon">{q.a}</div>
                <div className="text-xs text-ink/60 mt-1">{q.r}</div>
              </figcaption>
            </figure>
          ))}
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
    { name: "Pay As You Go", price: "₹500", note: "min recharge",   features: ["Unlimited research", "Full drafting suite", "Case hub", "Email support"],                       cta: "Start now", featured: true,  href: SIGNUP },
    { name: "Firm",       price: "Custom", note: "bulk pricing", features: ["All Pay As You Go features", "Shared workspaces", "Firm-wide history", "Priority support", "Volume discounts"],         cta: "Talk to us",  featured: false, href: CONTACT },
  ];
  return (
    <section id="pricing" className="py-32 bg-cream">
      <div className="max-w-6xl mx-auto px-6">
        <div className="fade-up text-center mb-16">
          <div className="text-xs tracking-[0.3em] text-rust mb-4">PRICING</div>
          <h2 className="lean-heading text-4xl md:text-5xl font-bold text-maroon leading-tight">
            Pay as you go.
            <span className="block mt-2 text-xl md:text-2xl font-medium text-ink/80">
              Pay for what you use — not a penny more.
            </span>
            <span className="block mt-3 text-base font-normal text-rust">
              No subscriptions. No overheads.
            </span>
            <span className="block mt-4 text-lg font-serif italic text-maroon/90">
              Recharge starting at Rs.500 for world-class legal research, analysis and professional drafting.
            </span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <div
              key={i}
              onMouseEnter={() => track("pricing_plan_hover", { plan: p.name })}
              className={`fade-up relative p-10 rounded-lg border transition ${
                p.featured
                  ? "bg-maroon text-cream border-0"
                  : "bg-cream-card border border-maroon/15"
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rust text-cream text-xs px-3 py-1 rounded tracking-wider">
                  MOST POPULAR
                </div>
              )}
              <h3
                className={`lean-heading text-2xl font-bold ${
                  p.featured ? "text-cream" : "text-maroon"
                }`}
              >
                {p.name}
              </h3>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-sans text-5xl font-bold">{p.price}</span>
                <span
                  className={`text-sm ${
                    p.featured ? "text-cream/70" : "text-ink/60"
                  }`}
                >
                  {p.note}
                </span>
              </div>
              <ul className="mt-8 space-y-3">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-none text-rust" />
                    <span
                      className={p.featured ? "text-cream/90" : "text-ink/80"}
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
                className={`mt-10 w-full py-3 rounded font-medium transition ${
                  p.featured
                    ? "bg-cream text-maroon hover:bg-rust hover:text-cream"
                    : "bg-maroon text-cream hover:bg-rust"
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
  const faqs = [
    {
      q: "What is LexRam, and who is it built for?",
      a: "LexRam is an AI-powered legal research and drafting platform built exclusively for Indian advocates. It is not a general-purpose chatbot. The corpus is the Supreme Court of India judgement database — every reported judgement since 1950 — plus the full text of central statutes including the BNS, BNSS, BSA, IPC, CrPC, CPC, Companies Act, and the Transfer of Property Act. The system is designed around how practising lawyers actually work: you ask a legal question, LexRam decomposes it into discrete points of law, maps the Supreme Court precedent chain for each point, and lets you draft grounded on the results — all without leaving the platform. Solo advocates, junior counsel, chambers, and property law specialists are the primary users. LexRam is operated by Ramasubramanian AI Software Private Limited, Chennai.",
    },
    {
      q: "How is LexRam different from ChatGPT, Google Gemini, or other general AI tools for legal research?",
      a: "The fundamental difference is retrieval versus generation. ChatGPT and similar tools generate their answers from a statistical model trained on internet text — they have no live access to Supreme Court judgements, and they fabricate citations. In February 2026, the Supreme Court of India flagged petitions citing a case called 'Mercy vs Mankind' — a judgement that does not exist. It was produced by a general-purpose AI tool and submitted to the Court. LexRam cannot do this. Every citation in a LexRam output is retrieved from a verified database and resolves to a real, openable paragraph in a real Supreme Court judgement. If a paragraph does not exist in the corpus, LexRam will not cite it. The architecture is search-and-retrieve, not generate-and-hope.",
    },
    {
      q: "What does 'point-of-law decomposition' mean, and why does it matter?",
      a: "When you ask LexRam a legal question — say, 'Can anticipatory bail be granted after an FIR is filed under the BNSS?' — it does not return a paragraph of AI prose with a footnote citation. It breaks the question into its constituent legal propositions: the general rule on anticipatory bail, the conditions under Section 482 BNSS, the Supreme Court's position on post-FIR applications, and any conflicting authority on economic or serious offences. For each proposition, LexRam returns the SC paragraphs that support it and the ones that cut against it — with the paragraph reference and a direct link to the source judgement. This is what Indian advocates actually need to prepare arguments: not a summary, but the specific legal propositions they must address, and the authorities on both sides.",
    },
    {
      q: "What Indian courts and statutes does LexRam cover?",
      a: "LexRam's current corpus covers the Supreme Court of India — every reported judgement from 1950 to the present, updated daily as new judgements are published. On the statute side, the platform includes the full text of all major central legislation: the Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita (BNSS), Bharatiya Sakshya Adhiniyam (BSA), the IPC, CrPC, CPC, Evidence Act, Transfer of Property Act, Registration Act, Companies Act, Arbitration and Conciliation Act, and more. High Court judgements and state-specific legislation are on the 2026 roadmap.",
    },
    {
      q: "What kinds of petitions and documents can LexRam draft?",
      a: "LexRam's drafting engine supports the most common court filings for Indian advocates. In criminal matters: bail applications under Section 480 BNSS (regular bail in non-bailable offences), Section 482 BNSS (anticipatory bail), and Section 483 BNSS (bail before sessions court); charge-sheet replies; discharge applications; and legal notices. In constitutional and civil matters: writ petitions under Article 226 (High Court) and Article 32 (Supreme Court); Special Leave Petitions; civil appeals; and written statements. In property matters: Title Scrutiny Reports that identify encumbrances, missing links in title chains, and statutory non-compliances — with verified SC and HC precedent for each objection. Every draft cites real Supreme Court paragraphs with live links. No ground is written without a retrievable authority behind it.",
    },
    {
      q: "Will LexRam ever fabricate a case citation or paragraph that does not exist?",
      a: "No — and this is the product's single most important guarantee. LexRam's citation engine is built on retrieval, not generation. When a legal proposition is identified, the system searches the corpus for SC paragraphs that support or conflict with it. The citation is the paragraph itself — not a name the model has generated from training data. If no paragraph in the corpus supports the proposition, LexRam will not assert the proposition or cite a case. There is no mechanism by which LexRam can produce a case name, paragraph number, or quote that does not correspond to a real document in its verified database. Every citation in a LexRam output is a live link: click it, and the actual Supreme Court paragraph opens.",
    },
    {
      q: "How does the two-stage drafting workflow work?",
      a: "LexRam drafts in two stages so that the final document reflects the advocate's strategy, not the AI's interpretation. In Stage 1, after you upload your case documents and describe the matter, LexRam produces a draft plan: the proposed grounds, the prayers, the annexures, and the SC authorities it intends to cite for each ground. You review this plan, add or remove grounds, swap one authority for another, reorder the prayers, and approve. Nothing is written until you sign off. In Stage 2, LexRam generates the full draft from the approved plan. Every clause cites only the authorities you approved. The final draft is fully editable inline: change a clause, swap a citation, tighten a prayer. When you export, the output is formatted for the relevant forum — SC, HC, sessions court, or tribunal.",
    },
    {
      q: "How does LexRam handle scanned or photographed documents?",
      a: "LexRam's document processing is tuned for the physical reality of Indian legal paperwork: stamped FIRs, carbon-copy charge-sheets, handwritten court orders, faded endorsements, and multilingual police station records. You can upload documents as PDF, JPG, or PNG — including phone photographs taken in low light at a filing counter. The OCR layer is trained on Indian court formats and handles stamps, seals, and marginal endorsements that general OCR tools routinely misread. Extracted text is never stored beyond your session unless you explicitly save it to your workspace.",
    },
    {
      q: "How is LexRam priced? Is there a subscription?",
      a: "LexRam runs on a pay-as-you-go credit model — no monthly subscription, no annual commitment. You start with 50 free credits at sign-up, which is enough to run several research queries and see a draft plan. After that, the minimum recharge is ₹500. Credits are consumed per operation: a research query, a draft plan generation, or a full draft export. Unused credits do not expire. Law firms with multiple users can contact us for a firm plan with shared credit pools, team workspaces, and volume pricing. There are no hidden fees and no lock-in.",
    },
    {
      q: "How does LexRam compare to Indian Kanoon, SCC Online, Manupatra, and CaseMine?",
      a: "Indian Kanoon, SCC Online, and Manupatra are case-law databases — they help you find judgements by keyword or citation. LexRam does something different: it decomposes a legal question into propositions and maps the precedent chain for each proposition, showing you which SC paragraphs support your argument and which cut against it. CaseMine offers some AI-assisted research, but at the paragraph-level retrieval and cross-referencing that LexRam performs. None of these platforms include an integrated drafting engine that produces court-ready petitions grounded in retrieved SC paragraphs. LexRam is the only platform in India that takes you from a legal question — through citation-verified analysis — to a drafted petition, in one unbroken workflow.",
    },
    {
      q: "Is LexRam compliant with the Digital Personal Data Protection Act, 2023?",
      a: "Yes. LexRam stores and processes data in India. Documents you upload, queries you run, and drafts you generate are encrypted in transit (TLS 1.2 or higher) and at rest (AES-256). Your data is never used to train shared or third-party models — it remains in your account and is deleted on request. LexRam is built to comply with the DPDP Act 2023 and the obligations that take effect under its rules. For law firms with specific compliance requirements, we provide a data processing addendum on request.",
    },
    {
      q: "What is a Title Scrutiny Report (TSR) and how does LexRam generate one?",
      a: "A Title Scrutiny Report is a formal legal opinion on the marketability of property title, required by banks before sanctioning a home loan and by sophisticated buyers before any major conveyance. Preparing one manually requires an advocate to read every link in a thirty-year title chain, check encumbrance certificates, verify registrations, identify statutory violations, and ground each objection in case law. LexRam's TSR tool automates the document-reading and case-law research stages. You upload the chain documents — sale deeds, EC, khata, patta, property card — and LexRam identifies objections, cross-references them against the Transfer of Property Act, Registration Act, and relevant SC and HC precedent, and generates a structured report with each objection cited to a real legal source. The advocate reviews, edits, and signs the final report.",
    },
    {
      q: "Does LexRam replace the advocate or practise law?",
      a: "No. LexRam is a research and drafting tool — a highly capable one, but a tool. Every output requires advocate review before use. The platform does not give legal advice, does not appear in court, and does not represent clients. What it does is eliminate the most time-consuming parts of legal work: reading 80 paragraphs to find the one binding ratio, searching four databases to find a conflicting authority, formatting a bail application from scratch at midnight before a morning hearing. The advocate's judgement — on strategy, on which ground to press, on whether to file at all — is irreplaceable. LexRam handles the research and the first draft.",
    },
    {
      q: "Is my client's data protected under attorney-client privilege when I use LexRam?",
      a: "LexRam's architecture is designed so that client data never leaves your secure workspace. Documents you upload are processed to generate research and drafts and are not shared with other users or used to improve shared AI models. We do not have access to your client files or the contents of your queries in any identifiable form. That said, LexRam is a software platform, not a party to the attorney-client relationship. The privilege attaches between you and your client. You remain responsible for ensuring that the use of any third-party tool is consistent with your duties of confidentiality under the Bar Council of India Rules.",
    },
    {
      q: "Does LexRam support languages other than English?",
      a: "LexRam currently operates in English. This reflects the language of the Supreme Court corpus — all reported SC judgements are in English — and the primary language in which petitions are filed in most Indian High Courts. Hindi-language support for statutes and queries, and Tamil-language support for Madras High Court practice, are on the 2026 product roadmap. If language support for a specific High Court or language is important to your practice, contact us — that feedback directly influences the roadmap.",
    },
    {
      q: "Who built LexRam and what is the company?",
      a: "LexRam is built and operated by Ramasubramanian AI Software Private Limited, incorporated and headquartered in Chennai, Tamil Nadu. The team includes practising advocates and engineers who built LexRam because the tools they needed — verified citation search, BNSS-native drafting, property title analysis — did not exist. Contact us at hello@lexram.ai or +91 87544 46066.",
    },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-32 bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className="max-w-4xl mx-auto px-6">
        <div className="fade-up mb-16">
          <div className="text-xs tracking-[0.3em] text-rust mb-4 uppercase">Frequently Asked Questions</div>
          <h2 className="lean-heading text-4xl md:text-5xl font-bold text-maroon leading-tight">
            Everything you need to know<br className="hidden md:block" /> about LexRam.
          </h2>
          <p className="mt-4 text-ink/60 text-base max-w-2xl leading-relaxed">
            From how citations are verified to how the drafting workflow operates — answered in full.
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="fade-up lean-card overflow-hidden"
              >
                <button
                  onClick={() => {
                    const next = isOpen ? null : i;
                    setOpen(next);
                    track("faq_toggle", { question: f.q, opened: next !== null });
                  }}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-maroon/5 transition"
                >
                  <span className="font-sans text-lg font-semibold text-maroon">{f.q}</span>
                  {isOpen ? (
                    <Minus className="w-5 h-5 text-rust flex-none" />
                  ) : (
                    <Plus className="w-5 h-5 text-rust flex-none" />
                  )}
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-ink/75 leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
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
    <section id="cta" className="relative py-32 overflow-hidden bg-maroon">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(185,72,38,0.4),transparent_70%)]" />
      <div className="relative max-w-4xl mx-auto px-6 text-center text-cream">
        <Scale className="w-12 h-12 mx-auto text-rust mb-6" />
        <h2 className="lean-heading text-4xl md:text-6xl font-bold leading-tight text-balance text-cream">
          You argue the case.
          <br />
          <span className="italic font-serif text-rust">We'll find the law.</span>
        </h2>
        <p className="mt-6 text-lg text-cream/80 max-w-2xl mx-auto">
          50 free credits. No card required. Built on India's courts — not the internet.
        </p>
        <form
          onSubmit={onSubmit}
          className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@chambers.in"
            className="flex-1 px-5 py-4 rounded bg-cream/10 border border-cream/20 text-cream placeholder:text-cream/50 focus:outline-none focus:border-rust"
          />
          <button
            type="submit"
            className="px-6 py-4 rounded bg-cream text-maroon font-semibold hover:bg-rust hover:text-cream transition shadow-elegant"
          >
            Start Free
          </button>
        </form>
        <div className="mt-8 flex items-center justify-center gap-2 text-cream/60 text-sm">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-4 h-4 fill-rust text-rust" />
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
    <footer className="bg-ink text-cream/70 py-16 border-t border-rust/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <a href="/" className="flex items-center mb-4">
              <Image
                src="/landing/lexram-wordmark.png"
                alt="LexRam"
                width={964}
                height={205}
                className="h-[22px] w-auto"
                style={{ filter: "brightness(0) invert(1) sepia(0.08)" }}
              />
            </a>
            <p className="text-sm leading-relaxed max-w-sm">
              AI legal analysis for Indian advocates. Point-of-law precedent mapping with verified Supreme Court citations.
            </p>
          </div>

          <div>
            <h4 className="font-sans text-cream font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#sc-precedent-research" className="hover:text-rust">Research &amp; Analysis</a></li>
              <li><a href="#petition-drafting" className="hover:text-rust">Drafting</a></li>
              <li><a href="/dashboard/tsr"     className="hover:text-rust">Title Scrutiny (TSR)</a></li>
              <li><a href="#pricing"  className="hover:text-rust">Pricing</a></li>
              <li><a href="#faq"      className="hover:text-rust">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans text-cream font-semibold mb-4">Company &amp; Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/blog"           className="hover:text-rust">Blog</a></li>
              <li><a href="/acts"           className="hover:text-rust">Bare Acts</a></li>
              <li><a href="/about"          className="hover:text-rust">About</a></li>
              <li><a href="/careers"        className="hover:text-rust">Careers</a></li>
              <li><a href="/contact"        className="hover:text-rust">Contact</a></li>
              <li><a href="/privacy"        className="hover:text-rust">Privacy (DPDP)</a></li>
              <li><a href="/terms"          className="hover:text-rust">Terms of Service</a></li>
              <li><a href="/refund-policy"  className="hover:text-rust">Refund Policy</a></li>
              <li><a href="/cookies"        className="hover:text-rust">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-cream/10 text-xs text-cream/40 leading-relaxed">
          LexRam is a research and drafting tool. It does not constitute legal advice and does not create an advocate–client relationship. All outputs require advocate review before use.
        </div>
        <div className="mt-4 flex flex-col md:flex-row justify-between gap-4 text-xs text-cream/50">
          <div>© {new Date().getFullYear()} Ramasubramanian AI Software Private Limited, Chennai. All rights reserved.</div>
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
  return (
    <main data-landing-v2 className="bg-cream">
      <Nav />
      <Hero />
      <TrustStrip />
      <Problem />
      <ParallaxBand
        image="/landing/sc-illustration.webp"
        kicker="WHY LEXRAM"
        title="Every source is Verified. India Law Trained for Perfection."
      />
      <Research />
      <Drafting />
      <PracticeAreas />
      <MarketComparison />
      <Stats />
      <Stories />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
