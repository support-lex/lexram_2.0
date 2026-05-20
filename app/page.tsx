"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Search, Scale, Gavel, BookOpen, FileText, Building2, Users, Landmark,
  Sparkles, Quote, ChevronDown, ArrowUpRight, Check, Shield, Zap,
} from "lucide-react";
import { CinematicBg } from "@/components/landing/CinematicBg";
import { GoldenParticles } from "@/components/landing/GoldenParticles";
import { SparksFire } from "@/components/landing/SparksFire";
import { MagneticButton } from "@/components/landing/MagneticButton";
import { ParallaxLayer } from "@/components/landing/ParallaxLayer";
import { Stat } from "@/components/landing/Stat";
import { usePerf } from "@/hooks/use-perf";
import { track } from "@/lib/landing-analytics";

// All landing-page imagery lives in /public/landing/ (served by Next).
const heroImg     = "/landing/hero-courtroom.jpg";
const libraryImg  = "/landing/library.jpg";
const papersImg   = "/landing/papers.jpg";
const chamberImg  = "/landing/chamber.jpg";
const penImg      = "/landing/pen.jpg";
const meshImg     = "/landing/mesh.jpg";
// Ambient hero video — vendored locally from /public/landing/.
// CinematicBg only mounts it on capable devices (usePerf gates it), and
// it's lazy-mounted by the browser since the <video> element uses
// preload="metadata" + autoPlay/muted/loop/playsInline. ~17 MB on first
// view; subsequent loads come from the browser cache.
const heroAmbientUrl: string | undefined = "/landing/hero-ambient.mp4";

