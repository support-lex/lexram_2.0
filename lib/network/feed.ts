"use client";

import { supabase } from "@/lib/supabase/client";
import type { NetworkPost, PostComment, PostMediaType } from "@/types/network";

async function hydrateAuthors<T extends { author_id: string }>(rows: T[]): Promise<
  Array<T & { author: { id: string; display_name: string; headline: string; avatar_url: string | null } | null }>
> {
  if (!rows.length) return [];
  const ids = Array.from(new Set(rows.map((r) => r.author_id)));
  const { data } = await supabase()
    .from("network_profiles")
    .select("id, display_name, headline, avatar_url")
    .in("id", ids);
  const map = new Map((data ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, author: map.get(r.author_id) ?? null }));
}

export async function listFeed(currentUserId: string | null, limit = 50): Promise<NetworkPost[]> {
  const sb = supabase();
  const { data, error } = await sb
    .from("network_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const hydrated = await hydrateAuthors((data ?? []) as NetworkPost[]);

  // Mark posts liked / reposted by current user.
  if (currentUserId && hydrated.length) {
    const ids = hydrated.map((p) => p.id);
    const [{ data: likes }, { data: reposts }] = await Promise.all([
      sb.from("network_post_likes").select("post_id").eq("user_id", currentUserId).in("post_id", ids),
      sb.from("network_post_reposts").select("post_id").eq("user_id", currentUserId).in("post_id", ids),
    ]);
    const likedSet = new Set((likes ?? []).map((l) => l.post_id));
    const repostedSet = new Set((reposts ?? []).map((r) => r.post_id));
    return hydrated.map((p) => ({
      ...p,
      liked_by_me: likedSet.has(p.id),
      reposted_by_me: repostedSet.has(p.id),
    }));
  }

  return hydrated;
}

export type CreatePostInput = {
  body: string;
  visibility?: "public" | "connections";
  title?: string | null;
  mediaUrl?: string | null;
  mediaType?: PostMediaType | null;
};

export async function createPost(
  authorId: string,
  input: CreatePostInput | string,
  /** Legacy positional arg — kept so older call sites with (id, body, vis) still compile. */
  legacyVisibility: "public" | "connections" = "public",
): Promise<NetworkPost> {
  const opts: CreatePostInput =
    typeof input === "string"
      ? { body: input, visibility: legacyVisibility }
      : input;
  const body = (opts.body ?? "").trim();
  const title = (opts.title ?? "").trim();
  if (!body && !title && !opts.mediaUrl) {
    throw new Error("Post is empty");
  }
  const row: Record<string, unknown> = {
    author_id: authorId,
    body,
    visibility: opts.visibility ?? "public",
  };
  if (title) row.title = title;
  if (opts.mediaUrl) row.media_url = opts.mediaUrl;
  if (opts.mediaType) row.media_type = opts.mediaType;
  const { data, error } = await supabase()
    .from("network_posts")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data as NetworkPost;
}

/** Upload a photo or video to the network-post-media bucket and return a
 *  public URL. The file is stored under `${userId}/${timestamp}-${name}`
 *  so the RLS policy can scope writes to the owner. */
export async function uploadPostMedia(
  userId: string,
  file: File,
): Promise<{ url: string; type: PostMediaType }> {
  const sb = supabase();
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) throw new Error("Only image or video files are supported");

  // Sanitize the original name so weird characters don't break the object path.
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
  const path = `${userId}/${Date.now()}-${safe}`;
  const { error } = await sb.storage
    .from("network-post-media")
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = sb.storage.from("network-post-media").getPublicUrl(path);
  return { url: data.publicUrl, type: isVideo ? "video" : "image" };
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase().from("network_posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function updatePost(postId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Post body is empty");
  const { error } = await supabase()
    .from("network_posts")
    .update({ body: trimmed })
    .eq("id", postId);
  if (error) throw error;
}

export async function likePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_post_likes")
    .insert({ post_id: postId, user_id: userId });
  // Ignore unique-violation if already liked.
  if (error && error.code !== "23505") throw error;
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function repost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_post_reposts")
    .insert({ post_id: postId, user_id: userId });
  if (error && error.code !== "23505") throw error;
}

export async function unrepost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_post_reposts")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function listComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase()
    .from("network_post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return hydrateAuthors((data ?? []) as PostComment[]) as Promise<PostComment[]>;
}

export async function addComment(
  postId: string,
  authorId: string,
  body: string,
): Promise<PostComment> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment body is empty");
  const { data, error } = await supabase()
    .from("network_post_comments")
    .insert({ post_id: postId, author_id: authorId, body: trimmed })
    .select("*")
    .single();
  if (error) throw error;
  return data as PostComment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase().from("network_post_comments").delete().eq("id", commentId);
  if (error) throw error;
}
