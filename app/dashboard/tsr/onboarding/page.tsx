"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Building2, ArrowRight, Loader2, IndianRupee, Sparkles,
  CheckCircle2, Shield, Users, AlertCircle, Crown, Gauge,
  Layers, FileStack, Headset, Lock, Workflow, Star, Check,
} from "lucide-react";
import { startAsIndividual, useRoleContext } from "@/lib/rbac";

const INDIVIDUAL_FEATURES = [
  { icon: Workflow,    label: "Full TSR workflow — upload, scrutiny, query report" },
  { icon: Lock,        label: "Private case library, scoped to your account" },
  { icon: FileStack,   label: "Standard document formats (PDF, DOCX, images)" },
  { icon: CheckCircle2, label: "Pay-as-you-go — no setup fee, no minimums" },
  { icon: ArrowRight,  label: "Upgrade to Enterprise anytime, keep all your cases" },
];

const ENTERPRISE_FEATURES = [
  { icon: Users,    label: "Full user management — invite, assign, suspend" },
  { icon: Shield,   label: "Role-based access control (RBAC) across the firm" },
  { icon: Gauge,    label: "Dashboard monitoring — usage, audit trail, spend" },
  { icon: Building2, label: "Unlimited banks supported, no per-bank fees" },
  { icon: Layers,   label: "Unlimited document formats + custom templates" },
  { icon: Headset,  label: "Dedicated onboarding + priority support" },
];

