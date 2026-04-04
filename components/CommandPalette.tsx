"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Briefcase, Search as SearchIcon, Building2, FolderOpen, X } from 'lucide-react';
import { getStoredData, STORAGE_KEYS } from '@/lib/storage';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load data for search
  const [matters, setMatters] = useState<any[]>([]);
  const [research, setResearch] = useState<any[]>([]);
  const [briefs, setBriefs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setMatters(getStoredData<any[]>(STORAGE_KEYS.MATTERS, []));
      setResearch(getStoredData<any[]>(STORAGE_KEYS.RESEARCH_SESSIONS, []));
      setBriefs(getStoredData<any[]>(STORAGE_KEYS.BRIEFS, []));
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const quickActions = [
    { id: 'qa1', title: 'New Research', icon: SearchIcon, action: () => router.push('/dashboard/research-3') },
    { id: 'qa2', title: 'New Matter', icon: Building2, action: () => router.push('/dashboard/matters') },
    { id: 'qa3', title: 'Upload Document', icon: FolderOpen, action: () => router.push('/dashboard/documents') },
  ];

  const getResults = () => {
    if (!query) return quickActions.map(qa => ({ ...qa, type: 'action' }));

    const q = query.toLowerCase();
    const results: any[] = [];

    matters.filter(m => m.title.toLowerCase().includes(q) || m.client.toLowerCase().includes(q)).forEach(m => {
      results.push({ id: m.id, title: m.title, subtitle: m.client, icon: Building2, type: 'matter', action: () => router.push('/dashboard/matters') });
    });

    research.filter(r => r.title.toLowerCase().includes(q)).forEach(r => {
      results.push({ id: r.id, title: r.title, subtitle: 'Research Session', icon: SearchIcon, type: 'research', action: () => router.push('/dashboard/research') });
    });

    briefs.filter(b => b.title.toLowerCase().includes(q)).forEach(b => {
      results.push({ id: b.id, title: b.title, subtitle: b.matter, icon: Briefcase, type: 'brief', action: () => router.push('/dashboard/matters') });
    });

    return results.slice(0, 10);
  };

  const results = getResults();

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        results[selectedIndex].action();
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-[var(--bg-sidebar)]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border-default)]">
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-hover)]">
          <Search className="w-5 h-5 text-[var(--text-muted)] mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search matters, research, drafts, or type a command..."
            className="flex-1 bg-transparent border-none focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-lg"
          />
          <button onClick={onClose} className="p-1 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">No results found for "{query}"</div>
          ) : (
            <>
              {!query && <div className="px-3 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Quick Actions</div>}
              {query && <div className="px-3 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Results</div>}
              
              {results.map((result, index) => {
                const Icon = result.icon;
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={result.id}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-[var(--bg-sidebar)] text-white' : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'}`}
                    onClick={() => { result.action(); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/10 text-[var(--accent)]' : 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{result.title}</div>
                      {result.subtitle && <div className={`text-xs truncate ${isSelected ? 'text-[var(--text-on-sidebar)]' : 'text-[var(--text-secondary)]'}`}>{result.subtitle}</div>}
                    </div>
                    {isSelected && <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Enter ↵</div>}
                  </div>
                );
              })}
            </>
          )}
        </div>
        <div className="px-4 py-2 border-t border-[var(--border-default)] bg-[var(--surface-hover)] flex items-center gap-4 text-xs font-bold text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded">↓</kbd> to navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded">↵</kbd> to select</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded">esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
