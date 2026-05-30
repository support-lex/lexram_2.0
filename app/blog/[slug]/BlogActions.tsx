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
            ? "bg-[#b94826]/15 text-[#b94826]"
            : "text-[#680318]/75 hover:bg-[#680318]/8 hover:text-[#680318]"
          }`}
      >
        <Heart className={`h-4 w-4 transition-transform ${liked ? "fill-current scale-110" : ""}`} />
        <span>{likes}</span>
      </button>

      <a
        href="#comments"
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium text-[#680318]/75 hover:bg-[#680318]/8 hover:text-[#680318] transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Comments</span>
      </a>

      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium text-[#680318]/75 hover:bg-[#680318]/8 hover:text-[#680318] transition-colors"
      >
        {copied ? <Check className="h-4 w-4 text-[#b94826]" /> : <Share2 className="h-4 w-4" />}
        <span className="hidden sm:inline">Share</span>
      </button>
    </div>
  );
}
