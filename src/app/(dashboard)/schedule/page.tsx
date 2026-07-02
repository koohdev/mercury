import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import ScheduleManager from '@/components/schedule/ScheduleManager'

export default async function SchedulePage() {
  const { data: { user } } = await getAuthUser()
  if (!user) return null

  const supabase = await createServerClient()

  // Fetch profiles and schedule entries in parallel
  const [profilesRes, entriesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, legal_full_name, email, role')
      .eq('status', 'active'),
    supabase
      .from('schedule_entries')
      .select('*')
      .order('start_time', { ascending: true })
  ])

  const profiles = profilesRes.data
  const entries = entriesRes.data

  const role = user.app_metadata?.role || 'moderator'
  const isAdmin = role === 'admin'

  return (
    <div className="space-y-lg">
      <ScheduleManager
        currentUser={user}
        profiles={profiles || []}
        initialEntries={(entries || []) as any}
        isAdmin={isAdmin}
      />
    </div>
  )
}
