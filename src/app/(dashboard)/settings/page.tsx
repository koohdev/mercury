import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export const metadata = {
  title: 'Settings | Mercury Marketing',
  description: 'Manage your account profile and security settings.',
}

export default async function SettingsPage() {
  const { data: { user } } = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <SettingsClient
      profile={profile}
      isAdmin={user.app_metadata?.role === 'admin' || user.app_metadata?.role === 'manager'}
    />
  )
}
