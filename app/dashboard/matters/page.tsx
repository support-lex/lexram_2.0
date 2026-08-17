"use client";

import { Folder } from "lucide-react";
import ComingSoonBanner from "@/components/dashboard/ComingSoonBanner";

export default function MattersPage() {
  return (
    <ComingSoonBanner
      feature="Matters"
      description="A focused workspace for every matter — chronology, drafts, deadlines and AI memos in one place. Almost ready."
      icon={Folder}
    />
  );
}
