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
import { NavUser } from "@/components/nav-user"
import { User } from "@supabase/supabase-js"
import { clockIn } from "@/lib/actions/clock"
import {
  LayoutDashboard,
  Calendar,
  FileText,
  History,
  Clock,
  CreditCard,
  Settings,
  Users,
  HelpCircle,
  Briefcase,
  Plus,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean
  user?: User
  hasActiveShift?: boolean
}

export function AppSidebar({ isAdmin = false, user, hasActiveShift = false, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const { setOpenMobile } = useSidebar()
  const [showClockInConfirm, setShowClockInConfirm] = React.useState(false)
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState(false)

  React.useEffect(() => {
    const checkViewport = () => {
      setIsMobileOrTablet(window.innerWidth < 1024)
    }
    checkViewport()
    window.addEventListener("resize", checkViewport)
    return () => window.removeEventListener("resize", checkViewport)
  }, [])

  // Clean up any stuck Radix body locks/pointer-events on page navigation
  React.useEffect(() => {
    document.body.style.pointerEvents = ""
    document.body.style.overflow = ""
  }, [pathname])

  const handleLinkClick = () => {
    setOpenMobile(false)
  }

  const triggerClockIn = () => {
    setShowClockInConfirm(false)
    handleLinkClick()
    startTransition(async () => {
      const res = await clockIn()
      if (res?.error) {
        alert(res.error)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    })
  }

  const handleClockInClick = () => {
    if (hasActiveShift) {
      router.push("/dashboard")
      handleLinkClick()
      return
    }
    
    if (isMobileOrTablet) {
      setShowClockInConfirm(true)
    } else {
      triggerClockIn()
    }
  }

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Campaigns", href: "/campaigns", icon: Briefcase },
    { name: "Team Schedule", href: "/schedule", icon: Calendar },
    { name: "Response Templates", href: "/templates", icon: FileText },
    { name: "My Log History", href: "/logs", icon: History },
    { name: "My Availability", href: "/availability", icon: Clock },
    { name: "My Pay", href: "/pay", icon: CreditCard },
  ]

  const adminLinks = [
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Campaigns", href: "/admin/campaigns", icon: Briefcase },
    { name: "All Logs", href: "/admin/logs", icon: History },
  ]

  const role = user?.app_metadata?.role || "moderator"
  const isModerator = role === "moderator"
  const isManager = role === "manager"
  const visibleLinks = links.filter((link) => {
    if (isManager) {
      return ["Dashboard", "Team Schedule", "Response Templates"].includes(link.name)
    }
    return true
  })
  const visibleAdminLinks = adminLinks.filter(
    (link) => role === "admin" || (role === "manager" && link.href !== "/admin/users")
  )

  const secondaryLinks = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Get Help", href: "#", icon: HelpCircle },
  ]

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader className="py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard" className="flex items-center gap-2 px-1">
                  <div className="flex h-8 w-8 items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.svg" alt="Mercury Marketing Logo" width={32} height={32} className="h-8 w-8 object-contain" />
                  </div>
                  <span className="font-semibold text-lg text-ink group-data-[collapsible=icon]:hidden">Mercury Marketing</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="py-2 px-3">
          {/* Quick Action row */}
          <SidebarGroup className="py-1 px-0">
            <SidebarGroupContent className="flex items-center">
              <SidebarMenu className="w-full">
                <SidebarMenuItem className="w-full">
                  {isModerator ? (
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
                  ) : (
                    <SidebarMenuButton
                      tooltip="Create Campaign"
                      asChild
                      className="w-full font-medium h-9 rounded-md justify-start gap-3 px-3 transition-colors cursor-pointer bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover"
                    >
                      <Link href="/admin/campaigns?create=true">
                        <Plus className="size-4 shrink-0" />
                        <span>Create Campaign</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Main Links */}
          <SidebarGroup className="py-1 px-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {visibleLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={link.name}
                        onClick={handleLinkClick}
                        className={
                          isActive
                            ? "bg-surface-2 text-primary font-medium rounded-md px-3"
                            : "text-ink-subtle hover:text-primary hover:bg-surface-2 rounded-md px-3"
                        }
                      >
                        <Link href={link.href} className="flex items-center gap-3">
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

          {/* Section group - Admin Ops */}
          {isAdmin && (
            <SidebarGroup className="py-1 mt-2 px-0">
              <SidebarGroupLabel className="px-3 text-eyebrow font-medium tracking-eyebrow text-ink-tertiary uppercase">
                Administration
              </SidebarGroupLabel>
              <SidebarGroupContent className="mt-1">
                <SidebarMenu className="gap-0.5">
                  {visibleAdminLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href
                    return (
                      <SidebarMenuItem key={link.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={link.name}
                          onClick={handleLinkClick}
                          className={
                            isActive
                              ? "bg-surface-2 text-primary font-medium rounded-md px-3"
                              : "text-ink-subtle hover:text-primary hover:bg-surface-2 rounded-md px-3"
                          }
                        >
                           <Link href={link.href} className="flex items-center gap-3">
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
          )}

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
                        onClick={handleLinkClick}
                        className={
                          isActive
                            ? "bg-surface-2 text-primary font-medium rounded-md px-3"
                            : "text-ink-subtle hover:text-primary hover:bg-surface-2 rounded-md px-3"
                        }
                      >
                        <Link href={link.href} className="flex items-center gap-3">
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

      <Dialog open={showClockInConfirm} onOpenChange={setShowClockInConfirm}>
        <DialogContent className="bg-surface-1 border border-hairline text-ink max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="text-ink">Confirm Clock In</DialogTitle>
            <DialogDescription className="text-ink-muted">
              You are about to clock in and start your shift tracker.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-sm mt-md">
            <button
              onClick={() => setShowClockInConfirm(false)}
              className="bg-surface-2 hover:bg-surface-3 text-ink px-md py-1.5 rounded-md font-medium border border-hairline text-button transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={triggerClockIn}
              disabled={isPending}
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-md py-1.5 rounded-md font-medium text-button transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Clocking in..." : "Clock In"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
