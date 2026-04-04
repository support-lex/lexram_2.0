'use client';

import { Calendar, FileText, MessageSquare, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import ThinkingSteps from '@/components/ai/ThinkingSteps';

interface OverviewTabProps {
  selectedMatter: any;
  relatedDocuments: any[];
  relatedEvents: any[];
  relatedBriefs: any[];
  relatedResearch: any[];
  setDetailTab: (tab: string) => void;
  isGeneratingTimeline: boolean;
  handleGenerateTimeline: () => void;
}

export function OverviewTab({
  selectedMatter,
  relatedDocuments,
  relatedEvents,
  relatedBriefs,
  relatedResearch,
  setDetailTab,
  isGeneratingTimeline,
  handleGenerateTimeline,
}: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Related Content Hub */}
        <div className="grid grid-cols-3 gap-4 stagger-children">
          <button
            onClick={() => setDetailTab('documents')}
            className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] p-4 text-center hover:ring-[var(--accent)]/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 shadow-[var(--shadow-card)]"
          >
            <div className="flex justify-center mb-2">
              <FileText className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{relatedDocuments.length}</div>
            <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Documents</div>
          </button>

          <button
            onClick={() => setDetailTab('hearings')}
            className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] p-4 text-center hover:ring-[var(--accent)]/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 shadow-[var(--shadow-card)]"
          >
            <div className="flex justify-center mb-2">
              <Calendar className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{relatedEvents.length}</div>
            <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Deadlines</div>
          </button>

          <button
            onClick={() => setDetailTab('notes')}
            className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] p-4 text-center hover:ring-[var(--accent)]/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 shadow-[var(--shadow-card)]"
          >
            <div className="flex justify-center mb-2">
              <MessageSquare className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{relatedBriefs.length}</div>
            <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Briefs</div>
          </button>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-sans font-sans text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Case Summary</h3>
          <p className="text-[var(--text-primary)] leading-relaxed text-sm font-sans">
            {selectedMatter.description || 'No description provided for this matter.'}
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-sans font-sans text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Key Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Presiding Judge</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{selectedMatter.judge || 'Not Assigned'}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Opposing Counsel</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{selectedMatter.opposingCounsel || 'Unknown'}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Case Number</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{selectedMatter.caseNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Timeline & Next Date */}
      <div className="space-y-6">
        {selectedMatter.nextDate && (
          <div className="bg-[var(--bg-sidebar)] rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <h3 className="font-sans font-sans text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2 relative z-10">Next Hearing</h3>
            <div className="text-2xl font-sans font-bold mb-1 relative z-10">{new Date(selectedMatter.nextDate).toLocaleDateString()}</div>
          </div>
        )}

        <div className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sans font-sans text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Timeline</h3>
            <button
              onClick={handleGenerateTimeline}
              disabled={isGeneratingTimeline}
              className="text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" /> Generate from Docs
            </button>
          </div>

          {isGeneratingTimeline && (
            <div className="mb-6">
              <ThinkingSteps steps={[{ label: "Analyzing documents..." }, { label: "Extracting events..." }]} currentStepIndex={1} isActive={true} />
            </div>
          )}

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
            {selectedMatter.timeline?.map((item: any, index: number) => (
              <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-[var(--accent)] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-xl ring-1 ring-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">{formatDate(item.date)}</span>
                    {item.aiGenerated && <span title="AI Generated"><Sparkles className="w-3 h-3 text-[var(--accent)]" /></span>}
                  </div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{item.event}</div>
                </div>
              </div>
            ))}
            {(!selectedMatter.timeline || selectedMatter.timeline.length === 0) && (
              <div className="text-sm text-[var(--text-secondary)] italic">No timeline events recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
