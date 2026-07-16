'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';
import { billingApi, isPaywallEnabled } from '@/lib/billing';
import { supabase } from '@/lib/supabase/client';

type CurrentPlan = {
  label: string;
  creditsRemaining: number;
  /** 0–1 progress fill for the meter. */
  progress: number;
} | null;

export default function PricingSection({ showHeader = true }: { showHeader?: boolean } = {}) {
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  const [plan, setPlan] = useState<CurrentPlan>(null);

  useEffect(() => { setPaywallEnabled(isPaywallEnabled()); }, []);

  /* Compute a per-user "Current Plan" snapshot. Only renders the banner
     once we know the user (free trial / subscribed / signed-out). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!paywallEnabled) return;
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        const user = data?.user;
        if (!user) { setPlan(null); return; }
        const balance = billingApi.getBalance(user.id);
        const starting = 500;
        const remaining = Math.max(0, Math.min(balance, starting));
        const progress = starting > 0 ? remaining / starting : 0;
        setPlan({ label: "Free Trial", creditsRemaining: remaining, progress });
      } catch {
        if (!cancelled) setPlan(null);
      }
    })();
    return () => { cancelled = true; };
  }, [paywallEnabled]);

  const onFreeTrial = plan !== null;

  return (
    <section id="pricing" className="bg-[#d8cdb8] text-[#1a1a1a] px-4 sm:px-6 lg:px-8 py-20 md:py-24 scroll-mt-24">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        {showHeader && (
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4 text-[#1a1a1a]">
            Upgrade Your <span className="italic text-[#6b1e2d]">Plan</span>
          </h2>
          <p className="text-base md:text-lg text-[#1a1a1a]/65 max-w-xl mx-auto font-sans">
            No subscriptions. No monthly fees. Buy credits when you need them and use them for research or drafting.
          </p>
        </div>
        )}

        {/* ── Current Plan banner (signed-in users only) ── */}
        {plan && (
          <div className="mb-8 md:mb-10 bg-white rounded-2xl border border-[#6b1e2d]/10 shadow-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-[#f4ede0] grid place-items-center shrink-0">
                <Zap className="w-5 h-5 text-[#6b1e2d]" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-[#1a1a1a] leading-tight">
                  Current Plan: <span className="text-[#6b1e2d]">{plan.label}</span>
                </div>
                <div className="text-sm text-[#1a1a1a]/60 mt-0.5">
                  {plan.creditsRemaining.toLocaleString("en-IN")} credits remaining
                </div>
              </div>
            </div>
            <div className="md:w-56 shrink-0">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "linear-gradient(to right, #d8cdb8 0%, #d8cdb8 100%)" }}
                aria-hidden
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(plan.progress * 100)}%`,
                    background: "linear-gradient(to right, #d8cdb8 0%, #d96944 50%, #6b1e2d 100%)",
                    transition: "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
              <div className="mt-1 text-[11px] text-[#1a1a1a]/50 text-right">
                {Math.round(plan.progress * 100)}% used
              </div>
            </div>
          </div>
        )}

        {/* ── Plans grid ── */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* ── Top-Up ── */}
          <div className={`relative bg-white rounded-[2rem] p-8 md:p-10 flex flex-col border border-[#6b1e2d]/8 shadow-sm ${onFreeTrial ? "opacity-70" : "shadow-md"}`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase ${onFreeTrial ? "bg-[#d8cdb8] text-[#6b1e2d]/60" : "bg-[#6b1e2d] text-[#d8cdb8]"}`}>
                Most Popular
              </span>
            </div>

            <h3 className={`text-2xl font-light mb-2 ${onFreeTrial ? "text-[#1a1a1a]/50" : "text-[#1a1a1a]"}`}>
              Top-Up
            </h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className={`font-serif text-6xl font-light tracking-tight ${onFreeTrial ? "text-[#1a1a1a]/40" : "text-[#1a1a1a]"}`}>
                ₹999
              </span>
            </div>
            <p className={`text-sm mb-10 font-sans ${onFreeTrial ? "text-[#1a1a1a]/40" : "text-[#1a1a1a]/55"}`}>
              For 10,000 Credits
            </p>

            <ul className="space-y-5 mb-12 flex-grow">
              {[
                "Credits never expire",
                "~100 Research Queries",
                "~40 AI-assisted drafts",
                "Download as Word / PDF",
                "Priority support",
              ].map((text) => (
                <li
                  key={text}
                  className={`flex items-start gap-3 text-[15px] font-sans ${onFreeTrial ? "text-[#1a1a1a]/40" : "text-[#1a1a1a]/75"}`}
                >
                  <CheckCircle2
                    className={`w-5 h-5 shrink-0 mt-0.5 ${onFreeTrial ? "text-[#1a1a1a]/20" : "text-[#1a1a1a]"}`}
                  />
                  {text}
                </li>
              ))}
            </ul>

            <Link
              href="/sign-in"
              aria-disabled={onFreeTrial}
              tabIndex={onFreeTrial ? -1 : 0}
              className={`w-full py-4 rounded-full font-medium text-sm tracking-wide text-center block transition-colors ${
                onFreeTrial
                  ? "bg-[#f0e9d8] text-[#1a1a1a]/30 cursor-not-allowed pointer-events-none"
                  : "bg-[#1a1a1a] text-white hover:bg-[#3a3a3a]"
              }`}
            >
              Buy Credits
            </Link>
          </div>

          {/* ── Chamber Bulk ── */}
          <div className="relative bg-white rounded-[2rem] p-8 md:p-10 flex flex-col border border-[#6b1e2d]/12 shadow-md">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase bg-[#6b1e2d] text-[#d8cdb8]">
                Best Value
              </span>
            </div>

            <h3 className="text-2xl font-light mb-2 text-[#1a1a1a]">
              Chamber Bulk
            </h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="font-serif text-6xl font-light tracking-tight text-[#1a1a1a]">
                ₹4,499
              </span>
            </div>
            <p className="text-sm text-[#1a1a1a]/55 mb-10 font-sans">
              For 50,000 Credits <span className="text-[#6b1e2d] font-medium">(10% off)</span>
            </p>

            <ul className="space-y-5 mb-12 flex-grow">
              {[
                "Share credits with team",
                "Up to 5 users",
                "Shared matter workspaces",
                "Junior/clerk review workflow",
                "Dedicated account manager",
              ].map((text) => (
                <li key={text} className="flex items-start gap-3 text-[15px] text-[#1a1a1a]/80 font-sans">
                  <CheckCircle2 className="w-5 h-5 text-[#6b1e2d] shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>

            <Link
              href="/sign-in"
              className="w-full py-4 rounded-full border-2 border-[#1a1a1a] text-[#1a1a1a] font-medium text-sm tracking-wide text-center block hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              Buy Bulk Credits
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
