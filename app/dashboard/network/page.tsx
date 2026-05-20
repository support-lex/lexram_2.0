"use client";

import * as React from "react";
import {
  Search,
  MapPin,
  Briefcase,
  Users,
  MessageSquare,
  Bell,
  Home,
  Building2,
  Bookmark,
  BookmarkCheck,
  X,
  UserPlus,
  Send,
  Mail,
  ThumbsUp,
  MessageCircle,
  Share2,
  Plus,
  User,
  Pencil,
  GraduationCap,
  ShieldCheck,
  Languages,
  Link2,
  Trash2,
  Camera,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
} from "lucide-react";
import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase/client";
import {
  listFeed,
  createPost,
  deletePost as deletePostApi,
  updatePost as updatePostApi,
  likePost,
  unlikePost,
  repost as repostApi,
  unrepost,
  listComments,
  addComment as addCommentApi,
  deleteComment as deleteCommentApi,
  uploadPostMedia,
} from "@/lib/network/feed";
import {
  ensureProfile,
  getProfile,
  updateProfile,
  listExperiences,
  addExperience as addExperienceApi,
  deleteExperience as deleteExperienceApi,
  listEducations,
  addEducation as addEducationApi,
  deleteEducation as deleteEducationApi,
  suggestProfiles,
  uploadAvatar,
} from "@/lib/network/profile";
import { useNetworkAvatar, notifyProfileUpdated } from "@/hooks/use-network-avatar";
import {
  listIncomingInvitations,
  sendInvitation,
  acceptInvitation as acceptInvitationApi,
  ignoreInvitation as ignoreInvitationApi,
  type ConnectionWithProfile,
} from "@/lib/network/connections";
import {
  listJobs,
  saveJob,
  unsaveJob,
  applyToJob,
  type JobFilters,
} from "@/lib/network/jobs";
import {
  listThreads,
  listMessages,
  sendMessage as sendMessageApi,
  markThreadRead,
  subscribeToThread,
} from "@/lib/network/messaging";
import {
  listNotifications,
  markRead as markNotifReadApi,
  markAllRead as markAllNotifsReadApi,
  subscribeToNotifications,
} from "@/lib/network/notifications";
import type {
  NetworkPost,
  PostComment,
  NetworkProfile,
  NetworkJob,
  Thread as LiveThread,
  NetworkMessage,
  NetworkNotification,
  ProfileExperience,
  ProfileEducation,
} from "@/types/network";

/* ─────────────────────────────────────────────────────────────────────────
   Lexram Network — LinkedIn structure with Indeed appearance.
   Maroon + cream palette.
   Home tab is wired to live Supabase data; other tabs still use seed data
   pending migration.
   ───────────────────────────────────────────────────────────────────────── */

const MAROON = "#7a1f2b";
const MAROON_DEEP = "#5e1721";
const MAROON_GRAD = `linear-gradient(135deg, ${MAROON} 0%, ${MAROON_DEEP} 100%)`;

type Tab = "home" | "network" | "jobs" | "messaging" | "notifications" | "profile";

/* ── auth helper ────────────────────────────────────────────────────────── */

function useAuthUserId(): string | null {
  const [id, setId] = React.useState<string | null>(null);
  React.useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(({ data }) => setId(data.user?.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) =>
      setId(session?.user?.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return id;
}

/* ── timestamp helper ───────────────────────────────────────────────────── */

function formatAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diffMs = Date.now() - t;
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(d / 365)}y`;
}

/* ── helpers ────────────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({
  name,
  avatarUrl,
  size = 44,
  square = false,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  square?: boolean;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`object-cover shrink-0 ${square ? "rounded-md" : "rounded-full"}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`grid place-items-center text-white font-semibold shrink-0 ${
        square ? "rounded-md" : "rounded-full"
      }`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.36)),
        background: MAROON_GRAD,
      }}
    >
      {getInitials(name)}
    </span>
  );
}

/* ── feed types + adapters (live) ───────────────────────────────────────── */

type FeedComment = {
  id: string;
  author: string;
  authorTitle: string;
  avatarUrl: string | null;
  body: string;
  postedAgo: string;
  isMine?: boolean;
};

type FeedPost = {
  id: string;
  author: string;
  authorTitle: string;
  avatarUrl: string | null;
  postedAgo: string;
  title?: string | null;
  body: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  likes: number;
  comments: number;
  reposts: number;
  isMine?: boolean;
  visibility?: "public" | "connections";
  commentList?: FeedComment[];
};

function adaptPost(p: NetworkPost, currentUserId: string): FeedPost {
  return {
    id: p.id,
    author: p.author?.display_name || "Lexram member",
    authorTitle: p.author?.headline || "",
    avatarUrl: p.author?.avatar_url ?? null,
    postedAgo: formatAgo(p.created_at),
    title: p.title ?? null,
    body: p.body,
    mediaUrl: p.media_url ?? null,
    mediaType: p.media_type ?? null,
    likes: p.likes_count,
    comments: p.comments_count,
    reposts: p.reposts_count,
    isMine: p.author_id === currentUserId,
    visibility: p.visibility,
  };
}

function adaptComment(c: PostComment, currentUserId: string): FeedComment {
  return {
    id: c.id,
    author: c.author?.display_name || "Lexram member",
    authorTitle: c.author?.headline || "",
    avatarUrl: c.author?.avatar_url ?? null,
    body: c.body,
    postedAgo: formatAgo(c.created_at),
    isMine: c.author_id === currentUserId,
  };
}

type Suggestion = { id: string; name: string; title: string; firm: string; mutual: number };

const DATE_OPTIONS = ["Any time", "Last 24 hours", "Last 3 days", "Last 7 days", "Last 14 days"] as const;
const SALARY_OPTIONS = ["Any", "₹6L+", "₹12L+", "₹25L+", "₹50L+"] as const;
const EXP_OPTIONS = ["Any", "Entry", "Mid", "Senior", "Manager"] as const;
const TYPE_OPTIONS = ["Any", "Full-time", "Part-time", "Contract"] as const;

const SALARY_FLOORS: Record<(typeof SALARY_OPTIONS)[number], number> = {
  Any: 0,
  "₹6L+": 600000,
  "₹12L+": 1200000,
  "₹25L+": 2500000,
  "₹50L+": 5000000,
};
const DATE_CAPS: Record<(typeof DATE_OPTIONS)[number], number> = {
  "Any time": Infinity,
  "Last 24 hours": 1,
  "Last 3 days": 3,
  "Last 7 days": 7,
  "Last 14 days": 14,
};

function formatSalary(low?: number | null, high?: number | null) {
  if (!low && !high) return "Not disclosed";
  const fmt = (n: number) =>
    n >= 10_00_000 ? `₹${(n / 10_00_000).toFixed(1).replace(/\.0$/, "")}L` : `₹${(n / 1000).toFixed(0)}k`;
  if (low && high) return `${fmt(low)} – ${fmt(high)}`;
  return fmt((low ?? high)!);
}

/* ── PAGE ───────────────────────────────────────────────────────────────── */

