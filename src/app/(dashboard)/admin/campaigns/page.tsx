import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminCampaignsClient from './AdminCampaignsClient'

export const metadata = {
  title: 'Campaign Management | Mercury Marketing',
  description: 'Manage marketing campaigns and moderator assignments.',
}

export default async function AdminCampaignsPage() {
  const { data: { user } } = await getAuthUser()
  if (!user) redirect('/login')

  const role = user.app_metadata?.role || 'moderator'
  if (role !== 'admin' && role !== 'manager') {
    redirect('/dashboard')
  }

  const supabase = await createServerClient()

  // Fetch campaigns, assignments, and active moderators in parallel
  const [campaignsRes, assignmentsRes, moderatorsRes] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('campaign_assignments')
      .select('*'),
    supabase
      .from('profiles')
      .select('id, legal_full_name, email')
      .eq('role', 'moderator')
      .eq('status', 'active')
  ])

  return (
    <AdminCampaignsClient
      initialCampaigns={campaignsRes.data || []}
      initialAssignments={assignmentsRes.data || []}
      moderators={moderatorsRes.data || []}
    />
  )
}
