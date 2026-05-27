import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/blog";
import AdminBlogTable from "@/components/blog/AdminBlogTable";



export const metadata = {
  title: "Blog admin | LexRam",
};

export default async function AdminBlogPage() {
  const sb = await createSupabaseServerClient();
  const { data: userData } = await sb.auth.getUser();
  const role = (userData.user?.user_metadata as { role?: string } | null)?.role;
  if (role !== "admin") redirect("/blog");

  const { data } = await sb
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  return <AdminBlogTable initialPosts={(data ?? []) as BlogPost[]} />;
}
