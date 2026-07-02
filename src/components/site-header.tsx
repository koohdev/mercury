"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { logout } from "@/lib/actions/auth"
import { Flame } from "lucide-react"
import { useTheme } from "next-themes"
import NotificationBell from "@/components/layout/NotificationBell"
import { AppNotification } from "@/hooks/useNotifications"

interface SiteHeaderProps {
  user: any
  streakCount: number
  initialNotifications: AppNotification[]
}

export function SiteHeader({ user, streakCount, initialNotifications }: SiteHeaderProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/dashboard":
        return "My Dashboard"
      case "/schedule":
        return "Team Schedule"
      case "/templates":
        return "Response Templates"
      case "/logs":
        return "My Log History"
      case "/availability":
        return "My Availability"
      case "/pay":
        return "My Pay"
      case "/settings":
        return "Settings"
      case "/admin/users":
        return "User Management"
      case "/admin/logs":
        return "All Moderator Logs"
      default:
        return "Mercury Marketing"
    }
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center justify-between border-b border-hairline bg-transparent px-4 lg:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex items-center gap-1 lg:gap-2">
        <SidebarTrigger className="-ml-1 text-ink-subtle hover:text-ink cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-stretch bg-hairline"
        />
        <h2 className="text-body font-medium tracking-subhead text-ink">
          {getPageTitle(pathname)}
        </h2>
      </div>

      <div className="flex items-center gap-md">
        {/* Attendance Streak Badge (reddish button) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/30 border border-red-900/60 text-red-400 text-xs font-semibold select-none shadow-sm shadow-red-950/20">
          <Flame className="h-3.5 w-3.5 fill-red-400/20" />
          <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
        </div>

        {/* Theme Toggle Button next to Notification Bell */}
        <button
          data-slot="button"
          data-variant="ghost"
          data-size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 group/toggle extend-touch-target size-8 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4.5"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            <path d="M12 3l0 18" />
            <path d="M12 9l4.65 -4.65" />
            <path d="M12 14.3l7.37 -7.37" />
            <path d="M12 19.6l8.85 -8.85" />
          </svg>
          <span className="sr-only">Toggle theme</span>
        </button>

        {/* Notification Bell */}
        <NotificationBell userId={user.id} initialNotifications={initialNotifications} />
      </div>
    </header>
  )
}
