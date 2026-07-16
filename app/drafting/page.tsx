"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, ChevronDown, Gavel, Scale,
  FileText, FileSearch, PenTool, Layers, Download, CheckCircle2,
  GitCompare, MessageSquare, HelpCircle, CreditCard, Mail,
} from "lucide-react";
import { LandingNav, LandingFooter } from "@/components/LandingShell";
import { track } from "@/lib/landing-analytics";
import { PageSidebarNav } from "@/components/page-sidebar-nav";

const draftingImg = "/landing/drafting-img.jpg";
const DRAFTING    = "/dashboard/research-2?mode=draft";
const SIGNUP      = "/sign-in?intent=signup";

/* ── Hooks ────────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const selector =
      '[data-landing-v2] .fade-up, [data-landing-v2] .reveal-up, [data-landing-v2] .reveal-down, [data-landing-v2] .reveal-left, [data-landing-v2] .reveal-right, [data-landing-v2] .reveal-zoom, [data-landing-v2] .reveal-blur, [data-landing-v2] .reveal-tilt, [data-landing-v2] .reveal-rise, [data-landing-v2] [data-reveal-section]';
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
        setOffset(window.innerHeight / 2 - (rect.top + rect.height / 2));
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

/* ── Parallax hero image (dark tone) ─────────────────────────── */
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

