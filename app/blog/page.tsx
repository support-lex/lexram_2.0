import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/blog";
import BlogExplorer from "@/components/blog/BlogExplorer";

export const metadata = {
  title: "Blog | LexRam",
  description: "Insights on legal technology, AI, and the future of law in India",
};

// Public blog index — opt out of the static cache so freshly-published posts
// show up immediately. (Without this, posts only appear after a redeploy.)
export const dynamic = "force-dynamic";
export const revalidate = 0;

// RLS filters: anon sees only `status='published'`; admins see drafts too.
async function loadData(): Promise<{ posts: BlogPost[]; isAdmin: boolean }> {
  const sb = await createSupabaseServerClient();
  const [{ data: postsData }, { data: userData }] = await Promise.all([
    sb.from("blog_posts").select("*").order("published_at", { ascending: false, nullsFirst: false }),
    sb.auth.getUser(),
  ]);
  const isAdmin = (userData.user?.user_metadata as { role?: string } | null)?.role === "admin";
  return { posts: (postsData ?? []) as BlogPost[], isAdmin };
}

export default async function BlogPage() {
  const { posts, isAdmin } = await loadData();
  return (
    <BlogExplorer posts={posts} isAdmin={isAdmin} />
  );
}
