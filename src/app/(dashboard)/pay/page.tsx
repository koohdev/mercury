import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PayClient from './PayClient'

export const metadata = {
  title: 'My Pay | Mercury Marketing',
  description: 'View your pay period details and request compensation changes.',
}

export default async function PayPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isAdmin = user.app_metadata?.role === 'admin'

  // Fetch profile for pay_rate
  const { data: profile } = await supabase
    .from('profiles')
    .select('legal_full_name, pay_rate')
    .eq('id', user.id)
    .single() as any

  // Fetch pay records for this user (most recent first)
  const { data: payRecords } = await supabase
    .from('pay_records')
    .select('*')
    .eq('user_id', user.id)
    .order('period_start', { ascending: false })

  // Fetch pending change requests for this user
  const { data: changeRequests } = await supabase
    .from('pay_change_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // If admin: also fetch all pending requests across all users with profile info
  let adminPendingRequests = null
  if (isAdmin) {
    const { data } = await supabase
      .from('pay_change_requests')
      .select('*, profiles(legal_full_name, email), pay_records(period_label, amount)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }) as any

    adminPendingRequests = data || []
  }

  return (
    <PayClient
      profile={profile}
      payRecords={payRecords || []}
      changeRequests={changeRequests || []}
      adminPendingRequests={adminPendingRequests}
      isAdmin={isAdmin}
    />
  )
}
