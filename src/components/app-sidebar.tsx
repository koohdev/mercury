"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { NavUser } from "@/components/nav-user"
import {
  LayoutDashboard,
  Calendar,
  FileText,
  History,
  Clock,
  CreditCard,
  Settings,
  Users,
  Database,
  FileBarChart2,
  HelpCircle,
  Search,
} from "lucide-react"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean
  user?: any
  hasActiveShift?: boolean
}

export function AppSidebar({ isAdmin = false, user, hasActiveShift = false, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()
  const [isPending, startTransition] = React.useTransition()

  // Close mobile sidebar when navigating
  const closeMobileSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])

  const handleClockInClick = () => {
    if (hasActiveShift) {
      closeMobileSidebar()
      router.push("/dashboard")
      return
    }
    startTransition(async () => {
      const { clockIn } = await import("@/lib/actions/clock")
      const res = await clockIn()
      if (res?.error) {
        alert(res.error)
      } else {
        closeMobileSidebar()
        router.push("/dashboard")
        router.refresh()
      }
    })
  }

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Team Schedule", href: "/schedule", icon: Calendar },
    { name: "Response Templates", href: "/templates", icon: FileText },
    { name: "My Log History", href: "/logs", icon: History },
    { name: "My Availability", href: "/availability", icon: Clock },
    { name: "My Pay", href: "/pay", icon: CreditCard },
  ]

  const adminLinks = [
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "All Logs", href: "/admin/logs", icon: History },
  ]

  const secondaryLinks = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Get Help", href: "#", icon: HelpCircle },
    { name: "Search", href: "#", icon: Search },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" onClick={closeMobileSidebar} className="flex items-center gap-2 px-1">
                <div className="flex h-8 w-8 items-center justify-center shrink-0">
                  <Image src="/logo.svg" alt="Mercury Marketing Logo" width={32} height={32} className="h-8 w-8 object-contain" />
                </div>
                <span className="font-semibold text-lg text-ink group-data-[collapsible=icon]:hidden">Mercury Marketing</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-2 px-3">
        {/* Quick Create row */}
        <SidebarGroup className="py-1 px-0">
          <SidebarGroupContent className="flex items-center">
            <SidebarMenu className="w-full">
              <SidebarMenuItem className="w-full">
                <SidebarMenuButton
                  tooltip={hasActiveShift ? "On Duty" : "Clock in"}
                  onClick={handleClockInClick}
                  disabled={isPending}
                  className={`w-full font-medium h-9 rounded-md justify-start gap-3 px-3 transition-colors cursor-pointer disabled:opacity-50 ${
                    hasActiveShift
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover"
                  }`}
                >
                  {hasActiveShift ? (
                    <>
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      <span>On Duty</span>
                    </>
                  ) : (
                    <>
                      <Clock className="size-4 shrink-0" />
                      <span>{isPending ? "Clocking in..." : "Clock in"}</span>
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Main Links */}
        <SidebarGroup className="py-1 px-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.name}
                      className={
                        isActive
                          ? "bg-surface-2 text-primary font-medium rounded-md px-3"
                          : "text-ink-subtle hover:text-primary hover:bg-surface-2 rounded-md px-3"
                      }
                    >
                      <Link href={link.href} onClick={closeMobileSidebar} className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{link.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Section group - Admin Ops or Documents */}
        <SidebarGroup className="py-1 mt-2 px-0">
          <SidebarGroupLabel className="px-3 text-eyebrow font-medium tracking-eyebrow text-ink-tertiary uppercase">
            {isAdmin ? "Administration" : "Resources"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-1">
            <SidebarMenu className="gap-0.5">
              {(isAdmin ? adminLinks : [
                { name: "Data Library", href: "#", icon: Database },
                { name: "Reports", href: "#", icon: FileBarChart2 },
              ]).map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <SidebarMenuItem key={link.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.name}
                      className={
                        isActive
                          ? "bg-surface-2 text-primary font-medium rounded-md px-3"
                          : "text-ink-subtle hover:text-primary hover:bg-surface-2 rounded-md px-3"
                      }
                    >
                      <Link href={link.href} onClick={closeMobileSidebar} className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{link.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Links */}
        <SidebarGroup className="mt-auto py-1 px-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {secondaryLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <SidebarMenuItem key={link.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.name}
                      className={
                        isActive
                          ? "bg-surface-2 text-primary font-medium rounded-md px-3"
                          : "text-ink-subtle hover:text-primary hover:bg-surface-2 rounded-md px-3"
                      }
                    >
                      <Link href={link.href} onClick={closeMobileSidebar} className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{link.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

