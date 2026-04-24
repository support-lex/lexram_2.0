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
  LayoutDashboard,
  Search,
  Briefcase,
  FileSignature,
  CalendarDays,
  Settings2,
  Scale,
  Users,
  BookOpen,
  ShieldCheck,
  BarChart3,
  Wrench,
  Sparkles,
} from "lucide-react"

// Main navigation items with sub-menus
const navMain = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: <LayoutDashboard className="size-4" />,
    isActive: true,
  },
  {
    title: "Research",
    url: "/dashboard/research-3",
    icon: <Search className="size-4" />,
  },
  {
    title: "Research2",
    url: "/dashboard/research-2",
    icon: <Scale className="size-4" />,
  },
  {
    title: "AI Search",
    url: "/dashboard/search",
    icon: <Sparkles className="size-4" />,
  },
  {
    title: "Case Manager",
    url: "/dashboard/matters",
    icon: <Briefcase className="size-4" />,
  },
  {
    title: "Contracts",
    url: "/dashboard/contracts",
    icon: <FileSignature className="size-4" />,
  },
  {
    title: "Deadlines",
    url: "/dashboard/deadlines",
    icon: <CalendarDays className="size-4" />,
  },
  {
    title: "Advocate",
    url: "/dashboard/advocate",
    icon: <Scale className="size-4" />,
  },
  {
    title: "Client Portal",
    url: "/dashboard/client",
    icon: <Users className="size-4" />,
  },
  {
    title: "Legislation",
    url: "/dashboard/acts",
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
  {
    title: "Compliance",
    url: "/dashboard/matrix",
    icon: <ShieldCheck className="size-4" />,
    items: [
      { title: "Impact Matrix", url: "/dashboard/matrix" },
      { title: "Burden Index", url: "/dashboard/burden-index" },
      { title: "Cross-Industry", url: "/dashboard/cross-industry" },
      { title: "Amendment Chain", url: "/dashboard/amendment-chain" },
    ],
  },
  {
    title: "Analytics",
    url: "/dashboard/legal-analytics",
    icon: <BarChart3 className="size-4" />,
    items: [
      { title: "Legal Analytics", url: "/dashboard/legal-analytics" },
      { title: "Industry Dashboard", url: "/dashboard/industry-dashboard" },
      { title: "Cross-References", url: "/dashboard/cross-refs" },
    ],
  },
  {
    title: "Admin",
    url: "/dashboard/admin",
    icon: <Wrench className="size-4" />,
    items: [
      { title: "Admin Panel", url: "/dashboard/admin" },
      { title: "Crawler", url: "/dashboard/crawler" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const currentUser = useCurrentUser()
  const { setOpen, isMobile } = useSidebar()
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hover-to-expand: open immediately on mouse enter, collapse after a tiny
  // delay on leave so brief flicks don't slam it shut.
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

  // Update isActive based on current path
  const navItems = navMain.map(item => ({
    ...item,
    isActive: item.url === "/dashboard" 
      ? pathname === item.url 
      : pathname.startsWith(item.url),
  }))

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
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              className="sidebar-logo"
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              render={<Link href="/dashboard/settings" />}
              isActive={pathname.startsWith("/dashboard/settings")}
            >
              <Settings2 className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
      
    </Sidebar>
  )
}
