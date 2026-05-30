"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import DashboardSidebar from "./_components/DashboardSidebar";
import { useMyOrgRequest, useRoleContext } from "@/lib/rbac";

/**
 * TSR layout — controls who gets to see the workspace vs. an onboarding screen.
 *
 * Routing rules (run only on non-onboarding routes; onboarding pages render as-is):
 *   1. User has membership (any role)  → render TSR workspace (no redirect).
 *   2. User has pending/rejected org request → /dashboard/tsr/onboarding/pending.
 *   3. Otherwise (no membership, no request) → /dashboard/tsr/onboarding (choice screen).
 *
 * If the role/request queries stall for more than STUCK_AFTER_MS the layout
 * surfaces a diagnostic panel instead of spinning forever — usually means
 * Supabase auth/refresh is failing or the user has corrupted membership rows.
 */

const STUCK_AFTER_MS = 8000;

=======
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardSidebar from "./_components/DashboardSidebar";
import { useMyOrgRequest, useRoleContext } from "@/lib/rbac";

>>>>>>> tsr
export default function TsrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const ctx = useRoleContext();
<<<<<<< HEAD
  const [stuck, setStuck] = useState(false);

  const isOnboardingChoice = pathname === "/dashboard/tsr/onboarding";
  const isOnboardingOrg    = pathname.startsWith("/dashboard/tsr/onboarding/organization");
  const isOnboardingPending = pathname.startsWith("/dashboard/tsr/onboarding/pending");
  const isAnyOnboarding = isOnboardingChoice || isOnboardingOrg || isOnboardingPending;

  // Members already inside the workspace don't need org-request data; skip the query.
  const hasMembership = !ctx.loading && ctx.role !== "no_role" && !!ctx.org;
  const { request, loading: reqLoading } = useMyOrgRequest(!ctx.loading && !hasMembership);

  // Watchdog: if we're still loading after STUCK_AFTER_MS, surface a panel
  // with diagnostic state so users aren't trapped behind a blank spinner.
  useEffect(() => {
    if (isAnyOnboarding) return;
    if (!ctx.loading && !reqLoading) { setStuck(false); return; }
    const t = setTimeout(() => setStuck(true), STUCK_AFTER_MS);
    return () => clearTimeout(t);
  }, [isAnyOnboarding, ctx.loading, reqLoading]);

  useEffect(() => {
    if (ctx.loading || reqLoading) return;

    // Members never get bounced — they own the workspace.
    if (hasMembership) {
      // If they wandered into /onboarding* by URL, send them home.
      if (isAnyOnboarding) router.replace("/dashboard/tsr/my-cases");
      return;
    }

    // Pending or rejected org request: lock onto the pending screen.
    if (request && request.status !== "approved") {
      if (!isOnboardingPending) router.replace("/dashboard/tsr/onboarding/pending");
      return;
    }

    // No membership, no request: force the choice screen.
    if (!isOnboardingChoice && !isOnboardingOrg) {
      router.replace("/dashboard/tsr/onboarding");
    }
  }, [
    ctx.loading, reqLoading, hasMembership, request,
    isAnyOnboarding, isOnboardingChoice, isOnboardingOrg, isOnboardingPending,
    router,
  ]);

  // Onboarding pages: render full-bleed (no sidebar).
  if (isAnyOnboarding) {
=======

  // Anything under /dashboard/tsr/onboarding (and its sub-pages) is allowed to render.
  const isOnboardingRoute = pathname.startsWith("/dashboard/tsr/onboarding");
  const { request, loading: reqLoading } = useMyOrgRequest(!ctx.loading && !isOnboardingRoute);

  useEffect(() => {
    if (isOnboardingRoute) return;
    if (ctx.loading || reqLoading) return;
    // User already has an org — let them through
    if (ctx.role !== "no_role") return;
    // No org yet: pending enterprise request or fresh user
    if (request && request.status !== "approved") {
      router.replace("/dashboard/tsr/onboarding/pending");
    } else {
      router.replace("/dashboard/tsr/onboarding");
    }
  }, [isOnboardingRoute, ctx.loading, reqLoading, ctx.role, request, router]);

  // Onboarding routes render without the sidebar so the choice screen stands alone.
  if (isOnboardingRoute) {
>>>>>>> tsr
    return (
      <main className="flex-1 overflow-auto" style={{ backgroundColor: "var(--bg-primary)" }}>
        {children}
      </main>
    );
  }

<<<<<<< HEAD
  // Stuck watchdog — exposes the loading state instead of an infinite spinner.
  if (stuck) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-full px-6" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="max-w-md w-full bg-cream-soft border border-maroon/15 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-maroon/10 grid place-items-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-maroon" />
          </div>
          <h2 className="font-display text-xl font-bold text-maroon">Stuck loading your workspace</h2>
          <p className="text-xs text-ink/65 mt-2 leading-relaxed">
            Your role / membership lookup hasn&apos;t completed in {STUCK_AFTER_MS / 1000}s. Usually this means your
            Supabase session expired or your account has inconsistent organisation membership rows.
          </p>
          <pre className="text-[10px] text-left bg-cream rounded-lg p-3 mt-4 border border-maroon/10 overflow-x-auto">
{`role:           ${ctx.role}
ctx.loading:    ${String(ctx.loading)}
reqLoading:     ${String(reqLoading)}
hasMembership:  ${String(hasMembership)}
org_id:         ${ctx.org?.id ?? "—"}
user_id:        ${ctx.user_id ?? "—"}`}
          </pre>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={() => { setStuck(false); ctx.refresh(); }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-maroon hover:bg-maroon-deep text-cream text-sm font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <button
              onClick={() => router.replace("/dashboard/tsr/onboarding")}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-maroon/20 text-maroon text-sm font-semibold hover:bg-maroon/5 transition"
            >
              Go to onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Spinner while we figure out where the user belongs.
  if (ctx.loading || reqLoading || !hasMembership) {
=======
  // Non-onboarding TSR routes show a spinner while the redirect is in flight.
  if (ctx.loading || reqLoading) {
>>>>>>> tsr
    return (
      <div className="flex-1 grid place-items-center min-h-full" style={{ backgroundColor: "var(--bg-primary)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
      <DashboardSidebar />
      <main className="flex-1 overflow-auto" style={{ backgroundColor: "var(--bg-primary)" }}>
        {children}
      </main>
    </div>
  );
}
