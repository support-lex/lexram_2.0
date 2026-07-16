import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo/site";
import { howToJsonLd, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import PageLayout from "@/components/layout/PageLayout";

const URL = `${SITE_URL}/practice/bail-application-drafting`;
const TITLE = "Bail application drafting under Section 480 BNSS — LexRam";
const DESCRIPTION =
  "How Indian advocates draft a court-ready bail application under Section 480 BNSS using LexRam's AI — with verified Supreme Court citations, structure, and sample.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  keywords: [
    "bail application drafting",
    "Section 480 BNSS",
    "BNSS bail application",
    "AI bail drafting India",
    "LexRam bail draft",
    "bail application Supreme Court citations",
  ],
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, type: "article" },
};

const STEPS = [
  { name: "Open the Drafting module", text: "Sign in to LexRam and open Drafting → New bail application." },
  { name: "Upload the case file", text: "Upload the FIR, charge sheet, and prior orders (PDF / DOCX). LexRam OCRs and indexes them." },
  { name: "Pick the statutory hook", text: "Choose Section 480 BNSS (bail for bailable offences) or 482 (cancellation of bail). LexRam pre-fills grounds." },
  { name: "Generate the draft", text: "LexRam drafts a structured bail application — facts, grounds, prayer — grounded in your uploaded documents and verified SC paragraphs." },
  { name: "Review the citations", text: "Each cited paragraph has a live link to the SC judgment. Click to verify the ratio before signing." },
  { name: "Export", text: "Export the final draft to PDF or DOCX, sign, and file." },
];

const FAQS = [
  { question: "Which section of BNSS covers bail?", answer: "Section 480 (bailable offences), Section 482 (cancellation of bail), and Section 483 (anticipatory bail)." },
  { question: "Does LexRam cite real Supreme Court judgments?", answer: "Yes. Every citation is linked to the actual SC paragraph; the citation cannot be invented by the model." },
  { question: "Is the draft court-ready?", answer: "LexRam drafts follow the structure Indian courts accept; the advocate must review and personalise before filing." },
  { question: "How long does it take?", answer: "A first draft is generated in under 90 seconds from the time the case file is uploaded." },
];

export default function Page() {
  return (
    <>
      <JsonLd
        id="ld-howto"
        data={howToJsonLd({
          name: "How to draft a bail application under Section 480 BNSS",
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
          { name: "Practice", href: "/practice/bail-application-drafting" },
          { name: "Bail drafting", href: "/practice/bail-application-drafting" },
        ]}
      />
      <PageLayout>
        <article className="max-w-3xl mx-auto py-12 px-4 prose prose-lg">
          <h1>Bail application drafting under Section 480 BNSS</h1>
          <p>
            Section 480 of the Bharatiya Nagarik Suraksha Sanhita, 2023 governs bail in
            bailable offences. A well-drafted bail application cites the relevant SC
            precedents, lays out the facts concisely, and proposes clear grounds. LexRam
            produces that draft in under two minutes from your case file.
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
              Start a free bail draft →
            </Link>
          </p>
        </article>
      </PageLayout>
    </>
  );
}
