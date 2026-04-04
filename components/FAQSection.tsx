'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How accurate is the legal research?",
      a: "LexRam is trained exclusively on Indian jurisprudence, including Supreme Court and all High Court judgments. It provides citations for every claim and highlights the exact paragraph from the judgment, ensuring 100% verifiable accuracy.",
    },
    {
      q: "Are my client's facts secure?",
      a: "Yes. We employ bank-grade encryption. Your prompts and matter details are never used to train our base models. All data is stored securely in Indian data centers.",
    },
    {
      q: "How does the Pay-As-You-Go model work?",
      a: "You buy a pack of credits (e.g., 10,000 credits for ₹999). Each research query or document draft consumes a small number of credits. Credits never expire, so you only pay when you actually use the platform.",
    },
    {
      q: "Can it draft documents for lower courts?",
      a: "Yes. LexRam includes formatting and jurisdictional templates for the Supreme Court, all High Courts, District Courts, NCLT, NCDRC, and other major tribunals.",
    },
  ];

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto bg-white text-black">
      <div className="text-center mb-20">
        <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tight mb-6">
          Common <span className="italic text-[var(--text-secondary)]">Questions</span>
        </h2>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="ring-1 ring-[var(--border-default)] rounded-3xl overflow-hidden bg-[var(--bg-surface)] shadow-[var(--shadow-card)] transition-all"
          >
            <button
              className="w-full px-8 py-6 text-left flex items-center justify-between focus:outline-none"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span className="font-medium text-lg text-[var(--text-primary)] font-sans">{faq.q}</span>
              <ChevronDown
                className={`w-5 h-5 text-[var(--text-muted)] transition-transform duration-300 ${
                  openIndex === i ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`px-8 overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === i ? "max-h-48 pb-6 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="text-[var(--text-secondary)] font-normal leading-relaxed font-sans">{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
