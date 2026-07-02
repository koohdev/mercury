import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PayClient from './PayClient'

export const metadata = {
  title: 'My Pay | Mercury Marketing',
  description: 'View your pay period details and request compensation changes.',
}

export default async function PayPage() {
  const { data: { user } } = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createServerClient()
  const isAdmin = user.app_metadata?.role === 'admin'

  // Fetch profile, pay records, change requests, and admin requests (if applicable) in parallel
  const [profileRes, payRecordsRes, changeRequestsRes, adminPendingRequestsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('legal_full_name, pay_rate')
      .eq('id', user.id)
      .single(),
    supabase
      .from('pay_records')
      .select('*')
      .eq('user_id', user.id)
      .order('period_start', { ascending: false }),
    supabase
      .from('pay_change_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    isAdmin
      ? (supabase
          .from('pay_change_requests')
          .select('*, profiles(legal_full_name, email), pay_records(period_label, amount)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }))
      : Promise.resolve({ data: null })
  ])

  const profile = profileRes.data
  const payRecords = payRecordsRes.data
  const changeRequests = changeRequestsRes.data
  const adminPendingRequests = adminPendingRequestsRes.data || null

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
