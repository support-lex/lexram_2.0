"use client";

import { supabase } from "@/lib/supabase/client";
import type { BlogPost, BlogPostDraft, BlogStatus } from "@/types/blog";

const BUCKET = "blog-images";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 200));
}

async function ensureUniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const sb = supabase();
  let slug = base || "post";
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const { data, error } = await sb
      .from("blog_posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    if (!data || data.id === ignoreId) return candidate;
    attempt += 1;
    if (attempt > 100) throw new Error("Could not generate a unique slug");
  }
}

export async function listPosts(opts?: { includeDrafts?: boolean }): Promise<BlogPost[]> {
  const sb = supabase();
  let query = sb.from("blog_posts").select("*").order("published_at", { ascending: false, nullsFirst: false });
  if (!opts?.includeDrafts) query = query.eq("status", "published");
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BlogPost[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const sb = supabase();
  const { data, error } = await sb.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return (data ?? null) as BlogPost | null;
}

export async function createPost(draft: BlogPostDraft): Promise<BlogPost> {
  const sb = supabase();
  const baseSlug = draft.slug || slugify(draft.title);
  const slug = await ensureUniqueSlug(baseSlug);
  const status: BlogStatus = draft.status ?? "draft";
  const reading = draft.reading_time ?? calculateReadingTime(draft.content_html ?? "");

  const payload = {
    slug,
    title: draft.title,
    subtitle: draft.subtitle ?? null,
    cover_image_url: draft.cover_image_url ?? null,
    content_html: draft.content_html ?? "",
    category: draft.category ?? null,
    tags: draft.tags ?? [],
    status,
    scheduled_for: draft.scheduled_for ?? null,
    reading_time: reading,
    meta_title: draft.meta_title ?? null,
    meta_description: draft.meta_description ?? null,
    author_id: draft.author_id ?? null,
    author_name: draft.author_name ?? null,
    published_at: status === "published" ? new Date().toISOString() : null,
  };

  const { data, error } = await sb.from("blog_posts").insert(payload).select("*").single();
  if (error) throw error;
  return data as BlogPost;
}

export async function updatePost(id: string, patch: Partial<BlogPostDraft>): Promise<BlogPost> {
  const sb = supabase();
  const next: Record<string, unknown> = { ...patch };

  if (patch.content_html !== undefined) {
    next.reading_time = patch.reading_time ?? calculateReadingTime(patch.content_html);
  }
  if (patch.status === "published") {
    const { data: existing } = await sb.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
    if (!existing?.published_at) next.published_at = new Date().toISOString();
  }
  if (patch.title && !patch.slug) {
    next.slug = await ensureUniqueSlug(slugify(patch.title), id);
  }

  const { data, error } = await sb.from("blog_posts").update(next).eq("id", id).select("*").single();
  if (error) throw error;
  return data as BlogPost;
}

export async function deletePost(id: string): Promise<void> {
  const sb = supabase();
  const { error } = await sb.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadBlogImage(file: File, kind: "cover" | "inline" = "inline"): Promise<string> {
  const sb = supabase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
