'use client';

import { Calendar, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface HearingsTabProps {
  relatedEvents: any[];
}

export function HearingsTab({ relatedEvents }: HearingsTabProps) {
  return (
    <div className="space-y-6">
      {relatedEvents.length > 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="divide-y divide-[var(--border-default)]">
            {relatedEvents.map((event, idx) => (
              <div key={idx} className="p-6 hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        event.type === 'Hearing' ? 'bg-blue-500/10 text-blue-600' :
                        event.type === 'Filing Deadline' ? 'bg-red-500/10 text-red-600' :
                        'bg-[var(--accent)]/10 text-[var(--accent)]'
                      }`}>
                        {event.type}
                      </span>
                    </div>
                    <h4 className="font-sans font-bold text-[var(--text-primary)] mb-2">{event.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[var(--accent)]" />
                        {formatDate(event.date)}
                      </span>
                      {event.time && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[var(--accent)]" />
                          {event.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col items-center justify-center p-12 text-center">
          <Calendar className="w-12 h-12 text-[var(--text-secondary)] opacity-50 mb-4" />
          <p className="text-[var(--text-primary)] font-medium mb-2">No hearings linked to this matter.</p>
          <p className="text-sm text-[var(--text-secondary)]">Add one from the Deadlines page.</p>
        </div>
      )}
    </div>
  );
}
