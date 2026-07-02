'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Shift } from '@/lib/types'
import { DataTable } from '@/components/data-table'

interface LogsClientProps {
  initialShifts: Shift[]
  userTimezone: string
}

export default function LogsClient({ initialShifts, userTimezone }: LogsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredShifts = searchQuery.trim()
    ? initialShifts.filter((shift) => {
        const summary = shift.summary || ''
        const date = new Date(shift.clock_in).toLocaleDateString()
        return (
          summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          date.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    : initialShifts

  return (
    <div className="space-y-md">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <input
          type="text"
          placeholder="Search by date or summary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-1 text-ink text-body pl-10 pr-sm py-2 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle transition-colors"
        />
      </div>

      {/* Table — same component as Recent Shift Logs on the dashboard */}
      <div className="bg-surface-1 border border-hairline rounded-2xl py-6 shadow-sm">
        <div className="px-4 lg:px-6 pb-2">
          <h3 className="text-lg font-semibold text-ink">My Shift History</h3>
          <p className="text-sm text-ink-muted mt-0.5">Full record of all your logged shifts</p>
        </div>
        <DataTable data={filteredShifts as any[]} />
      </div>
    </div>
  )
}
