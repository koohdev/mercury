'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  History,
  Clock,
  CreditCard,
  Settings,
  Users,
  Menu,
  X
} from 'lucide-react'

interface SidebarProps {
  isAdmin: boolean
}

export default function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const links = [
    { name: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Team Schedule', href: '/schedule', icon: Calendar },
    { name: 'Response Templates', href: '/templates', icon: FileText },
    { name: 'My Log History', href: '/logs', icon: History },
    { name: 'My Availability', href: '/availability', icon: Clock },
    { name: 'My Pay', href: '/pay', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const adminLinks = [
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'All Logs', href: '/admin/logs', icon: History },
  ]

  const activeClass = 'bg-surface-3 text-ink border-l-2 border-primary font-medium'
  const inactiveClass = 'text-ink-subtle hover:text-ink hover:bg-surface-2 border-l-2 border-transparent'

  const renderLinks = (items: typeof links) => {
    return items.map((link) => {
      const Icon = link.icon
      const isActive = pathname === link.href
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setIsOpen(false)}
          className={`flex items-center gap-sm px-lg py-3 text-body-sm transition-colors duration-150 ${
            isActive ? activeClass : inactiveClass
          }`}
        >
          <Icon className="h-5 w-5" />
          {link.name}
        </Link>
      )
    })
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 rounded-md bg-surface-1 p-xs border border-hairline text-ink md:hidden cursor-pointer"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-semantic-overlay/80 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-surface-1 border-r border-hairline transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center px-lg border-b border-hairline">
          <Link href="/dashboard" className="text-card-title font-semibold tracking-card-title text-ink">
            Clocky
          </Link>
        </div>

        <nav className="flex-1 space-y-xxs py-md overflow-y-auto">
          {renderLinks(links)}

          {isAdmin && (
            <div className="mt-lg">
              <p className="px-lg text-eyebrow font-medium tracking-eyebrow text-ink-tertiary uppercase mb-xs">
                Admin Ops
              </p>
              {renderLinks(adminLinks)}
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}
