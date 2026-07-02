'use server'

import { getAuthedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clockIn() {
  const { supabase, user } = await getAuthedClient()

  // 1. Pre-check for existing active or on-break shift
  const { data: existingActive, error: checkError } = await supabase
    .from('shifts')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['active', 'on_break'])
    .limit(1)

  if (checkError) return { error: checkError.message }
  if (existingActive && existingActive.length > 0) {
    return { error: 'You already have an active shift or break in progress.' }
  }

  // 2. Insert new shift
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

  // 1. Verify shift ownership and status
  const { data: shift, error: shiftError } = await supabase
    .from('shifts')
    .select('id, status')
    .eq('id', shiftId)
    .eq('user_id', user.id)
    .single()

  if (shiftError || !shift) {
    return { error: 'Shift not found or access denied.' }
  }
  if (shift.status !== 'active') {
    return { error: 'Shift must be active to start a break.' }
  }

  // 2. Update shift status to 'on_break'
  const { error: updateError } = await supabase
    .from('shifts')
    .update({ status: 'on_break' })
    .eq('id', shiftId)

  if (updateError) return { error: updateError.message }

  // 3. Insert break
  const { error: breakError } = await supabase.from('breaks').insert({
    shift_id: shiftId,
  })

  if (breakError) return { error: breakError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function endBreak(shiftId: string) {
  const { supabase, user } = await getAuthedClient()

  // 1. Verify shift ownership and status
  const { data: shift, error: shiftError } = await supabase
    .from('shifts')
    .select('id, status')
    .eq('id', shiftId)
    .eq('user_id', user.id)
    .single()

  if (shiftError || !shift) {
    return { error: 'Shift not found or access denied.' }
  }
  if (shift.status !== 'on_break') {
    return { error: 'Shift is not currently on break.' }
  }

  // 2. Find active break
  const { data: activeBreaks, error: fetchError } = await supabase
    .from('breaks')
    .select('id')
    .eq('shift_id', shiftId)
    .is('end_time', null)

  if (fetchError) return { error: fetchError.message }
  if (!activeBreaks || activeBreaks.length === 0) return { error: 'No active break found.' }

  // 3. Update break end_time
  const { error: breakError } = await supabase
    .from('breaks')
    .update({ end_time: new Date().toISOString() })
    .eq('id', activeBreaks[0].id)

  if (breakError) return { error: breakError.message }

  // 4. Update shift status to 'active'
  const { error: updateError } = await supabase
    .from('shifts')
    .update({ status: 'active' })
    .eq('id', shiftId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function clockOut(shiftId: string, summary: string) {
  if (!summary || summary.trim().length === 0) {
    return { error: 'Shift summary is mandatory.' }
  }

  const { supabase, user } = await getAuthedClient()

  // 1. Verify shift ownership and status
  const { data: shift, error: shiftError } = await supabase
    .from('shifts')
    .select('id, status')
    .eq('id', shiftId)
    .eq('user_id', user.id)
    .single()

  if (shiftError || !shift) {
    return { error: 'Shift not found or access denied.' }
  }
  if (shift.status === 'completed') {
    return { error: 'Shift is already completed.' }
  }

  // 2. If currently on break, end the break first
  if (shift.status === 'on_break') {
    const { data: activeBreaks } = await supabase
      .from('breaks')
      .select('id')
      .eq('shift_id', shiftId)
      .is('end_time', null)

    if (activeBreaks && activeBreaks.length > 0) {
      const { error: breakError } = await supabase
        .from('breaks')
        .update({ end_time: new Date().toISOString() })
        .eq('id', activeBreaks[0].id)
      if (breakError) return { error: breakError.message }
    }
  }

  // 3. Complete shift
  const { error } = await supabase
    .from("shifts")
    .update({
      clock_out: new Date().toISOString(),
      status: "completed",
      summary: summary.trim(),
    })
    .eq("id", shiftId)

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
