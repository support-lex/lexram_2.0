"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Scale, FolderOpen, ArrowLeft, Sparkles, Loader2, IndianRupee,
} from "lucide-react";
import { useRoleContext, useMyOrgRequest } from "@/lib/rbac";

/**
 * TSR entry route.
 *
 * Dispatches based on the signed-in user's state:
 *   • No membership + no pending request → onboarding choice screen
 *   • No membership + pending/rejected request → /onboarding/pending
 *   • Has membership → standard welcome card (existing UI)
 *
 * The TSR layout still wraps this with the sidebar, so once the user has an
 * org they see clients + My Cases + (Team / Organisations if admin).
 */
export default function TsrWelcomePage() {
  const router = useRouter();
  const ctx = useRoleContext();
  const hasNoMembership = !ctx.loading && ctx.role === "no_role";
  const { request, loading: reqLoading } = useMyOrgRequest(hasNoMembership);

  useEffect(() => {
    if (ctx.loading) return;
    if (ctx.role === "no_role") {
      if (reqLoading) return;
      if (request && request.status !== "approved") {
        router.replace("/dashboard/tsr/onboarding/pending");
      } else {
        router.replace("/dashboard/tsr/onboarding");
      }
    }
  }, [ctx.loading, ctx.role, reqLoading, request, router]);

  if (ctx.loading || (hasNoMembership && reqLoading)) {
    return (
      <div className="flex-1 grid place-items-center min-h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (ctx.role === "no_role") {
    /* useEffect is mid-redirect. Avoid flashing the welcome card. */
    return (
      <div className="flex-1 grid place-items-center min-h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  const isIndividual = ctx.org?.account_type === "individual";

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-full px-6 text-center overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div aria-hidden className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--lex-rust-soft)' }} />
      <div aria-hidden className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full blur-3xl" style={{ backgroundColor: 'var(--lex-maroon-soft)' }} />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--lex-maroon) 1px, transparent 1px), linear-gradient(to bottom, var(--lex-maroon) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 75%)",
        }}
      />

      <div className="relative z-10 max-w-xl">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-7 mx-auto" style={{ backgroundColor: 'var(--lex-maroon)', color: 'var(--lex-cream)', boxShadow: 'var(--lex-shadow-elevated)' }}>
          <Scale className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-medium tracking-[0.18em] uppercase mb-5" style={{ backgroundColor: 'var(--lex-maroon-soft)', borderColor: 'var(--lex-maroon-soft)', color: 'var(--lex-maroon)' }}>
          <Sparkles size={12} style={{ color: 'var(--accent)' }} />
          {isIndividual ? "Individual workspace" : ctx.org?.name ?? "Welcome"}
        </div>

        <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.05]" style={{ color: 'var(--lex-maroon)' }}>
          Welcome to <span className="italic" style={{ color: 'var(--lex-rust)' }}>LEXRAM TSR</span>
        </h1>

        <p className="max-w-md mx-auto leading-relaxed mt-5 text-base" style={{ color: 'var(--text-secondary)' }}>
          Select a client from the sidebar to view their scrutiny report, or create a new client to grant a fresh Title Scrutiny Report.
        </p>

        {isIndividual && (
          <div className="mt-7 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--lex-rust-soft)', color: 'var(--accent)' }}>
            <IndianRupee className="w-3.5 h-3.5" />
            ₹500 per generated report on the Individual plan
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 max-w-md w-full mx-auto mt-10">
          <div className="flex-1 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg grid place-items-center shadow-md" style={{ backgroundColor: 'var(--lex-maroon)', color: 'var(--lex-cream)' }}>
                <FolderOpen className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold font-display" style={{ color: 'var(--text-primary)' }}>Open a client</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Click any client in the left panel to open their file and view the scrutiny report.
            </p>
          </div>
          <div className="flex-1 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg grid place-items-center shadow-md" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </div>
              <span className="text-sm font-semibold font-display" style={{ color: 'var(--text-primary)' }}>New client</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Click <strong style={{ color: 'var(--accent)' }}>+ New Client</strong> at the top of the sidebar to grant a fresh report.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
