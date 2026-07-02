'use server'

import { createServerClient, getAuthUser } from '@/lib/supabase/server'

export async function getModeratorProfiles() {
  const { data: { user } } = await getAuthUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, legal_full_name, email')
    .order('legal_full_name', { ascending: true })

  if (error) {
    console.error('Error fetching moderator profiles:', error)
    return []
  }

  return data || []
}

export async function getShiftsForUser(userId?: string) {
  const { data: { user } } = await getAuthUser()
  if (!user) throw new Error('Unauthenticated')

  const isAdmin = user.app_metadata?.role === 'admin'
  const targetUserId = userId || user.id

  // If not admin and requesting another user's shifts, block it
  if (!isAdmin && targetUserId !== user.id) {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', targetUserId)
    .order('clock_in', { ascending: false })

  if (error) {
    console.error('Error fetching shifts for user:', error)
    return []
  }

  return data || []
}

export async function getAllShifts(userIdFilter?: string) {
  const { data: { user } } = await getAuthUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerClient()
  let query = supabase
    .from('shifts')
    .select('*, profiles(legal_full_name, email)')
    .order('clock_in', { ascending: false })

  if (userIdFilter && userIdFilter !== 'all') {
    query = query.eq('user_id', userIdFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching all shifts:', error)
    return []
  }

  return (data || []).map((shift: any) => ({
    ...shift,
    profiles: Array.isArray(shift.profiles) ? shift.profiles[0] : shift.profiles
  }))
}
