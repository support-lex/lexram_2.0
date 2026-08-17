"use client";

import Link from "next/link";
import {
  BookOpen,
  GitBranch,
  Layers,
  FileText,
  Calendar,
  Globe,
  Building2,
  Clock,
  ScrollText,
  Scale,
  History as HistoryIcon,
  Grid3x3,
  Activity,
  Network,
  TrendingUp,
  PieChart,
  Users,
  ArrowRight,
} from "lucide-react";

interface ResourceCard {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

interface ResourceGroup {
  label: string;
  hint: string;
  cards: ResourceCard[];
}

// Map of every resource page already shipped under /dashboard/* on this
// branch. Order, copy, and grouping are tuned for first-time discovery — the
// same routes are also reachable from the left rail's "Legislation /
// Compliance / Analytics / Admin" submenus.
const GROUPS: ResourceGroup[] = [
  {
    label: "Legislation",
    hint: "Acts, amendments, sub-legislation, circulars and the source material that anchors every research thread.",
    cards: [
      { title: "Acts", description: "Browse statutes by domain, year, or ministry.", href: "/dashboard/acts", icon: BookOpen },
      { title: "Amendments", description: "Track amendments to active statutes.", href: "/dashboard/amendments", icon: GitBranch },
      { title: "Amendment Tracker", description: "Recent amendments with status and effective dates.", href: "/dashboard/amendments/tracker", icon: Clock },
      { title: "Sub-Legislation", description: "Rules, regulations, notifications and orders.", href: "/dashboard/sub-legislation", icon: Layers },
      { title: "Circulars", description: "Ministry circulars indexed by issuer and topic.", href: "/dashboard/circulars", icon: FileText },
      { title: "Schedules", description: "Schedules attached to acts, with cross-links.", href: "/dashboard/schedules", icon: Calendar },
      { title: "Domains", description: "Top legal domains by activity and corpus size.", href: "/dashboard/domains", icon: Globe },
      { title: "Ministry Hub", description: "Acts, circulars and amendments grouped by ministry.", href: "/dashboard/ministry", icon: Building2 },
      { title: "Timeline", description: "Legislative timeline across statutes and amendments.", href: "/dashboard/timeline", icon: HistoryIcon },
      { title: "Gov Documents", description: "Government documents repository.", href: "/dashboard/gov-docs", icon: ScrollText },
      { title: "Case Law", description: "Cited case law and judgments index.", href: "/dashboard/case-law", icon: Scale },
      { title: "Version Tracker", description: "Versioned diff between act revisions.", href: "/dashboard/version-tracker", icon: Activity },
    ],
  },
  {
    label: "Compliance",
    hint: "Cross-cutting impact tools that help advocates and compliance teams reason about regulatory exposure.",
    cards: [
      { title: "Impact Matrix", description: "Map regulatory impact across statutes and industries.", href: "/dashboard/matrix", icon: Grid3x3 },
      { title: "Burden Index", description: "Regulatory burden scores by domain.", href: "/dashboard/burden-index", icon: TrendingUp },
      { title: "Cross-Industry Map", description: "Compare regulation pressure across sectors.", href: "/dashboard/cross-industry", icon: Network },
      { title: "Amendment Chain", description: "Trace amendment lineage across statutes.", href: "/dashboard/amendment-chain", icon: GitBranch },
    ],
  },
  {
    label: "Analytics",
    hint: "Aggregate views over the corpus and your usage.",
    cards: [
      { title: "Legal Analytics", description: "High-level analytics dashboard.", href: "/dashboard/legal-analytics", icon: PieChart },
      { title: "Industry Dashboard", description: "Industry-specific analytics view.", href: "/dashboard/industry-dashboard", icon: Building2 },
      { title: "Cross-References", description: "Cross-reference graph across the corpus.", href: "/dashboard/cross-refs", icon: Network },
    ],
  },
  {
    label: "Admin",
    hint: "Operations surfaces — limited to admin users.",
    cards: [
      { title: "Admin Panel", description: "User and tenant administration.", href: "/dashboard/admin", icon: Users },
      { title: "Crawler", description: "Source crawler dashboard and job status.", href: "/dashboard/crawler", icon: Activity },
    ],
  },
];

export default function ResourcesHubPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Resources
        </p>
        <h1 className="mt-1 text-3xl font-serif font-light tracking-tight text-[var(--text-primary)]">
          Legal corpus &amp; analytics hub
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)] leading-relaxed">
          Browse statutes, amendments, circulars, case law, compliance tools
          and analytics — the same data the chat surface searches over,
          surfaced page-by-page for direct navigation.
        </p>
      </header>

      <div className="space-y-10">
        {GROUPS.map((group) => (
          <section key={group.label} aria-labelledby={`grp-${group.label}`}>
            <div className="mb-3">
              <h2
                id={`grp-${group.label}`}
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]"
              >
                {group.label}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-2xl leading-relaxed">
                {group.hint}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.cards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="group/card relative flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3.5 transition-all hover:border-[var(--accent)]/40 hover:shadow-sm hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {card.title}
                        </span>
                        <ArrowRight
                          className="h-3 w-3 text-[var(--text-muted)] opacity-0 -translate-x-1 transition-all group-hover/card:opacity-100 group-hover/card:translate-x-0"
                          aria-hidden
                        />
                      </div>
                      <p className="mt-0.5 text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                        {card.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
