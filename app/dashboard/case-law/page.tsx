"use client";

import { Library } from "lucide-react";
import ComingSoonBanner from "@/components/dashboard/ComingSoonBanner";

export default function CaseLawPage() {
  return (
    <ComingSoonBanner
      feature="Case Library"
      description="A curated, searchable library of case law is on the way — with smart citations, related precedents and one-click research handoff."
      icon={Library}
    />
  );
}