export default function NetworkPage() {
  const currentUser = useCurrentUser();
  const userName = getDisplayName(currentUser) || "You";

  const [activeTab, setActiveTab] = React.useState<Tab>("home");
  const [whatQuery, setWhatQuery] = React.useState("");
  const [whereQuery, setWhereQuery] = React.useState("");

  /* job filters */
  const [dateFilter, setDateFilter] = React.useState<(typeof DATE_OPTIONS)[number]>("Any time");
  const [salaryFilter, setSalaryFilter] = React.useState<(typeof SALARY_OPTIONS)[number]>("Any");
  const [expFilter, setExpFilter] = React.useState<(typeof EXP_OPTIONS)[number]>("Any");
  const [typeFilter, setTypeFilter] = React.useState<(typeof TYPE_OPTIONS)[number]>("Any");
  const [remoteOnly, setRemoteOnly] = React.useState(false);
  const [easyOnly, setEasyOnly] = React.useState(false);

  /* jobs (live) */
  const [jobs, setJobs] = React.useState<NetworkJob[]>([]);
  const [jobsLoading, setJobsLoading] = React.useState(true);
  const [savedJobs, setSavedJobs] = React.useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = React.useState<Set<string>>(new Set());
  const [selectedJobId, setSelectedJobId] = React.useState<string>("");

  /* network (live) */
  const [pendingInvites, setPendingInvites] = React.useState<Set<string>>(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState<Set<string>>(new Set());
  const [liveInvitations, setLiveInvitations] = React.useState<ConnectionWithProfile[]>([]);
  const [networkLoading, setNetworkLoading] = React.useState(true);

  /* home feed (live) */
  const userId = useAuthUserId();
  const [feed, setFeed] = React.useState<FeedPost[]>([]);
  const [feedLoading, setFeedLoading] = React.useState(true);
  const [likedPosts, setLikedPosts] = React.useState<Set<string>>(new Set());
  const [repostedPosts, setRepostedPosts] = React.useState<Set<string>>(new Set());
  const [openComments, setOpenComments] = React.useState<Set<string>>(new Set());
  const [editingPostId, setEditingPostId] = React.useState<string | null>(null);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [composerText, setComposerText] = React.useState("");
  const [composerTitle, setComposerTitle] = React.useState("");
  const [composerVisibility, setComposerVisibility] = React.useState<"public" | "connections">("public");
  const [composerMode, setComposerMode] = React.useState<"text" | "article">("text");
  const [composerMedia, setComposerMedia] = React.useState<{
    file: File;
    previewUrl: string;
    kind: "image" | "video";
  } | null>(null);
  const [composerUploading, setComposerUploading] = React.useState(false);
  const [liveSuggestions, setLiveSuggestions] = React.useState<NetworkProfile[]>([]);
  const myAvatarUrl = useNetworkAvatar();

  // Ensure a network_profiles row exists for the signed-in user.
  React.useEffect(() => {
    if (!userId) return;
    ensureProfile(userId, userName).catch((e) =>
      console.warn("[network] ensureProfile failed", e),
    );
  }, [userId, userName]);

  // Load feed + sidebar suggestions whenever the user changes.
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setFeedLoading(true);
      try {
        const [posts, sugg] = await Promise.all([
          listFeed(userId, 50),
          userId ? suggestProfiles(userId, 5) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        const adapted = posts.map((p) => adaptPost(p, userId ?? ""));
        setFeed(adapted);
        setLikedPosts(new Set(posts.filter((p) => p.liked_by_me).map((p) => p.id)));
        setRepostedPosts(new Set(posts.filter((p) => p.reposted_by_me).map((p) => p.id)));
        setLiveSuggestions(sugg);
      } catch (e) {
        if (!cancelled) console.error("[network] feed load failed", e);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Load incoming invitations for the My Network tab.
  React.useEffect(() => {
    if (!userId) {
      setLiveInvitations([]);
      setNetworkLoading(false);
      return;
    }
    let cancelled = false;
    setNetworkLoading(true);
    listIncomingInvitations(userId)
      .then((rows) => {
        if (!cancelled) setLiveInvitations(rows);
      })
      .catch((e) => console.error("[network] listIncomingInvitations failed", e))
      .finally(() => {
        if (!cancelled) setNetworkLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  /* messaging (live) */
  const [threads, setThreads] = React.useState<LiveThread[]>([]);
  const [threadsLoading, setThreadsLoading] = React.useState(true);
  const [activeThreadId, setActiveThreadId] = React.useState<string>("");
  const [messages, setMessages] = React.useState<NetworkMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  /* notifications (live) */
  const [notifications, setNotifications] = React.useState<NetworkNotification[]>([]);
  const [notifsLoading, setNotifsLoading] = React.useState(true);
  const [notifFilter, setNotifFilter] = React.useState<"all" | "unread">("all");

  const unreadMsgs = threads.reduce((s, t) => s + (t.unread_count ?? 0), 0);
  const unreadNotifs = notifications.filter((n) => n.unread).length;

  // Load threads + subscribe so the bell badge stays fresh.
  React.useEffect(() => {
    if (!userId) {
      setThreads([]);
      setThreadsLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setThreadsLoading(true);
      try {
        const rows = await listThreads(userId!);
        if (!cancelled) {
          setThreads(rows);
          if (rows.length && !activeThreadId) setActiveThreadId(rows[0].id);
        }
      } catch (e) {
        if (!cancelled) console.error("[network] listThreads failed", e);
      } finally {
        if (!cancelled) setThreadsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Load messages + realtime subscription when the active thread changes.
  React.useEffect(() => {
    if (!activeThreadId || !userId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessagesLoading(true);
    listMessages(activeThreadId)
      .then((rows) => {
        if (!cancelled) setMessages(rows);
      })
      .catch((e) => console.error("[network] listMessages failed", e))
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });
    markThreadRead(activeThreadId, userId).catch(() => {});
    const unsub = subscribeToThread(activeThreadId, (msg) => {
      setMessages((arr) => (arr.some((m) => m.id === msg.id) ? arr : [...arr, msg]));
      if (msg.sender_id !== userId) {
        markThreadRead(activeThreadId, userId).catch(() => {});
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [activeThreadId, userId]);

  // Load notifications + realtime so the bell badge stays fresh.
  React.useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setNotifsLoading(false);
      return;
    }
    let cancelled = false;
    setNotifsLoading(true);
    listNotifications(userId, { limit: 50 })
      .then((rows) => {
        if (!cancelled) setNotifications(rows);
      })
      .catch((e) => console.error("[network] listNotifications failed", e))
      .finally(() => {
        if (!cancelled) setNotifsLoading(false);
      });
    const unsub = subscribeToNotifications(userId, (n) => {
      setNotifications((arr) => (arr.some((x) => x.id === n.id) ? arr : [n, ...arr]));
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [userId]);

  const tabs = [
    { key: "home" as Tab, label: "Home", icon: <Home className="size-4" /> },
    { key: "network" as Tab, label: "My Network", icon: <Users className="size-4" /> },
    { key: "jobs" as Tab, label: "Jobs", icon: <Briefcase className="size-4" /> },
    { key: "messaging" as Tab, label: "Messaging", icon: <MessageSquare className="size-4" />, badge: unreadMsgs },
    { key: "notifications" as Tab, label: "Notifications", icon: <Bell className="size-4" />, badge: unreadNotifs },
    { key: "profile" as Tab, label: "Me", icon: <User className="size-4" /> },
  ];

  /* Load jobs whenever filters or auth user change. Debounced 250 ms to
     avoid hammering the DB while the user types in What/Where. */
  React.useEffect(() => {
    let cancelled = false;
    const filters: JobFilters = {
      query: whatQuery,
      location: whereQuery,
      level: expFilter,
      jobType: typeFilter,
      remoteOnly,
      easyOnly,
      salaryFloor: SALARY_FLOORS[salaryFilter],
      postedWithinDays: Number.isFinite(DATE_CAPS[dateFilter])
        ? DATE_CAPS[dateFilter]
        : undefined,
    };
    setJobsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const rows = await listJobs(filters, userId);
        if (cancelled) return;
        setJobs(rows);
        setSavedJobs(new Set(rows.filter((r) => r.saved_by_me).map((r) => r.id)));
        setAppliedJobs(new Set(rows.filter((r) => r.applied_by_me).map((r) => r.id)));
        if (rows.length && !rows.find((r) => r.id === selectedJobId)) {
          setSelectedJobId(rows[0].id);
        }
        if (!rows.length) setSelectedJobId("");
      } catch (e) {
        if (!cancelled) console.error("[network] listJobs failed", e);
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whatQuery, whereQuery, dateFilter, salaryFilter, expFilter, typeFilter, remoteOnly, easyOnly, userId]);

  /* handlers */
  const toggleSave = async (id: string) => {
    if (!userId) return;
    const was = savedJobs.has(id);
    setSavedJobs((s) => {
      const n = new Set(s);
      if (was) n.delete(id); else n.add(id);
      return n;
    });
    try {
      if (was) await unsaveJob(id, userId);
      else await saveJob(id, userId);
    } catch (e) {
      console.error("[network] save job failed", e);
      setSavedJobs((s) => {
        const n = new Set(s);
        if (was) n.add(id); else n.delete(id);
        return n;
      });
    }
  };
  const applyJob = async (id: string) => {
    if (!userId) return;
    if (appliedJobs.has(id)) return;
    setAppliedJobs((s) => new Set(s).add(id));
    try {
      await applyToJob(id, userId);
      setJobs((arr) =>
        arr.map((j) => (j.id === id ? { ...j, applicants_count: j.applicants_count + 1 } : j)),
      );
    } catch (e) {
      console.error("[network] applyJob failed", e);
      setAppliedJobs((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };
  const toggleInvite = async (id: string) => {
    if (!userId) return;
    // Toggle is one-shot for now: clicking "Connect" sends an invitation; the
    // UI flips to "Invited" and stays there for the session. We don't support
    // un-sending a pending invitation yet.
    if (pendingInvites.has(id)) return;
    setPendingInvites((s) => new Set(s).add(id));
    try {
      await sendInvitation(userId, id);
    } catch (e) {
      console.error("[network] sendInvitation failed", e);
      setPendingInvites((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };
  const dismissSuggestion = (id: string) => setDismissedSuggestions((s) => new Set(s).add(id));
  const acceptInvitation = async (connectionId: string) => {
    try {
      await acceptInvitationApi(connectionId);
      setLiveInvitations((arr) => arr.filter((i) => i.id !== connectionId));
    } catch (e) {
      console.error("[network] acceptInvitation failed", e);
    }
  };
  const ignoreInvitation = async (connectionId: string) => {
    try {
      await ignoreInvitationApi(connectionId);
      setLiveInvitations((arr) => arr.filter((i) => i.id !== connectionId));
    } catch (e) {
      console.error("[network] ignoreInvitation failed", e);
    }
  };

  const toggleLike = async (id: string) => {
    if (!userId) return;
    const wasLiked = likedPosts.has(id);
    // Optimistic
    setLikedPosts((s) => {
      const n = new Set(s);
      if (wasLiked) n.delete(id); else n.add(id);
      return n;
    });
    setFeed((arr) =>
      arr.map((p) => (p.id === id ? { ...p, likes: p.likes + (wasLiked ? -1 : 1) } : p)),
    );
    try {
      if (wasLiked) await unlikePost(id, userId);
      else await likePost(id, userId);
    } catch (e) {
      console.error("[network] like toggle failed", e);
      // Rollback
      setLikedPosts((s) => {
        const n = new Set(s);
        if (wasLiked) n.add(id); else n.delete(id);
        return n;
      });
      setFeed((arr) =>
        arr.map((p) => (p.id === id ? { ...p, likes: p.likes + (wasLiked ? 1 : -1) } : p)),
      );
    }
  };

  const toggleRepost = async (id: string) => {
    if (!userId) return;
    const wasReposted = repostedPosts.has(id);
    setRepostedPosts((s) => {
      const n = new Set(s);
      if (wasReposted) n.delete(id); else n.add(id);
      return n;
    });
    setFeed((arr) =>
      arr.map((p) => (p.id === id ? { ...p, reposts: p.reposts + (wasReposted ? -1 : 1) } : p)),
    );
    try {
      if (wasReposted) await unrepost(id, userId);
      else await repostApi(id, userId);
    } catch (e) {
      console.error("[network] repost toggle failed", e);
      setRepostedPosts((s) => {
        const n = new Set(s);
        if (wasReposted) n.add(id); else n.delete(id);
        return n;
      });
      setFeed((arr) =>
        arr.map((p) => (p.id === id ? { ...p, reposts: p.reposts + (wasReposted ? 1 : -1) } : p)),
      );
    }
  };

  const toggleComments = async (id: string) => {
    const isOpen = openComments.has(id);
    setOpenComments((s) => {
      const n = new Set(s);
      if (isOpen) n.delete(id); else n.add(id);
      return n;
    });
    // Lazy-load comments the first time the section is opened.
    if (!isOpen) {
      const post = feed.find((p) => p.id === id);
      if (post && post.commentList === undefined) {
        try {
          const rows = await listComments(id);
          const list = rows.map((c) => adaptComment(c, userId ?? ""));
          setFeed((arr) => arr.map((p) => (p.id === id ? { ...p, commentList: list } : p)));
        } catch (e) {
          console.error("[network] listComments failed", e);
        }
      }
    }
  };

  const addComment = async (postId: string, body: string) => {
    if (!userId) return;
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      const created = await addCommentApi(postId, userId, trimmed);
      const adapted = adaptComment(
        {
          ...created,
          author: {
            id: userId,
            display_name: userName,
            headline: "Lexram member",
            avatar_url: null,
          },
        },
        userId,
      );
      setFeed((arr) =>
        arr.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments + 1,
                commentList: [...(p.commentList ?? []), adapted],
              }
            : p,
        ),
      );
    } catch (e) {
      console.error("[network] addComment failed", e);
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteCommentApi(commentId);
      setFeed((arr) =>
        arr.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: Math.max(0, p.comments - 1),
                commentList: (p.commentList ?? []).filter((c) => c.id !== commentId),
              }
            : p,
        ),
      );
    } catch (e) {
      console.error("[network] deleteComment failed", e);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePostApi(id);
      setFeed((arr) => arr.filter((p) => p.id !== id));
      setLikedPosts((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      setRepostedPosts((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    } catch (e) {
      console.error("[network] deletePost failed", e);
    }
  };

  const updatePostBody = async (id: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await updatePostApi(id, trimmed);
      setFeed((arr) => arr.map((p) => (p.id === id ? { ...p, body: trimmed } : p)));
    } catch (e) {
      console.error("[network] updatePost failed", e);
    }
  };

  const pickComposerMedia = (file: File, kind: "image" | "video") => {
    // Defensive size limits — Supabase free tier caps single uploads at ~50 MB
    // and we don't want a half-uploaded post sitting in storage.
    const maxBytes = kind === "video" ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(
        kind === "video"
          ? "Video too large. Please pick one under 25 MB."
          : "Image too large. Please pick one under 5 MB.",
      );
      return;
    }
    if (composerMedia) {
      try {
        URL.revokeObjectURL(composerMedia.previewUrl);
      } catch {}
    }
    setComposerMedia({ file, previewUrl: URL.createObjectURL(file), kind });
  };

  const clearComposerMedia = () => {
    if (composerMedia) {
      try {
        URL.revokeObjectURL(composerMedia.previewUrl);
      } catch {}
    }
    setComposerMedia(null);
  };

  const resetComposer = () => {
    clearComposerMedia();
    setComposerText("");
    setComposerTitle("");
    setComposerMode("text");
    setComposerVisibility("public");
    setComposerOpen(false);
  };

  const publishPost = async () => {
    if (!userId) return;
    const text = composerText.trim();
    const title = composerTitle.trim();
    if (!text && !title && !composerMedia) return;
    setComposerUploading(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType: "image" | "video" | null = null;
      if (composerMedia) {
        const uploaded = await uploadPostMedia(userId, composerMedia.file);
        mediaUrl = uploaded.url;
        mediaType = uploaded.type;
      }
      const created = await createPost(userId, {
        body: text,
        visibility: composerVisibility,
        title: composerMode === "article" ? title : null,
        mediaUrl,
        mediaType,
      });
      const adapted = adaptPost(
        {
          ...created,
          author: {
            id: userId,
            display_name: userName,
            headline: "Lexram member",
            avatar_url: myAvatarUrl,
          },
        },
        userId,
      );
      setFeed((arr) => [adapted, ...arr]);
      resetComposer();
    } catch (e) {
      console.error("[network] createPost failed", e);
      alert("Couldn't publish the post. Please try again.");
    } finally {
      setComposerUploading(false);
    }
  };

  const openThread = (id: string) => {
    setActiveThreadId(id);
    setThreads((arr) => arr.map((t) => (t.id === id ? { ...t, unread_count: 0 } : t)));
    // markThreadRead also fires inside the activeThreadId effect; this just
    // makes the badge feel instant.
  };
  const sendMessage = async () => {
    if (!userId || !activeThreadId) return;
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    try {
      const created = await sendMessageApi(activeThreadId, userId, text);
      setMessages((arr) => (arr.some((m) => m.id === created.id) ? arr : [...arr, created]));
    } catch (e) {
      console.error("[network] sendMessage failed", e);
      setDraft(text);
    }
  };

  const markNotifRead = async (id: string) => {
    setNotifications((s) => s.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    try {
      await markNotifReadApi(id);
    } catch (e) {
      console.error("[network] markNotifRead failed", e);
    }
  };
  const markAllNotifsRead = async () => {
    if (!userId) return;
    setNotifications((s) => s.map((n) => ({ ...n, unread: false })));
    try {
      await markAllNotifsReadApi(userId);
    } catch (e) {
      console.error("[network] markAllNotifsRead failed", e);
    }
  };

  const clearFilters = () => {
    setDateFilter("Any time");
    setSalaryFilter("Any");
    setExpFilter("Any");
    setTypeFilter("Any");
    setRemoteOnly(false);
    setEasyOnly(false);
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  if (userId === null) {
    return (
      <div className="h-full grid place-items-center" style={{ background: "#faf7f4" }}>
        <div className="bg-white border rounded-lg p-8 max-w-md text-center" style={{ borderColor: "#ecdfd6" }}>
          <h1 className="text-lg font-semibold" style={{ color: MAROON_DEEP }}>
            Sign in to Lexram Network
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Connect with peers, share updates, and find work.
          </p>
          <a
            href="/sign-in"
            className="inline-block mt-4 text-sm text-white px-5 py-2 rounded-md"
            style={{ background: MAROON_GRAD }}
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto" style={{ background: "#faf7f4" }}>
      {/* HERO */}
      <div className="px-6 pt-6 pb-4 border-b" style={{ background: "white", borderColor: "#ecdfd6" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold" style={{ color: MAROON_DEEP }}>
            Lexram Network
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Connect with peers, find work, and grow your practice.
          </p>

          <div className="mt-4 flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center bg-white border rounded-md px-3" style={{ borderColor: "#e8d8cd" }}>
              <Search className="size-4 text-neutral-400" />
              <input
                className="bg-transparent outline-none px-2 py-2 text-sm w-full"
                placeholder="What — title, company, or keyword"
                value={whatQuery}
                onChange={(e) => setWhatQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center bg-white border rounded-md px-3" style={{ borderColor: "#e8d8cd" }}>
              <MapPin className="size-4 text-neutral-400" />
              <input
                className="bg-transparent outline-none px-2 py-2 text-sm w-full"
                placeholder="Where — city, state, or 'Remote'"
                value={whereQuery}
                onChange={(e) => setWhereQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setActiveTab("jobs")}
              className="text-white px-4 py-2 rounded-md text-sm font-medium"
              style={{ background: MAROON_GRAD }}
            >
              Find jobs
            </button>
          </div>

          {/* TABS */}
          <div className="mt-5 flex gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                    active ? "text-white" : "hover:bg-neutral-100 text-neutral-700"
                  }`}
                  style={active ? { background: MAROON_GRAD } : undefined}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {!!t.badge && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white">{t.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === "home" ? (
          <HomeView
            userName={userName}
            userAvatarUrl={myAvatarUrl}
            feed={feed}
            feedLoading={feedLoading}
            likedPosts={likedPosts}
            repostedPosts={repostedPosts}
            openComments={openComments}
            editingPostId={editingPostId}
            setEditingPostId={setEditingPostId}
            toggleLike={toggleLike}
            toggleRepost={toggleRepost}
            toggleComments={toggleComments}
            addComment={addComment}
            deleteComment={deleteComment}
            deletePost={deletePost}
            updatePostBody={updatePostBody}
            composerOpen={composerOpen}
            setComposerOpen={setComposerOpen}
            composerText={composerText}
            setComposerText={setComposerText}
            composerTitle={composerTitle}
            setComposerTitle={setComposerTitle}
            composerMode={composerMode}
            setComposerMode={setComposerMode}
            composerMedia={composerMedia}
            pickComposerMedia={pickComposerMedia}
            clearComposerMedia={clearComposerMedia}
            composerUploading={composerUploading}
            composerVisibility={composerVisibility}
            setComposerVisibility={setComposerVisibility}
            resetComposer={resetComposer}
            publishPost={publishPost}
            suggestions={liveSuggestions
              .filter((s) => !dismissedSuggestions.has(s.id))
              .slice(0, 5)
              .map<Suggestion>((p) => ({
                id: p.id,
                name: p.display_name || "Lexram member",
                title: (p.headline || "").split(" · ")[0] || p.headline || "",
                firm: (p.headline || "").includes(" · ")
                  ? (p.headline || "").split(" · ").slice(1).join(" · ")
                  : (p.location || ""),
                mutual: 0,
              }))}
            pendingInvites={pendingInvites}
            toggleInvite={toggleInvite}
            dismissSuggestion={dismissSuggestion}
          />
        ) : activeTab === "network" ? (
          <NetworkView
            loading={networkLoading}
            invitations={liveInvitations}
            suggestions={liveSuggestions.filter((s) => !dismissedSuggestions.has(s.id))}
            pendingInvites={pendingInvites}
            toggleInvite={toggleInvite}
            dismissSuggestion={dismissSuggestion}
            acceptInvitation={acceptInvitation}
            ignoreInvitation={ignoreInvitation}
          />
        ) : activeTab === "jobs" ? (
          <JobsView
            jobs={jobs}
            loading={jobsLoading}
            selectedJobId={selectedJobId}
            setSelectedJobId={setSelectedJobId}
            savedJobs={savedJobs}
            appliedJobs={appliedJobs}
            toggleSave={toggleSave}
            applyJob={applyJob}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            salaryFilter={salaryFilter}
            setSalaryFilter={setSalaryFilter}
            expFilter={expFilter}
            setExpFilter={setExpFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            remoteOnly={remoteOnly}
            setRemoteOnly={setRemoteOnly}
            easyOnly={easyOnly}
            setEasyOnly={setEasyOnly}
            clearFilters={clearFilters}
          />
        ) : activeTab === "messaging" ? (
          <MessagingView
            threads={threads}
            threadsLoading={threadsLoading}
            activeThreadId={activeThreadId}
            openThread={openThread}
            messages={messages}
            messagesLoading={messagesLoading}
            userId={userId}
            draft={draft}
            setDraft={setDraft}
            sendMessage={sendMessage}
          />
        ) : activeTab === "notifications" ? (
          <NotificationsView
            notifications={notifications}
            notifsLoading={notifsLoading}
            notifFilter={notifFilter}
            setNotifFilter={setNotifFilter}
            markNotifRead={markNotifRead}
            markAllNotifsRead={markAllNotifsRead}
          />
        ) : (
          <ProfileView userId={userId} userName={userName} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   HOME
   ───────────────────────────────────────────────────────────────────────── */

type ComposerMedia = { file: File; previewUrl: string; kind: "image" | "video" };

function HomeView(props: {
  userName: string;
  userAvatarUrl: string | null;
  feed: FeedPost[];
  feedLoading: boolean;
  likedPosts: Set<string>;
  repostedPosts: Set<string>;
  openComments: Set<string>;
  editingPostId: string | null;
  setEditingPostId: (id: string | null) => void;
  toggleLike: (id: string) => void;
  toggleRepost: (id: string) => void;
  toggleComments: (id: string) => void;
  addComment: (postId: string, body: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  deletePost: (id: string) => void;
  updatePostBody: (id: string, body: string) => void;
  composerOpen: boolean;
  setComposerOpen: (b: boolean) => void;
  composerText: string;
  setComposerText: (s: string) => void;
  composerTitle: string;
  setComposerTitle: (s: string) => void;
  composerMode: "text" | "article";
  setComposerMode: (m: "text" | "article") => void;
  composerMedia: ComposerMedia | null;
  pickComposerMedia: (file: File, kind: "image" | "video") => void;
  clearComposerMedia: () => void;
  composerUploading: boolean;
  composerVisibility: "public" | "connections";
  setComposerVisibility: (v: "public" | "connections") => void;
  resetComposer: () => void;
  publishPost: () => void;
  suggestions: Suggestion[];
  pendingInvites: Set<string>;
  toggleInvite: (id: string) => void;
  dismissSuggestion: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-4">
        {/* COMPOSER */}
        <Composer
          userName={props.userName}
          userAvatarUrl={props.userAvatarUrl}
          open={props.composerOpen}
          setOpen={props.setComposerOpen}
          text={props.composerText}
          setText={props.setComposerText}
          title={props.composerTitle}
          setTitle={props.setComposerTitle}
          mode={props.composerMode}
          setMode={props.setComposerMode}
          media={props.composerMedia}
          pickMedia={props.pickComposerMedia}
          clearMedia={props.clearComposerMedia}
          uploading={props.composerUploading}
          visibility={props.composerVisibility}
          setVisibility={props.setComposerVisibility}
          reset={props.resetComposer}
          publish={props.publishPost}
        />

        {/* FEED */}
        {props.feedLoading ? (
          <div className="bg-white border rounded-lg p-8 text-center text-sm text-neutral-500" style={{ borderColor: "#ecdfd6" }}>
            <Loader2 className="size-4 mx-auto mb-2 animate-spin" style={{ color: MAROON }} />
            Loading feed…
          </div>
        ) : props.feed.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center text-sm text-neutral-500" style={{ borderColor: "#ecdfd6" }}>
            No posts yet — be the first to share something.
          </div>
        ) : (
          props.feed.map((p) => (
            <FeedPostCard
              key={p.id}
              post={p}
              userName={props.userName}
              liked={props.likedPosts.has(p.id)}
              reposted={props.repostedPosts.has(p.id)}
              commentsOpen={props.openComments.has(p.id)}
              isEditing={props.editingPostId === p.id}
              startEdit={() => props.setEditingPostId(p.id)}
              stopEdit={() => props.setEditingPostId(null)}
              onLike={() => props.toggleLike(p.id)}
              onRepost={() => props.toggleRepost(p.id)}
              onToggleComments={() => props.toggleComments(p.id)}
              onAddComment={(body) => props.addComment(p.id, body)}
              onDeleteComment={(cid) => props.deleteComment(p.id, cid)}
              onDelete={() => props.deletePost(p.id)}
              onSaveEdit={(body) => {
                props.updatePostBody(p.id, body);
                props.setEditingPostId(null);
              }}
            />
          ))
        )}
      </div>

      <aside className="space-y-4">
        <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#ecdfd6" }}>
          <h3 className="text-sm font-semibold mb-3">People you may know</h3>
          <div className="space-y-3">
            {props.suggestions.map((s) => {
              const invited = props.pendingInvites.has(s.id);
              return (
                <div key={s.id} className="flex gap-3 items-start">
                  <Avatar name={s.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-neutral-500 truncate">{s.title} · {s.firm}</div>
                    <div className="text-[11px] text-neutral-400">{s.mutual} mutual</div>
                    <div className="mt-1 flex gap-1">
                      <button
                        onClick={() => props.toggleInvite(s.id)}
                        className="text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1"
                        style={{ borderColor: "#e8d8cd", color: MAROON }}
                      >
                        <UserPlus className="size-3" /> {invited ? "Invited" : "Connect"}
                      </button>
                      <button
                        onClick={() => props.dismissSuggestion(s.id)}
                        className="text-xs px-2 py-1 rounded-full hover:bg-neutral-100 text-neutral-400"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPOSER — LinkedIn-style: collapsed pill expands into a panel with the
   three action buttons (Photo / Video / Write article) below the textarea.
   ───────────────────────────────────────────────────────────────────────── */

function Composer(props: {
  userName: string;
  userAvatarUrl: string | null;
  open: boolean;
  setOpen: (b: boolean) => void;
  text: string;
  setText: (s: string) => void;
  title: string;
  setTitle: (s: string) => void;
  mode: "text" | "article";
  setMode: (m: "text" | "article") => void;
  media: ComposerMedia | null;
  pickMedia: (file: File, kind: "image" | "video") => void;
  clearMedia: () => void;
  uploading: boolean;
  visibility: "public" | "connections";
  setVisibility: (v: "public" | "connections") => void;
  reset: () => void;
  publish: () => void;
}) {
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const canPost =
    !!props.text.trim() ||
    !!props.title.trim() ||
    !!props.media;

  return (
    <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#ecdfd6" }}>
      {/* Collapsed row: avatar + pill input */}
      <div className="flex gap-3 items-center">
        <Avatar name={props.userName} avatarUrl={props.userAvatarUrl} />
        <button
          onClick={() => {
            props.setMode("text");
            props.setOpen(true);
          }}
          className="flex-1 text-left text-sm text-neutral-500 bg-neutral-50 hover:bg-neutral-100 rounded-full px-4 py-2 border"
          style={{ borderColor: "#ecdfd6" }}
        >
          Share a thought, a case win, or an opportunity…
        </button>
      </div>

      {/* LinkedIn-style action row: Video / Photo / Write article */}
      <div className="mt-3 grid grid-cols-3 gap-1">
        <button
          onClick={() => {
            props.setMode("text");
            props.setOpen(true);
            // Defer to ensure the file input is mounted before we click it.
            setTimeout(() => videoInputRef.current?.click(), 0);
          }}
          className="flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium text-neutral-600 hover:bg-neutral-50"
        >
          <VideoIcon className="size-4" style={{ color: "#22c55e" }} />
          Video
        </button>
        <button
          onClick={() => {
            props.setMode("text");
            props.setOpen(true);
            setTimeout(() => photoInputRef.current?.click(), 0);
          }}
          className="flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium text-neutral-600 hover:bg-neutral-50"
        >
          <ImageIcon className="size-4" style={{ color: "#3b82f6" }} />
          Photo
        </button>
        <button
          onClick={() => {
            props.setMode("article");
            props.setOpen(true);
          }}
          className="flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium text-neutral-600 hover:bg-neutral-50"
        >
          <FileText className="size-4" style={{ color: "#f97316" }} />
          Write article
        </button>
      </div>

      {/* Hidden file inputs — always mounted so the Video/Photo buttons can
          fire their click() without needing the panel to be open first. */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) props.pickMedia(f, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) props.pickMedia(f, "video");
          e.target.value = "";
        }}
      />

      {props.open && (
        <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: "#f0e3d8" }}>
          {props.mode === "article" && (
            <input
              autoFocus
              value={props.title}
              onChange={(e) => props.setTitle(e.target.value)}
              placeholder="Article title…"
              className="w-full border rounded-md px-3 py-2 text-sm font-semibold outline-none"
              style={{ borderColor: "#e8d8cd", color: MAROON_DEEP }}
            />
          )}
          <textarea
            autoFocus={props.mode !== "article"}
            value={props.text}
            onChange={(e) => props.setText(e.target.value)}
            placeholder={
              props.mode === "article"
                ? "Write your article…"
                : "What's on your mind?"
            }
            rows={props.mode === "article" ? 8 : 4}
            className="w-full border rounded-md px-3 py-2 text-sm outline-none"
            style={{ borderColor: "#e8d8cd" }}
          />

          {/* Media preview */}
          {props.media && (
            <div className="relative">
              {props.media.kind === "image" ? (
                <img
                  src={props.media.previewUrl}
                  alt="attachment"
                  className="rounded-md max-h-64 w-auto"
                />
              ) : (
                <video
                  src={props.media.previewUrl}
                  controls
                  className="rounded-md max-h-64 w-auto"
                />
              )}
              <button
                onClick={props.clearMedia}
                className="absolute top-2 right-2 size-6 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Remove media"
              >
                <X className="size-3" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <select
              value={props.visibility}
              onChange={(e) =>
                props.setVisibility(e.target.value as "public" | "connections")
              }
              className="text-xs px-2.5 py-1 rounded-full border bg-white outline-none"
              style={{ borderColor: "#e8d8cd", color: "#525252" }}
            >
              <option value="public">🌐 Anyone</option>
              <option value="connections">🤝 Connections only</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={props.reset}
                disabled={props.uploading}
                className="px-3 py-1.5 rounded-md text-sm hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={props.publish}
                disabled={!canPost || props.uploading}
                className="px-4 py-1.5 rounded-md text-sm text-white font-medium disabled:opacity-50 inline-flex items-center gap-1.5"
                style={{ background: MAROON_GRAD }}
              >
                {props.uploading && <Loader2 className="size-3.5 animate-spin" />}
                {props.uploading ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedPostCard(props: {
  post: FeedPost;
  userName: string;
  liked: boolean;
  reposted: boolean;
  commentsOpen: boolean;
  isEditing: boolean;
  startEdit: () => void;
  stopEdit: () => void;
  onLike: () => void;
  onRepost: () => void;
  onToggleComments: () => void;
  onAddComment: (body: string) => void;
  onDeleteComment: (commentId: string) => void;
  onDelete: () => void;
  onSaveEdit: (body: string) => void;
}) {
  const { post: p } = props;
  const [editText, setEditText] = React.useState(p.body);
  const [draft, setDraft] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (props.isEditing) setEditText(p.body);
  }, [props.isEditing, p.body]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submitComment() {
    if (!draft.trim()) return;
    props.onAddComment(draft);
    setDraft("");
  }

  return (
    <article className="bg-white border rounded-lg p-4" style={{ borderColor: "#ecdfd6" }}>
      <div className="flex gap-3">
        <Avatar name={p.author} avatarUrl={p.avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium">
                {p.author}
                {p.isMine && (
                  <span
                    className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full border align-middle"
                    style={{ borderColor: "#e8d8cd", color: MAROON }}
                  >
                    You
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500">{p.authorTitle}</div>
              <div className="text-xs text-neutral-400 flex items-center gap-1">
                {p.postedAgo}
                {p.visibility === "connections" && <span>· 🤝 Connections</span>}
              </div>
            </div>
            {p.isMine && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="p-1 rounded-md hover:bg-neutral-100 text-neutral-500"
                  aria-label="Post options"
                >
                  <span className="text-lg leading-none">⋯</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-7 z-10 bg-white border rounded-md shadow-lg min-w-[140px]" style={{ borderColor: "#ecdfd6" }}>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        props.startEdit();
                      }}
                      className="w-full text-left text-xs px-3 py-2 hover:bg-neutral-50 inline-flex items-center gap-2"
                    >
                      <Pencil className="size-3" /> Edit post
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        props.onDelete();
                      }}
                      className="w-full text-left text-xs px-3 py-2 hover:bg-neutral-50 inline-flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="size-3" /> Delete post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {props.isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                autoFocus
                rows={4}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#e8d8cd" }}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={props.stopEdit}
                  className="text-xs px-3 py-1.5 rounded-md hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => props.onSaveEdit(editText)}
                  disabled={!editText.trim()}
                  className="text-xs px-3 py-1.5 rounded-md text-white disabled:opacity-50"
                  style={{ background: MAROON_GRAD }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {p.title && (
                <h2
                  className="mt-2 text-base font-semibold leading-snug"
                  style={{ color: MAROON_DEEP }}
                >
                  {p.title}
                </h2>
              )}
              {p.body && (
                <p className="mt-2 text-sm text-neutral-800 whitespace-pre-wrap">
                  {p.body}
                </p>
              )}
              {p.mediaUrl && p.mediaType === "image" && (
                <img
                  src={p.mediaUrl}
                  alt="post media"
                  className="mt-2 rounded-md max-h-96 w-auto"
                />
              )}
              {p.mediaUrl && p.mediaType === "video" && (
                <video
                  src={p.mediaUrl}
                  controls
                  className="mt-2 rounded-md max-h-96 w-auto"
                />
              )}
            </>
          )}

          {/* counts row */}
          {(p.likes > 0 || p.comments > 0 || p.reposts > 0) && (
            <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500 border-b pb-2" style={{ borderColor: "#f0e3d8" }}>
              <span>{p.likes > 0 ? `${p.likes} like${p.likes === 1 ? "" : "s"}` : ""}</span>
              <span>
                {p.comments > 0 ? `${p.comments} comment${p.comments === 1 ? "" : "s"}` : ""}
                {p.comments > 0 && p.reposts > 0 ? " · " : ""}
                {p.reposts > 0 ? `${p.reposts} repost${p.reposts === 1 ? "" : "s"}` : ""}
              </span>
            </div>
          )}

          <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500 flex-wrap">
            <button
              onClick={props.onLike}
              className={`flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-100 ${props.liked ? "font-medium" : ""}`}
              style={props.liked ? { color: MAROON } : undefined}
            >
              <ThumbsUp className="size-3.5" fill={props.liked ? MAROON : "transparent"} stroke={props.liked ? MAROON : "currentColor"} />
              <span>{props.liked ? "Liked" : "Like"}</span>
            </button>
            <button
              onClick={props.onToggleComments}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-100"
            >
              <MessageCircle className="size-3.5" />
              <span>Comment</span>
            </button>
            <button
              onClick={props.onRepost}
              className={`flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-100 ${props.reposted ? "font-medium" : ""}`}
              style={props.reposted ? { color: MAROON } : undefined}
            >
              <Share2 className="size-3.5" stroke={props.reposted ? MAROON : "currentColor"} />
              <span>{props.reposted ? "Reposted" : "Repost"}</span>
            </button>
          </div>

          {/* COMMENTS */}
          {props.commentsOpen && (
            <div className="mt-3 border-t pt-3 space-y-2" style={{ borderColor: "#f0e3d8" }}>
              {p.commentList === undefined ? (
                <div className="text-xs text-neutral-400 flex items-center gap-2">
                  <Loader2 className="size-3 animate-spin" /> Loading comments…
                </div>
              ) : p.commentList.length === 0 ? (
                <div className="text-xs text-neutral-400">No comments yet — be the first.</div>
              ) : (
                p.commentList.map((c) => (
                  <div key={c.id} className="flex gap-2 items-start">
                    <Avatar name={c.author} avatarUrl={c.avatarUrl} size={28} />
                    <div className="flex-1 bg-neutral-50 rounded-md px-3 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-medium">
                            {c.author}
                            {c.isMine && (
                              <span
                                className="ml-1 text-[9px] px-1 py-0.5 rounded border align-middle"
                                style={{ borderColor: "#e8d8cd", color: MAROON }}
                              >
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-500">{c.authorTitle}</div>
                        </div>
                        {c.isMine && (
                          <button
                            onClick={() => props.onDeleteComment(c.id)}
                            className="text-neutral-400 hover:text-red-500"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-neutral-700 mt-0.5 whitespace-pre-wrap">{c.body}</div>
                      <div className="text-[10px] text-neutral-400">{c.postedAgo}</div>
                    </div>
                  </div>
                ))
              )}
              <div className="flex gap-2 items-center pt-1">
                <Avatar name={props.userName} size={28} />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                  placeholder="Add a comment…"
                  className="flex-1 border rounded-full px-3 py-1.5 text-xs outline-none"
                  style={{ borderColor: "#e8d8cd" }}
                />
                <button
                  onClick={submitComment}
                  disabled={!draft.trim()}
                  className="text-xs px-3 py-1.5 rounded-full text-white disabled:opacity-50"
                  style={{ background: MAROON_GRAD }}
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   NETWORK
   ───────────────────────────────────────────────────────────────────────── */

function NetworkView(props: {
  loading: boolean;
  invitations: ConnectionWithProfile[];
  suggestions: NetworkProfile[];
  pendingInvites: Set<string>;
  toggleInvite: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  acceptInvitation: (connectionId: string) => void;
  ignoreInvitation: (connectionId: string) => void;
}) {
  if (props.loading) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center text-sm text-neutral-500" style={{ borderColor: "#ecdfd6" }}>
        <Loader2 className="size-4 mx-auto mb-2 animate-spin" style={{ color: MAROON }} />
        Loading your network…
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#ecdfd6" }}>
        <h2 className="text-sm font-semibold mb-3">Invitations ({props.invitations.length})</h2>
        {props.invitations.length === 0 ? (
          <div className="text-sm text-neutral-500">No pending invitations.</div>
        ) : (
          <div className="space-y-3">
            {props.invitations.map((i) => {
              const name = i.other?.display_name || "Lexram member";
              const headline = i.other?.headline || "";
              return (
                <div key={i.id} className="flex items-center gap-3">
                  <Avatar name={name} avatarUrl={i.other?.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{name}</div>
                    <div className="text-xs text-neutral-500 truncate">{headline}</div>
                  </div>
                  <button onClick={() => props.ignoreInvitation(i.id)} className="text-xs px-3 py-1.5 rounded-full hover:bg-neutral-100">
                    Ignore
                  </button>
                  <button
                    onClick={() => props.acceptInvitation(i.id)}
                    className="text-xs px-3 py-1.5 rounded-full text-white"
                    style={{ background: MAROON_GRAD }}
                  >
                    Accept
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#ecdfd6" }}>
        <h2 className="text-sm font-semibold mb-3">People you may know</h2>
        {props.suggestions.length === 0 ? (
          <div className="text-sm text-neutral-500">No suggestions yet — invite peers to grow your network.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {props.suggestions.map((s) => {
              const invited = props.pendingInvites.has(s.id);
              return (
                <div key={s.id} className="border rounded-lg p-3 flex gap-3 items-start" style={{ borderColor: "#ecdfd6" }}>
                  <Avatar name={s.display_name || "Lexram member"} avatarUrl={s.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.display_name || "Lexram member"}</div>
                    <div className="text-xs text-neutral-500 truncate">{s.headline || ""}</div>
                    <div className="text-[11px] text-neutral-400">{s.location || ""}</div>
                    <button
                      onClick={() => props.toggleInvite(s.id)}
                      disabled={invited}
                      className="mt-2 text-xs px-3 py-1 rounded-full border inline-flex items-center gap-1 disabled:opacity-50"
                      style={{ borderColor: "#e8d8cd", color: MAROON }}
                    >
                      <UserPlus className="size-3" /> {invited ? "Invited" : "Connect"}
                    </button>
                  </div>
                  <button onClick={() => props.dismissSuggestion(s.id)} className="text-neutral-400 hover:text-red-500">
                    <X className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   JOBS
   ───────────────────────────────────────────────────────────────────────── */

function JobsView(props: {
  jobs: NetworkJob[];
  loading: boolean;
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
  savedJobs: Set<string>;
  appliedJobs: Set<string>;
  toggleSave: (id: string) => void;
  applyJob: (id: string) => void;
  dateFilter: (typeof DATE_OPTIONS)[number];
  setDateFilter: (v: (typeof DATE_OPTIONS)[number]) => void;
  salaryFilter: (typeof SALARY_OPTIONS)[number];
  setSalaryFilter: (v: (typeof SALARY_OPTIONS)[number]) => void;
  expFilter: (typeof EXP_OPTIONS)[number];
  setExpFilter: (v: (typeof EXP_OPTIONS)[number]) => void;
  typeFilter: (typeof TYPE_OPTIONS)[number];
  setTypeFilter: (v: (typeof TYPE_OPTIONS)[number]) => void;
  remoteOnly: boolean;
  setRemoteOnly: (b: boolean) => void;
  easyOnly: boolean;
  setEasyOnly: (b: boolean) => void;
  clearFilters: () => void;
}) {
  const selected = props.jobs.find((j) => j.id === props.selectedJobId) ?? props.jobs[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <DropdownChip label="Posted" value={props.dateFilter} options={DATE_OPTIONS} onChange={props.setDateFilter} />
        <DropdownChip label="Salary" value={props.salaryFilter} options={SALARY_OPTIONS} onChange={props.setSalaryFilter} />
        <DropdownChip label="Experience" value={props.expFilter} options={EXP_OPTIONS} onChange={props.setExpFilter} />
        <DropdownChip label="Type" value={props.typeFilter} options={TYPE_OPTIONS} onChange={props.setTypeFilter} />
        <ToggleChip label="Remote" on={props.remoteOnly} onChange={props.setRemoteOnly} />
        <ToggleChip label="Easy apply" on={props.easyOnly} onChange={props.setEasyOnly} />
        <button onClick={props.clearFilters} className="text-xs text-neutral-500 hover:text-neutral-800 px-2">
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <div className="bg-white border rounded-lg max-h-[70vh] overflow-y-auto" style={{ borderColor: "#ecdfd6" }}>
          {props.loading ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              <Loader2 className="size-4 mx-auto mb-2 animate-spin" style={{ color: MAROON }} />
              Loading jobs…
            </div>
          ) : props.jobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">No jobs match your filters.</div>
          ) : (
            props.jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => props.setSelectedJobId(j.id)}
                className={`w-full text-left p-3 border-b hover:bg-neutral-50 ${props.selectedJobId === j.id ? "bg-neutral-50" : ""}`}
                style={{ borderColor: "#f0e3d8" }}
              >
                <div className="flex gap-3">
                  <div className="size-10 rounded-md grid place-items-center text-white shrink-0" style={{ background: MAROON_GRAD }}>
                    <Building2 className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{j.title}</div>
                    <div className="text-xs text-neutral-600 truncate">{j.company}</div>
                    <div className="text-xs text-neutral-500 truncate">{j.location}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{formatAgo(j.created_at)} · {j.applicants_count} applicants</div>
                  </div>
                  {props.savedJobs.has(j.id) && <BookmarkCheck className="size-4" style={{ color: MAROON }} />}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="bg-white border rounded-lg p-5 max-h-[70vh] overflow-y-auto" style={{ borderColor: "#ecdfd6" }}>
          {!selected ? (
            <div className="grid place-items-center h-full text-sm text-neutral-500">
              {props.loading ? "Loading…" : "Select a job to see details."}
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="size-12 rounded-md grid place-items-center text-white shrink-0" style={{ background: MAROON_GRAD }}>
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">{selected.title}</h2>
                    <div className="text-sm text-neutral-600">{selected.company}</div>
                    <div className="text-xs text-neutral-500">
                      {selected.location} · {selected.job_type} · {selected.level}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {formatSalary(selected.salary_low, selected.salary_high)} · {selected.applicants_count} applicants
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => props.toggleSave(selected.id)}
                  className="p-2 rounded-md hover:bg-neutral-100"
                >
                  {props.savedJobs.has(selected.id) ? (
                    <BookmarkCheck className="size-5" style={{ color: MAROON }} />
                  ) : (
                    <Bookmark className="size-5 text-neutral-600" />
                  )}
                </button>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => props.applyJob(selected.id)}
                  disabled={props.appliedJobs.has(selected.id)}
                  className="text-sm font-medium px-4 py-2 rounded-md text-white disabled:opacity-50"
                  style={{ background: MAROON_GRAD }}
                >
                  {props.appliedJobs.has(selected.id) ? "Applied ✓" : selected.easy_apply ? "Easy apply" : "Apply"}
                </button>
              </div>

              <DetailSection title="About the role">
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selected.description}</p>
              </DetailSection>
              {selected.responsibilities.length > 0 && (
                <DetailSection title="Responsibilities">
                  <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-700">
                    {selected.responsibilities.map((r, i) => (<li key={i}>{r}</li>))}
                  </ul>
                </DetailSection>
              )}
              {selected.qualifications.length > 0 && (
                <DetailSection title="Qualifications">
                  <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-700">
                    {selected.qualifications.map((r, i) => (<li key={i}>{r}</li>))}
                  </ul>
                </DetailSection>
              )}
              {selected.benefits.length > 0 && (
                <DetailSection title="Benefits">
                  <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-700">
                    {selected.benefits.map((r, i) => (<li key={i}>{r}</li>))}
                  </ul>
                </DetailSection>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">{title}</h3>
      {children}
    </div>
  );
}

function DropdownChip<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void; }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const active = value !== options[0];
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs px-3 py-1.5 rounded-full border bg-white hover:bg-neutral-50"
        style={{ borderColor: active ? MAROON : "#e8d8cd", color: active ? MAROON : "#525252" }}
      >
        {label}: <span className="font-medium">{value}</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg min-w-[160px]" style={{ borderColor: "#ecdfd6" }}>
          {options.map((o) => (
            <button
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              className={`block w-full text-left text-xs px-3 py-2 hover:bg-neutral-50 ${o === value ? "font-medium" : ""}`}
              style={o === value ? { color: MAROON } : undefined}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleChip({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="text-xs px-3 py-1.5 rounded-full border"
      style={{
        borderColor: on ? MAROON : "#e8d8cd",
        background: on ? "#fdf2f3" : "white",
        color: on ? MAROON : "#525252",
      }}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MESSAGING
   ───────────────────────────────────────────────────────────────────────── */

function MessagingView(props: {
  threads: LiveThread[];
  threadsLoading: boolean;
  activeThreadId: string;
  openThread: (id: string) => void;
  messages: NetworkMessage[];
  messagesLoading: boolean;
  userId: string | null;
  draft: string;
  setDraft: (s: string) => void;
  sendMessage: () => void;
}) {
  const endRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [props.messages, props.activeThreadId]);

  const active = props.threads.find((t) => t.id === props.activeThreadId);
  const otherName = active?.participants[0]?.display_name || "Lexram member";
  const otherHeadline = active?.participants[0]?.headline || "";
  const otherAvatar = active?.participants[0]?.avatar_url ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[70vh]">
      <div className="bg-white border rounded-lg overflow-y-auto" style={{ borderColor: "#ecdfd6" }}>
        {props.threadsLoading ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            <Loader2 className="size-4 mx-auto mb-2 animate-spin" style={{ color: MAROON }} />
            Loading conversations…
          </div>
        ) : props.threads.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No conversations yet. Accept a connection request to start one.
          </div>
        ) : (
          props.threads.map((t) => {
            const name = t.participants[0]?.display_name || "Lexram member";
            const headline = t.participants[0]?.headline || "";
            const unread = t.unread_count ?? 0;
            return (
              <button
                key={t.id}
                onClick={() => props.openThread(t.id)}
                className={`w-full text-left p-3 border-b hover:bg-neutral-50 ${props.activeThreadId === t.id ? "bg-neutral-50" : ""}`}
                style={{ borderColor: "#f0e3d8" }}
              >
                <div className="flex gap-3">
                  <Avatar name={name} avatarUrl={t.participants[0]?.avatar_url} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium truncate">{name}</div>
                      {!!unread && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white">{unread}</span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 truncate">{headline}</div>
                    <div className="text-[10px] text-neutral-400">{formatAgo(t.last_message_at)}</div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="bg-white border rounded-lg flex flex-col" style={{ borderColor: "#ecdfd6" }}>
        {!active ? (
          <div className="flex-1 grid place-items-center text-sm text-neutral-500">
            <div className="text-center">
              <Mail className="size-8 mx-auto mb-2 text-neutral-300" />
              Pick a conversation to start chatting.
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b flex items-center gap-3" style={{ borderColor: "#f0e3d8" }}>
              <Avatar name={otherName} avatarUrl={otherAvatar} size={36} />
              <div>
                <div className="text-sm font-medium">{otherName}</div>
                <div className="text-xs text-neutral-500">{otherHeadline}</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {props.messagesLoading ? (
                <div className="text-center text-sm text-neutral-500 mt-8">
                  <Loader2 className="size-4 mx-auto mb-2 animate-spin" style={{ color: MAROON }} />
                  Loading messages…
                </div>
              ) : props.messages.length === 0 ? (
                <div className="text-center text-sm text-neutral-500 mt-8">No messages yet.</div>
              ) : (
                props.messages.map((m) => {
                  const isMine = m.sender_id === props.userId;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-[70%] rounded-lg px-3 py-2 text-sm"
                        style={
                          isMine
                            ? { background: MAROON_GRAD, color: "white" }
                            : { background: "#f5efe9", color: "#262626" }
                        }
                      >
                        <div className="whitespace-pre-wrap">{m.body}</div>
                        <div className={`text-[10px] mt-1 ${isMine ? "text-white/70" : "text-neutral-500"}`}>
                          {formatAgo(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t flex gap-2" style={{ borderColor: "#f0e3d8" }}>
              <input
                value={props.draft}
                onChange={(e) => props.setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && props.sendMessage()}
                placeholder="Type a message…"
                className="flex-1 border rounded-full px-4 py-2 text-sm outline-none"
                style={{ borderColor: "#e8d8cd" }}
              />
              <button
                onClick={props.sendMessage}
                disabled={!props.draft.trim()}
                className="px-4 py-2 rounded-full text-white text-sm disabled:opacity-50"
                style={{ background: MAROON_GRAD }}
              >
                <Send className="size-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   NOTIFICATIONS
   ───────────────────────────────────────────────────────────────────────── */

function describeNotification(n: NetworkNotification): string {
  switch (n.kind) {
    case "connection_request":
      return "sent you a connection request";
    case "connection_accepted":
      return "accepted your connection request";
    case "post_like":
      return "liked your post";
    case "post_comment":
      return "commented on your post";
    case "job_posted":
      return "posted a new job";
    case "message":
      return "sent you a message";
    case "profile_view":
      return "viewed your profile";
    default:
      return "";
  }
}

function NotificationsView(props: {
  notifications: NetworkNotification[];
  notifsLoading: boolean;
  notifFilter: "all" | "unread";
  setNotifFilter: (v: "all" | "unread") => void;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
}) {
  const items = props.notifications.filter(
    (n) => props.notifFilter === "all" || n.unread,
  );

  return (
    <div className="bg-white border rounded-lg" style={{ borderColor: "#ecdfd6" }}>
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "#f0e3d8" }}>
        <div className="flex gap-1">
          <button
            onClick={() => props.setNotifFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-full ${props.notifFilter === "all" ? "text-white" : "hover:bg-neutral-100"}`}
            style={props.notifFilter === "all" ? { background: MAROON_GRAD } : undefined}
          >
            All
          </button>
          <button
            onClick={() => props.setNotifFilter("unread")}
            className={`text-xs px-3 py-1.5 rounded-full ${props.notifFilter === "unread" ? "text-white" : "hover:bg-neutral-100"}`}
            style={props.notifFilter === "unread" ? { background: MAROON_GRAD } : undefined}
          >
            Unread
          </button>
        </div>
        <button onClick={props.markAllNotifsRead} className="text-xs text-neutral-500 hover:text-neutral-800">
          Mark all read
        </button>
      </div>
      {props.notifsLoading ? (
        <div className="p-8 text-center text-sm text-neutral-500">
          <Loader2 className="size-4 mx-auto mb-2 animate-spin" style={{ color: MAROON }} />
          Loading notifications…
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-neutral-500">Nothing here.</div>
      ) : (
        <div className="divide-y" style={{ borderColor: "#f0e3d8" }}>
          {items.map((n) => {
            const actorName = n.actor?.display_name || "Someone";
            return (
              <button
                key={n.id}
                onClick={() => props.markNotifRead(n.id)}
                className={`w-full text-left p-3 flex gap-3 hover:bg-neutral-50 ${n.unread ? "bg-amber-50/40" : ""}`}
              >
                <Avatar name={actorName} avatarUrl={n.actor?.avatar_url} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">{actorName}</span>{" "}
                    <span className="text-neutral-600">{describeNotification(n)}</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">{formatAgo(n.created_at)}</div>
                </div>
                {n.unread && <span className="size-2 rounded-full mt-2" style={{ background: MAROON }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PROFILE
   ───────────────────────────────────────────────────────────────────────── */

type ProfileBasics = {
  displayName: string;
  headline: string;
  location: string;
  about: string;
  website: string;
  avatarUrl: string | null;
};

type ExperienceFormValues = {
  title: string;
  company: string;
  location: string;
  startYear: string;
  endYear: string; // empty = Present
  description: string;
};

type EducationFormValues = {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
};

function yearToDate(year: string): string | null {
  const y = parseInt(year, 10);
  if (!Number.isFinite(y) || y < 1900 || y > 2200) return null;
  return `${y}-01-01`;
}
function dateToYear(d: string | null): string {
  if (!d) return "";
  const y = parseInt(d.slice(0, 4), 10);
  return Number.isFinite(y) ? String(y) : "";
}

function ProfileView({ userId, userName }: { userId: string | null; userName: string }) {
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<ProfileBasics>({
    displayName: userName,
    headline: "",
    location: "",
    about: "",
    website: "",
    avatarUrl: null,
  });
  const [experiences, setExperiences] = React.useState<ProfileExperience[]>([]);
  const [educations, setEducations] = React.useState<ProfileEducation[]>([]);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [languages, setLanguages] = React.useState<string[]>([]);
  const [editOpen, setEditOpen] = React.useState(false);
  const [expModalOpen, setExpModalOpen] = React.useState(false);
  const [eduModalOpen, setEduModalOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [p, exps, edus] = await Promise.all([
          getProfile(userId!),
          listExperiences(userId!),
          listEducations(userId!),
        ]);
        if (cancelled) return;
        if (p) {
          setProfile({
            displayName: p.display_name || userName,
            headline: p.headline || "",
            location: p.location || "",
            about: p.about || "",
            website: p.website || "",
            avatarUrl: p.avatar_url ?? null,
          });
          setSkills(p.skills || []);
          setLanguages(p.languages || []);
        }
        setExperiences(exps);
        setEducations(edus);
      } catch (e) {
        if (!cancelled) console.error("[network] profile load failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, userName]);

  const profileViews = 0;

  async function onAvatarPick(file: File) {
    if (!userId) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(userId, file);
      setProfile((p) => ({ ...p, avatarUrl: url }));
      notifyProfileUpdated();
    } catch (e) {
      console.error("[network] uploadAvatar failed", e);
      alert("Avatar upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function removeExperience(id: string) {
    if (!confirm("Remove this experience?")) return;
    setExperiences((arr) => arr.filter((e) => e.id !== id));
    try {
      await deleteExperienceApi(id);
    } catch (e) {
      console.error("[network] deleteExperience failed", e);
    }
  }
  async function removeEducation(id: string) {
    if (!confirm("Remove this education entry?")) return;
    setEducations((arr) => arr.filter((e) => e.id !== id));
    try {
      await deleteEducationApi(id);
    } catch (e) {
      console.error("[network] deleteEducation failed", e);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center text-sm text-neutral-500" style={{ borderColor: "#ecdfd6" }}>
        <Loader2 className="size-4 mx-auto mb-2 animate-spin" style={{ color: MAROON }} />
        Loading your profile…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: "#ecdfd6" }}>
        <div className="h-24" style={{ background: MAROON_GRAD }} />
        <div className="px-5 pb-5 -mt-10">
          <div className="flex items-end justify-between">
            <div className="relative">
              <Avatar name={profile.displayName} avatarUrl={profile.avatarUrl} size={80} />
              <label className="absolute bottom-0 right-0 size-6 rounded-full bg-white border grid place-items-center cursor-pointer" style={{ borderColor: "#e8d8cd" }}>
                {uploading ? (
                  <Loader2 className="size-3 animate-spin" style={{ color: MAROON }} />
                ) : (
                  <Camera className="size-3" style={{ color: MAROON }} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onAvatarPick(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="text-xs px-3 py-1.5 rounded-full border hover:bg-neutral-50 inline-flex items-center gap-1"
              style={{ borderColor: "#e8d8cd", color: MAROON }}
            >
              <Pencil className="size-3" /> Edit profile
            </button>
          </div>
          <div className="mt-3">
            <h1 className="text-lg font-semibold">{profile.displayName || userName}</h1>
            <div className="text-sm text-neutral-700">{profile.headline}</div>
            <div className="text-xs text-neutral-500">{profile.location}</div>
            <div className="text-xs text-neutral-500 mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3.5" /> {profileViews} profile views
              </span>
              {profile.website && (
                <a
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 hover:underline"
                  style={{ color: MAROON }}
                >
                  <Link2 className="size-3.5" /> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProfileSection
        title="About"
        action={
          <button onClick={() => setEditOpen(true)} className="text-xs text-neutral-500 hover:text-neutral-800 inline-flex items-center gap-1">
            <Pencil className="size-3" /> Edit
          </button>
        }
      >
        <p className="text-sm text-neutral-700 whitespace-pre-wrap">{profile.about || "No bio yet."}</p>
      </ProfileSection>

      <ProfileSection
        title="Experience"
        action={
          <button onClick={() => setExpModalOpen(true)} className="text-xs inline-flex items-center gap-1" style={{ color: MAROON }}>
            <Plus className="size-3" /> Add
          </button>
        }
      >
        {experiences.length === 0 ? (
          <div className="text-sm text-neutral-500">No experience added yet.</div>
        ) : (
          <div className="space-y-3">
            {experiences.map((e) => (
              <div key={e.id} className="flex items-start gap-3">
                <div className="size-9 rounded-md grid place-items-center text-white shrink-0" style={{ background: MAROON_GRAD }}>
                  <Briefcase className="size-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="text-xs text-neutral-600">
                    {e.company}
                    {e.location ? ` · ${e.location}` : ""}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {dateToYear(e.start_date) || "—"} – {dateToYear(e.end_date) || "Present"}
                  </div>
                  {e.description && <p className="text-xs text-neutral-700 mt-1 whitespace-pre-wrap">{e.description}</p>}
                </div>
                <button onClick={() => removeExperience(e.id)} className="text-neutral-400 hover:text-red-500">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection
        title="Education"
        action={
          <button onClick={() => setEduModalOpen(true)} className="text-xs inline-flex items-center gap-1" style={{ color: MAROON }}>
            <Plus className="size-3" /> Add
          </button>
        }
      >
        {educations.length === 0 ? (
          <div className="text-sm text-neutral-500">No education entries yet.</div>
        ) : (
          <div className="space-y-3">
            {educations.map((e) => (
              <div key={e.id} className="flex items-start gap-3">
                <div className="size-9 rounded-md grid place-items-center text-white shrink-0" style={{ background: MAROON_GRAD }}>
                  <GraduationCap className="size-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{e.school}</div>
                  <div className="text-xs text-neutral-600">
                    {e.degree || ""}
                    {e.degree && e.field ? " · " : ""}
                    {e.field || ""}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {e.start_year || "—"} – {e.end_year || "Present"}
                  </div>
                </div>
                <button onClick={() => removeEducation(e.id)} className="text-neutral-400 hover:text-red-500">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="Skills">
        {skills.length === 0 ? (
          <div className="text-sm text-neutral-500">No skills added.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1" style={{ borderColor: "#e8d8cd", color: MAROON }}>
                {s}
                <button
                  onClick={() => setSkills((arr) => arr.filter((x) => x !== s))}
                  className="hover:text-red-500 opacity-60 hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="Languages">
        {languages.length === 0 ? (
          <div className="text-sm text-neutral-500">No languages added.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <span key={l} className="text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1" style={{ borderColor: "#e8d8cd" }}>
                <Languages className="size-3" /> {l}
                <button
                  onClick={() => setLanguages((arr) => arr.filter((x) => x !== l))}
                  className="hover:text-red-500 opacity-60 hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </ProfileSection>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          skills={skills}
          languages={languages}
          onClose={() => setEditOpen(false)}
          onSave={async (next, nextSkills, nextLanguages) => {
            if (!userId) {
              setEditOpen(false);
              return;
            }
            setProfile(next);
            setSkills(nextSkills);
            setLanguages(nextLanguages);
            setEditOpen(false);
            try {
              await updateProfile(userId, {
                display_name: next.displayName,
                headline: next.headline,
                location: next.location,
                about: next.about,
                website: next.website || null,
                skills: nextSkills,
                languages: nextLanguages,
              });
            } catch (e) {
              console.error("[network] updateProfile failed", e);
            }
          }}
        />
      )}
      {expModalOpen && (
        <ExperienceModal
          onClose={() => setExpModalOpen(false)}
          onSave={async (exp) => {
            if (!userId) {
              setExpModalOpen(false);
              return;
            }
            setExpModalOpen(false);
            try {
              const created = await addExperienceApi(userId, {
                title: exp.title,
                company: exp.company,
                location: exp.location || null,
                start_date: yearToDate(exp.startYear),
                end_date: yearToDate(exp.endYear),
                description: exp.description || null,
              });
              setExperiences((arr) => [created, ...arr]);
            } catch (e) {
              console.error("[network] addExperience failed", e);
            }
          }}
        />
      )}
      {eduModalOpen && (
        <EducationModal
          onClose={() => setEduModalOpen(false)}
          onSave={async (edu) => {
            if (!userId) {
              setEduModalOpen(false);
              return;
            }
            setEduModalOpen(false);
            try {
              const created = await addEducationApi(userId, {
                school: edu.school,
                degree: edu.degree || null,
                field: edu.field || null,
                start_year: edu.startYear ? parseInt(edu.startYear, 10) || null : null,
                end_year: edu.endYear ? parseInt(edu.endYear, 10) || null : null,
                description: null,
              });
              setEducations((arr) => [created, ...arr]);
            } catch (e) {
              console.error("[network] addEducation failed", e);
            }
          }}
        />
      )}
    </div>
  );
}

function ProfileSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#ecdfd6" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ── Profile modals ─────────────────────────────────────────────────────── */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "#ecdfd6" }}>
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-600 mb-1">{label}</div>
      {children}
    </label>
  );
}

function ModalFooter({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="pt-4 mt-2 border-t flex justify-end gap-2" style={{ borderColor: "#ecdfd6" }}>
      <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-md hover:bg-neutral-100">
        Cancel
      </button>
      {children}
    </div>
  );
}

function EditProfileModal({
  profile,
  skills,
  languages,
  onClose,
  onSave,
}: {
  profile: ProfileBasics;
  skills: string[];
  languages: string[];
  onClose: () => void;
  onSave: (next: ProfileBasics, skills: string[], languages: string[]) => void;
}) {
  const [form, setForm] = React.useState({
    displayName: profile.displayName,
    headline: profile.headline,
    location: profile.location,
    about: profile.about,
    website: profile.website,
    skills: skills.join(", "),
    languages: languages.join(", "),
  });

  function save() {
    onSave(
      {
        ...profile,
        displayName: form.displayName.trim() || profile.displayName,
        headline: form.headline,
        location: form.location,
        about: form.about,
        website: form.website,
      },
      form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      form.languages.split(",").map((s) => s.trim()).filter(Boolean),
    );
  }

  return (
    <Modal title="Edit profile" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Display name">
          <input
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            style={{ borderColor: "#e8d8cd" }}
          />
        </Field>
        <Field label="Headline">
          <input
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            placeholder="e.g. Senior Counsel · Tax Litigation"
            className="w-full border rounded-md px-3 py-2 text-sm"
            style={{ borderColor: "#e8d8cd" }}
          />
        </Field>
        <Field label="Location">
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            style={{ borderColor: "#e8d8cd" }}
          />
        </Field>
        <Field label="About">
          <textarea
            rows={4}
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            style={{ borderColor: "#e8d8cd" }}
          />
        </Field>
        <Field label="Website">
          <input
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://yourwebsite.com"
            className="w-full border rounded-md px-3 py-2 text-sm"
            style={{ borderColor: "#e8d8cd" }}
          />
        </Field>
        <Field label="Skills (comma separated)">
          <input
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            style={{ borderColor: "#e8d8cd" }}
          />
        </Field>
        <Field label="Languages (comma separated)">
          <input
            value={form.languages}
            onChange={(e) => setForm({ ...form, languages: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            style={{ borderColor: "#e8d8cd" }}
          />
        </Field>
      </div>
      <ModalFooter onClose={onClose}>
        <button onClick={save} className="text-sm px-4 py-1.5 rounded-md text-white" style={{ background: MAROON_GRAD }}>
          Save
        </button>
      </ModalFooter>
    </Modal>
  );
}

function ExperienceModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (e: ExperienceFormValues) => void;
}) {
  const [form, setForm] = React.useState({
    title: "",
    company: "",
    location: "",
    startYear: "",
    endYear: "",
    description: "",
  });

  function save() {
    if (!form.title || !form.company) {
      alert("Title and company are required.");
      return;
    }
    onSave(form);
  }

  return (
    <Modal title="Add experience" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Title">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
        </Field>
        <Field label="Company">
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
        </Field>
        <Field label="Location">
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start year">
            <input value={form.startYear} onChange={(e) => setForm({ ...form, startYear: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
          </Field>
          <Field label="End year (blank = Present)">
            <input value={form.endYear} onChange={(e) => setForm({ ...form, endYear: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
          </Field>
        </div>
        <Field label="Description">
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
        </Field>
      </div>
      <ModalFooter onClose={onClose}>
        <button onClick={save} className="text-sm px-4 py-1.5 rounded-md text-white" style={{ background: MAROON_GRAD }}>
          Add
        </button>
      </ModalFooter>
    </Modal>
  );
}

function EducationModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (e: EducationFormValues) => void;
}) {
  const [form, setForm] = React.useState({
    school: "",
    degree: "",
    field: "",
    startYear: "",
    endYear: "",
  });

  function save() {
    if (!form.school) {
      alert("School is required.");
      return;
    }
    onSave(form);
  }

  return (
    <Modal title="Add education" onClose={onClose}>
      <div className="space-y-3">
        <Field label="School">
          <input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
        </Field>
        <Field label="Degree">
          <input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })}
            placeholder="e.g. LL.B."
            className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
        </Field>
        <Field label="Field of study">
          <input value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start year">
            <input value={form.startYear} onChange={(e) => setForm({ ...form, startYear: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
          </Field>
          <Field label="End year">
            <input value={form.endYear} onChange={(e) => setForm({ ...form, endYear: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e8d8cd" }} />
          </Field>
        </div>
      </div>
      <ModalFooter onClose={onClose}>
        <button onClick={save} className="text-sm px-4 py-1.5 rounded-md text-white" style={{ background: MAROON_GRAD }}>
          Add
        </button>
      </ModalFooter>
    </Modal>
  );
}
