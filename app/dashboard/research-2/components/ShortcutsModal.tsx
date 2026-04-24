"use client";

import { X } from "lucide-react";

type ShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg">
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Keyboard shortcuts</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Core controls for Research</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-hover)]" aria-label="Close shortcuts">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          {[
            ["⌘ / Ctrl + Enter", "Submit query"],
            ["⌘ / Ctrl + K", "Focus research input"],
            ["⌘ / Ctrl + H", "Toggle history panel"],
            ["⌘ / Ctrl + .", "Toggle authorities panel"],
            ["Esc", "Close open panels"],
          ].map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between gap-3">
              <span className="text-[var(--text-secondary)]">{label}</span>
              <span className="rounded-md bg-[var(--surface-hover)] px-2 py-1 text-xs text-[var(--text-secondary)]">{keys}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
