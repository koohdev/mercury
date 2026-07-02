'use client'

import { useState, useTransition } from 'react'
import { useTimer } from '@/lib/hooks/useTimer'
import { clockIn, clockOut, startBreak, endBreak } from '@/lib/actions/clock'
import { Play, Square, Pause } from 'lucide-react'

interface ClockWidgetProps {
  activeShift: {
    id: string
    clock_in: string
    status: 'active' | 'on_break'
    breaks?: { start_time: string; end_time: string | null }[]
  } | null
}

export default function ClockWidget({ activeShift }: ClockWidgetProps) {
  const [isPending, startTransition] = useTransition()
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState<string | null>(null)

  const shiftStatus = activeShift?.status || 'completed'
  const clockInTime = activeShift?.clock_in || null
  const breaks = activeShift?.breaks || []

  const { formatted } = useTimer(clockInTime, breaks, shiftStatus as 'active' | 'on_break' | 'completed')

  const handleClockIn = () => {
    startTransition(async () => {
      const res = await clockIn()
      if (res?.error) setError(res.error)
    })
  }

  const handleStartBreak = () => {
    if (!activeShift) return
    startTransition(async () => {
      const res = await startBreak(activeShift.id)
      if (res?.error) setError(res.error)
    })
  }

  const handleEndBreak = () => {
    if (!activeShift) return
    startTransition(async () => {
      const res = await endBreak(activeShift.id)
      if (res?.error) setError(res.error)
    })
  }

  const handleClockOut = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeShift) return
    if (!summary.trim()) {
      setError('Summary is mandatory.')
      return
    }

    startTransition(async () => {
      const res = await clockOut(activeShift.id, summary)
      if (res?.error) {
        setError(res.error)
      } else {
        setShowSummaryModal(false)
        setSummary('')
        setError(null)
      }
    })
  }

  return (
    <div className="bg-surface-1 border border-hairline rounded-2xl p-lg space-y-md h-full flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-eyebrow font-medium tracking-eyebrow text-ink-subtle uppercase">
            Shift Tracker
          </p>
          <h3 className="text-card-title font-semibold text-ink mt-xxs">
            {shiftStatus === 'active' && 'On Duty'}
            {shiftStatus === 'on_break' && 'On Break'}
            {shiftStatus === 'completed' && 'Off Duty'}
          </h3>
        </div>
        <div className="text-display-md font-mono font-semibold tracking-display-md text-ink">
          {formatted}
        </div>
      </div>

      {error && (
        <div className="p-sm bg-red-950/50 border border-red-800 rounded-md text-body-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-sm">
        {shiftStatus === 'completed' ? (
          <button
            onClick={handleClockIn}
            disabled={isPending}
            className="flex-1 bg-primary text-primary-foreground text-button py-2.5 rounded-md hover:bg-primary-hover focus:outline-2 focus:outline-primary-focus transition-colors duration-150 font-medium flex items-center justify-center gap-xs cursor-pointer disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> Clock In
          </button>
        ) : (
          <>
            {shiftStatus === 'active' ? (
              <button
                onClick={handleStartBreak}
                disabled={isPending}
                className="flex-1 bg-surface-2 hover:bg-surface-3 text-ink text-button py-2.5 rounded-md border border-hairline transition-colors duration-150 font-medium flex items-center justify-center gap-xs cursor-pointer disabled:opacity-50"
              >
                <Pause className="h-4 w-4" /> Take Break
              </button>
            ) : (
              <button
                onClick={handleEndBreak}
                disabled={isPending}
                className="flex-1 bg-primary text-primary-foreground text-button py-2.5 rounded-md hover:bg-primary-hover focus:outline-2 focus:outline-primary-focus transition-colors duration-150 font-medium flex items-center justify-center gap-xs cursor-pointer disabled:opacity-50"
              >
                <Play className="h-4 w-4" /> Resume Shift
              </button>
            )}

            <button
              onClick={() => setShowSummaryModal(true)}
              disabled={isPending}
              className="flex-1 bg-red-900/80 hover:bg-red-800 text-ink text-button py-2.5 rounded-md transition-colors duration-150 font-medium flex items-center justify-center gap-xs cursor-pointer disabled:opacity-50"
            >
              <Square className="h-4 w-4" /> Clock Out
            </button>
          </>
        )}
      </div>

      {/* Shift Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-semantic-overlay/80 p-md">
          <div className="w-full max-w-md bg-surface-1 border border-hairline rounded-lg p-lg space-y-md">
            <div>
              <h4 className="text-headline font-semibold text-ink">Submit Shift Summary</h4>
              <p className="text-body-sm text-ink-muted mt-xxs">
                Please summarize your worked tasks during this shift. This description is mandatory.
              </p>
            </div>

            <form onSubmit={handleClockOut} className="space-y-sm">
              <textarea
                required
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Approved clips, resolved tickets, bans handled..."
                className="w-full bg-surface-2 text-ink text-body p-sm rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus focus:border-transparent placeholder:text-ink-tertiary"
              />

              <div className="flex gap-sm justify-end">
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="bg-surface-2 hover:bg-surface-3 text-ink text-button px-lg py-2 rounded-md border border-hairline transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary text-primary-foreground text-button px-lg py-2 rounded-md hover:bg-primary-hover focus:outline-2 focus:outline-primary-focus disabled:opacity-50 transition-colors font-medium cursor-pointer"
                >
                  {isPending ? 'Clocking out...' : 'Confirm Clock Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
