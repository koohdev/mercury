'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Shift } from '@/lib/types'
import { DataTable } from '@/components/data-table'

interface LogsClientProps {
  initialShifts: Shift[]
  userTimezone: string
  page: number
}

export default function LogsClient({ initialShifts, userTimezone, page }: LogsClientProps) {
  const router = useRouter()
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

  const handlePageChange = (newPage: number) => {
    router.push(`/logs?page=${newPage}`)
  }

  return (
    <div className="space-y-md">
      {/* Search bar */}
      <div className="relative w-full lg:max-w-md">
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

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-hairline px-4 lg:px-6 pt-4 mt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-xs px-3 py-1.5 rounded-md border border-hairline text-body-sm hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-body-sm text-ink-muted font-medium">Page {page}</span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={initialShifts.length < 50}
            className="inline-flex items-center gap-xs px-3 py-1.5 rounded-md border border-hairline text-body-sm hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
