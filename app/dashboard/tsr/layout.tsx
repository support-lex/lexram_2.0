"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardSidebar from "./_components/DashboardSidebar";
import { useMyOrgRequest, useRoleContext } from "@/lib/rbac";

export default function TsrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const ctx = useRoleContext();

  // Anything under /dashboard/tsr/onboarding (and its sub-pages) is allowed to render.
  const isOnboardingRoute = pathname.startsWith("/dashboard/tsr/onboarding");
  const { request, loading: reqLoading } = useMyOrgRequest(!ctx.loading && !isOnboardingRoute);

  useEffect(() => {
    if (isOnboardingRoute) return;
    if (ctx.loading || reqLoading) return;
    if (request && request.status !== "approved") {
      router.replace("/dashboard/tsr/onboarding/pending");
    } else {
      router.replace("/dashboard/tsr/onboarding");
    }
  }, [isOnboardingRoute, ctx.loading, reqLoading, request, router]);

  // Onboarding routes render without the sidebar so the choice screen stands alone.
  if (isOnboardingRoute) {
    return (
      <main className="flex-1 overflow-auto" style={{ backgroundColor: "var(--bg-primary)" }}>
        {children}
      </main>
    );
  }

  // Non-onboarding TSR routes show a spinner while the redirect is in flight.
  if (ctx.loading || reqLoading) {
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
