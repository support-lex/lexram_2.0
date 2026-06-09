"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  ArrowRight, Search, FileText, Shield,
  Sparkles, Scale, CheckCircle2, TrendingUp,
} from "lucide-react";

interface Props {
  html: string;
}

/* Split raw HTML into N-paragraph chunks without breaking tags */
function splitByParagraphs(html: string, every: number): string[] {
  const chunks: string[] = [];
  let remaining = html;

  while (remaining.length > 0) {
    let pos = 0;
    let count = 0;
    while (count < every && pos < remaining.length) {
      const idx = remaining.indexOf("</p>", pos);
      if (idx === -1) { pos = remaining.length; break; }
      pos = idx + 4;
      count++;
    }
    const chunk = remaining.slice(0, pos);
    if (chunk.trim()) chunks.push(chunk);
    remaining = remaining.slice(pos);
  }
  return chunks;
}

const AD_SEQUENCE = [
  ResearchInlineAd,
  DraftingInlineAd,
  TSRInlineAd,
  StatCalloutAd,
  FreeTrialBannerAd,
];

export default function ArticleWithAds({ html }: Props) {
  const chunks = splitByParagraphs(html, 4);

  return (
    <>
      {chunks.map((chunk, i) => (
        <Fragment key={i}>
          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: chunk }}
          />
          {i < chunks.length - 1 && (
            <div className="my-8 not-prose">
              {(() => {
                const Ad = AD_SEQUENCE[i % AD_SEQUENCE.length];
                return <Ad />;
              })()}
            </div>
          )}
        </Fragment>
      ))}
    </>
  );
}

/* ── 1. Research horizontal strip ───────────────────────── */
function ResearchInlineAd() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#680318]/15 bg-[#fff7ec]">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#3a0d18] shrink-0">
          <Search className="h-5 w-5 text-[#fff0df]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b94826]">LexRam Research</p>
          <p className="text-sm font-semibold text-[#3a0d18] leading-snug">
            Find the exact case that supports your argument — in seconds.
          </p>
        </div>
        <Link
          href="/research"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#3a0d18] text-[#fff0df] text-sm font-semibold hover:bg-[#680318] transition-colors whitespace-nowrap"
        >
          Try free <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="h-[2px] bg-gradient-to-r from-[#3a0d18] via-[#680318] to-transparent" />
    </div>
  );
}

/* ── 2. Drafting feature card ────────────────────────────── */
function DraftingInlineAd() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#CC5500]/20 bg-gradient-to-br from-[#fff7ec] to-[#ffecd5]">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#CC5500] mb-1">LexRam Drafting</p>
            <h4 className="font-serif text-lg font-bold text-[#3a0d18] leading-snug">
              Draft court documents<br className="hidden sm:block" /> in minutes, not days.
            </h4>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#CC5500]/10 border border-[#CC5500]/20 shrink-0">
            <FileText className="h-6 w-6 text-[#CC5500]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {["Writ petitions", "Bail applications", "Legal notices", "Agreements"].map(f => (
            <div key={f} className="flex items-center gap-1.5 text-[12px] text-[#3a0d18]/75">
              <CheckCircle2 className="h-3 w-3 text-[#CC5500] shrink-0" />
              {f}
            </div>
          ))}
        </div>
        <Link
          href="/drafting"
          className="inline-flex items-center gap-2 px-5 h-9 rounded-lg bg-[#CC5500] text-white text-sm font-semibold hover:bg-[#b94826] transition-colors shadow-sm"
        >
          Start drafting <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ── 3. TSR dark card ────────────────────────────────────── */
function TSRInlineAd() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#3a0d18]/25 bg-[#3a0d18]">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0df]/10 border border-[#fff0df]/10 shrink-0">
          <Shield className="h-5 w-5 text-[#b94826]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b94826]">LexRam TSR</p>
          <p className="text-sm font-semibold text-[#fff0df] leading-snug">
            Automate title searches — encumbrance, chain of title, court orders.
          </p>
        </div>
        <Link
          href="/sign-in"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#fff0df] text-[#3a0d18] text-sm font-semibold hover:bg-[#d8cdb8] transition-colors whitespace-nowrap"
        >
          Access TSR <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ── 4. Stat callout ─────────────────────────────────────── */
function StatCalloutAd() {
  return (
    <div className="rounded-xl border border-[#680318]/12 bg-[#680318]/[0.04] px-5 py-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Stats row */}
        <div className="flex items-center gap-6 flex-1">
          {[
            { val: "50k+",  label: "Judgments indexed" },
            { val: "25",    label: "Courts covered"    },
            { val: "< 5s",  label: "Average search"    },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-serif text-2xl font-bold text-[#3a0d18] leading-none">{s.val}</p>
              <p className="text-[10px] text-[#680318]/55 mt-0.5 whitespace-nowrap">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="h-px sm:h-10 sm:w-px w-full bg-[#680318]/10 shrink-0" />
        <div className="sm:text-right">
          <p className="text-sm font-semibold text-[#3a0d18] mb-2">
            India&apos;s fastest legal research platform.
          </p>
          <Link
            href="/research"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#b94826] hover:text-[#680318] transition-colors"
          >
            Search for free <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── 5. Free-trial full-width banner ─────────────────────── */
function FreeTrialBannerAd() {
  return (
    <div
      className="rounded-xl overflow-hidden border border-[#680318]/15"
      style={{ background: "linear-gradient(100deg, #3a0d18 0%, #680318 55%, #8f3318 100%)" }}
    >
      <div className="relative px-5 py-5 overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,240,223,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,240,223,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#fff0df]/10 border border-[#fff0df]/10 shrink-0">
              <Sparkles className="h-5 w-5 text-[#b94826]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b94826]">Free trial — no credit card</p>
              <p className="text-sm font-semibold text-[#fff0df] leading-snug">
                Research, Draft, and run TSR reports — all in one platform.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#fff0df] text-[#3a0d18] text-sm font-semibold hover:bg-[#d8cdb8] transition-colors"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[#fff0df]/20 text-[#fff0df]/80 text-sm font-medium hover:border-[#fff0df]/40 hover:text-[#fff0df] transition-colors"
            >
              Browse blog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}