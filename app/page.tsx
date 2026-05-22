"use client";

import type * as React from "react";
import { useEffect, useState } from "react";
import {
  Search, FileText, Scale, Shield, Sparkles, BookOpen, Gavel,
  CheckCircle2, ArrowRight, Quote, Plus, Minus, Star, Zap,
  Library, Newspaper, PenTool, Users, Download, Bookmark,
  Calendar, TrendingUp, FileSearch, Layers,
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
    const els = document.querySelectorAll("[data-landing-v2] .fade-up");
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
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#2a1a1c]/80">
          <a href="#research"  className="hover:text-[#680318] transition">Research</a>
          <a href="#drafting"  className="hover:text-[#680318] transition">Drafting</a>
          <a href="#resources" className="hover:text-[#680318] transition">Resources</a>
          <a href="#blog"      className="hover:text-[#680318] transition">Blog</a>
          <a href="#pricing"   className="hover:text-[#680318] transition">Pricing</a>
          <a href="#faq"       className="hover:text-[#680318] transition">FAQ</a>
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#680318]/85 via-[#680318]/70 to-[#2a1a1c]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(42,26,28,0.6)_100%)]" />

      <div
        className="relative max-w-6xl mx-auto px-6 py-32 text-[#fff0df]"
        style={{
          transform: `translateY(${y * -0.15}px)`,
          opacity: Math.max(0, 1 - y / 600),
        }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#fff0df]/30 bg-[#fff0df]/10 backdrop-blur-sm text-xs tracking-wider uppercase mb-8">
          <Sparkles className="w-3 h-3" /> Built on India's courts. Not the internet.
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.02] text-balance">
          You argue the case.
          <br />
          <span className="italic text-[#fff0df]/90">We'll find</span>{" "}
          <span className="text-[#b94826]">the law.</span>
        </h1>
        <p className="mt-8 text-lg md:text-2xl text-[#fff0df]/80 max-w-2xl font-light leading-relaxed">
          From statute to submission — without leaving Lexram. Research judgements, draft pleadings, manage matters — one platform, built for Indian advocates.
        </p>
        <div className="mt-12 flex flex-wrap gap-4">
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

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#fff0df]/60 text-xs tracking-[0.3em]">
        SCROLL
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
      <div className="text-center text-xs tracking-[0.3em] mb-6 text-[#fff0df]/60">
        TRUSTED BY ADVOCATES PRACTISING AT
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
   Problem
   ============================================================ */
function Problem() {
  useReveal();
  return (
    <section className="relative py-32 bg-[#fff0df]">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="fade-up">
          <div className="text-xs tracking-[0.3em] text-[#b94826] mb-6">THE PROBLEM</div>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-[#680318] text-balance leading-tight">
            Generic AI tools <span className="italic">hallucinate</span>.
            <br />
            Indian advocates cannot afford fiction.
          </h2>
          <p className="mt-8 text-lg md:text-xl text-[#2a1a1c]/70 max-w-3xl mx-auto leading-relaxed">
            Fabricated citations. Invented section numbers. Case names that don't exist.
            The cost of a hallucinated precedent isn't a bad email — it's a reputation.
          </p>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield,   title: "Verified, not generated", text: "Every answer anchored to a real document you can open." },
            { icon: BookOpen, title: "Trained on courts",       text: "Not the internet. SC judgements since 1950 + central statutes." },
            { icon: Zap,      title: "Ratio, not noise",        text: "Lexram isolates only the binding legal ratio from a judgement." },
          ].map((b, i) => (
            <div
              key={i}
              className="fade-up p-8 rounded-xl bg-[#fffaf0] border border-[#680318]/10 text-left shadow-soft hover:shadow-elegant transition"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-[#680318]/10 grid place-items-center mb-5">
                <b.icon className="w-6 h-6 text-[#680318]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#680318] mb-2">{b.title}</h3>
              <p className="text-[#2a1a1c]/70">{b.text}</p>
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
                : `bg-[#fffaf0] border-[#680318]/10 hover:border-[#b94826]/40 shadow-soft hover:shadow-elegant ${
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
                dark ? "text-[#fff0df]/70" : "text-[#2a1a1c]/70"
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
                      : "border-[#680318]/10 text-[#2a1a1c]/75"
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
  const features: Feature[] = [
    { icon: Layers,        t: "Ratio decidendi extractor", d: "Lexram isolates only the binding legal ratio. You get the law, not the noise.", detail: "Our extractor reads full judgements, separates obiter dicta from ratio, and surfaces only the binding principle — with paragraph citations." },
    { icon: Shield,        t: "Per incuriam test",          d: "Flagged instantly — never blindsided by a precedent you didn't know existed.",   detail: "Cross-checks every cited authority against later overruling judgements and statutory amendments to flag per incuriam risk." },
    { icon: TrendingUp,    t: "Precedent map",              d: "The precedent history tells you why the law is what it is.",                       detail: "Visualise how a doctrine evolved — followed, distinguished, doubted, or overruled — across decades of Indian jurisprudence." },
    { icon: CheckCircle2,  t: "Verified citations",         d: "Anchored to a real document you can open and verify. Never generated.",            detail: "Every citation links to the actual judgement PDF on the official court repository. Zero fabrication, by design." },
    { icon: FileSearch,    t: "Case hub",                   d: "All matters, research threads, and saved judgements in one workspace.",           detail: "Organise research by matter. Pin authorities, tag arguments, and resume threads exactly where you left them." },
    { icon: BookOpen,      t: "Tested & curated",           d: "Not trained on the internet. Trained on India's courts.",                          detail: "Our corpus is curated from Supreme Court of India, High Courts, and central statutes — manually verified, never scraped." },
  ];
  return (
    <section id="research" className="py-32 bg-[#fff0df] relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="fade-up">
            <div className="text-xs tracking-[0.3em] text-[#b94826] mb-4">01 — RESEARCH</div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#680318] leading-tight">
              Find the right legal answer — <span className="italic">verified</span>, not hallucinated.
            </h2>
            <p className="mt-6 text-lg text-[#2a1a1c]/70 leading-relaxed">
              Lexram searches India's largest curated legal database and returns answers anchored to real documents you can open, read, and rely on in court.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["SC Judgements (since 1950)", "Central Statutes", "Daily Updates"].map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-full bg-[#680318]/10 text-[#680318] text-sm"
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
          <div className="fade-up relative">
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

        <FeatureGrid features={features} />
      </div>
    </section>
  );
}

/* ============================================================
   Drafting
   ============================================================ */
function Drafting() {
  useReveal();
  const features: Feature[] = [
    { icon: Layers,       t: "Multi-document upload",       d: "Lexram reads across all of them and builds one coherent draft.", detail: "Upload pleadings, notices, FIRs, and prior orders. Lexram cross-references them and produces a unified draft plan." },
    { icon: FileSearch,   t: "Scan to draft",               d: "Scanned charge sheets, indexed and turned into a draft plan.",   detail: "OCR built for Indian court stamps and handwriting. Even faded scans become structured, searchable, drafted." },
    { icon: PenTool,      t: "Fact extraction engine",      d: "Who, what, when. Sections, parties, citations, events — mapped.",detail: "Automatically builds a chronology, party matrix, and section index from your source documents." },
    { icon: FileText,     t: "Response document builder",   d: "Structured exactly as the responding court or forum expects.",   detail: "Templates aligned to High Court rules, CPC, CrPC and tribunal practice — your reply is forum-ready from draft one." },
    { icon: CheckCircle2, t: "Edit at 2 stages",            d: "Draft plan and final draft are fully editable.",                  detail: "Approve the structure before any clause is written, then refine the final draft with full inline editing." },
    { icon: Search,       t: "Research integration",        d: "Pull research into your draft with one click.",                   detail: "Every authority from your research thread is one click away — insert with proper citation formatting." },
  ];
  return (
    <section id="drafting" className="py-32 bg-[#680318] text-[#fff0df] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(185,72,38,0.3),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="fade-up order-2 lg:order-1 relative">
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
          <div className="fade-up order-1 lg:order-2">
            <div className="text-xs tracking-[0.3em] text-[#b94826] mb-4">02 — DRAFTING</div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
              The first draft is <span className="italic text-[#b94826]">already</span> done.
            </h2>
            <p className="mt-6 text-lg text-[#fff0df]/80 leading-relaxed">
              Your documents. Your facts. LexRam's research. One draft.
              Nothing assumed. Nothing invented. Every citation traceable.
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

        <FeatureGrid features={features} tone="dark" />
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
        <div className="fade-up max-w-3xl">
          <div className="text-xs tracking-[0.3em] text-[#b94826] mb-4">03 — RESOURCES</div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#680318] leading-tight">
            A working library, not a <span className="italic">reference shelf</span>.
          </h2>
          <p className="mt-6 text-lg text-[#2a1a1c]/70 leading-relaxed">
            Statutes, commentary, templates and a network of practitioners — all curated for daily use, not for browsing.
          </p>
          <SectionCTA
            label="Open Resources"
            primaryHref={RESOURCES}
            eventName="cta_start_research_click"
            location="resources_section"
          />
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
  const features: Feature[] = [
    { icon: Newspaper,  t: "Weekly SC roundup",   d: "Every important Supreme Court ruling, summarised.",                detail: "Curated each Monday. Holding, ratio, and practical implications for practitioners — in under 300 words per case." },
    { icon: TrendingUp, t: "Doctrine trackers",   d: "Follow how key doctrines are evolving in real time.",              detail: "Long-form pieces tracing arbitration, constitutional, taxation, and criminal law doctrines through recent benches." },
    { icon: Gavel,      t: "Bench analysis",      d: "Composition, jurisprudential leanings, and recent trends.",        detail: "Data-backed bench profiles — argument styles, citation patterns, and recent rulings to inform your strategy." },
    { icon: PenTool,    t: "Practitioner essays", d: "Guest essays from senior advocates and judges.",                   detail: "Original writing on practice craft — from drafting style to courtroom etiquette — by voices you respect." },
    { icon: BookOpen,   t: "Case comments",       d: "Deep-dives on landmark judgements as they happen.",                detail: "Published within 48 hours of major rulings. What the court actually held, what it implied, what to argue next." },
    { icon: Sparkles,   t: "Product updates",     d: "What's new in Lexram — features, datasets, and improvements.",     detail: "Transparent release notes. New courts added, datasets refreshed, drafting improvements — every fortnight." },
  ];
  return (
    <section id="blog" className="py-32 bg-[#680318] text-[#fff0df] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(185,72,38,0.3),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="fade-up max-w-3xl">
          <div className="text-xs tracking-[0.3em] text-[#b94826] mb-4">04 — BLOG</div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
            Writing for advocates who <span className="italic text-[#b94826]">actually argue</span>.
          </h2>
          <p className="mt-6 text-lg text-[#fff0df]/80 leading-relaxed">
            Case comments, doctrine trackers, bench analysis — published for practitioners, by practitioners.
          </p>
          <SectionCTA
            label="Read the Blog"
            tone="dark"
            primaryHref={BLOG}
            eventName="cta_start_research_click"
            location="blog_section"
          />
        </div>

        <FeatureGrid features={features} tone="dark" />
      </div>
    </section>
  );
}

/* ============================================================
   Practice
   ============================================================ */
function Practice() {
  useReveal();
  const items = [
    { icon: Search,   title: "Case Management",     text: "Matters, threads, saved judgements — one organised workspace." },
    { icon: Gavel,    title: "Title Tracing",       text: "Trace property titles end-to-end with verified records." },
    { icon: BookOpen, title: "Resources & Network", text: "Editorial commentary, statute libraries and a network of practitioners." },
  ];
  return (
    <section className="py-32 bg-[#fff0df]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="fade-up">
          <div className="text-xs tracking-[0.3em] text-[#b94826] mb-4">05 — PRACTICE</div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#680318]">
            One platform. Not two workflows.
          </h2>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <div
              key={i}
              className="fade-up p-10 rounded-2xl bg-gradient-to-br from-[#fffaf0] to-[#fff0df] border border-[#680318]/10 shadow-soft text-left"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-warm grid place-items-center mb-6 shadow-soft">
                <it.icon className="w-7 h-7 text-[#fff0df]" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#680318] mb-3">{it.title}</h3>
              <p className="text-[#2a1a1c]/70 leading-relaxed">{it.text}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <SectionCTA label="Start Practising" location="practice_section" />
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
          <div key={i}>
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
  const quotes = [
    { q: "The ratio decidendi extractor alone is worth everything. I used to spend hours reading full judgements to find the one principle I needed. Lexram pulls it out in seconds — accurately, every time.", a: "Prashanth V I",       r: "MS.2330/2019, Madras High Court, Madurai" },
    { q: "What struck me first was that every result Lexram returned was a real judgement I could open and verify. After years of being burned by AI tools that fabricate citations, that alone made me a convert.", a: "Shyam M",             r: "MS.8227/2024, District Court, Trichy" },
    { q: "The draft plan step is what separates Lexram from everything else I've tried. I approve the structure before a single clause is written — so the final draft reflects my strategy, not the AI's interpretation of it.", a: "Johnson S A",         r: "MS. 1958/2023, Madras High Court" },
    { q: "I uploaded a scanned charge sheet — stamped and all — and Lexram read it, extracted the relevant facts, and had a bail application draft plan ready. I genuinely did not expect it to work that well.", a: "Sam Dinakaran Manuel", r: "MS. 4232/2025, Madras High Court" },
    { q: "Lexram's conflicting judgement detector and bench strength indicator have completely changed how I prepare. I walk into court knowing I haven't missed anything.", a: "Shree Harini H N",    r: "MS. 4036/2025, Madras HC, Madurai" },
    { q: "Research and drafting being one workflow is not a feature — it is the correct way to work.", a: "Pravin Kumar T",      r: "MS. 2649/2021, Madras High Court" },
  ];
  return (
    <section className="py-32 bg-[#fff0df]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="fade-up text-center mb-16">
          <div className="text-xs tracking-[0.3em] text-[#b94826] mb-4">USER STORIES</div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#680318] text-balance">
            From the advocates who use it every day.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <figure
              key={i}
              className="fade-up p-8 rounded-2xl bg-[#fffaf0] border border-[#680318]/10 hover:shadow-elegant transition group"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <Quote className="w-8 h-8 text-[#b94826] mb-4 opacity-60" />
              <blockquote className="text-[#2a1a1c]/80 leading-relaxed text-[15px]">
                &ldquo;{q.q}&rdquo;
              </blockquote>
              <figcaption className="mt-6 pt-6 border-t border-[#680318]/10">
                <div className="font-serif font-bold text-[#680318]">{q.a}</div>
                <div className="text-xs text-[#2a1a1c]/60 mt-1">{q.r}</div>
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
    { name: "Advocate",   price: "₹2,499", note: "/month",       features: ["Unlimited research", "Full drafting suite", "Case hub", "Email support"],                       cta: "Start trial", featured: true,  href: SIGNUP },
    { name: "Firm",       price: "Custom", note: "Team pricing", features: ["All Advocate features", "Shared workspaces", "Firm-wide history", "Priority support"],         cta: "Talk to us",  featured: false, href: CONTACT },
  ];
  return (
    <section id="pricing" className="py-32 bg-[#fff0df]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="fade-up text-center mb-16">
          <div className="text-xs tracking-[0.3em] text-[#b94826] mb-4">PRICING</div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#680318]">
            Built for solo practice. Priced for it too.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <div
              key={i}
              onMouseEnter={() => track("pricing_plan_hover", { plan: p.name })}
              className={`fade-up relative p-10 rounded-2xl border transition ${
                p.featured
                  ? "bg-[#680318] text-[#fff0df] border-[#b94826] shadow-elegant scale-105"
                  : "bg-[#fffaf0] border-[#680318]/10 shadow-soft"
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
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
                    p.featured ? "text-[#fff0df]/70" : "text-[#2a1a1c]/60"
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
                      className={p.featured ? "text-[#fff0df]/90" : "text-[#2a1a1c]/80"}
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
  const faqs = [
    { q: "What is Lexram AI?",                                a: "Lexram is an AI-powered legal platform built exclusively for Indian lawyers — research, drafting, case management, title tracing, resources and networking in one place." },
    { q: "How is Lexram different from ChatGPT?",             a: "Generic AI tools generate from the internet — and hallucinate. Lexram is trained exclusively on verified Indian legal sources. Every answer traces back to a real judgement, statute, or circular." },
    { q: "Is Lexram built for Indian law specifically?",      a: "Yes. Entirely. Not trained on the internet. Trained on India's courts — SC of India and Indian legislation." },
    { q: "Is my data and client information safe?",           a: "Yes. Everything you upload and draft is encrypted and never used to train our models. Compliant with India's Digital Personal Data Protection Act, 2023." },
    { q: "Will Lexram ever cite a judgement that doesn't exist?", a: "No. Lexram only surfaces citations from its verified database. It does not generate, infer, or fabricate case names or citations — ever." },
    { q: "How current is Lexram's judgement database?",       a: "Every Supreme Court judgement since 1950, updated daily with new Supreme Court of India rulings." },
    { q: "Can I edit the draft before it's finalised?",       a: "Yes — at two stages. You review and edit the draft plan before drafting begins, and the final draft is fully editable before export." },
    { q: "Is there a free trial?",                            a: "Yes — 50 credits free." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-32 bg-[#fff0df]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="fade-up text-center mb-16">
          <div className="text-xs tracking-[0.3em] text-[#b94826] mb-4">FAQ</div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#680318]">Questions, answered.</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="fade-up border border-[#680318]/15 rounded-xl bg-[#fffaf0] overflow-hidden"
              >
                <button
                  onClick={() => {
                    const next = isOpen ? null : i;
                    setOpen(next);
                    track("faq_toggle", { question: f.q, opened: next !== null });
                  }}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-[#680318]/5 transition"
                >
                  <span className="font-serif text-lg font-semibold text-[#680318]">{f.q}</span>
                  {isOpen ? (
                    <Minus className="w-5 h-5 text-[#b94826] flex-none" />
                  ) : (
                    <Plus className="w-5 h-5 text-[#b94826] flex-none" />
                  )}
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-[#2a1a1c]/75 leading-relaxed">{f.a}</p>
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
    <section id="cta" className="relative py-32 overflow-hidden bg-[#680318]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(185,72,38,0.4),transparent_70%)]" />
      <div className="relative max-w-4xl mx-auto px-6 text-center text-[#fff0df]">
        <Scale className="w-12 h-12 mx-auto text-[#b94826] mb-6" />
        <h2 className="font-serif text-4xl md:text-6xl font-bold leading-tight text-balance">
          You argue the case.
          <br />
          <span className="italic text-[#b94826]">We'll find the law.</span>
        </h2>
        <p className="mt-6 text-lg text-[#fff0df]/80 max-w-2xl mx-auto">
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
    <footer className="bg-[#2a1a1c] text-[#fff0df]/70 py-16 border-t border-[#b94826]/20">
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
  return (
    <main data-landing-v2 className="bg-[#fff0df]">
      <Nav />
      <Hero />
      <TrustStrip />
      <Problem />
      <ParallaxBand
        image={parallaxCourt}
        kicker="WHY LEXRAM"
        title="Every citation is real. Every source is open."
      />
      <Research />
      <Drafting />
      <Resources />
      <Blog />
      <Practice />
      <Stats />
      <Stories />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
