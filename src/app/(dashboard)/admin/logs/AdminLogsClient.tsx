'use client'

import { useState } from 'react'
import { Search, Calendar as CalendarIcon, Clock, Coffee, FileText, Download, User as UserIcon } from 'lucide-react'
import { Shift } from '@/lib/types'
import {
  formatInterval,
  formatTimeOnly,
  formatDateOnly,
  formatDateKey
} from '@/lib/utils/timezone'

interface ModeratorProfile {
  id: string
  legal_full_name: string
  email: string
}

interface AdminLogsClientProps {
  initialShifts: (Shift & { profiles?: { legal_full_name: string; email: string } | null })[]
  moderators: ModeratorProfile[]
  adminTimezone: string
}

export default function AdminLogsClient({ initialShifts, moderators, adminTimezone }: AdminLogsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModeratorId, setSelectedModeratorId] = useState<string>('all')

  // Filter shifts based on moderator selection, search query
  const filteredShifts = initialShifts.filter((shift) => {
    // 1. Moderator filter
    const matchesModerator =
      selectedModeratorId === 'all' || shift.user_id === selectedModeratorId

    // 2. Search query filter
    const summary = shift.summary || ''
    const dateFormatted = formatDateOnly(shift.clock_in, adminTimezone)
    const modName = shift.profiles?.legal_full_name || ''
    const modEmail = shift.profiles?.email || ''
    
    const matchesSearch =
      summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dateFormatted.toLowerCase().includes(searchQuery.toLowerCase()) ||
      modName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      modEmail.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesModerator && matchesSearch
  })

  // Group shifts by date key (yyyy-MM-dd) based on admin's timezone
  const groupedShifts: { [key: string]: typeof initialShifts } = {}
  filteredShifts.forEach((shift) => {
    const key = formatDateKey(shift.clock_in, adminTimezone)
    if (!groupedShifts[key]) {
      groupedShifts[key] = []
    }
    groupedShifts[key].push(shift)
  })

  // Sort dates keys in descending order
  const sortedDateKeys = Object.keys(groupedShifts).sort((a, b) => b.localeCompare(a))

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Moderator', 'Email', 'Date', 'Clock In', 'Clock Out', 'Total Active Time', 'Total Break Time', 'Summary']
    
    const rows = filteredShifts.map((shift) => {
      const modName = shift.profiles?.legal_full_name || 'Unknown'
      const modEmail = shift.profiles?.email || ''
      const date = formatDateOnly(shift.clock_in, adminTimezone)
      const clockIn = formatTimeOnly(shift.clock_in, adminTimezone)
      const clockOut = shift.clock_out ? formatTimeOnly(shift.clock_out, adminTimezone) : 'Active Now'
      const active = shift.status === 'completed' ? formatInterval(shift.total_active_time) : '--'
      const breakTime = shift.status === 'completed' ? formatInterval(shift.total_break_time) : '--'
      
      // Escape quotes and format summary text
      const summary = (shift.summary || '').replace(/"/g, '""')
      
      return [
        `"${modName}"`,
        `"${modEmail}"`,
        `"${date}"`,
        `"${clockIn}"`,
        `"${clockOut}"`,
        `"${active}"`,
        `"${breakTime}"`,
        `"${summary}"`
      ].join(',')
    })
    
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `moderator_logs_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-lg">
      {/* Top action bar: Search, Filter, Export */}
      <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col sm:flex-row gap-sm flex-1 max-w-2xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              placeholder="Search by moderator name, summary, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-1 text-ink text-body pl-10 pr-sm py-2 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle transition-colors duration-150"
            />
          </div>

          {/* Moderator Select Filter */}
          <div className="relative w-full sm:w-64">
            <select
              value={selectedModeratorId}
              onChange={(e) => setSelectedModeratorId(e.target.value)}
              className="w-full bg-surface-1 text-ink text-body px-sm py-2 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus cursor-pointer"
            >
              <option value="all">All Moderators</option>
              {moderators.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.legal_full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          disabled={filteredShifts.length === 0}
          className="inline-flex items-center gap-xs bg-primary hover:bg-primary-hover active:bg-primary-focus text-primary-foreground px-lg py-2 rounded-md font-medium text-button transition-all duration-150 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Log Feed */}
      {sortedDateKeys.length === 0 ? (
        <div className="text-center py-xl border border-dashed border-hairline rounded-lg bg-surface-1">
          <p className="text-ink-subtle text-body-sm">No shift logs found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-lg">
          {sortedDateKeys.map((dateKey) => {
            const shifts = groupedShifts[dateKey]
            const dateHeading = formatDateOnly(shifts[0].clock_in, adminTimezone)

            return (
              <div key={dateKey} className="space-y-md">
                {/* Date Header */}
                <h3 className="text-body-sm font-semibold tracking-wider text-ink-subtle uppercase flex items-center gap-xs">
                  <CalendarIcon className="h-4 w-4 text-ink-tertiary" />
                  {dateHeading}
                </h3>

                {/* Grid of shifts on this date */}
                <div className="grid grid-cols-1 gap-md">
                  {shifts.map((shift) => {
                    const modName = shift.profiles?.legal_full_name || 'Unknown Moderator'
                    return (
                      <div
                        key={shift.id}
                        className="bg-surface-1 border border-hairline rounded-lg p-lg shadow-sm hover:border-hairline-strong transition-all duration-150"
                      >
                        {/* Top Row: Moderator Info, Clock Times & Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm border-b border-hairline pb-sm mb-md">
                          <div className="space-y-xxs">
                            {/* Moderator Chip */}
                            <div className="flex items-center gap-xxs text-body font-semibold text-ink">
                              <UserIcon className="h-4 w-4 text-ink-subtle" />
                              {modName}
                            </div>
                            {/* Time details */}
                            <div className="flex items-center gap-md">
                              <span className="text-body-sm text-ink-muted">
                                {formatTimeOnly(shift.clock_in, adminTimezone)} –{' '}
                                {shift.clock_out ? formatTimeOnly(shift.clock_out, adminTimezone) : 'Active Now'}
                              </span>
                              
                              <span
                                className={`px-2 py-0.5 rounded-pill text-caption font-medium border uppercase ${
                                  shift.status === 'completed'
                                    ? 'border-green-500/30 text-green-600 dark:text-green-400 bg-transparent'
                                    : shift.status === 'on_break'
                                    ? 'bg-amber-950/20 text-amber-400 border-amber-900/50'
                                    : 'bg-blue-950/20 text-blue-400 border-blue-900/50'
                                }`}
                              >
                                {shift.status === 'completed' ? 'Completed' : shift.status === 'on_break' ? 'On Break' : 'On Duty'}
                              </span>
                            </div>
                          </div>

                          {/* Durations */}
                          <div className="flex items-center gap-md text-body-sm text-ink-muted">
                            <span className="flex items-center gap-xxs" title="Active Hours">
                              <Clock className="h-4 w-4 text-ink-subtle" />
                              Active: {shift.status === 'completed' ? formatInterval(shift.total_active_time) : '--'}
                            </span>
                            <span className="flex items-center gap-xxs" title="Break Time">
                              <Coffee className="h-4 w-4 text-ink-subtle" />
                              Break: {shift.status === 'completed' ? formatInterval(shift.total_break_time) : '--'}
                            </span>
                          </div>
                        </div>

                        {/* Summary Section */}
                        <div className="space-y-xs">
                          <div className="flex items-center gap-xxs text-caption text-ink-subtle uppercase tracking-wider font-semibold">
                            <FileText className="h-3.5 w-3.5" />
                            Shift Summary
                          </div>
                          <div className="bg-surface-2 border border-hairline rounded-md p-sm text-body-sm text-ink-muted whitespace-pre-wrap leading-relaxed">
                            {shift.summary || 'No summary submitted for this session.'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
