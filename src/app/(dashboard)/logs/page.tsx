import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogsClient from './LogsClient'
import { getShiftsForUser } from '@/lib/actions/logs'

export const metadata = {
  title: 'My Log History | Mercury Marketing',
  description: 'View your completed shifts, breaks, and shift recaps.',
}

export default async function MyLogsPage() {
  // Verify session
  const { data: { user } } = await getAuthUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createServerClient()

  // Fetch timezone and shifts in parallel
  const [profileRes, shifts] = await Promise.all([
    supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single() as any,
    getShiftsForUser(user.id)
  ])

  const userTimezone = profileRes.data?.timezone || 'Asia/Manila'

  return (
    <LogsClient
      initialShifts={shifts}
      userTimezone={userTimezone}
    />
  )
}
