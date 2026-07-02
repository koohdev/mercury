import { createServerClient } from '@/lib/supabase/server'
import ScheduleManager from '@/components/schedule/ScheduleManager'

export default async function SchedulePage() {
  const supabase = await createServerClient()

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Fetch profiles for user mapping & dropdowns
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, legal_full_name, email, role')
    .eq('status', 'active')

  // 3. Fetch schedule entries
  const { data: entries } = await supabase
    .from('schedule_entries')
    .select('*')
    .order('start_time', { ascending: true })

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
