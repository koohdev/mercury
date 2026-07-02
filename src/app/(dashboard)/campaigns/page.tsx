import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Briefcase, AlertCircle, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'My Campaigns | Mercury Marketing',
  description: 'View your assigned marketing campaigns.',
}

export default async function ModeratorCampaignsPage() {
  const { data: { user } } = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createServerClient()

  const { data: assignments, error } = await supabase
    .from('campaign_assignments')
    .select(`
      assigned_at,
      campaign:campaigns (
        id,
        name,
        description,
        status
      )
    `)
    .eq('moderator_id', user.id)

  const campaignList = ((assignments || []) as any[])
    .filter((a) => a.campaign)
    .map((a: any) => ({
      id: a.campaign.id,
      name: a.campaign.name,
      description: a.campaign.description,
      status: a.campaign.status,
      assignedAt: new Date(a.assigned_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }))

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="font-medium text-eyebrow text-ink-subtle tracking-eyebrow">
          Moderator Campaigns
        </h1>
        <h2 className="mt-xxs font-semibold text-headline text-ink">My Campaigns</h2>
        <p className="mt-xxs text-body-sm text-ink-muted">
          Active marketing campaigns you are assigned to support.
        </p>
      </div>

      {campaignList.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-surface-1 border border-hairline rounded-lg p-lg text-center space-y-sm min-h-[240px]">
          <Briefcase className="w-10 h-10 text-ink-tertiary" />
          <div>
            <h4 className="font-semibold text-body text-ink">No campaigns assigned yet</h4>
            <p className="mt-xxs text-body-sm text-ink-muted max-w-sm mx-auto">
              You are not currently assigned to any active campaigns. Contact your administrator if you believe this is an error.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {campaignList.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-surface-1 border border-hairline hover:border-primary/40 rounded-xl p-md flex flex-col justify-between transition-all duration-150 shadow-sm"
            >
              <div className="space-y-sm">
                <div className="flex justify-between items-start gap-xs">
                  <h3 className="font-semibold text-body text-ink truncate" title={campaign.name}>
                    {campaign.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-semibold shrink-0 ${
                      campaign.status === 'active'
                        ? 'bg-semantic-success/15 text-semantic-success border-semantic-success/20'
                        : campaign.status === 'completed'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-amber-950/20 text-amber-400 border-amber-900/30'
                    }`}
                  >
                    {campaign.status}
                  </Badge>
                </div>
                <p className="text-body-sm text-ink-muted line-clamp-3 min-h-[3.75rem]">
                  {campaign.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-md pt-sm border-t border-hairline flex items-center justify-between text-[11px] text-ink-subtle">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5" /> Assigned
                </span>
                <span className="font-mono">{campaign.assignedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
