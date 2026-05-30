import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, CalendarDays, Eye } from "lucide-react";
import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/blog";
import BlogActions from "./BlogActions";



interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchPost(slug: string): Promise<BlogPost | null> {
  // RLS handles visibility: anon sees only `status = 'published'`, admins see everything.
  // So a draft will only resolve if the requester is an authenticated admin.
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  if (error && error.code !== "PGRST116") return null;
  return (data ?? null) as BlogPost | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Blog post not found" };
  return {
    title: post.meta_title || `${post.title} | LexRam`,
    description: post.meta_description || post.subtitle || undefined,
    openGraph: {
      title: post.title,
      description: post.meta_description || post.subtitle || undefined,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      authors: post.author_name ? [post.author_name] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  // Bump view count on published posts. Errors are swallowed so a counter
  // hiccup never breaks the read experience.
  if (post.status === "published") {
    const sb = await createSupabaseServerClient();
    void sb.rpc("increment_blog_view", { p_slug: slug });
  }

  const isDraft = post.status !== "published";
  const publishDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);

  return (
    <article className="bg-[#fff0df] pb-24">
      {/* Cover */}
      {post.cover_image_url && (
        <div className="relative w-full h-[280px] sm:h-[420px] md:h-[520px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[var(--bg-primary)]" aria-hidden />
        </div>
      )}

      <div className={`max-w-3xl mx-auto px-4 sm:px-6 ${post.cover_image_url ? "-mt-16 sm:-mt-24 relative" : "pt-10"}`}>
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium bg-[#fff7ec]/90 backdrop-blur border border-[#680318]/15 text-[#680318] hover:text-[#680318] transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          {isDraft && (
            <span className="inline-flex items-center px-3 h-7 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#fff0df] text-[#680318] border border-[#b94826]/40">
              {post.status === "scheduled" ? "Scheduled" : "Draft preview"}
            </span>
          )}
        </div>

        {/* Header */}
        <header className="mb-10 space-y-4">
          {post.category && (
            <div>
              <span className="inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-full bg-[#b94826]/10 text-[#b94826]">
                {post.category}
              </span>
            </div>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight text-[#680318]">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="text-lg sm:text-xl text-[#680318] leading-relaxed">
              {post.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm text-[#680318]/60">
            {post.author_name && (
              <div className="flex items-center gap-2">
                <div className="grid place-items-center h-8 w-8 rounded-full bg-[#b94826]/15 text-[#b94826] text-xs font-semibold">
                  {initials(post.author_name)}
                </div>
                <span className="text-[#680318] font-medium">{post.author_name}</span>
              </div>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {publishDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </span>
            {post.reading_time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {post.reading_time} min read
              </span>
            )}
            {post.status === "published" && (
              <span className="inline-flex items-center gap-1.5" title={`${(post.view_count ?? 0).toLocaleString()} views`}>
                <Eye className="h-3.5 w-3.5" /> {formatViews(post.view_count ?? 0)}
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <div
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: post.content_html || "" }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-[#fff7ec] border border-[#680318]/15 text-[#680318]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Sticky-ish action bar */}
        <div className="sticky bottom-4 z-20 mt-12 flex justify-center">
          <div className="rounded-full bg-[#fff7ec]/90 backdrop-blur shadow-lg border border-[#680318]/15 px-2 py-1">
            <BlogActions title={post.title} initialLikes={0} />
          </div>
        </div>

        {/* Comments placeholder */}
        <section id="comments" className="mt-16 pt-10 border-t border-[#680318]/15">
          <h2 className="font-serif text-2xl font-bold text-[#680318] mb-4">Comments</h2>
          <div className="rounded-xl border border-dashed border-[#680318]/15 bg-[#fff7ec] p-8 text-center text-sm text-[#680318]/60">
            Comments are coming soon. In the meantime, share your thoughts on social.
          </div>
        </section>
      </div>
    </article>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "•";
}

function formatViews(n: number): string {
  if (n < 1_000) return `${n} ${n === 1 ? "view" : "views"}`;
  if (n < 1_000_000) return `${(n / 1_000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k views`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
}