export default function OnboardingChoicePage() {
  const router = useRouter();
  const ctx = useRoleContext();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onIndividual = async () => {
    setBusy(true);
    setError(null);
    try {
      await startAsIndividual();
      await ctx.refresh();
<<<<<<< HEAD
      router.replace("/dashboard/tsr");
=======
      router.replace("/dashboard/tsr/my-cases");
>>>>>>> tsr
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-cream">
      {/* Decorative backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(185,72,38,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(104,3,24,0.10) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #680318 1px, transparent 1px), linear-gradient(to bottom, #680318 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative z-10 px-4 sm:px-6 py-10 sm:py-16 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.22em] uppercase mb-5 border border-maroon/15">
            <Sparkles className="w-3 h-3 text-rust" />
            Welcome to LEXRAM TSR
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] text-maroon">
            Pick the plan that fits<br className="hidden sm:block" />
            <span className="italic text-rust"> the way you work.</span>
          </h1>
          <p className="text-sm sm:text-base text-ink/65 mt-5 max-w-2xl mx-auto leading-relaxed">
            Pay per document — no surprises. Solo advocates can start instantly.
            Firms unlock team management, dashboards, and unlimited integrations.
          </p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto mb-8 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 break-words">{error}</p>
          </div>
        )}

        {/* Pricing grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-7 items-stretch">
          {/* ─── Individual ─────────────────────────────────────────── */}
          <div className="relative group rounded-3xl border border-maroon/15 bg-cream-soft p-7 sm:p-8 flex flex-col shadow-[0_18px_50px_-30px_rgba(104,3,24,0.35)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_60px_-30px_rgba(104,3,24,0.45)]">
            <div className="flex items-start justify-between gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-maroon/15 to-rust/10 grid place-items-center ring-1 ring-maroon/10">
                <User className="w-7 h-7 text-maroon" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-maroon/8 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase border border-maroon/10">
                Solo
              </span>
            </div>

            <h2 className="font-display text-3xl font-bold text-maroon mt-6">For Individuals</h2>
            <p className="text-sm text-ink/65 mt-2 leading-relaxed">
              Solo advocate or junior associate. Generate a scrutiny report on demand —
              no subscription, no commitment.
            </p>

            {/* Price */}
            <div className="mt-6 flex items-end gap-1.5">
              <IndianRupee className="w-6 h-6 text-maroon mb-1.5" />
              <span className="font-display text-5xl font-bold text-maroon leading-none">1,000</span>
              <span className="text-sm text-ink/55 mb-1.5">/ Report</span>
            </div>
            <div className="mt-7 h-px bg-gradient-to-r from-transparent via-maroon/15 to-transparent" />

            <ul className="mt-6 space-y-3 text-sm text-ink/80 flex-1">
              {INDIVIDUAL_FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-rust/10 grid place-items-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-rust" />
                  </span>
                  <span className="leading-snug">{label}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={onIndividual}
              disabled={busy}
              className="mt-8 inline-flex items-center justify-center gap-2 w-full bg-maroon hover:bg-maroon-deep disabled:opacity-70 text-cream px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-[0_12px_28px_-14px_rgba(104,3,24,0.55)] hover:shadow-[0_18px_36px_-16px_rgba(104,3,24,0.6)]"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Continue as Individual <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* ─── Enterprise ─────────────────────────────────────────── */}
          <div className="relative group rounded-3xl p-[1.5px] bg-gradient-to-br from-rust via-maroon to-maroon shadow-[0_28px_70px_-28px_rgba(104,3,24,0.65)] transition-all hover:-translate-y-1">
            {/* Floating badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rust text-cream text-[10px] font-bold tracking-[0.22em] uppercase shadow-[0_8px_20px_-8px_rgba(185,72,38,0.7)]">
                <Star className="w-3 h-3 fill-cream" />
                Recommended for firms
              </span>
            </div>

            <div className="relative rounded-[calc(1.5rem-1.5px)] bg-maroon text-cream p-7 sm:p-8 flex flex-col overflow-hidden h-full">
              <div aria-hidden className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-rust/30 blur-3xl pointer-events-none" />
              <div aria-hidden className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-rust/15 blur-3xl pointer-events-none" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="w-14 h-14 rounded-2xl bg-cream/10 border border-cream/25 grid place-items-center backdrop-blur-sm">
                  <Crown className="w-7 h-7 text-cream" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rust text-cream text-[10px] font-bold tracking-[0.18em] uppercase shadow-md">
                  Enterprise
                </span>
              </div>

              <h2 className="relative font-display text-3xl font-bold mt-6">For Organisations</h2>
              <p className="relative text-sm text-cream/75 mt-2 leading-relaxed">
                Law firms, title verifiers, bank panels. Unlock team management,
                role-based access, monitoring — and a better per-document rate.
              </p>

              {/* Price */}
              <div className="relative mt-6 flex items-end gap-1.5">
                <IndianRupee className="w-6 h-6 text-cream mb-1.5" />
                <span className="font-display text-5xl font-bold text-cream leading-none">500</span>
                <span className="text-sm text-cream/65 mb-1.5">/ Report</span>
                <span className="ml-2 mb-2 inline-flex items-center px-2 py-0.5 rounded-full bg-cream/15 text-cream text-[10px] font-bold tracking-wider uppercase border border-cream/20">
                  Save 50%
                </span>
              </div>
              <div className="relative mt-7 h-px bg-gradient-to-r from-transparent via-cream/25 to-transparent" />

              <p className="relative text-[11px] font-bold tracking-[0.2em] uppercase text-rust-soft mt-6 mb-3">
                Everything in Individual, plus:
              </p>

              <ul className="relative space-y-3 text-sm text-cream/90 flex-1">
                {ENTERPRISE_FEATURES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-cream/12 border border-cream/15 grid place-items-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-cream" />
                    </span>
                    <span className="leading-snug">{label}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard/tsr/onboarding/organization"
                className="relative mt-8 inline-flex items-center justify-center gap-2 w-full bg-rust hover:bg-cream hover:text-maroon text-cream px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-[0_14px_30px_-14px_rgba(185,72,38,0.7)] hover:shadow-[0_20px_40px_-16px_rgba(255,240,223,0.6)]"
              >
                Request Enterprise account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { icon: Shield,  k: "RBI-grade",   v: "data isolation"  },
            { icon: Gauge,   k: "Real-time",   v: "report tracking" },
            { icon: Lock,    k: "Per-user",    v: "case privacy"    },
            { icon: Check,   k: "No setup",    v: "fee, ever"       },
          ].map(({ icon: Icon, k, v }) => (
            <div key={k} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-cream-soft border border-maroon/10">
              <span className="w-9 h-9 rounded-xl bg-maroon/10 grid place-items-center shrink-0">
                <Icon className="w-4 h-4 text-maroon" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-bold text-maroon">{k}</p>
                <p className="text-[11px] text-ink/60">{v}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-ink/50 mt-10">
          Already part of an organisation? Use the sidebar to jump into Clients, My Cases, or Team.
        </p>
      </div>
    </div>
  );
}
