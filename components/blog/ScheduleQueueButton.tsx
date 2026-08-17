"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Clock, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { BlogPost } from "@/types/blog";

interface Props {
  drafts: BlogPost[];
}

function tomorrowAt9am(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function toLocalInputValue(d: Date): string {
  // datetime-local wants `YYYY-MM-DDTHH:mm` in local time.
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ScheduleQueueButton({ drafts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<string>(() => toLocalInputValue(tomorrowAt9am()));
  const [busy, setBusy] = useState(false);

  // Drafts oldest-first, so the earliest-written goes out first.
  const orderedDrafts = useMemo(
    () => [...drafts].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [drafts],
  );

  const previewDates = useMemo(() => {
    if (!start) return [];
    const s = new Date(start);
    if (isNaN(s.getTime())) return [];
    return orderedDrafts.map((_, i) => {
      const d = new Date(s);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [start, orderedDrafts]);

  if (drafts.length === 0) return null;

  async function schedule() {
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      toast.error("Pick a valid start date");
      return;
    }
    setBusy(true);
    const sb = supabase();
    let succeeded = 0;
    try {
      const updates = orderedDrafts.map((post, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return sb.from("blog_posts").update({
          status: "scheduled",
          scheduled_for: d.toISOString(),
        }).eq("id", post.id);
      });
      const results = await Promise.all(updates);
      results.forEach((r) => { if (!r.error) succeeded += 1; });
      const failed = results.length - succeeded;
      if (failed > 0) {
        toast.error(`${succeeded}/${results.length} scheduled — ${failed} failed`);
      } else {
        toast.success(`${succeeded} drafts scheduled — 1 will publish per day`);
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error("Scheduling failed", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium border border-[#680318]/25 bg-[#fff7ec] text-[#680318] hover:border-[#b94826]/40 hover:bg-[#680318]/8 transition-colors"
      >
        <CalendarClock className="h-4 w-4" />
        Schedule queue
        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#b94826]/15 text-[#b94826]">
          {drafts.length}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a0408]/50 backdrop-blur-sm p-4 animate-[fadeIn_0.18s_ease-out]"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-[#fff7ec] border border-[#680318]/15 shadow-[0_30px_80px_-20px_rgba(104,3,24,0.45)] overflow-hidden animate-[slideUp_0.22s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-title"
          >
            {/* ── Hero header on maroon gradient ─────────────── */}
            <div className="relative px-6 sm:px-7 pt-5 pb-6 bg-gradient-to-br from-[#680318] via-[#7a1f2b] to-[#680318] text-[#fff0df] overflow-hidden shrink-0">
              <div aria-hidden className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#b94826]/35 blur-3xl pointer-events-none" />
              <div aria-hidden className="absolute -bottom-20 -left-12 w-48 h-48 rounded-full bg-[#b94826]/20 blur-3xl pointer-events-none" />

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="absolute top-4 right-4 grid place-items-center h-8 w-8 rounded-full text-[#fff0df]/70 hover:bg-[#fff0df]/12 hover:text-[#fff0df] disabled:opacity-50 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative flex items-start gap-4">
                <div className="grid place-items-center h-12 w-12 rounded-2xl bg-[#fff0df]/12 border border-[#fff0df]/20 backdrop-blur-sm shrink-0">
                  <Sparkles className="h-5 w-5 text-[#fff0df]" />
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#fff0df]/12 border border-[#fff0df]/20 text-[10px] font-bold tracking-[0.18em] uppercase mb-1.5">
                    <span className="h-1 w-1 rounded-full bg-[#b94826]" /> Queue
                  </div>
                  <h2 id="schedule-title" className="font-serif text-2xl sm:text-[26px] font-bold leading-tight">
                    Auto-schedule {drafts.length} {drafts.length === 1 ? "draft" : "drafts"}
                  </h2>
                  <p className="text-sm text-[#fff0df]/75 mt-1">
                    One post publishes per day starting from your chosen date.
                  </p>
                </div>
              </div>

              {/* ── Stats strip ─────────────────────────────── */}
              <div className="relative grid grid-cols-3 gap-2 mt-6">
                <HeroStat label="Drafts" value={String(drafts.length)} />
                <HeroStat label="Cadence" value="1 / day" />
                <HeroStat
                  label="Last post"
                  value={
                    previewDates.length > 0
                      ? previewDates[previewDates.length - 1].toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      : "—"
                  }
                />
              </div>
            </div>

            {/* ── Body (scrollable when content overflows) ── */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-7 py-5 space-y-5">
              {/* First publish date */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b94826]">
                    First post publishes at
                  </span>
                  <span className="text-[11px] text-[#680318]/55">
                    {start && !isNaN(new Date(start).getTime())
                      ? new Date(start).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                      : "—"}
                  </span>
                </div>
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#680318]/20 bg-[#fff0df] text-sm font-medium text-[#680318] outline-none focus:border-[#b94826] focus:ring-2 focus:ring-[#b94826]/25 transition-all"
                />

                {/* Quick presets */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {presets().map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setStart(toLocalInputValue(p.date))}
                      className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium border border-[#680318]/20 bg-[#fff0df] text-[#680318]/85 hover:border-[#b94826]/50 hover:text-[#680318] hover:bg-[#680318]/5 transition-colors"
                    >
                      <Clock className="h-3 w-3 text-[#b94826]" />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview list */}
              {previewDates.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b94826]">
                      Publish schedule
                    </span>
                    <span className="text-[11px] text-[#680318]/55">
                      {previewDates.length} {previewDates.length === 1 ? "post" : "posts"} queued
                    </span>
                  </div>
                  <ol className="rounded-xl border border-[#680318]/15 bg-[#fff0df] divide-y divide-[#680318]/10">
                    {orderedDrafts.slice(0, 8).map((post, i) => (
                      <li key={post.id} className="flex items-center gap-3 px-3.5 py-2.5">
                        <span className="grid place-items-center h-7 w-7 rounded-lg bg-[#b94826]/12 text-[#b94826] text-[11px] font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="flex-1 min-w-0 text-sm text-[#680318] truncate font-medium">
                          {post.title || <em className="text-[#680318]/55">(untitled draft)</em>}
                        </span>
                        <span className="text-xs text-[#680318]/70 tabular-nums shrink-0 text-right">
                          <div className="font-semibold text-[#680318]">
                            {previewDates[i].toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </div>
                          <div className="text-[10px] text-[#680318]/55">
                            {previewDates[i].toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </span>
                      </li>
                    ))}
                    {orderedDrafts.length > 8 && (
                      <li className="px-3.5 py-2.5 text-xs text-[#680318]/60 text-center bg-[#fff0df]">
                        + {orderedDrafts.length - 8} more posts
                      </li>
                    )}
                  </ol>
                </div>
              )}

              {/* Cron note */}
              <div className="flex items-start gap-2.5 rounded-xl bg-[#b94826]/8 border border-[#b94826]/25 px-3.5 py-2.5">
                <div className="grid place-items-center h-6 w-6 rounded-full bg-[#b94826]/15 text-[#b94826] shrink-0 mt-0.5">
                  <Clock className="h-3 w-3" />
                </div>
                <p className="text-xs text-[#680318]/80 leading-relaxed">
                  The cron runs <strong className="text-[#680318]">once a day at 11:30 AM IST</strong>. Posts whose scheduled time has passed publish on the next run.
                </p>
              </div>
            </div>

            {/* ── Footer (always visible) ──────────────────── */}
            <div className="shrink-0 px-6 sm:px-7 py-4 flex items-center justify-end gap-2 border-t border-[#680318]/12 bg-[#fff7ec]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="px-4 h-10 rounded-xl text-sm font-medium text-[#680318]/85 hover:bg-[#680318]/8 hover:text-[#680318] disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={schedule}
                disabled={busy || drafts.length === 0}
                className="inline-flex items-center gap-1.5 px-5 h-10 rounded-xl text-sm font-semibold bg-[#680318] text-[#fff0df] border border-[#680318] hover:bg-[#7a1f2b] disabled:opacity-50 shadow-[0_6px_18px_-6px_rgba(104,3,24,0.55)] transition-all"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                {busy ? "Scheduling..." : `Schedule ${drafts.length} ${drafts.length === 1 ? "post" : "posts"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#fff0df]/12 border border-[#fff0df]/20 backdrop-blur-sm px-3 py-2.5">
      <div className="text-[10px] tracking-[0.18em] uppercase text-[#fff0df]/60">{label}</div>
      <div className="font-serif text-lg font-bold text-[#fff0df] leading-none mt-1">{value}</div>
    </div>
  );
}

function presets(): Array<{ label: string; date: Date }> {
  const tomorrow9 = new Date();
  tomorrow9.setDate(tomorrow9.getDate() + 1);
  tomorrow9.setHours(9, 0, 0, 0);

  const nextMonday = new Date();
  const day = nextMonday.getDay(); // 0 Sun .. 6 Sat
  const offset = ((1 - day + 7) % 7) || 7;
  nextMonday.setDate(nextMonday.getDate() + offset);
  nextMonday.setHours(9, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);

  return [
    { label: "Tomorrow 9 AM", date: tomorrow9 },
    { label: "Next Monday", date: nextMonday },
    { label: "+ 1 week", date: nextWeek },
  ];
}
