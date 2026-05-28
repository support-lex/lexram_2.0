"use client";

import { Loader2 } from "lucide-react";

/**
 * TSR root page.
 *
 * The TSR layout funnels every non-onboarding route to /dashboard/tsr/onboarding,
 * so this page only ever renders a brief spinner before the redirect fires.
 */
export default function TsrRootPage() {
  return (
    <div className="flex-1 grid place-items-center min-h-full" style={{ backgroundColor: "var(--bg-primary)" }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
    </div>
  );
}
