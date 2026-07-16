import type { Metadata } from "next";
import Link from "next/link";
import { LandingNav, LandingFooter } from "@/components/LandingShell";
import { ArrowRight, FileSearch, ShieldCheck, GitBranch, BadgeCheck, Clock, Layers, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Title Scrutiny Report (TSR) | LexRam — Bank-ready reports in hours",
  description:
    "Upload a property file. LexRam maps the full ownership chain, flags encumbrances, and delivers a bank-ready Title Scrutiny Report with verifiable citations.",
  keywords: [
    "title scrutiny report India",
    "TSR software India",
    "property title search AI",
    "bank-ready title report",
    "encumbrance certificate AI",
    "ownership chain mapping",
  ],
  alternates: { canonical: "https://lexram.ai/tsr" },
  openGraph: {
    title: "Title Scrutiny Report (TSR) | LexRam",
    description: "Bank-ready Title Scrutiny Reports — full ownership chain, encumbrance detection, verifiable citations.",
    url: "https://lexram.ai/tsr",
    siteName: "LexRam",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Title Scrutiny Report (TSR) | LexRam",
    description: "Map ownership chains and surface encumbrances — bank-ready in hours.",
  },
  robots: { index: true, follow: true },
};

const FEATURES = [
  {
    icon: GitBranch,
    title: "Full ownership-chain mapping",
    desc: "Traces the chain of title through every sale, gift, inheritance, partition and release — across sub-registrar records.",
  },
  {
    icon: ShieldCheck,
    title: "Encumbrance & lien detection",
    desc: "Flags mortgages, charges, attachments, lis-pendens and family-settlement caveats that survive the transaction.",
  },
  {
    icon: BadgeCheck,
    title: "Bank-ready report format",
    desc: "Outputs the report in the structure lenders expect — schedule of documents, observations, opinion, and caveats.",
  },
  {
    icon: FileSearch,
    title: "Source-linked citations",
    desc: "Every claim is tied to a specific document and page — nothing assumed, everything verifiable.",
  },
  {
    icon: Clock,
    title: "From days to hours",
    desc: "A typical 30-year chain that takes a manual reviewer 2–3 days completes in a single working session.",
  },
  {
    icon: Layers,
    title: "Works on scanned files",
    desc: "Reads PDFs, scans, registered photo-copies and index extracts — no need to retype the file first.",
  },
];

export default function TSRPage() {
  return (
    <div className="min-h-screen bg-[#d8cdb8]">
      <LandingNav />
      <main className="pt-16">

        {/* ── Hero ── */}
        <section className="py-20 md:py-28 bg-[#d8cdb8] relative overflow-hidden">
          <div aria-hidden className="absolute -top-32 -right-24 w-[500px] h-[500px] rounded-full bg-[#6b1e2d]/[0.06] blur-[100px]" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-[#6b1e2d]/15 text-[11px] font-bold tracking-[0.18em] uppercase text-[#6b1e2d] mb-6">
              LexTSR — Title Scrutiny Report
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#1a1a1a] leading-[1.05] max-w-3xl">
              Bank-ready title scrutiny,<br />
              <span className="italic text-[#6b1e2d]">without the back-and-forth.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-[#3a0d18] max-w-2xl leading-relaxed font-medium">
              Upload the property file. LexRam maps the ownership chain, flags every encumbrance and delivers a report a banker can act on — every claim linked to a document and page.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-in?intent=signup&product=tsr"
                className="inline-flex items-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-7 py-3.5 rounded-xl font-semibold hover:bg-[#AA4400] transition shadow-[0_4px_22px_rgba(204,85,0,0.45)]"
              >
                Start a Title Report <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-2 border border-[#6b1e2d]/30 text-[#6b1e2d] px-7 py-3.5 rounded-xl font-medium hover:border-[#6b1e2d] hover:bg-[#6b1e2d]/5 transition"
              >
                See Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features grid ── */}
        <section className="py-20 md:py-24 bg-[#d8cdb8] border-t border-[#6b1e2d]/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-[#6b1e2d]">
                What the report covers
              </h2>
              <p className="mt-3 text-[#6b1e2d]/75 max-w-xl mx-auto">
                Every section a lender expects. Every claim linked to a source.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-7 border border-[#6b1e2d]/10 shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition"
                >
                  <div className="w-11 h-11 rounded-lg grid place-items-center bg-[#6b1e2d]/10 mb-4">
                    <f.icon className="w-5 h-5 text-[#6b1e2d]" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#1a1a1a] mb-2">{f.title}</h3>
                  <p className="text-[15px] text-[#3a0d18]/85 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What's inside the report ── */}
        <section className="py-20 md:py-24 bg-[#d8cdb8] border-t border-[#6b1e2d]/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-[#6b1e2d]">
                What the report contains
              </h2>
            </div>
            <div className="bg-white rounded-3xl border border-[#6b1e2d]/10 shadow-md p-8 md:p-12">
              <ul className="grid md:grid-cols-2 gap-x-10 gap-y-4 text-[#3a0d18]">
                {[
                  "Schedule of documents produced",
                  "Chain-of-title trace across sub-registrar records",
                  "Encumbrance summary with document references",
                  "Mutation / revenue-record verification",
                  "Tax & assessment status",
                  "Litigation & attachment flags",
                  "Independent verifier's observations",
                  "Final opinion with explicit caveats",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px]">
                    <CheckCircle2 className="w-5 h-5 text-[#6b1e2d] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-20 md:py-28 bg-[#6b1e2d] text-[#d8cdb8]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-3xl md:text-5xl font-light tracking-tight leading-tight">
              Run a title report your banker can trust.
            </h2>
            <p className="mt-5 text-lg text-[#d8cdb8]/80 max-w-2xl mx-auto">
              Upload the property file. Get a verifiable, lender-ready report in hours.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/sign-in?intent=signup&product=tsr"
                className="inline-flex items-center gap-2 bg-[#CC5500] text-[#d8cdb8] px-7 py-3.5 rounded-xl font-semibold hover:bg-[#AA4400] transition shadow-[0_4px_22px_rgba(204,85,0,0.45)]"
              >
                Start a Title Report <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-[#d8cdb8]/40 text-[#d8cdb8] px-7 py-3.5 rounded-xl font-medium hover:bg-[#d8cdb8]/10 transition"
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </section>

      </main>
      <LandingFooter />
    </div>
  );
}
