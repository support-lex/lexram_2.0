"use client";

import { LayoutGrid } from "lucide-react";
import ComingSoonBanner from "@/components/dashboard/ComingSoonBanner";

export default function DashboardPage() {
  return (
    <ComingSoonBanner
      feature="Dashboard"
      description="Your unified workspace is being reimagined. We're bringing live matter activity, deadlines and AI insights into one calm view."
      icon={LayoutGrid}
    />
  );
}
