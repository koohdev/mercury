import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLogsClient from './AdminLogsClient'
import { getModeratorProfiles, getAllShifts } from '@/lib/actions/logs'

export const metadata = {
  title: 'All Moderator Logs | Mercury Marketing Admin',
  description: 'View, filter, and export shift logs for all content moderators.',
}

export default async function AdminLogsPage() {
  const supabase = await createServerClient()
  
  // Verify session and role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const role = user.app_metadata?.role || 'moderator'
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  // Get admin profile timezone
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single() as any

  const adminTimezone = profile?.timezone || 'America/New_York'

  // Fetch initial data
  const profiles = await getModeratorProfiles()
  const shifts = await getAllShifts()

  return (
    <AdminLogsClient
      initialShifts={shifts}
      moderators={profiles}
      adminTimezone={adminTimezone}
    />
  )
}
