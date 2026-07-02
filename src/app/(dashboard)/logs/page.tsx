import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogsClient from './LogsClient'
import { getShiftsForUser } from '@/lib/actions/logs'

export const metadata = {
  title: 'My Log History | Mercury Marketing',
  description: 'View your completed shifts, breaks, and shift recaps.',
}

export default async function MyLogsPage() {
  const supabase = await createServerClient()
  
  // Verify session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile to check timezone
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single() as any

  const userTimezone = profile?.timezone || 'Asia/Manila'

  // Fetch shifts for the logged-in user
  const shifts = await getShiftsForUser(user.id)

  return (
    <LogsClient
      initialShifts={shifts}
      userTimezone={userTimezone}
    />
  )
}
