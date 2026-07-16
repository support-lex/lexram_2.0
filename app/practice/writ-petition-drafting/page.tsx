import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo/site";
import { howToJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import PageLayout from "@/components/layout/PageLayout";

const URL = `${SITE_URL}/practice/writ-petition-drafting`;
const TITLE = "Writ petition drafting under Article 226 — LexRam";
const DESCRIPTION =
  "Draft a High Court writ petition under Article 226 of the Constitution using LexRam's AI — verified SC citations, structure, and sample.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  keywords: ["writ petition drafting", "Article 226", "AI writ petition India", "LexRam writ draft", "High Court writ AI"],
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, type: "article" },
};

const STEPS = [
  { name: "Choose the writ", text: "Certiorari, mandamus, prohibition, quo warranto, or habeas corpus — LexRam tailors grounds to the writ you pick." },
  { name: "Identify the respondent", text: "State, statutory body, or person — LexRam aligns the cause-title and array of respondents." },
  { name: "State the facts and cause of action", text: "Upload the impugned order and supporting pleadings; LexRam extracts the chronology." },
  { name: "Map the SC precedent chain", text: "LexRam surfaces the controlling SC decisions on the chosen writ, jurisdiction, and limitation." },
  { name: "Draft and verify", text: "Generate the petition, click every citation to verify it, then export." },
  { name: "File", text: "Print, sign, and file in the appropriate High Court." },
];

const FAQS = [
  { question: "What is the limitation for a writ?", answer: "Generally no fixed limitation, but the petition must be filed within a reasonable time — usually 90 days from the impugned order." },
  { question: "Which court do I approach?", answer: "Article 226 → High Court having territorial jurisdiction. Article 32 → Supreme Court." },
  { question: "Can LexRam draft both?", answer: "Yes, LexRam covers both Article 226 (High Court) and Article 32 (Supreme Court) writs." },
  { question: "Are the citations real?", answer: "Yes, every citation is linked to the actual SC paragraph. LexRam's anti-hallucination layer prevents fabricated judgments." },
];

export default function Page() {
  return (
    <>
      <JsonLd
        id="ld-howto"
        data={howToJsonLd({
          name: "How to draft a writ petition under Article 226",
          description: DESCRIPTION,
          totalTime: "PT3M",
          steps: STEPS,
          pageUrl: URL,
        })}
      />
      <JsonLd id="ld-faq" data={faqJsonLd(FAQS, URL)} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Practice", href: "/practice/writ-petition-drafting" },
          { name: "Writ drafting", href: "/practice/writ-petition-drafting" },
        ]}
      />
      <PageLayout>
        <article className="max-w-3xl mx-auto py-12 px-4 prose prose-lg">
          <h1>Writ petition drafting under Article 226</h1>
          <p>
            Article 226 of the Constitution empowers every High Court to issue writs
            for the enforcement of fundamental rights and "any other purpose". A
            well-drafted writ petition lays out a clear cause of action, names the
            correct respondents, and grounds every relief in cited precedent.
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
              Start a free writ draft →
            </Link>
          </p>
        </article>
      </PageLayout>
    </>
  );
}
