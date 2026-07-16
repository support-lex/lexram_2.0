import type { Metadata } from "next";
import { SITE_URL, SITE_LOCALE } from "@/lib/seo/site";
import { FAQS } from "@/lib/seo/faqs";
import { faqJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import FAQClient from "./FAQClient";

const PAGE_URL = `${SITE_URL}/faq`;

export const metadata: Metadata = {
  title: "LexRam FAQ — AI legal research & petition drafting for Indian advocates",
  description:
    "Answers to common questions about LexRam's AI legal research, petition drafting, BNS / BNSS coverage, pricing, security, refunds, and how Indian advocates use it.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "LexRam FAQ",
    description: "Common questions about LexRam's AI legal research and drafting.",
    url: PAGE_URL,
    siteName: "LexRam",
    locale: SITE_LOCALE,
    type: "website",
  },
  keywords: [
    "LexRam FAQ",
    "AI legal research India FAQ",
    "petition drafting software FAQ",
    "BNS BNSS research tool questions",
    "LexRam pricing",
    "LexRam refund policy",
  ],
};

export default function FAQPage() {
  return (
    <>
      <JsonLd id="ld-faq" data={faqJsonLd(FAQS, PAGE_URL)} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "FAQ", href: "/faq" }]} />
      <FAQClient faqs={FAQS} />
    </>
  );
}
