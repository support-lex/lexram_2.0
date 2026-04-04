"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  MessageSquare, 
  Clock,
  Calendar
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "document" | "research" | "draft" | "analysis";
  title: string;
  description: string;
  timestamp: string;
  date: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "document",
    title: "Contract Review: ABC Corp",
    description: "Analyzed employment agreement",
    timestamp: "2 hours ago",
    date: "Today",
  },
  {
    id: "2",
    type: "research",
    title: "Research: Section 420 IPC",
    description: "Case law search completed",
    timestamp: "Yesterday",
    date: "Yesterday",
  },
  {
    id: "3",
    type: "draft",
    title: "Legal Notice Drafted",
    description: "Recovery of dues - Mumbai High Court",
    timestamp: "2 days ago",
    date: "Mar 3",
  },
  {
    id: "4",
    type: "analysis",
    title: "Case Analysis: Property Dispute",
    description: "Strength assessment completed",
    timestamp: "3 days ago",
    date: "Mar 2",
  },
];

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "document":
      return <FileText className="w-5 h-5 text-blue-500" />;
    case "research":
      return <Search className="w-5 h-5 text-purple-500" />;
    case "draft":
      return <FileText className="w-5 h-5 text-green-500" />;
    case "analysis":
      return <MessageSquare className="w-5 h-5 text-orange-500" />;
    default:
      return <FileText className="w-5 h-5 text-[var(--text-muted)]" />;
  }
};

export default function ActivityPage() {
  const [filter, setFilter] = useState<"all" | ActivityItem["type"]>("all");

  const filteredActivities = filter === "all" 
    ? mockActivities 
    : mockActivities.filter(a => a.type === filter);

  return (
    <div className="min-h-screen bg-[var(--surface-hover)]">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-default)] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </Link>
            <div>
              <h1 className="font-sans text-xl font-bold text-[var(--text-primary)]">Activity History</h1>
              <p className="text-sm text-[var(--text-muted)]">View all your recent activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "document", "research", "draft", "analysis"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === type
                  ? "bg-[var(--bg-sidebar)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] ring-1 ring-[var(--border-default)]"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Activity List */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 bg-[var(--bg-surface)] rounded-lg ring-1 ring-[var(--border-default)]">
              <Clock className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text-muted)]">No activities found</p>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="bg-[var(--bg-surface)] p-4 rounded-lg ring-1 ring-[var(--border-default)] hover:shadow-[var(--shadow-card)] transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[var(--surface-hover)] rounded-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-sans font-sans font-medium text-[var(--text-primary)]">{activity.title}</h3>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{activity.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <Calendar className="w-4 h-4" />
                        <span>{activity.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" />
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredActivities.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-[var(--bg-surface)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
              Load More Activities
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
