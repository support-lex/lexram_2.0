export type BlogStatus = "draft" | "published" | "scheduled";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  content_html: string;
  category: string | null;
  tags: string[];
  status: BlogStatus;
  scheduled_for: string | null;
  reading_time: number | null;
  meta_title: string | null;
  meta_description: string | null;
  author_id: string | null;
  author_name: string | null;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export type BlogPostDraft = Partial<Omit<BlogPost, "id" | "created_at" | "updated_at">> & {
  title: string;
};

export const BLOG_CATEGORIES = [
  "Technology",
  "Research",
  "Analysis",
  "Compliance",
  "Practice",
  "News",
  "Opinion",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
