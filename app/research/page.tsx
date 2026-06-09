"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, ChevronDown, Gavel, Scale,
  Layers, Search, PenTool, Bookmark, Mic,
  BookOpen, Shield, TrendingUp, CheckCircle2,
  GitCompare, MessageSquare, HelpCircle,
} from "lucide-react";
import { LandingNav, LandingFooter } from "@/components/LandingShell";
import { track } from "@/lib/landing-analytics";
import { PageSidebarNav } from "@/components/page-sidebar-nav";

const researchImg   = "/landing/research-img.jpg";
const RESEARCH      = "/dashboard/research-2";
const SIGNUP        = "/sign-in?intent=signup";

function useReveal() {
  useEffect(() => {
    const selector =
      '[data-landing-v2] .fade-up, [data-landing-v2] .reveal-up, [data-landing-v2] .reveal-down, [data-landing-v2] .reveal-left, [data-landing-v2] .reveal-right, [data-landing-v2] .reveal-zoom, [data-landing-v2] .reveal-blur, [data-landing-v2] .reveal-tilt, [data-landing-v2] .reveal-rise, [data-landing-v2] .zig-row, [data-landing-v2] .paper-lift, [data-landing-v2] [data-reveal-section]';
    const sections = document.querySelectorAll('[data-landing-v2] > section, [data-landing-v2] > footer');
    sections.forEach((sec, i) => { if (i === 0) return; sec.setAttribute('data-reveal-section', ''); });
    const els = document.querySelectorAll(selector);
    const io = new IntersectionObserver(
      (entries) => { entries.forEach((e) => e.isIntersecting && e.target.classList.add("in-view")); },
      { threshold: 0.05, rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const failsafe = window.setTimeout(() => {
      document.querySelectorAll(selector).forEach((el) => el.classList.add("in-view"));
    }, 2500);
    return () => { io.disconnect(); window.clearTimeout(failsafe); };
  }, []);
}

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
        setOffset(window.innerHeight / 2 - center);
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

function ParallaxHeroImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const off = useElementScrollOffset(ref);
  const factor = 0.08;
  return (
    <div ref={ref} className="reveal-right relative overflow-hidden rounded-2xl max-h-[420px] lg:max-h-[460px]" style={{ transitionDelay: "200ms" }}>
      <div aria-hidden className="lex-breathe absolute inset-0 bg-[#6b1e2d] opacity-20 blur-3xl rounded-full pointer-events-none" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src} alt={alt} loading="lazy" width={1280} height={896}
        className="relative w-full aspect-[4/3] object-cover will-change-transform"
        style={{ transform: `translate3d(0, ${off * factor}px, 0)`, transition: "transform 60ms linear" }}
      />
    </div>
  );
}

function SectionCTA({ label, primaryHref = SIGNUP, location }: { label: string; primaryHref?: string; location: string }) {
  return (
    <div className="fade-up mt-5 flex flex-wrap items-center gap-4">
      <a
        href={primaryHref}
        onClick={() => track("cta_start_research_click", { location })}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#CC5500] to-[#CC5500] text-[#d8cdb8] px-6 py-3.5 rounded-xl font-semibold hover:opacity-90 transition shadow-[0_4px_22px_rgba(204,85,0,0.45)]"
      >
        {label} <ArrowRight className="w-4 h-4" />
      </a>
      <a
        href="/#contact"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#CC5500] to-[#CC5500] text-[#d8cdb8] px-6 py-3.5 rounded-xl font-semibold hover:opacity-90 transition shadow-[0_4px_22px_rgba(204,85,0,0.45)]"
      >
        Book a demo
      </a>
      <a
        href="/#pricing"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#CC5500] to-[#CC5500] text-[#d8cdb8] px-6 py-3.5 rounded-xl font-semibold hover:opacity-90 transition shadow-[0_4px_22px_rgba(204,85,0,0.45)]"
      >
        See Pricing
      </a>
    </div>
  );
}

