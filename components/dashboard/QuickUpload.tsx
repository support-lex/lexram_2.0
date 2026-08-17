'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { setStoredData } from '@/lib/storage';

export default function QuickUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    const maxSize = 50 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, DOCX, JPG, or PNG file');
      return false;
    }
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return false;
    }
    return true;
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleGoToBriefs = () => {
    if (selectedFile) {
      const uploadData = {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        uploadedAt: new Date().toISOString(),
      };
      setStoredData('lexram_quick_upload', uploadData);
    }
    router.push('/dashboard/briefs');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold font-sans text-[var(--text-primary)] flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-[var(--accent)]" /> Quick Upload
      </h2>
      {selectedFile ? (
        <div className="bg-[var(--surface-glass)] backdrop-blur-xl ring-1 ring-[var(--border-default)] rounded-xl p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center shrink-0">
              <File className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold font-sans text-[var(--text-primary)] truncate">{selectedFile.name}</p>
              <p className="text-xs font-medium font-sans text-[var(--text-secondary)] mt-0.5">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGoToBriefs}
              className="flex-1 bg-[var(--bg-sidebar)] text-white px-4 py-2 rounded-lg text-xs font-bold font-sans hover:bg-[var(--bg-sidebar-hover)] transition-colors shadow-[var(--shadow-card)]"
            >
              Go to Briefs
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              className="flex-1 bg-[var(--surface-hover)] text-[var(--text-primary)] px-4 py-2 rounded-lg text-xs font-bold font-sans hover:bg-[var(--border-default)] transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-[var(--surface-glass)] backdrop-blur-xl border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer shadow-[var(--shadow-card)] group ${
            isDragging ? 'border-[var(--accent)] bg-[var(--surface-glass)]' : 'border-[var(--border-default)] hover:border-[var(--accent)] hover:bg-[var(--surface-glass)]'
          }`}
        >
          <div className="w-12 h-12 bg-[var(--bg-primary)] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[var(--bg-sidebar)] group-hover:text-[var(--accent)] transition-colors text-[var(--text-muted)]">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold font-sans text-[var(--text-primary)] mb-1">Drag & drop files here</p>
          <p className="text-xs font-medium font-sans text-[var(--text-secondary)] mb-4">PDF, DOCX, JPG up to 50MB</p>
          <button
            onClick={handleBrowseClick}
            className="bg-[var(--bg-sidebar)] text-white px-4 py-2 rounded-lg text-xs font-bold font-sans hover:bg-[var(--bg-sidebar-hover)] transition-colors shadow-[var(--shadow-card)]"
          >
            Browse Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            className="hidden"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
