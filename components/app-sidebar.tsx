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
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Search,
  Briefcase,
  FileSignature,
  CalendarDays,
  Settings2,
  Scale,
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
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const currentUser = useCurrentUser()

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
    <Sidebar collapsible="icon" {...props}>
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
