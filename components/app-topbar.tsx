"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user"
import { useNetworkAvatar } from "@/hooks/use-network-avatar"
import { useIsSuperAdmin } from "@/hooks/use-is-super-admin"
import { useAdminAccess } from "@/hooks/use-admin-access"
import { logoutUsecase } from "@/modules/auth/usecase/auth.usecase"
import {
  LayoutGrid,
  Search,
  Library,
  FileSearch,
  Users,
  Settings,
  HelpCircle,
  Menu,
  X,
  BadgeCheckIcon,
  BellIcon,
  LogOutIcon,
  Sparkles,
  ShieldCheck,
  BarChart3,
} from "lucide-react"
import { useTour } from "@/components/tour/TourProvider"
import { TOURS } from "@/lib/tour/tour-config"

/** Pick the tour whose autoStartPaths matches the current pathname,
 *  preferring the longest (most-specific) match. Falls back to the
 *  welcome tour so the Help button always does something. */
function tourForPath(pathname: string): string {
  const scored = Object.values(TOURS)
    .map((t) => ({
      id: t.id,
      matchLen:
        t.autoStartPaths
          ?.filter((p) => pathname.startsWith(p))
          .reduce((max, p) => Math.max(max, p.length), -1) ?? -1,
    }))
    .filter((c) => c.matchLen >= 0)
    .sort((a, b) => b.matchLen - a.matchLen)
  return scored[0]?.id ?? "dashboard-welcome"
}

type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
  match: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutGrid className="size-4" strokeWidth={1.75} />,
    match: (p) => p === "/dashboard",
  },
  {
    title: "Research",
    url: "/dashboard/research-2",
    icon: <Search className="size-4" strokeWidth={2} />,
    match: (p) =>
      p.startsWith("/dashboard/research-2") || p.startsWith("/dashboard/research-3"),
  },
  {
    title: "Case Library",
    url: "/dashboard/case-law",
    icon: <Library className="size-4" strokeWidth={1.75} />,
    match: (p) =>
      p.startsWith("/dashboard/case-law") ||
      p.startsWith("/dashboard/client") ||
      p.startsWith("/dashboard/case-status"),
  },
  {
    title: "TSR",
    url: "/dashboard/tsr/my-cases",
    icon: <FileSearch className="size-4" strokeWidth={1.75} />,
    match: (p) => p.startsWith("/dashboard/tsr"),
  },
  {
    title: "Network",
    url: "/dashboard/network",
    icon: <Users className="size-4" strokeWidth={1.75} />,
    match: (p) => p.startsWith("/dashboard/network"),
  },
]

/** Injected at render time when the signed-in user is a super_admin. */
const SUPER_ADMIN_NAV_ITEM: NavItem = {
  title: "Super Admin",
  url: "/dashboard/super-admin",
  icon: <ShieldCheck className="size-4" strokeWidth={1.75} />,
  match: (p) => p.startsWith("/dashboard/super-admin"),
}

/**
 * Platform operations overview. Gated on profiles.is_super_admin — a different
 * list from the app_metadata.role that governs SUPER_ADMIN_NAV_ITEM, so it gets
 * its own visibility check rather than riding along on that one.
 */
