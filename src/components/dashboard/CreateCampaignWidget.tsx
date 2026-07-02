'use client'

import { Briefcase, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardDescription, CardTitle, CardFooter, CardAction } from "@/components/ui/card"

interface CreateCampaignWidgetProps {
  campaignsCount: number
}

export default function CreateCampaignWidget({ campaignsCount }: CreateCampaignWidgetProps) {
  return (
    <Card className="@container/card h-full flex flex-col justify-between">
      <div className="space-y-3">
        <CardHeader>
          <CardDescription>Campaign Panel</CardDescription>
          <CardTitle className="font-semibold text-2xl">
            Create & Manage
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-xxs bg-primary/10 text-primary px-sm py-xxs rounded-full text-[10px] font-semibold">
              <Briefcase className="w-3 h-3" />
              <span>{campaignsCount} Active</span>
            </div>
          </CardAction>
        </CardHeader>
        <div className="px-(--card-spacing) text-muted-foreground text-xs leading-relaxed">
          Quickly setup marketing campaigns, targets, and assignments.
        </div>
      </div>
      <CardFooter className="mt-auto w-full p-0 flex">
        <Link
          href="/admin/campaigns"
          className="w-full flex items-center justify-between p-(--card-spacing) text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer group"
        >
          <span>View campaigns details</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardFooter>
    </Card>
  )
}
