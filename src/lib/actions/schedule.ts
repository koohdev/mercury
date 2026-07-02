'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ScheduleSchema = z.object({
  userId: z.string().uuid(),
  startTime: z.string(),
  endTime: z.string(),
  label: z.string().min(1, 'Label is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
})

export async function createSchedule(rawInput: unknown) {
  const supabase = await createServerClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const validated = ScheduleSchema.parse(rawInput)

  const { error } = await supabase.from('schedule_entries').insert({
    user_id: validated.userId,
    start_time: validated.startTime,
    end_time: validated.endTime,
    label: validated.label,
    color: validated.color,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/schedule')
  return { success: true }
}

export async function updateSchedule(id: string, rawInput: unknown) {
  const supabase = await createServerClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const validated = ScheduleSchema.parse(rawInput)

  const { error } = await supabase
    .from('schedule_entries')
    .update({
      user_id: validated.userId,
      start_time: validated.startTime,
      end_time: validated.endTime,
      label: validated.label,
      color: validated.color,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/schedule')
  return { success: true }
}

export async function deleteSchedule(id: string) {
  const supabase = await createServerClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.from('schedule_entries').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/schedule')
  return { success: true }
}
