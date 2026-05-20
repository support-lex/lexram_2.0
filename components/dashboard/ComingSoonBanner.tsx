"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react";

type ComingSoonBannerProps = {
  /** Big serif title — e.g. "Case Library". */
  feature: string;
  /** One-line description shown below the heading. */
  description?: string;
  /** Brand icon for the floating glyph; defaults to Sparkles. */
  icon?: LucideIcon;
  /** Optional CTA — defaults to "Go to Research". */
  ctaLabel?: string;
  ctaHref?: string;
};

export default function ComingSoonBanner({
  feature,
  description = "We're polishing this experience. Check back shortly — it's almost ready.",
  icon: Icon = Sparkles,
  ctaLabel = "Go to Research",
  ctaHref = "/dashboard/research-2",
}: ComingSoonBannerProps) {
  return (
    <div
      className="relative flex-1 min-h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden px-4 py-12"
      style={{ background: "var(--lex-gradient-hero)" }}
    >
      {/* Decorative floating orbs — pure CSS, no asset load */}
      <div
        aria-hidden
        className="lex-animate-float pointer-events-none absolute -top-24 -left-24 size-72 rounded-full opacity-50 blur-3xl"
        style={{ background: "var(--lex-rust-soft)" }}
      />
      <div
        aria-hidden
        className="lex-animate-float pointer-events-none absolute -bottom-32 -right-24 size-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--lex-maroon-soft)", animationDelay: "1.2s" }}
      />

      <div className="relative z-10 max-w-xl w-full text-center lex-animate-fade-up">
        {/* Pulsing icon mark — uses the same maroon brand ring you see in research */}
        <div className="relative mx-auto mb-8 grid place-items-center size-24">
          <span
            aria-hidden
            className="lex-animate-pulse-ring absolute inset-0 rounded-full"
            style={{ background: "var(--lex-maroon)", opacity: 0.18 }}
          />
          <span
            aria-hidden
            className="absolute inset-2 rounded-full"
            style={{ background: "var(--lex-maroon-soft)" }}
          />
          <span
            className="relative grid place-items-center size-16 rounded-full text-[var(--lex-cream)] shadow-[var(--lex-shadow-soft)]"
            style={{ background: "var(--lex-maroon)" }}
          >
            <Icon className="size-7" strokeWidth={1.75} />
          </span>
        </div>

        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] mb-5"
          style={{
            background: "var(--lex-cream-deep)",
            color: "var(--lex-rust)",
          }}
        >
          <Sparkles className="size-3.5" strokeWidth={2} />
          Coming Soon
        </div>

        {/* Title */}
        <h1
          className="font-serif font-bold tracking-tight text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.05] mb-4"
          style={{ color: "var(--lex-maroon)" }}
        >
          {feature}
        </h1>

        {/* Description */}
        <p className="text-[15px] md:text-base text-[var(--text-secondary)] leading-relaxed mb-9 max-w-md mx-auto">
          {description}
        </p>

        {/* Animated shimmer progress bar — visual "in progress" cue */}
        <div
          className="relative mx-auto mb-9 h-1.5 w-48 overflow-hidden rounded-full"
          style={{ background: "var(--lex-cream-deep)" }}
        >
          <span
            className="absolute inset-y-0 left-0 w-1/2 rounded-full lex-coming-soon-bar"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--lex-maroon), transparent)",
            }}
          />
        </div>

        {/* CTA back to working surface */}
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold shadow-[var(--lex-shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--lex-shadow-elevated)]"
          style={{
            background: "var(--lex-maroon)",
            color: "var(--lex-cream)",
          }}
        >
          {ctaLabel}
          <ArrowRight className="size-4" strokeWidth={2.25} />
        </Link>
      </div>

      {/* Global so the @keyframes name isn't hashed by styled-jsx — the
          inline class above references it by its plain name. */}
      <style jsx global>{`
        .lex-coming-soon-bar {
          animation: lex-coming-soon-sweep 1.8s cubic-bezier(0.45, 0, 0.55, 1)
            infinite;
        }
        @keyframes lex-coming-soon-sweep {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
