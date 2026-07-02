'use client'

import Link from 'next/link'
import { ArrowRight, DollarSign, Calendar } from 'lucide-react'

interface PayWidgetProps {
  monthlyRate: number
  baseRate: number
  startDate: Date
  endDate: Date
}

export default function PayWidget({ monthlyRate, baseRate, startDate, endDate }: PayWidgetProps) {
  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} – ${endStr}`
  }

  const percent = baseRate > 0 ? Math.min((monthlyRate / baseRate) * 100, 100) : 0

  return (
    <div className="bg-surface-1 border border-hairline rounded-2xl p-lg flex flex-col justify-between h-full space-y-lg relative overflow-hidden">
      {/* Premium background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-[radial-gradient(circle,rgba(168,85,247,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="space-y-md">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow font-medium tracking-eyebrow text-ink-subtle uppercase">
            Projected Monthly Pay
          </p>
          <div className="bg-surface-2 border border-hairline px-2 py-0.5 rounded-pill flex items-center gap-xxs text-caption text-ink-muted">
            <Calendar className="h-3 w-3 text-primary" />
            <span>{formatDateRange(startDate, endDate)}</span>
          </div>
        </div>

        <div className="space-y-xs">
          <div className="flex items-baseline gap-xxs">
            <span className="text-display-md font-semibold tracking-display-md text-ink">
              ${monthlyRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Progress bar to represent projection against base monthly rate */}
          <div className="space-y-xxs">
            <div className="flex justify-between text-caption">
              <span className="text-ink-subtle">Estimated Progress</span>
              <span className="text-ink-muted font-medium">{percent.toFixed(0)}% of Base</span>
            </div>
            <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden border border-hairline-tertiary">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Profile Base Monthly Rate Information */}
        <div className="bg-surface-2/50 border border-hairline-tertiary rounded-xl p-sm flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <span className="text-body-sm text-ink-muted">Base Monthly Pay</span>
          </div>
          <span className="text-body-sm font-semibold text-ink">
            ${baseRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <Link
        href="/pay"
        className="inline-flex items-center justify-between text-button text-primary hover:text-primary-hover font-medium transition-colors cursor-pointer group pt-md border-t border-hairline-tertiary"
      >
        <span>View pay period details</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-xs" />
      </Link>
    </div>
  )
}
