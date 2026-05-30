"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  ChevronDown,
  Clock,
  Loader2,
  Sparkles,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

import BlogEditor from "@/components/blog/BlogEditor";
import CoverImageUpload from "@/components/blog/CoverImageUpload";
import TagInput from "@/components/blog/TagInput";
import AIWritePanel from "@/components/blog/AIWritePanel";
import { useUserRole } from "@/lib/auth-guard";
import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase/client";
import { calculateReadingTime, createPost, updatePost } from "@/lib/blog/api";
import type { BlogPost, BlogStatus } from "@/types/blog";
import { BLOG_CATEGORIES } from "@/types/blog";



const AUTOSAVE_DEBOUNCE_MS = 2500;

export default function CreateBlogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-[#fff0df] text-[#680318]/60"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <CreateBlogPageInner />
    </Suspense>
  );
}

function CreateBlogPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { role, loading: roleLoading } = useUserRole();
  const currentUser = useCurrentUser();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loadingExisting, setLoadingExisting] = useState<boolean>(!!editId);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<BlogStatus>("draft");
  const [scheduledFor, setScheduledFor] = useState<string>("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [seoOpen, setSeoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [authorId, setAuthorId] = useState<string | null>(null);

  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const subtitleRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize the title / subtitle textareas whenever their value changes —
  // covers both user typing AND programmatic updates (e.g. AI-generated drafts).
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title]);
  useEffect(() => {
    if (subtitleRef.current) {
      subtitleRef.current.style.height = "auto";
      subtitleRef.current.style.height = `${subtitleRef.current.scrollHeight}px`;
    }
  }, [subtitle]);

  // Auto-fill author once Supabase user lands.
  useEffect(() => {
    if (!authorName && currentUser) setAuthorName(getDisplayName(currentUser));
  }, [currentUser, authorName]);

  useEffect(() => {
    supabase().auth.getUser().then(({ data }) => setAuthorId(data.user?.id ?? null));
  }, []);

  // Load existing post when ?edit=<id> is present so this same page acts as the editor.
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase()
        .from("blog_posts")
        .select("*")
        .eq("id", editId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        toast.error("Could not load that post", { description: error?.message });
        router.replace("/blog/admin");
        return;
      }
      const p = data as BlogPost;
      setPost(p);
      setTitle(p.title);
      setSubtitle(p.subtitle ?? "");
      setAuthorName(p.author_name ?? "");
      setCategory(p.category ?? "");
      setTags(p.tags ?? []);
      setContent(p.content_html ?? "");
      setCoverUrl(p.cover_image_url ?? null);
      setStatus(p.status);
      setMetaTitle(p.meta_title ?? "");
      setMetaDescription(p.meta_description ?? "");
      if (p.scheduled_for) {
        // datetime-local needs `YYYY-MM-DDTHH:mm` in local time.
        const d = new Date(p.scheduled_for);
        const pad = (n: number) => n.toString().padStart(2, "0");
        setScheduledFor(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      }
      if (p.meta_title || p.meta_description) setSeoOpen(true);
      setLoadingExisting(false);
    })();
    return () => { cancelled = true; };
  }, [editId, router]);

  // Admin gate.
  useEffect(() => {
    if (roleLoading) return;
    if (role !== "admin") {
      toast.error("Only admins can create blog posts");
      router.replace("/blog");
    }
  }, [role, roleLoading, router]);

  const readingTime = useMemo(() => calculateReadingTime(content), [content]);
  const wordCount = useMemo(() => {
    const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text ? text.split(" ").length : 0;
  }, [content]);

  // ── Auto-save (debounced) ────────────────────────────────────────────────
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  useEffect(() => { dirtyRef.current = true; }, [title, subtitle, authorName, category, tags, content, coverUrl, metaTitle, metaDescription]);

  useEffect(() => {
    if (!title.trim()) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (dirtyRef.current && !saving) void doSave({ silent: true });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, authorName, category, tags, content, coverUrl, metaTitle, metaDescription]);

  async function doSave(opts?: { silent?: boolean; nextStatus?: BlogStatus }): Promise<BlogPost | null> {
    if (!title.trim()) {
      if (!opts?.silent) toast.error("Add a title before saving");
      return null;
    }
    setSaving(true);
    try {
      const nextStatus = opts?.nextStatus ?? status;
      const draft = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        cover_image_url: coverUrl,
        content_html: content,
        category: category || null,
        tags,
        status: nextStatus,
        scheduled_for: nextStatus === "scheduled" && scheduledFor ? new Date(scheduledFor).toISOString() : null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        author_id: authorId,
        author_name: authorName.trim() || null,
        reading_time: readingTime,
      };

      const saved = post
        ? await updatePost(post.id, draft)
        : await createPost(draft);

      setPost(saved);
      setStatus(saved.status);
      setLastSavedAt(new Date());
      dirtyRef.current = false;
      if (!opts?.silent) {
        toast.success(
          nextStatus === "published" ? "Published" :
          nextStatus === "scheduled" ? "Scheduled" : "Draft saved",
        );
      }
      return saved;
    } catch (e) {
      console.error(e);
      if (!opts?.silent) toast.error("Save failed", { description: (e as Error).message });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    const saved = await doSave({ nextStatus: "published" });
    if (saved?.status === "published") router.push(`/blog/${saved.slug}`);
  }

  async function handleSchedule() {
    if (!scheduledFor) { toast.error("Pick a date & time first"); return; }
    await doSave({ nextStatus: "scheduled" });
  }

  async function handlePreview() {
    const saved = await doSave({ silent: true });
    if (saved) router.push(`/blog/${saved.slug}?preview=1`);
  }

  if (roleLoading || role !== "admin" || loadingExisting) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#fff0df] text-[#680318]/60">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff0df] pb-32">
      {/* ─────── Sticky header ─────── */}
      <header className="sticky top-0 z-30 bg-[#fff0df]/85 backdrop-blur border-b border-[#680318]/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/blog"
              className="grid place-items-center h-9 w-9 rounded-lg text-[#680318]/80 hover:bg-[#680318]/8 hover:text-[#680318] transition-colors"
              aria-label="Back to blog"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-serif text-lg font-bold text-[#680318] truncate">
                {post ? "Edit blog" : "Create blog"}
              </h1>
              <SaveStatusLine saving={saving} lastSavedAt={lastSavedAt} status={status} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={saving}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium border border-[#680318]/25 bg-[#fff7ec] text-[#680318] hover:border-[#b94826]/50 hover:bg-[#680318]/8 disabled:opacity-50 transition-colors"
            >
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button
              type="button"
              onClick={() => doSave({ nextStatus: "draft" })}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium border border-[#680318]/25 bg-[#fff7ec] text-[#680318] hover:border-[#b94826]/50 hover:bg-[#680318]/8 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" /> <span className="hidden sm:inline">Save draft</span>
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-semibold bg-[#680318] text-[#fff0df] border border-[#680318] hover:bg-[#7a1f2b] hover:border-[#7a1f2b] disabled:opacity-50 shadow-[0_4px_14px_-4px_rgba(104,3,24,0.45)] transition-all"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {status === "published" ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      {/* ─────── Body ─────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        <CoverImageUpload value={coverUrl} onChange={setCoverUrl} />

        <div className="space-y-3 rounded-2xl border border-[#680318]/15 bg-[#fff7ec] p-5 sm:p-6 focus-within:border-[#b94826]/40 focus-within:shadow-sm transition-all">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter blog title"
            rows={1}
            className="w-full font-serif text-3xl sm:text-4xl font-bold text-[#680318] placeholder:text-[#680318]/55 bg-transparent outline-none resize-none leading-tight"
          />
          <div className="h-px bg-[#680318]/10" aria-hidden />
          <textarea
            ref={subtitleRef}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Add a subtitle or short description (optional)"
            rows={1}
            className="w-full text-base sm:text-lg text-[#680318]/85 placeholder:text-[#680318]/50 bg-transparent outline-none resize-none leading-snug"
          />
        </div>

        {/* ── Meta row: author + category + tags ───────────────────────── */}
        <section className="grid sm:grid-cols-2 gap-4">
          <Field label="Author">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Author name"
              className="w-full px-3 py-2 rounded-lg border border-[#680318]/20 bg-[#fff7ec] text-sm text-[#680318] outline-none focus:border-[#b94826] focus:ring-2 focus:ring-[#b94826]/25 transition-all"
            />
          </Field>
          <Field label="Category">
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-9 rounded-lg border border-[#680318]/20 bg-[#fff7ec] text-sm text-[#680318] outline-none focus:border-[#b94826] focus:ring-2 focus:ring-[#b94826]/25 transition-all"
              >
                <option value="">— Select category —</option>
                {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#680318]/60 pointer-events-none" />
            </div>
          </Field>
        </section>

        <Field label={`Tags (${tags.length}/8)`}>
          <TagInput value={tags} onChange={setTags} />
        </Field>

        {/* ── Editor ───────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Label>Content</Label>
              <AIWritePanel
                title={title}
                existingHtml={content}
                onApply={(payload, mode) => {
                  if (mode === "continue") {
                    setContent(`${content}\n${payload.html}`);
                    return;
                  }
                  // Replace mode — fill every field the AI returned.
                  setContent(payload.html);
                  if (payload.title) setTitle(payload.title);
                  if (payload.subtitle) setSubtitle(payload.subtitle);
                  if (payload.category) setCategory(payload.category);
                  if (payload.tags && payload.tags.length > 0) setTags(payload.tags);
                  if (payload.meta_title) setMetaTitle(payload.meta_title);
                  if (payload.meta_description) setMetaDescription(payload.meta_description);
                  if (payload.meta_title || payload.meta_description) setSeoOpen(true);
                }}
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-[#680318]/60">
              <span>{wordCount.toLocaleString()} words</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {readingTime} min read</span>
            </div>
          </div>
          <BlogEditor value={content} onChange={setContent} />
        </div>

        {/* ── Publish options ─────────────────────────────────────────── */}
        <section className="rounded-xl border border-[#680318]/20 bg-[#fff7ec] p-5 space-y-4">
          <Label>Publish options</Label>
          <div role="radiogroup" className="grid sm:grid-cols-3 gap-2">
            {(["draft", "published", "scheduled"] as BlogStatus[]).map((opt) => (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={status === opt}
                onClick={() => setStatus(opt)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all border
                  ${status === opt
                    ? "border-[#b94826] bg-[#b94826]/10 text-[#680318]"
                    : "border-[#680318]/20 bg-[#fff0df] text-[#680318]/80 hover:border-[#b94826]/40"
                  }`}
              >
                <div className="capitalize font-semibold">{opt}</div>
                <div className="text-xs text-[#680318]/60 mt-0.5">
                  {opt === "draft" && "Keep private — only you can see it"}
                  {opt === "published" && "Visible to everyone immediately"}
                  {opt === "scheduled" && "Auto-publish at a chosen time"}
                </div>
              </button>
            ))}
          </div>

          {status === "scheduled" && (
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <Field label="Publish at">
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#680318]/20 bg-[#fff0df] text-sm text-[#680318] outline-none focus:border-[#b94826] focus:ring-2 focus:ring-[#b94826]/25"
                />
              </Field>
              <button
                type="button"
                onClick={handleSchedule}
                disabled={saving || !scheduledFor}
                className="px-4 h-9 rounded-lg text-sm font-semibold bg-[var(--accent)] text-[#fff0df] hover:bg-[#8f3318] disabled:opacity-50 transition-colors"
              >
                Schedule now
              </button>
            </div>
          )}
        </section>

        {/* ── SEO collapsible ─────────────────────────────────────────── */}
        <section className="rounded-xl border border-[#680318]/20 bg-[#fff7ec]">
          <button
            type="button"
            onClick={() => setSeoOpen((v) => !v)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#b94826]" />
              <span className="text-sm font-semibold text-[#680318]">SEO (optional)</span>
              <span className="text-xs text-[#680318]/60">— meta title and description</span>
            </div>
            {seoOpen ? <ChevronUp className="h-4 w-4 text-[#680318]/60" /> : <ChevronDown className="h-4 w-4 text-[#680318]/60" />}
          </button>
          {seoOpen && (
            <div className="px-5 pb-5 space-y-4">
              <Field label="Meta title" hint={`${metaTitle.length}/60`}>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={60}
                  placeholder={title || "Defaults to blog title"}
                  className="w-full px-3 py-2 rounded-lg border border-[#680318]/20 bg-[#fff0df] text-sm text-[#680318] outline-none focus:border-[#b94826] focus:ring-2 focus:ring-[#b94826]/25"
                />
              </Field>
              <Field label="Meta description" hint={`${metaDescription.length}/160`}>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder={subtitle || "Short summary shown in search results"}
                  className="w-full px-3 py-2 rounded-lg border border-[#680318]/20 bg-[#fff0df] text-sm text-[#680318] outline-none focus:border-[#b94826] focus:ring-2 focus:ring-[#b94826]/25 resize-y"
                />
              </Field>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-[11px] text-[#680318]/60">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#680318]/60">
      {children}
    </span>
  );
}

function SaveStatusLine({ saving, lastSavedAt, status }: { saving: boolean; lastSavedAt: Date | null; status: BlogStatus }) {
  const text = saving
    ? "Saving..."
    : lastSavedAt
      ? `Saved ${formatRelative(lastSavedAt)} · ${status}`
      : `Unsaved · ${status}`;
  return <p className="text-xs text-[#680318]/60 truncate">{text}</p>;
}

function formatRelative(d: Date): string {
  const diff = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
