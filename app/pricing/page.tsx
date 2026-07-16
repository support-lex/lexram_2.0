import type { Metadata } from "next";
import { Check } from "lucide-react";
import { LandingNav, LandingFooter } from "@/components/LandingShell";

export const metadata: Metadata = {
  title: "Pricing — LexRam",
  description: "Buy credits when you need them. No subscriptions, no monthly fees. Top-Up ₹499 or Chamber Bulk ₹4,499.",
};

const PLANS = [
  {
    badge: "MOST POPULAR",
    badgeStyle: "bg-[#6b1e2d]/8 text-[#6b1e2d]/70",
    title: "Top-Up",
    price: "₹499",
    sub: "For 5,000 Credits",
    features: [
      "Credits never expire",
      "~50 Research Queries",
      "~20 AI-assisted drafts",
      "Download as Word / PDF",
      "Priority support",
    ],
    cta: "Buy Credits",
    ctaStyle: "bg-[#eef2f7] text-[#3a0d18]/45 cursor-not-allowed",
    ctaHref: "/sign-in?intent=signup",
  },
  {
    badge: "BEST VALUE",
    badgeStyle: "bg-[#6b1e2d]/8 text-[#6b1e2d]/70",
    title: "Chamber Bulk",
    price: "₹4,499",
    sub: "For 50,000 Credits (10% off)",
    features: [
      "Share credits with team",
      "Up to 5 users",
      "Shared matter workspaces",
      "Junior/clerk review workflow",
      "Dedicated account manager",
    ],
    cta: "Buy Bulk Credits",
    ctaStyle: "bg-white border border-[#e7dcc5] text-[#3a0d18] hover:border-[#6b1e2d]/40 hover:bg-[#faf5ea] transition",
    ctaHref: "/sign-in?intent=signup",
    primary: true,
  },
];

const FAQS = [
  { q: "Do credits expire?", a: "No. Top-Up credits never expire — buy them once and use them whenever you need to." },
  { q: "What counts as a 'credit'?", a: "Each Research Query costs ~100 credits and each AI-assisted draft ~250 credits. Word/PDF downloads are free." },
  { q: "Can I share credits with my team?", a: "Yes — Chamber Bulk plans let up to 5 users share a single 50,000-credit pool with shared matter workspaces." },
  { q: "Is there a free trial?", a: "Yes. Every new account gets 237 credits free — no card required, no time limit." },
];

export default function PricingPage() {
  return (
    <div data-landing-v2 className="min-h-screen bg-[#d8cdb8]">
      <LandingNav />
      <main className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-10 text-[#3a0d18]">
            <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-[3.25rem] leading-[1.05] tracking-tight">
              Upgrade Your Plan
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[#6b1e2d]/75">
              No subscriptions. No monthly fees. Buy credits when you need them.
            </p>
          </div>

          {/* Current plan */}
          <div className="rounded-2xl bg-[#efe6d4] border border-[#6b1e2d]/8 p-5 sm:p-6 mb-10 flex items-center gap-5">
            <div className="w-11 h-11 rounded-full bg-[#CC5500]/15 grid place-items-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#CC5500]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#3a0d18] text-base sm:text-lg">Current Plan: Free Trial</div>
              <div className="text-sm text-[#6b1e2d]/65 mt-0.5">237 credits remaining</div>
            </div>
            <div className="hidden sm:block w-48 shrink-0">
              <div className="h-1.5 rounded-full bg-[#6b1e2d]/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#d8cdb8] to-[#CC5500]/70" style={{ width: "22%" }} />
              </div>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {PLANS.map((p) => (
              <div
                key={p.title}
                className="relative rounded-2xl bg-[#faf5ea] border border-[#e7dcc5] p-6 sm:p-8 flex flex-col shadow-[0_1px_2px_rgba(107,30,45,0.04)]"
              >
                {/* Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase ${p.badgeStyle}`}>
                    {p.badge}
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-serif font-bold text-[#3a0d18] text-2xl sm:text-[1.75rem] leading-snug">
                  {p.title}
                </h2>

                {/* Price */}
                <div className="mt-4">
                  <div className="font-serif font-bold text-[#3a0d18] text-4xl sm:text-5xl leading-none">
                    {p.price}
                  </div>
                  <div className="mt-2 text-sm text-[#6b1e2d]/70">
                    {p.sub}
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-7 space-y-3.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="mt-[3px] w-4 h-4 rounded-full border border-[#6b1e2d]/30 grid place-items-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-[#6b1e2d]" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] text-[#3a0d18] leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={p.ctaHref}
                  className={`mt-8 inline-flex items-center justify-center w-full h-12 rounded-xl text-[15px] font-semibold ${p.ctaStyle}`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <section className="mt-16 sm:mt-20">
            <h2 className="font-serif font-bold text-[#3a0d18] text-2xl sm:text-3xl mb-6">
              Frequently Asked
            </h2>
            <div className="rounded-2xl bg-[#faf5ea] border border-[#e7dcc5] divide-y divide-[#e7dcc5]">
              {FAQS.map((f) => (
                <details key={f.q} className="group p-5 sm:p-6">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                    <span className="font-semibold text-[#3a0d18] text-base sm:text-lg">{f.q}</span>
                    <span className="text-[#6b1e2d]/60 text-2xl leading-none transition-transform group-open:rotate-45 select-none">+</span>
                  </summary>
                  <p className="mt-3 text-[#3a0d18]/80 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

        </div>
      </main>
      <LandingFooter />
    </div>
  );
}