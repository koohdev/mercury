'use client'

import { Briefcase, Plus } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardDescription, CardTitle, CardFooter, CardAction } from "@/components/ui/card"

interface CreateCampaignWidgetProps {
  campaignsCount: number
}

export default function CreateCampaignWidget({ campaignsCount }: CreateCampaignWidgetProps) {
  return (
    <Card className="@container/card h-full flex flex-col justify-between">
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
      <CardFooter className="flex-col items-start gap-3 text-sm mt-auto w-full">
        <div className="text-muted-foreground text-xs leading-relaxed">
          Quickly setup marketing campaigns, targets, and assignments.
        </div>
        <Link
          href="/admin/campaigns?create=true"
          className="w-full bg-primary text-primary-foreground text-button py-2 rounded-md hover:bg-primary-hover focus:outline-2 focus:outline-primary-focus transition-colors duration-150 font-semibold flex items-center justify-center gap-xs cursor-pointer text-center text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Create Campaign
        </Link>
      </CardFooter>
    </Card>
  )
}
