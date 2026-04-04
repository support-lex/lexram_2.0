import Link from "next/link";
import { Scale } from "lucide-react";

interface PageLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function PageLayout({ 
  children, 
  fullWidth = false 
}: PageLayoutProps) {
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
      <main className={fullWidth ? "" : "max-w-4xl mx-auto px-6 py-16"}>
        {children}
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
