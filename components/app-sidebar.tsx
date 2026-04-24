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
import { Scale } from "lucide-react"

// Main navigation items with sub-menus
const navMain = [
  {
    title: "Research",
    url: "/dashboard/research-2",
    icon: <Scale className="size-4" />,
    isActive: true,
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
        <NavUser user={user} />
      </SidebarFooter>
      
    </Sidebar>
  )
}
