"use client";

import { useState, useEffect } from "react";
import { Quote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const stories = [
  { q: "I have been practising for over two decades and the one constant frustration has been missing a judgement that opposing counsel finds. LexRam's conflicting judgement detector and bench strength indicator have completely changed how I prepare. I walk into court knowing I haven't missed anything.", a: "Shree Harini H N", r: "MS. 4036/2025 · Research Law Assistant, Madras HC, Madurai Bench" },
  { q: "What struck me first was that every result LexRam returned was a real judgement I could open and verify. After years of being burned by AI tools that fabricate citations, that alone made me a convert.", a: "Shyam M", r: "MS. 8227/2024 · District Court, Trichy, Tamil Nadu" },
  { q: "The draft plan step is what separates LexRam from everything else I've tried. I approve the structure before a single clause is written, so the final draft reflects my strategy, not the AI's interpretation of it.", a: "Johnson S A", r: "MS. 1958/2023 · Madras High Court" },
  { q: "The curated questions are remarkably precise. When I asked for an anticipatory bail application, it asked exactly what I would have to ask my senior — grounds, date of arrest, prior bail history, nature of offence. Nothing generic. Nothing wasted.", a: "Priyanka C", r: "MS. 1423/2024 · Madras High Court" },
  { q: "Being able to pull a judgement from research directly into my draft without switching tabs or reformatting the citation has saved me more time than I can calculate.", a: "Pravin Kumar T", r: "MS. 2649/2021 · Madras High Court" },
  { q: "I uploaded a scanned charge sheet and LexRam read it, extracted the relevant facts, and had a bail application draft plan ready. I genuinely did not expect it to work that well.", a: "Sam Dinakaran Manuel", r: "MS. 4232/2025 · Madras High Court" },
  { q: "The analysis is written by people who have clearly read the full judgement — not summarised a summary. The depth of engagement with the reasoning, not just the outcome, is what keeps me coming back.", a: "Keerthana", r: "MS. 7511/2023 · Madras High Court" },
  { q: "What I appreciate most is that every piece links directly to the full judgement in LexRam's database. I read the analysis, I read the order, in one place. No searching, no hunting for the source.", a: "Sachin A D", r: "MS. 7423/2025 · Madras High Court" },
];

const INTERVAL = 5000;

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function SignInBranding() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % stories.length), INTERVAL);
    return () => clearInterval(t);
  }, []);

  const story = stories[active];

  return (
    <div className="hidden lg:flex flex-col h-screen bg-[#680318] text-[#fff0df] p-10 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-[#b94826]/30 via-[#680318] to-[#3a0d18]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }}
      />

      {/* ── Logo ── */}
      <div className="relative z-10 shrink-0 mb-7">
        <Link href="/" aria-label="LexRam" className="inline-flex items-center hover:opacity-80 transition-opacity">
          <Image src="/lexram-logo-light.png" alt="LexRam" width={140} height={48} priority className="h-10 w-auto" />
        </Link>
      </div>

      {/* ── Video Card ── */}
      <div className="relative z-10 shrink-0">
        {/* Label row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b94826] animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#fff0df]/45">
              AI Product Preview
            </span>
          </div>
          <span className="text-[10px] text-[#fff0df]/28 tracking-wide font-mono">lexram.ai</span>
        </div>

        {/* Video container */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            border: "1px solid rgba(255,240,223,0.10)",
            boxShadow: "0 20px 60px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(185,72,38,0.15)",
          }}
        >
          <div className="relative" style={{ paddingTop: "52%" }}>
            <video
              ref={(el) => {
                if (!el || el.dataset.started === "1") return;
                el.dataset.started = "1";
                const play = () => el.play().catch(() => {});
                if ("IntersectionObserver" in window) {
                  const obs = new IntersectionObserver(([e]) => {
                    if (e.isIntersecting) { play(); obs.disconnect(); }
                  }, { rootMargin: "200px" });
                  obs.observe(el);
                } else {
                  setTimeout(play, 1500);
                }
              }}
              className="absolute inset-0 w-full h-full object-cover"
              src="/landing/hero-ambient.mp4"
              muted
              loop
              playsInline
              preload="none"
              poster="/landing/hero-courtroom.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3a0d18]/80 via-[#3a0d18]/10 to-transparent pointer-events-none" />

            {/* Live badge */}
            <div className="absolute top-3 right-3 z-10">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-widest text-[#fff0df]/90"
                style={{ background: "rgba(255,240,223,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,240,223,0.15)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#b94826] animate-pulse" />
                LIVE
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-serif font-bold text-[#fff0df] text-sm leading-tight">Indian AI Legal Intelligence</p>
                  <p className="text-[#fff0df]/55 text-[11px] mt-0.5 tracking-wide">Research · Draft · Scrutiny</p>
                </div>
                <div className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider text-[#fff0df]" style={{ background: "#b94826" }}>
                  AI
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Testimonial ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-end min-h-0 pt-6">
        <div className="h-px mb-5" style={{ background: "linear-gradient(to right, rgba(255,240,223,0.15), transparent)" }} />

        <div className="transition-all duration-500">
          <Quote className="w-5 h-5 text-[#b94826] mb-3 opacity-70" />
          <blockquote className="font-serif text-sm leading-relaxed text-[#fff0df]/88 line-clamp-4">
            &ldquo;{story.q}&rdquo;
          </blockquote>
          <footer className="mt-4 pt-4 border-t border-[#fff0df]/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full grid place-items-center bg-[#b94826]/20 border border-[#b94826]/40 text-[#b94826] font-serif text-sm font-bold shrink-0">
                {initials(story.a)}
              </div>
              <div>
                <p className="font-serif font-bold text-[#fff0df] text-sm leading-tight">{story.a}</p>
                <p className="text-[11px] text-[#fff0df]/50 mt-0.5">{story.r}</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}