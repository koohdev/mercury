'use server'

import { getAuthedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clockIn() {
  const { supabase, user } = await getAuthedClient()

  const { error } = await supabase.from('shifts').insert({
    user_id: user.id,
    status: 'active',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function startBreak(shiftId: string) {
  const { supabase, user } = await getAuthedClient()

  // 1. Update shift status to 'on_break'
  const { error: shiftError } = await supabase
    .from('shifts')
    .update({ status: 'on_break' })
    .eq('id', shiftId)
    .eq('user_id', user.id)

  if (shiftError) return { error: shiftError.message }

  // 2. Insert break
  const { error: breakError } = await supabase.from('breaks').insert({
    shift_id: shiftId,
  })

  if (breakError) return { error: breakError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function endBreak(shiftId: string) {
  const { supabase, user } = await getAuthedClient()

  // 1. Find active break
  const { data: activeBreaks, error: fetchError } = await supabase
    .from('breaks')
    .select('id')
    .eq('shift_id', shiftId)
    .is('end_time', null)

  if (fetchError) return { error: fetchError.message }
  if (!activeBreaks || activeBreaks.length === 0) return { error: 'No active break found' }

  // 2. Update break end_time
  const { error: breakError } = await supabase
    .from('breaks')
    .update({ end_time: new Date().toISOString() })
    .eq('id', activeBreaks[0].id)

  if (breakError) return { error: breakError.message }

  // 3. Update shift status to 'active'
  const { error: shiftError } = await supabase
    .from('shifts')
    .update({ status: 'active' })
    .eq('id', shiftId)
    .eq('user_id', user.id)

  if (shiftError) return { error: shiftError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function clockOut(shiftId: string, summary: string) {
  if (!summary || summary.trim().length === 0) {
    return { error: 'Shift summary is mandatory.' }
  }

  const { supabase, user } = await getAuthedClient()

  // 1. If currently on break, end the break first
  const { data: activeBreaks } = await supabase
    .from('breaks')
    .select('id')
    .eq('shift_id', shiftId)
    .is('end_time', null)

  if (activeBreaks && activeBreaks.length > 0) {
    await supabase
      .from('breaks')
      .update({ end_time: new Date().toISOString() })
      .eq('id', activeBreaks[0].id)
  }

  // 2. Complete shift
  const { error } = await supabase
    .from("shifts")
    .update({
      clock_out: new Date().toISOString(),
      status: "completed",
      summary: summary.trim(),
    })
    .eq("id", shiftId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateShiftSummary(shiftId: string, summary: string) {
  const { supabase, user } = await getAuthedClient()

  const { error } = await supabase
    .from("shifts")
    .update({
      summary: summary.trim(),
    })
    .eq("id", shiftId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}
