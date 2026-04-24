"use client";

import { Mail, Gavel, Clock, FileText, CheckCircle2, type LucideIcon } from "lucide-react";
import type { WorkflowStep } from "../types";

interface ProceduralTimelineProps {
  steps: WorkflowStep[];
  /** Optional caption shown above the timeline. */
  title?: string;
}

/**
 * Pick an icon for a given step based on keywords in its title. Falls back
 * through filing → motion → opposition/response → generic check.
 */
function iconFor(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (/file|complaint|notice|service/.test(t)) return Mail;
  if (/motion|hearing|ruling|order|judgment/.test(t)) return Gavel;
  if (/oppose|response|reply|brief/.test(t)) return FileText;
  if (/deadline|due|time|day/.test(t)) return Clock;
  return CheckCircle2;
}

/**
 * Vertical procedural timeline — cream document surface with a gold
 * connecting line, themed icon nodes (dark / gold / light alternating) and a
 * title + day-detail pair per step. Replaces the generic Mermaid block for
 * sequential procedural flows.
 */
export default function ProceduralTimeline({ steps, title }: ProceduralTimelineProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-3 rounded-2xl bg-[#FAF7F0] ring-1 ring-black/[0.06] shadow-[0_4px_24px_-8px_rgba(10,22,40,0.18)] overflow-hidden">
      {title && (
        <div className="px-6 pt-5 pb-1 text-[10px] font-bold tracking-[0.18em] text-[#0A1628]/60">
          {title.toUpperCase()}
        </div>
      )}
      <div className="relative px-6 py-6">
        {/* Vertical gold connector line — sits behind the icon column */}
        <div
          className="absolute left-[37px] top-8 bottom-8 w-px bg-gradient-to-b from-[var(--accent)]/30 via-[var(--accent)]/60 to-[var(--accent)]/20"
          aria-hidden
        />

        <ol className="space-y-5 relative">
          {steps.map((step, i) => {
            const Icon = iconFor(step.title || "");
            // Alternate node styles to mirror the reference design:
            // 0 → dark navy fill, 1 → gold fill, 2 → light/subtle.
            const variant = i % 3;
            const nodeClass =
              variant === 0
                ? "bg-[#0A1628] text-white ring-2 ring-[#0A1628]"
                : variant === 1
                  ? "bg-[var(--accent)] text-[#0A1628] ring-2 ring-[var(--accent)]"
                  : "bg-white text-[#0A1628] ring-2 ring-[#0A1628]/20 shadow-sm";
            return (
              <li key={`step-${i}`} className="relative pl-14 min-h-[44px]">
                <div
                  className={`absolute left-0 top-0 w-11 h-11 rounded-full inline-flex items-center justify-center ${nodeClass}`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div className="pt-1">
                  <div className="text-[15px] font-bold text-[#0A1628] leading-snug">
                    {step.title}
                  </div>
                  {step.detail && (
                    <div className="text-[13px] text-[#475569] mt-1 leading-relaxed">
                      {step.detail}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
