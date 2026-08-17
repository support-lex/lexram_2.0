import Link from "next/link";
import { Scale, LucideIcon } from "lucide-react";

interface SimplePageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  showLastUpdated?: boolean;
  lastUpdated?: string;
}

export default function SimplePageLayout({
  children,
  title,
  description,
  icon: Icon,
  showLastUpdated = false,
  lastUpdated = "March 2025",
}: SimplePageLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-sidebar)] border-b border-[var(--bg-sidebar-hover)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-white">
            <Scale className="w-6 h-6 text-[var(--accent)]" />
            <span className="font-serif font-bold text-xl">LexRam</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {title && (
          <div className={Icon ? "flex items-center gap-4 mb-8" : "mb-8"}>
            {Icon && <Icon className="w-10 h-10 text-[var(--accent)]" />}
            <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)]">
              {title}
            </h1>
          </div>
        )}

        {description && (
          <p className="text-xl text-[var(--text-secondary)] mb-8">{description}</p>
        )}

        <div className="prose prose-lg max-w-none text-[var(--text-secondary)]">
          {showLastUpdated && (
            <p className="text-sm text-[var(--text-muted)] mb-8">Last updated: {lastUpdated}</p>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--bg-sidebar)] text-[var(--text-muted)] py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} LexRam Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
