import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export const metadata = {
  title: 'Settings | Mercury Marketing',
  description: 'Manage your account profile and security settings.',
}

export default async function SettingsPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <SettingsClient
      profile={profile}
      isAdmin={user.app_metadata?.role === 'admin'}
    />
  )
}
