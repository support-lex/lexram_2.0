"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, X, Loader2, Sparkles } from "lucide-react";
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
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)] transition-colors"
      >
        <CalendarClock className="h-4 w-4" />
        Schedule queue
        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
          {drafts.length}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !busy && setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-lg)] overflow-hidden"
          >
            <div className="p-5 border-b border-[var(--border-default)] flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="grid place-items-center h-9 w-9 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Auto-schedule {drafts.length} drafts</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">One post will publish per day starting from your chosen date.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="grid place-items-center h-8 w-8 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">First post publishes at</span>
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring-accent)]"
                />
              </label>

              {previewDates.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)] mb-2">
                    Preview ({previewDates.length} {previewDates.length === 1 ? "post" : "posts"})
                  </p>
                  <ul className="max-h-48 overflow-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] divide-y divide-[var(--border-default)]">
                    {orderedDrafts.slice(0, 8).map((post, i) => (
                      <li key={post.id} className="flex items-center justify-between px-3 py-2 text-xs">
                        <span className="text-[var(--text-primary)] truncate flex-1 mr-2">
                          <span className="text-[var(--text-muted)] mr-1.5">{i + 1}.</span>
                          {post.title || "(untitled)"}
                        </span>
                        <span className="text-[var(--text-muted)] tabular-nums shrink-0">
                          {previewDates[i].toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          {", "}
                          {previewDates[i].toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </li>
                    ))}
                    {orderedDrafts.length > 8 && (
                      <li className="px-3 py-2 text-xs text-[var(--text-muted)] text-center">
                        + {orderedDrafts.length - 8} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 px-3 py-2 text-xs text-[var(--text-secondary)]">
                Heads-up: the cron runs <strong>once a day at 11:30 AM IST</strong>. Posts whose scheduled time has passed will publish on the next run.
              </div>
            </div>

            <div className="p-4 flex items-center justify-end gap-2 border-t border-[var(--border-default)] bg-[var(--bg-primary)]/40">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="px-3 h-9 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={schedule}
                disabled={busy || drafts.length === 0}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] disabled:opacity-50 shadow-[var(--shadow-sm)] transition-colors"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                {busy ? "Scheduling..." : `Schedule ${drafts.length} posts`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