/* ── Section CTA ─────────────────────────────────────────────── */
function SectionCTA({ label, primaryHref = SIGNUP, location }: { label: string; primaryHref?: string; location: string }) {
  return (
    <div className="fade-up mt-5 flex flex-wrap items-center gap-4">
      <a
        href={primaryHref}
        onClick={() => track("cta_start_research_click", { location })}
        className="inline-flex items-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-6 py-3.5 rounded-xl font-semibold hover:bg-[#CC5500] transition group"
      >
        {label} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
      </a>
      <a
        href="/#contact"
        className="inline-flex items-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-6 py-3.5 rounded-xl font-medium hover:bg-[#AA4400] transition"
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

/* ── Drafting hero section ────────────────────────────────────── */
function DraftingSection() {
  useReveal();
  return (
    <section id="drafting" className="h-[calc(100vh-80px)] flex items-center bg-[#d8cdb8] relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(107, 30, 45,0.08),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          <div>
            <div className="lex-kicker--bright mb-4">LexDraft- AI Legal Drafting Assistant</div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#3a0d18] leading-tight">
              The first draft is <span className="italic text-[#6b1e2d]">&ldquo;already&rdquo;</span> done.
            </h2>
            <p className="mt-3 text-lg text-[#6b1e2d]/88 leading-relaxed">
              Upload your documents. Tell LexRam what petition you need — anticipatory bail, writ under Article 226, legal notice, etc. Every draft is backed by a real Supreme Court Judgements and statutes.
            </p>

            {/* Database */}
            <div className="mt-4">
              <div className="reveal-down flex items-center gap-3 mb-2" style={{ transitionDelay: "360ms" }}>
                <div className="text-xs font-bold tracking-[0.3em] uppercase text-[#6b1e2d]/98">Database</div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#6b1e2d]/20 to-transparent" />
                <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#6b1e2d]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6b1e2d] animate-pulse" /> Verified sources
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { t: "SC Judgements",    s: "SUPREME COURT judgements",             icon: Gavel },
                  { t: "Central Statutes", s: "BNS/IPC, BNSS/CRPC, BSA/IEA",         icon: Scale },
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
              <SectionCTA label="Start Drafting" primaryHref={DRAFTING} location="drafting_page" />
            </div>

          </div>
          <ParallaxHeroImage src={draftingImg} alt="Legal drafting" />
        </div>

      </div>
    </section>
  );
}

/* ── Drafting Capabilities — Scroll-Driven Story ──────────────── */
function DraftingCapabilitiesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef(0); // updated only on real wheel events, not programmatic scroll

  const features = [
    {
      n: "01", icon: FileText,
      title: "Multi-document Upload",
      summary: "Upload multiple legal documents — LexRam reads across all of them and drafts one coherent response",
      detail: "Upload your entire document set at once. LexRam reads across every file simultaneously and builds a single, coherent response that draws from the full bundle — not just the document you opened last. No manual collation, no missed context.",
      visual: (
        <div className="flex flex-col h-full pt-[52px] px-6 pb-6 gap-4">
          <div className="rounded-xl border-2 border-dashed border-[#6b1e2d]/15 bg-[#6b1e2d]/[0.025] px-6 py-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#6b1e2d]/10 border border-[#6b1e2d]/15 grid place-items-center mx-auto mb-3">
              <FileText className="w-5 h-5 text-[#6b1e2d]" />
            </div>
            <div className="font-serif text-sm font-semibold text-[#6b1e2d] mb-1">Drop the entire case file</div>
            <div className="text-[11px] text-[#6b1e2d]/68">PDFs · scans · charge sheets · prior orders</div>
          </div>
          <div className="space-y-2 flex-1">
            {[
              { name: "complaint_bundle.pdf", meta: "84 pages",   state: "Indexed",  pct: 100 },
              { name: "annexures.zip",        meta: "7 files",    state: "Indexing", pct: 62  },
              { name: "fir_chennai.jpg",      meta: "Scan · OCR", state: "OCR'd",    pct: 100 },
            ].map((f, fi) => (
              <div key={fi} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#6b1e2d]/8 bg-[#6b1e2d]/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-[#6b1e2d]/6 border border-[#6b1e2d]/8 grid place-items-center shrink-0">
                  <FileText className="w-4 h-4 text-[#6b1e2d]/68" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#6b1e2d] font-medium truncate">{f.name}</div>
                  <div className="text-[10px] text-[#6b1e2d]/62 mt-0.5">{f.meta}</div>
                </div>
                {f.pct < 100 ? (
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <div className="w-14 h-1 rounded-full bg-[#6b1e2d]/8 overflow-hidden">
                      <div className="h-full bg-[#6b1e2d] rounded-full" style={{ width: `${f.pct}%` }} />
                    </div>
                    <span className="text-[9px] text-[#6b1e2d]/52">{f.pct}%</span>
                  </div>
                ) : (
                  <span className="shrink-0 text-[9px] tracking-wider uppercase px-2 py-1 rounded-full bg-[#6b1e2d]/8 text-[#6b1e2d] border border-[#6b1e2d]/15">{f.state}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-[#6b1e2d]/8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6b1e2d] animate-pulse shrink-0" />
            <span className="text-[11px] text-[#6b1e2d]/65 font-medium">Reading all 3 documents simultaneously</span>
          </div>
        </div>
      ),
    },
    {
      n: "02", icon: FileSearch,
      title: "Scan to Draft",
      summary: "Scan physical legal documents — LexRam indexes and drafts a structured response instantly",
      detail: "Scan a physical document and LexRam takes it from there. It maps every key element: parties, sections, citations, and events. The extracted facts are structured exactly as the responding court or forum expects them, so your draft is organised correctly from the ground up, every time",
      visual: (
        <div className="flex flex-col h-full pt-[52px] px-6 pb-6 gap-5">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#6b1e2d]/58 font-medium">Scanned input → indexed → draft</div>
          <div className="flex items-start gap-2">
            {[
              { Icon: FileSearch, label: "Scanned",       sub: "PDF · JPG · TIFF", bg: "bg-[#6b1e2d]/6", border: "border-[#6b1e2d]/10", ic: "text-[#6b1e2d]/78" },
              { Icon: FileSearch, label: "OCR + Indexed", sub: "Searchable text",  bg: "bg-[#6b1e2d]/8", border: "border-[#6b1e2d]/15", ic: "text-[#6b1e2d]"   },
              { Icon: PenTool,    label: "Draft built",   sub: "Ready to edit",    bg: "bg-[#6b1e2d]",   border: "border-[#6b1e2d]",    ic: "text-white"       },
            ].map((step, si) => (
              <div key={si} className="flex-1 flex flex-col items-center gap-1.5 relative">
                <div className={`w-11 h-11 rounded-xl border grid place-items-center ${step.bg} ${step.border}`}>
                  <step.Icon className={`w-5 h-5 ${step.ic}`} />
                </div>
                <div className="text-[11px] font-semibold text-[#6b1e2d] text-center leading-tight">{step.label}</div>
                <div className="text-[9px] text-[#6b1e2d]/62 text-center">{step.sub}</div>
                {si < 2 && <div className="absolute right-[-9px] top-3 text-[#6b1e2d]/42"><ArrowRight className="w-3.5 h-3.5" /></div>}
              </div>
            ))}
          </div>
          <div className="flex-1 rounded-xl border border-[#6b1e2d]/8 bg-[#6b1e2d]/[0.02] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#6b1e2d]/8 text-[9px] tracking-[0.22em] uppercase text-[#6b1e2d]/55 font-medium">Extracted from scan</div>
            <div className="p-4 space-y-3">
              {[
                { label: "WHO",   value: "Ravi Kumar (Accused) · State of Tamil Nadu (Respondent)" },
                { label: "WHAT",  value: "Anticipatory bail application u/s 482 BNSS" },
                { label: "WHEN",  value: "Date of incident: 14 March 2024" },
                { label: "WHICH", value: "Madras High Court · Principal Bench, Chennai" },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <span className="shrink-0 text-[9px] font-bold tracking-[0.18em] text-[#6b1e2d] mt-0.5 w-9">{row.label}</span>
                  <span className="text-[12px] text-[#6b1e2d]/82 leading-snug">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      n: "03", icon: Layers,
      title: "Draft Management",
      summary: "Find every pleading draft under its case — no searching through individual research threads",
      detail: "All pleadings and drafts created for a matter are collected directly inside that case, not scattered across individual research threads. When you need to retrieve or review a draft, you go to the case — and it is there.",
      visual: (
        <div className="flex flex-col h-full pt-[52px] px-6 pb-6 gap-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#6b1e2d]/8">
            <div className="w-7 h-7 rounded-lg bg-[#6b1e2d]/6 border border-[#6b1e2d]/8 grid place-items-center shrink-0">
              <Layers className="w-3.5 h-3.5 text-[#6b1e2d]/72" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-[#6b1e2d]">Sharma v. State of Tamil Nadu</div>
              <div className="text-[9px] text-[#6b1e2d]/62 mt-0.5">Case Hub · 3 drafts</div>
            </div>
          </div>
          <div className="space-y-2.5 flex-1">
            {[
              { name: "bail_application_v2.docx",   date: "Jun 15, 2024", label: "Latest", lc: "bg-[#6b1e2d]/8 text-[#6b1e2d] border-[#6b1e2d]/18" },
              { name: "anticipatory_bail_v1.docx",  date: "Jun 12, 2024", label: "Filed",  lc: "bg-[#6b1e2d]/6 text-[#6b1e2d] border-[#6b1e2d]/12" },
              { name: "discharge_petition_v3.docx", date: "Jun 08, 2024", label: "Draft",  lc: "bg-[#6b1e2d]/4 text-[#6b1e2d]/78 border-[#6b1e2d]/8" },
            ].map((d, di) => (
              <div key={di} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#6b1e2d]/8 bg-[#6b1e2d]/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-[#6b1e2d]/6 border border-[#6b1e2d]/8 grid place-items-center shrink-0">
                  <FileText className="w-4 h-4 text-[#6b1e2d]/68" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#6b1e2d] font-medium truncate">{d.name}</div>
                  <div className="text-[10px] text-[#6b1e2d]/62 mt-0.5">{d.date}</div>
                </div>
                <span className={`shrink-0 text-[9px] tracking-wider uppercase px-2 py-1 rounded-full border ${d.lc}`}>{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#6b1e2d]/8">
            <span className="text-[11px] text-[#6b1e2d]/62">All drafts · one case hub</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#6b1e2d]" />
              <span className="text-[11px] text-[#6b1e2d]/68 font-medium">Zero missed context</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      n: "04", icon: Download,
      title: "Response Document Builder",
      summary: "AI legal response drafting structured to the format of the responding Indian court or forum",
      detail: "Every response document LexRam builds follows the structure the specific court or forum requires. Format, sequence, and presentation are aligned to what the tribunal expects — so you are not reformatting after drafting, you are filing from it.",
      visual: (
        <div className="flex flex-col h-full pt-[52px] px-6 pb-6 gap-4">
          <div>
            <div className="text-[9px] tracking-[0.25em] uppercase text-[#6b1e2d]/88 font-medium mb-1">Draft plan</div>
            <div className="font-serif text-sm font-bold text-[#6b1e2d] leading-snug">Anticipatory bail u/s 482 BNSS</div>
          </div>
          <div className="flex-1 space-y-2">
            {[
              "Title, parties and jurisdiction",
              "Statement of facts (8 paragraphs)",
              "Grounds for anticipatory bail",
              "Reliance on Arnesh Kumar v. State of Bihar",
              "Prior history & undertaking",
              "Prayer & verification",
            ].map((step, si) => (
              <div key={si} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#6b1e2d]/8 bg-[#6b1e2d]/[0.02]">
                <span className="w-6 h-6 rounded-md grid place-items-center bg-[#6b1e2d]/8 text-[10px] font-mono text-[#6b1e2d] shrink-0 border border-[#6b1e2d]/12">
                  {String(si + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-[13px] text-[#6b1e2d]/85 leading-snug">{step}</span>
                <CheckCircle2 className="w-4 h-4 text-[#6b1e2d] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      n: "05", icon: PenTool,
      title: "Edit at 2 Stages",
      summary: "Edit the draft plan before writing begins and the final draft after — full advocate control at every stage",
      detail: "LexRam gives you two distinct points of control — the draft plan before any clause is written, and the final draft once it is generated. Both are fully editable, so you can shape the argument at the structural level and refine it at the language level.",
      visual: (
        <div className="flex flex-col h-full pt-[52px] px-6 pb-6 gap-5">
          <div className="grid grid-cols-2 gap-3 flex-1">
            {[
              { stage: "Stage 1", sub: "Plan",  body: "Outline + headings + cited authorities. Approve the structure before any clause is written.", pct: 100 },
              { stage: "Stage 2", sub: "Draft", body: "Full prose, formatted, citations linked. Final edits before export to court.", pct: 70 },
            ].map((s, si) => (
              <div key={si} className="flex flex-col rounded-xl border border-[#6b1e2d]/8 bg-[#6b1e2d]/[0.02] p-4 gap-3">
                <div>
                  <div className="text-[9px] tracking-[0.22em] uppercase text-[#6b1e2d] font-bold mb-0.5">{s.stage}</div>
                  <div className="font-serif text-sm font-semibold text-[#6b1e2d]">{s.sub}</div>
                </div>
                <div className="text-[12px] text-[#6b1e2d]/78 leading-snug flex-1">{s.body}</div>
                <div>
                  <div className="flex items-center justify-between text-[9px] text-[#6b1e2d]/58 mb-1.5">
                    <span>Progress</span><span>{s.pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#6b1e2d]/8 overflow-hidden">
                    <div className="h-full bg-[#6b1e2d] rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#6b1e2d]/8">
            <div className="flex items-center gap-1.5 text-[11px] text-[#6b1e2d]/65">
              <PenTool className="w-3.5 h-3.5" /><span>Inline editor at both stages</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#6b1e2d]/68 font-medium">
              <Download className="w-3.5 h-3.5 text-[#6b1e2d]" /><span>Export as .docx</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  /* ── Effect 1: track real user wheel activity (not programmatic scroll) ── */
  useEffect(() => {
    const onWheel = () => { lastWheelTime.current = Date.now(); };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  /* ── Effect 2: scroll-driven index — reads wrapper position vs window ── */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const scrolled = -el.getBoundingClientRect().top;
        const scrollable = el.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return;
        if (scrolled < 0) { setActiveIndex(0); return; }
        if (scrolled > scrollable) return;
        const totalSlots = 15; // 3 cycles × 5 features = circular
        const idx = Math.floor((scrolled / scrollable) * totalSlots) % 5;
        setActiveIndex(idx);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  /* ── Effect 3: auto-advance when user hasn't wheeled for 2.5 s ── */
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastWheelTime.current < 2500) return; // user is actively scrolling
      const el = wrapperRef.current;
      if (!el) return;
      // Only auto-advance when the section is currently pinned in the viewport
      const rect = el.getBoundingClientRect();
      const isPinned = rect.top <= 0 && rect.bottom > window.innerHeight;
      if (!isPinned) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      const currentScrolled = Math.max(0, -el.getBoundingClientRect().top);
      const totalSlots = 15;
      const currentSlot = Math.floor((currentScrolled / scrollable) * totalSlots);
      const nextSlot = Math.min(currentSlot + 1, totalSlots - 1);
      window.scrollTo({ top: el.offsetTop + (nextSlot / totalSlots) * scrollable, behavior: "smooth" });
      setActiveIndex(nextSlot % 5);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // 5 features × 20vh each = 100vh scrollable + 100vh sticky = 200vh total
  return (
    <div id="drafting-features" ref={wrapperRef} style={{ height: "400vh" }}>
      <section className="sticky top-20 h-[calc(100vh-80px)] bg-[#d8cdb8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex flex-col pt-4 pb-6">

          <div className="mb-2 text-center">
            <div className="lex-kicker--bright mb-2">FEATURES — DRAFTING CAPABILITIES</div>
            <h2 className="font-serif font-light text-[#3a0d18] leading-tight tracking-tight text-3xl sm:text-4xl md:text-5xl">
              Five tools. One complete draft.
            </h2>
          </div>

          {/* Two-column layout */}
          <div className="flex-[2] grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-12 min-h-0">

            {/* ── LEFT: visual panel ── */}
            <div className="hidden lg:flex items-stretch">
              <div
                className="relative overflow-hidden bg-white w-full"
                style={{
                  height: "100%",
                  borderRadius: 28,
                  boxShadow: "0 40px 80px -20px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-4"
                  style={{ background: "linear-gradient(to bottom, rgba(247,241,230,0.97) 65%, transparent)" }}
                >
                  <div className="flex items-center gap-1.5">
                    {features.map((_, i) => (
                      <div
                        key={i}
                        className="rounded-full"
                        style={{
                          width: activeIndex === i ? 22 : 6,
                          height: 6,
                          background: activeIndex === i ? "#6b1e2d" : "rgba(107, 30, 45,0.18)",
                          transition: "width 400ms cubic-bezier(0.4,0,0.2,1), background 400ms cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#6b1e2d]/62">
                    {features[activeIndex].n} / 05
                  </span>
                </div>
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="absolute inset-0"
                    style={{
                      opacity: activeIndex === i ? 1 : 0,
                      transition: "opacity 350ms cubic-bezier(0.4,0,0.2,1)",
                      zIndex: activeIndex === i ? 1 : 0,
                    }}
                  >
                    {f.visual}
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: stacked cards, no box ── */}
            <div className="relative min-h-0">
              {features.map((f, i) => {
                const isActive = activeIndex === i;
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="absolute inset-0 flex items-center"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateY(0)" : "translateY(18px)",
                      transition: "opacity 420ms cubic-bezier(0.4,0,0.2,1), transform 420ms cubic-bezier(0.4,0,0.2,1)",
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                  >
                    <div className="w-full">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="font-mono text-base tracking-[0.25em] text-[#3a0d18]">{f.n}</span>
                        <div
                          className="w-11 h-11 rounded-xl grid place-items-center"
                          style={{ background: "rgba(107, 30, 45,0.10)", border: "1px solid rgba(107, 30, 45,0.22)" }}
                        >
                          <Icon className="w-5 h-5 text-[#6b1e2d]" />
                        </div>
                      </div>
                      <h3
                        className="font-serif font-bold text-[#3a0d18] leading-tight mb-5"
                        style={{ fontSize: "clamp(2.0rem, 3vw, 2.8rem)" }}
                      >
                        {f.title}
                      </h3>
                      <p className="text-xl leading-relaxed font-medium text-[#3a0d18] mb-4">{f.summary}</p>
                      <p className="text-lg leading-relaxed text-[#3a0d18] mb-8">{f.detail}</p>
                      <div className="lg:hidden rounded-2xl overflow-hidden bg-white mb-7"
                        style={{ height: 240, boxShadow: "0 8px 32px -8px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                        {f.visual}
                      </div>
                      <a
                        href={DRAFTING}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-lg font-semibold text-[#d8cdb8]"
                        style={{ background: "#6b1e2d" }}
                      >
                        Try {f.title} <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>



        </div>
      </section>
    </div>
  );
}
/* ── Drafting Testimonials ────────────────────────────────────── */
function DraftingTestimonials() {
  const quotes = [
    {
      q: "Upload the FIR and charge sheet, describe what I need, and a complete draft is ready in minutes. I edit, I file. That is it.",
      a: "Arjun Venkatesh",
      r: "Sessions Court, Coimbatore · Tamil Nadu",
    },
    {
      q: "The two-stage editing is what convinced me. I can shape the argument at the plan level before a single sentence is written.",
      a: "Priya Nair",
      r: "Kerala High Court · Kerala",
    },
  ];

  return (
    <section id="drafting-testimonials" className="min-h-screen py-10 md:py-12 bg-[#d8cdb8] relative overflow-hidden">

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="lex-kicker--bright mb-4">TESTIMONIALS — FROM ADVOCATES</div>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#3a0d18] leading-tight mb-4">
            From the advocates who <em className="italic">use it every day</em>.
          </h2>
          <p className="text-[#6b1e2d]/85 max-w-xl mx-auto">
            Filter by what they speak about — research, drafting, or our editorial.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {quotes.map((quote, i) => (
            <div
              key={i}
              className="relative flex flex-col bg-white border border-[#6b1e2d]/10 rounded-3xl p-8 hover:shadow-[0_16px_48px_-12px_rgba(107, 30, 45,0.14)] transition-all duration-300"
            >
              {/* Large decorative quote mark */}
              <div aria-hidden className="absolute top-6 right-7 font-serif text-[80px] leading-none text-[#6b1e2d]/42 select-none pointer-events-none">&ldquo;</div>

              {/* Quote */}
              <blockquote className="relative flex-1">
                <p className="font-serif italic text-xl md:text-2xl text-[#6b1e2d]/93 leading-relaxed">
                  &ldquo;{quote.q}&rdquo;
                </p>
              </blockquote>

              {/* Divider */}
              <div className="mt-7 mb-5 h-px bg-[#6b1e2d]/10" />

              {/* Attribution */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#6b1e2d]/25 border border-[#6b1e2d]/30 grid place-items-center shrink-0">
                  <span className="font-serif font-bold text-xl text-[#6b1e2d]">
                    {quote.a.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-lg font-semibold text-[#6b1e2d]">{quote.a}</div>
                  <div className="text-base text-[#6b1e2d]/78 mt-0.5 leading-snug">{quote.r}</div>
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

/* ── LexRam Edge (Drafting) — vertical tab panel ─────────────── */
function LexRamEdgeDraftingSection() {
  const [active, setActive] = useState(0);
  const lastClick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastClick.current < 4000) return;
      setActive(prev => (prev + 1) % 5);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const features = [
    {
      n: "01", t: "One Platform, No Gaps",
      kicker: "LEGAL RESEARCH AND DRAFTING IN ONE PLATFORM",
      heading: "From legal research to courtroom draft — no copy-paste, no context lost, no platform switch",
      desc: "LexRam connects research and drafting in a single, unbroken workflow. What you find during research flows directly into what you file — so there is no gap between the law you identify and the argument you make",
      points: [
        "Research and drafting in the same workspace",
        "No copy-paste, no context switching",
        "What you find in research goes straight into what you file",
        "One step from finding the law to filing the argument",
      ],
    },
    {
      n: "02", t: "Zero Assumptions",
      kicker: "YOUR FACTS, YOUR DOCUMENTS, ZERO ASSUMPTIONS",
      heading: "AI legal drafting built only from your uploaded documents — no assumptions, nothing invented",
      desc: "LexRam drafts exclusively from the documents you upload. It does not fill gaps with guesses or infer facts you have not provided. Every line of the draft traces back to something you gave it — nothing assumed, nothing invented.",
      points: [
        "Drafts exclusively from your uploaded documents",
        "No guesses, no inferred facts",
        "Every line traces back to what you gave it",
        "Nothing assumed, nothing invented",
      ],
    },
    {
      n: "03", t: "Structures Before It Writes",
      kicker: "REVIEW AND APPROVE BEFORE DRAFTING BEGINS",
      heading: "Review and approve the full draft structure before a single clause is written",
      desc: "Before any clause is drafted, LexRam presents the complete structural plan for your document. You can review, edit, and approve the outline — so you stay in control of the argument architecture before drafting begins.",
      points: [
        "Full draft plan shown before writing begins",
        "Review and edit the outline at structural level",
        "Approve before a single clause is written",
        "Full control of argument architecture",
      ],
    },
    {
      n: "04", t: "Reads Your Full Bundle",
      kicker: "UPLOAD YOUR ENTIRE CASE FILE",
      heading: "Upload your full case bundle — LexRam reads every document and drafts the complete picture",
      desc: "LexRam does not skim. It reads across your entire uploaded case bundle — every FIR, chargesheet, order, and exhibit — and builds a draft that addresses the full factual and legal picture, not just the document you happened to open last.",
      points: [
        "Upload entire case bundle at once",
        "Reads every FIR, chargesheet, order and exhibit",
        "Addresses the complete factual picture",
        "No partial reads, no skipped documents",
      ],
    },
    {
      n: "05", t: "No Fake Citations",
      kicker: "EVERY SOURCE VERIFIABLE",
      heading: "Every case citation and section in your draft is real, openable, and verifiable",
      desc: "Every judgment and section cited in your draft links back to Supreme Court judgements and Central statutes. No hallucinated case names, no fabricated section references — zero hallucinated Supreme Court judgements and sections.",
      points: [
        "All citations link to real SC judgements",
        "No hallucinated case names ever",
        "No fabricated section references",
        "Every source is openable and verifiable",
      ],
    },
  ];

  const f = features[active];

  return (
    <section id="drafting-edge" className="relative min-h-[calc(100vh-80px)] py-6 md:py-8 bg-[#d8cdb8] overflow-hidden flex flex-col justify-center">
      <div aria-hidden className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6b1e2d]/6 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">

        {/* Header */}
        <div className="text-center mx-auto mb-4">
          <div className="lex-kicker--bright mb-3">LEXRAM EDGE — 5 DRAFTING CAPABILITIES</div>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#3a0d18] leading-tight">Drafts courts <em className="italic text-[#6b1e2d]">can trust.</em></h2>
        </div>

        {/* Vertical tab panel */}
        <div className="grid lg:grid-cols-[320px_1fr] rounded-3xl overflow-hidden border border-[#6b1e2d]/40 lg:h-[480px] shadow-[0_12px_48px_-8px_rgba(107,30,45,0.18)]">

          {/* ── Left: vertical tab list ── */}
          <div className="bg-[#f5f0e8] border-b lg:border-b-0 lg:border-r border-[#6b1e2d]/25 flex lg:flex-col overflow-x-auto lg:overflow-x-visible lg:overflow-y-hidden">
            {features.map((feat, i) => {
              const isActive = i === active;
              return (
                <button
                  key={i}
                  onClick={() => { lastClick.current = Date.now(); setActive(i); }}
                  className="relative shrink-0 lg:shrink text-left px-7 py-6 transition-all duration-200 w-44 lg:w-auto"
                  style={{
                    borderRight: i < features.length - 1 ? "1px solid rgba(107, 30, 45,0.10)" : "none",
                    borderBottom: "none",
                    background: isActive ? "rgba(107, 30, 45,0.12)" : "transparent",
                  }}
                >
                  {/* Active accent — left bar on desktop, bottom bar on mobile */}
                  {isActive && (
                    <>
                      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#CC5500] rounded-r hidden lg:block" />
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#CC5500] lg:hidden" />
                    </>
                  )}
                  <div className="text-sm font-mono tracking-[0.22em] mb-1.5" style={{ color: isActive ? "#CC5500" : "rgba(107, 30, 45,0.65)" }}>
                    {feat.n}
                  </div>
                  <div
                    className="font-serif text-base lg:text-[17px] leading-snug"
                    style={{
                      color: isActive ? "#3a0d18" : "rgba(107, 30, 45,0.80)",
                      fontStyle: isActive ? "italic" : "normal",
                      fontWeight: isActive ? 700 : 400,
                    }}
                  >
                    {feat.t}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Right: content panel ── */}
          <div className="bg-[#cfc3ac] p-6 lg:p-8">
            {/* Kicker */}
            <div className="text-sm font-bold tracking-[0.3em] uppercase mb-2" style={{ color: "#a84400" }}>
              {f.kicker}
            </div>

            {/* Heading */}
            <h3 className="font-serif font-bold text-[#3a0d18] leading-snug text-3xl md:text-4xl lg:text-[2.5rem] mb-2">
              {f.heading}
            </h3>

            {/* Description */}
            <p className="text-lg text-[#3a0d18]/90 leading-relaxed mb-3">
              {f.desc}
            </p>

            {/* Divider */}
            <div className="h-px bg-[#6b1e2d]/35 mb-3" />

            {/* Feature list */}
            <div className="space-y-2">
              {f.points.map((pt, j) => (
                <div key={j} className="flex items-start gap-4">
                  <span className="text-sm font-mono font-bold tracking-[0.22em] shrink-0 mt-0.5 text-[#CC5500]">
                    {String(j + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg text-[#3a0d18] font-semibold leading-snug">{pt}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ── Drafting FAQ ─────────────────────────────────────────────── */
function DraftingFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    { q: "Which courts and forums does LexRam Drafting support?",                          a: "LexRam drafts for Supreme Court, High Courts, Sessions Courts, Tribunals, and NCLT — each with the correct format, heading sequence, and presentation that the specific court expects." },
    { q: "Does LexRam ever fabricate citations or case names in a draft?",                  a: "No. LexRam only cites from its verified Supreme Court database. No AI-generated case names, no guesswork — every authority cited in your draft can be opened and verified." },
    { q: "Can I upload my case documents and have LexRam draft from them?",                 a: "Yes. Upload the entire file — FIRs, charge sheets, prior orders, annexures, and scanned exhibits. LexRam reads across every document simultaneously and builds one coherent draft from the full context." },
    { q: "What is two-stage editing and how does it give me control over the draft?",       a: "You first review and edit the draft plan — the argument structure before any prose is written. Once you approve the plan, LexRam generates the full draft. You can then refine the language inline and export to .docx at either stage." },
  ];

  return (
    <section id="drafting-faq" className="py-16 md:py-24 bg-[#d8cdb8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="mb-8">
          <h2 className="font-serif font-bold text-[#6b1e2d] text-4xl sm:text-5xl md:text-6xl leading-[1.0] mb-4">
            Common <em className="italic">questions.</em>
          </h2>
          <p className="italic text-[#6b1e2d]/78 text-lg md:text-xl">
            Four of the questions we hear most often about drafting.
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
export default function DraftingPage() {
  return (
    <div data-landing-v2 className="min-h-screen">
      <PageSidebarNav items={[
        { id: "drafting",              icon: "drafting",     label: "Overview"  },
        { id: "drafting-features",     icon: "layers",       label: "Features"  },
        { id: "drafting-edge",         icon: "compare",      label: "Edge"      },
        { id: "drafting-testimonials", icon: "testimonials", label: "Reviews"   },
        { id: "drafting-faq",          icon: "faq",          label: "FAQ"       },
        { id: "drafting-pricing",      icon: "credit-card",  label: "Pricing", href: "/#pricing" },
        { id: "drafting-contact",      icon: "contact",      label: "Contact", href: "/contact" },
      ]} />
      <LandingNav />
      <main className="pt-20">
        <DraftingSection />
        <DraftingCapabilitiesSection />
        <LexRamEdgeDraftingSection />
        <DraftingTestimonials />
        <DraftingFAQ />
      </main>
      <LandingFooter />
    </div>
  );
}
