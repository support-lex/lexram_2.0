'use client';

import { Search, FileSignature, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function QuickActions() {
  const actions = [
    { href: '/dashboard/research-3', icon: Search, title: 'Research', desc: 'AI-powered legal research' },
    { href: '/dashboard/contracts', icon: FileSignature, title: 'Review Contract', desc: 'Analyze risks & clauses' },
    { href: '/dashboard/matters', icon: Building2, title: 'Manage Matters', desc: 'View cases & clients' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, i) => (
        <Link 
          key={i}
          href={action.href} 
          className="group bg-[var(--surface-glass)] backdrop-blur-xl p-5 rounded-xl ring-1 ring-[var(--border-default)] hover:ring-[var(--accent)]/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 flex flex-col gap-4"
        >
          <div className="w-10 h-10 bg-[var(--bg-sidebar)]/5 text-[var(--text-primary)] rounded-lg flex items-center justify-center group-hover:bg-[var(--bg-sidebar)] group-hover:text-[var(--accent)] transition-colors">
            <action.icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold font-sans text-[var(--text-primary)] mb-1">{action.title}</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium font-sans">{action.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
