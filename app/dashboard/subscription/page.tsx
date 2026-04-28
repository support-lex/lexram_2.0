"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Zap, Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { isPaywallEnabled } from "@/lib/billing";

const PLANS = [
  {
    name: "Top-Up",
    price: "₹999",
    subtitle: "For 10,000 Credits",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Credits never expire",
      "~100 Research Queries",
      "~40 AI-assisted drafts",
      "Download as Word / PDF",
      "Priority support",
    ],
    cta: "Buy Credits",
    ctaStyle: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    name: "Chamber Bulk",
    price: "₹4,499",
    subtitle: "For 50,000 Credits (10% off)",
    highlight: false,
    badge: "Best Value",
    features: [
      "Share credits with team",
      "Up to 5 users",
      "Shared matter workspaces",
      "Junior/clerk review workflow",
      "Dedicated account manager",
    ],
    cta: "Buy Bulk Credits",
    ctaStyle: "border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
    icon: <Building2 className="w-5 h-5" />,
  },
];

export default function SubscriptionPage() {
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  useEffect(() => { setPaywallEnabled(isPaywallEnabled()); }, []);

  if (!paywallEnabled) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[var(--text-muted)] text-sm">This page is not available in the current environment.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back + Title */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Upgrade Your Plan</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            No subscriptions. No monthly fees. Buy credits when you need them.
          </p>
        </div>

        {/* Current plan indicator */}
        <div className="mb-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Current Plan: Free Trial</div>
              <div className="text-xs text-[var(--text-muted)]">237 credits remaining</div>
            </div>
          </div>
          <div className="h-2 w-32 rounded-full bg-[var(--surface-hover)] overflow-hidden">
            <div className="h-full w-[47%] bg-[var(--accent)] rounded-full" />
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 flex flex-col relative transition-all ${
                plan.highlight
                  ? "bg-[var(--bg-surface)] border-2 border-[var(--accent)] shadow-[var(--shadow-lg)] scale-[1.02]"
                  : "bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent)]/30 hover:shadow-[var(--shadow-card-hover)]"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-wider">
                  {plan.badge}
                </div>
              )}

              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-[var(--text-primary)]">{plan.price}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-5">{plan.subtitle}</p>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${plan.ctaStyle}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Frequently Asked</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { q: "Do credits expire?", a: "No. Credits you purchase never expire and carry forward indefinitely." },
              { q: "How are credits consumed?", a: "Each research query costs ~100 credits. Drafting costs ~250 credits. Simple lookups cost ~20 credits." },
              { q: "Can I share credits with my team?", a: "Yes, with the Chamber Bulk plan. Up to 5 users can share a single credit pool." },
              { q: "What payment methods do you accept?", a: "UPI, net banking, credit/debit cards, and bank transfer for Chamber plans." },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
                <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">{q}</div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
