import { createServerClient as createSsrServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '../types/database.types'
import { cache } from 'react'

// ponytail: cache the client to reuse it across layout.tsx, page.tsx, and middleware/actions in a single request
export const createServerClient = cache(async () => {
  const cookieStore = await cookies()
  return createSsrServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ponytail: ignored in Server Components where headers are read-only
          }
        },
      },
    }
  )
})

export const getAuthUser = cache(async () => {
  const supabase = await createServerClient()
  return await supabase.auth.getUser()
})

// ponytail: cache profile fetch to prevent repeating database queries across layout and page renders
export const getAuthProfile = cache(async (userId: string) => {
  const supabase = await createServerClient()
  return await supabase
    .from('profiles')
    .select('status, role, legal_full_name, pay_rate')
    .eq('id', userId)
    .single()
})

// ponytail: shared helpers to kill the 25x repeated auth boilerplate in server actions
export async function getAuthedClient() {
  const supabase = await createServerClient()
  const { data: { user } } = await getAuthUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: profile } = await getAuthProfile(user.id)

  if (profile?.status === 'deactivated') {
    throw new Error('Unauthorized')
  }

  return { supabase, user }
}

export async function getAdminClient() {
  const { supabase, user } = await getAuthedClient()
  const { data: profile } = await getAuthProfile(user.id)
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  return { supabase, user }
}

export async function getAdminOrManagerClient() {
  const { supabase, user } = await getAuthedClient()
  const { data: profile } = await getAuthProfile(user.id)
  const role = profile?.role
  if (role !== 'admin' && role !== 'manager') throw new Error('Unauthorized')
  return { supabase, user }
}
