import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLogsClient from './AdminLogsClient'
import { getModeratorProfiles, getAllShifts } from '@/lib/actions/logs'

export const metadata = {
  title: 'All Moderator Logs | Mercury Marketing Admin',
  description: 'View, filter, and export shift logs for all content moderators.',
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  // Verify session and role
  const { data: { user } } = await getAuthUser()
  if (!user) {
    redirect('/login')
  }

  const role = user.app_metadata?.role || 'moderator'
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams?.page || '1', 10)

  const supabase = await createServerClient()

  // Fetch timezone, moderator profiles, and shifts in parallel
  const [profileRes, profiles, shifts] = await Promise.all([
    supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single(),
    getModeratorProfiles(),
    getAllShifts('all', page, 50)
  ])

  const adminTimezone = profileRes.data?.timezone || 'America/New_York'

  return (
    <AdminLogsClient
      initialShifts={shifts}
      moderators={profiles}
      adminTimezone={adminTimezone}
      page={page}
    />
  )
}
