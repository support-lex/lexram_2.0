'use client';

import { useState, useEffect } from 'react';
import { Briefcase, FileText, Calendar, FileCheck } from 'lucide-react';
import { getStoredData, STORAGE_KEYS } from '@/lib/storage';
import { useMatterContext } from '@/lib/matter-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardStats() {
  const [data, setData] = useState({ matters: 0, drafts: 0, deadlines: 0, contracts: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { selectedMatterId, matters } = useMatterContext();

  useEffect(() => {
    const loadData = () => {
      const allMatters = getStoredData<any[]>(STORAGE_KEYS.MATTERS, []);
      const briefs = getStoredData<any[]>(STORAGE_KEYS.BRIEFS, []);
      const events = getStoredData<any[]>(STORAGE_KEYS.EVENTS, []);
      const contractAnalyses = getStoredData<any[]>('lexram_contract_analyses', []);

      const currentMatter = matters.find(m => m.id === selectedMatterId);
      const selectedMatterTitle = currentMatter ? currentMatter.title : '';

      const filteredMatters = selectedMatterId === 'all'
        ? allMatters.filter(m => m.status !== 'Closed').length
        : allMatters.filter(m => m.id === selectedMatterId && m.status !== 'Closed').length;

      const filteredDrafts = briefs.filter(b =>
        (selectedMatterId === 'all' || b.matter === selectedMatterId || b.matter === selectedMatterTitle) &&
        (b.status === 'Draft' || b.status === 'In Review')
      ).length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const twoWeeksFromNow = new Date(today);
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

      const filteredDeadlines = events.filter(e => {
        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today && eventDate <= twoWeeksFromNow &&
               (selectedMatterId === 'all' || e.matter === selectedMatterId || e.matter === selectedMatterTitle);
      }).length;

      const filteredContracts = selectedMatterId === 'all'
        ? contractAnalyses.length
        : contractAnalyses.filter(c => c.matter === selectedMatterId || c.matter === selectedMatterTitle).length;

      setData({
        matters: filteredMatters,
        drafts: filteredDrafts,
        deadlines: filteredDeadlines,
        contracts: filteredContracts,
      });
      setIsLoading(false);
    };

    setIsLoading(true);
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, [selectedMatterId, matters]);

  const stats = [
    { label: 'Active Matters', value: data.matters.toString(), icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Drafts in Progress', value: data.drafts.toString(), icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Upcoming Deadlines', value: data.deadlines.toString(), icon: Calendar, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Contracts Reviewed', value: data.contracts.toString(), icon: FileCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[var(--surface-glass)] backdrop-blur-xl p-4 rounded-xl ring-1 ring-[var(--border-default)] flex items-center gap-4 shadow-[var(--shadow-card)] animate-pulse">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      {stats.map((stat, i) => (
        <div key={i} className="bg-[var(--surface-glass)] backdrop-blur-xl p-4 rounded-xl ring-1 ring-[var(--border-default)] flex items-center gap-4 shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
          <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-full flex items-center justify-center shrink-0`}>
            <stat.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-sans text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-[10px] font-bold font-sans text-[var(--text-secondary)] uppercase tracking-wider">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
