"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2, Play, Search,
  FileText, Shield, Scale, Quote, Zap,
  Users, BookOpen, TrendingUp,
} from "lucide-react";

/* ─── hooks ─────────────────────────────────────────────── */

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

function useAnimatedCount(target: number, inView: boolean, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const steps = 60;
    const inc = target / steps;
    const ms = duration / steps;
    const t = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setVal(Math.round(cur));
      if (cur >= target) clearInterval(t);
    }, ms);
    return () => clearInterval(t);
  }, [inView, target, duration]);
  return val;
}

function useTypewriter(lines: string[], inView: boolean) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const current = lines[lineIdx];
    const delay = deleting ? 35 : 65;
    const t = setTimeout(() => {
      if (!deleting) {
        if (charIdx < current.length) {
          setDisplayed(current.slice(0, charIdx + 1));
          setCharIdx(c => c + 1);
        } else {
          setTimeout(() => setDeleting(true), 1800);
        }
      } else {
        if (charIdx > 0) {
          setDisplayed(current.slice(0, charIdx - 1));
          setCharIdx(c => c - 1);
        } else {
          setDeleting(false);
          setLineIdx(i => (i + 1) % lines.length);
        }
      }
    }, delay);
    return () => clearTimeout(t);
  }, [inView, lines, lineIdx, charIdx, deleting]);

  return displayed;
}

/* ─── exports ───────────────────────────────────────────── */

export function LeftSidebar() {
  return (
    <aside className="hidden lg:flex flex-col gap-4">
      <div className="sticky top-20 flex flex-col gap-4">
        <StatsCard />
        <SearchDemoCard />
        <CourtBadgeCard />
      </div>
    </aside>
  );
}

export function RightSidebar() {
  return (
    <aside className="hidden lg:flex flex-col gap-4">
      <div className="sticky top-20 flex flex-col gap-4">
        <VideoDemoCard />
        <DraftingPreviewCard />
        <TSRCard />
        <TestimonialCard />
      </div>
    </aside>
  );
}

