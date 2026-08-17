"use client";

import { Building2 } from "lucide-react";
import { useOrg } from "./OrgProvider";

/** Org logo (or fallback icon) + optional name — used in the sidebar/login. */
export function OrgMark({ size = 40, showName = true }: { size?: number; showName?: boolean }) {
  const { org } = useOrg();
  return (
    <div className="inline-flex items-center gap-2.5">
      <div
        className="rounded-xl bg-maroon/8 grid place-items-center shrink-0 overflow-hidden"
        style={{ width: size, height: size }}
      >
        {org?.logo_url
          ? /* eslint-disable-next-line @next/next/no-img-element */
            <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
          : <Building2 className="text-maroon" style={{ width: size * 0.5, height: size * 0.5 }} />}
      </div>
      {showName && (
        <div className="min-w-0">
          <div className="font-display font-bold text-maroon leading-tight truncate">{org?.name ?? "TSR"}</div>
          <div className="text-[10px] tracking-[0.18em] uppercase text-ink/50">Title Scrutiny</div>
        </div>
      )}
    </div>
  );
}