/* ── Research section ─────────────────────────────────────────── */
function ResearchSection() {
  useReveal();
  return (
    <section id="research" className="h-[calc(100vh-80px)] flex items-center bg-[#d8cdb8] relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(107,30,45,0.08),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          <div>
            <div className="lex-kicker--bright mb-4">RESEARCH — AI LEGAL RESEARCH ASSISTANT</div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#3a0d18] leading-tight">
              Find the right legal answer —<br /><span className="italic">verified</span>, not hallucinated.
            </h2>
            <p className="mt-3 text-lg text-[#6b1e2d]/88 leading-relaxed">
              India&apos;s AI legal research platform — LexRam searches the largest curated database of Supreme Court judgements and statutes, you can open, read, and rely on in court.
            </p>

            {/* Database */}
            <div className="mt-4">
              <div className="reveal-down flex items-center gap-3 mb-2" style={{ transitionDelay: "360ms" }}>
                <div className="text-xs font-bold tracking-[0.3em] uppercase text-[#6b1e2d]/98">Database</div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#6b1e2d]/20 to-transparent" />
                <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#6b1e2d]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6b1e2d] animate-pulse" /> Updated daily
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { t: "SC Judgements",    s: "SUPREME COURT judgements since 1950",  icon: Gavel },
                  { t: "Central Statutes", s: "central Statutes since 1830",           icon: Scale },
                ].map((d, i) => (
                  <div key={d.t}
                    className="reveal-zoom group relative rounded-xl border border-[#6b1e2d]/15 bg-[#d8cdb8] p-3 hover:border-[#6b1e2d]/60 hover:-translate-y-0.5 overflow-hidden"
                    style={{ transitionDelay: `${440 + i * 120}ms` }}
                  >
                    <div aria-hidden className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-[#6b1e2d]/0 group-hover:bg-[#6b1e2d]/20 blur-2xl transition-all duration-500" />
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#6b1e2d]/20 border border-[#6b1e2d]/30 mb-3 group-hover:bg-[#6b1e2d]/30 transition-colors">
                        <d.icon className="w-5 h-5 text-[#6b1e2d]" />
                      </div>
                      <div className="font-serif text-lg font-bold text-[#3a0d18] leading-tight">{d.t}</div>
                      <div className="text-sm text-[#3a0d18] mt-1">{d.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal-blur" style={{ transitionDelay: "880ms" }}>
              <SectionCTA label="Start Research" primaryHref={RESEARCH} location="research_page" />
            </div>

          </div>
          <ParallaxHeroImage src={researchImg} alt="Legal research" />
        </div>

      </div>
    </section>
  );
}

/* ── Research Features ──────────────────────────────────────────── */
function ResearchFeaturesSection() {
  const panels = [
    {
      icon: Layers,
      title: "Case Hub",
      desc: "Case Hub is your central command for every matter you handle. Research threads, documents uploaded, and pleadings drafted are all pinned to their respective case — so nothing gets lost, nothing gets mixed up, and every matter stays exactly where you expect it.",
      visual: (
        <div className="h-36 relative overflow-hidden flex flex-col justify-center gap-2 px-5" style={{ background: "rgba(107,30,45,0.04)" }}>
          {[
            { name: "Sharma v. State of TN",  threads: "4 threads", drafts: "2 drafts" },
            { name: "Kumar v. Revenue Board",  threads: "6 threads", drafts: "1 draft"  },
            { name: "Devi v. Madras HC",       threads: "3 threads", drafts: "3 drafts" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ background: "rgba(107,30,45,0.07)", border: "1px solid rgba(107,30,45,0.13)", animation: `lex-card-slide-up 4s ease ${i * 1.3}s infinite` }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6b1e2d] animate-pulse" />
                <span className="text-[11px] font-medium text-[#3a0d18]">{item.name}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-[9px] text-[#6b1e2d]/65">{item.threads}</span>
                <span className="text-[9px] text-[#CC5500] font-semibold">{item.drafts}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Search,
      title: "Multiple Research Sessions, One Case",
      desc: "Every research thread you open for a matter is automatically pinned to that case. No hunting across sessions or retracing your steps — all threads for one case live together, so your research stays coherent from the first query to the last.",
      visual: (
        <div className="h-36 relative overflow-hidden flex flex-col justify-center px-5" style={{ background: "rgba(107,30,45,0.04)" }}>
          {[
            "Bail grounds under BNSS S.480 — 12 precedents",
            "Article 226 writ jurisdiction — 8 citations",
            "Per incuriam filter applied — 3 removed",
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2 border-b"
              style={{ borderColor: "rgba(107,30,45,0.09)", animation: `lex-card-slide-up 5s ease ${i * 1.6}s infinite` }}>
              <div className="w-5 h-5 rounded grid place-items-center shrink-0"
                style={{ background: "rgba(107,30,45,0.10)", border: "1px solid rgba(107,30,45,0.18)" }}>
                <Search className="w-2.5 h-2.5 text-[#6b1e2d]" />
              </div>
              <span className="text-[10px] text-[#3a0d18]/80 flex-1">{t}</span>
              <span className="text-[8px] font-bold text-[#6b1e2d]/45 tracking-widest uppercase shrink-0">Pinned</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: PenTool,
      title: "Drafting Integrated",
      desc: "Drafting is built into the same workspace as your research. When you are ready to move from finding the law to filing the argument, the transition is a single step — no exports, no copy-paste, no switching between platforms.",
      visual: (
        <div className="h-36 relative overflow-hidden flex items-center justify-center gap-5 px-8" style={{ background: "rgba(107,30,45,0.04)" }}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(107,30,45,0.12)", border: "1px solid rgba(107,30,45,0.22)" }}>
              <Search className="w-5 h-5 text-[#6b1e2d]" />
            </div>
            <span className="text-[9px] font-bold tracking-widest text-[#6b1e2d]/55 uppercase">Research</span>
          </div>
          <div className="flex-1 relative h-[2px] overflow-hidden rounded-full" style={{ background: "rgba(107,30,45,0.12)" }}>
            <div className="absolute inset-y-0 w-2/5 rounded-full"
              style={{ background: "linear-gradient(to right, transparent, #CC5500, transparent)", animation: "lex-card-flow 2s ease-in-out infinite" }} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(107,30,45,0.12)", border: "1px solid rgba(107,30,45,0.22)" }}>
              <PenTool className="w-5 h-5 text-[#6b1e2d]" />
            </div>
            <span className="text-[9px] font-bold tracking-widest text-[#6b1e2d]/55 uppercase">Draft</span>
          </div>
        </div>
      ),
    },
    {
      icon: Bookmark,
      title: "Research History in Case Hub",
      desc: "Your entire research history across all matters is preserved inside LexRam and remains fully searchable. Return to any case, any thread, or any prior research session at any point — nothing is lost when a matter goes dormant or resumes.",
      visual: (
        <div className="h-36 relative overflow-hidden" style={{ background: "rgba(107,30,45,0.04)" }}>
          <div style={{ animation: "lex-card-scroll 7s linear infinite" }}>
            {[
              { date: "Jun 2024", topic: "Anticipatory bail BNSS S.482" },
              { date: "May 2024", topic: "Writ Art. 226 jurisdiction"   },
              { date: "Apr 2024", topic: "Per incuriam SC filter"        },
              { date: "Mar 2024", topic: "Central statutes BNS lookup"  },
              { date: "Jun 2024", topic: "Anticipatory bail BNSS S.482" },
              { date: "May 2024", topic: "Writ Art. 226 jurisdiction"   },
              { date: "Apr 2024", topic: "Per incuriam SC filter"        },
              { date: "Mar 2024", topic: "Central statutes BNS lookup"  },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5 border-b"
                style={{ borderColor: "rgba(107,30,45,0.08)" }}>
                <span className="text-[9px] font-mono text-[#6b1e2d]/50 shrink-0 w-16">{item.date}</span>
                <span className="w-px h-3 bg-[#6b1e2d]/20 shrink-0" />
                <span className="text-[11px] text-[#3a0d18]/72">{item.topic}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: Mic,
      title: "Speech to Text",
      desc: "Speak your research query directly into the search bar — LexRam listens, transcribes it accurately, and returns relevant legal answers immediately. No typing required, no reformulation needed — your question is heard and acted on exactly as you asked it.",
      visual: (
        <div className="h-36 relative overflow-hidden flex items-center justify-center gap-4 px-6" style={{ background: "rgba(107,30,45,0.04)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(107,30,45,0.14)", border: "1px solid rgba(107,30,45,0.25)" }}>
            <Mic className="w-4 h-4 text-[#6b1e2d]" />
          </div>
          <div className="flex items-center gap-[3px]">
            {[0.35,0.65,1,0.55,0.9,0.75,0.45,0.85,0.65,0.35,0.75,0.95,0.5].map((h, i) => (
              <div key={i} className="w-[3px] rounded-full bg-[#6b1e2d]"
                style={{ animation: `lex-card-wave 1.2s ease ${i * 0.09}s infinite`, height: `${h * 30}px` }} />
            ))}
          </div>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <span className="text-[9px] tracking-[0.25em] text-[#6b1e2d]/45 uppercase font-medium">Listening...</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="research-features" className="relative min-h-screen py-10 md:py-12 bg-[#d8cdb8] overflow-hidden">
      <div aria-hidden className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6b1e2d]/6 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <div className="lex-kicker--bright mb-5">RESEARCH FEATURES — 5 CAPABILITIES</div>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#3a0d18] leading-tight">What LexRam <em className="italic text-[#6b1e2d]">Research</em> checks for you.</h2>
        </div>

        {/* Zigzag timeline */}
        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-10 bottom-10 w-px bg-[#6b1e2d]/15 hidden lg:block" />
          {panels.map((panel, i) => {
            const Icon = panel.icon;
            const isLeft = i % 2 === 0;
            return (
              <div key={i} className={`relative flex flex-col lg:flex-row items-start mb-8 lg:mb-0 lg:pb-8 ${!isLeft ? "lg:flex-row-reverse" : ""}`}>
                <div
                  className="absolute left-1/2 top-9 -translate-x-1/2 z-10 w-5 h-5 rounded-full ring-[3px] ring-[#d8cdb8] hidden lg:block"
                  style={{ background: i % 2 === 0 ? "#6b1e2d" : "#CC5500" }}
                />
                <div className={`w-full lg:w-1/2 ${isLeft ? "lg:pr-14" : "lg:pl-14"}`}>
                  <div className="bg-[#f5f0e8] border border-[#6b1e2d]/20 rounded-2xl overflow-hidden hover:shadow-[0_16px_48px_-12px_rgba(107,30,45,0.18)] transition-all duration-300">
                    {/* Animated visual panel */}
                    <div className="border-b border-[#6b1e2d]/10 overflow-hidden">
                      {panel.visual}
                    </div>
                    {/* Text content */}
                    <div className="p-7">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="font-mono text-sm font-bold text-[#3a0d18] tracking-widest">{String(i + 1).padStart(2, "0")}</span>
                        <span className="h-px flex-1 bg-[#6b1e2d]/10" />
                        <div className="w-8 h-8 rounded-lg bg-[#6b1e2d]/6 border border-[#6b1e2d]/10 grid place-items-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-[#6b1e2d]" />
                        </div>
                      </div>
                      <h3 className="font-serif font-bold text-[#3a0d18] leading-snug text-2xl md:text-3xl mb-3">{panel.title}</h3>
                      <p className="text-lg text-[#3a0d18] leading-relaxed">{panel.desc}</p>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block lg:w-1/2" />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

/* ── LexRam Edge ──────────────────────────────────────────────── */
function LexRamEdgeSection() {
  const [active, setActive] = useState<number>(0);
  const [paused, setPaused] = useState(false);
  const PANEL_COUNT = 5;
  const INTERVAL = 2000;

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % PANEL_COUNT);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [paused]);

  const panels = [
    {
      icon: BookOpen,
      title: "Statute to Precedent",
      desc: "LexRam anchors every research query in the governing statute before surfacing precedents. You understand why a ruling exists, not just what was decided — giving you the interpretive context advocates actually need.",
      image: "/landing/library.jpg",
    },
    {
      icon: Shield,
      title: "Per Incuriam Test",
      desc: "Before a precedent reaches you, LexRam applies a per incuriam test to eliminate decisions that courts ignored as binding authority. Every result you see is law you can stand behind.",
      image: "/landing/papers.jpg",
    },
    {
      icon: TrendingUp,
      title: "Legal Indian Precedent History",
      desc: "Advocates get a complete, chronological view of how Supreme Court rulings have followed, distinguished, or evolved a legal position. No more piecing together a case's history across multiple searches — LexRam delivers the entire trail at once.",
      image: "/landing/courthouse.jpg",
    },
    {
      icon: CheckCircle2,
      title: "Zero Hallucination Legal AI",
      desc: "Every answer LexRam generates is tied to an actual document you can open and read. All citations are real, all references are verifiable — so you can rely on your research output with full professional confidence.",
      image: "/landing/lawbook.jpg",
    },
    {
      icon: Gavel,
      title: "Trained on India's Courts",
      desc: "LexRam's database is built entirely from verified Indian legal sources — not the internet at large. Every answer is grounded in the actual law of Indian courts, filtered free of noise, so your research reflects India's legal reality, not generic AI output.",
      image: "/landing/chamber.jpg",
    },
  ];

  return (
    <section id="research-edge" className="relative overflow-hidden min-h-screen py-10 md:py-12 bg-[#d8cdb8]">
      {/* Kicker */}
      <div className="bg-[#d8cdb8] pt-0 pb-3 text-center">
        <div className="lex-kicker--bright">LEXRAM EDGE — 5 RESEARCH CAPABILITIES</div>
      </div>

      <div
        className="relative flex h-[65vh]"
        onMouseLeave={() => setPaused(false)}
        onMouseEnter={() => setPaused(true)}
      >
        {/* Heading overlay */}
        <div className="absolute top-0 inset-x-0 z-20 text-center pt-10 pointer-events-none bg-gradient-to-b from-black/65 to-transparent pb-16">
          <h2 className="font-serif font-bold text-white leading-tight text-3xl sm:text-4xl md:text-5xl">
            Research the way <em className="italic">courts reason.</em>
          </h2>
        </div>

        {/* Panels */}
        {panels.map((panel, i) => {
          const Icon = panel.icon;
          const isActive = active === i;
          return (
            <div
              key={i}
              className="relative overflow-hidden cursor-pointer"
              style={{
                flex: isActive ? 3 : 1,
                transition: "flex 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
              onMouseEnter={() => { setPaused(true); setActive(i); }}
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${panel.image})`,
                  transform: isActive ? "scale(1.06)" : "scale(1)",
                  transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/25" />
              {/* Maroon tint — fades on active */}
              <div
                className="absolute inset-0 bg-[#6b1e2d]/45"
                style={{ opacity: isActive ? 0 : 1, transition: "opacity 0.5s ease" }}
              />
              {/* Right divider */}
              <div className="absolute top-0 right-0 bottom-0 w-px bg-white/10 z-10" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-7 z-10">
                <div className="font-mono text-base font-bold tracking-widest text-white/25 mb-4">
                  {String(i + 1).padStart(2, "00")}
                </div>
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 grid place-items-center mb-4">
                  <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif font-bold text-white leading-snug text-4xl md:text-[2.25rem] mb-2">
                  {panel.title}
                </h3>
                <div
                  style={{
                    maxHeight: isActive ? "140px" : "0px",
                    opacity: isActive ? 1 : 0,
                    overflow: "hidden",
                    transition: "max-height 0.45s ease, opacity 0.4s ease",
                  }}
                >
                  <p className="text-white/75 text-lg leading-relaxed mb-4 mt-1">{panel.desc}</p>
                  <a
                    href={RESEARCH}
                    onClick={() => track("cta_start_research_click", { location: `edge_panel_${i + 1}` })}
                    className="inline-flex items-center gap-1.5 text-[#CC5500] font-semibold text-lg hover:gap-3 transition-all duration-200"
                  >
                    Start Research <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────────────────── */
function ResearchTestimonials() {
  const quotes = [
    {
      q: "I am practising at Madras High Court as a Litigant and the one constant frustration has been missing a judgement that opposing counsel finds. LexRam's conflicting judgement detector and bench strength indicator have completely changed how I prepare. I walk into court knowing I haven't missed anything.",
      a: "Shree Harini H N",
      r: "MS. 4036/2025 · Research Law Assistant, Madras High Court, Madurai Bench",
    },
    {
      q: "What struck me first was that every result LexRam returned was a real judgement I could open and verify. After years of being burned by AI tools that fabricate citations, that alone made me a convert.",
      a: "Shyam M",
      r: "MS. 8227/2024 · Practising at District Court, Trichy, Tamil Nadu",
    },
  ];

  return (
    <section id="research-testimonials" className="min-h-screen py-10 md:py-12 bg-[#d8cdb8] relative overflow-hidden">

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="lex-kicker--bright mb-4">TESTIMONIALS — FROM ADVOCATES</div>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#3a0d18] leading-tight mb-4">
            From the advocates who <em className="italic">use it every day</em>.
          </h2>
          <p className="text-[#6b1e2d]/85 max-w-xl mx-auto">
            Filter by what they speak about — research, drafting, or our editorial.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {quotes.map((quote, i) => (
            <div
              key={i}
              className="relative flex flex-col bg-[#f5f0e8] border border-[#6b1e2d]/20 rounded-2xl p-8 hover:shadow-[0_16px_48px_-12px_rgba(107,30,45,0.18)] transition-all duration-300"
            >
              {/* Large decorative quote mark */}
              <div aria-hidden className="absolute top-6 right-7 font-serif text-[80px] leading-none text-[#6b1e2d]/42 select-none pointer-events-none">&ldquo;</div>

              {/* Quote */}
              <blockquote className="relative flex-1">
                <p className="font-serif italic text-xl md:text-2xl text-[#3a0d18] leading-relaxed">
                  &ldquo;{quote.q}&rdquo;
                </p>
              </blockquote>

              {/* Divider */}
              <div className="mt-7 mb-5 h-px bg-[#6b1e2d]/10" />

              {/* Attribution */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#6b1e2d]/25 border border-[#6b1e2d]/30 grid place-items-center shrink-0">
                  <span className="font-serif font-bold text-xl text-[#3a0d18]">
                    {quote.a.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-lg font-semibold text-[#3a0d18]">{quote.a}</div>
                  <div className="text-base text-[#3a0d18] mt-0.5 leading-snug">{quote.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-[#6b1e2d]/58 tracking-widest uppercase">
          <div className="h-px w-12 bg-[#6b1e2d]/40" />
          Verified advocates · India
          <div className="h-px w-12 bg-[#6b1e2d]/40" />
        </div>

      </div>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────── */
function ResearchFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    { q: "Does LexRam have the latest Supreme Court judgements — how current is the database?",  a: "LexRam covers every Supreme Court judgement since 1950 and updates daily with new Supreme Court of India decisions." },
    { q: "Does LexRam generate fake citations or fabricated case names?",                          a: "No. LexRam only surfaces citations from its verified database i.e Supreme Court Judgements. It does not generate, infer, or fabricate case names or citations — ever. Hence no hallucinated citations or fabricated judges' analysis." },
    { q: "What if two Supreme Court benches have taken opposite views on the same legal point?",  a: "LexRam's per incuriam checker filters out compromised judgements at the source — what reaches you is only the law that holds." },
    { q: "How do I know if the Supreme Court judgement I am relying on is still good law?",       a: "Every judgement in LexRam is marked — affirmed, distinguished, or overruled — so you never argue from a precedent that no longer stands." },
  ];

  return (
    <section id="research-faq" className="min-h-screen py-10 md:py-12 bg-[#d8cdb8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="mb-8">
          <h2 className="font-serif font-bold text-[#6b1e2d] text-4xl sm:text-5xl md:text-6xl leading-[1.0] mb-4">
            Common <em className="italic">questions.</em>
          </h2>
          <p className="italic text-[#6b1e2d]/78 text-lg md:text-xl">
            Four of the questions we hear most often about research.
          </p>
        </div>

        {/* Accordion */}
        <div>
          <div className="border-t border-[#6b1e2d]/15" />
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-b border-[#6b1e2d]/15">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-6 py-5 text-left group"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif font-bold text-xl md:text-2xl text-[#6b1e2d] leading-snug group-hover:text-[#CC5500] transition-colors">
                    {item.q}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#6b1e2d] shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="pb-4">
                      <p className="text-[#3a0d18] text-lg md:text-xl leading-relaxed">{item.a}</p>
                    </div>
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

/* ── Page ─────────────────────────────────────────────────────── */
export default function ResearchPage() {
  return (
    <div data-landing-v2 className="min-h-screen bg-[#d8cdb8]">
      <PageSidebarNav items={[
        { id: "research",              icon: Search,        label: "Overview"     },
        { id: "research-features",     icon: Layers,        label: "Features"     },
        { id: "research-edge",         icon: GitCompare,    label: "Edge"         },
        { id: "research-testimonials", icon: MessageSquare, label: "Reviews"      },
        { id: "research-faq",          icon: HelpCircle,    label: "FAQ"          },
      ]} />
      <LandingNav />
      <main className="pt-20">
        <ResearchSection />
        <ResearchFeaturesSection />
        <LexRamEdgeSection />
        <ResearchTestimonials />
        <ResearchFAQ />
      </main>
      <LandingFooter />
    </div>
  );
}

