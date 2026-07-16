"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How often is new content published on the LexRam blog?",
    a: "We publish new articles several times a week — covering Supreme Court and High Court developments, statutory amendments, technology in legal practice, and editorial commentary from practising advocates.",
  },
  {
    q: "Can I subscribe to get new posts in my inbox?",
    a: "Yes. Create a free LexRam account and enable blog notifications in your profile settings. Subscribers receive a weekly digest of the most-read articles and major legal updates from the past week.",
  },
  {
    q: "Are the articles written by advocates or by AI?",
    a: "Both. Editorial articles are written by practising advocates and verified by our legal team. Research briefs and case summaries are drafted with LexRam's AI and reviewed by a qualified editor before publication, so every post is grounded in real Indian law.",
  },
  {
    q: "Can I cite a LexRam blog article in court or in my pleadings?",
    a: "Blog articles are commentary and analysis — useful for context and understanding, but not a substitute for primary sources. Always cite the underlying judgement, statute, or circular directly. Linked primary sources are provided at the end of every post.",
  },
  {
    q: "How can I submit a guest post or pitch a topic?",
    a: "We welcome pitches from practising advocates and legal academics. Email your idea and a short bio to hello@lexram.ai with the subject line \"Blog pitch\". Our editorial team reviews every submission and responds within two weeks.",
  },
];

export default function BlogFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="blog-faq"
      className="bg-[#fff0df] py-14 md:py-20 border-t border-[#6b1e2d]/10 scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-8 md:mb-10 text-center">
          <div className="inline-block text-xs font-bold tracking-[0.3em] uppercase text-[#CC5500] mb-3">
            FAQ — ABOUT THE BLOG
          </div>
          <h2 className="font-serif font-bold text-[#6b1e2d] text-3xl sm:text-4xl md:text-5xl leading-[1.05]">
            Frequently asked <em className="italic">questions.</em>
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#6b1e2d]/75 max-w-2xl mx-auto">
            Quick answers about publishing, subscriptions, citations, and contributing to the LexRam blog.
          </p>
        </div>

        <div className="rounded-2xl border border-[#6b1e2d]/15 bg-[#fff0df]/60 overflow-hidden">
          <div className="border-t-0">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="border-b border-[#6b1e2d]/15 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 sm:gap-6 py-5 sm:py-6 px-4 sm:px-6 text-left group"
                    aria-expanded={isOpen}
                    aria-controls={`blog-faq-panel-${i}`}
                  >
                    <span className="font-serif font-semibold text-base sm:text-lg md:text-xl text-[#6b1e2d] leading-snug group-hover:text-[#CC5500] transition-colors">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#6b1e2d] shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    id={`blog-faq-panel-${i}`}
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-4 sm:px-6 pb-5 sm:pb-6 text-sm sm:text-base text-[#3a0d18]/85 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}