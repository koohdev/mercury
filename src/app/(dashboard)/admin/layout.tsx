import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await getAuthUser()
  const role = user?.app_metadata?.role

  if (!user || (role !== 'admin' && role !== 'manager')) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
