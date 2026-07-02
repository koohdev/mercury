'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { timeToUTC } from '@/lib/utils/timezone'

interface DayAvailability {
  dayOfWeek: number
  isAvailable: boolean
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
}

export async function saveAvailability(
  items: DayAvailability[],
  userTimezone: string
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Prepare upsert rows
  const upsertRows = items.map((item) => {
    let utcStart: string | null = null
    let utcEnd: string | null = null

    if (item.isAvailable) {
      if (!item.startTime || !item.endTime) {
        throw new Error('Start and end times are required for available days.')
      }
      utcStart = timeToUTC(item.startTime, userTimezone)
      utcEnd = timeToUTC(item.endTime, userTimezone)
    }

    return {
      user_id: user.id,
      day_of_week: item.dayOfWeek,
      is_available: item.isAvailable,
      start_time: utcStart,
      end_time: utcEnd,
    }
  })

  // Upsert availability rows
  const { error } = await supabase
    .from('availability')
    .upsert(upsertRows as any, { onConflict: 'user_id,day_of_week' })

  if (error) {
    console.error('Error saving availability:', error)
    return { error: error.message }
  }

  revalidatePath('/availability')
  return { success: true }
}
