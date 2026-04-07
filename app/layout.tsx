import type { Metadata } from 'next';
import { Libre_Baskerville, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'LexRam | The Legal AI for Indian Advocates',
  description: 'Every area of law. Every level of court. One intelligent platform. AI-powered legal research, drafting, and document analysis for Indian advocates.',
  keywords: ['legal AI', 'Indian law', 'legal research', 'drafting', 'advocates', 'LexRam'],
  authors: [{ name: 'LexRam Technologies' }],
  openGraph: {
    title: 'LexRam | The Legal AI for Indian Advocates',
    description: 'AI-powered legal research, drafting, and document analysis for Indian advocates.',
    url: 'https://lexram.ai',
    siteName: 'LexRam',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LexRam | The Legal AI for Indian Advocates',
    description: 'AI-powered legal research, drafting, and document analysis.',
  },
  robots: 'index, follow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("scroll-smooth", "h-full", geist.variable, geistMono.variable, libreBaskerville.variable, "font-sans")} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('lexram_theme');
                // Default to 'classic' theme if no theme is set
                if (!theme) {
                  localStorage.setItem('lexram_theme', 'classic');
                  theme = 'classic';
                }
                if (theme && theme !== 'light') {
                  document.documentElement.setAttribute('data-theme', theme);
                }
              } catch(e) {}
            })();
          `
        }} />
      </head>
      <body className="font-sans antialiased h-full bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 transition-colors duration-300" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
