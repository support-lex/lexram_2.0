"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  BookOpen,
  Scale,
  X,
} from "lucide-react"

// Main navigation: Research as the primary action, plus Resource — a single
// dropdown holding the Legislation sub-tree. Clicking the Resource label
// itself routes to the global Search page; the chevron toggles the
// legislation list. Compliance, Analytics, Admin and the standalone Search
// entry have been removed from the sidebar.
const navMain = [
  {
    title: "Research",
    url: "/dashboard/research-2",
    icon: <Scale className="size-4" />,
    isActive: true,
  },
  {
    title: "Resource",
    url: "/dashboard/search",
    icon: <BookOpen className="size-4" />,
    items: [
      { title: "Acts", url: "/dashboard/acts" },
      { title: "Amendments", url: "/dashboard/amendments" },
      { title: "Sub-Legislation", url: "/dashboard/sub-legislation" },
      { title: "Circulars", url: "/dashboard/circulars" },
      { title: "Schedules", url: "/dashboard/schedules" },
      { title: "Domains", url: "/dashboard/domains" },
      { title: "Ministry Hub", url: "/dashboard/ministry" },
      { title: "Timeline", url: "/dashboard/timeline" },
      { title: "Gov Documents", url: "/dashboard/gov-docs" },
      { title: "Case Law", url: "/dashboard/case-law" },
      { title: "Version Tracker", url: "/dashboard/version-tracker" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const currentUser = useCurrentUser()
  const { setOpen, isMobile, setOpenMobile } = useSidebar()
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hover-to-expand on desktop: open immediately on mouse enter, collapse
  // after a tiny delay on leave so brief flicks don't slam it shut.
  const handleMouseEnter = () => {
    if (isMobile) return
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setOpen(true)
  }
  const handleMouseLeave = () => {
    if (isMobile) return
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setOpen(false), 120)
  }

  const user = {
    name: getDisplayName(currentUser),
    email: currentUser?.email || currentUser?.phone || "",
    avatar: "",
  }

  // Active state:
  //   * Research lights up only on /dashboard/research-2.
  //   * Resource lights up on /dashboard/search OR any of its legislation sub-routes.
  const navItems = navMain.map((item) => {
    let isActive: boolean
    if (item.url === "/dashboard/research-2") {
      isActive = pathname.startsWith("/dashboard/research-2")
    } else if (item.title === "Resource") {
      isActive =
        pathname === "/dashboard/search" ||
        (item.items?.some((sub) => pathname.startsWith(sub.url)) ?? false)
    } else {
      isActive = pathname.startsWith(item.url)
    }
    return { ...item, isActive }
  })

  return (
    <Sidebar
      collapsible="icon"
      className="lexram-overlay-sidebar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2">
              <SidebarMenuButton
                size="lg"
                render={<Link href="/dashboard/research-2" />}
                className="sidebar-logo flex-1"
              >
                <div
                  className="flex aspect-square size-8 items-center justify-center rounded-md border shrink-0"
                  style={{
                    borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  <Scale className="size-4" />
                </div>
                <div className="sidebar-brand-text grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-serif font-bold text-[var(--text-on-sidebar)]">
                    LexRam
                  </span>
                  <span className="truncate text-xs text-[var(--text-on-sidebar)]/60">
                    Legal AI
                  </span>
                </div>
              </SidebarMenuButton>
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setOpenMobile(false)}
                  aria-label="Close menu"
                  className="mr-1 grid size-8 shrink-0 place-items-center rounded-md text-[var(--text-on-sidebar)]/70 hover:bg-white/10 hover:text-[var(--text-on-sidebar)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
