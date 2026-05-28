"use client";

import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { HelpCircle, ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is LexRam?",
    answer: "LexRam is an AI-powered legal platform designed specifically for Indian advocates. It provides tools for legal research, document drafting, case analysis, and more, all tailored to Indian law and legal procedures."
  },
  {
    question: "Who can use LexRam?",
    answer: "LexRam is designed for licensed legal professionals in India, including advocates enrolled with State Bar Councils, law firms, and corporate legal teams."
  },
  {
    question: "Is my data secure with LexRam?",
    answer: "Yes, we take data security very seriously. All documents are encrypted in transit and at rest. We never use your documents to train our AI models without explicit consent, and we comply with all applicable data protection regulations."
  },
  {
    question: "Does LexRam provide legal advice?",
    answer: "No, LexRam does not provide legal advice. Our AI tools are designed to assist legal professionals by providing research, drafting assistance, and analysis. All outputs should be reviewed and verified by a qualified advocate before use."
  },
  {
    question: "What areas of law does LexRam cover?",
    answer: "LexRam covers all major areas of Indian law including Constitutional Law, Criminal Law, Civil Law, Corporate Law, Family Law, Property Law, Tax Law, Labour Law, and more. Our database includes statutes, case law, and legal commentary from across India."
  },
  {
    question: "Can I try LexRam before subscribing?",
    answer: "Yes, we offer a free trial period for new users. This allows you to explore our features and see how LexRam can benefit your practice before committing to a subscription."
  },
  {
    question: "How do I get started with LexRam?",
    answer: "Simply sign up for an account, complete your profile with your Bar Council registration details, and you can start using LexRam immediately. Our onboarding process will guide you through the key features."
  },
  {
    question: "What support options are available?",
    answer: "We offer multiple support channels including email support, in-app chat, and comprehensive documentation. Premium subscribers also have access to priority phone support."
  }
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[var(--border-default)] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:bg-[var(--bg-surface)] transition-colors px-2 -mx-2 rounded-lg"
      >
        <span className="text-lg font-medium text-[var(--text-primary)] pr-4">{item.question}</span>
        <ChevronDown 
          className={`w-5 h-5 text-[var(--accent)] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-[var(--text-secondary)] leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export default function FAQClient() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <HelpCircle className="w-16 h-16 text-[var(--accent)] mx-auto mb-6" />
          <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)] mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-[var(--text-secondary)]">
            Find answers to common questions about LexRam
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[var(--border-default)] p-6 sm:p-8">
          {faqs.map((faq, index) => (
            <FAQAccordion key={index} item={faq} />
          ))}
        </div>

        <div className="mt-12 text-center p-6 bg-[var(--accent)]/10 rounded-lg border border-[var(--accent)]/20">
          <h3 className="font-bold text-[var(--text-primary)] mb-2">Still have questions?</h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Can&apos;t find the answer you&apos;re looking for? Please contact our support team.
          </p>
          <a 
            href="mailto:support@lexram.ai" 
            className="inline-block px-6 py-3 bg-[var(--bg-sidebar)] text-white rounded-lg hover:bg-[var(--bg-sidebar-hover)] transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