const ADMIN_STATS_NAV_ITEM: NavItem = {
  title: "Admin",
  url: "/dashboard/admin/stats",
  icon: <BarChart3 className="size-4" strokeWidth={1.75} />,
  match: (p) => p.startsWith("/dashboard/admin/stats"),
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AppTopBar() {
  const pathname = usePathname()
  const currentUser = useCurrentUser()
  const isSuperAdmin = useIsSuperAdmin()
  const hasAdminStats = useAdminAccess()
  const { start: startTour } = useTour()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)
  const navRef = React.useRef<HTMLElement>(null)
  const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([])

  // Inject the super-admin nav item only when the JWT says the user is one.
  // Server-side access control still gates the dashboard via 403, so this is
  // purely about which links to show in the topbar.
  const navItems = React.useMemo<NavItem[]>(
    () => [
      ...NAV_ITEMS,
      ...(isSuperAdmin ? [SUPER_ADMIN_NAV_ITEM] : []),
      ...(hasAdminStats ? [ADMIN_STATS_NAV_ITEM] : []),
    ],
    [isSuperAdmin, hasAdminStats],
  )
  const [pillStyle, setPillStyle] = React.useState<{ left: number; width: number; opacity: number }>(
    { left: 0, width: 0, opacity: 0 }
  )
  const [hoverPillStyle, setHoverPillStyle] = React.useState<{ left: number; width: number; opacity: number }>(
    { left: 0, width: 0, opacity: 0 }
  )

  const userName = getDisplayName(currentUser)
  const userSubtitle =
    (currentUser as unknown as { firm?: string; organization?: string } | null)?.firm ||
    (currentUser as unknown as { firm?: string; organization?: string } | null)?.organization ||
    currentUser?.email ||
    currentUser?.phone ||
    ""
  const initials = getInitials(userName)
  const avatarUrl = useNetworkAvatar()

  const activeIdx = navItems.findIndex((item) => item.match(pathname))

  // Animated active pill — measures the active link and slides under it
  React.useLayoutEffect(() => {
    const el = itemRefs.current[activeIdx]
    const nav = navRef.current
    if (!el || !nav) {
      setPillStyle((s) => ({ ...s, opacity: 0 }))
      return
    }
    const navRect = nav.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    setPillStyle({ left: elRect.left - navRect.left, width: elRect.width, opacity: 1 })
  }, [activeIdx, pathname])

  // Hover pill follows the cursor between items
  React.useLayoutEffect(() => {
    if (hoveredIdx === null || hoveredIdx === activeIdx) {
      setHoverPillStyle((s) => ({ ...s, opacity: 0 }))
      return
    }
    const el = itemRefs.current[hoveredIdx]
    const nav = navRef.current
    if (!el || !nav) return
    const navRect = nav.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    setHoverPillStyle({ left: elRect.left - navRect.left, width: elRect.width, opacity: 1 })
  }, [hoveredIdx, activeIdx])

  return (
    <header className="flex-shrink-0 h-12 border-b border-[#680318]/10 bg-[#fff0df]/80 backdrop-blur-md relative z-40">
      {/* Subtle maroon shimmer line at the bottom of the topbar */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(122,31,43,0.18) 30%, rgba(122,31,43,0.28) 50%, rgba(122,31,43,0.18) 70%, transparent 100%)",
        }}
      />

      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* ── Left: brand logo ──────────────────────────────── */}
        <Link
          href="/dashboard"
          aria-label="LexRam"
          className="flex items-center shrink-0 transition-transform duration-300 hover:scale-[1.04]"
        >
          <Image
            src="/lexram-logo.png"
            alt="LexRam"
            width={116}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>

        {/* ── Center: nav with sliding pills (desktop) ─────────── */}
        <nav
          ref={navRef}
          data-tour="topbar-nav"
          onMouseLeave={() => setHoveredIdx(null)}
          className="hidden md:flex relative items-center gap-1 ml-2"
        >
          {/* Active pill — slides between items */}
          <span
            aria-hidden
            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-full transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none shadow-[0_6px_20px_rgba(122,31,43,0.35)]"
            style={{
              left: pillStyle.left,
              width: pillStyle.width,
              opacity: pillStyle.opacity,
              background: "linear-gradient(135deg, #7a1f2b 0%, #5e1721 100%)",
            }}
          />
          {/* Hover pill — soft maroon tint that follows cursor */}
          <span
            aria-hidden
            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-full bg-[#7a1f2b]/8 transition-[left,width,opacity] duration-200 ease-out pointer-events-none"
            style={{
              left: hoverPillStyle.left,
              width: hoverPillStyle.width,
              opacity: hoverPillStyle.opacity,
            }}
          />

          {navItems.map((item, idx) => {
            const active = idx === activeIdx
            // Slug used by the tour to target individual nav items
            const tourSlug =
              item.title.toLowerCase().split(" ")[0] // "research", "dashboard", "case", "matters", "super"
            return (
              <Link
                key={item.url}
                href={item.url}
                ref={(el) => { itemRefs.current[idx] = el }}
                data-tour={`topbar-${tourSlug}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                className={`relative z-10 flex items-center gap-2 px-3 h-8 rounded-full text-[13px] font-medium transition-colors duration-200 ${
                  active
                    ? "text-white"
                    : "text-gray-600 hover:text-[#7a1f2b]"
                }`}
              >
                <span
                  className={`transition-transform duration-300 ${
                    active ? "scale-110" : "group-hover:scale-105"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* ── Right: settings, help, user chip ─────────────────── */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/dashboard/settings"
            data-tour="topbar-settings"
            aria-label="Settings"
            title="Settings"
            className="hidden sm:grid place-items-center size-7 rounded-full text-gray-500 hover:text-[#7a1f2b] hover:bg-[#7a1f2b]/8 transition-all duration-200 hover:scale-110"
          >
            <Settings className="size-4" strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            data-tour="topbar-help"
            aria-label="Help · Replay tour"
            title="Replay tour"
            onClick={() => startTour(tourForPath(pathname))}
            className="hidden sm:grid place-items-center size-7 rounded-full text-gray-500 hover:text-[#7a1f2b] hover:bg-[#7a1f2b]/8 transition-all duration-200 hover:scale-110"
          >
            <HelpCircle className="size-4" strokeWidth={1.75} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  data-tour="topbar-user"
                  className="ml-1 flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-[#7a1f2b]/8 transition-all duration-200 group/user"
                />
              }
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="size-7 rounded-full object-cover shadow-[0_2px_8px_rgba(122,31,43,0.3)] transition-transform duration-200 group-hover/user:scale-110"
                />
              ) : (
                <span
                  className="grid place-items-center size-7 rounded-full text-white text-[11px] font-semibold shadow-[0_2px_8px_rgba(122,31,43,0.3)] transition-transform duration-200 group-hover/user:scale-110"
                  style={{
                    background: "linear-gradient(135deg, #7a1f2b 0%, #5e1721 100%)",
                  }}
                >
                  {initials}
                </span>
              )}
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[13px] font-semibold text-[#7a1f2b] max-w-[140px] truncate">
                  {userName}
                </span>
                {userSubtitle && (
                  <span className="text-[11px] text-gray-500 max-w-[140px] truncate">
                    {userSubtitle}
                  </span>
                )}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={12}
              className="min-w-[260px] rounded-2xl overflow-hidden p-0 border border-[#e7d8da] shadow-[0_20px_50px_-15px_rgba(122,31,43,0.30)] bg-white"
            >
              {/* Header — maroon-tinted card with avatar */}
              <div
                className="relative px-4 pt-4 pb-4"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(122,31,43,0.08) 0%, rgba(122,31,43,0.02) 100%)",
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(122,31,43,0.25) 50%, transparent 100%)",
                  }}
                />
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userName}
                      className="size-11 rounded-full object-cover shadow-[0_4px_14px_rgba(122,31,43,0.35)]"
                    />
                  ) : (
                    <span
                      className="grid place-items-center size-11 rounded-full text-white text-[14px] font-semibold shadow-[0_4px_14px_rgba(122,31,43,0.35)]"
                      style={{
                        background: "linear-gradient(135deg, #7a1f2b 0%, #5e1721 100%)",
                      }}
                    >
                      {initials}
                    </span>
                  )}
                  <div className="grid flex-1 text-left leading-tight min-w-0">
                    <span className="truncate text-[14px] font-semibold text-[#7a1f2b]">
                      {userName}
                    </span>
                    {userSubtitle && (
                      <span className="truncate text-[12px] text-gray-500 mt-0.5">
                        {userSubtitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <DropdownMenuGroup className="p-1.5">
                <DropdownMenuItem
                  render={<Link href="/dashboard/settings/profile" />}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-gray-700 focus:bg-[#7a1f2b]/8 focus:text-[#7a1f2b] data-[highlighted]:bg-[#7a1f2b]/8 data-[highlighted]:text-[#7a1f2b] transition-colors cursor-pointer"
                >
                  <span className="grid place-items-center size-8 rounded-lg bg-[#7a1f2b]/8 text-[#7a1f2b]">
                    <BadgeCheckIcon className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="font-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/dashboard/settings#notifications" />}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-gray-700 focus:bg-[#7a1f2b]/8 focus:text-[#7a1f2b] data-[highlighted]:bg-[#7a1f2b]/8 data-[highlighted]:text-[#7a1f2b] transition-colors cursor-pointer"
                >
                  <span className="grid place-items-center size-8 rounded-lg bg-[#7a1f2b]/8 text-[#7a1f2b]">
                    <BellIcon className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="font-medium">Notifications</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <div className="px-1.5 pb-1.5">
                <div className="h-px bg-[#f0e6e8] mx-3 mb-1.5" />
                <DropdownMenuItem
                  onClick={() => startTour(tourForPath(pathname))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-gray-700 focus:bg-[#7a1f2b]/8 focus:text-[#7a1f2b] data-[highlighted]:bg-[#7a1f2b]/8 data-[highlighted]:text-[#7a1f2b] transition-colors cursor-pointer"
                >
                  <span className="grid place-items-center size-8 rounded-lg bg-[#7a1f2b]/8 text-[#7a1f2b]">
                    <Sparkles className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="font-medium">Replay tour</span>
                </DropdownMenuItem>
                <div className="h-px bg-[#f0e6e8] mx-3 my-1.5" />
                <DropdownMenuItem
                  onClick={async () => {
                    await logoutUsecase()
                    window.location.href = "/"
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-gray-700 focus:bg-red-50 focus:text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-600 transition-colors cursor-pointer"
                >
                  <span className="grid place-items-center size-8 rounded-lg bg-red-50 text-red-600">
                    <LogOutIcon className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="md:hidden grid place-items-center size-9 rounded-full text-gray-600 hover:bg-[#7a1f2b]/8 hover:text-[#7a1f2b] transition-all duration-200"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-white border-b border-[#f0e6e8] shadow-[0_8px_24px_rgba(122,31,43,0.08)] py-2 px-3 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.url}
                href={item.url}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "text-white shadow-[0_4px_14px_rgba(122,31,43,0.3)]"
                    : "text-[#7a1f2b] hover:bg-[#7a1f2b]/8"
                }`}
                style={
                  active
                    ? { background: "linear-gradient(135deg, #7a1f2b 0%, #5e1721 100%)" }
                    : undefined
                }
              >
                {item.icon}
                {item.title}
              </Link>
            )
          })}
          <div className="h-px bg-[#f0e6e8] my-1.5" />
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-[#7a1f2b]/8 hover:text-[#7a1f2b] transition-colors"
          >
            <Settings className="size-4" /> Settings
          </Link>
        </div>
      )}
    </header>
  )
}
