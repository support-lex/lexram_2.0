"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Building2, ArrowRight, Loader2, IndianRupee, Sparkles,
  CheckCircle2, Shield, Users, AlertCircle,
} from "lucide-react";
import { startAsIndividual, useRoleContext } from "@/lib/rbac";

export default function OnboardingChoicePage() {
  const router = useRouter();
  const ctx = useRoleContext();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* If they already have a membership, send them to the workspace. */
  if (!ctx.loading && ctx.role !== "no_role" && ctx.org) {
    if (typeof window !== "undefined") router.replace("/dashboard/tsr");
    return null;
  }

  const onIndividual = async () => {
    setBusy(true);
    setError(null);
    try {
      await startAsIndividual();
      await ctx.refresh();
      router.replace("/dashboard/tsr");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto bg-cream">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase mb-4">
          <Sparkles className="w-3 h-3 text-rust" />
          Welcome to LEXRAM TSR
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-maroon">
          How will you use Title Scrutiny?
        </h1>
        <p className="text-sm sm:text-base text-ink/65 mt-3 max-w-xl mx-auto">
          Pick the path that fits — solo advocate paying per report,
          or a firm onboarding the whole team.
        </p>
      </div>

      {error && (
        <div className="max-w-xl mx-auto mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 break-words">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Individual card */}
        <div className="relative rounded-2xl border border-maroon/15 bg-cream-soft shadow-soft p-7 flex flex-col">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-maroon/10 grid place-items-center">
              <User className="w-6 h-6 text-maroon" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rust/15 text-rust text-[10px] font-bold tracking-[0.18em] uppercase">
              <IndianRupee className="w-3 h-3" />
              500 / report
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-maroon mt-5">Use as Individual</h2>
          <p className="text-sm text-ink/65 mt-2 leading-relaxed">
            Solo advocate or junior associate paying per scrutiny. No setup fee, no commitment — just pay
            ₹500 when you generate a report.
          </p>

          <ul className="mt-5 space-y-2 text-sm text-ink/80">
            {[
              "Full TSR workflow (upload, scrutiny, query report)",
              "Own private case library",
              "Pay ₹500 only when you generate a report",
              "Switch to organisation later, anytime",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-rust shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={onIndividual}
            disabled={busy}
            className="mt-7 inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep disabled:opacity-70 text-cream px-5 py-3 rounded-xl text-sm font-semibold transition shadow-[0_10px_24px_-12px_rgba(104,3,24,0.55)]"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue as Individual <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        {/* Organisation card */}
        <div className="relative rounded-2xl border border-maroon/15 bg-maroon text-cream shadow-[0_24px_60px_-25px_rgba(104,3,24,0.6)] p-7 flex flex-col overflow-hidden">
          <div aria-hidden className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-rust/30 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-cream/10 border border-cream/20 grid place-items-center">
              <Building2 className="w-6 h-6 text-cream" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rust text-cream text-[10px] font-bold tracking-[0.18em] uppercase">
              Team plans
            </span>
          </div>
          <h2 className="relative font-display text-2xl font-bold mt-5">Join as Organisation</h2>
          <p className="relative text-sm text-cream/75 mt-2 leading-relaxed">
            Law firm, title verifier, or bank panel? Submit your firm details — Lexram reviews and provisions
            an organisation account with admin access and team seats.
          </p>

          <ul className="relative mt-5 space-y-2 text-sm text-cream/85">
            {[
              { i: Users,  t: "Invite + manage your whole team" },
              { i: Shield, t: "Per-user case isolation, admin audit view" },
              { i: CheckCircle2, t: "Billed per organisation, not per report" },
              { i: Sparkles, t: "Custom seat limits + dedicated support" },
            ].map(({ i: Icon, t }) => (
              <li key={t} className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-rust-soft shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/dashboard/tsr/onboarding/organization"
            className="relative mt-7 inline-flex items-center justify-center gap-2 bg-rust hover:bg-rust-soft text-cream px-5 py-3 rounded-xl text-sm font-semibold transition shadow-[0_10px_24px_-12px_rgba(185,72,38,0.65)]"
          >
            Request organisation account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <p className="text-center text-[11px] text-ink/50 mt-8">
        Already signed in as part of an org? Refresh this page — the system will detect your membership and skip this screen.
      </p>
    </div>
  );
}
