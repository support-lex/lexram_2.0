"use client";

<<<<<<< HEAD
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useRoleContext } from "@/lib/rbac";
=======
import { Loader2 } from "lucide-react";
>>>>>>> tsr

/**
 * TSR root page.
 *
<<<<<<< HEAD
 * Members land here briefly; we forward them to /my-cases. Non-members are
 * handled by the layout (redirected to /onboarding or /onboarding/pending).
 */
export default function TsrRootPage() {
  const router = useRouter();
  const ctx = useRoleContext();

  useEffect(() => {
    if (ctx.loading) return;
    if (ctx.role !== "no_role" && ctx.org) {
      router.replace("/dashboard/tsr/my-cases");
    }
  }, [ctx.loading, ctx.role, ctx.org, router]);

=======
 * The TSR layout funnels every non-onboarding route to /dashboard/tsr/onboarding,
 * so this page only ever renders a brief spinner before the redirect fires.
 */
export default function TsrRootPage() {
>>>>>>> tsr
  return (
    <div className="flex-1 grid place-items-center min-h-full" style={{ backgroundColor: "var(--bg-primary)" }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
    </div>
  );
}
