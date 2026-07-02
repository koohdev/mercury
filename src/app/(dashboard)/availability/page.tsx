import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AvailabilityClient from './AvailabilityClient'

export const metadata = {
  title: 'My Availability | Mercury Marketing',
  description: 'Manage your weekly availability hours.',
}

export default async function AvailabilityPage() {
  // Verify session
  const { data: { user } } = await getAuthUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createServerClient()

  // Fetch timezone and availability in parallel
  const [profileRes, availabilityRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single() as any,
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
