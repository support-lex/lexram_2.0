"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export default function TagInput({ value, onChange, placeholder = "Add a tag...", maxTags = 8 }: Props) {
  const [input, setInput] = useState("");

  const commit = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "").toLowerCase();
    if (!tag) return;
    if (value.includes(tag)) { setInput(""); return; }
    if (value.length >= maxTags) return;
    onChange([...value, tag]);
    setInput("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (input.trim()) {
        e.preventDefault();
        commit(input);
      }
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--ring-accent)] transition-all">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-[var(--accent)] hover:text-[var(--accent-hover)]"
            aria-label={`Remove tag ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => input && commit(input)}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] py-0.5"
      />
    </div>
  );
}
