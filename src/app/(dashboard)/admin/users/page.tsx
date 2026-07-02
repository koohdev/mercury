import { createServerClient } from '@/lib/supabase/server'
import AdminUsersClient from './AdminUsersClient'

export const metadata = {
  title: 'User Management | Mercury Marketing Admin',
  description: 'Create, manage, and provision moderator accounts.',
}

export default async function AdminUsersPage() {
  const supabase = await createServerClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminUsersClient users={users || []} />
}
