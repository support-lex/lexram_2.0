"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ORG_SLUG, fetchOrgBranding, type OrgBranding } from "@/lib/org-config";

interface OrgState {
  loading: boolean;
  org: OrgBranding | null;
  error: string | null;
}

const OrgContext = createContext<OrgState>({ loading: true, org: null, error: null });

export function useOrg() {
  return useContext(OrgContext);
}

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OrgState>({ loading: true, org: null, error: null });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!ORG_SLUG) {
        if (active) setState({ loading: false, org: null, error: "NEXT_PUBLIC_ORG_SLUG is not set." });
        return;
      }
      try {
        const org = await fetchOrgBranding();
        if (!active) return;
        setState({
          loading: false,
          org,
          error: org ? null : `No organisation found for "${ORG_SLUG}".`,
        });
      } catch (e) {
        if (active) setState({ loading: false, org: null, error: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => { active = false; };
  }, []);

  return <OrgContext.Provider value={state}>{children}</OrgContext.Provider>;
}
