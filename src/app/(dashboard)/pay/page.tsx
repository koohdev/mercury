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

  // Fetch profile, pay records, and change requests in parallel
  const [profileRes, payRecordsRes, changeRequestsRes] = await Promise.all([
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
  ])

  const profile = profileRes.data
  const payRecords = payRecordsRes.data
  const changeRequests = changeRequestsRes.data

  return (
    <PayClient
      profile={profile}
      payRecords={payRecords || []}
      changeRequests={changeRequests || []}
    />
  )
}

