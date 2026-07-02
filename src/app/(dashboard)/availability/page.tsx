import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AvailabilityClient from './AvailabilityClient'
import MembersAvailabilityClient from './MembersAvailabilityClient'

export const metadata = {
  title: 'Availability | Mercury Marketing',
  description: 'Manage your weekly availability hours.',
}

export default async function AvailabilityPage() {
  // Verify session
  const { data: { user } } = await getAuthUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createServerClient()
  const role = user.app_metadata?.role || 'moderator'
  const isAdmin = role === 'admin'

  if (isAdmin) {
    // Admin: show Members Availability with dropdown
    const [membersRes, allAvailabilityRes, profileRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, legal_full_name, email, role, timezone')
        .in('role', ['moderator', 'manager'])
        .eq('status', 'active')
        .order('legal_full_name', { ascending: true }),
      supabase
        .from('availability')
        .select('*'),
      supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single(),
    ])

    return (
      <MembersAvailabilityClient
        members={membersRes.data || []}
        allAvailability={allAvailabilityRes.data || []}
        adminTimezone={profileRes.data?.timezone || 'Asia/Manila'}
      />
    )
  }

  // Non-admin: show own editable availability
  const [profileRes, availabilityRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single(),
    supabase
      .from('availability')
      .select('*')
      .eq('user_id', user.id)
  ])

  const profile = profileRes.data
  const availability = availabilityRes.data
  const userTimezone = profile?.timezone || 'Asia/Manila'

  return (
    <AvailabilityClient
      initialAvailability={availability || []}
      userTimezone={userTimezone}
    />
  )
}
