'use client'

import { useState, useTransition } from 'react'
import { Clock, Check, Loader2, Globe } from 'lucide-react'
import { saveAvailability } from '@/lib/actions/availability'
import { timeToLocal } from '@/lib/utils/timezone'
import { Availability } from '@/lib/types'

interface AvailabilityClientProps {
  initialAvailability: Availability[]
  userTimezone: string
}

const DAYS = [
  { dayOfWeek: 0, label: 'Sunday' },
  { dayOfWeek: 1, label: 'Monday' },
  { dayOfWeek: 2, label: 'Tuesday' },
  { dayOfWeek: 3, label: 'Wednesday' },
  { dayOfWeek: 4, label: 'Thursday' },
  { dayOfWeek: 5, label: 'Friday' },
  { dayOfWeek: 6, label: 'Saturday' },
]

interface DayState {
  isAvailable: boolean
  startTime: string
  endTime: string
}

function initDayState(dayOfWeek: number, rows: Availability[], tz: string): DayState {
  const row = rows.find((r) => r.day_of_week === dayOfWeek)
  if (!row || !row.is_available) {
    return { isAvailable: false, startTime: '09:00', endTime: '17:00' }
  }
  return {
    isAvailable: true,
    startTime: row.start_time ? timeToLocal(row.start_time, tz) : '09:00',
    endTime: row.end_time ? timeToLocal(row.end_time, tz) : '17:00',
  }
}

export default function AvailabilityClient({
  initialAvailability,
  userTimezone,
}: AvailabilityClientProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [days, setDays] = useState<DayState[]>(() =>
    DAYS.map(({ dayOfWeek }) => initDayState(dayOfWeek, initialAvailability, userTimezone))
  )

  const toggleDay = (idx: number) => {
    setDays((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], isAvailable: !next[idx].isAvailable }
      return next
    })
    setSaved(false)
  }

  const updateTime = (idx: number, field: 'startTime' | 'endTime', value: string) => {
    setDays((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
    setSaved(false)
  }

  const handleSave = () => {
    setError(null)

    // Validate: available days must have valid start < end
    for (let i = 0; i < DAYS.length; i++) {
      const day = days[i]
      if (day.isAvailable) {
        if (!day.startTime || !day.endTime) {
          setError(`${DAYS[i].label} must have both start and end times set.`)
          return
        }
        if (day.startTime >= day.endTime) {
          setError(`${DAYS[i].label}: end time must be after start time.`)
          return
        }
      }
    }

    startTransition(async () => {
      const payload = DAYS.map(({ dayOfWeek }, idx) => ({
        dayOfWeek,
        isAvailable: days[idx].isAvailable,
        startTime: days[idx].startTime,
        endTime: days[idx].endTime,
      }))

      const res = await saveAvailability(payload, userTimezone)

      if (res?.error) {
        setError(res.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <div className="space-y-lg w-full">
      {/* Timezone notice */}
      <div className="flex items-start gap-sm bg-surface-1 p-sm border border-hairline rounded-lg text-body-sm text-ink-muted">
        <Globe className="mt-0.5 w-4 h-4 text-ink-subtle shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-xs gap-y-0.5">
          <div>
            <span className="font-medium text-ink">Your timezone: </span>
            <span className="font-semibold text-ink">{userTimezone}</span>
          </div>
          <span className="text-ink-tertiary text-xs sm:text-body-sm sm:before:content-['—_']">
            Times entered and shown in this timezone. Converted automatically and stored/displayed as EST for Admins.
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-950/20 p-sm border border-red-900/50 rounded-md text-body-sm text-red-400">
          {error}
        </div>
      )}

      {/* Day Rows */}
      <div className="space-y-sm">
        {DAYS.map(({ dayOfWeek, label }, idx) => {
          const day = days[idx]
          return (
            <div
              key={dayOfWeek}
              className={`flex flex-col sm:flex-row sm:items-center gap-md p-md rounded-lg border transition-all duration-150 ${
                day.isAvailable
                  ? 'bg-surface-1 border-hairline-strong'
                  : 'bg-surface-1 border-hairline opacity-50'
              }`}
            >
              {/* Checkbox + Day Name (Full-width toggle on mobile for easier tapping) */}
              <label
                onClick={() => toggleDay(idx)}
                className="flex items-center gap-sm sm:w-36 cursor-pointer shrink-0 select-none py-1 sm:py-0"
              >
                <div
                  className={`h-5 w-5 rounded flex items-center justify-center border transition-all duration-150 shrink-0 ${
                    day.isAvailable
                      ? 'bg-primary border-primary'
                      : 'bg-surface-2 border-hairline-strong hover:border-ink-subtle'
                  }`}
                >
                  {day.isAvailable && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                </div>
                <span className={`text-body-sm font-medium ${day.isAvailable ? 'text-ink' : 'text-ink-subtle'}`}>
                  {label}
                </span>
              </label>

              {/* Time Inputs */}
              <div className={`flex flex-1 items-center gap-xs sm:gap-sm transition-opacity duration-150 ${day.isAvailable ? '' : 'opacity-40 pointer-events-none'}`}>
                <Clock className="w-4 h-4 text-ink-subtle shrink-0 hidden sm:block" />
                <div className="flex-1 min-w-0">
                  <input
                    type="time"
                    disabled={!day.isAvailable}
                    value={day.startTime}
                    onChange={(e) => updateTime(idx, 'startTime', e.target.value)}
                    className="w-full bg-surface-2 px-2 sm:px-sm py-1.5 border border-hairline rounded-md focus:outline-2 focus:outline-primary-focus text-body-sm text-ink disabled:cursor-not-allowed min-w-0"
                  />
                </div>
                <span className="font-medium text-body-sm text-ink-subtle shrink-0">to</span>
                <div className="flex-1 min-w-0">
                  <input
                    type="time"
                    disabled={!day.isAvailable}
                    value={day.endTime}
                    onChange={(e) => updateTime(idx, 'endTime', e.target.value)}
                    className="w-full bg-surface-2 px-2 sm:px-sm py-1.5 border border-hairline rounded-md focus:outline-2 focus:outline-primary-focus text-body-sm text-ink disabled:cursor-not-allowed min-w-0"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-sm pt-md border-hairline border-t">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-xs bg-primary hover:bg-primary-hover active:bg-primary-focus disabled:opacity-50 shadow-md px-lg py-2 rounded-md font-medium text-button text-primary-foreground transition-colors duration-150 cursor-pointer w-full sm:w-auto"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Update Availability
        </button>

        {saved && (
          <span className="flex items-center gap-xxs font-medium text-body-sm text-semantic-success">
            <Check className="w-4 h-4" />
            Saved successfully
          </span>
        )}
      </div>
    </div>
  )
}
