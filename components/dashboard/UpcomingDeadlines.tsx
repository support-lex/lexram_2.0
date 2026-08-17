'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { getStoredData, STORAGE_KEYS } from '@/lib/storage';
import { useMatterContext } from '@/lib/matter-context';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface Deadline {
  id: string;
  title: string;
  case: string;
  date: string;
  urgent: boolean;
  matterId: string;
  eventDate: Date;
}

export default function UpcomingDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedMatterId, matters } = useMatterContext();

  const getMatterName = (matterId: string | undefined): string => {
    const matter = matters.find(m => m.id === matterId);
    return matter?.title || 'Unknown Matter';
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate.getTime() === today.getTime()) return 'Today';
    if (eventDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isUrgent = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate >= today && eventDate <= twoDaysFromNow;
  };

  useEffect(() => {
    const loadData = () => {
      const events = getStoredData<any[]>(STORAGE_KEYS.EVENTS, []);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingEvents = events
        .filter(e => {
          const eventDate = new Date(e.date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today && (selectedMatterId === 'all' || e.matter === selectedMatterId);
        })
        .map((event, idx) => ({
          id: `event-${idx}`,
          title: event.title || 'Deadline',
          case: getMatterName(event.matter),
          date: formatDate(new Date(event.date)),
          urgent: isUrgent(new Date(event.date)),
          matterId: event.matter || '',
          eventDate: new Date(event.date),
        }))
        .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
        .slice(0, 5);

      setDeadlines(upcomingEvents);
      setIsLoading(false);
    };

    setIsLoading(true);
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, [selectedMatterId, matters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-sans text-[var(--text-primary)] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--accent)]" /> Upcoming Deadlines
        </h2>
        <Link href="/dashboard/deadlines" className="text-sm font-bold font-sans text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">Calendar</Link>
      </div>
      <div className="bg-[var(--surface-glass)] backdrop-blur-xl ring-1 ring-[var(--border-default)] rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : deadlines.length === 0 ? (
          <div className="py-6">
            <EmptyState
              icon={Clock}
              title="No upcoming deadlines"
              description="You're all caught up for this matter."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {deadlines.map((deadline) => (
              <div key={deadline.id} className="p-4 hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-bold font-sans text-[var(--text-primary)]">{deadline.title}</h3>
                  {deadline.urgent && (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-600 text-[10px] font-bold font-sans uppercase tracking-wider rounded-full">Urgent</span>
                  )}
                </div>
                <p className="text-xs font-medium font-sans text-[var(--text-secondary)] mb-1">{deadline.case}</p>
                <div className="text-xs font-medium font-sans text-[var(--text-muted)]">
                  <span className={`font-bold ${deadline.urgent ? 'text-red-500' : ''}`}>{deadline.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/dashboard/deadlines" className="block p-3 border-t border-[var(--border-light)] bg-[var(--surface-hover)] text-center">
          <button className="w-full flex items-center justify-center gap-2 text-sm font-bold font-sans text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
            <Plus className="w-4 h-4" /> Add Deadline
          </button>
        </Link>
      </div>
    </div>
  );
}
