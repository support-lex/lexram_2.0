import type { Metadata } from 'next';
import { Libre_Baskerville, Geist, Geist_Mono, Cormorant_Garamond, Playfair_Display, Inter } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query-provider";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-serif',
});

// Cormorant Garamond — used by the prior editorial landing variant
const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-editorial',
});

// Playfair Display — display serif for the new cinematic landing page
const playfair = Playfair_Display({
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-landing-display',
});

// Inter — body sans for the landing page
const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-landing-sans',
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
    <html lang="en" className={cn("scroll-smooth", "h-full", geist.variable, geistMono.variable, libreBaskerville.variable, cormorant.variable, playfair.variable, inter.variable, "font-sans")} suppressHydrationWarning>
      <head>
        {/* Preconnect to the LexRam Legal Research API so the TLS handshake
            (~400–800 ms cold) overlaps with the page's initial paint instead
            of blocking the first /sessions call on the research screen. */}
        <link rel="preconnect" href="https://api.lexram.ai" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.lexram.ai" />
        {/* FontAwesome free CDN — required for mermaid fa: icon nodes */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
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
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster position="top-right" richColors />
      </body>
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  );
}
