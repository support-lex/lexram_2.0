import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo/site";
import { howToJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import PageLayout from "@/components/layout/PageLayout";

const URL = `${SITE_URL}/practice/legal-notice-drafting`;
const TITLE = "Legal notice drafting for Indian advocates — LexRam";
const DESCRIPTION =
  "Draft a legally sound Indian legal notice in minutes with LexRam's AI — correct parties, cause of action, and reliefs grounded in statute and case law.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  keywords: ["legal notice drafting", "Indian legal notice format", "AI legal notice India", "LexRam legal notice"],
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, type: "article" },
};

const STEPS = [
  { name: "Pick the notice type", text: "Cheque-bounce, breach of contract, eviction, defamation, consumer — LexRam picks the right statutory and case-law hooks." },
  { name: "Enter the parties and facts", text: "Sender, recipient, dates, amounts, and the dispute chronology." },
  { name: "Generate the draft", text: "LexRam produces a notice with the correct cause-title, recitals, demands, and a 15 / 30 / 60-day compliance window." },
  { name: "Verify and export", text: "Review the cited sections and precedents; export to PDF / DOCX; serve via registered post / email." },
];

const FAQS = [
  { question: "Is a legal notice mandatory before a suit?", answer: "Mandatory in several statutes (e.g. Section 80 CPC for suits against the Government, Section 21 of the Arbitration Act, NI Act s.138)." },
  { question: "How long is the compliance period?", answer: "Commonly 15, 30, or 60 days — LexRam suggests the appropriate window for the chosen cause." },
  { question: "Can the notice be sent digitally?", answer: "Yes, but the original should still be dispatched by registered post / speed post to fix the date of service." },
];

export default function Page() {
  return (
    <>
      <JsonLd
        id="ld-howto"
        data={howToJsonLd({
          name: "How to draft an Indian legal notice",
          description: DESCRIPTION,
          totalTime: "PT2M",
          steps: STEPS,
          pageUrl: URL,
        })}
      />
      <JsonLd id="ld-faq" data={faqJsonLd(FAQS, URL)} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Practice", href: "/practice/legal-notice-drafting" },
          { name: "Legal notice", href: "/practice/legal-notice-drafting" },
        ]}
      />
      <PageLayout>
        <article className="max-w-3xl mx-auto py-12 px-4 prose prose-lg">
          <h1>Legal notice drafting for Indian advocates</h1>
          <p>
            A legal notice is the formal starting gun of most Indian civil disputes.
            LexRam drafts notices that follow the structure Indian courts expect, name
            the correct parties, and ground the claim in the right statute and case law.
          </p>
          <h2>Steps</h2>
          <ol>
            {STEPS.map((s, i) => (
              <li key={i}>
                <strong>{s.name}.</strong> {s.text}
              </li>
            ))}
          </ol>
          <h2>Frequently asked questions</h2>
          {FAQS.map((f, i) => (
            <div key={i}>
              <h3>{f.question}</h3>
              <p>{f.answer}</p>
            </div>
          ))}
          <p>
            <Link href="/sign-in?intent=signup" className="text-[#b94826] font-semibold">
              Draft a free legal notice →
            </Link>
          </p>
        </article>
      </PageLayout>
    </>
  );
}
