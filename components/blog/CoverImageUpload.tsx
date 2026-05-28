"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";
import { uploadBlogImage } from "@/lib/blog/api";
import { toast } from "sonner";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
}

export default function CoverImageUpload({ value, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadBlogImage(file, "cover");
      onChange(url);
      toast.success("Cover image uploaded");
    } catch (e) {
      toast.error("Upload failed", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }, [onChange]);

  if (value) {
    return (
      <div className="relative group rounded-2xl overflow-hidden border border-[var(--border-default)] shadow-[var(--shadow-card)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Cover" className="w-full aspect-[2.4/1] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-white/95 text-[var(--text-primary)] text-xs font-medium shadow hover:bg-white transition-colors"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="grid place-items-center h-8 w-8 rounded-lg bg-white/95 text-red-600 shadow hover:bg-red-50 transition-colors"
            aria-label="Remove cover image"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      disabled={busy}
      className={`w-full aspect-[2.4/1] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all
        ${drag
          ? "border-[var(--accent)] bg-[var(--accent)]/5"
          : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
        }
        ${busy ? "opacity-60 cursor-wait" : "cursor-pointer"}
      `}
    >
      {busy ? (
        <>
          <Loader2 className="h-8 w-8 text-[var(--accent)] animate-spin" />
          <span className="text-sm text-[var(--text-muted)]">Uploading...</span>
        </>
      ) : (
        <>
          <ImagePlus className="h-8 w-8 text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Add cover image</span>
          <span className="text-xs text-[var(--text-muted)]">Drag &amp; drop or click — recommended 2400×1000</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </button>
  );
}
