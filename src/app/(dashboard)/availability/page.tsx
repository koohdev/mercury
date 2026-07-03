import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AvailabilityClient from './AvailabilityClient'
import MembersAvailabilityClient from './MembersAvailabilityClient'
import { Availability } from '@/lib/types'

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
    const [membersRes, profileRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, legal_full_name, email, role, timezone')
        .in('role', ['moderator', 'manager'])
        .eq('status', 'active')
        .order('legal_full_name', { ascending: true })
        .range(0, 9),
      supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single(),
    ])

    // Get total count of active moderators/managers
    const { count: totalCountRes } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['moderator', 'manager'])
      .eq('status', 'active')

    const initialMembers = (membersRes.data || []).map((m) => ({
      ...m,
      role: m.role as 'admin' | 'moderator' | 'manager',
      timezone: m.timezone || 'Asia/Manila',
    }))
    const totalCount = totalCountRes || 0

    // Fetch availability only for these initial 10 members
    const memberIds = initialMembers.map((m) => m.id)
    let availabilityRes: { data: Availability[] | null } = { data: [] }
    if (memberIds.length > 0) {
      availabilityRes = await supabase
        .from('availability')
        .select('*')
        .in('user_id', memberIds)
    }

    return (
      <MembersAvailabilityClient
        initialMembers={initialMembers}
        initialAvailability={availabilityRes.data || []}
        initialTotalCount={totalCount}
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
