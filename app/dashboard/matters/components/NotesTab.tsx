'use client';

interface NotesTabProps {
  matterNotes: string;
  setMatterNotes: (notes: string) => void;
  setNotesDirty: (dirty: boolean) => void;
  notesLastSaved: string | null;
  onBlurSave: () => void;
}

export function NotesTab({
  matterNotes,
  setMatterNotes,
  setNotesDirty,
  notesLastSaved,
  onBlurSave,
}: NotesTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans font-sans text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Case Notes</h3>
          {notesLastSaved && (
            <span className="text-xs text-[var(--text-secondary)]">Last saved: {notesLastSaved}</span>
          )}
        </div>
        <textarea
          value={matterNotes}
          onChange={(e) => {
            setMatterNotes(e.target.value);
            setNotesDirty(true);
          }}
          onBlur={onBlurSave}
          className="w-full min-h-[400px] p-4 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-vertical"
          placeholder="Add notes about this case, legal arguments, key findings, and other important information..."
        />
      </div>
    </div>
  );
}
