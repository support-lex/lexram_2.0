'use client';

import { Search } from 'lucide-react';
import { useCurrentUser, getDisplayName } from '@/hooks/use-current-user';

interface DashboardHeaderProps {
  today: string;
}

function timeOfDayGreeting(): string {
  if (typeof window === 'undefined') return 'Welcome';
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardHeader({ today }: DashboardHeaderProps) {
  const user = useCurrentUser();
  const displayName = getDisplayName(user);
  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
        <input 
          type="text" 
          placeholder="Search matters, drafts, research, or contracts..." 
          className="w-full bg-white/80 backdrop-blur-md border border-[var(--border-default)] rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm transition-all text-[var(--text-primary)]"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">⌘K</kbd>
        </div>
      </div>
 
      {/* Hero Section */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)] mb-2" suppressHydrationWarning>
          {timeOfDayGreeting()}, {displayName}
        </h1>
        <p className="text-[var(--text-secondary)] font-medium" suppressHydrationWarning>{today}</p>
      </div>
    </div>
  );
}
