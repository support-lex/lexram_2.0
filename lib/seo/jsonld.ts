import { SITE_URL, SITE_NAME } from "./site";

type JsonLdObject = Record<string, unknown>;

export function jsonLdScript(id: string, data: JsonLdObject) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    id,
  };
}

export function faqJsonLd(
  faqs: { question: string; answer: string }[],
  pageUrl: string
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: pageUrl,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function blogPostingJsonLd(post: {
  title: string;
  description: string;
  slug: string;
  image?: string;
  authorName: string;
  datePublished: string;
  dateModified?: string;
}): JsonLdObject {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": url,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: post.image ? [post.image] : [`${SITE_URL}/landing/og-default.png`],
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    author: {
      "@type": "Person",
      name: post.authorName,
      worksFor: { "@type": "Organization", name: SITE_NAME },
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/landing/lexram-logo.png` },
    },
  };
}

export function howToJsonLd(how: {
  name: string;
  description: string;
  totalTime?: string;
  steps: { name: string; text: string; url?: string }[];
  pageUrl: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${how.pageUrl}#howto`,
    name: how.name,
    description: how.description,
    totalTime: how.totalTime,
    step: how.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: s.url,
    })),
  };
}

export function productJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "LexRam Credits",
    description:
      "Pay-as-you-go credits for LexRam AI legal research and petition drafting.",
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "1999",
      highPrice: "24999",
      offerCount: 2,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/payment`,
    },
  };
}
