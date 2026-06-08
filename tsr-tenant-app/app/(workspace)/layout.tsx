"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ShieldAlert, LogOut, Building2 } from "lucide-react";
import { useOrg } from "../_components/OrgProvider";
import { useSession } from "../_components/useSession";
import { ORG_SLUG } from "@/lib/org-config";
import DashboardSidebar from "../_components/DashboardSidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading: orgLoading, org, error: orgError } = useOrg();
  const session = useSession();

  // Not signed in → login.
  useEffect(() => {
    if (orgLoading || session.loading) return;
    if (!session.signedIn) router.replace("/login");
  }, [orgLoading, session.loading, session.signedIn, router]);

  // ── Org config problems ───────────────────────────────────────────────────
  if (!ORG_SLUG || orgError || (!orgLoading && !org)) {
    return (
      <Centered>
        <div className="w-14 h-14 rounded-2xl bg-maroon/10 grid place-items-center mb-3">
          <AlertCircle className="w-7 h-7 text-maroon/60" />
        </div>
        <h1 className="font-display text-2xl font-bold text-maroon">Workspace not configured</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-sm">
          {!ORG_SLUG
            ? "NEXT_PUBLIC_ORG_SLUG is not set for this deployment."
            : orgError ?? `No organisation found for "${ORG_SLUG}".`}
        </p>
      </Centered>
    );
  }

  if (orgLoading || session.loading) {
    return <Centered><Loader2 className="w-6 h-6 animate-spin text-maroon" /></Centered>;
  }

  if (!session.signedIn) {
    return <Centered><Loader2 className="w-6 h-6 animate-spin text-maroon" /></Centered>;
  }

  // Signed in but not a member of this org.
  if (!session.allowed) {
    return (
      <Centered>
        <div className="w-14 h-14 rounded-2xl bg-maroon/10 grid place-items-center mb-3">
          <ShieldAlert className="w-7 h-7 text-maroon/60" />
        </div>
        <h1 className="font-display text-2xl font-bold text-maroon">No access to {org?.name}</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-sm">
          {session.email} isn&apos;t an active member of this organisation. Ask your admin for an invite.
        </p>
        <button onClick={() => session.signOut().then(() => router.replace("/login"))}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rust hover:text-maroon">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </Centered>
    );
  }

  // Suspended org notice (still allow super admins to look).
  if (org?.status === "suspended") {
    return (
      <Centered>
        <div className="w-14 h-14 rounded-2xl bg-amber-100 grid place-items-center mb-3">
          <Building2 className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-maroon">{org.name} is suspended</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-sm">This workspace is temporarily unavailable. Contact Lexram support.</p>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen flex bg-cream">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto bg-cream">{children}</main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-cream">
      {children}
    </div>
  );
}
