'use client'

import { CheckCircle2, Circle } from 'lucide-react'

interface ShiftStreakProps {
  completedDates: string[]
}

export default function ShiftStreak({ completedDates }: ShiftStreakProps) {
  const getWeekDates = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }

  const weekDates = getWeekDates()
  const today = new Date().toDateString()

  const completedSet = new Set(completedDates.map((dateStr) => new Date(dateStr).toDateString()))

  let currentStreak = 0
  const checkingDate = new Date()

  while (true) {
    if (completedSet.has(checkingDate.toDateString())) {
      currentStreak++
      checkingDate.setDate(checkingDate.getDate() - 1)
    } else {
      if (checkingDate.toDateString() === today && currentStreak === 0) {
        checkingDate.setDate(checkingDate.getDate() - 1)
        continue
      }
      break
    }
  }

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="bg-surface-1 border border-hairline rounded-lg p-lg space-y-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-eyebrow font-medium tracking-eyebrow text-ink-subtle uppercase">
            Attendance Streaks
          </p>
          <h3 className="text-card-title font-semibold text-ink mt-xxs">
            {currentStreak === 0 ? 'Start your streak!' : `${currentStreak} Day Streak`}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-xs">
        {weekDates.map((date, idx) => {
          const isCompleted = completedSet.has(date.toDateString())
          const isToday = date.toDateString() === today
          return (
            <div
              key={idx}
              className={`streak-check flex flex-col items-center p-sm rounded-md border transition-colors cursor-pointer ${
                isCompleted
                  ? 'bg-surface-3 border-semantic-success/30 text-semantic-success'
                  : isToday
                  ? 'bg-surface-2 border-primary/30 text-primary'
                  : 'bg-surface-2 border-hairline text-ink-subtle'
              }`}
            >
              <span className="text-caption font-medium uppercase tracking-wider mb-xs">
                {daysOfWeek[idx]}
              </span>
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 fill-semantic-success/10" />
              ) : (
                <Circle className="h-5 w-5 opacity-40" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
