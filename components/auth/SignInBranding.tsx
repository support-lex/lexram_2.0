"use client";

import { useState, useEffect, useCallback } from "react";
import { Scale, Quote } from "lucide-react";
import Link from "next/link";

const stories = [
  { q: "I have been practising for over two decades and the one constant frustration has been missing a judgement that opposing counsel finds. Lexram's conflicting judgement detector and bench strength indicator have completely changed how I prepare. I walk into court knowing I haven't missed anything.", a: "Shree Harini H N", r: "MS. 4036/2025 · Research Law Assistant, Madras HC, Madurai Bench" },
  { q: "What struck me first was that every result Lexram returned was a real judgement I could open and verify. After years of being burned by AI tools that fabricate citations, that alone made me a convert.", a: "Shyam M", r: "MS. 8227/2024 · District Court, Trichy, Tamil Nadu" },
  { q: "The draft plan step is what separates Lexram from everything else I've tried. I approve the structure before a single clause is written, so the final draft reflects my strategy, not the AI's interpretation of it.", a: "Johnson S A", r: "MS. 1958/2023 · Madras High Court" },
  { q: "The curated questions are remarkably precise. When I asked for an anticipatory bail application, it asked exactly what I would have to ask my senior for — grounds, date of arrest, prior bail history, nature of offence. Nothing generic. Nothing wasted.", a: "Priyanka C", r: "MS. 1423/2024 · Madras High Court" },
  { q: "Being able to pull a judgement from research directly into my draft without switching tabs or reformatting the citation has saved me more time than I can calculate.", a: "Pravin Kumar T", r: "MS. 2649/2021 · Madras High Court" },
  { q: "I uploaded a scanned charge sheet and Lexram read it, extracted the relevant facts, and had a bail application draft plan ready. I genuinely did not expect it to work that well.", a: "Sam Dinakaran Manuel", r: "MS. 4232/2025 · Madras High Court" },
  { q: "The analysis is written by people who have clearly read the full judgement — not summarised a summary. The depth of engagement with the reasoning, not just the outcome, is what keeps me coming back.", a: "Keerthana", r: "MS. 7511/2023 · Madras High Court" },
  { q: "What I appreciate most is that every piece links directly to the full judgement in Lexram's database. I read the analysis, I read the order, in one place. No searching, no hunting for the source.", a: "Sachin A D", r: "MS. 7423/2025 · Madras High Court" },
];

const INTERVAL = 5000;

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function SignInBranding() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || stories.length <= 1) return;
    const t = setInterval(() => setActive((i) => (i + 1) % stories.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused]);

  const go = useCallback((delta: number) => {
    setActive((i) => (i + delta + stories.length) % stories.length);
  }, []);

  const story = stories[active];

  return (
    <div
      className="hidden lg:flex flex-col justify-between bg-[#680318] text-[#fff0df] p-12 relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-[#b94826]/30 via-[#680318] to-[#680318]" />

      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#fff0df] hover:opacity-80 transition-opacity"
        >
          <Scale className="w-6 h-6 text-[#b94826]" />
          <span className="font-serif font-bold text-xl tracking-tight">LexRam</span>
        </Link>
      </div>

      <div className="relative z-10 max-w-md flex flex-col justify-center flex-1 py-12">
        <div className="transition-all duration-500">
          <Quote className="w-8 h-8 text-[#b94826] mb-5 opacity-60" />
          <blockquote className="font-serif text-lg leading-relaxed text-[#fff0df]/90">
            &ldquo;{story.q}&rdquo;
          </blockquote>
          <footer className="mt-6 pt-5 border-t border-[#fff0df]/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full grid place-items-center bg-[#b94826]/20 border border-[#b94826]/40 text-[#b94826] font-serif text-sm font-bold shrink-0">
                {initials(story.a)}
              </div>
              <div>
                <p className="font-serif font-bold text-[#fff0df] leading-tight">{story.a}</p>
                <p className="text-xs text-[#fff0df]/60 mt-0.5">{story.r}</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Dots + nav */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {stories.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Story ${i + 1}`}
              aria-current={i === active}
              className={`rounded-full transition-all ${
                i === active
                  ? "w-6 h-1.5 bg-[#b94826]"
                  : "w-1.5 h-1.5 bg-[#fff0df]/30 hover:bg-[#fff0df]/60"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] text-[#fff0df]/40 tabular-nums">
          {active + 1} / {stories.length}
        </span>
      </div>
    </div>
  );
}
