"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon } from "lucide-react"

import Link from "next/link"
import CreateCampaignWidget from "@/components/dashboard/CreateCampaignWidget"

interface SectionCardsProps {
  totalHours: number
  completedShiftsCount: number
  campaignsCount?: number
  role?: 'admin' | 'moderator' | 'manager'
}

export function SectionCards({
  totalHours,
  completedShiftsCount,
  campaignsCount = 0,
  role = 'moderator',
}: SectionCardsProps) {
  const isManagerOrAdmin = role === 'admin' || role === 'manager'

  const campaignsCardContent = (
    <Card className={`@container/card h-full flex flex-col justify-between transition-all duration-150 ${isManagerOrAdmin ? 'hover:border-primary/40 hover:bg-primary/1 cursor-pointer' : ''}`}>
      <CardHeader>
        <CardDescription>
          {isManagerOrAdmin ? 'Total Campaigns' : 'My Campaigns'}
        </CardDescription>
        <CardTitle className="font-semibold tabular-nums text-2xl @[250px]/card:text-3xl">
          {campaignsCount}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <TrendingUpIcon />
            {isManagerOrAdmin ? 'Managed' : 'Assigned'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm mt-auto w-full">
        <div className="flex gap-2 font-medium line-clamp-1">
          {isManagerOrAdmin ? 'Launch a Campaign' : 'Active tracking'}{" "}
          <TrendingUpIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">
          {isManagerOrAdmin
            ? 'Click to manage, edit, or launch campaigns'
            : 'Campaigns assigned to your account'}
        </div>
      </CardFooter>
    </Card>
  )

  return (
    <div className="gap-4 grid grid-cols-1 @xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs h-full">
      <Card className="@container/card h-full flex flex-col justify-between">
        <CardHeader>
          <CardDescription>Hours Logged</CardDescription>
          <CardTitle className="font-semibold tabular-nums text-2xl @[250px]/card:text-3xl">
            {totalHours.toFixed(1)} hrs
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm mt-auto w-full">
          <div className="flex gap-2 font-medium line-clamp-1">
            Accumulated work hours{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total active hours in last 30 days
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card h-full flex flex-col justify-between">
        <CardHeader>
          <CardDescription>Completed Shifts</CardDescription>
          <CardTitle className="font-semibold tabular-nums text-2xl @[250px]/card:text-3xl">
            {completedShiftsCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              Logged
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm mt-auto w-full">
          <div className="flex gap-2 font-medium line-clamp-1">
            Consistent submissions{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total logs generated this period
          </div>
        </CardFooter>
      </Card>
      {isManagerOrAdmin ? (
        <CreateCampaignWidget campaignsCount={campaignsCount} />
      ) : (
        campaignsCardContent
      )}
    </div>
  )
}
