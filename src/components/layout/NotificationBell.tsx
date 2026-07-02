'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Bell, Check, CheckCheck, X, Calendar, DollarSign, Megaphone } from 'lucide-react'
import { useNotifications, AppNotification } from '@/hooks/useNotifications'
import { markAsRead, markAllRead } from '@/lib/actions/notifications'

interface NotificationBellProps {
  userId: string
  initialNotifications: AppNotification[]
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  schedule_change: <Calendar className="h-4 w-4 text-primary" />,
  pay_update: <DollarSign className="h-4 w-4 text-semantic-success" />,
  admin_announcement: <Megaphone className="h-4 w-4 text-amber-400" />,
}

const TYPE_LABEL: Record<string, string> = {
  schedule_change: 'Schedule',
  pay_update: 'Pay Update',
  admin_announcement: 'Announcement',
}

const formatRelative = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationBell({ userId, initialNotifications }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const panelRef = useRef<HTMLDivElement>(null)

  const { notifications, unreadCount, markRead, markAllRead: markAllLocal } = useNotifications(userId, initialNotifications)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkRead = (id: string) => {
    markRead(id)
    startTransition(() => markAsRead(id))
  }

  const handleMarkAll = () => {
    markAllLocal()
    startTransition(() => markAllRead())
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={() => setOpen((o) => !o)}
        className={`relative rounded-md p-xs text-ink-subtle hover:bg-surface-2 hover:text-ink transition-colors cursor-pointer ${open ? 'bg-surface-2 text-ink' : ''}`}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[480px] z-50 bg-surface-1 border border-hairline rounded-lg shadow-2xl overflow-hidden flex flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-md py-sm border-b border-hairline shrink-0">
            <h3 className="text-body font-semibold text-ink">Notifications</h3>
            <div className="flex items-center gap-xs">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={isPending}
                  title="Mark all as read"
                  className="p-1 rounded-md hover:bg-surface-2 text-ink-subtle hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-surface-2 text-ink-subtle hover:text-ink transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-hairline">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-xl gap-sm text-ink-subtle">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-body-sm">You're all caught up</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  isPending={isPending}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  notification: n,
  onMarkRead,
  isPending,
}: {
  notification: AppNotification
  onMarkRead: (id: string) => void
  isPending: boolean
}) {
  return (
    <div className={`flex items-start gap-sm p-md transition-colors ${!n.is_read ? 'bg-primary/5' : 'hover:bg-surface-2'}`}>
      <div className="h-8 w-8 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center shrink-0 mt-0.5">
        {TYPE_ICON[n.type] || <Bell className="h-4 w-4 text-ink-subtle" />}
      </div>

      <div className="flex-1 min-w-0 space-y-xxs">
        <div className="flex items-start justify-between gap-xs">
          <p className={`text-body-sm font-medium leading-snug ${n.is_read ? 'text-ink-muted' : 'text-ink'}`}>
            {n.title}
          </p>
          {!n.is_read && (
            <button
              onClick={() => onMarkRead(n.id)}
              disabled={isPending}
              title="Mark as read"
              className="p-0.5 rounded text-ink-subtle hover:text-primary transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-caption text-ink-muted leading-snug line-clamp-2">{n.message}</p>
        <div className="flex items-center gap-xs">
          <span className="text-[10px] font-medium text-ink-tertiary bg-surface-2 border border-hairline px-1.5 py-0.5 rounded">
            {TYPE_LABEL[n.type] || n.type}
          </span>
          <span className="text-caption text-ink-tertiary">{formatRelative(n.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
