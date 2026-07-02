import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPayRequestsClient from './AdminPayRequestsClient'

export const metadata = {
  title: 'Pay Requests | Mercury Marketing Admin',
  description: 'Review and manage pay change requests from team members.',
}

export default async function AdminPayPage() {
  const { data: { user } } = await getAuthUser()
  if (!user) redirect('/login')

  // Admin-only: managers cannot access this page
  const role = user.app_metadata?.role
  if (role !== 'admin') redirect('/dashboard')

  const supabase = await createServerClient()

  const { data: requests } = await supabase
    .from('pay_change_requests')
    .select('*, profiles!pay_change_requests_user_id_fkey(legal_full_name, email), pay_records(period_label, amount)')
    .order('created_at', { ascending: false })

  return <AdminPayRequestsClient requests={requests || []} />
}
