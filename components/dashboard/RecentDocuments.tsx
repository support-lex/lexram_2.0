'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, File } from 'lucide-react';
import Link from 'next/link';
import { getStoredData, STORAGE_KEYS } from '@/lib/storage';
import { useMatterContext } from '@/lib/matter-context';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';

export default function RecentDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedMatterId, matters } = useMatterContext();

  useEffect(() => {
    // Simulate loading for Skeleton
    const loadData = () => {
      const storedDocs = getStoredData<any[]>(STORAGE_KEYS.DOCUMENTS, []);
      setDocuments(storedDocs);
      setIsLoading(false);
    };
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, []);

  const currentMatter = matters.find(m => m.id === selectedMatterId);
  const selectedMatterTitle = currentMatter ? currentMatter.title : '';

  const filteredDocs = documents
    .filter(doc => selectedMatterId === 'all' || doc.matter === selectedMatterId || doc.matter === selectedMatterTitle)
    .slice(0, 3); // Get top 3

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-sans text-[var(--text-primary)] flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-[var(--accent)]" /> Recent Documents
        </h2>
        <Link href="/dashboard/documents" className="text-sm font-bold font-sans text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">View all</Link>
      </div>
      <div className="bg-[var(--surface-glass)] backdrop-blur-xl ring-1 ring-[var(--border-default)] rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-6">
            <EmptyState
              icon={FolderOpen}
              title="No recent documents"
              description="Upload files to see them here."
              action={{ label: 'Go to Documents', onClick: () => window.location.href = '/dashboard/documents' }}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {filteredDocs.map((doc, i) => (
              <div key={i} className="p-4 hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center shrink-0 group-hover:bg-[var(--bg-sidebar)] group-hover:text-[var(--accent)] transition-colors text-[var(--text-secondary)] ring-1 ring-[var(--border-default)]">
                    <File className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold font-sans text-[var(--text-primary)] truncate max-w-[200px]">{doc.name}</p>
                    <p className="text-xs font-medium font-sans text-[var(--text-secondary)] mt-0.5 truncate max-w-[200px]">{doc.matter}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold font-sans text-[var(--text-muted)]">{formatSize(doc.size)}</p>
                  <p className="text-[10px] font-bold font-sans text-[var(--text-muted)] mt-0.5 uppercase tracking-wider">{new Date(doc.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
