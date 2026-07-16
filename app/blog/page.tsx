import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/blog";
import BlogExplorer from "@/components/blog/BlogExplorer";
import { SEED_BLOG_POSTS } from "@/lib/blog/seed";

export const metadata = {
  title: "Blog | LexRam",
  description: "Insights on legal technology, AI, and the future of law in India",
};

// Public blog index — opt out of the static cache so freshly-published posts
// show up immediately. (Without this, posts only appear after a redeploy.)
export const dynamic = "force-dynamic";
export const revalidate = 0;

// RLS filters: anon sees only `status='published'`; admins see drafts too.
// When the DB is empty (fresh install, un-run migrations, or a Supabase outage)
// we fall back to a static seed set so the page is never blank.
async function loadData(): Promise<{ posts: BlogPost[]; isAdmin: boolean }> {
  try {
    const sb = await createSupabaseServerClient();
    const [{ data: postsData }, { data: userData }] = await Promise.all([
      sb.from("blog_posts").select("*").order("published_at", { ascending: false, nullsFirst: false }),
      sb.auth.getUser(),
    ]);
    const isAdmin = (userData.user?.user_metadata as { role?: string } | null)?.role === "admin";
    const live = ((postsData ?? []) as BlogPost[]).map((p) => ({
      ...p,
      view_count: p.view_count ?? 0,
    }));
    if (live.length > 0) return { posts: live, isAdmin };
  } catch {
    /* fall through to seed */
  }
  return { posts: SEED_BLOG_POSTS, isAdmin: false };
}

export default async function BlogPage() {
  const { posts, isAdmin } = await loadData();
  return (
    <BlogExplorer posts={posts} isAdmin={isAdmin} />
  );
}
