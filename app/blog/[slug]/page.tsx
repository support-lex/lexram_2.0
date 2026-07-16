import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, CalendarDays, Eye } from "lucide-react";
import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/blog";
import BlogActions from "./BlogActions";
import CommentsSection from "@/components/blog/CommentsSection";
import { LeftSidebar, RightSidebar } from "@/components/blog/PostSidebars";
import { SITE_URL, DEFAULT_OG } from "@/lib/seo/site";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";



interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchPost(slug: string): Promise<BlogPost | null> {
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  if (error && error.code !== "PGRST116") return null;
  return (data ?? null) as BlogPost | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Blog post not found" };
  const url = `${SITE_URL}/blog/${slug}`;
  return {
    title: post.meta_title || `${post.title} | LexRam`,
    description: post.meta_description || post.subtitle || undefined,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.meta_description || post.subtitle || undefined,
      url,
      images: post.cover_image_url ? [post.cover_image_url] : [DEFAULT_OG],
      type: "article",
      publishedTime: post.published_at ?? undefined,
      authors: post.author_name ? [post.author_name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description || post.subtitle || undefined,
      images: post.cover_image_url ? [post.cover_image_url] : [DEFAULT_OG],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  if (post.status === "published") {
    const sb = await createSupabaseServerClient();
    void sb.rpc("increment_blog_view", { p_slug: slug });
  }

  const isDraft = post.status !== "published";
  const publishDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);

  return (
    <article className="bg-[#fff0df] pb-24">
      <JsonLd
        id="ld-blogposting"
        data={blogPostingJsonLd({
          title: post.title,
          description: post.meta_description || post.subtitle || post.title,
          slug,
          image: post.cover_image_url ?? undefined,
          authorName: post.author_name || "LexRam Editorial",
          datePublished: publishDate.toISOString(),
          dateModified: post.updated_at
            ? new Date(post.updated_at).toISOString()
            : undefined,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${slug}` },
        ]}
      />
      {/* Hero cover card — same design language as the blog carousel */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 max-w-[1400px] mx-auto">
        <div
          className="relative rounded-2xl overflow-hidden border border-[#680318]/15 shadow-md bg-[#2a1a1c]"
          style={{ height: post.cover_image_url ? "calc(100vh - 100px)" : "clamp(260px, 38vh, 420px)" }}
        >
          {/* Image or gradient fallback */}
          {post.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#3a0d18] via-[#680318] to-[#b94826]" />
          )}

          {/* Gradient overlay — stronger at bottom for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" />

          {/* Top bar: back button + category + draft badge */}
          <div className="absolute top-5 left-5 right-5 flex items-start justify-between gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium bg-black/30 backdrop-blur-sm border border-white/20 text-white hover:bg-black/50 transition-colors shadow-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {post.category && (
                <span className="inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-full bg-[#b94826]/80 text-white backdrop-blur-sm">
                  {post.category}
                </span>
              )}
              {isDraft && (
                <span className="inline-flex items-center px-3 h-7 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/80 text-white backdrop-blur-sm">
                  {post.status === "scheduled" ? "Scheduled" : "Draft"}
                </span>
              )}
            </div>
          </div>

          {/* Bottom: title + subtitle + meta */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight text-white max-w-3xl">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="mt-2 text-lg text-white/80 leading-relaxed max-w-2xl">
                {post.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-white/70">
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <div className="grid place-items-center h-7 w-7 rounded-full bg-[#b94826]/80 text-white text-xs font-semibold shrink-0">
                    {initials(post.author_name)}
                  </div>
                  <span className="text-white font-medium">{post.author_name}</span>
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
          </div>
        </div>
      </div>

      {/* Article body — 3-column layout with product sidebars */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[300px_1fr_300px] gap-8 xl:gap-10 items-start">

          <LeftSidebar />

          {/* Main content */}
          <div className="min-w-0">
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

            {/* Sticky action bar */}
            <div className="sticky bottom-4 z-20 mt-12 flex justify-center">
              <div className="rounded-full bg-[#fff7ec]/90 backdrop-blur shadow-lg border border-[#680318]/15 px-2 py-1">
                <BlogActions title={post.title} initialLikes={0} />
              </div>
            </div>

            <CommentsSection slug={slug} />
          </div>

          <RightSidebar />
        </div>
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