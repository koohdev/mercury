"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart showing shift active and break times"

interface ShiftData {
  clock_in: string
  total_active_time: string | null
  total_break_time: string | null
}

interface ChartDataPoint {
  date: string
  active: number
  breakTime: number
}

interface ChartAreaInteractiveProps {
  shiftsData: ShiftData[]
}

const chartConfig = {
  hours: {
    label: "Hours",
  },
  active: {
    label: "Active Hours",
    color: "var(--primary)",
  },
  breakTime: {
    label: "Break Hours",
    color: "var(--color-brand-secure)",
  },
} satisfies ChartConfig

function parseIntervalToHours(intervalStr: string | null): number {
  if (!intervalStr) return 0
  const parts = intervalStr.split(":")
  if (parts.length < 3) return 0
  const hours = parseFloat(parts[0]) || 0
  const minutes = parseFloat(parts[1]) || 0
  const seconds = parseFloat(parts[2]) || 0
  return hours + minutes / 60 + seconds / 3600
}

export function ChartAreaInteractive({ shiftsData }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")



  // Generate dynamic chart data based on shiftsData
  const processedData = React.useMemo(() => {
    const daysCount = timeRange === "7d" ? 7 : 30
    const result: ChartDataPoint[] = []

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateString = d.toISOString().split("T")[0]

      // Filter shifts on this date (local time)
      const dailyShifts = shiftsData.filter((shift) => {
        const shiftDate = new Date(shift.clock_in).toISOString().split("T")[0]
        return shiftDate === dateString
      })

      let totalActive = 0
      let totalBreak = 0

      dailyShifts.forEach((shift) => {
        totalActive += parseIntervalToHours(shift.total_active_time)
        totalBreak += parseIntervalToHours(shift.total_break_time)
      })

      result.push({
        date: dateString,
        active: Number(totalActive.toFixed(2)),
        breakTime: Number(totalBreak.toFixed(2)),
      })
    }

    return result
  }, [shiftsData, timeRange])

  return (
    <Card className="@container/card bg-surface-1 border border-hairline">
      <CardHeader>
        <CardTitle className="text-ink">Hours Worked & Break Trend</CardTitle>
        <CardDescription className="text-ink-muted">
          <span>Daily active work and break times</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden text-ink border-hairline bg-surface-2"
              size="sm"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-surface-2 border border-hairline text-ink">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={processedData}>
            <defs>
              <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-active)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-active)"
                  stopOpacity={0.0}
                />
              </linearGradient>
              <linearGradient id="fillBreak" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-breakTime)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-breakTime)"
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
              stroke="var(--color-ink-subtle)"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="breakTime"
              type="natural"
              fill="url(#fillBreak)"
              stroke="var(--color-breakTime)"
              stackId="a"
            />
            <Area
              dataKey="active"
              type="natural"
              fill="url(#fillActive)"
              stroke="var(--color-active)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
