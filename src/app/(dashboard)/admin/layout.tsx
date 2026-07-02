import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await getAuthUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
