"use client";

import { useEffect, useState } from "react";
import { Check, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { BlogComment } from "@/types/blog";

interface Props {
  slug: string;
}

type FormState = "idle" | "submitting" | "success" | "error";

export default function CommentsSection({ slug }: Props) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    supabase()
      .from("blog_comments")
      .select("id, post_slug, author_name, content, status, created_at")
      .eq("post_slug", slug)
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setComments((data as BlogComment[]) ?? []);
        setLoading(false);
      });
  }, [slug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    setFormState("submitting");
    setErrorMsg("");

    const { error } = await supabase().from("blog_comments").insert({
      post_slug: slug,
      author_name: name.trim(),
      author_email: email.trim() || null,
      content: content.trim(),
      status: "pending",
    });

    if (error) {
      setErrorMsg("Something went wrong. Please try again.");
      setFormState("error");
    } else {
      setFormState("success");
      setName("");
      setEmail("");
      setContent("");
    }
  }

  return (
    <section id="comments" className="mt-16 pt-10 border-t border-[#680318]/20">
      {/* Heading */}
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="h-6 w-6 text-[#680318]" />
        <h2 className="font-serif text-3xl font-bold text-[#680318]">
          Comments
          {!loading && comments.length > 0 && (
            <span className="ml-2 text-xl font-normal text-[#680318]/50">({comments.length})</span>
          )}
        </h2>
      </div>

      {/* Comment list — only shown when there are approved comments */}
      {loading ? (
        <div className="space-y-3 mb-10">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl bg-[#3a0d18]/8 h-28" />
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4 mb-10">
          {comments.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}
        </div>
      ) : null}

      {/* Form card */}
      <div className="rounded-2xl border border-[#680318]/25 bg-[#3a0d18]/[0.06] overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-[#680318]/20 bg-[#3a0d18]/[0.05]">
          <h3 className="font-serif text-xl font-semibold text-[#3a0d18]">Leave a comment</h3>
          <p className="text-sm text-[#680318]/60 mt-0.5">Comments are reviewed before publishing.</p>
        </div>

        <div className="px-6 sm:px-8 py-7">
          {formState === "success" ? (
            <SuccessBanner onReset={() => setFormState("idle")} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Name" required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your name"
                    className={inputCls}
                  />
                </Field>
                <Field label="Email" hint="optional, not published">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Comment" required>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={5}
                  placeholder="Share your thoughts on this article…"
                  className={`${inputCls} py-3 resize-none`}
                />
              </Field>

              {formState === "error" && (
                <p className="text-base text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  disabled={formState === "submitting" || !name.trim() || !content.trim()}
                  className="inline-flex items-center gap-2 px-7 h-11 rounded-lg bg-[#3a0d18] text-[#fff0df] text-base font-semibold hover:bg-[#680318] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {formState === "submitting" ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-[#fff0df]/40 border-t-[#fff0df] animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Post comment
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function CommentCard({ comment }: { comment: BlogComment }) {
  const date = new Date(comment.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-[#680318]/20 bg-[#3a0d18]/[0.05] p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="grid place-items-center h-10 w-10 rounded-full bg-[#680318]/20 text-[#680318] text-sm font-bold shrink-0 select-none">
          {initials(comment.author_name)}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#3a0d18] truncate">{comment.author_name}</p>
          <p className="text-xs text-[#680318]/55">{date}</p>
        </div>
      </div>
      <p className="text-base text-[#3a0d18] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
    </div>
  );
}

function SuccessBanner({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#680318]/12 mb-4">
        <Check className="h-7 w-7 text-[#680318]" />
      </div>
      <p className="font-serif text-xl font-semibold text-[#3a0d18] mb-2">Comment submitted!</p>
      <p className="text-base text-[#680318]/70 max-w-sm leading-relaxed">
        Thank you. Your comment is pending review and will appear once approved by the team.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 text-base font-medium text-[#b94826] hover:text-[#680318] transition underline underline-offset-2"
      >
        Write another comment
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-baseline gap-1.5 text-sm font-semibold text-[#3a0d18] mb-2">
        {label}
        {required && <span className="text-[#b94826]">*</span>}
        {hint && <span className="font-normal text-[#680318]/50">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-11 px-4 rounded-lg border border-[#680318]/20 bg-white/80 text-[#3a0d18] text-base placeholder:text-[#680318]/35 outline-none focus:border-[#680318] focus:ring-2 focus:ring-[#680318]/15 transition-all";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}