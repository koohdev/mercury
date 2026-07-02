'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function markAsRead(notificationId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/')
}

export async function markAllRead() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  revalidatePath('/')
}

export async function sendAnnouncement(userIds: string[], title: string, message: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') throw new Error('Unauthorized')

  const adminClient = createAdminClient()

  const rows = userIds.map((uid) => ({
    user_id: uid,
    title,
    message,
    type: 'admin_announcement',
  }))

  const { error } = await (adminClient as any).from('notifications').insert(rows)
  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function createSystemNotification(
  userId: string,
  title: string,
  message: string,
  type: 'schedule_change' | 'pay_update' | 'admin_announcement'
) {
  const adminClient = createAdminClient()

  await (adminClient as any).from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
  })
}
