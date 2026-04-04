'use client';

import { useState, useEffect } from 'react';
import { Activity, FileText, FileCheck, Search, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { getStoredData, STORAGE_KEYS } from '@/lib/storage';
import { useMatterContext } from '@/lib/matter-context';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface ActivityItem {
  id: string;
  case: string;
  action: string;
  time: string;
  icon: any;
  color: string;
  bg: string;
  matterId: string;
  timestamp: Date;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedMatterId, matters } = useMatterContext();

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getMatterName = (matterId: string | undefined): string => {
    const matter = matters.find(m => m.id === matterId);
    return matter?.title || 'Unknown Matter';
  };

  useEffect(() => {
    const loadData = () => {
      const briefs = getStoredData<any[]>(STORAGE_KEYS.BRIEFS, []);
      const researchSessions = getStoredData<any[]>(STORAGE_KEYS.RESEARCH_SESSIONS, []);
      const events = getStoredData<any[]>(STORAGE_KEYS.EVENTS, []);
      const contractAnalyses = getStoredData<any[]>('lexram_contract_analyses', []);

      const allItems: ActivityItem[] = [];

      briefs.forEach((brief, idx) => {
        const lastEdited = new Date(brief.lastEdited || brief.createdAt || new Date());
        allItems.push({
          id: `brief-${idx}`,
          case: getMatterName(brief.matter),
          action: `Drafted ${brief.title || 'Brief'}`,
          time: formatTimeAgo(lastEdited),
          icon: FileText,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          matterId: brief.matter || '',
          timestamp: lastEdited,
        });
      });

      researchSessions.forEach((session, idx) => {
        const updatedAt = new Date(session.updatedAt || session.createdAt || new Date());
        allItems.push({
          id: `research-${idx}`,
          case: getMatterName(session.matter),
          action: `Researched: ${session.topic || 'Legal Research'}`,
          time: formatTimeAgo(updatedAt),
          icon: Search,
          color: 'text-purple-500',
          bg: 'bg-purple-500/10',
          matterId: session.matter || '',
          timestamp: updatedAt,
        });
      });

      events.forEach((event, idx) => {
        const createdAt = new Date(event.createdAt || new Date());
        allItems.push({
          id: `event-${idx}`,
          case: getMatterName(event.matter),
          action: `Added deadline: ${event.title || 'Event'}`,
          time: formatTimeAgo(createdAt),
          icon: Briefcase,
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          matterId: event.matter || '',
          timestamp: createdAt,
        });
      });

      contractAnalyses.forEach((analysis, idx) => {
        const analyzedAt = new Date(analysis.analyzedAt || analysis.createdAt || new Date());
        allItems.push({
          id: `contract-${idx}`,
          case: getMatterName(analysis.matter),
          action: 'Contract Review Completed',
          time: formatTimeAgo(analyzedAt),
          icon: FileCheck,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
          matterId: analysis.matter || '',
          timestamp: analyzedAt,
        });
      });

      const sortedActivities = allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

      setActivities(sortedActivities);
      setIsLoading(false);
    };

    setIsLoading(true);
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, [selectedMatterId, matters]);

  const filteredActivities = activities.filter(
    a => selectedMatterId === 'all' || a.matterId === selectedMatterId
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-sans text-[var(--text-primary)] flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--accent)]" /> Recent Activity
        </h2>
        <Link href="/dashboard/activity" className="text-sm font-bold font-sans text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">View all</Link>
      </div>
      <div className="bg-[var(--surface-glass)] backdrop-blur-xl ring-1 ring-[var(--border-default)] rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Start by creating a matter or running research"
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-[var(--surface-hover)] transition-colors flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.bg} ${activity.color}`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold font-sans text-[var(--text-primary)] truncate">{activity.action}</p>
                  <p className="text-xs font-medium font-sans text-[var(--text-secondary)] mt-0.5">{activity.case}</p>
                </div>
                <div className="text-xs font-medium font-sans text-[var(--text-muted)] whitespace-nowrap">{activity.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
