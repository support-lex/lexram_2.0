'use client';
import { FileText, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

export default function DraftingSection() {
  return (
    <section id="drafting" className="py-32 bg-[var(--bg-surface)] px-4 sm:px-6 lg:px-8 relative overflow-hidden text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row-reverse gap-20 items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-primary)] text-xs font-medium text-[var(--text-primary)] mb-8 tracking-widest uppercase">
              <FileText className="w-4 h-4" /> Legal Drafting Suite
            </div>
            <h2 className="font-serif text-5xl md:text-7xl font-normal mb-8 leading-[1.1] tracking-tight">
              Every document. <br />
              <span className="italic text-[var(--text-secondary)]">
                Built around your facts.
              </span>
            </h2>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed mb-12 font-normal">
              Tell LexRam your facts. Select your document type. Get a complete, argued, cited first draft in minutes, formatted perfectly for Indian courts.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-12">
              {[
                "Bail Applications",
                "Writ Petitions",
                "Written Statements",
                "Legal Notices"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-[var(--border-default)] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-black" />
                  </div>
                  <span className="font-normal text-base text-[var(--text-primary)]">{item}</span>
                </div>
              ))}
            </div>

            <button className="text-black font-medium flex items-center gap-2 hover:text-[var(--text-muted)] transition-colors tracking-wide">
              View all 50+ document types <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 w-full">
            <div className="bg-[var(--bg-primary)] p-4 rounded-[2.5rem] border border-[var(--border-default)] shadow-2xl">
              <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-light)] overflow-hidden shadow-sm">
                {/* Editor Toolbar Mock */}
                <div className="border-b border-[var(--border-light)] px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-6 bg-[var(--bg-primary)] rounded-md"></div>
                    <div className="w-16 h-6 bg-[var(--bg-primary)] rounded-md"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-8 bg-black rounded-full"></div>
                  </div>
                </div>
                {/* Editor Content Mock */}
                <div className="p-10 font-serif text-base leading-relaxed text-[var(--text-primary)] h-[450px] relative bg-[var(--bg-surface)]">
                  <div className="text-center font-bold mb-8 tracking-wide">
                    IN THE HIGH COURT OF DELHI AT NEW DELHI<br />
                    EXTRAORDINARY WRIT JURISDICTION<br />
                    WRIT PETITION (CIVIL) NO. _____ OF 2026
                  </div>
                  <div className="mb-6">
                    <span className="font-bold">IN THE MATTER OF:</span><br />
                    Ramesh Kumar ... Petitioner<br />
                    Versus<br />
                    State of NCT of Delhi & Ors. ... Respondents
                  </div>
                  <div className="text-center font-bold mb-8 uppercase underline tracking-wide">
                    Writ Petition under Article 226 of the Constitution of India
                  </div>
                  <p className="mb-4 text-justify">The Petitioner most respectfully showeth:</p>
                  <p className="mb-4 text-justify">
                    1. That the present writ petition is being filed seeking a writ of mandamus directing the Respondent No. 1 to...
                  </p>

                  {/* AI Suggestion Overlay */}
                  <div className="absolute bottom-8 right-8 bg-[var(--bg-sidebar)] p-6 rounded-3xl shadow-2xl border border-white/10 w-80 animate-in slide-in-from-bottom-4 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                      <span className="font-medium text-xs uppercase tracking-widest">AI Suggestion</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-5 font-normal leading-relaxed">
                      Consider adding a paragraph specifically addressing the maintainability of the writ petition citing <span className="italic font-serif text-white">Whirlpool Corporation v. Registrar of Trade Marks</span>.
                    </p>
                    <div className="flex gap-3">
                      <button className="flex-1 bg-[var(--bg-surface)] text-black text-xs font-medium py-2.5 rounded-full tracking-wide">Accept</button>
                      <button className="flex-1 bg-[var(--bg-surface)]/10 text-white text-xs font-medium py-2.5 rounded-full tracking-wide hover:bg-[var(--bg-surface)]/20 transition-colors">Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
