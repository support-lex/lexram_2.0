"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  // Initialize open state based on isActive items
  const initialOpenState = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.title] = item.isActive || false
      return acc
    }, {} as Record<string, boolean>)
  }, [items])

  const [openItems, setOpenItems] = useState(initialOpenState)

  const handleOpenChange = (title: string, isOpen: boolean) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: isOpen,
    }))
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            open={openItems[item.title]}
            onOpenChange={(isOpen) => handleOpenChange(item.title, isOpen)}
            render={<SidebarMenuItem />}
          >
            <SidebarMenuButton
              tooltip={item.title}
              render={<Link href={item.url} />}
              isActive={item.isActive}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
            {item.items?.length ? (
              <>
                <SidebarMenuAction
                  className={`transition-transform duration-200 ${openItems[item.title] ? "rotate-90" : ""}`}
                  onClick={(e) => {
                    e.preventDefault()
                    handleOpenChange(item.title, !openItems[item.title])
                  }}
                  aria-expanded={openItems[item.title]}
                >
                  <ChevronRightIcon className="size-4" />
                  <span className="sr-only">Toggle</span>
                </SidebarMenuAction>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton render={<Link href={subItem.url} />}>
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : null}
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
