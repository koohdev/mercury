'use client'

import { logout } from '@/lib/actions/auth'
import { usePathname } from 'next/navigation'
import { Bell, LogOut, User } from 'lucide-react'

interface HeaderProps {
  user: any
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard':
        return 'My Dashboard'
      case '/schedule':
        return 'Team Schedule'
      case '/templates':
        return 'Response Templates'
      case '/logs':
        return 'My Log History'
      case '/availability':
        return 'My Availability'
      case '/pay':
        return 'My Pay'
      case '/settings':
        return 'Settings'
      case '/admin/users':
        return 'User Management'
      case '/admin/logs':
        return 'All Moderator Logs'
      default:
        return 'Clocky'
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-hairline bg-surface-1 px-lg pl-16 md:pl-lg">
      <div>
        <h2 className="text-subhead font-medium tracking-subhead text-ink">
          {getPageTitle(pathname)}
        </h2>
      </div>

      <div className="flex items-center gap-md">
        {/* Notification Bell stub */}
        <button className="relative rounded-md p-xs text-ink-subtle hover:bg-surface-2 hover:text-ink transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </button>

        {/* User profile chip */}
        <div className="flex items-center gap-xs rounded-pill bg-surface-2 border border-hairline px-sm py-1.5 text-body-sm text-ink-muted">
          <User className="h-4 w-4 text-ink-subtle" />
          <span className="hidden sm:inline">{user?.email}</span>
        </div>

        {/* Logout button */}
        <form action={logout}>
          <button
            type="submit"
            title="Sign Out"
            className="rounded-md p-xs text-ink-subtle hover:bg-surface-2 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </header>
  )
}