/* ─── LEFT: Stats card ───────────────────────────────────── */
function StatsCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const cases   = useAnimatedCount(50000, inView);
  const courts  = useAnimatedCount(25,    inView, 900);
  const users   = useAnimatedCount(500,   inView, 1100);

  return (
    <div ref={ref} className="rounded-2xl overflow-hidden border border-[#680318]/15 bg-[#fff7ec] shadow-sm">
      <div className="h-[3px] bg-gradient-to-r from-[#3a0d18] via-[#680318] to-[#b94826]" />
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b94826] mb-4">
          Platform at a glance
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Scale,    val: cases,  suffix: "+", label: "Judgments" },
            { icon: BookOpen, val: courts, suffix: "",  label: "Courts" },
            { icon: Users,    val: users,  suffix: "+", label: "Advocates" },
          ].map(({ icon: Icon, val, suffix, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1 py-3 px-2 rounded-xl bg-[#3a0d18]/[0.04]">
              <Icon className="h-4 w-4 text-[#b94826]" />
              <span className="font-serif text-xl font-bold text-[#3a0d18] tabular-nums leading-none">
                {val >= 1000 ? `${(val / 1000).toFixed(val >= 10000 ? 0 : 0)}k` : val}{suffix}
              </span>
              <span className="text-[10px] text-[#680318]/55 font-medium">{label}</span>
            </div>
          ))}
        </div>
        <Link
          href="/research"
          className="mt-4 flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-[#3a0d18] text-[#fff0df] text-sm font-semibold hover:bg-[#680318] transition-colors"
        >
          Explore Research <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ─── LEFT: Search demo card ─────────────────────────────── */
const SEARCH_QUERIES = [
  "right to privacy Article 21",
  "anticipatory bail conditions",
  "specific performance contract",
  "cheque bounce dishonour 138",
  "habeas corpus illegal detention",
];

function SearchDemoCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const query = useTypewriter(SEARCH_QUERIES, inView);

  const mockResults = [
    { court: "SC", year: "2024", title: "K.S. Puttaswamy v. UoI" },
    { court: "HC", year: "2023", title: "Maneka Gandhi principles" },
    { court: "SC", year: "2022", title: "Justice Chandrachud ruling" },
  ];

  return (
    <div ref={ref} className="rounded-2xl overflow-hidden border border-[#680318]/15 bg-[#fff7ec] shadow-sm">
      <div className="h-[3px] bg-gradient-to-r from-[#680318] to-[#b94826]" />
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b94826] mb-3">
          Research — live demo
        </p>
        {/* Fake search bar */}
        <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-[#680318]/20 bg-white mb-3">
          <Search className="h-3.5 w-3.5 text-[#680318]/40 shrink-0" />
          <span className="text-sm text-[#3a0d18] truncate flex-1">
            {query}
            <span className="inline-block w-[2px] h-4 bg-[#b94826] ml-px align-middle animate-[blink_1s_step-end_infinite]" />
          </span>
        </div>
        {/* Mock results */}
        <div className="space-y-1.5">
          {mockResults.map((r, i) => (
            <div
              key={r.title}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3a0d18]/[0.04] border border-[#680318]/8"
              style={{ opacity: inView ? 1 : 0, transition: `opacity 0.4s ease ${i * 0.15}s` }}
            >
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#680318]/10 text-[#680318] shrink-0">
                {r.court} {r.year}
              </span>
              <span className="text-xs text-[#3a0d18]/75 truncate">{r.title}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[#680318]/45 text-center">
          Search across 50,000+ real Indian judgments
        </p>
      </div>
    </div>
  );
}

/* ─── LEFT: Court coverage ───────────────────────────────── */
const COURTS = [
  "Supreme Court", "Delhi HC", "Bombay HC", "Madras HC",
  "Calcutta HC", "Kerala HC", "Karnataka HC", "Gujarat HC",
  "NCLAT", "NCLT", "NGT", "+ more",
];

function CourtBadgeCard() {
  return (
    <div className="rounded-2xl border border-[#680318]/12 bg-[#680318]/[0.03] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b94826] mb-3">
        Courts covered
      </p>
      <div className="flex flex-wrap gap-1.5">
        {COURTS.map(c => (
          <span
            key={c}
            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border border-[#680318]/15 text-[#3a0d18]/70 bg-[#fff7ec]"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── RIGHT: Video demo card ─────────────────────────────── */
function VideoDemoCard() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden border border-[#680318]/15 shadow-sm">
      {/* Thumbnail — CSS art representing a legal dashboard */}
      <div
        className="relative cursor-pointer group"
        style={{ height: 160, background: "linear-gradient(135deg, #1a0810 0%, #3a0d18 40%, #680318 70%, #8f3318 100%)" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(255,240,223,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,240,223,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        {/* Decorative bars (fake chart) */}
        <div className="absolute bottom-6 left-6 flex items-end gap-1.5">
          {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
            <div
              key={i}
              className="w-3 rounded-t-sm transition-all duration-500"
              style={{
                height: hovered ? h * 0.6 : h * 0.4,
                background: i === 3 ? "#CC5500" : "rgba(255,240,223,0.25)",
              }}
            />
          ))}
        </div>
        {/* Scale icon */}
        <Scale className="absolute top-5 right-5 h-8 w-8 text-[#fff0df]/20" />
        {/* LexRam watermark */}
        <span className="absolute top-4 left-5 text-[10px] font-bold tracking-[0.2em] uppercase text-[#fff0df]/30">
          LexRam
        </span>
        {/* Play button */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${hovered ? "bg-black/20" : "bg-black/0"}`}>
          <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#fff0df]/80 bg-[#fff0df]/15 backdrop-blur-sm transition-transform duration-300 ${hovered ? "scale-110" : "scale-100"}`}>
            <Play className="h-5 w-5 text-[#fff0df] fill-[#fff0df] ml-0.5" />
          </div>
        </div>
        {/* Duration badge */}
        <span className="absolute bottom-3 right-3 text-[10px] font-semibold text-[#fff0df]/70 bg-black/40 px-2 py-0.5 rounded">
          2:14
        </span>
      </div>

      <div className="bg-[#fff7ec] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b94826] mb-1">
          Product demo
        </p>
        <h3 className="font-serif text-base font-bold text-[#3a0d18] leading-snug mb-2">
          See LexRam in action — 2 minutes.
        </h3>
        <p className="text-xs text-[#680318]/60 leading-relaxed mb-3">
          Research a case, draft a pleading, and run a title check — live walkthrough.
        </p>
        <Link
          href="/sign-in"
          className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-[#3a0d18] text-[#fff0df] text-xs font-semibold hover:bg-[#680318] transition-colors"
        >
          <Zap className="h-3.5 w-3.5" /> Start free trial
        </Link>
      </div>
    </div>
  );
}

/* ─── RIGHT: Drafting preview card ───────────────────────── */
const DRAFT_LINES = [
  "IN THE HIGH COURT OF JUDICATURE\nAT MADRAS",
  "W.P. No. _______ of 2025",
  "In the matter of:\nRajan v. State of Tamil Nadu",
  "GROUNDS\n\n1. That the impugned order\npassed by the respondent...",
];

function DraftingPreviewCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const text = useTypewriter(DRAFT_LINES, inView);

  return (
    <div ref={ref} className="rounded-2xl overflow-hidden border border-[#680318]/15 shadow-sm">
      <div className="h-[3px] bg-gradient-to-r from-[#CC5500] to-[#b94826]" />
      <div className="bg-[#fff7ec] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b94826] mb-3">
          Drafting — live preview
        </p>
        {/* Fake document */}
        <div className="rounded-xl border border-[#680318]/12 bg-white shadow-sm p-4 mb-4" style={{ minHeight: 110 }}>
          <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-[#680318]/8">
            <FileText className="h-3 w-3 text-[#b94826]" />
            <span className="text-[10px] font-medium text-[#680318]/50">Draft — Writ Petition.docx</span>
            <span className="ml-auto flex gap-0.5">
              {["bg-red-300", "bg-yellow-300", "bg-green-300"].map(c => (
                <span key={c} className={`w-2 h-2 rounded-full ${c}`} />
              ))}
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#3a0d18]/80 leading-relaxed whitespace-pre-wrap">
            {text}
            <span className="inline-block w-[2px] h-3 bg-[#b94826] ml-px align-middle animate-[blink_1s_step-end_infinite]" />
          </p>
        </div>
        <ul className="space-y-1.5 mb-4">
          {["Writ petitions & plaints", "Bail applications", "Contracts & agreements"].map(f => (
            <li key={f} className="flex items-center gap-2 text-[12px] text-[#3a0d18]/75">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#CC5500] shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <Link
          href="/drafting"
          className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-[#CC5500] text-white text-sm font-semibold hover:bg-[#b94826] transition-colors shadow-sm"
        >
          Try Drafting <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ─── RIGHT: TSR card ────────────────────────────────────── */
const TSR_FEATURES = [
  { icon: Shield,     label: "Encumbrance check"    },
  { icon: TrendingUp, label: "Chain of title"        },
  { icon: Scale,      label: "Court order search"    },
  { icon: FileText,   label: "Structured PDF report" },
];

function TSRCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#3a0d18]/30 shadow-sm">
      <div className="bg-[#3a0d18] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b94826] mb-3">
          LexRam TSR
        </p>
        <h3 className="font-serif text-lg font-bold text-[#fff0df] leading-snug mb-1">
          Title Search Reports.
        </h3>
        <p className="text-xs text-[#fff0df]/50 leading-relaxed mb-4">
          Automated property title verification — built for Indian advocates.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {TSR_FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#fff0df]/6 border border-[#fff0df]/8">
              <Icon className="h-3.5 w-3.5 text-[#b94826] shrink-0" />
              <span className="text-[11px] text-[#fff0df]/70 leading-tight">{label}</span>
            </div>
          ))}
        </div>
        <Link
          href="/sign-in"
          className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-[#fff0df] text-[#3a0d18] text-sm font-semibold hover:bg-[#d8cdb8] transition-colors"
        >
          Access TSR <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ─── RIGHT: Testimonial rotator ─────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "Found a 2019 High Court order in 8 seconds that took me 2 hours manually before.",
    name: "Advocate, Madras HC",
    initials: "SM",
  },
  {
    quote: "The drafting tool cut my application time from a day to under an hour. Remarkable.",
    name: "Senior Advocate, Delhi HC",
    initials: "RK",
  },
  {
    quote: "TSR reports used to take three days. LexRam delivers them same afternoon.",
    name: "Property Lawyer, Chennai",
    initials: "AP",
  },
];

function TestimonialCard() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  const rotate = useCallback(() => {
    setFade(false);
    setTimeout(() => {
      setIdx(i => (i + 1) % TESTIMONIALS.length);
      setFade(true);
    }, 250);
  }, []);

  useEffect(() => {
    const t = setInterval(rotate, 4500);
    return () => clearInterval(t);
  }, [rotate]);

  const t = TESTIMONIALS[idx];

  return (
    <div className="rounded-2xl border border-[#680318]/12 bg-gradient-to-br from-[#fff7ec] to-[#ffecd5] p-5">
      <Quote className="h-5 w-5 text-[#b94826]/40 mb-3" />
      <p
        className="text-sm text-[#3a0d18]/80 leading-relaxed italic mb-4 transition-opacity duration-250"
        style={{ opacity: fade ? 1 : 0 }}
      >
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center gap-2.5" style={{ opacity: fade ? 1 : 0, transition: "opacity 0.25s" }}>
        <div className="grid place-items-center h-8 w-8 rounded-full bg-[#680318]/15 text-[#680318] text-xs font-bold shrink-0">
          {t.initials}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#3a0d18]">{t.name}</p>
          <div className="flex gap-0.5 mt-0.5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setFade(false); setTimeout(() => { setIdx(i); setFade(true); }, 250); }}
                className={`h-1 rounded-full transition-all duration-300 ${i === idx ? "w-4 bg-[#b94826]" : "w-1.5 bg-[#680318]/20"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}