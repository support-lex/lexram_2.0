import type { Metadata, Viewport } from 'next';
import { Libre_Baskerville, Geist, Geist_Mono, Cormorant_Garamond, Playfair_Display, DM_Sans } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query-provider";
import { ScrollSystem } from "@/components/scroll-system";

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
  weight: ['300', '400', '500', '600', '700'],
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

// DM Sans — body sans for the landing page
const dmSans = DM_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-landing-sans',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://lexram.ai'),
  title: {
    default: 'LexRam — AI Legal Research & Petition Drafting for Indian Advocates',
    template: '%s | LexRam Legal AI',
  },
  description:
    "India's legal AI platform for petition drafting and Supreme Court precedent research. Decompose judgements into points of law, retrieve verified citations, draft bail applications, writ petitions, and legal notices. Free trial. Built for Indian advocates — every area of law, every level of court.",
  keywords: [
    'legal AI India',
    'AI legal research India',
    'petition drafting AI',
    'Supreme Court precedent mapping',
    'bail application drafting software',
    'writ petition drafting India',
    'BNS BNSS legal research',
    'verified SC citation tool',
    'Indian Kanoon alternative',
    'Manupatra alternative',
    'SCC Online alternative',
    'CaseMine alternative',
    'BharatLaw alternative',
    'BNSS bail drafting Section 480',
    'writ petition Article 226 AI',
    'legal document analysis India',
    'title scrutiny report',
    'Indian advocate AI software',
    'legal drafting automation',
    'court petition generator',
  ],
  authors: [{ name: 'Ramasubramanian AI Software Private Limited', url: 'https://lexram.ai' }],
  creator: 'LexRam',
  publisher: 'Ramasubramanian AI Software Private Limited',
  category: 'Legal Technology',
  classification: 'Legal AI Software for Indian Advocates',
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: true, email: true, address: true },
  alternates: {
    canonical: 'https://lexram.ai',
    languages: {
      'en-IN': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    title: 'LexRam — AI Legal Research & Petition Drafting for Indian Advocates',
    description:
      "India's legal AI platform for petition drafting and SC precedent research. Verified citations. Bail applications, writs, notices. Free trial.",
    url: 'https://lexram.ai',
    siteName: 'LexRam',
    type: 'website',
    locale: 'en_IN',
    countryName: 'India',
    emails: ['support@lexram.ai'],
    phoneNumbers: ['+918754446066'],
    images: [
      {
        url: '/landing/og-default.png',
        width: 1200,
        height: 630,
        alt: 'LexRam — AI legal research and petition drafting platform for Indian advocates',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lexramai',
    creator: '@lexramai',
    title: 'LexRam — AI Legal Research for Indian Advocates',
    description:
      'Legal AI for Indian advocates. SC precedent research, petition drafting, verified citations. Never a hallucination.',
    images: [
      {
        url: '/landing/og-default.png',
        alt: 'LexRam — AI legal research and petition drafting platform',
        width: 1200,
        height: 630,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={cn("scroll-smooth", "h-full", geist.variable, geistMono.variable, libreBaskerville.variable, cormorant.variable, playfair.variable, dmSans.variable, "font-sans")} suppressHydrationWarning>
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
        {/* ── JSON-LD Structured Data ─────────────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Ramasubramanian AI Software Private Limited',
              brand: { '@type': 'Brand', name: 'LexRam' },
              url: 'https://lexram.ai',
              logo: 'https://lexram.ai/landing/lexram-logo.png',
              foundingDate: '2024',
              description:
                'AI-powered legal research and petition drafting platform for Indian advocates. Built on the Supreme Court of India judgement corpus.',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Chennai',
                addressRegion: 'Tamil Nadu',
                addressCountry: 'IN',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: 'support@lexram.ai',
                telephone: '+918754446066',
                areaServed: 'IN',
                availableLanguage: ['English'],
              },
              sameAs: [
                'https://www.linkedin.com/company/lexramai',
                'https://twitter.com/lexramai',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'LexRam',
              url: 'https://lexram.ai',
              inLanguage: 'en-IN',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://lexram.ai/dashboard/research-2?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'LexRam',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              url: 'https://lexram.ai',
              description:
                'AI legal research and petition drafting platform for Indian advocates. Decomposes Supreme Court judgements into points of law, maps precedent chains, and generates court-ready petitions with verified citations.',
              featureList: [
                'Point-of-law analysis from SC judgements',
                'Supreme Court precedent mapping',
                'Bail application drafting (S.480/482/483 BNSS)',
                'Writ petition drafting (Art. 226)',
                'Verified in-line SC citations with live links',
                'Petition drafting grounded in real SC paragraphs',
                'BNS / BNSS / BSA bare-act lookup',
                'Anti-hallucination citation verification',
                'Title Scrutiny Report generation',
                'Legal document analysis',
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '47',
                bestRating: '5',
                worstRating: '1',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR',
                name: 'Free Trial',
                availability: 'https://schema.org/InStock',
                url: 'https://lexram.ai/sign-in',
              },
              countryOfOrigin: 'IN',
            }),
          }}
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
        <ScrollSystem />
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster position="top-right" richColors />
      </body>
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  );
}
