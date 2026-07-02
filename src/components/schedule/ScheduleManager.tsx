'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react'
import { createSchedule, updateSchedule, deleteSchedule } from '@/lib/actions/schedule'
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return undefined
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

const formatLocalDate = (date: Date | undefined) => {
  if (!date) return ""
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

interface Profile {
  id: string
  legal_full_name: string
  email: string
  role: string
}

interface ScheduleEntry {
  id: string
  user_id: string
  start_time: string
  end_time: string
  label: string | null
  color: string | null
}

interface ScheduleManagerProps {
  currentUser: any
  profiles: Profile[]
  initialEntries: ScheduleEntry[]
  isAdmin: boolean
}

const PRESET_COLORS = [
  { name: 'Lavender', hex: '#5e6ad2' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Fuchsia', hex: '#d946ef' },
  { name: 'Success Green', hex: '#27a644' },
  { name: 'Orange', hex: '#ea580c' },
]

export default function ScheduleManager({
  currentUser,
  profiles,
  initialEntries,
  isAdmin,
}: ScheduleManagerProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'timeline'>('month')
  const [isPending, startTransition] = useTransition()

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form Fields
  const [userId, setUserId] = useState(profiles[0]?.id || '')
  const [label, setLabel] = useState('Chat Coverage')
  const [color, setColor] = useState('#5e6ad2')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('17:00')

  // Helpers to calculate start/end range of current view
  const getWeekRange = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // start on Monday
    const startOfWeek = new Date(d.setDate(diff))
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return { startOfWeek, endOfWeek }
  }

  const { startOfWeek, endOfWeek } = getWeekRange(currentDate)

  const getDayRange = (date: Date) => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    return { startOfDay, endOfDay }
  }

  const { startOfDay, endOfDay } = getDayRange(currentDate)

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const dayOfWeek = firstDayOfMonth.getDay()
    const startPadding = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startGridDate = new Date(firstDayOfMonth)
    startGridDate.setDate(firstDayOfMonth.getDate() - startPadding)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startGridDate)
      d.setDate(startGridDate.getDate() + i)
      return d
    })
  }

  // Filter entries in view range
  const entriesInView = initialEntries.filter((entry) => {
    const entryStart = new Date(entry.start_time).getTime()
    let rangeStart, rangeEnd
    if (viewMode === 'month') {
      const days = getMonthDays(currentDate)
      rangeStart = new Date(days[0]).setHours(0, 0, 0, 0)
      rangeEnd = new Date(days[41]).setHours(23, 59, 59, 999)
    } else if (viewMode === 'week') {
      rangeStart = startOfWeek.getTime()
      rangeEnd = endOfWeek.getTime()
    } else {
      // timeline or day view
      rangeStart = startOfDay.getTime()
      rangeEnd = endOfDay.getTime()
    }
    return entryStart >= rangeStart && entryStart <= rangeEnd
  })

  // Filter shifts specifically for the currently selected date (for list view)
  const shiftsForSelectedDate = initialEntries.filter((entry) => {
    const entryDate = new Date(entry.start_time)
    return entryDate.toDateString() === currentDate.toDateString()
  })

  // Check if current logged-in user has assignments in current view
  const userHasAssignments = entriesInView.some((e) => e.user_id === currentUser.id)

  // Get range display text
  const getRangeLabel = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    } else if (viewMode === 'day' || viewMode === 'timeline') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } else {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
      return `${startOfWeek.toLocaleDateString('en-US', options)} – ${endOfWeek.toLocaleDateString(
        'en-US',
        { ...options, year: 'numeric' }
      )}`
    }
  }

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate)
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1)
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7)
    } else {
      d.setDate(d.getDate() - 1)
    }
    setCurrentDate(d)
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1)
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7)
    } else {
      d.setDate(d.getDate() + 1)
    }
    setCurrentDate(d)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Get grid days
  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return d
    })
  }

  const weekDays = getWeekDays()

  // Form submit handlers
  const openCreateModal = () => {
    setUserId(profiles[0]?.id || '')
    setLabel('Chat Coverage')
    setColor('#5e6ad2')
    const todayStr = currentDate.toISOString().split('T')[0]
    setStartDate(todayStr)
    setEndDate(todayStr)
    setStartTime('09:00')
    setEndTime('17:00')
    setError(null)
    setShowCreateModal(true)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const startIso = new Date(`${startDate}T${startTime}`).toISOString()
    const endIso = new Date(`${endDate}T${endTime}`).toISOString()

    if (new Date(endIso) <= new Date(startIso)) {
      setError('End time must be after start time.')
      return
    }

    startTransition(async () => {
      const res = await createSchedule({
        userId,
        startTime: startIso,
        endTime: endIso,
        label,
        color,
      })

      if (res?.error) {
        setError(res.error)
      } else {
        setShowCreateModal(false)
        setError(null)
      }
    })
  }

  const openEditModal = (entry: ScheduleEntry) => {
    setSelectedEntry(entry)
    setUserId(entry.user_id)
    setLabel(entry.label || 'Chat Coverage')
    setColor(entry.color || '#5e6ad2')

    const startLocal = new Date(entry.start_time)
    const endLocal = new Date(entry.end_time)

    setStartDate(startLocal.toLocaleDateString('en-CA')) // YYYY-MM-DD format
    setStartTime(startLocal.toTimeString().slice(0, 5))
    setEndDate(endLocal.toLocaleDateString('en-CA'))
    setEndTime(endLocal.toTimeString().slice(0, 5))

    setError(null)
    setShowEditModal(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEntry) return

    const startIso = new Date(`${startDate}T${startTime}`).toISOString()
    const endIso = new Date(`${endDate}T${endTime}`).toISOString()

    if (new Date(endIso) <= new Date(startIso)) {
      setError('End time must be after start time.')
      return
    }

    startTransition(async () => {
      const res = await updateSchedule(selectedEntry.id, {
        userId,
        startTime: startIso,
        endTime: endIso,
        label,
        color,
      })

      if (res?.error) {
        setError(res.error)
      } else {
        setShowEditModal(false)
        setError(null)
      }
    })
  }

  const handleDelete = () => {
    if (!selectedEntry) return
    if (!confirm('Are you sure you want to delete this schedule entry?')) return

    startTransition(async () => {
      const res = await deleteSchedule(selectedEntry.id)
      if (res?.error) {
        setError(res.error)
      } else {
        setShowEditModal(false)
        setError(null)
      }
    })
  }

  // Group entries by day name for rendering in week grid
  const getShiftsForDay = (date: Date) => {
    return entriesInView.filter((entry) => {
      const entryDate = new Date(entry.start_time)
      return entryDate.toDateString() === date.toDateString()
    })
  }

  const formatTimeRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const formatOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true }
    return `${start.toLocaleTimeString('en-US', formatOpts)} – ${end.toLocaleTimeString('en-US', formatOpts)}`
  }

  const getUserName = (id: string) => {
    return profiles.find((p) => p.id === id)?.legal_full_name || 'Unknown User'
  }

  // Create unique scheduled team member colors list for legend
  const legendItems = Array.from(new Set(entriesInView.map((e) => e.user_id)))
    .map((userId) => {
      const name = getUserName(userId)
      const entry = entriesInView.find((e) => e.user_id === userId)
      return { name, color: entry?.color || '#5e6ad2' }
    })

  return (
    <div className="space-y-md">
      {/* Page Header */}
      <div className="flex md:flex-row flex-col md:justify-between md:items-center gap-md">
        <div>
          <h1 className="font-medium text-eyebrow text-ink-subtle tracking-eyebrow">
            Team Scheduling
          </h1>
          <h2 className="mt-xxs font-semibold text-headline text-ink">Chat Coverage</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-sm w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-sm w-full sm:w-auto">
            {/* View Toggles */}
            <div className="flex flex-1 sm:flex-none bg-surface-1 p-xxs border border-hairline rounded-md">
              <button
                onClick={() => setViewMode('month')}
                className={`flex-1 sm:flex-initial text-center px-sm py-1.5 rounded-sm text-caption font-medium transition-colors cursor-pointer ${
                  viewMode === 'month' ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`flex-1 sm:flex-initial text-center px-sm py-1.5 rounded-sm text-caption font-medium transition-colors cursor-pointer ${
                  viewMode === 'week' ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`flex-1 sm:flex-initial text-center px-sm py-1.5 rounded-sm text-caption font-medium transition-colors cursor-pointer ${
                  viewMode === 'day' ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex-1 sm:flex-initial text-center px-sm py-1.5 rounded-sm text-caption font-medium transition-colors cursor-pointer ${
                  viewMode === 'timeline' ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink'
                }`}
              >
                Timeline
              </button>
            </div>

            {/* Navigation Controls */}
            <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-start gap-xxs bg-surface-1 p-xxs border border-hairline rounded-md">
              <button
                onClick={handlePrev}
                className="hover:bg-surface-2 p-1.5 rounded-sm text-ink-subtle hover:text-ink cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="hover:bg-surface-2 px-sm py-1 rounded-sm font-medium text-caption text-ink-subtle hover:text-ink cursor-pointer flex-1 sm:flex-initial text-center"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="hover:bg-surface-2 p-1.5 rounded-sm text-ink-subtle hover:text-ink cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add Shift Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-xxs bg-primary hover:bg-primary-hover px-sm py-2 rounded-md font-medium text-button text-primary-foreground transition-colors cursor-pointer w-full sm:w-auto shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Shift
            </button>
          )}
        </div>
      </div>

      {/* Date Range Display & Legend */}
      <div className="flex md:flex-row flex-col md:justify-between md:items-center gap-sm bg-surface-1 p-sm border border-hairline rounded-lg">
        <p className="font-medium text-body text-ink">{getRangeLabel()}</p>
        
        {/* Legend */}
        {legendItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-sm">
            {legendItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-xxs text-caption text-ink-muted">
                <span className="rounded-full w-2 h-2" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State Banner for Moderators */}
      {!isAdmin && !userHasAssignments && (
        <div className="flex items-start gap-sm bg-surface-1 p-lg border border-hairline rounded-lg">
          <AlertCircle className="mt-0.5 w-5 h-5 text-ink-subtle" />
          <div>
            <h4 className="font-medium text-body text-ink">You&apos;re not assigned yet</h4>
            <p className="mt-xxs text-body-sm text-ink-muted">
              You are not assigned to any coverage slots in this view. Contact your admin if you believe this is an error.
            </p>
          </div>
        </div>
      )}

      {/* Calendar Grid View */}
      {viewMode === 'month' && (
        <div className="border border-hairline rounded-lg bg-surface-1 overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 bg-surface-2 border-b border-hairline">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
              <div key={dayName} className="text-center py-xs text-caption font-semibold text-ink-subtle uppercase tracking-wider">
                {dayName}
              </div>
            ))}
          </div>

          {/* Month grid days */}
          <div className="grid grid-cols-7 bg-hairline gap-[1px]">
            {getMonthDays(currentDate).map((day, idx) => {
              const shifts = getShiftsForDay(day)
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = day.toDateString() === currentDate.toDateString()
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(day)
                  }}
                  className={`min-h-[60px] md:min-h-[120px] p-1.5 md:p-sm bg-surface-1 flex flex-col justify-between transition-colors cursor-pointer select-none ${
                    isCurrentMonth ? '' : 'opacity-40'
                  } ${
                    isSelected ? 'bg-surface-2 ring-1 ring-primary/30' : 'hover:bg-surface-2'
                  }`}
                >
                  {/* Cell Header */}
                  <div className="flex justify-end items-center">
                    <span className={`h-5 w-5 flex items-center justify-center text-xs md:text-sm font-mono rounded-full ${
                      isToday ? 'bg-primary text-primary-foreground font-semibold' : 'text-ink'
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Cell Shifts - Desktop only */}
                  <div className="hidden md:flex flex-col gap-xxs mt-xs overflow-y-auto max-h-[80px]">
                    {shifts.slice(0, 3).map((shift) => (
                      <div
                        key={shift.id}
                        onClick={(e) => {
                          if (isAdmin) {
                            e.stopPropagation()
                            openEditModal(shift)
                          }
                        }}
                        style={{
                          backgroundColor: `${shift.color || '#5e6ad2'}1a`
                        }}
                        className="text-[9px] leading-tight px-1.5 py-0.5 text-ink rounded-sm truncate"
                      >
                        <span className="font-semibold">{getUserName(shift.user_id)}</span> {shift.label || 'Coverage'}
                      </div>
                    ))}
                    {shifts.length > 3 && (
                      <span className="text-[8px] text-ink-subtle font-semibold pl-xxs">
                        +{shifts.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Indicator Dots - Mobile only */}
                  <div className="flex md:hidden flex-wrap gap-[2px] mt-xs">
                    {shifts.map((shift) => (
                      <span
                        key={shift.id}
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: shift.color || '#5e6ad2' }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="border border-hairline rounded-lg bg-surface-1 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-7 bg-hairline gap-[1px]">
            {weekDays.map((day, idx) => {
              const shifts = getShiftsForDay(day)
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = day.toDateString() === currentDate.toDateString()
              return (
                <div
                  key={idx}
                  onClick={() => setCurrentDate(day)}
                  className={`bg-surface-1 p-sm min-h-[160px] flex flex-col space-y-sm transition-colors cursor-pointer ${
                    isSelected ? 'bg-surface-2 ring-1 ring-primary/30' : 'hover:bg-surface-2'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex justify-between items-baseline pb-xxs border-hairline border-b">
                    <span className={`text-caption font-semibold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-ink-subtle'}`}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className={`h-5 w-5 flex items-center justify-center text-body font-mono rounded-full ${
                      isToday ? 'bg-primary text-primary-foreground font-semibold' : 'text-ink-subtle'
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Day Shifts */}
                  <div className="flex flex-col flex-1 gap-xxs overflow-y-auto">
                    {shifts.length > 0 ? (
                      shifts.map((shift) => {
                        const isCurrentUser = shift.user_id === currentUser.id
                        return (
                          <div
                            key={shift.id}
                            onClick={(e) => {
                              if (isAdmin) {
                                e.stopPropagation()
                                openEditModal(shift)
                              }
                            }}
                            style={{
                              backgroundColor: `${shift.color || '#5e6ad2'}1a`
                            }}
                            className={`p-xs rounded-md text-left space-y-xxs transition-all text-caption ${
                              isAdmin ? 'hover:bg-surface-3/50 hover:translate-x-0.5 cursor-pointer' : ''
                            } ${isCurrentUser ? 'outline-1 outline-primary/40 ring-1 ring-primary/40' : ''}`}
                          >
                            <div className="flex justify-between items-center gap-xxs">
                              <span className="font-semibold text-ink truncate">
                                {getUserName(shift.user_id)}
                              </span>
                              {isCurrentUser && (
                                <span className="bg-primary/20 px-1 rounded-sm text-[10px] text-primary">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="font-medium text-[11px] text-ink-muted leading-tight">
                              {shift.label || 'Coverage'}
                            </p>
                            <p className="font-mono text-[10px] text-ink-subtle">
                              {formatTimeRange(shift.start_time, shift.end_time)}
                            </p>
                          </div>
                        )
                      })
                    ) : (
                      <span className="mt-sm text-[11px] text-ink-tertiary text-center italic">No coverage</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="border border-hairline rounded-lg bg-surface-1 overflow-hidden shadow-sm relative">
          <div className="overflow-x-auto">
            <div className="min-w-[1920px] divide-y divide-hairline relative">
              {/* Current Time Indicator Line */}
              {currentDate.toDateString() === new Date().toDateString() && (
                <div
                  style={{
                    left: `${(new Date().getHours() + new Date().getMinutes() / 60) * 80}px`
                  }}
                  className="absolute top-0 bottom-0 w-[1.5px] bg-primary z-30 pointer-events-none flex flex-col items-center"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-primary -mt-1 shadow-sm" />
                </div>
              )}

              {/* Header row */}
              <div className="grid grid-cols-[repeat(24,80px)] bg-surface-2 divide-x divide-hairline border-b border-hairline">
                {Array.from({ length: 24 }).map((_, h) => {
                  const label = h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`
                  return (
                    <div key={h} className="p-sm text-center flex flex-col items-center justify-center text-[10px] font-semibold text-ink-subtle uppercase tracking-wider">
                      {label}
                    </div>
                  )
                })}
              </div>

              {/* Data rows */}
              {profiles.length > 0 ? (
                profiles.map((profile) => {
                  const userShifts = entriesInView.filter((entry) => entry.user_id === profile.id)

                  return (
                    <div key={profile.id} className="grid grid-cols-[repeat(24,80px)] grid-rows-1 divide-x divide-hairline hover:bg-surface-2/30 transition-colors relative items-center min-h-[56px]">
                      {/* Day cells background slots */}
                      {Array.from({ length: 24 }).map((_, h) => (
                        <div
                          key={h}
                          style={{ gridColumnStart: h + 1, gridRowStart: 1 }}
                          className="h-full border-r border-hairline/20 bg-transparent z-0"
                        />
                      ))}

                      {/* Shifts overlay */}
                      {userShifts.map((shift) => {
                        const startLocal = new Date(shift.start_time)
                        const endLocal = new Date(shift.end_time)
                        
                        const startHr = startLocal.toDateString() === currentDate.toDateString() ? startLocal.getHours() : 0
                        const endHr = endLocal.toDateString() === currentDate.toDateString() ? Math.ceil(endLocal.getHours() + endLocal.getMinutes() / 60) : 24
                        
                        const S = Math.max(0, Math.min(23, startHr))
                        const E = Math.max(S + 1, Math.min(24, endHr))

                        const isCurrentUser = shift.user_id === currentUser.id

                        return (
                          <div
                            key={shift.id}
                            onClick={() => isAdmin && openEditModal(shift)}
                            style={{
                              gridColumnStart: S + 1,
                              gridColumnEnd: E + 1,
                              gridRowStart: 1,
                              backgroundColor: `${shift.color || '#5e6ad2'}12`,
                              borderColor: `${shift.color || '#5e6ad2'}40`
                            }}
                            className={`mx-1.5 my-2 px-sm rounded-lg border text-left flex items-center justify-between transition-all duration-150 z-10 hover:shadow-xs min-h-[38px] ${
                              isAdmin ? 'hover:bg-surface-3/30 cursor-pointer' : ''
                            }`}
                          >
                            <div className="flex items-center gap-xs truncate">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: shift.color || '#5e6ad2' }} />
                              <span className="font-semibold text-ink text-[10px] truncate">
                                <span className="text-primary font-bold">{getUserName(shift.user_id)}</span>{shift.label ? ` — ${shift.label}` : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-xs shrink-0 pl-xs">
                              <span className="font-mono text-[9px] text-ink-subtle">
                                {formatTimeRange(shift.start_time, shift.end_time)}
                              </span>
                              {isCurrentUser && (
                                <span className="bg-primary/10 text-primary border border-primary/20 px-1 rounded-sm text-[7px] font-medium">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              ) : (
                <div className="p-lg text-center text-body-sm text-ink-subtle italic col-span-24">
                  No moderators registered.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'day' && (
        <div className="space-y-sm bg-surface-1 p-lg border border-hairline rounded-lg">
          <h3 className="pb-xs border-hairline border-b font-semibold text-body text-ink">
            Assignments for {getRangeLabel()}
          </h3>
          
          <div className="divide-y divide-hairline">
            {entriesInView.length > 0 ? (
              entriesInView.map((shift) => {
                const isCurrentUser = shift.user_id === currentUser.id
                return (
                  <div
                    key={shift.id}
                    onClick={() => isAdmin && openEditModal(shift)}
                    className={`flex items-center justify-between py-sm transition-colors ${
                      isAdmin ? 'hover:bg-surface-2 cursor-pointer px-sm -mx-sm rounded-md' : ''
                    }`}
                  >
                    <div className="flex items-center gap-sm">
                      <span className="rounded-full w-3 h-3 shrink-0" style={{ backgroundColor: shift.color || '#5e6ad2' }} />
                      <div>
                        <div className="flex items-center gap-xs">
                          <p className="font-semibold text-body-sm text-ink">
                            {getUserName(shift.user_id)}
                          </p>
                          {isCurrentUser && (
                            <span className="bg-primary/20 px-1 rounded-sm text-[10px] text-primary">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-caption text-ink-muted">{shift.label || 'Coverage'}</p>
                      </div>
                    </div>

                    <p className="font-mono text-body-sm text-ink-muted">
                      {formatTimeRange(shift.start_time, shift.end_time)}
                    </p>
                  </div>
                )
              })
            ) : (
              <p className="py-lg text-body-sm text-ink-subtle text-center italic">
                No assignments scheduled for today.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Daily schedule drawer details listed below calendar in Month View */}
      {viewMode === 'month' && (
        <div className="space-y-sm bg-surface-1 p-lg border border-hairline rounded-lg">
          <h3 className="pb-xs border-hairline border-b font-semibold text-body text-ink">
            Assignments for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          
          <div className="divide-y divide-hairline">
            {shiftsForSelectedDate.length > 0 ? (
              shiftsForSelectedDate.map((shift) => {
                const isCurrentUser = shift.user_id === currentUser.id
                return (
                  <div
                    key={shift.id}
                    onClick={() => isAdmin && openEditModal(shift)}
                    className={`flex items-center justify-between py-sm transition-colors ${
                      isAdmin ? 'hover:bg-surface-2 cursor-pointer px-sm -mx-sm rounded-md' : ''
                    }`}
                  >
                    <div className="flex items-center gap-sm">
                      <span className="rounded-full w-3 h-3 shrink-0" style={{ backgroundColor: shift.color || '#5e6ad2' }} />
                      <div>
                        <div className="flex items-center gap-xs">
                          <p className="font-semibold text-body-sm text-ink">
                            {getUserName(shift.user_id)}
                          </p>
                          {isCurrentUser && (
                            <span className="bg-primary/20 px-1 rounded-sm text-[10px] text-primary">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-caption text-ink-muted">{shift.label || 'Coverage'}</p>
                      </div>
                    </div>

                    <p className="font-mono text-body-sm text-ink-muted">
                      {formatTimeRange(shift.start_time, shift.end_time)}
                    </p>
                  </div>
                )
              })
            ) : (
              <p className="py-lg text-body-sm text-ink-subtle text-center italic">
                No assignments scheduled for this day.
              </p>
            )}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-semantic-overlay/80 p-md">
          <div className="space-y-md bg-surface-1 p-lg border border-hairline rounded-lg w-full max-w-md">
            <div>
              <h4 className="font-semibold text-headline text-ink">Create Shift</h4>
              <p className="mt-xxs text-body-sm text-ink-muted">Add a new moderator assignment block.</p>
            </div>

            {error && (
              <div className="bg-red-950/50 p-sm border border-red-800 rounded-md text-body-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-sm">
              <div>
                <label className="block font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Moderator
                </label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger className="bg-surface-2 mt-1 border-hairline w-full text-ink">
                    <SelectValue placeholder="Select moderator" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-2 border border-hairline text-ink">
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.legal_full_name} ({p.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Label
                </label>
                <Input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Chat Coverage"
                  className="block bg-surface-2 mt-1 border-hairline w-full text-ink"
                />
              </div>

              <div>
                <label className="block mb-xs font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Color Tag
                </label>
                <div className="flex gap-xs">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`h-6 w-6 rounded-full border cursor-pointer ${
                        color === c.hex ? 'border-ink scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="gap-sm grid grid-cols-2">
                <div>
                  <label className="block mb-1 font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                    Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex justify-between items-center bg-surface-2 px-3 py-2 border border-hairline rounded-md outline-none focus:outline-2 focus:outline-primary-focus w-full h-9 text-ink text-sm cursor-pointer"
                      >
                        <span className="truncate">
                          {startDate ? format(parseLocalDate(startDate)!, "PPP") : "Pick date"}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-ink-subtle shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="z-100 p-0 w-auto" align="start">
                      <Calendar
                         mode="single"
                         selected={parseLocalDate(startDate)}
                         onSelect={(date) => {
                           if (date) {
                             setStartDate(formatLocalDate(date))
                           }
                         }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block mb-1 font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="block bg-surface-2 mt-1 border-hairline w-full h-9 text-ink"
                  />
                </div>
              </div>

              <div className="gap-sm grid grid-cols-2">
                <div>
                  <label className="block mb-1 font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                    End Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex justify-between items-center bg-surface-2 px-3 py-2 border border-hairline rounded-md outline-none focus:outline-2 focus:outline-primary-focus w-full h-9 text-ink text-sm cursor-pointer"
                      >
                        <span className="truncate">
                          {endDate ? format(parseLocalDate(endDate)!, "PPP") : "Pick date"}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-ink-subtle shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="z-100 p-0 w-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={parseLocalDate(endDate)}
                        onSelect={(date) => {
                          if (date) {
                            setEndDate(formatLocalDate(date))
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block mb-1 font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                    End Time
                  </label>
                  <Input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="block bg-surface-2 mt-1 border-hairline w-full h-9 text-ink"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-sm pt-md border-hairline border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-surface-2 hover:bg-surface-3 px-lg py-2 border border-hairline rounded-md text-button text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-50 px-lg py-2 rounded-md focus:outline-2 focus:outline-primary-focus font-medium text-button text-primary-foreground transition-colors cursor-pointer"
                >
                  {isPending ? 'Saving...' : 'Add Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedEntry && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-semantic-overlay/80 p-md">
          <div className="space-y-md bg-surface-1 p-lg border border-hairline rounded-lg w-full max-w-md">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-headline text-ink">Edit Assignment</h4>
                <p className="mt-xxs text-body-sm text-ink-muted">Modify or remove this shift slot.</p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-900/20 hover:bg-red-900/40 p-2 rounded-md text-red-400 transition-colors cursor-pointer"
                title="Delete Assignment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="bg-red-950/50 p-sm border border-red-800 rounded-md text-body-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-sm">
              <div>
                <label className="block font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Moderator
                </label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger className="bg-surface-2 mt-1 border-hairline w-full text-ink">
                    <SelectValue placeholder="Select moderator" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-2 border border-hairline text-ink">
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.legal_full_name} ({p.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Label
                </label>
                <Input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Chat Coverage"
                  className="block bg-surface-2 mt-1 border-hairline w-full text-ink"
                />
              </div>

              <div>
                <label className="block mb-xs font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Color Tag
                </label>
                <div className="flex gap-xs">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`h-6 w-6 rounded-full border cursor-pointer ${
                        color === c.hex ? 'border-ink scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="gap-sm grid grid-cols-2">
                <div>
                  <label className="block mb-1 font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                    Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex justify-between items-center bg-surface-2 px-3 py-2 border border-hairline rounded-md outline-none focus:outline-2 focus:outline-primary-focus w-full h-9 text-ink text-sm cursor-pointer"
                      >
                        <span className="truncate">
                          {startDate ? format(parseLocalDate(startDate)!, "PPP") : "Pick date"}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-ink-subtle shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="z-100 p-0 w-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={parseLocalDate(startDate)}
                        onSelect={(date) => {
                          if (date) {
                            setStartDate(formatLocalDate(date))
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block mb-1 font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="block bg-surface-2 mt-1 border-hairline w-full h-9 text-ink"
                  />
                </div>
              </div>

              <div className="gap-sm grid grid-cols-2">
                <div>
                  <label className="block mb-1 font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                    End Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex justify-between items-center bg-surface-2 px-3 py-2 border border-hairline rounded-md outline-none focus:outline-2 focus:outline-primary-focus w-full h-9 text-ink text-sm cursor-pointer"
                      >
                        <span className="truncate">
                          {endDate ? format(parseLocalDate(endDate)!, "PPP") : "Pick date"}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-ink-subtle shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="z-100 p-0 w-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={parseLocalDate(endDate)}
                        onSelect={(date) => {
                          if (date) {
                            setEndDate(formatLocalDate(date))
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block mb-1 font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                    End Time
                  </label>
                  <Input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="block bg-surface-2 mt-1 border-hairline w-full h-9 text-ink"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-sm pt-md border-hairline border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-surface-2 hover:bg-surface-3 px-lg py-2 border border-hairline rounded-md text-button text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-50 px-lg py-2 rounded-md focus:outline-2 focus:outline-primary-focus font-medium text-button text-primary-foreground transition-colors cursor-pointer"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
