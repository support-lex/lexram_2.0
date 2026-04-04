'use client';
import { motion } from 'motion/react';
import { Search, FileText, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { practiceAreas } from '@/lib/data';

export default function PracticeAreasSection() {
  const [activePracticeArea, setActivePracticeArea] = useState(practiceAreas[0]);

  return (
    <section id="practice-areas" className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <div className="mb-20 text-center">
        <h2 className="font-serif text-5xl md:text-7xl font-normal tracking-tight mb-6">
          Every area of <span className="italic text-[var(--text-secondary)]">Indian law.</span>
        </h2>
        <p className="text-xl text-[var(--text-secondary)] font-normal max-w-2xl mx-auto">
          Comprehensive coverage across all major practice areas.
        </p>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-12 items-start">
        <div className="flex flex-col gap-2">
          {practiceAreas.slice(0, 8).map((area) => {
            const Icon = area.icon;
            const isActive = activePracticeArea.id === area.id;
            return (
              <button
                key={area.id}
                onClick={() => setActivePracticeArea(area)}
                className={`flex items-center gap-4 px-6 py-4 rounded-full text-left transition-all ${
                  isActive
                    ? "bg-black text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-[var(--text-muted)]"}`} />
                <span className="font-medium text-sm tracking-wide">{area.title}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-default)] p-10 md:p-16 min-h-[500px]">
          <motion.div
            key={activePracticeArea.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-full flex items-center justify-center border border-[var(--border-default)] shadow-sm">
                <activePracticeArea.icon className="w-8 h-8 text-black" />
              </div>
              <h3 className="font-serif text-4xl font-normal text-black">
                {activePracticeArea.title}
              </h3>
            </div>

            <p className="text-[var(--text-secondary)] leading-relaxed mb-16 text-lg font-normal">
              {activePracticeArea.desc}
            </p>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h4 className="font-medium text-sm text-black mb-6 flex items-center gap-2 tracking-wide uppercase">
                  <Search className="w-4 h-4 text-[var(--text-muted)]" /> Research Examples
                </h4>
                <ul className="space-y-5">
                  {activePracticeArea.research.slice(0, 3).map((item, i) => (
                    <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-3 font-normal leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm text-black mb-6 flex items-center gap-2 tracking-wide uppercase">
                  <FileText className="w-4 h-4 text-[var(--text-muted)]" /> Drafting Suite
                </h4>
                <ul className="space-y-4">
                  {activePracticeArea.drafting.slice(0, 4).map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-default)] font-normal">
                      <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
