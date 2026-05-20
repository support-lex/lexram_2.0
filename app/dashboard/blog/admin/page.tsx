import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/blog";
import AdminBlogTable from "@/components/blog/AdminBlogTable";

import "../blog.css";

export const metadata = {
  title: "Blog admin | LexRam",
};

// Server component — must opt out of Next.js's static cache so a blog
// created/edited from another tab (or from the research page's Make Blog
// button) shows up on the admin list immediately, not after a redeploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBlogPage() {
  const sb = await createSupabaseServerClient();
  const { data: userData } = await sb.auth.getUser();
  const role = (userData.user?.user_metadata as { role?: string } | null)?.role;
  if (role !== "admin") redirect("/dashboard/blog");

  const { data } = await sb
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  return <AdminBlogTable initialPosts={(data ?? []) as BlogPost[]} />;
}
