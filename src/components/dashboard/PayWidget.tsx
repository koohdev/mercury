'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface PayWidgetProps {
  monthlyRate: number
}

export default function PayWidget({ monthlyRate }: PayWidgetProps) {
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-surface-1 border border-hairline rounded-2xl p-lg flex flex-col justify-between h-full space-y-md">
      <div>
        <p className="text-eyebrow font-medium tracking-eyebrow text-ink-subtle uppercase">
          Projected Monthly Pay
        </p>
        <div className="flex items-baseline gap-xxs mt-sm">
          <span className="text-display-md font-semibold tracking-display-md text-ink">
            ${monthlyRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-caption text-ink-muted mt-xxs">
          Projected for {currentMonthName}
        </p>
      </div>

      <Link
        href="/pay"
        className="inline-flex items-center justify-between text-button text-primary hover:text-primary-hover font-medium transition-colors cursor-pointer group"
      >
        <span>View full breakdown</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-xs" />
      </Link>
    </div>
  )
}
