import PageLayout from "@/components/layout/PageLayout";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Blog | LexRam",
  description: "Insights on legal technology, AI, and the future of law in India",
};

interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  category: string;
}

const posts: BlogPost[] = [
  {
    title: "The Future of Legal AI in India",
    excerpt: "Exploring how artificial intelligence is transforming the legal landscape for Indian advocates.",
    date: "March 2025",
    category: "Technology",
  },
  {
    title: "Best Practices for Legal Research",
    excerpt: "Tips and strategies to enhance your legal research efficiency and accuracy.",
    date: "February 2025",
    category: "Research",
  },
  {
    title: "Understanding Recent Supreme Court Judgments",
    excerpt: "Key takeaways from landmark decisions that are shaping Indian jurisprudence.",
    date: "January 2025",
    category: "Analysis",
  },
];

export default function BlogPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <BookOpen className="w-16 h-16 text-[var(--accent)] mx-auto mb-6" />
          <h1 className="font-serif text-4xl font-serif font-bold text-[var(--text-primary)] mb-4">
            LexRam Blog
          </h1>
          <p className="text-xl text-[var(--text-secondary)]">
            Insights on legal technology and the future of law
          </p>
        </div>
        
        <div className="space-y-8">
          {posts.map((post, index) => (
            <article 
              key={index} 
              className="p-6 bg-white rounded-lg shadow-sm border border-[var(--border-default)] hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] rounded-full">
                  {post.category}
                </span>
                <span className="text-sm text-[var(--text-muted)]">{post.date}</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-[var(--text-primary)] mb-2">
                {post.title}
              </h2>
              <p className="text-[var(--text-secondary)]">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
