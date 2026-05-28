"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
 * The pending lock is sticky: once a request is in-flight, the user cannot
 * navigate back to the onboarding choice screen until it's approved or
 * rejected (or until they have a membership).
 */
export default function TsrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const ctx = useRoleContext();

  const isOnboardingChoice = pathname === "/dashboard/tsr/onboarding";
  const isOnboardingOrg    = pathname.startsWith("/dashboard/tsr/onboarding/organization");
  const isOnboardingPending = pathname.startsWith("/dashboard/tsr/onboarding/pending");
  const isAnyOnboarding = isOnboardingChoice || isOnboardingOrg || isOnboardingPending;

  // Members already inside the workspace don't need org-request data; skip the query.
  const hasMembership = !ctx.loading && ctx.role !== "no_role" && !!ctx.org;
  const { request, loading: reqLoading } = useMyOrgRequest(!ctx.loading && !hasMembership);

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
    return (
      <main className="flex-1 overflow-auto" style={{ backgroundColor: "var(--bg-primary)" }}>
        {children}
      </main>
    );
  }

  // Spinner while we figure out where the user belongs.
  if (ctx.loading || reqLoading || !hasMembership) {
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
