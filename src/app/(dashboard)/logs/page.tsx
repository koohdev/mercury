import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogsClient from './LogsClient'
import { getShiftsForUser } from '@/lib/actions/logs'

export const metadata = {
  title: 'My Log History | Mercury Marketing',
  description: 'View your completed shifts, breaks, and shift recaps.',
}

export default async function MyLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  // Verify session
  const { data: { user } } = await getAuthUser()
  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams?.page || '1', 10)

  const supabase = await createServerClient()

  // Fetch timezone and shifts in parallel
  const [profileRes, shifts] = await Promise.all([
    supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single(),
    getShiftsForUser(user.id, page, 50)
  ])

  const userTimezone = profileRes.data?.timezone || 'Asia/Manila'

  return (
    <LogsClient
      initialShifts={shifts}
      userTimezone={userTimezone}
      page={page}
    />
  )
}
