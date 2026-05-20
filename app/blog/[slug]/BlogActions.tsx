"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  title: string;
  initialLikes?: number;
}

export default function BlogActions({ title, initialLikes = 0 }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleLike = () => {
    setLiked((wasLiked) => {
      setLikes((n) => n + (wasLiked ? -1 : 1));
      return !wasLiked;
    });
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        type="button"
        onClick={toggleLike}
        aria-pressed={liked}
        className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium transition-all
          ${liked
            ? "bg-[var(--accent)]/15 text-[var(--accent)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          }`}
      >
        <Heart className={`h-4 w-4 transition-transform ${liked ? "fill-current scale-110" : ""}`} />
        <span>{likes}</span>
      </button>

      <a
        href="#comments"
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Comments</span>
      </a>

      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
        <span className="hidden sm:inline">Share</span>
      </button>
    </div>
  );
}
