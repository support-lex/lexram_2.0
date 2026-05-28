import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/blog";
import BlogExplorer from "@/components/blog/BlogExplorer";



export const metadata = {
  title: "Blog | LexRam",
  description: "Insights on legal technology, AI, and the future of law in India",
};

// Always fetch fresh — a blog created from research (or edited in another
// tab) needs to appear here on the next navigation, not the next deploy.
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
  // Dashboard layout's <main> is overflow-hidden — wrap so the blog list
  // can scroll on its own. (The public /blog page renders the same explorer
  // inside <PageLayout>, which already provides page-level scroll.)
  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-primary)]">
      <BlogExplorer posts={posts} isAdmin={isAdmin} />
    </div>
  );
}
