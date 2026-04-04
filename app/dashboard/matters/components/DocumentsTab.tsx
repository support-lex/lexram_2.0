'use client';

import { FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DocumentsTabProps {
  relatedDocuments: any[];
}

export function DocumentsTab({ relatedDocuments }: DocumentsTabProps) {
  return (
    <div className="space-y-6">
      {relatedDocuments.length > 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--border-default)]">
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Document Name</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Date Added</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {relatedDocuments.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[var(--accent)]" />
                        <span className="font-medium text-[var(--text-primary)]">{doc.name || 'Unnamed Document'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">{doc.type || 'Unknown'}</td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">{doc.date ? formatDate(doc.date) : 'N/A'}</td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-sm overflow-hidden flex flex-col items-center justify-center p-12 text-center">
          <FileText className="w-12 h-12 text-[var(--text-secondary)] opacity-50 mb-4" />
          <p className="text-[var(--text-primary)] font-medium mb-2">No documents found.</p>
          <p className="text-sm text-[var(--text-secondary)]">Upload documents from the Briefs page.</p>
        </div>
      )}
    </div>
  );
}
