import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AvailabilityClient from './AvailabilityClient'

export const metadata = {
  title: 'My Availability | Mercury Marketing',
  description: 'Manage your weekly availability hours.',
}

export default async function AvailabilityPage() {
  const supabase = await createServerClient()
  
  // Verify session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile to determine timezone
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single() as any

  const userTimezone = profile?.timezone || 'Asia/Manila'

  // Fetch current availability
  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .eq('user_id', user.id)

  return (
    <AvailabilityClient
      initialAvailability={availability || []}
      userTimezone={userTimezone}
    />
  )
}