/* ---------- Cursor glow ---------- */
function CursorGlow() {
  const { cinematic } = usePerf();
  const [pos, setPos] = useState({ x: -300, y: -300 });
  useEffect(() => {
    if (!cinematic) return;
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [cinematic]);
  if (!cinematic) return null;
  return (
    <div
      className="pointer-events-none fixed z-[60] h-[420px] w-[420px] rounded-full"
      style={{
        left: pos.x - 210,
        top: pos.y - 210,
        background: "radial-gradient(circle, oklch(0.78 0.13 75 / 0.10) 0%, transparent 60%)",
        transition: "transform 0.18s ease-out",
        mixBlendMode: "screen",
      }}
    />
  );
}

/* ---------- Nav ---------- */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-5"}`}>
      <div
        className={`mx-auto max-w-7xl px-6 flex items-center justify-between transition-all duration-500 ${
          scrolled ? "glass-strong rounded-full px-5 py-2.5" : ""
        }`}
        style={scrolled ? { width: "min(96%, 1100px)" } : undefined}
      >
        <a href="#" className="flex items-center gap-2 group">
          <div className="relative">
            <Scale className="w-5 h-5 text-[var(--gold)]" />
            <div className="absolute inset-0 blur-md text-[var(--gold)] opacity-50 group-hover:opacity-100 transition-opacity">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <span className="font-display text-xl tracking-tight">
            Lex<span className="text-[var(--gold)]">Ram</span>{" "}
            <span className="text-[var(--ivory)]/70 text-base">AI</span>
          </span>
        </a>
        <nav className="hidden lg:flex items-center gap-7 text-sm text-[var(--landing-muted)]">
          {[
            { label: "Research",       href: "#research" },
            { label: "Drafting",       href: "#drafting" },
            { label: "Resources",      href: "/dashboard/search" },
            { label: "Blog",           href: "/blog" },
            { label: "Practice Areas", href: "#practice" },
            { label: "Pricing",        href: "#pricing" },
          ].map((l) => (
            <a key={l.label} href={l.href} className="hover:text-[var(--ivory)] transition-colors relative group whitespace-nowrap">
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[var(--gold)] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>
        <MagneticButton className="!px-5 !py-2 text-xs" onClick={() => (window.location.href = "/sign-in?intent=signup")}>
          Get Started <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
        </MagneticButton>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yContent = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const headline = "AI-Powered Legal Intelligence";
  const words = headline.split(" ");

  return (
    <section ref={ref} className="relative h-screen min-h-[720px] w-full overflow-hidden">
      <CinematicBg src={heroImg} overlay={0.62} videoSrc={heroAmbientUrl} />
      <GoldenParticles count={36} />
      {/* Spark embers rising from the bottom — mimics the warm glow of a hearth */}
      <SparksFire count={70} className="z-[5]" />
      {/* Top vignette to blend with nav */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[var(--charcoal)] to-transparent z-10" />
      {/* Bottom blend */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent z-10" />

      <motion.div
        style={{ y: yContent, opacity }}
        className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[11px] uppercase tracking-[0.25em] text-[var(--gold-soft)] mb-8"
        >
          <Sparkles className="w-3 h-3" /> New · Citation-grade reasoning v3
        </motion.div>

        <h1 className="font-display text-[clamp(2.5rem,7vw,6.5rem)] leading-[0.98] max-w-5xl">
          {words.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, delay: 0.4 + i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
              className={`inline-block mr-[0.25em] ${w === "Legal" ? "italic text-gradient-gold" : ""}`}
            >
              {w}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-6 max-w-xl text-base md:text-lg text-[var(--landing-muted)] leading-relaxed"
        >
          Research cases, draft petitions, and prepare arguments faster than ever — in a workspace built for the way modern advocates think.
        </motion.p>

        {/* Glass search bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.7 }}
          className="mt-10 w-full max-w-2xl"
        >
          <div className="glass-strong rounded-full pl-6 pr-2 py-2 flex items-center gap-3 gold-border-gradient">
            <Search className="w-4 h-4 text-[var(--gold)] shrink-0" />
            <input
              defaultValue="Doctrine of frustration in commercial contracts post-2020"
              className="flex-1 bg-transparent outline-none text-sm md:text-base placeholder:text-[var(--landing-muted)]"
            />
            <button className="px-5 py-2.5 rounded-full bg-gradient-to-br from-[oklch(0.86_0.10_80)] to-[oklch(0.62_0.14_50)] text-[var(--charcoal)] text-xs font-medium tracking-wide flex items-center gap-1.5 shadow-lg">
              Ask <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <MagneticButton
            onClick={() => {
              track("cta_start_research_click", { location: "hero" });
              window.location.href = "/dashboard/research-2";
            }}
          >
            Start Research
          </MagneticButton>
          <MagneticButton
            variant="ghost"
            onClick={() => {
              track("cta_book_demo_click", { location: "hero" });
              window.location.href = "/sign-in?intent=signup";
            }}
          >
            Book a Demo
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Bottom indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[var(--landing-muted)]"
      >
        Scroll
        <ChevronDown className="w-3 h-3 anim-float" />
      </motion.div>
    </section>
  );
}

/* ---------- Trust strip ---------- */
function TrustStrip() {
  const logos = [
    "Sterling & Wyatt", "Kapoor Chambers", "Mehta · Iyer LLP",
    "Hartwell Advocates", "Banerjee Law Group", "Clearwater Legal",
    "Caldwell & Sons", "Whitman Partners",
  ];
  return (
    <section className="relative py-10 border-y border-[var(--landing-border)] overflow-hidden">
      <div
        className="absolute inset-0 anim-gradient-pan"
        style={{
          background: "linear-gradient(90deg, oklch(0.14 0.012 40), oklch(0.20 0.05 25), oklch(0.14 0.012 40))",
        }}
      />
      <div className="relative">
        <div className="text-center text-[10px] uppercase tracking-[0.3em] text-[var(--landing-muted)] mb-6">
          Trusted by leading chambers &amp; in-house teams
        </div>
        <div
          className="flex overflow-hidden"
          style={{
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
            maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          }}
        >
          <div className="anim-marquee flex shrink-0 gap-16 pr-16">
            {[...logos, ...logos].map((l, i) => (
              <span
                key={i}
                className="font-display text-xl md:text-2xl text-[var(--ivory)]/55 hover:text-[var(--gold)] transition-colors whitespace-nowrap"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Problem section ---------- */
function ProblemSection() {
  const cards = [
    { title: "Research chaos", icon: BookOpen, body: "Hours lost across PDFs, judgments, and tabs — without a single source of truth." },
    { title: "Drafting delays", icon: FileText, body: "Each petition reinvented from scratch — formatting, citations, precedent, all manual." },
    { title: "Case overload", icon: Gavel, body: "Dozens of matters, each with its own deadlines, parties, exhibits, and arguments." },
  ];
  return (
    <section className="relative py-32 overflow-hidden">
      <CinematicBg src={chamberImg} overlay={0.78} tint="linear-gradient(135deg, oklch(0.27 0.08 20 / 0.4), transparent)" />
      <GoldenParticles count={14} />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] mb-4">The problem</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05]">
            Modern practice<br />
            <span className="italic text-gradient-gold">runs on friction.</span>
          </h2>
        </div>

        <div className="mt-20 relative max-w-2xl ml-auto">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 60, rotateZ: -2 + i }}
                whileInView={{ opacity: 1, y: 0, rotateZ: -1.5 + i * 1.2 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, delay: i * 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                className="glass-strong rounded-2xl p-7 md:p-8 mb-[-40px] last:mb-0 relative shadow-[0_30px_80px_-30px_oklch(0_0_0/0.7)]"
                style={{ marginLeft: `${i * 24}px` }}
              >
                <div className="flex items-start gap-5">
                  <div className="w-11 h-11 rounded-xl bg-[oklch(0.78_0.13_75/0.1)] border border-[oklch(0.78_0.13_75/0.3)] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[var(--gold)]" />
                  </div>
                  <div>
                    <div className="font-display text-2xl">{c.title}</div>
                    <p className="mt-2 text-sm text-[var(--landing-muted)] leading-relaxed">{c.body}</p>
                  </div>
                  <div className="ml-auto font-display text-3xl text-[var(--gold)]/40">0{i + 1}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Research experience ---------- */
function ResearchSection() {
  const citations = [
    "Krell v. Henry, [1903] 2 KB 740",
    "Satyabrata Ghose v. Mugneeram Bangur, AIR 1954 SC 44",
    "Energy Watchdog v. CERC, (2017) 14 SCC 80",
    "Naihati Jute Mills v. Hyaliram Jagannath, AIR 1968 SC 522",
  ];
  const [typed, setTyped] = useState("");
  const full = "Section 56 of the Indian Contract Act codifies frustration where performance becomes impossible or unlawful…";

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="research" className="relative py-28 md:py-36 overflow-hidden">
      <CinematicBg src={libraryImg} overlay={0.7} />
      <GoldenParticles count={20} />
      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] mb-4">Research</div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight">
            Every judgment ever written.<br />
            <span className="italic text-gradient-gold">Searched in seconds.</span>
          </h2>
          <p className="mt-6 text-[var(--landing-muted)] max-w-md leading-relaxed">
            Ask in plain English. Get a citation-grade answer with paragraph-level
            references across the Supreme Court, High Courts, tribunals and statute.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              ["12M+", "judgments indexed"],
              ["340ms", "median answer time"],
              ["98.4%", "citation accuracy"],
            ].map(([n, l]) => (
              <div key={l} className="flex items-baseline gap-4 border-b border-[var(--landing-border)] pb-3">
                <span className="font-display text-2xl text-[var(--gold)] w-24">{n}</span>
                <span className="text-sm text-[var(--landing-muted)]">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <ParallaxLayer speed={-50}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="glass-strong rounded-2xl p-6 md:p-7 gold-border-gradient relative shadow-[0_40px_100px_-40px_oklch(0.78_0.13_75/0.4)]"
          >
            <div className="flex items-center gap-2 text-xs text-[var(--landing-muted)] mb-4">
              <span className="w-2 h-2 rounded-full bg-red-400/70" />
              <span className="w-2 h-2 rounded-full bg-yellow-400/70" />
              <span className="w-2 h-2 rounded-full bg-green-400/70" />
              <span className="ml-3">lexram.ai/research</span>
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--gold)] mb-3">Answer</div>
            <p className="text-sm leading-relaxed text-[var(--ivory)]/90 min-h-[88px]">
              {typed}
              <span className="anim-blink text-[var(--gold)]">▍</span>
            </p>
            <div className="mt-6 text-xs uppercase tracking-[0.2em] text-[var(--gold)] mb-3">Citations</div>
            <div className="space-y-2">
              {citations.map((c, i) => (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.15, duration: 0.6 }}
                  className="flex items-center gap-3 text-xs p-2.5 rounded-lg bg-[oklch(1_0_0/0.03)] border border-[var(--landing-border)] hover:border-[var(--gold)] transition-colors group"
                >
                  <span className="font-display text-[var(--gold)] w-6">¶{i + 1}</span>
                  <span className="text-[var(--ivory)]/80 flex-1">{c}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--landing-muted)] group-hover:text-[var(--gold)] transition-colors" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

/* ---------- Drafting ---------- */
function DraftingSection() {
  const docs = ["Writ Petition", "Legal Notice", "Affidavit", "Bail Application", "Plaint", "Reply"];
  return (
    <section id="drafting" className="relative py-28 md:py-36 overflow-hidden">
      <CinematicBg src={papersImg} overlay={0.72} />
      <GoldenParticles count={18} />
      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
        <ParallaxLayer speed={-40}>
          <div className="glass-strong rounded-2xl overflow-hidden gold-border-gradient shadow-[0_40px_100px_-40px_oklch(0_0_0/0.8)]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--landing-border)]">
              <div className="flex items-center gap-2 text-xs text-[var(--landing-muted)]">
                <FileText className="w-3.5 h-3.5 text-[var(--gold)]" />
                writ-petition-draft.docx
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--gold)]">Auto-saved</div>
            </div>
            <div className="p-8 md:p-10 font-display text-[var(--ivory)]/95 leading-relaxed text-base md:text-[17px] min-h-[360px]">
              <div className="text-center mb-6">
                <div className="uppercase tracking-[0.2em] text-xs text-[var(--gold)]">In the High Court of Judicature</div>
                <div className="mt-2 font-medium">Writ Petition (Civil) No. ____ of 2025</div>
              </div>
              <p className="text-sm">
                <span className="font-semibold">1.</span> The Petitioner is a citizen of India and is filing the present
                writ petition under <em>Article 226</em> of the Constitution of India, seeking issuance of an
                appropriate writ, order, or direction in the nature of <em>mandamus</em>…
              </p>
              <p className="text-sm mt-3">
                <span className="font-semibold">2.</span> The Respondent, being an instrumentality of the State within
                the meaning of <em>Article 12</em>, has acted in derogation of the principles laid down in
                <span className="text-[var(--gold)]"> Maneka Gandhi v. Union of India, AIR 1978 SC 597</span>
                <span className="anim-blink text-[var(--gold)]">▍</span>
              </p>
            </div>
          </div>
        </ParallaxLayer>

        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] mb-4">Drafting</div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight">
            From blank page to<br />
            <span className="italic text-gradient-gold">filed petition.</span>
          </h2>
          <p className="mt-6 text-[var(--landing-muted)] max-w-md leading-relaxed">
            LexRam AI drafts the first version with the right structure, citations, and tone for your jurisdiction — so you spend your time refining, not formatting.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {docs.map((d) => (
              <motion.span
                key={d}
                whileHover={{ y: -3 }}
                className="px-4 py-2 rounded-full text-xs glass border border-[var(--landing-border)] hover:border-[var(--gold)] cursor-default"
              >
                {d}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Practice areas ---------- */
function PracticeSection() {
  const areas = [
    { name: "Criminal Law", icon: Gavel, img: chamberImg, blurb: "Bail, FIR, charge-sheets, sentencing precedent" },
    { name: "Corporate Law", icon: Building2, img: penImg, blurb: "M&A, compliance, contracts at scale" },
    { name: "Civil Litigation", icon: Scale, img: heroImg, blurb: "Pleadings, evidence, trial preparation" },
    { name: "Family Law", icon: Users, img: chamberImg, blurb: "Maintenance, custody, matrimonial relief" },
    { name: "Arbitration", icon: Landmark, img: libraryImg, blurb: "Awards, enforcement, institutional rules" },
    { name: "Property Law", icon: Shield, img: papersImg, blurb: "Title, partition, tenancy, conveyancing" },
  ];
  return (
    <section id="practice" className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[oklch(0.16_0.04_25)] to-[var(--background)]" />
      <GoldenParticles count={20} />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-14">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] mb-4">Practice areas</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight max-w-xl">
              Built for every<br />
              <span className="italic text-gradient-gold">corner of the bar.</span>
            </h2>
          </div>
          <p className="text-[var(--landing-muted)] max-w-sm text-sm">
            Specialized models, prompts and templates trained on the case-law and conventions of each domain.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {areas.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.a
                key={a.name}
                href="#"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.06 }}
                whileHover={{ y: -8 }}
                className="group relative h-72 rounded-2xl overflow-hidden gold-border-gradient cursor-pointer shadow-[0_20px_60px_-30px_oklch(0_0_0/0.7)] hover:shadow-[0_30px_80px_-20px_oklch(0.78_0.13_75/0.35)] transition-shadow duration-700"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center scale-110 group-hover:scale-125 transition-transform duration-[1400ms] ease-out anim-ken-burns"
                  style={{ backgroundImage: `url(${a.img})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--charcoal)] via-[var(--charcoal)]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.27_0.08_20/0.4)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative h-full p-6 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl glass-strong flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[var(--gold)]" />
                  </div>
                  <div>
                    <div className="font-display text-2xl">{a.name}</div>
                    <p className="text-xs text-[var(--landing-muted)] mt-1.5 leading-relaxed">{a.blurb}</p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--gold)] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Explore <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- User stories ---------- */
function UserStoriesSection() {
  const stories = [
    { name: "Aarav Mehta", role: "Senior Advocate, Bombay HC", quote: "LexRam AI compresses two days of research into one focused afternoon. My drafts are sharper, my citations cleaner." },
    { name: "Priya Banerjee", role: "Partner, Banerjee & Co.", quote: "It's the first AI tool that respects how lawyers actually think. The paragraph-level citations are a quiet revolution." },
    { name: "Rohan Iyer", role: "General Counsel, Northwind Energy", quote: "We replaced three internal tools with LexRam AI. Our litigation team ships memos twice as fast — and with fewer errors." },
  ];
  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      <CinematicBg src={chamberImg} overlay={0.72} tint="linear-gradient(135deg, oklch(0.38 0.12 20 / 0.25), transparent)" />
      <GoldenParticles count={22} />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] mb-4">User stories</div>
          <h2 className="font-display text-4xl md:text-5xl">
            <span className="italic text-gradient-gold">Quiet</span> conviction.
          </h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {stories.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 50, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={{ y: -6 }}
              className="glass-strong rounded-2xl p-8 gold-border-gradient relative"
              style={{ transformPerspective: 1000 }}
            >
              <Quote className="w-8 h-8 text-[var(--gold)]/40 mb-4" />
              <p className="font-display text-lg leading-relaxed text-[var(--ivory)]">&ldquo;{s.quote}&rdquo;</p>
              <div className="mt-6 pt-5 border-t border-[var(--landing-border)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--maroon)] flex items-center justify-center font-display text-sm text-[var(--charcoal)]">
                  {s.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-[var(--landing-muted)]">{s.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Stats ---------- */
function StatsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-50 anim-drift" style={{ backgroundImage: `url(${meshImg})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-transparent to-[var(--background)]" />
      </div>
      <GoldenParticles count={30} />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <Stat value={12} suffix="M+" label="Judgments indexed" />
          <Stat value={84000} label="Active advocates" />
          <Stat value={3} suffix="x" label="Faster drafting" />
          <Stat value={98} suffix="%" label="Citation accuracy" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Marquee testimonials ---------- */
function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <div
      className="flex overflow-hidden"
      style={{
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <div className={`flex shrink-0 gap-4 pr-4 ${reverse ? "anim-marquee-rev" : "anim-marquee"}`}>
        {[...items, ...items].map((t, i) => (
          <div
            key={i}
            className="glass rounded-xl px-6 py-4 min-w-[320px] max-w-sm text-sm text-[var(--ivory)]/85 hover:scale-[1.03] hover:shadow-[0_20px_40px_-20px_oklch(0.78_0.13_75/0.4)] transition-all duration-500"
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}
function MarqueesSection() {
  const top = [
    "“Felt like hiring a team of associates overnight.” — V. Kapoor",
    "“The cleanest legal UX I've ever used.” — S. Ramaswamy",
    "“Saved my firm 60 billable hours in the first week.” — D. Joshi",
    "“Citations I can actually trust.” — N. Hartwell",
  ];
  const bottom = [
    "“Drafting feels like writing again.” — A. Whitman",
    "“Our juniors learn faster with LexRam AI at their side.” — R. Banerjee",
    "“It reads case-law the way I would, only faster.” — K. Sterling",
    "“Quietly the best legal product of the decade.” — M. Caldwell",
  ];
  return (
    <section className="relative py-20 overflow-hidden border-y border-[var(--landing-border)]">
      <div
        className="absolute inset-0 anim-gradient-pan"
        style={{
          background: "linear-gradient(120deg, oklch(0.14 0.012 40), oklch(0.22 0.06 25), oklch(0.14 0.012 40))",
        }}
      />
      <div className="relative space-y-4">
        <MarqueeRow items={top} />
        <MarqueeRow items={bottom} reverse />
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
function PricingSection() {
  const plans = [
    { name: "Junior", price: "$29", per: "/ month", desc: "For solo practitioners getting started.", features: ["Unlimited research queries", "10 drafts / month", "Citation export", "Email support"] },
    { name: "Chambers", price: "$89", per: "/ month", desc: "For working advocates and small chambers.", features: ["Unlimited drafts", "Multi-jurisdiction", "Matter workspaces", "Priority support", "Voice dictation"], highlight: true },
    { name: "Firm", price: "Custom", per: "", desc: "For full-service firms and in-house teams.", features: ["Everything in Chambers", "SSO & audit logs", "Private model fine-tune", "Dedicated success lead"] },
  ];
  return (
    <section id="pricing" className="relative py-28 md:py-36 overflow-hidden">
      <CinematicBg src={penImg} overlay={0.78} />
      <GoldenParticles count={16} />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] mb-4">Pricing</div>
          <h2 className="font-display text-4xl md:text-5xl">
            Premium tools.<br />
            <span className="italic text-gradient-gold">Honest pricing.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: i * 0.12 }}
              whileHover={{ y: -8 }}
              onHoverStart={() => track("pricing_plan_hover", { plan: p.name })}
              className={`relative rounded-2xl p-8 transition-shadow duration-500 ${
                p.highlight
                  ? "glass-strong gold-border-gradient shadow-[0_30px_80px_-20px_oklch(0.78_0.13_75/0.5)]"
                  : "glass border border-[var(--landing-border)]"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] bg-gradient-to-br from-[var(--gold)] to-[var(--maroon)] text-[var(--charcoal)]">
                  Most popular
                </div>
              )}
              <div className="font-display text-2xl">{p.name}</div>
              <p className="text-xs text-[var(--landing-muted)] mt-1">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl text-gradient-gold">{p.price}</span>
                <span className="text-sm text-[var(--landing-muted)]">{p.per}</span>
              </div>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-[var(--gold)] mt-0.5 shrink-0" />
                    <span className="text-[var(--ivory)]/85">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <MagneticButton
                  variant={p.highlight ? "primary" : "ghost"}
                  className="w-full"
                  onClick={() => track("pricing_plan_click", { plan: p.name })}
                >
                  {p.name === "Firm" ? "Talk to sales" : "Start free"}
                </MagneticButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function FAQSection() {
  const items = [
    { q: "How accurate are the citations?", a: "Every answer is grounded in source judgments with paragraph-level citations you can click through to the original text — no hallucinated case names, no invented paragraphs. On our 4,200-question gold-standard benchmark, LexRam AI hits 98.4% citation accuracy and flags any answer it cannot fully ground." },
    { q: "Which jurisdictions are supported?", a: "Full coverage of India (Supreme Court, all 25 High Courts, NCLT, NCLAT, ITAT and major tribunals), United Kingdom (UKSC, EWCA, EWHC) and Singapore (SGCA, SGHC). United States federal & state courts and EU case law are rolling out to Firm plan customers in private beta." },
    { q: "Is my matter data confidential?", a: "Yes — privilege-grade by default. Documents are encrypted in transit (TLS 1.3) and at rest (AES-256), isolated to your workspace, never used to train shared models, and deleted on request within 24 hours. We are SOC 2 Type II audited and offer DPAs for chambers and firms." },
    { q: "Can I export to Word and my existing tools?", a: "Drafts export to .docx with formatting, headings, footnotes and citation styles preserved. Citations export to plain text, BibTeX and OSCOLA. Native integrations exist for Microsoft Word, Google Docs, NetDocuments and iManage; everything else works through copy-paste with formatting intact." },
    { q: "Do you offer firm-wide deployments?", a: "Yes. The Firm plan includes SSO (Okta, Azure AD, Google), SCIM provisioning, audit logs, granular billing controls, custom retention and residency, an optional private fine-tune of your firm's drafting style, and a dedicated success lead with quarterly reviews." },
    { q: "What happens after the 14-day trial?", a: "You keep every draft, citation and matter you created — nothing is deleted. If you don't pick a plan, your account simply switches to read-only. There is no auto-charge: we never ask for a card to start the trial." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      <CinematicBg src={libraryImg} overlay={0.82} />
      <div className="relative max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] mb-4">Questions</div>
          <h2 className="font-display text-4xl md:text-5xl">
            Asked &amp; <span className="italic text-gradient-gold">answered.</span>
          </h2>
        </div>
        <div className="space-y-3">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="glass rounded-xl border border-[var(--landing-border)] overflow-hidden">
                <button
                  onClick={() => {
                    const next = isOpen ? null : i;
                    setOpen(next);
                    track("faq_toggle", { question: it.q, opened: next !== null });
                  }}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-[oklch(0.78_0.13_75/0.04)] transition-colors"
                >
                  <span className="font-display text-lg">{it.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="text-[var(--gold)] text-2xl leading-none">
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-[var(--landing-muted)] leading-relaxed">{it.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */
function CTASection() {
  return (
    <section className="relative py-32 md:py-40 overflow-hidden">
      <CinematicBg
        src={papersImg}
        overlay={0.7}
        tint="linear-gradient(135deg, oklch(0.38 0.12 20 / 0.45), oklch(0.14 0.012 40 / 0.6))"
        videoSrc={heroAmbientUrl}
      />
      <GoldenParticles count={40} />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full opacity-60 anim-pulse-glow pointer-events-none"
        style={{
          background: "radial-gradient(circle, oklch(0.78 0.13 75 / 0.18) 0%, transparent 60%)",
        }}
      />
      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[11px] uppercase tracking-[0.25em] text-[var(--gold-soft)] mb-8">
            <Zap className="w-3 h-3" /> 14-day trial · No card · Cancel in one click
          </div>
          <h2 className="font-display text-[clamp(2.5rem,7vw,6rem)] leading-[1.0]">
            Close the next brief<br />
            <span className="italic text-gradient-gold">before lunch.</span>
          </h2>
          <p className="mt-6 max-w-xl mx-auto text-[var(--landing-muted)] leading-relaxed">
            Join 84,000+ advocates who research, draft and argue with LexRam AI at their side. Set up in under two minutes — bring your first matter, leave with a filed-ready draft.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.22em] text-[var(--landing-muted)]">
            <span className="inline-flex items-center gap-1.5"><Shield className="w-3 h-3 text-[var(--gold)]" /> SOC 2 Type II</span>
            <span className="inline-flex items-center gap-1.5"><Check className="w-3 h-3 text-[var(--gold)]" /> 98.4% citation accuracy</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[var(--gold)]" /> Used in 12 jurisdictions</span>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <MagneticButton
              onClick={() => {
                track("cta_start_trial_click", { location: "final_cta" });
                window.location.href = "/sign-in?intent=signup";
              }}
            >
              Start your free trial
            </MagneticButton>
            <MagneticButton
              variant="ghost"
              onClick={() => {
                track("cta_talk_sales_click", { location: "final_cta" });
                window.location.href = "/contact";
              }}
            >
              Talk to sales
            </MagneticButton>
          </div>

          <p className="mt-6 text-xs text-[var(--landing-muted)]">
            No credit card required · Your data is never used to train shared models.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="relative border-t border-[var(--landing-border)] py-14">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[var(--gold)]" />
            <span className="font-display text-xl">
              Lex<span className="text-[var(--gold)]">Ram</span>{" "}
              <span className="text-[var(--ivory)]/70 text-base">AI</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-[var(--landing-muted)] max-w-sm">
            AI-powered legal intelligence for the modern advocate. Built with care, in collaboration with leading chambers.
          </p>
        </div>
        {[
          { h: "Product", l: ["Research", "Drafting", "Practice areas", "Pricing"] },
          { h: "Company", l: ["About", "Careers", "Press", "Contact"] },
        ].map((c) => (
          <div key={c.h}>
            <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--gold)] mb-4">{c.h}</div>
            <ul className="space-y-2.5 text-sm text-[var(--landing-muted)]">
              {c.l.map((i) => (
                <li key={i}><a href="#" className="hover:text-[var(--ivory)] transition-colors">{i}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-[var(--landing-border)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--landing-muted)]">
        <div>© 2026 LexRam AI Legal Intelligence. All rights reserved.</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[var(--ivory)]">Privacy</a>
          <a href="#" className="hover:text-[var(--ivory)]">Terms</a>
          <a href="#" className="hover:text-[var(--ivory)]">Security</a>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Page ---------- */
export default function LandingPage() {
  return (
    <main data-landing className="relative">
      <CursorGlow />
      <Nav />
      <Hero />
      <TrustStrip />
      <ProblemSection />
      <ResearchSection />
      <DraftingSection />
      <PracticeSection />
      <UserStoriesSection />
      <StatsSection />
      <MarqueesSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
