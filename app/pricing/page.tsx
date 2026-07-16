import type { Metadata } from "next";
import PricingSection from "@/components/PricingSection";
import { LandingNav, LandingFooter } from "@/components/LandingShell";
import { PageSidebarNav } from "@/components/page-sidebar-nav";

export const metadata: Metadata = {
  title: "Pricing | LexRam — Pay only for what you use",
  description:
    "Buy credits only when you need them. Top-Up at ₹999 for 10,000 credits (~100 research queries or ~40 AI-assisted drafts). Chamber Bulk ₹4,499 for 50,000 credits with team sharing and dedicated account manager.",
  keywords: [
    "LexRam pricing",
    "legal AI pricing India",
    "advocate AI subscription India",
    "credit-based legal research pricing",
    "pay-as-you-go legal AI",
  ],
  alternates: {
    canonical: "https://lexram.ai/pricing",
  },
  openGraph: {
    title: "Pricing | LexRam",
    description:
      "Pay only for what you use. No subscriptions, no monthly fees. Buy credits when you need them.",
    url: "https://lexram.ai/pricing",
    siteName: "LexRam",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/landing/og-default.png",
        width: 1200,
        height: 630,
        alt: "LexRam pricing — pay only for what you use",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | LexRam",
    description: "Top-Up ₹999 / 10,000 credits. Chamber Bulk ₹4,499 / 50,000 credits. No subscriptions.",
    images: ["/landing/og-default.png"],
  },
  robots: { index: true, follow: true },
};

export default function PricingPage() {
  return (
    <div data-landing-v2 className="min-h-screen bg-[#d8cdb8]">
      <PageSidebarNav items={[
        { id: "products",     icon: "products",    label: "Products", href: "/#products"   },
        { id: "research",     icon: "research",    label: "Research", href: "/#research"   },
        { id: "drafting",     icon: "drafting",    label: "Drafting", href: "/#drafting"   },
        { id: "compare",      icon: "compare",     label: "Compare",  href: "/#compare"   },
        { id: "testimonials", icon: "testimonials", label: "Reviews",  href: "/#testimonials" },
        { id: "faq",          icon: "faq",         label: "FAQ",      href: "/#faq"       },
        { id: "contact",      icon: "contact",     label: "Contact",  href: "/#contact"   },
      ]} />
      <LandingNav />
      <main className="pt-16">
        <PricingSection showHeader={false} />
      </main>
      <LandingFooter />
    </div>
  );
}
